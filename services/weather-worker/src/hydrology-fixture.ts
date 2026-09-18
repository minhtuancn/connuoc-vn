import {
  HydrologyDischargeRecordSchema,
  HydrologyReturnPeriodRecordSchema,
  RiverReachResolutionSchema,
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

export interface FixtureHydrologyAdapterOptions {
  readonly context: ProviderContext;
  readonly sourceId?: string;
  readonly attributionText?: string;
  readonly attributionUrl?: string | null;
  readonly now?: () => Date;
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
    throw new RangeError('Fixture hydrology lookup coordinate is invalid');
  }
}

function compactInstant(value: Date): string {
  return value.toISOString().replace('.000Z', 'Z');
}

function assertReach(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new RangeError(`${field} must not be empty`);
  }
}

export class FixtureHydrologyAdapter implements HydrologyProviderAdapter {
  readonly providerType = 'fixture';
  readonly context: ProviderContext;

  private readonly capabilities: ReadonlySet<ProviderCapability>;
  private readonly sourceId: string;
  private readonly attributionText: string;
  private readonly attributionUrl: string | null;
  private readonly now: () => Date;

  constructor(options: FixtureHydrologyAdapterOptions) {
    this.context = {
      ...options.context,
      capabilities: [...options.context.capabilities],
    };
    this.capabilities = new Set(options.context.capabilities);
    this.sourceId = options.sourceId ?? 'synthetic-hydrology-fixture';
    this.attributionText =
      options.attributionText ?? 'Con Nước synthetic hydrology fixture';
    this.attributionUrl = options.attributionUrl ?? null;
    this.now = options.now ?? (() => new Date('2026-09-18T00:00:00Z'));
  }

  supports(capability: ProviderCapability): boolean {
    return this.capabilities.has(capability);
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderProbeResult> {
    signal?.throwIfAborted();
    return {
      state: 'HEALTHY',
      latencyMs: 0,
      providerId: this.context.providerId,
      providerKey: this.context.providerKey,
      details: { liveProbe: false, adapter: 'hydrology-fixture' },
    };
  }

  async resolveReach(
    request: HydrologyReachLookupRequest,
    signal?: AbortSignal,
  ) {
    signal?.throwIfAborted();
    assertCoordinate(request);

    if (
      Math.abs(request.latitude - 19.5) <= 0.05 &&
      Math.abs(request.longitude - 105.5) <= 0.05
    ) {
      return RiverReachResolutionSchema.parse({
        state: 'MAPPED',
        providerKey: this.context.providerKey,
        selectedProviderReachId: 'fixture-reach-001',
        candidates: [
          {
            providerReachId: 'fixture-reach-001',
            distanceKm: 0.35,
            confidence: 0.98,
          },
        ],
      });
    }

    if (
      Math.abs(request.latitude - 19.7) <= 0.05 &&
      Math.abs(request.longitude - 105.7) <= 0.05
    ) {
      return RiverReachResolutionSchema.parse({
        state: 'AMBIGUOUS',
        providerKey: this.context.providerKey,
        selectedProviderReachId: null,
        candidates: [
          {
            providerReachId: 'fixture-reach-002',
            distanceKm: 0.42,
            confidence: 0.64,
          },
          {
            providerReachId: 'fixture-reach-003',
            distanceKm: 0.48,
            confidence: 0.62,
          },
        ],
      });
    }

    return RiverReachResolutionSchema.parse({
      state: 'UNMAPPED',
      providerKey: this.context.providerKey,
      selectedProviderReachId: null,
      candidates: [],
    });
  }

  async fetchHydrology(
    request: HydrologyAdapterRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyBundle> {
    signal?.throwIfAborted();
    if (!this.supports(request.capability)) {
      throw new RangeError(
        `Fixture hydrology capability ${request.capability} is disabled`,
      );
    }
    assertReach(request.riverReachId, 'riverReachId');
    assertReach(request.providerReachId, 'providerReachId');

    if (request.capability === 'hydrology.retrospective') {
      return this.retrospective(request);
    }

    const days = request.days ?? 7;
    if (!Number.isInteger(days) || days < 1 || days > 30) {
      throw new RangeError('Fixture hydrology forecast days must be between 1 and 30');
    }

    return request.capability === 'hydrology.dischargeForecast'
      ? this.forecast(request, days)
      : this.ensemble(request, days);
  }

  async fetchReturnPeriods(
    request: HydrologyReturnPeriodRequest,
    signal?: AbortSignal,
  ): Promise<NormalizedHydrologyReturnPeriodBundle> {
    signal?.throwIfAborted();
    if (!this.supports('hydrology.returnPeriods')) {
      throw new RangeError('Fixture hydrology return-period capability is disabled');
    }
    assertReach(request.riverReachId, 'riverReachId');
    assertReach(request.providerReachId, 'providerReachId');

    const years = [2, 5, 10, 20, 50, 100] as const;
    return {
      capability: 'hydrology.returnPeriods',
      records: years.map((returnPeriodYears, index) =>
        HydrologyReturnPeriodRecordSchema.parse({
          id: `hydro:fixture:return:${request.providerReachId}:${returnPeriodYears}`,
          riverReachId: request.riverReachId,
          providerReachId: request.providerReachId,
          mapping: this.mapping(),
          returnPeriodYears,
          dischargeCms: 700 + index * 350,
          unit: 'm3/s',
          retrospectivePeriodStart: '1980-01-01T00:00:00Z',
          retrospectivePeriodEnd: '2025-12-31T00:00:00Z',
          source: this.source('fixture-return-periods', null),
        }),
      ),
    };
  }

  private forecast(
    request: HydrologyAdapterRequest,
    days: number,
  ): NormalizedHydrologyBundle {
    const modelRun = this.now();
    const points = days * 2;
    return {
      capability: 'hydrology.dischargeForecast',
      records: Array.from({ length: points }, (_, index) => {
        const leadSeconds = (index + 1) * 21_600;
        const validAt = new Date(modelRun.getTime() + leadSeconds * 1000);
        return HydrologyDischargeRecordSchema.parse({
          id: `hydro:fixture:${request.providerReachId}:${compactInstant(validAt)}:mean`,
          productKind: 'FORECAST_MEAN',
          riverReachId: request.riverReachId,
          providerReachId: request.providerReachId,
          mapping: this.mapping(),
          validAt: compactInstant(validAt),
          modelRunAt: compactInstant(modelRun),
          leadSeconds,
          dischargeCms: Number((480 + index * 18.5).toFixed(3)),
          unit: 'm3/s',
          ensembleMember: null,
          statistic: 'MEAN',
          quality: { state: 'ESTIMATED', flags: ['FIXTURE', 'MODEL_FORECAST'] },
          source: this.source('fixture-discharge-forecast', compactInstant(modelRun)),
        });
      }),
    };
  }

  private ensemble(
    request: HydrologyAdapterRequest,
    days: number,
  ): NormalizedHydrologyBundle {
    const modelRun = this.now();
    const records = [];
    for (let index = 0; index < days * 2; index += 1) {
      const leadSeconds = (index + 1) * 21_600;
      const validAt = compactInstant(
        new Date(modelRun.getTime() + leadSeconds * 1000),
      );

      records.push(
        HydrologyDischargeRecordSchema.parse({
          id: `hydro:fixture:${request.providerReachId}:${validAt}:p75`,
          productKind: 'FORECAST_STATISTIC',
          riverReachId: request.riverReachId,
          providerReachId: request.providerReachId,
          mapping: this.mapping(),
          validAt,
          modelRunAt: compactInstant(modelRun),
          leadSeconds,
          dischargeCms: Number((540 + index * 20).toFixed(3)),
          unit: 'm3/s',
          ensembleMember: null,
          statistic: 'P75',
          quality: { state: 'ESTIMATED', flags: ['FIXTURE', 'ENSEMBLE_STATISTIC'] },
          source: this.source('fixture-discharge-ensemble', compactInstant(modelRun)),
        }),
      );

      for (const member of [1, 2]) {
        records.push(
          HydrologyDischargeRecordSchema.parse({
            id: `hydro:fixture:${request.providerReachId}:${validAt}:member-${member}`,
            productKind: 'FORECAST_ENSEMBLE_MEMBER',
            riverReachId: request.riverReachId,
            providerReachId: request.providerReachId,
            mapping: this.mapping(),
            validAt,
            modelRunAt: compactInstant(modelRun),
            leadSeconds,
            dischargeCms: Number((500 + index * 18 + member * 12).toFixed(3)),
            unit: 'm3/s',
            ensembleMember: member,
            statistic: null,
            quality: { state: 'ESTIMATED', flags: ['FIXTURE', 'ENSEMBLE_MEMBER'] },
            source: this.source('fixture-discharge-ensemble', compactInstant(modelRun)),
          }),
        );
      }
    }

    return {
      capability: 'hydrology.dischargeEnsemble',
      records,
    };
  }

  private retrospective(
    request: HydrologyAdapterRequest,
  ): NormalizedHydrologyBundle {
    if (request.startUtc === undefined || request.endUtc === undefined) {
      throw new RangeError('Fixture hydrology retrospective requires startUtc and endUtc');
    }
    const startMs = Date.parse(request.startUtc);
    const endMs = Date.parse(request.endUtc);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      throw new RangeError('Fixture hydrology retrospective interval is invalid');
    }

    const records = [];
    for (let time = startMs; time < endMs; time += 86_400_000) {
      const validAt = compactInstant(new Date(time));
      records.push(
        HydrologyDischargeRecordSchema.parse({
          id: `hydro:fixture:${request.providerReachId}:${validAt}:retrospective`,
          productKind: 'RETROSPECTIVE_SIMULATION',
          riverReachId: request.riverReachId,
          providerReachId: request.providerReachId,
          mapping: this.mapping(),
          validAt,
          modelRunAt: null,
          leadSeconds: null,
          dischargeCms: 410,
          unit: 'm3/s',
          ensembleMember: null,
          statistic: null,
          quality: { state: 'SIMULATED', flags: ['FIXTURE', 'RETROSPECTIVE'] },
          source: this.source('fixture-retrospective-daily', null),
        }),
      );
    }

    return {
      capability: 'hydrology.retrospective',
      records,
    };
  }

  private mapping() {
    return {
      state: 'MAPPED' as const,
      method: 'PROVIDER_ID' as const,
      confidence: 1,
      distanceKm: 0,
    };
  }

  private source(productId: string, modelRunAt: string | null) {
    void modelRunAt;
    return {
      sourceId: this.sourceId,
      providerConfigId: this.context.providerId,
      productId,
      productVersion: '1',
      fetchedAt: compactInstant(this.now()),
      attributionText: this.attributionText,
      attributionUrl: this.attributionUrl,
    };
  }
}
