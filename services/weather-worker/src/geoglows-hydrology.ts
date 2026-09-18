import {
  HydrologyDischargeRecordSchema,
  HydrologyReturnPeriodRecordSchema,
  RiverReachResolutionSchema,
  type HydrologyDischargeStatistic,
  type ProviderCapability,
} from '@connuoc/shared-types';

import type { ProviderContext, ProviderProbeResult } from './contracts.js';
import type {
  HydrologyAdapterRequest,
  HydrologyProviderAdapter,
  HydrologyReachLookupRequest,
  HydrologyReturnPeriodRequest,
  NormalizedHydrologyBundle,
  NormalizedHydrologyReturnPeriodBundle,
} from './hydrology-contracts.js';
import type { WeatherHttpClient } from './weather-contracts.js';

export interface GeoglowsHydrologyAdapterOptions {
  readonly context: ProviderContext;
  readonly httpClient: WeatherHttpClient;
  readonly baseUrl: string;
  readonly sourceId: string;
  readonly attributionText: string;
  readonly attributionUrl: string | null;
  readonly productVersion: string | null;
  readonly now?: () => Date;
}

interface GeoglowsMetadata {
  readonly riverId: string;
  readonly generatedAt: string | null;
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(message);
  }
  return value as Record<string, unknown>;
}

function requiredArray(
  record: Record<string, unknown>,
  key: string,
): readonly unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) {
    throw new TypeError(`GEOGLOWS payload is missing array ${key}`);
  }
  return value;
}

function requiredNonNegativeNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`GEOGLOWS ${field} must be a non-negative number`);
  }
  return value;
}

function compactInstant(value: Date): string {
  const instant = value.toISOString();
  return instant.endsWith('.000Z') ? instant.replace('.000Z', 'Z') : instant;
}

function normalizeInstant(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`GEOGLOWS ${field} must be a timestamp`);
  }
  const millis = Date.parse(value);
  if (!Number.isFinite(millis)) {
    throw new TypeError(`GEOGLOWS ${field} must be a valid timestamp`);
  }
  return compactInstant(new Date(millis));
}

function optionalInstant(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  return normalizeInstant(value, 'generated timestamp');
}

function assertCoordinate(request: HydrologyReachLookupRequest): void {
  if (
    !Number.isFinite(request.latitude) ||
    request.latitude < -90 ||
    request.latitude > 90 ||
    !Number.isFinite(request.longitude) ||
    request.longitude < -180 ||
    request.longitude > 180
  ) {
    throw new RangeError('GEOGLOWS reach lookup coordinate is invalid');
  }
}

function assertProviderReachId(value: string): string {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new RangeError('GEOGLOWS providerReachId must be a positive integer identifier');
  }
  if (BigInt(normalized) <= 0n) {
    throw new RangeError('GEOGLOWS providerReachId must be a positive integer identifier');
  }
  return normalized;
}

function assertRiverReachId(value: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new RangeError('riverReachId must not be empty');
  }
  return normalized;
}

function metadata(root: Record<string, unknown>, expectedRiverId: string): GeoglowsMetadata {
  const raw = asRecord(root.metadata, 'GEOGLOWS payload is missing metadata');
  const riverValue = raw.river_id;
  const riverId =
    typeof riverValue === 'number' && Number.isSafeInteger(riverValue)
      ? String(riverValue)
      : typeof riverValue === 'string'
        ? riverValue
        : expectedRiverId;

  if (riverId !== expectedRiverId) {
    throw new TypeError('GEOGLOWS response river_id does not match the requested reach');
  }

  const units =
    raw.units === undefined
      ? null
      : asRecord(raw.units, 'GEOGLOWS metadata units must be an object');
  if (units !== null) {
    const short = units.short;
    if (
      typeof short === 'string' &&
      short.toLowerCase() !== 'cms' &&
      short.toLowerCase() !== 'm3/s'
    ) {
      throw new TypeError('GEOGLOWS response unit is not discharge in cubic metres per second');
    }
  }

  return {
    riverId,
    generatedAt: optionalInstant(raw.gen_date),
  };
}

function standaloneMetadata(
  root: Record<string, unknown>,
  expectedRiverId: string,
): GeoglowsMetadata {
  const riverValue = root.river_id;
  const riverId =
    typeof riverValue === 'number' && Number.isSafeInteger(riverValue)
      ? String(riverValue)
      : typeof riverValue === 'string'
        ? riverValue
        : expectedRiverId;

  if (riverId !== expectedRiverId) {
    throw new TypeError('GEOGLOWS response river_id does not match the requested reach');
  }

  const units =
    root.units === undefined
      ? null
      : asRecord(root.units, 'GEOGLOWS return-period units must be an object');
  if (units !== null) {
    const short = units.short;
    if (
      typeof short === 'string' &&
      short.toLowerCase() !== 'cms' &&
      short.toLowerCase() !== 'm3/s'
    ) {
      throw new TypeError('GEOGLOWS return-period unit is not discharge');
    }
  }

  return {
    riverId,
    generatedAt: optionalInstant(root.gen_date),
  };
}

function equalLength(
  times: readonly unknown[],
  values: readonly unknown[],
  field: string,
): void {
  if (times.length !== values.length) {
    throw new TypeError(
      `GEOGLOWS ${field} length does not match datetime length`,
    );
  }
}

function dateQuery(instant: string): string {
  return instant.slice(0, 10).replaceAll('-', '');
}

function dateFromInstant(instant: string, field: string): string {
  const normalized = normalizeInstant(instant, field);
  return dateQuery(normalized);
}

function forecastDays(value: number | undefined): number {
  const days = value ?? 15;
  if (!Number.isInteger(days) || days < 1 || days > 15) {
    throw new RangeError('GEOGLOWS forecast days must be between 1 and 15');
  }
  return days;
}

function mappingMetadata() {
  return {
    state: 'MAPPED' as const,
    method: 'PROVIDER_ID' as const,
    confidence: 1,
    distanceKm: null,
  };
}

const STATISTIC_COLUMNS: ReadonlyArray<{
  readonly column: string;
  readonly statistic: HydrologyDischargeStatistic;
}> = [
  { column: 'flow_max', statistic: 'MAX' },
  { column: 'flow_75p', statistic: 'P75' },
  { column: 'flow_avg', statistic: 'MEAN' },
  { column: 'flow_med', statistic: 'MEDIAN' },
  { column: 'flow_25p', statistic: 'P25' },
  { column: 'flow_min', statistic: 'MIN' },
];

export class GeoglowsHydrologyAdapter implements HydrologyProviderAdapter {
  readonly providerType = 'geoglows';
  readonly context: ProviderContext;

  private readonly capabilities: ReadonlySet<ProviderCapability>;
  private readonly httpClient: WeatherHttpClient;
  private readonly baseUrl: URL;
  private readonly sourceId: string;
  private readonly attributionText: string;
  private readonly attributionUrl: string | null;
  private readonly productVersion: string | null;
  private readonly now: () => Date;

  constructor(options: GeoglowsHydrologyAdapterOptions) {
    this.context = {
      ...options.context,
      capabilities: [...options.context.capabilities],
    };
    this.capabilities = new Set(options.context.capabilities);
    this.httpClient = options.httpClient;
    this.baseUrl = new URL(options.baseUrl);
    this.sourceId = options.sourceId;
    this.attributionText = options.attributionText;
    this.attributionUrl = options.attributionUrl;
    this.productVersion = options.productVersion;
    this.now = options.now ?? (() => new Date());
  }

  supports(capability: ProviderCapability): boolean {
    return this.capabilities.has(capability);
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderProbeResult> {
    signal?.throwIfAborted();
    return {
      state: 'UNKNOWN',
      latencyMs: 0,
      providerId: this.context.providerId,
      providerKey: this.context.providerKey,
      details: { liveProbe: false, adapter: 'geoglows-v2' },
    };
  }

  async resolveReach(
    request: HydrologyReachLookupRequest,
    signal?: AbortSignal,
  ) {
    signal?.throwIfAborted();
    assertCoordinate(request);

    const url = this.endpoint('v2/getriverid');
    url.searchParams.set('lat', String(request.latitude));
    url.searchParams.set('lon', String(request.longitude));
    url.searchParams.set('format', 'json');

    const root = asRecord(
      await this.httpClient.getJson(url, signal),
      'GEOGLOWS reach lookup payload must be an object',
    );
    const value = root.river_id;
    const providerReachId =
      typeof value === 'number' && Number.isSafeInteger(value)
        ? String(value)
        : typeof value === 'string'
          ? value.trim()
          : '';
    assertProviderReachId(providerReachId);

    // getriverid returns only the nearest provider reach and no distance. It proves
    // provider identity selection, but not an exact local named-river mapping.
    return RiverReachResolutionSchema.parse({
      state: 'MAPPED',
      providerKey: this.context.providerKey,
      selectedProviderReachId: providerReachId,
      candidates: [
        {
          providerReachId,
          distanceKm: null,
          confidence: 0.5,
        },
      ],
    });
  }

  async fetchHydrology(
    request: HydrologyAdapterRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyBundle> {
    signal?.throwIfAborted();
    if (!this.supports(request.capability)) {
      throw new RangeError(
        `GEOGLOWS capability ${request.capability} is disabled`,
      );
    }

    const riverReachId = assertRiverReachId(request.riverReachId);
    const providerReachId = assertProviderReachId(request.providerReachId);

    if (request.capability === 'hydrology.retrospective') {
      return this.fetchRetrospective(
        request,
        riverReachId,
        providerReachId,
        signal,
      );
    }

    const modelRunAt = this.requireModelRun(request.modelRunAtUtc);
    const days = forecastDays(request.days);

    if (request.capability === 'hydrology.dischargeForecast') {
      return this.fetchForecastMean(
        riverReachId,
        providerReachId,
        modelRunAt,
        days,
        signal,
      );
    }

    return this.fetchForecastEnsemble(
      riverReachId,
      providerReachId,
      modelRunAt,
      days,
      signal,
    );
  }

  async fetchReturnPeriods(
    request: HydrologyReturnPeriodRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyReturnPeriodBundle> {
    signal?.throwIfAborted();
    if (!this.supports('hydrology.returnPeriods')) {
      throw new RangeError('GEOGLOWS return-period capability is disabled');
    }

    const riverReachId = assertRiverReachId(request.riverReachId);
    const providerReachId = assertProviderReachId(request.providerReachId);
    const url = this.endpoint(
      `v2/returnperiods/${encodeURIComponent(providerReachId)}`,
    );
    url.searchParams.set('format', 'json');

    const root = asRecord(
      await this.httpClient.getJson(url, signal),
      'GEOGLOWS return-period payload must be an object',
    );
    const meta = standaloneMetadata(root, providerReachId);
    const values = asRecord(
      root.return_periods,
      'GEOGLOWS return-period payload is missing return_periods',
    );

    const records = Object.entries(values)
      .flatMap(([key, rawValue]) => {
        if (!/^\d+$/.test(key)) return [];
        const returnPeriodYears = Number(key);
        if (!Number.isInteger(returnPeriodYears) || returnPeriodYears < 2) {
          return [];
        }
        const dischargeCms = requiredNonNegativeNumber(
          rawValue,
          `return period ${key}`,
        );
        return [
          HydrologyReturnPeriodRecordSchema.parse({
            id: `hydro:geoglows:${providerReachId}:return-period:${returnPeriodYears}`,
            riverReachId,
            providerReachId,
            mapping: mappingMetadata(),
            returnPeriodYears,
            dischargeCms,
            unit: 'm3/s',
            retrospectivePeriodStart: null,
            retrospectivePeriodEnd: null,
            source: this.source(
              'geoglows-v2-returnperiods',
              meta.generatedAt ?? compactInstant(this.now()),
            ),
          }),
        ];
      })
      .sort((left, right) => left.returnPeriodYears - right.returnPeriodYears);

    if (records.length === 0) {
      throw new TypeError('GEOGLOWS return-period payload contains no usable thresholds');
    }

    return {
      capability: 'hydrology.returnPeriods',
      records,
    };
  }

  private async fetchForecastMean(
    riverReachId: string,
    providerReachId: string,
    modelRunAt: string,
    days: number,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyBundle> {
    const root = await this.forecastJson(
      'forecaststats',
      providerReachId,
      modelRunAt,
      signal,
    );
    const meta = metadata(root, providerReachId);
    const times = requiredArray(root, 'datetime');
    const values = requiredArray(root, 'flow_avg');
    equalLength(times, values, 'flow_avg');

    const records = times.flatMap((time, index) => {
      const validAt = normalizeInstant(time, 'forecast datetime');
      if (!this.inForecastWindow(modelRunAt, validAt, days)) return [];
      const leadSeconds = this.leadSeconds(modelRunAt, validAt);
      const dischargeCms = requiredNonNegativeNumber(
        values[index],
        'flow_avg',
      );

      return [
        HydrologyDischargeRecordSchema.parse({
          id: `hydro:geoglows:${providerReachId}:${validAt}:mean`,
          productKind: 'FORECAST_MEAN',
          riverReachId,
          providerReachId,
          mapping: mappingMetadata(),
          validAt,
          modelRunAt,
          leadSeconds,
          dischargeCms,
          unit: 'm3/s',
          ensembleMember: null,
          statistic: 'MEAN',
          quality: { state: 'ESTIMATED', flags: ['MODEL_FORECAST'] },
          source: this.source(
            'geoglows-v2-forecaststats',
            meta.generatedAt ?? compactInstant(this.now()),
          ),
        }),
      ];
    });

    if (records.length === 0) {
      throw new TypeError('GEOGLOWS forecast payload contains no usable mean points');
    }

    return {
      capability: 'hydrology.dischargeForecast',
      records,
    };
  }

  private async fetchForecastEnsemble(
    riverReachId: string,
    providerReachId: string,
    modelRunAt: string,
    days: number,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyBundle> {
    const [statsRoot, ensembleRoot] = await Promise.all([
      this.forecastJson('forecaststats', providerReachId, modelRunAt, signal),
      this.forecastJson('forecastensemble', providerReachId, modelRunAt, signal),
    ]);
    const statsMeta = metadata(statsRoot, providerReachId);
    const ensembleMeta = metadata(ensembleRoot, providerReachId);
    const statsTimes = requiredArray(statsRoot, 'datetime');
    const ensembleTimes = requiredArray(ensembleRoot, 'datetime');

    const records = [];

    for (const descriptor of STATISTIC_COLUMNS) {
      if (!(descriptor.column in statsRoot)) continue;
      const values = requiredArray(statsRoot, descriptor.column);
      equalLength(statsTimes, values, descriptor.column);

      for (const [index, time] of statsTimes.entries()) {
        const validAt = normalizeInstant(time, 'forecast statistics datetime');
        if (!this.inForecastWindow(modelRunAt, validAt, days)) continue;

        records.push(
          HydrologyDischargeRecordSchema.parse({
            id: `hydro:geoglows:${providerReachId}:${validAt}:stat:${descriptor.statistic.toLowerCase()}`,
            productKind: 'FORECAST_STATISTIC',
            riverReachId,
            providerReachId,
            mapping: mappingMetadata(),
            validAt,
            modelRunAt,
            leadSeconds: this.leadSeconds(modelRunAt, validAt),
            dischargeCms: requiredNonNegativeNumber(
              values[index],
              descriptor.column,
            ),
            unit: 'm3/s',
            ensembleMember: null,
            statistic: descriptor.statistic,
            quality: {
              state: 'ESTIMATED',
              flags: ['MODEL_FORECAST', 'ENSEMBLE_STATISTIC'],
            },
            source: this.source(
              'geoglows-v2-forecaststats',
              statsMeta.generatedAt ?? compactInstant(this.now()),
            ),
          }),
        );
      }
    }

    for (const [column, rawValues] of Object.entries(ensembleRoot)) {
      const matched = /^ensemble_(\d+)$/.exec(column);
      if (!matched) continue;
      const member = Number(matched[1]);
      if (!Number.isInteger(member) || member < 0) continue;
      if (!Array.isArray(rawValues)) {
        throw new TypeError(`GEOGLOWS ${column} must be an array`);
      }
      equalLength(ensembleTimes, rawValues, column);

      for (const [index, time] of ensembleTimes.entries()) {
        const validAt = normalizeInstant(time, 'forecast ensemble datetime');
        if (!this.inForecastWindow(modelRunAt, validAt, days)) continue;

        records.push(
          HydrologyDischargeRecordSchema.parse({
            id: `hydro:geoglows:${providerReachId}:${validAt}:member-${member}`,
            productKind: 'FORECAST_ENSEMBLE_MEMBER',
            riverReachId,
            providerReachId,
            mapping: mappingMetadata(),
            validAt,
            modelRunAt,
            leadSeconds: this.leadSeconds(modelRunAt, validAt),
            dischargeCms: requiredNonNegativeNumber(
              rawValues[index],
              column,
            ),
            unit: 'm3/s',
            ensembleMember: member,
            statistic: null,
            quality: {
              state: 'ESTIMATED',
              flags: ['MODEL_FORECAST', 'ENSEMBLE_MEMBER'],
            },
            source: this.source(
              'geoglows-v2-forecastensemble',
              ensembleMeta.generatedAt ?? compactInstant(this.now()),
            ),
          }),
        );
      }
    }

    if (records.length === 0) {
      throw new TypeError('GEOGLOWS ensemble payload contains no usable records');
    }

    return {
      capability: 'hydrology.dischargeEnsemble',
      records,
    };
  }

  private async fetchRetrospective(
    request: HydrologyAdapterRequest,
    riverReachId: string,
    providerReachId: string,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyBundle> {
    if (request.startUtc === undefined || request.endUtc === undefined) {
      throw new RangeError('GEOGLOWS retrospective requires startUtc and endUtc');
    }
    const startUtc = normalizeInstant(request.startUtc, 'retrospective startUtc');
    const endUtc = normalizeInstant(request.endUtc, 'retrospective endUtc');
    if (Date.parse(endUtc) <= Date.parse(startUtc)) {
      throw new RangeError('GEOGLOWS retrospective endUtc must be later than startUtc');
    }

    const url = this.endpoint(
      `v2/retrospectivedaily/${encodeURIComponent(providerReachId)}`,
    );
    url.searchParams.set('format', 'json');
    url.searchParams.set('start_date', dateFromInstant(startUtc, 'startUtc'));
    url.searchParams.set('end_date', dateFromInstant(endUtc, 'endUtc'));

    const root = asRecord(
      await this.httpClient.getJson(url, signal),
      'GEOGLOWS retrospective payload must be an object',
    );
    const meta = metadata(root, providerReachId);
    const times = requiredArray(root, 'datetime');
    const values = requiredArray(root, providerReachId);
    equalLength(times, values, providerReachId);

    const records = times.flatMap((time, index) => {
      const validAt = normalizeInstant(time, 'retrospective datetime');
      const validMs = Date.parse(validAt);
      if (validMs < Date.parse(startUtc) || validMs > Date.parse(endUtc)) return [];

      return [
        HydrologyDischargeRecordSchema.parse({
          id: `hydro:geoglows:${providerReachId}:${validAt}:retrospective`,
          productKind: 'RETROSPECTIVE_SIMULATION',
          riverReachId,
          providerReachId,
          mapping: mappingMetadata(),
          validAt,
          modelRunAt: null,
          leadSeconds: null,
          dischargeCms: requiredNonNegativeNumber(
            values[index],
            'retrospective discharge',
          ),
          unit: 'm3/s',
          ensembleMember: null,
          statistic: null,
          quality: {
            state: 'SIMULATED',
            flags: ['RETROSPECTIVE', 'MODEL_SIMULATION'],
          },
          source: this.source(
            'geoglows-v2-retrospectivedaily',
            meta.generatedAt ?? compactInstant(this.now()),
          ),
        }),
      ];
    });

    if (records.length === 0) {
      throw new TypeError('GEOGLOWS retrospective payload contains no usable records');
    }

    return {
      capability: 'hydrology.retrospective',
      records,
    };
  }

  private async forecastJson(
    product: 'forecaststats' | 'forecastensemble',
    providerReachId: string,
    modelRunAt: string,
    signal?: AbortSignal,
  ): Promise<Record<string, unknown>> {
    const url = this.endpoint(
      `v2/${product}/${encodeURIComponent(providerReachId)}`,
    );
    url.searchParams.set('format', 'json');
    url.searchParams.set('date', dateQuery(modelRunAt));

    return asRecord(
      await this.httpClient.getJson(url, signal),
      `GEOGLOWS ${product} payload must be an object`,
    );
  }

  private requireModelRun(value: string | undefined): string {
    if (value === undefined) {
      throw new RangeError('GEOGLOWS forecast requires modelRunAtUtc');
    }
    return normalizeInstant(value, 'modelRunAtUtc');
  }

  private leadSeconds(modelRunAt: string, validAt: string): number {
    const seconds = (Date.parse(validAt) - Date.parse(modelRunAt)) / 1000;
    if (!Number.isInteger(seconds) || seconds < 0) {
      throw new TypeError('GEOGLOWS forecast valid time precedes the model run');
    }
    return seconds;
  }

  private inForecastWindow(
    modelRunAt: string,
    validAt: string,
    days: number,
  ): boolean {
    const lead = this.leadSeconds(modelRunAt, validAt);
    return lead <= days * 86_400;
  }

  private endpoint(path: string): URL {
    return new URL(path, this.baseUrl);
  }

  private source(productId: string, fetchedAt: string) {
    return {
      sourceId: this.sourceId,
      providerConfigId: this.context.providerId,
      productId,
      productVersion: this.productVersion,
      fetchedAt,
      attributionText: this.attributionText,
      attributionUrl: this.attributionUrl,
    };
  }
}
