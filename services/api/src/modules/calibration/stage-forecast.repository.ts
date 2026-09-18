import { createHash } from 'node:crypto';

import {
  StageForecastPointSchema,
  type StageEvidenceStatus,
  type StageForecastPoint,
} from '@connuoc/shared-types';
import type { Pool, PoolClient } from 'pg';

export interface SaveStageForecastInput {
  readonly riverReachId: string;
  readonly stationId: string;
  readonly calibrationRunId: string;
  readonly curveId: string;
  readonly inputHydrologyRunId: string;
  readonly generatedAt: string;
  readonly datumId: string;
  readonly evidenceStatus: Exclude<
    StageEvidenceStatus,
    'INSUFFICIENT_DATA'
  >;
  readonly testMaeM: number;
  readonly testRmseM: number;
  readonly limitations: readonly string[];
  readonly points: readonly StageForecastPoint[];
  readonly metadata?: Record<string, unknown>;
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

function checksum(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)))
    .digest('hex');
}

function assertInstant(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new RangeError(`${field} must be a valid ISO instant`);
  }
}

function assertId(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new RangeError(`${field} must not be empty`);
  }
}

export class StageForecastRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new Error('Stage forecast database is not configured.');
    }
    return this.pool;
  }

  async save(
    rawInput: SaveStageForecastInput,
  ): Promise<string> {
    const input = {
      ...rawInput,
      points: rawInput.points.map((point) =>
        StageForecastPointSchema.parse(point),
      ),
    };

    assertId(input.riverReachId, 'riverReachId');
    assertId(input.stationId, 'stationId');
    assertId(input.calibrationRunId, 'calibrationRunId');
    assertId(input.curveId, 'curveId');
    assertId(input.inputHydrologyRunId, 'inputHydrologyRunId');
    assertId(input.datumId, 'datumId');
    assertInstant(input.generatedAt, 'generatedAt');
    if (input.points.length === 0) {
      throw new RangeError('stage forecast must contain at least one point');
    }
    if (
      !Number.isFinite(input.testMaeM) ||
      input.testMaeM < 0 ||
      !Number.isFinite(input.testRmseM) ||
      input.testRmseM < input.testMaeM
    ) {
      throw new RangeError('stage forecast held-out metrics are invalid');
    }

    const expectedStatus =
      input.points.every((point) => point.status === 'AVAILABLE')
        ? 'AVAILABLE'
        : input.points.some((point) => point.status === 'AVAILABLE')
          ? 'PARTIAL'
          : null;
    if (expectedStatus === null || expectedStatus !== input.evidenceStatus) {
      throw new RangeError(
        'stage forecast evidenceStatus is inconsistent with derivation points',
      );
    }

    for (const point of input.points) {
      if (
        point.datumId !== input.datumId ||
        point.curveId !== input.curveId ||
        point.calibrationRunId !== input.calibrationRunId
      ) {
        throw new RangeError(
          'stage forecast points must share datum, curve and calibration identity',
        );
      }
    }

    const sorted = [...input.points].sort(
      (left, right) =>
        Date.parse(left.validAt) - Date.parse(right.validAt) ||
        left.sourceDischargeRecordId.localeCompare(
          right.sourceDischargeRecordId,
        ),
    );
    const horizonStart = sorted[0]!.validAt;
    const horizonEnd = sorted[sorted.length - 1]!.validAt;
    const normalizedChecksum = checksum({
      riverReachId: input.riverReachId,
      stationId: input.stationId,
      calibrationRunId: input.calibrationRunId,
      curveId: input.curveId,
      inputHydrologyRunId: input.inputHydrologyRunId,
      datumId: input.datumId,
      evidenceStatus: input.evidenceStatus,
      testMaeM: input.testMaeM,
      testRmseM: input.testRmseM,
      limitations: [...input.limitations].sort(),
      points: sorted,
    });

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const identities = await this.resolveIdentities(client, input);

      const runResult = await client.query<{ id: string }>(
        `INSERT INTO stage_forecast_runs (
           river_reach_id, station_id, calibration_run_id, rating_curve_id,
           input_hydrology_run_id, generated_at, horizon_start, horizon_end,
           datum_id, evidence_status, test_mae_m, test_rmse_m,
           normalized_checksum, limitations, metadata
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8,
           $9, $10, $11, $12,
           $13, $14, $15::jsonb
         )
         ON CONFLICT (
           river_reach_id,
           station_id,
           rating_curve_id,
           input_hydrology_run_id,
           normalized_checksum
         )
         DO UPDATE SET normalized_checksum = EXCLUDED.normalized_checksum
         RETURNING id::text AS id`,
        [
          identities.reachId,
          identities.stationId,
          identities.calibrationId,
          identities.curveId,
          input.inputHydrologyRunId,
          input.generatedAt,
          horizonStart,
          horizonEnd,
          input.datumId,
          input.evidenceStatus,
          input.testMaeM,
          input.testRmseM,
          normalizedChecksum,
          [...input.limitations],
          JSON.stringify(input.metadata ?? {}),
        ],
      );
      const runId = runResult.rows[0]?.id;
      if (!runId) {
        throw new Error('Stage forecast insert did not return an id.');
      }

      for (const point of sorted) {
        await client.query(
          `INSERT INTO stage_forecast_points (
             stage_forecast_run_id, external_discharge_record_id,
             valid_at, lead_seconds, discharge_cms, derivation_status,
             stage_m, datum_id, extrapolated
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9
           )
           ON CONFLICT (
             stage_forecast_run_id,
             external_discharge_record_id
           ) DO NOTHING`,
          [
            runId,
            point.sourceDischargeRecordId,
            point.validAt,
            point.leadSeconds,
            point.dischargeCms,
            point.status,
            point.stageM,
            point.datumId,
            point.extrapolated,
          ],
        );
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

  private async resolveIdentities(
    client: PoolClient,
    input: SaveStageForecastInput,
  ): Promise<{
    readonly reachId: string;
    readonly stationId: string;
    readonly calibrationId: string;
    readonly curveId: string;
  }> {
    const result = await client.query<{
      reach_id: string;
      station_id: string;
      calibration_id: string;
      curve_id: string;
      curve_datum_id: string;
      calibration_datum_id: string;
      curve_status: string;
      calibration_status: string;
      hydrology_reach_id: string;
    }>(
      `SELECT
         rr.id::text AS reach_id,
         s.id::text AS station_id,
         cr.id::text AS calibration_id,
         rc.id::text AS curve_id,
         rc.datum_id AS curve_datum_id,
         cr.datum_id AS calibration_datum_id,
         rc.status AS curve_status,
         cr.deployment_status AS calibration_status,
         h.river_reach_id::text AS hydrology_reach_id
       FROM river_reaches rr
       JOIN stations s ON s.public_id = $2
       JOIN calibration_runs cr
         ON cr.public_id = $3
        AND cr.station_id = s.id
        AND cr.river_reach_id = rr.id
       JOIN rating_curves rc
         ON rc.public_id = $4
        AND rc.calibration_run_id = cr.id
        AND rc.station_id = s.id
        AND rc.river_reach_id = rr.id
       JOIN hydrology_forecast_runs h
         ON h.id = $5::uuid
        AND h.river_reach_id = rr.id
        AND h.capability = 'hydrology.dischargeForecast'
       WHERE rr.public_id = $1
       LIMIT 1`,
      [
        input.riverReachId,
        input.stationId,
        input.calibrationRunId,
        input.curveId,
        input.inputHydrologyRunId,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new RangeError(
        'Stage forecast scientific lineage could not be resolved.',
      );
    }
    if (
      row.curve_status !== 'ACTIVE' ||
      row.calibration_status !== 'ACTIVE' ||
      row.curve_datum_id !== input.datumId ||
      row.calibration_datum_id !== input.datumId
    ) {
      throw new RangeError(
        'Stage forecast requires active datum-compatible calibration evidence.',
      );
    }
    return {
      reachId: row.reach_id,
      stationId: row.station_id,
      calibrationId: row.calibration_id,
      curveId: row.curve_id,
    };
  }
}
