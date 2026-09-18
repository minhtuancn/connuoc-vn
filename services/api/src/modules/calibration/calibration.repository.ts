import { createHash } from 'node:crypto';

import {
  CalibrationRunSummarySchema,
  RatingCurveModelSchema,
  type CalibrationMetricBreakdown,
  type CalibrationRunSummary,
  type RatingCurveModel,
} from '@connuoc/shared-types';
import type { Pool, PoolClient } from 'pg';

export interface SaveCalibrationRunOptions {
  readonly sourceSummary?: unknown;
  readonly artifactUri?: string | null;
  readonly validatedAtUtc?: string | null;
  readonly metadata?: Record<string, unknown>;
}

export interface ActiveRatingCurveEvidence {
  readonly stationDatumId: string;
  readonly linkConfidence: number;
  readonly curve: RatingCurveModel;
  readonly calibration: CalibrationRunSummary;
}

interface IdentityRow {
  id: string;
}

interface CalibrationRow {
  id: string;
  public_id: string;
  version: string;
  station_public_id: string;
  river_reach_public_id: string;
  datum_id: string;
  source_summary: unknown;
  model_kind: CalibrationRunSummary['modelKind'];
  model_version: string;
  feature_version: string;
  split_strategy: CalibrationRunSummary['splitStrategy'];
  train_start: Date | string;
  train_end: Date | string;
  validation_start: Date | string;
  validation_end: Date | string;
  test_start: Date | string | null;
  test_end: Date | string | null;
  validation_mae_m: number | string | null;
  validation_rmse_m: number | string | null;
  validation_sample_count: number | null;
  test_mae_m: number | string | null;
  test_rmse_m: number | string | null;
  test_sample_count: number | null;
  accepted_test_rmse_m: number | string | null;
  artifact_checksum_sha256: string;
  deployment_status: CalibrationRunSummary['deploymentStatus'];
}

interface MetricBreakdownRow {
  dataset_split: CalibrationMetricBreakdown['datasetSplit'];
  lead_seconds: number | null;
  season: string | null;
  event_subset: string | null;
  mae_m: number | string;
  rmse_m: number | string;
  sample_count: number;
}

interface CurveRow {
  id: string;
  public_id: string;
  curve_version: string;
  station_id: string;
  station_public_id: string;
  station_datum_id: string | null;
  river_reach_id: string;
  river_reach_public_id: string;
  calibration_run_id: string;
  calibration_public_id: string;
  datum_id: string;
  method: 'PIECEWISE_LINEAR';
  stage_unit: 'm';
  discharge_unit: 'm3/s';
  valid_discharge_min_cms: number | string;
  valid_discharge_max_cms: number | string;
  extrapolation_policy: 'REJECT';
  status: RatingCurveModel['status'];
  curve_checksum_sha256: string;
  link_confidence: number | string | null;
}

interface CurvePointRow {
  point_order: number;
  discharge_cms: number | string;
  stage_m: number | string;
}

interface TargetDeploymentRow extends CurveRow {
  calibration_datum_id: string;
  calibration_deployment_status: CalibrationRunSummary['deploymentStatus'];
  validation_mae_m: number | string | null;
  validation_rmse_m: number | string | null;
  validation_sample_count: number | null;
  test_start: Date | string | null;
  test_end: Date | string | null;
  test_mae_m: number | string | null;
  test_rmse_m: number | string | null;
  test_sample_count: number | null;
  accepted_test_rmse_m: number | string | null;
  validated_at: Date | string | null;
}

function asNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function asIso(value: Date | string): string {
  const iso =
    value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  return iso.endsWith('.000Z') ? iso.replace('.000Z', 'Z') : iso;
}

function nullablePeriod(
  start: Date | string | null,
  end: Date | string | null,
) {
  if (start === null || end === null) return null;
  return { start: asIso(start), end: asIso(end) };
}

function metrics(
  mae: number | string | null,
  rmse: number | string | null,
  sampleCount: number | null,
) {
  if (mae === null || rmse === null || sampleCount === null) return null;
  return {
    maeM: asNumber(mae),
    rmseM: asNumber(rmse),
    sampleCount,
  };
}

function sourceIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.flatMap((item) => {
    if (typeof item === 'string' && item.trim().length > 0) return [item];
    if (
      item &&
      typeof item === 'object' &&
      'sourceId' in item &&
      typeof (item as { sourceId?: unknown }).sourceId === 'string'
    ) {
      const sourceId = (item as { sourceId: string }).sourceId.trim();
      return sourceId.length > 0 ? [sourceId] : [];
    }
    return [];
  });
  return [...new Set(ids)];
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

function curveChecksum(curve: RatingCurveModel): string {
  return createHash('sha256')
    .update(
      JSON.stringify(
        canonicalize({
          version: curve.version,
          stationId: curve.stationId,
          riverReachId: curve.riverReachId,
          calibrationRunId: curve.calibrationRunId,
          datumId: curve.datumId,
          method: curve.method,
          stageUnit: curve.stageUnit,
          dischargeUnit: curve.dischargeUnit,
          validDischargeMinCms: curve.validDischargeMinCms,
          validDischargeMaxCms: curve.validDischargeMaxCms,
          extrapolationPolicy: curve.extrapolationPolicy,
          points: curve.points,
        }),
      ),
    )
    .digest('hex');
}

function assertInstant(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new RangeError(`${field} must be a valid ISO instant`);
  }
}

export class CalibrationRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) throw new Error('Calibration database is not configured.');
    return this.pool;
  }

  async saveCalibrationRun(
    rawRun: CalibrationRunSummary,
    options: SaveCalibrationRunOptions = {},
  ): Promise<string> {
    const run = CalibrationRunSummarySchema.parse(rawRun);
    if (run.deploymentStatus === 'ACTIVE') {
      throw new RangeError(
        'Calibration runs must be activated through the evidence-gated activation transaction.',
      );
    }
    if (options.validatedAtUtc) {
      assertInstant(options.validatedAtUtc, 'validatedAtUtc');
    }

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const stationId = await this.stationId(client, run.stationId);
      const reachId = await this.reachId(client, run.riverReachId);
      const sourceSummary =
        options.sourceSummary ??
        run.sourceIds.map((sourceId) => ({ sourceId }));

      const inserted = await client.query<IdentityRow>(
        `INSERT INTO calibration_runs (
           public_id, version, station_id, river_reach_id, datum_id,
           model_kind, model_version, feature_version, split_strategy,
           train_start, train_end, validation_start, validation_end,
           test_start, test_end,
           validation_mae_m, validation_rmse_m, validation_sample_count,
           test_mae_m, test_rmse_m, test_sample_count, accepted_test_rmse_m,
           source_summary, artifact_checksum_sha256, artifact_uri,
           deployment_status, validated_at, metadata
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9,
           $10, $11, $12, $13,
           $14, $15,
           $16, $17, $18,
           $19, $20, $21, $22,
           $23::jsonb, $24, $25,
           $26, $27, $28::jsonb
         )
         ON CONFLICT (public_id) DO NOTHING
         RETURNING id::text AS id`,
        [
          run.id,
          run.version,
          stationId,
          reachId,
          run.datumId,
          run.modelKind,
          run.modelVersion,
          run.featureVersion,
          run.splitStrategy,
          run.trainPeriod.start,
          run.trainPeriod.end,
          run.validationPeriod.start,
          run.validationPeriod.end,
          run.testPeriod?.start ?? null,
          run.testPeriod?.end ?? null,
          run.validationMetrics?.maeM ?? null,
          run.validationMetrics?.rmseM ?? null,
          run.validationMetrics?.sampleCount ?? null,
          run.testMetrics?.maeM ?? null,
          run.testMetrics?.rmseM ?? null,
          run.testMetrics?.sampleCount ?? null,
          run.acceptedTestRmseM,
          JSON.stringify(sourceSummary),
          run.artifactChecksumSha256,
          options.artifactUri ?? null,
          run.deploymentStatus,
          options.validatedAtUtc ?? null,
          JSON.stringify(options.metadata ?? {}),
        ],
      );

      const existing = await client.query<{
        id: string;
        artifact_checksum_sha256: string;
        datum_id: string;
      }>(
        `SELECT id::text AS id, artifact_checksum_sha256, datum_id
         FROM calibration_runs
         WHERE public_id = $1`,
        [run.id],
      );
      const row = existing.rows[0];
      const runId = inserted.rows[0]?.id ?? row?.id;
      if (!runId) throw new Error('Calibration run insert did not return an id.');
      if (
        row &&
        (row.artifact_checksum_sha256 !== run.artifactChecksumSha256 ||
          row.datum_id !== run.datumId)
      ) {
        throw new Error(
          'Existing calibration public id has different scientific evidence.',
        );
      }

      for (const breakdown of run.metricBreakdowns) {
        await client.query(
          `INSERT INTO calibration_metric_breakdowns (
             calibration_run_id, dataset_split, lead_seconds, season,
             event_subset, mae_m, rmse_m, sample_count
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            runId,
            breakdown.datasetSplit,
            breakdown.leadSeconds,
            breakdown.season,
            breakdown.eventSubset,
            breakdown.metrics.maeM,
            breakdown.metrics.rmseM,
            breakdown.metrics.sampleCount,
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

  async saveRatingCurve(rawCurve: RatingCurveModel): Promise<string> {
    const curve = RatingCurveModelSchema.parse(rawCurve);
    if (curve.status === 'ACTIVE') {
      throw new RangeError(
        'Rating curves must be activated through the evidence-gated activation transaction.',
      );
    }

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const calibration = await client.query<{
        id: string;
        station_id: string;
        river_reach_id: string;
      }>(
        `SELECT id::text AS id, station_id::text AS station_id,
                river_reach_id::text AS river_reach_id
         FROM calibration_runs WHERE public_id = $1`,
        [curve.calibrationRunId],
      );
      const calibrationRow = calibration.rows[0];
      if (!calibrationRow) {
        throw new RangeError(`Unknown calibration run ${curve.calibrationRunId}`);
      }

      const stationId = await this.stationId(client, curve.stationId);
      const reachId = await this.reachId(client, curve.riverReachId);
      if (
        calibrationRow.station_id !== stationId ||
        calibrationRow.river_reach_id !== reachId
      ) {
        throw new RangeError(
          'Rating curve station/reach does not match its calibration run.',
        );
      }

      const checksum = curveChecksum(curve);
      const inserted = await client.query<IdentityRow>(
        `INSERT INTO rating_curves (
           public_id, station_id, river_reach_id, calibration_run_id,
           curve_version, datum_id, method, stage_unit, discharge_unit,
           valid_discharge_min_cms, valid_discharge_max_cms,
           extrapolation_policy, status, curve_checksum_sha256
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
         )
         ON CONFLICT (public_id) DO NOTHING
         RETURNING id::text AS id`,
        [
          curve.id,
          stationId,
          reachId,
          calibrationRow.id,
          curve.version,
          curve.datumId,
          curve.method,
          curve.stageUnit,
          curve.dischargeUnit,
          curve.validDischargeMinCms,
          curve.validDischargeMaxCms,
          curve.extrapolationPolicy,
          curve.status,
          checksum,
        ],
      );
      const existing = await client.query<{
        id: string;
        curve_checksum_sha256: string;
      }>(
        `SELECT id::text AS id, curve_checksum_sha256
         FROM rating_curves WHERE public_id = $1`,
        [curve.id],
      );
      const row = existing.rows[0];
      const curveId = inserted.rows[0]?.id ?? row?.id;
      if (!curveId) throw new Error('Rating curve insert did not return an id.');
      if (row && row.curve_checksum_sha256 !== checksum) {
        throw new Error(
          'Existing rating curve public id has a different scientific checksum.',
        );
      }

      for (const [index, point] of curve.points.entries()) {
        await client.query(
          `INSERT INTO rating_curve_points (
             rating_curve_id, point_order, discharge_cms, stage_m
           ) VALUES ($1, $2, $3, $4)
           ON CONFLICT (rating_curve_id, point_order) DO NOTHING`,
          [curveId, index, point.dischargeCms, point.stageM],
        );
      }

      await client.query('COMMIT');
      return curveId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async activateRatingCurve(
    curvePublicId: string,
    activatedAtUtc: string,
  ): Promise<void> {
    await this.deployRatingCurve(curvePublicId, activatedAtUtc, false);
  }

  async rollbackToRatingCurve(
    curvePublicId: string,
    activatedAtUtc: string,
  ): Promise<void> {
    await this.deployRatingCurve(curvePublicId, activatedAtUtc, true);
  }

  async findActiveCurveForReach(
    riverReachPublicId: string,
    atUtc: string,
  ): Promise<ActiveRatingCurveEvidence | null> {
    return this.findActiveCurve('reach', riverReachPublicId, atUtc);
  }

  async findActiveCurveForStation(
    stationPublicId: string,
    atUtc: string,
  ): Promise<ActiveRatingCurveEvidence | null> {
    return this.findActiveCurve('station', stationPublicId, atUtc);
  }

  async findCalibrationMetrics(
    calibrationPublicId: string,
  ): Promise<CalibrationRunSummary | null> {
    if (calibrationPublicId.trim().length === 0) {
      throw new RangeError('calibrationPublicId must not be empty');
    }
    const result = await this.database().query<CalibrationRow>(
      `SELECT
         cr.id::text AS id, cr.public_id, cr.version,
         s.public_id AS station_public_id,
         rr.public_id AS river_reach_public_id,
         cr.datum_id, cr.source_summary, cr.model_kind, cr.model_version,
         cr.feature_version, cr.split_strategy,
         cr.train_start, cr.train_end, cr.validation_start, cr.validation_end,
         cr.test_start, cr.test_end,
         cr.validation_mae_m, cr.validation_rmse_m, cr.validation_sample_count,
         cr.test_mae_m, cr.test_rmse_m, cr.test_sample_count,
         cr.accepted_test_rmse_m, cr.artifact_checksum_sha256,
         cr.deployment_status
       FROM calibration_runs cr
       JOIN stations s ON s.id = cr.station_id
       JOIN river_reaches rr ON rr.id = cr.river_reach_id
       WHERE cr.public_id = $1
       LIMIT 1`,
      [calibrationPublicId],
    );
    const row = result.rows[0];
    if (!row) return null;
    const breakdowns = await this.metricBreakdowns(row.id);
    return this.calibrationFromRow(row, breakdowns);
  }

  private async findActiveCurve(
    by: 'reach' | 'station',
    publicId: string,
    atUtc: string,
  ): Promise<ActiveRatingCurveEvidence | null> {
    if (publicId.trim().length === 0) {
      throw new RangeError('calibration lookup id must not be empty');
    }
    assertInstant(atUtc, 'atUtc');
    const predicate = by === 'reach' ? 'rr.public_id = $1' : 's.public_id = $1';

    const result = await this.database().query<CurveRow>(
      `SELECT
         rc.id::text AS id, rc.public_id, rc.curve_version,
         rc.station_id::text AS station_id, s.public_id AS station_public_id,
         s.default_datum_id AS station_datum_id,
         rc.river_reach_id::text AS river_reach_id,
         rr.public_id AS river_reach_public_id,
         rc.calibration_run_id::text AS calibration_run_id,
         cr.public_id AS calibration_public_id,
         rc.datum_id, rc.method, rc.stage_unit, rc.discharge_unit,
         rc.valid_discharge_min_cms, rc.valid_discharge_max_cms,
         rc.extrapolation_policy, rc.status, rc.curve_checksum_sha256,
         grl.confidence AS link_confidence
       FROM rating_curves rc
       JOIN calibration_runs cr ON cr.id = rc.calibration_run_id
       JOIN stations s ON s.id = rc.station_id
       JOIN river_reaches rr ON rr.id = rc.river_reach_id
       JOIN gauge_reach_links grl
         ON grl.station_id = rc.station_id
        AND grl.river_reach_id = rc.river_reach_id
        AND grl.link_state = 'MAPPED'
        AND grl.effective_from <= $2::timestamptz
        AND (grl.effective_to IS NULL OR grl.effective_to >= $2::timestamptz)
       WHERE ${predicate}
         AND rc.status = 'ACTIVE'
         AND cr.deployment_status = 'ACTIVE'
         AND rc.effective_from <= $2::timestamptz
         AND (rc.effective_to IS NULL OR rc.effective_to >= $2::timestamptz)
       ORDER BY grl.confidence DESC, rc.effective_from DESC, rc.public_id ASC
       LIMIT 1`,
      [publicId, atUtc],
    );
    const row = result.rows[0];
    if (!row) return null;
    if (!row.station_datum_id) {
      throw new Error('Active stage calibration station has no datum.');
    }

    const curve = await this.curveFromRow(row);
    const calibration = await this.findCalibrationMetrics(
      row.calibration_public_id,
    );
    if (!calibration) {
      throw new Error('Active rating curve references a missing calibration run.');
    }
    return {
      stationDatumId: row.station_datum_id,
      linkConfidence:
        row.link_confidence === null ? 0 : asNumber(row.link_confidence),
      curve,
      calibration,
    };
  }

  private async deployRatingCurve(
    curvePublicId: string,
    activatedAtUtc: string,
    rollback: boolean,
  ): Promise<void> {
    if (curvePublicId.trim().length === 0) {
      throw new RangeError('curvePublicId must not be empty');
    }
    assertInstant(activatedAtUtc, 'activatedAtUtc');

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const targetResult = await client.query<TargetDeploymentRow>(
        `SELECT
           rc.id::text AS id, rc.public_id, rc.curve_version,
           rc.station_id::text AS station_id, s.public_id AS station_public_id,
           s.default_datum_id AS station_datum_id,
           rc.river_reach_id::text AS river_reach_id,
           rr.public_id AS river_reach_public_id,
           rc.calibration_run_id::text AS calibration_run_id,
           cr.public_id AS calibration_public_id,
           rc.datum_id, rc.method, rc.stage_unit, rc.discharge_unit,
           rc.valid_discharge_min_cms, rc.valid_discharge_max_cms,
           rc.extrapolation_policy, rc.status, rc.curve_checksum_sha256,
           NULL::numeric AS link_confidence,
           cr.datum_id AS calibration_datum_id,
           cr.deployment_status AS calibration_deployment_status,
           cr.validation_mae_m, cr.validation_rmse_m, cr.validation_sample_count,
           cr.test_start, cr.test_end,
           cr.test_mae_m, cr.test_rmse_m, cr.test_sample_count,
           cr.accepted_test_rmse_m, cr.validated_at
         FROM rating_curves rc
         JOIN calibration_runs cr ON cr.id = rc.calibration_run_id
         JOIN stations s ON s.id = rc.station_id
         JOIN river_reaches rr ON rr.id = rc.river_reach_id
         WHERE rc.public_id = $1
         FOR UPDATE OF rc, cr`,
        [curvePublicId],
      );
      const target = targetResult.rows[0];
      if (!target) throw new RangeError(`Unknown rating curve ${curvePublicId}`);
      if (
        target.status === 'REJECTED' ||
        target.calibration_deployment_status === 'REJECTED'
      ) {
        throw new RangeError('Rejected calibration/curve cannot be activated.');
      }
      if (
        !target.station_datum_id ||
        target.station_datum_id !== target.datum_id ||
        target.calibration_datum_id !== target.datum_id
      ) {
        throw new RangeError(
          'Rating curve datum is incompatible with gauge/calibration datum.',
        );
      }
      if (
        target.validated_at === null ||
        target.validation_mae_m === null ||
        target.validation_rmse_m === null ||
        target.validation_sample_count === null ||
        target.test_start === null ||
        target.test_end === null ||
        target.test_mae_m === null ||
        target.test_rmse_m === null ||
        target.test_sample_count === null ||
        target.accepted_test_rmse_m === null ||
        asNumber(target.test_rmse_m) > asNumber(target.accepted_test_rmse_m)
      ) {
        throw new RangeError(
          'Rating curve calibration has insufficient or unacceptable held-out evidence.',
        );
      }

      const leadBreakdown = await client.query<IdentityRow>(
        `SELECT cr.id::text AS id
         FROM calibration_runs cr
         JOIN calibration_metric_breakdowns cmb
           ON cmb.calibration_run_id = cr.id
         WHERE cr.id = $1::uuid
           AND cmb.dataset_split = 'TEST'
           AND cmb.lead_seconds IS NOT NULL
         LIMIT 1`,
        [target.calibration_run_id],
      );
      if (!leadBreakdown.rows[0]) {
        throw new RangeError(
          'Active stage calibration requires held-out lead-time metrics.',
        );
      }

      const link = await client.query<IdentityRow>(
        `SELECT id::text AS id
         FROM gauge_reach_links
         WHERE station_id = $1::uuid
           AND river_reach_id = $2::uuid
           AND link_state = 'MAPPED'
           AND effective_from <= $3::timestamptz
           AND (effective_to IS NULL OR effective_to >= $3::timestamptz)
         ORDER BY confidence DESC
         LIMIT 1`,
        [target.station_id, target.river_reach_id, activatedAtUtc],
      );
      if (!link.rows[0]) {
        throw new RangeError(
          'Rating curve station is not unambiguously linked to the river reach.',
        );
      }

      const scientificCurve = await this.curveFromRow(target, client);
      if (curveChecksum(scientificCurve) !== target.curve_checksum_sha256) {
        throw new Error('Rating curve checksum does not match stored points.');
      }

      const current = await client.query<{
        curve_id: string;
        calibration_run_id: string;
        curve_public_id: string;
      }>(
        `SELECT rc.id::text AS curve_id,
                rc.calibration_run_id::text AS calibration_run_id,
                rc.public_id AS curve_public_id
         FROM rating_curves rc
         JOIN calibration_runs cr ON cr.id = rc.calibration_run_id
         WHERE rc.station_id = $1::uuid
           AND rc.river_reach_id = $2::uuid
           AND rc.datum_id = $3
           AND rc.status = 'ACTIVE'
           AND cr.deployment_status = 'ACTIVE'
         FOR UPDATE OF rc, cr`,
        [target.station_id, target.river_reach_id, target.datum_id],
      );
      const active = current.rows[0];
      if (active?.curve_public_id === curvePublicId) {
        await client.query('COMMIT');
        return;
      }

      if (active) {
        await client.query(
          `UPDATE rating_curves
           SET status = 'SUPERSEDED', effective_to = $2::timestamptz,
               updated_at = now()
           WHERE id = $1::uuid`,
          [active.curve_id, activatedAtUtc],
        );
        await client.query(
          `UPDATE calibration_runs
           SET deployment_status = $2,
               rolled_back_at =
                 CASE WHEN $2 = 'ROLLED_BACK' THEN $3::timestamptz
                      ELSE rolled_back_at END,
               updated_at = now()
           WHERE id = $1::uuid`,
          [
            active.calibration_run_id,
            rollback ? 'ROLLED_BACK' : 'SUPERSEDED',
            activatedAtUtc,
          ],
        );
      }

      await client.query(
        `UPDATE calibration_runs
         SET deployment_status = 'ACTIVE',
             activated_at = $2::timestamptz,
             rolled_back_at = NULL, updated_at = now()
         WHERE id = $1::uuid`,
        [target.calibration_run_id, activatedAtUtc],
      );
      await client.query(
        `UPDATE rating_curves
         SET status = 'ACTIVE', effective_from = $2::timestamptz,
             effective_to = NULL, updated_at = now()
         WHERE id = $1::uuid`,
        [target.id, activatedAtUtc],
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async curveFromRow(
    row: CurveRow,
    client?: PoolClient,
  ): Promise<RatingCurveModel> {
    const result = client
      ? await client.query<CurvePointRow>(
          `SELECT point_order, discharge_cms, stage_m
           FROM rating_curve_points
           WHERE rating_curve_id = $1::uuid
           ORDER BY point_order ASC`,
          [row.id],
        )
      : await this.database().query<CurvePointRow>(
          `SELECT point_order, discharge_cms, stage_m
           FROM rating_curve_points
           WHERE rating_curve_id = $1::uuid
           ORDER BY point_order ASC`,
          [row.id],
        );

    return RatingCurveModelSchema.parse({
      id: row.public_id,
      version: row.curve_version,
      stationId: row.station_public_id,
      riverReachId: row.river_reach_public_id,
      calibrationRunId: row.calibration_public_id,
      datumId: row.datum_id,
      method: row.method,
      stageUnit: row.stage_unit,
      dischargeUnit: row.discharge_unit,
      validDischargeMinCms: asNumber(row.valid_discharge_min_cms),
      validDischargeMaxCms: asNumber(row.valid_discharge_max_cms),
      extrapolationPolicy: row.extrapolation_policy,
      status: row.status,
      points: result.rows.map((point) => ({
        dischargeCms: asNumber(point.discharge_cms),
        stageM: asNumber(point.stage_m),
      })),
    });
  }

  private async metricBreakdowns(
    calibrationRunId: string,
  ): Promise<CalibrationMetricBreakdown[]> {
    const result = await this.database().query<MetricBreakdownRow>(
      `SELECT dataset_split, lead_seconds, season, event_subset,
              mae_m, rmse_m, sample_count
       FROM calibration_metric_breakdowns
       WHERE calibration_run_id = $1::uuid
       ORDER BY dataset_split, lead_seconds NULLS LAST, season NULLS LAST,
                event_subset NULLS LAST`,
      [calibrationRunId],
    );
    return result.rows.map((row) => ({
      datasetSplit: row.dataset_split,
      leadSeconds: row.lead_seconds,
      season: row.season,
      eventSubset: row.event_subset,
      metrics: {
        maeM: asNumber(row.mae_m),
        rmseM: asNumber(row.rmse_m),
        sampleCount: row.sample_count,
      },
    }));
  }

  private calibrationFromRow(
    row: CalibrationRow,
    metricBreakdowns: CalibrationMetricBreakdown[],
  ): CalibrationRunSummary {
    const ids = sourceIds(row.source_summary);
    return CalibrationRunSummarySchema.parse({
      id: row.public_id,
      version: row.version,
      stationId: row.station_public_id,
      riverReachId: row.river_reach_public_id,
      datumId: row.datum_id,
      sourceIds: ids,
      modelKind: row.model_kind,
      modelVersion: row.model_version,
      featureVersion: row.feature_version,
      splitStrategy: row.split_strategy,
      trainPeriod: { start: asIso(row.train_start), end: asIso(row.train_end) },
      validationPeriod: {
        start: asIso(row.validation_start),
        end: asIso(row.validation_end),
      },
      testPeriod: nullablePeriod(row.test_start, row.test_end),
      validationMetrics: metrics(
        row.validation_mae_m,
        row.validation_rmse_m,
        row.validation_sample_count,
      ),
      testMetrics: metrics(
        row.test_mae_m,
        row.test_rmse_m,
        row.test_sample_count,
      ),
      acceptedTestRmseM:
        row.accepted_test_rmse_m === null
          ? null
          : asNumber(row.accepted_test_rmse_m),
      metricBreakdowns,
      artifactChecksumSha256: row.artifact_checksum_sha256,
      deploymentStatus: row.deployment_status,
    });
  }

  private async stationId(
    client: PoolClient,
    publicId: string,
  ): Promise<string> {
    const result = await client.query<IdentityRow>(
      `SELECT id::text AS id FROM stations WHERE public_id = $1`,
      [publicId],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new RangeError(`Unknown station ${publicId}`);
    return id;
  }

  private async reachId(
    client: PoolClient,
    publicId: string,
  ): Promise<string> {
    const result = await client.query<IdentityRow>(
      `SELECT id::text AS id FROM river_reaches WHERE public_id = $1`,
      [publicId],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new RangeError(`Unknown river reach ${publicId}`);
    return id;
  }
}
