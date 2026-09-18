import {
  RatingCurveDefinitionSchema,
  type RatingCurveDefinition,
} from '@connuoc/shared-types';
import type { Pool, PoolClient } from 'pg';

export interface RiverRiseStationContext {
  readonly stationId: string;
  readonly stationName: string;
  readonly riverReachId: string | null;
  readonly datumId: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly activeCurve: RatingCurveDefinition | null;
}

interface StationCurveRow {
  station_public_id: string;
  station_name: string;
  river_reach_public_id: string | null;
  default_datum_id: string | null;
  latitude: number | string;
  longitude: number | string;
  curve_public_id: string | null;
  curve_version: string | null;
  curve_datum_id: string | null;
  curve_kind: 'PIECEWISE_LINEAR' | null;
  curve_status: 'ACTIVE' | null;
  curve_points: unknown;
  curve_valid_from: Date | string | null;
  curve_valid_to: Date | string | null;
  calibration_public_id: string | null;
  validation_sample_count: number | null;
  validation_mae_m: number | string | null;
  validation_rmse_m: number | string | null;
  validation_bias_m: number | string | null;
  validation_start: Date | string | null;
  validation_end: Date | string | null;
  lead_metrics: unknown;
}

interface TransitionTargetRow {
  curve_id: string;
  curve_public_id: string;
  curve_status: string;
  station_id: string;
  river_reach_id: string;
  datum_id: string;
  calibration_run_id: string;
  calibration_public_id: string;
  calibration_status: string;
  model_family: string;
}

function asNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function compactInstant(value: Date | string): string {
  const iso =
    value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
  return iso.endsWith('.000Z') ? iso.replace('.000Z', 'Z') : iso;
}

function nullableInstant(
  value: Date | string | null,
): string | null {
  return value === null ? null : compactInstant(value);
}

function assertInstant(value: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new RangeError('timestamp must be a valid ISO instant');
  }
}

export class RiverRiseRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new Error('River-rise database is not configured.');
    }
    return this.pool;
  }

  async findStationContext(
    stationPublicId: string,
    atUtc: string,
  ): Promise<RiverRiseStationContext | null> {
    if (stationPublicId.trim().length === 0) {
      throw new RangeError('stationPublicId must not be empty');
    }
    assertInstant(atUtc);

    const result = await this.database().query<StationCurveRow>(
      `SELECT
         s.public_id AS station_public_id,
         s.name AS station_name,
         rr.public_id AS river_reach_public_id,
         s.default_datum_id,
         ST_Y(s.location) AS latitude,
         ST_X(s.location) AS longitude,
         rc.public_id AS curve_public_id,
         rc.version AS curve_version,
         rc.datum_id AS curve_datum_id,
         rc.curve_kind,
         rc.status AS curve_status,
         rc.points AS curve_points,
         rc.valid_from AS curve_valid_from,
         rc.valid_to AS curve_valid_to,
         cr.public_id AS calibration_public_id,
         rc.validation_sample_count,
         rc.validation_mae_m,
         rc.validation_rmse_m,
         cr.bias_m AS validation_bias_m,
         cr.validation_start,
         cr.validation_end,
         cr.lead_metrics
       FROM stations s
       LEFT JOIN river_reaches rr
         ON rr.id = s.river_reach_id
       LEFT JOIN rating_curves rc
         ON rc.station_id = s.id
        AND rc.river_reach_id = s.river_reach_id
        AND rc.status = 'ACTIVE'
        AND rc.valid_from <= $2::timestamptz
        AND (rc.valid_to IS NULL OR rc.valid_to >= $2::timestamptz)
       LEFT JOIN calibration_runs cr
         ON cr.id = rc.calibration_run_id
        AND cr.status = 'ACTIVE'
       WHERE s.public_id = $1
       ORDER BY rc.activated_at DESC NULLS LAST
       LIMIT 1`,
      [stationPublicId, atUtc],
    );

    const row = result.rows[0];
    if (!row) return null;

    let activeCurve: RatingCurveDefinition | null = null;
    if (
      row.curve_public_id !== null &&
      row.curve_version !== null &&
      row.curve_datum_id !== null &&
      row.curve_kind !== null &&
      row.curve_status !== null &&
      row.curve_valid_from !== null &&
      row.calibration_public_id !== null &&
      row.validation_sample_count !== null &&
      row.validation_mae_m !== null &&
      row.validation_rmse_m !== null &&
      row.validation_start !== null &&
      row.validation_end !== null
    ) {
      activeCurve = RatingCurveDefinitionSchema.parse({
        id: row.curve_public_id,
        stationId: row.station_public_id,
        riverReachId: row.river_reach_public_id,
        version: row.curve_version,
        datumId: row.curve_datum_id,
        stageUnit: 'm',
        curveKind: row.curve_kind,
        status: row.curve_status,
        points: row.curve_points,
        validFrom: compactInstant(row.curve_valid_from),
        validTo: nullableInstant(row.curve_valid_to),
        calibrationRunId: row.calibration_public_id,
        validation: {
          sampleCount: row.validation_sample_count,
          maeM: asNumber(row.validation_mae_m),
          rmseM: asNumber(row.validation_rmse_m),
          biasM:
            row.validation_bias_m === null
              ? null
              : asNumber(row.validation_bias_m),
          validationStart: compactInstant(row.validation_start),
          validationEnd: compactInstant(row.validation_end),
          leadMetrics:
            Array.isArray(row.lead_metrics)
              ? row.lead_metrics
              : [],
        },
      });
    }

    return {
      stationId: row.station_public_id,
      stationName: row.station_name,
      riverReachId: row.river_reach_public_id,
      datumId: row.default_datum_id,
      latitude: asNumber(row.latitude),
      longitude: asNumber(row.longitude),
      activeCurve,
    };
  }

  async activateRatingCurve(
    curvePublicId: string,
    actorId: string,
    occurredAtUtc: string,
  ): Promise<void> {
    await this.transitionCurve(
      curvePublicId,
      actorId,
      occurredAtUtc,
      'activate',
    );
  }

  async rollbackRatingCurve(
    curvePublicId: string,
    actorId: string,
    occurredAtUtc: string,
  ): Promise<void> {
    await this.transitionCurve(
      curvePublicId,
      actorId,
      occurredAtUtc,
      'rollback',
    );
  }

  private async transitionCurve(
    curvePublicId: string,
    actorId: string,
    occurredAtUtc: string,
    mode: 'activate' | 'rollback',
  ): Promise<void> {
    if (curvePublicId.trim().length === 0) {
      throw new RangeError('curvePublicId must not be empty');
    }
    if (actorId.trim().length === 0) {
      throw new RangeError('actorId must not be empty');
    }
    assertInstant(occurredAtUtc);

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');

      const target = await client.query<TransitionTargetRow>(
        `SELECT
           rc.id::text AS curve_id,
           rc.public_id AS curve_public_id,
           rc.status AS curve_status,
           rc.station_id::text AS station_id,
           rc.river_reach_id::text AS river_reach_id,
           rc.datum_id,
           rc.calibration_run_id::text AS calibration_run_id,
           cr.public_id AS calibration_public_id,
           cr.status AS calibration_status,
           cr.model_family
         FROM rating_curves rc
         JOIN calibration_runs cr
           ON cr.id = rc.calibration_run_id
         WHERE rc.public_id = $1
         FOR UPDATE OF rc, cr`,
        [curvePublicId],
      );

      const row = target.rows[0];
      if (!row) {
        throw new RangeError('rating curve was not found');
      }

      if (mode === 'activate') {
        if (
          row.curve_status !== 'CANDIDATE' ||
          row.calibration_status !== 'APPROVED'
        ) {
          throw new RangeError(
            'only an approved candidate calibration can be activated',
          );
        }
      } else if (
        row.curve_status !== 'ROLLED_BACK' ||
        row.calibration_status !== 'ROLLED_BACK'
      ) {
        throw new RangeError(
          'rollback target must be a previously rolled-back calibration',
        );
      }

      const currentCurves = await client.query<{
        public_id: string;
      }>(
        `SELECT public_id
         FROM rating_curves
         WHERE station_id = $1::uuid
           AND river_reach_id = $2::uuid
           AND datum_id = $3
           AND status = 'ACTIVE'
         FOR UPDATE`,
        [row.station_id, row.river_reach_id, row.datum_id],
      );

      await client.query(
        `UPDATE rating_curves
         SET status = 'ROLLED_BACK',
             retired_at = $4::timestamptz,
             updated_at = now()
         WHERE station_id = $1::uuid
           AND river_reach_id = $2::uuid
           AND datum_id = $3
           AND status = 'ACTIVE'`,
        [
          row.station_id,
          row.river_reach_id,
          row.datum_id,
          occurredAtUtc,
        ],
      );

      await client.query(
        `UPDATE calibration_runs
         SET status = 'ROLLED_BACK',
             retired_at = $4::timestamptz,
             updated_at = now()
         WHERE station_id = $1::uuid
           AND river_reach_id = $2::uuid
           AND model_family = $3
           AND status = 'ACTIVE'`,
        [
          row.station_id,
          row.river_reach_id,
          row.model_family,
          occurredAtUtc,
        ],
      );

      await client.query(
        `UPDATE calibration_runs
         SET status = 'ACTIVE',
             activated_at = $2::timestamptz,
             retired_at = NULL,
             updated_at = now()
         WHERE id = $1::uuid`,
        [row.calibration_run_id, occurredAtUtc],
      );

      await client.query(
        `UPDATE rating_curves
         SET status = 'ACTIVE',
             activated_at = $2::timestamptz,
             retired_at = NULL,
             updated_at = now()
         WHERE id = $1::uuid`,
        [row.curve_id, occurredAtUtc],
      );

      await this.appendAudit(
        client,
        actorId,
        mode,
        row.curve_public_id,
        currentCurves.rows.map((item) => item.public_id),
        occurredAtUtc,
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async appendAudit(
    client: PoolClient,
    actorId: string,
    mode: 'activate' | 'rollback',
    targetCurvePublicId: string,
    previousActiveCurveIds: readonly string[],
    occurredAtUtc: string,
  ): Promise<void> {
    await client.query(
      `INSERT INTO audit_log (
         occurred_at, actor_type, actor_id, action,
         target_type, target_id, before_state, after_state
       ) VALUES (
         $1::timestamptz, 'admin', $2, $3,
         'rating_curve', $4,
         $5::jsonb, $6::jsonb
       )`,
      [
        occurredAtUtc,
        actorId,
        mode === 'activate'
          ? 'river-rise.rating-curve.activate'
          : 'river-rise.rating-curve.rollback',
        targetCurvePublicId,
        JSON.stringify({
          activeCurveIds: previousActiveCurveIds,
        }),
        JSON.stringify({
          activeCurveId: targetCurvePublicId,
        }),
      ],
    );
  }
}
