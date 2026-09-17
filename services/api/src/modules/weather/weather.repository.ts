import { createHash } from 'node:crypto';

import type {
  Coordinate,
  CurrentWeatherRecord,
  DailyWeatherPoint,
  HourlyWeatherPoint,
  WeatherFreshness,
  WeatherGridLocation,
  WeatherSourceProvenance,
} from '@connuoc/shared-types';
import type { Pool, PoolClient } from 'pg';

export type WeatherForecastCapability =
  | 'weather.current'
  | 'weather.hourlyForecast'
  | 'weather.dailyForecast';

interface WeatherBundleBase {
  readonly grid: WeatherGridLocation;
  readonly source: WeatherSourceProvenance;
}

export interface PersistableCurrentWeatherBundle extends WeatherBundleBase {
  readonly capability: 'weather.current';
  readonly data: CurrentWeatherRecord;
}

export interface PersistableHourlyWeatherBundle extends WeatherBundleBase {
  readonly capability: 'weather.hourlyForecast';
  readonly points: readonly HourlyWeatherPoint[];
}

export interface PersistableDailyWeatherBundle extends WeatherBundleBase {
  readonly capability: 'weather.dailyForecast';
  readonly points: readonly DailyWeatherPoint[];
}

export type PersistableWeatherBundle =
  | PersistableCurrentWeatherBundle
  | PersistableHourlyWeatherBundle
  | PersistableDailyWeatherBundle;

export interface CachedWeatherBundle {
  readonly runId: string;
  readonly freshness: WeatherFreshness;
  readonly bundle: PersistableWeatherBundle;
}

interface ForecastRunRow {
  id: string;
  capability: WeatherForecastCapability;
  source_registry_id: string;
  latitude: number | string;
  longitude: number | string;
  provider_timezone: string;
  attribution_text: string;
  attribution_url: string | null;
  model_id: string;
  model_run_at: Date | string | null;
  fetched_at: Date | string;
  stale_after: Date | string;
  distance_km: number | string;
}

interface CurrentPointRow {
  valid_at: Date | string;
  temperature_c: number | string;
  apparent_temperature_c: number | string | null;
  relative_humidity_pct: number | string;
  pressure_hpa: number | string;
  wind_speed_ms: number | string;
  wind_gust_ms: number | string | null;
  wind_direction_deg: number | string;
  cloud_cover_pct: number | string | null;
  weather_code: number;
  visibility_m: number | string | null;
  uv_index: number | string | null;
  precipitation_mm: number | string | null;
  rain_mm: number | string | null;
}

interface HourlyPointRow extends CurrentPointRow {
  precipitation_probability_pct: number | string | null;
}

interface DailyPointRow {
  valid_date: Date | string;
  temperature_min_c: number | string;
  temperature_max_c: number | string;
  weather_code: number;
  uv_index_max: number | string | null;
  precipitation_probability_max_pct: number | string | null;
  precipitation_mm: number | string | null;
  rain_mm: number | string | null;
  wind_speed_max_ms: number | string | null;
  wind_gust_max_ms: number | string | null;
}

function databaseError(message: string): Error {
  return new Error(message);
}

function compactInstant(value: Date | string): string {
  const instant = value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  return instant.endsWith('.000Z') ? instant.replace('.000Z', 'Z') : instant;
}

function dateOnly(value: Date | string): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function numberValue(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function nullableNumber(value: number | string | null): number | null {
  return value === null ? null : numberValue(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function bundleForPersistence(bundle: PersistableWeatherBundle): PersistableWeatherBundle {
  return {
    ...bundle,
    grid: {
      ...bundle.grid,
      distanceFromRequestKm: null,
    },
  } as PersistableWeatherBundle;
}

function checksumForBundle(bundle: PersistableWeatherBundle): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(bundleForPersistence(bundle))))
    .digest('hex');
}

function assertFreshnessSeconds(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 2_592_000) {
    throw new RangeError('freshnessSeconds must be an integer between 1 and 2592000');
  }
}

function assertCoordinate(coordinate: Coordinate): void {
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

function assertDistance(value: number): void {
  if (!Number.isFinite(value) || value <= 0 || value > 25) {
    throw new RangeError('maxDistanceKm must be greater than 0 and at most 25');
  }
}

async function saveCurrentPoint(
  client: PoolClient,
  runId: string,
  data: CurrentWeatherRecord,
): Promise<void> {
  await client.query(
    `INSERT INTO weather_current_points (
       forecast_run_id, valid_at, temperature_c, apparent_temperature_c,
       relative_humidity_pct, pressure_hpa, wind_speed_ms, wind_gust_ms,
       wind_direction_deg, cloud_cover_pct, weather_code, visibility_m,
       uv_index, precipitation_mm, rain_mm
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
     )
     ON CONFLICT (forecast_run_id) DO NOTHING`,
    [
      runId,
      data.validAt,
      data.temperatureC,
      data.apparentTemperatureC,
      data.relativeHumidityPct,
      data.pressureHpa,
      data.windSpeedMs,
      data.windGustMs,
      data.windDirectionDeg,
      data.cloudCoverPct,
      data.weatherCode,
      data.visibilityM,
      data.uvIndex,
      data.precipitationMm,
      data.rainMm,
    ],
  );
}

async function saveHourlyPoints(
  client: PoolClient,
  runId: string,
  points: readonly HourlyWeatherPoint[],
): Promise<void> {
  for (const point of points) {
    await client.query(
      `INSERT INTO weather_hourly_points (
         forecast_run_id, valid_at, temperature_c, apparent_temperature_c,
         relative_humidity_pct, pressure_hpa, wind_speed_ms, wind_gust_ms,
         wind_direction_deg, cloud_cover_pct, weather_code, visibility_m,
         uv_index, precipitation_mm, rain_mm, precipitation_probability_pct
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
       )
       ON CONFLICT (forecast_run_id, valid_at) DO NOTHING`,
      [
        runId,
        point.validAt,
        point.temperatureC,
        point.apparentTemperatureC,
        point.relativeHumidityPct,
        point.pressureHpa,
        point.windSpeedMs,
        point.windGustMs,
        point.windDirectionDeg,
        point.cloudCoverPct,
        point.weatherCode,
        point.visibilityM,
        point.uvIndex,
        point.precipitationMm,
        point.rainMm,
        point.precipitationProbabilityPct,
      ],
    );
  }
}

async function saveDailyPoints(
  client: PoolClient,
  runId: string,
  points: readonly DailyWeatherPoint[],
): Promise<void> {
  for (const point of points) {
    await client.query(
      `INSERT INTO weather_daily_points (
         forecast_run_id, valid_date, temperature_min_c, temperature_max_c,
         weather_code, uv_index_max, precipitation_probability_max_pct,
         precipitation_mm, rain_mm, wind_speed_max_ms, wind_gust_max_ms
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (forecast_run_id, valid_date) DO NOTHING`,
      [
        runId,
        point.validDate,
        point.temperatureMinC,
        point.temperatureMaxC,
        point.weatherCode,
        point.uvIndexMax,
        point.precipitationProbabilityMaxPct,
        point.precipitationMm,
        point.rainMm,
        point.windSpeedMaxMs,
        point.windGustMaxMs,
      ],
    );
  }
}

function currentRecord(row: CurrentPointRow): CurrentWeatherRecord {
  return {
    kind: 'MODEL_CURRENT',
    validAt: compactInstant(row.valid_at),
    temperatureC: numberValue(row.temperature_c),
    apparentTemperatureC: nullableNumber(row.apparent_temperature_c),
    relativeHumidityPct: numberValue(row.relative_humidity_pct),
    pressureHpa: numberValue(row.pressure_hpa),
    windSpeedMs: numberValue(row.wind_speed_ms),
    windGustMs: nullableNumber(row.wind_gust_ms),
    windDirectionDeg: numberValue(row.wind_direction_deg),
    cloudCoverPct: nullableNumber(row.cloud_cover_pct),
    weatherCode: row.weather_code,
    visibilityM: nullableNumber(row.visibility_m),
    uvIndex: nullableNumber(row.uv_index),
    precipitationMm: nullableNumber(row.precipitation_mm),
    rainMm: nullableNumber(row.rain_mm),
  };
}

function hourlyRecord(row: HourlyPointRow): HourlyWeatherPoint {
  return {
    kind: 'FORECAST',
    ...currentRecord(row),
    kind: 'FORECAST',
    precipitationProbabilityPct: nullableNumber(row.precipitation_probability_pct),
  };
}

function dailyRecord(row: DailyPointRow): DailyWeatherPoint {
  return {
    kind: 'FORECAST',
    validDate: dateOnly(row.valid_date),
    temperatureMinC: numberValue(row.temperature_min_c),
    temperatureMaxC: numberValue(row.temperature_max_c),
    weatherCode: row.weather_code,
    uvIndexMax: nullableNumber(row.uv_index_max),
    precipitationProbabilityMaxPct: nullableNumber(row.precipitation_probability_max_pct),
    precipitationMm: nullableNumber(row.precipitation_mm),
    rainMm: nullableNumber(row.rain_mm),
    windSpeedMaxMs: nullableNumber(row.wind_speed_max_ms),
    windGustMaxMs: nullableNumber(row.wind_gust_max_ms),
  };
}

export class WeatherRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) throw databaseError('Weather database is not configured.');
    return this.pool;
  }

  async saveBundle(
    providerConfigId: string,
    inputBundle: PersistableWeatherBundle,
    freshnessSeconds: number,
  ): Promise<string> {
    assertFreshnessSeconds(freshnessSeconds);
    const bundle = bundleForPersistence(inputBundle);
    const checksum = checksumForBundle(bundle);
    const fetchedAtMs = Date.parse(bundle.source.fetchedAt);
    if (!Number.isFinite(fetchedAtMs)) throw new RangeError('bundle source fetchedAt is invalid');
    const staleAfter = new Date(fetchedAtMs + freshnessSeconds * 1000).toISOString();

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const run = await client.query<{ id: string }>(
        `INSERT INTO weather_forecast_runs (
           provider_config_id, source_registry_id, capability, provider_grid,
           provider_timezone, attribution_text, attribution_url, model_id,
           model_run_at, fetched_at, stale_after, normalized_checksum
         ) VALUES (
           $1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326),
           $6, $7, $8, $9, $10, $11, $12, $13
         )
         ON CONFLICT (provider_config_id, capability, normalized_checksum)
         DO UPDATE SET normalized_checksum = EXCLUDED.normalized_checksum
         RETURNING id`,
        [
          providerConfigId,
          bundle.source.sourceId,
          bundle.capability,
          bundle.grid.longitude,
          bundle.grid.latitude,
          bundle.grid.timeZone,
          bundle.source.attributionText,
          bundle.source.attributionUrl,
          bundle.source.modelId,
          bundle.source.modelRunAt,
          bundle.source.fetchedAt,
          staleAfter,
          checksum,
        ],
      );
      const runId = run.rows[0]?.id;
      if (!runId) throw databaseError('Weather forecast run insert did not return an id.');

      if (bundle.capability === 'weather.current') {
        await saveCurrentPoint(client, runId, bundle.data);
      } else if (bundle.capability === 'weather.hourlyForecast') {
        await saveHourlyPoints(client, runId, bundle.points);
      } else {
        await saveDailyPoints(client, runId, bundle.points);
      }

      await client.query('COMMIT');
      return runId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findNearestCached(
    capability: WeatherForecastCapability,
    coordinate: Coordinate,
    maxDistanceKm: number,
    now: Date,
  ): Promise<CachedWeatherBundle | null> {
    assertCoordinate(coordinate);
    assertDistance(maxDistanceKm);
    if (!Number.isFinite(now.getTime())) throw new RangeError('now must be a valid Date');

    const runResult = await this.database().query<ForecastRunRow>(
      `SELECT
         id,
         capability,
         source_registry_id,
         ST_Y(provider_grid) AS latitude,
         ST_X(provider_grid) AS longitude,
         provider_timezone,
         attribution_text,
         attribution_url,
         model_id,
         model_run_at,
         fetched_at,
         stale_after,
         ST_Distance(
           provider_grid::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
         ) / 1000.0 AS distance_km
       FROM weather_forecast_runs
       WHERE capability = $3
         AND ST_DWithin(
           provider_grid::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
           $4 * 1000.0
         )
       ORDER BY
         ST_Distance(
           provider_grid::geography,
           ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
         ) ASC,
         fetched_at DESC,
         id ASC
       LIMIT 1`,
      [coordinate.latitude, coordinate.longitude, capability, maxDistanceKm],
    );

    const run = runResult.rows[0];
    if (!run) return null;

    const grid: WeatherGridLocation = {
      spatialRepresentation: 'GRID_CELL',
      latitude: numberValue(run.latitude),
      longitude: numberValue(run.longitude),
      timeZone: run.provider_timezone,
      distanceFromRequestKm: numberValue(run.distance_km),
    };
    const source: WeatherSourceProvenance = {
      sourceId: run.source_registry_id,
      attributionText: run.attribution_text,
      attributionUrl: run.attribution_url,
      modelId: run.model_id,
      modelRunAt: run.model_run_at === null ? null : compactInstant(run.model_run_at),
      fetchedAt: compactInstant(run.fetched_at),
    };
    const freshness: WeatherFreshness = {
      state: now.getTime() <= new Date(run.stale_after).getTime() ? 'FRESH' : 'STALE',
      staleAfter: compactInstant(run.stale_after),
    };

    let bundle: PersistableWeatherBundle;
    if (run.capability === 'weather.current') {
      const point = await this.database().query<CurrentPointRow>(
        `SELECT * FROM weather_current_points WHERE forecast_run_id = $1`,
        [run.id],
      );
      const row = point.rows[0];
      if (!row) throw databaseError('Cached current weather run has no point.');
      bundle = { capability: 'weather.current', grid, source, data: currentRecord(row) };
    } else if (run.capability === 'weather.hourlyForecast') {
      const points = await this.database().query<HourlyPointRow>(
        `SELECT * FROM weather_hourly_points WHERE forecast_run_id = $1 ORDER BY valid_at ASC`,
        [run.id],
      );
      if (points.rows.length === 0) throw databaseError('Cached hourly weather run has no points.');
      bundle = {
        capability: 'weather.hourlyForecast',
        grid,
        source,
        points: points.rows.map(hourlyRecord),
      };
    } else {
      const points = await this.database().query<DailyPointRow>(
        `SELECT * FROM weather_daily_points WHERE forecast_run_id = $1 ORDER BY valid_date ASC`,
        [run.id],
      );
      if (points.rows.length === 0) throw databaseError('Cached daily weather run has no points.');
      bundle = {
        capability: 'weather.dailyForecast',
        grid,
        source,
        points: points.rows.map(dailyRecord),
      };
    }

    return { runId: run.id, freshness, bundle };
  }
}
