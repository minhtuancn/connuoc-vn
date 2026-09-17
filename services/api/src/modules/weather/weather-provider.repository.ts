import type {
  CommercialUseStatus,
  Coordinate,
  ProviderCapability,
  ProviderHealthState,
} from '@connuoc/shared-types';
import type { SelectableProviderConfig } from '@connuoc/weather-worker';
import type { Pool } from 'pg';

export interface WeatherRuntimeProvider {
  readonly providerId: string;
  readonly providerKey: string;
  readonly providerType: string;
  readonly sourceRegistryId: string;
  readonly endpointConfig: {
    readonly baseUrl?: string;
    readonly timeoutMs?: number;
  };
  readonly secretRef: string | null;
  readonly modelAllowList: readonly string[];
  readonly freshnessSeconds: number;
  readonly selectable: SelectableProviderConfig;
  readonly attribution: {
    readonly text: string;
    readonly url: string | null;
  };
}

export interface WeatherProviderRuntimeStore {
  listRuntimeProviders(coordinate: Coordinate): Promise<readonly WeatherRuntimeProvider[]>;
  recordHealthEvent(
    providerId: string,
    state: ProviderHealthState,
    latencyMs: number,
    failureCode: string | null,
  ): Promise<void>;
}

interface RuntimeProviderRow {
  id: string;
  provider_key: string;
  provider_type: string;
  source_registry_id: string;
  source_name: string;
  enabled: boolean;
  priority: number;
  weight: number | string;
  endpoint_config: Record<string, unknown>;
  secret_ref: string | null;
  commercial_use_status: CommercialUseStatus;
  health_state: ProviderHealthState;
  health_blocks_selection: boolean;
  covers_location: boolean;
  capabilities: ProviderCapability[];
  freshness_policy: Record<string, unknown>;
  model_allow_list: unknown;
  attribution_text: string | null;
  attribution_url: string | null;
}

const HEALTH_STATES = new Set<ProviderHealthState>([
  'HEALTHY',
  'DEGRADED',
  'UNAVAILABLE',
  'UNKNOWN',
]);

function numberValue(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function endpointConfig(value: Record<string, unknown>): WeatherRuntimeProvider['endpointConfig'] {
  const result: { baseUrl?: string; timeoutMs?: number } = {};
  if (typeof value.baseUrl === 'string' && value.baseUrl.length > 0) {
    result.baseUrl = value.baseUrl;
  }
  if (typeof value.timeoutMs === 'number' && Number.isInteger(value.timeoutMs)) {
    result.timeoutMs = value.timeoutMs;
  }
  return result;
}

function freshnessSeconds(value: Record<string, unknown>): number {
  const maxAgeSeconds = value.maxAgeSeconds;
  if (
    typeof maxAgeSeconds === 'number' &&
    Number.isInteger(maxAgeSeconds) &&
    maxAgeSeconds >= 60 &&
    maxAgeSeconds <= 31_536_000
  ) {
    return maxAgeSeconds;
  }
  return 900;
}

function modelAllowList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function validateCoordinate(coordinate: Coordinate): void {
  if (
    !Number.isFinite(coordinate.latitude) ||
    !Number.isFinite(coordinate.longitude) ||
    coordinate.latitude < -90 ||
    coordinate.latitude > 90 ||
    coordinate.longitude < -180 ||
    coordinate.longitude > 180
  ) {
    throw new RangeError('coordinate is outside valid latitude/longitude bounds');
  }
}

function validateHealthEvent(
  state: ProviderHealthState,
  latencyMs: number,
  failureCode: string | null,
): void {
  if (!HEALTH_STATES.has(state)) throw new RangeError('invalid provider health state');
  if (!Number.isInteger(latencyMs) || latencyMs < 0 || latencyMs > 120_000) {
    throw new RangeError('latencyMs must be an integer between 0 and 120000');
  }
  if (
    failureCode !== null &&
    (!/^[A-Z][A-Z0-9_]{0,63}$/.test(failureCode) || failureCode.length > 64)
  ) {
    throw new RangeError('failureCode must be a bounded machine-readable code');
  }
}

export class WeatherProviderRepository implements WeatherProviderRuntimeStore {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) throw new Error('Weather provider database is not configured.');
    return this.pool;
  }

  async listRuntimeProviders(
    coordinate: Coordinate,
  ): Promise<readonly WeatherRuntimeProvider[]> {
    validateCoordinate(coordinate);

    const result = await this.database().query<RuntimeProviderRow>(
      `SELECT
         pc.id::text AS id,
         pc.provider_key,
         pc.provider_type,
         ds.source_key AS source_registry_id,
         ds.name AS source_name,
         pc.enabled,
         pc.priority,
         pc.weight::float8 AS weight,
         pc.endpoint_config,
         pc.secret_ref,
         pc.commercial_use_status,
         pc.health_state,
         pc.health_blocks_selection,
         CASE
           WHEN pc.coverage IS NULL THEN true
           ELSE ST_Covers(
             pc.coverage,
             ST_SetSRID(ST_MakePoint($2, $1), 4326)
           )
         END AS covers_location,
         COALESCE(
           (SELECT array_agg(cap.capability ORDER BY cap.capability)
            FROM provider_capabilities cap
            WHERE cap.provider_config_id = pc.id AND cap.enabled),
           ARRAY[]::text[]
         ) AS capabilities,
         pc.freshness_policy,
         pc.model_allow_list,
         pc.attribution_text,
         pc.attribution_url
       FROM provider_configs pc
       JOIN data_sources ds ON ds.id = pc.data_source_id
       ORDER BY pc.priority DESC, pc.weight DESC, pc.provider_key ASC`,
      [coordinate.latitude, coordinate.longitude],
    );

    return result.rows.map((row) => {
      const selectable: SelectableProviderConfig = {
        providerId: row.id,
        providerKey: row.provider_key,
        enabled: row.enabled,
        priority: row.priority,
        weight: numberValue(row.weight),
        capabilities: row.capabilities,
        coversLocation: row.covers_location,
        commercialUseStatus: row.commercial_use_status,
        healthState: row.health_state,
        healthBlocksSelection: row.health_blocks_selection,
        quotaAvailable: true,
        budgetAvailable: true,
        effectiveFromUtc: null,
        effectiveToUtc: null,
      };

      return {
        providerId: row.id,
        providerKey: row.provider_key,
        providerType: row.provider_type,
        sourceRegistryId: row.source_registry_id,
        endpointConfig: endpointConfig(row.endpoint_config ?? {}),
        secretRef: row.secret_ref,
        modelAllowList: modelAllowList(row.model_allow_list),
        freshnessSeconds: freshnessSeconds(row.freshness_policy ?? {}),
        selectable,
        attribution: {
          text: row.attribution_text ?? row.source_name,
          url: row.attribution_url,
        },
      };
    });
  }

  async recordHealthEvent(
    providerId: string,
    state: ProviderHealthState,
    latencyMs: number,
    failureCode: string | null,
  ): Promise<void> {
    validateHealthEvent(state, latencyMs, failureCode);
    await this.database().query(
      `INSERT INTO provider_health_events (
         provider_config_id, state, latency_ms, failure_code, details
       ) VALUES ($1::uuid, $2, $3, $4, '{}'::jsonb)`,
      [providerId, state, latencyMs, failureCode],
    );
  }
}
