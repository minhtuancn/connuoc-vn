import { createHash } from 'node:crypto';

import {
  CalibrationMetricBreakdownSchema,
  CalibrationRunSummarySchema,
  RatingCurveModelSchema,
  type CalibrationMetricBreakdown,
  type CalibrationRunSummary,
  type RatingCurveModel,
} from '@connuoc/shared-types';
import type { Pool, PoolClient } from 'pg';

export interface SaveCalibrationRunOptions {
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

interface ExistingCalibrationRow {
  id: string;
  artifact_checksum_sha256: string;
}

interface ExistingCurveRow {
  id: string;
  curve_checksum_sha256: string;
}

interface CalibrationRow {
  id: string;
  public_id: string;
  version: string;
  station_id: string;
  station_public_id: string;
  river_reach_id: string;
  river_reach_public_id: string;
  datum_id: string;
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
  source_summary: unknown;
  artifact_checksum_sha256: string;
  deployment_status: CalibrationRunSummary['deploymentStatus'];
  validated_at: Date | string | null;
  activated_at: Date | string | null;
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

interface DeploymentRow extends CurveRow {
  calibration_datum_id: string;
  calibration_deployment_status: CalibrationRunSummary['deploymentStatus'];
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
  source_summary: unknown;
  artifact_checksum_sha256: string;
  validated_at: Date | string | null;
}

interface CurvePointRow {
  point_order: number;
  discharge_cms: number | string;
  stage_m: number | string;
}

interface BreakdownRow {
  dataset_split: 'VALIDATION' | 'TEST';
  lead_seconds: number | null;
  season: string | null;
  event_subset: string | null;
  mae_m: number | string;
  rmse_m: number | string;
  sample_count: number;
}

function asNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function asIso(value: Date | string): string {
  const iso =
    value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString();
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
  if (mae === null || rmse === null || sampleCount === null) {
    return null;
  }
  return {
    maeM: asNumber(mae),
    rmseM: asNumber(rmse),
    sampleCount,
  };
}

function sourceIds(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (item) =>
        typeof item !== 'string' || item.trim().length === 0,
    )
  ) {
    throw new TypeError(
      'calibration source_summary must be a non-empty source-id array',
    );
  }
  return value as string[];
}

function assertInstant(value: string, field: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new RangeError(`${field} must be a valid ISO instant`);
  }
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

function breakdownFromRow(
  row: BreakdownRow,
): CalibrationMetricBreakdown {
  return CalibrationMetricBreakdownSchema.parse({
    datasetSplit: row.dataset_split,
    leadSeconds: row.lead_seconds,
    season: row.season,
    eventSubset: row.event_subset,
    metrics: {
      maeM: asNumber(row.mae_m),
      rmseM: asNumber(row.rmse_m),
      sampleCount: row.sample_count,
    },
  });
}

export class CalibrationRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new Error('Calibration database is not configured.');
    }
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
    if (options.validatedAtUtc != null) {
      assertInstant(options.validatedAtUtc, 'validatedAtUtc');
    }

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const stationId = await this.stationId(client, run.stationId);
      const reachId = await this.reachId(client, run.riverReachId);

      const inserted = await client.query<IdentityRow>(
        `INSERT INTO calibration_runs (
           public_id, version, station_id, river_reach_id, datum_id,
           model_kind, model_version, feature_version, split_strategy,
           train_start, train_end, validation_start, validation_end,
           test_start, test_end,
           validation_mae_m, validation_rmse_m, validation_sample_count,
           test_mae_m, test_rmse_m, test_sample_count,
           accepted_test_rmse_m, source_summary,
           artifact_checksum_sha256, artifact_uri,
           deployment_status, validated_at, metadata
         ) VALUES (
           $1, $2, $3, $4, $5,
           $6, $7, $8, $9,
           $10, $11, $12, $13,
           $14, $15,
           $16, $17, $18,
           $19, $20, $21,
           $22, $23::jsonb,
           $24, $25,
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
          JSON.stringify(run.sourceIds),
          run.artifactChecksumSha256,
          options.artifactUri ?? null,
          run.deploymentStatus,
          options.validatedAtUtc ?? null,
          JSON.stringify(options.metadata ?? {}),
        ],
      );

      let runId = inserted.rows[0]?.id;
      if (!runId) {
        const existing =
          await client.query<ExistingCalibrationRow>(
            `SELECT id::text AS id, artifact_checksum_sha256::text
             FROM calibration_runs
             WHERE public_id = $1`,
            [run.id],
          );
        const row = existing.rows[0];
        if (!row) {
          throw new Error(
            'Calibration run insert did not return or resolve an id.',
          );
        }
        if (
          row.artifact_checksum_sha256 !==
          run.artifactChecksumSha256
        ) {
          throw new Error(
            'Existing calibration public id has a different artifact checksum.',
          );
        }
        runId = row.id;
      }

      for (const item of run.metricBreakdowns) {
        await client.query(
          `INSERT INTO calibration_metric_breakdowns (
             calibration_run_id, dataset_split, lead_seconds,
             season, event_subset, mae_m, rmse_m, sample_count
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (
             calibration_run_id, dataset_split, lead_seconds,
             season, event_subset
           ) DO NOTHING`,
          [
            runId,
            item.datasetSplit,
            item.leadSeconds,
            item.season,
            item.eventSubset,
            item.metrics.maeM,
            item.metrics.rmseM,
            item.metrics.sampleCount,
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

  async saveRatingCurve(
    rawCurve: RatingCurveModel,
  ): Promise<string> {
    const curve = RatingCurveModelSchema.parse(rawCurve);
    if (curve.status === 'ACTIVE') {
      throw new RangeError(
        'Rating curves must be activated through the evidence-gated activation transaction.',
      );
    }

    const client = await this.database().connect();
    try {
      await client.query('BEGIN');

      const stationId = await this.stationId(client, curve.stationId);
      const reachId = await this.reachId(client, curve.riverReachId);
      const calibration = await client.query<{
        id: string;
        station_id: string;
        river_reach_id: string;
        datum_id: string;
      }>(
        `SELECT
           id::text AS id,
           station_id::text AS station_id,
           river_reach_id::text AS river_reach_id,
           datum_id
         FROM calibration_runs
         WHERE public_id = $1`,
        [curve.calibrationRunId],
      );
      const calibrationRow = calibration.rows[0];
      if (!calibrationRow) {
        throw new RangeError(
          `Unknown calibration run ${curve.calibrationRunId}`,
        );
      }
      if (
        calibrationRow.station_id !== stationId ||
        calibrationRow.river_reach_id !== reachId ||
        calibrationRow.datum_id !== curve.datumId
      ) {
        throw new RangeError(
          'Rating curve station/reach/datum does not match its calibration run.',
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
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12, $13, $14
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

      let curveId = inserted.rows[0]?.id;
      let isNew = true;
      if (!curveId) {
        isNew = false;
        const existing =
          await client.query<ExistingCurveRow>(
            `SELECT id::text AS id, curve_checksum_sha256::text
             FROM rating_curves
             WHERE public_id = $1`,
            [curve.id],
          );
        const row = existing.rows[0];
        if (!row) {
          throw new Error(
            'Rating curve insert did not return or resolve an id.',
          );
        }
        if (row.curve_checksum_sha256 !== checksum) {
          throw new Error(
            'Existing rating curve public id has a different scientific checksum.',
          );
        }
        curveId = row.id;
      }

      if (isNew) {
        for (const [index, point] of curve.points.entries()) {
          await client.query(
            `INSERT INTO rating_curve_points (
               rating_curve_id, point_order, discharge_cms, stage_m
             ) VALUES ($1, $2, $3, $4)`,
            [
              curveId,
              index,
              point.dischargeCms,
              point.stageM,
            ],
          );
        }
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
    await this.deployRatingCurve(
      curvePublicId,
      activatedAtUtc,
      false,
    );
  }

  async rollbackToRatingCurve(
    curvePublicId: string,
    activatedAtUtc: string,
  ): Promise<void> {
    await this.deployRatingCurve(
      curvePublicId,
      activatedAtUtc,
      true,
    );
  }

  async findActiveCurveForReach(
    riverReachPublicId: string,
    atUtc: string,
  ): Promise<ActiveRatingCurveEvidence | null> {
    if (riverReachPublicId.trim().length === 0) {
      throw new RangeError(
        'riverReachPublicId must not be empty',
      );
    }
    assertInstant(atUtc, 'atUtc');

    const result = await this.database().query<DeploymentRow>(
      this.deploymentQuery(
        `rr.public_id = $1
         AND rc.status = 'ACTIVE'
         AND cr.deployment_status = 'ACTIVE'
         AND grl.link_state = 'MAPPED'
         AND rc.effective_from <= $2::timestamptz
         AND (rc.effective_to IS NULL OR rc.effective_to >= $2::timestamptz)
         AND grl.effective_from <= $2::timestamptz
         AND (grl.effective_to IS NULL OR grl.effective_to >= $2::timestamptz)`,
        `ORDER BY grl.confidence DESC, rc.effective_from DESC, rc.public_id ASC
         LIMIT 2`,
      ),
      [riverReachPublicId, atUtc],
    );

    if (result.rows.length === 0) return null;
    if (result.rows.length > 1) {
      throw new Error(
        'Multiple active stage calibrations exist for this river reach; station selection is required.',
      );
    }

    return this.materializeActive(result.rows[0]!);
  }

  async findCalibrationMetrics(
    calibrationPublicId: string,
  ): Promise<CalibrationRunSummary | null> {
    if (calibrationPublicId.trim().length === 0) {
      throw new RangeError(
        'calibrationPublicId must not be empty',
      );
    }

    const result = await this.database().query<CalibrationRow>(
      `SELECT
         cr.id::text AS id,
         cr.public_id,
         cr.version,
         cr.station_id::text AS station_id,
         s.public_id AS station_public_id,
         cr.river_reach_id::text AS river_reach_id,
         rr.public_id AS river_reach_public_id,
         cr.datum_id,
         cr.model_kind,
         cr.model_version,
         cr.feature_version,
         cr.split_strategy,
         cr.train_start,
         cr.train_end,
         cr.validation_start,
         cr.validation_end,
         cr.test_start,
         cr.test_end,
         cr.validation_mae_m,
         cr.validation_rmse_m,
         cr.validation_sample_count,
         cr.test_mae_m,
         cr.test_rmse_m,
         cr.test_sample_count,
         cr.accepted_test_rmse_m,
         cr.source_summary,
         cr.artifact_checksum_sha256::text,
         cr.deployment_status,
         cr.validated_at,
         cr.activated_at
       FROM calibration_runs cr
       JOIN stations s ON s.id = cr.station_id
       JOIN river_reaches rr ON rr.id = cr.river_reach_id
       WHERE cr.public_id = $1
       LIMIT 1`,
      [calibrationPublicId],
    );
    const row = result.rows[0];
    if (!row) return null;

    const breakdowns = await this.breakdowns(
      this.database(),
      row.id,
    );
    return this.calibrationFromRow(row, breakdowns);
  }

  async findCalibrationMetricsBreakdown(
    calibrationPublicId: string,
  ): Promise<readonly CalibrationMetricBreakdown[]> {
    const id = await this.database().query<IdentityRow>(
      `SELECT id::text AS id
       FROM calibration_runs
       WHERE public_id = $1`,
      [calibrationPublicId],
    );
    const runId = id.rows[0]?.id;
    if (!runId) return [];
    return this.breakdowns(this.database(), runId);
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

      const targetResult = await client.query<DeploymentRow>(
        this.deploymentQuery(
          'rc.public_id = $1',
          'FOR UPDATE OF rc, cr',
        ),
        [curvePublicId],
      );
      const target = targetResult.rows[0];
      if (!target) {
        throw new RangeError(
          `Unknown rating curve ${curvePublicId}`,
        );
      }
      if (
        target.status === 'REJECTED' ||
        target.calibration_deployment_status ===
          'REJECTED'
      ) {
        throw new RangeError(
          'Rejected calibration artifacts cannot be activated.',
        );
      }
      if (
        target.station_datum_id === null ||
        target.station_datum_id !== target.datum_id ||
        target.calibration_datum_id !== target.datum_id
      ) {
        throw new RangeError(
          'Rating curve datum is incompatible with the gauge/calibration datum.',
        );
      }
      if (target.validated_at === null) {
        throw new RangeError(
          'Rating curve calibration has not been validated.',
        );
      }
      const activeLink = await client.query<{ confidence: number | string }>(
        `SELECT confidence
         FROM gauge_reach_links
         WHERE station_id = $1::uuid
           AND river_reach_id = $2::uuid
           AND link_state = 'MAPPED'
           AND effective_from <= $3::timestamptz
           AND (effective_to IS NULL OR effective_to >= $3::timestamptz)
         ORDER BY confidence DESC
         LIMIT 1`,
        [
          target.station_id,
          target.river_reach_id,
          activatedAtUtc,
        ],
      );
      if (!activeLink.rows[0]) {
        throw new RangeError(
          'Rating curve station is not actively mapped to the river reach.',
        );
      }

      const points = await this.curvePoints(
        client,
        target.id,
      );
      const curve = RatingCurveModelSchema.parse({
        id: target.public_id,
        version: target.curve_version,
        stationId: target.station_public_id,
        riverReachId: target.river_reach_public_id,
        calibrationRunId: target.calibration_public_id,
        datumId: target.datum_id,
        method: target.method,
        stageUnit: target.stage_unit,
        dischargeUnit: target.discharge_unit,
        validDischargeMinCms:
          asNumber(target.valid_discharge_min_cms),
        validDischargeMaxCms:
          asNumber(target.valid_discharge_max_cms),
        extrapolationPolicy:
          target.extrapolation_policy,
        status: target.status,
        points,
      });
      if (
        curveChecksum(curve) !==
        target.curve_checksum_sha256
      ) {
        throw new Error(
          'Rating curve checksum does not match stored scientific points.',
        );
      }

      const breakdowns = await this.breakdowns(
        client,
        target.calibration_run_id,
      );
      CalibrationRunSummarySchema.parse({
        id: target.calibration_public_id,
        version: target.calibration_version,
        stationId: target.station_public_id,
        riverReachId: target.river_reach_public_id,
        datumId: target.calibration_datum_id,
        sourceIds: sourceIds(target.source_summary),
        modelKind: target.model_kind,
        modelVersion: target.model_version,
        featureVersion: target.feature_version,
        splitStrategy: target.split_strategy,
        trainPeriod: {
          start: asIso(target.train_start),
          end: asIso(target.train_end),
        },
        validationPeriod: {
          start: asIso(target.validation_start),
          end: asIso(target.validation_end),
        },
        testPeriod: nullablePeriod(
          target.test_start,
          target.test_end,
        ),
        validationMetrics: metrics(
          target.validation_mae_m,
          target.validation_rmse_m,
          target.validation_sample_count,
        ),
        testMetrics: metrics(
          target.test_mae_m,
          target.test_rmse_m,
          target.test_sample_count,
        ),
        acceptedTestRmseM:
          target.accepted_test_rmse_m === null
            ? null
            : asNumber(
                target.accepted_test_rmse_m,
              ),
        metricBreakdowns: breakdowns,
        artifactChecksumSha256:
          target.artifact_checksum_sha256,
        deploymentStatus: 'ACTIVE',
      });

      const current = await client.query<{
        curve_id: string;
        calibration_run_id: string;
      }>(
        `SELECT
           rc.id::text AS curve_id,
           rc.calibration_run_id::text AS calibration_run_id
         FROM rating_curves rc
         JOIN calibration_runs cr
           ON cr.id = rc.calibration_run_id
         WHERE rc.station_id = $1::uuid
           AND rc.river_reach_id = $2::uuid
           AND rc.datum_id = $3
           AND rc.status = 'ACTIVE'
           AND cr.deployment_status = 'ACTIVE'
           AND rc.id <> $4::uuid
         FOR UPDATE OF rc, cr`,
        [
          target.station_id,
          target.river_reach_id,
          target.datum_id,
          target.id,
        ],
      );

      const active = current.rows[0];
      if (active) {
        await client.query(
          `UPDATE rating_curves
           SET status = 'SUPERSEDED',
               effective_to = $2::timestamptz,
               updated_at = now()
           WHERE id = $1::uuid`,
          [active.curve_id, activatedAtUtc],
        );
        await client.query(
          `UPDATE calibration_runs
           SET deployment_status = $2,
               rolled_back_at =
                 CASE
                   WHEN $2 = 'ROLLED_BACK'
                   THEN $3::timestamptz
                   ELSE rolled_back_at
                 END,
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
             validated_at = COALESCE(
               validated_at,
               $2::timestamptz
             ),
             activated_at = $2::timestamptz,
             rolled_back_at = NULL,
             updated_at = now()
         WHERE id = $1::uuid`,
        [target.calibration_run_id, activatedAtUtc],
      );
      await client.query(
        `UPDATE rating_curves
         SET status = 'ACTIVE',
             effective_from = $2::timestamptz,
             effective_to = NULL,
             updated_at = now()
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

  private async materializeActive(
    row: DeploymentRow,
  ): Promise<ActiveRatingCurveEvidence> {
    if (row.station_datum_id === null) {
      throw new Error(
        'Active stage calibration station has no datum.',
      );
    }
    const [points, breakdowns] = await Promise.all([
      this.curvePoints(this.database(), row.id),
      this.breakdowns(
        this.database(),
        row.calibration_run_id,
      ),
    ]);

    return {
      stationDatumId: row.station_datum_id,
      linkConfidence:
        row.link_confidence === null
          ? 0
          : asNumber(row.link_confidence),
      curve: RatingCurveModelSchema.parse({
        id: row.public_id,
        version: row.curve_version,
        stationId: row.station_public_id,
        riverReachId: row.river_reach_public_id,
        calibrationRunId: row.calibration_public_id,
        datumId: row.datum_id,
        method: row.method,
        stageUnit: row.stage_unit,
        dischargeUnit: row.discharge_unit,
        validDischargeMinCms:
          asNumber(row.valid_discharge_min_cms),
        validDischargeMaxCms:
          asNumber(row.valid_discharge_max_cms),
        extrapolationPolicy:
          row.extrapolation_policy,
        status: row.status,
        points,
      }),
      calibration: this.calibrationFromRow(
        {
          id: row.calibration_run_id,
          public_id: row.calibration_public_id,
          version: row.calibration_version,
          station_id: row.station_id,
          station_public_id: row.station_public_id,
          river_reach_id: row.river_reach_id,
          river_reach_public_id: row.river_reach_public_id,
          datum_id: row.calibration_datum_id,
          model_kind: row.model_kind,
          model_version: row.model_version,
          feature_version: row.feature_version,
          split_strategy: row.split_strategy,
          train_start: row.train_start,
          train_end: row.train_end,
          validation_start: row.validation_start,
          validation_end: row.validation_end,
          test_start: row.test_start,
          test_end: row.test_end,
          validation_mae_m:
            row.validation_mae_m,
          validation_rmse_m:
            row.validation_rmse_m,
          validation_sample_count:
            row.validation_sample_count,
          test_mae_m: row.test_mae_m,
          test_rmse_m: row.test_rmse_m,
          test_sample_count:
            row.test_sample_count,
          accepted_test_rmse_m:
            row.accepted_test_rmse_m,
          source_summary: row.source_summary,
          artifact_checksum_sha256:
            row.artifact_checksum_sha256,
          deployment_status:
            row.calibration_deployment_status,
          validated_at: row.validated_at,
          activated_at: null,
        },
        breakdowns,
      ),
    };
  }

  private calibrationFromRow(
    row: CalibrationRow,
    breakdowns: readonly CalibrationMetricBreakdown[],
  ): CalibrationRunSummary {
    return CalibrationRunSummarySchema.parse({
      id: row.public_id,
      version: row.version,
      stationId: row.station_public_id,
      riverReachId: row.river_reach_public_id,
      datumId: row.datum_id,
      sourceIds: sourceIds(row.source_summary),
      modelKind: row.model_kind,
      modelVersion: row.model_version,
      featureVersion: row.feature_version,
      splitStrategy: row.split_strategy,
      trainPeriod: {
        start: asIso(row.train_start),
        end: asIso(row.train_end),
      },
      validationPeriod: {
        start: asIso(row.validation_start),
        end: asIso(row.validation_end),
      },
      testPeriod: nullablePeriod(
        row.test_start,
        row.test_end,
      ),
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
      metricBreakdowns: [...breakdowns],
      artifactChecksumSha256:
        row.artifact_checksum_sha256,
      deploymentStatus: row.deployment_status,
    });
  }

  private deploymentQuery(
    where: string,
    suffix: string,
  ): string {
    return `SELECT
       rc.id::text AS id,
       rc.public_id,
       rc.curve_version,
       rc.station_id::text AS station_id,
       s.public_id AS station_public_id,
       s.default_datum_id AS station_datum_id,
       rc.river_reach_id::text AS river_reach_id,
       rr.public_id AS river_reach_public_id,
       rc.calibration_run_id::text AS calibration_run_id,
       cr.public_id AS calibration_public_id,
       rc.datum_id,
       rc.method,
       rc.stage_unit,
       rc.discharge_unit,
       rc.valid_discharge_min_cms,
       rc.valid_discharge_max_cms,
       rc.extrapolation_policy,
       rc.status,
       rc.curve_checksum_sha256::text,
       grl.confidence AS link_confidence,
       cr.datum_id AS calibration_datum_id,
       cr.deployment_status AS calibration_deployment_status,
       cr.version AS calibration_version,
       cr.model_kind,
       cr.model_version,
       cr.feature_version,
       cr.split_strategy,
       cr.train_start,
       cr.train_end,
       cr.validation_start,
       cr.validation_end,
       cr.test_start,
       cr.test_end,
       cr.validation_mae_m,
       cr.validation_rmse_m,
       cr.validation_sample_count,
       cr.test_mae_m,
       cr.test_rmse_m,
       cr.test_sample_count,
       cr.accepted_test_rmse_m,
       cr.source_summary,
       cr.artifact_checksum_sha256::text,
       cr.validated_at
     FROM rating_curves rc
     JOIN calibration_runs cr
       ON cr.id = rc.calibration_run_id
     JOIN stations s ON s.id = rc.station_id
     JOIN river_reaches rr
       ON rr.id = rc.river_reach_id
     LEFT JOIN gauge_reach_links grl
       ON grl.station_id = rc.station_id
      AND grl.river_reach_id = rc.river_reach_id
      AND grl.link_state = 'MAPPED'
     WHERE ${where}
     ${suffix}`;
  }

  private async curvePoints(
    database:
      | Pick<Pool, 'query'>
      | Pick<PoolClient, 'query'>,
    curveId: string,
  ): Promise<RatingCurveModel['points']> {
    const result = await database.query<CurvePointRow>(
      `SELECT point_order, discharge_cms, stage_m
       FROM rating_curve_points
       WHERE rating_curve_id = $1::uuid
       ORDER BY point_order ASC`,
      [curveId],
    );
    return result.rows.map((point) => ({
      dischargeCms: asNumber(point.discharge_cms),
      stageM: asNumber(point.stage_m),
    }));
  }

  private async breakdowns(
    database:
      | Pick<Pool, 'query'>
      | Pick<PoolClient, 'query'>,
    runId: string,
  ): Promise<CalibrationMetricBreakdown[]> {
    const result = await database.query<BreakdownRow>(
      `SELECT
         dataset_split,
         lead_seconds,
         season,
         event_subset,
         mae_m,
         rmse_m,
         sample_count
       FROM calibration_metric_breakdowns
       WHERE calibration_run_id = $1::uuid
       ORDER BY
         dataset_split,
         lead_seconds ASC NULLS LAST,
         season ASC NULLS LAST,
         event_subset ASC NULLS LAST`,
      [runId],
    );
    return result.rows.map(breakdownFromRow);
  }

  private async stationId(
    client: PoolClient,
    stationPublicId: string,
  ): Promise<string> {
    const result = await client.query<IdentityRow>(
      `SELECT id::text AS id
       FROM stations
       WHERE public_id = $1`,
      [stationPublicId],
    );
    const id = result.rows[0]?.id;
    if (!id) {
      throw new RangeError(
        `Unknown station ${stationPublicId}`,
      );
    }
    return id;
  }

  private async reachId(
    client: PoolClient,
    reachPublicId: string,
  ): Promise<string> {
    const result = await client.query<IdentityRow>(
      `SELECT id::text AS id
       FROM river_reaches
       WHERE public_id = $1`,
      [reachPublicId],
    );
    const id = result.rows[0]?.id;
    if (!id) {
      throw new RangeError(
        `Unknown river reach ${reachPublicId}`,
      );
    }
    return id;
  }
}
