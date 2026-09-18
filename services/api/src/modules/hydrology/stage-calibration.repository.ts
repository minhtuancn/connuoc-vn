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

interface EntityIdRow {
  id: string;
}

interface ExistingArtifactRow {
  id: string;
  artifact_checksum_sha256: string;
}

interface ExistingCurveRow {
  id: string;
  curve_checksum_sha256: string;
}

interface ActivationRow {
  curve_id: string;
  curve_public_id: string;
  curve_version: string;
  curve_status: RatingCurveModel['status'];
  curve_datum_id: string;
  curve_method: 'PIECEWISE_LINEAR';
  curve_stage_unit: 'm';
  curve_discharge_unit: 'm3/s';
  valid_discharge_min_cms: number | string;
  valid_discharge_max_cms: number | string;
  extrapolation_policy: 'REJECT';
  curve_checksum_sha256: string;
  station_id: string;
  station_public_id: string;
  station_default_datum_id: string | null;
  river_reach_id: string;
  river_reach_public_id: string;
  calibration_run_id: string;
  calibration_public_id: string;
  calibration_version: string;
  calibration_datum_id: string;
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
}

interface CurvePointRow {
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

function period(
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
      'calibration source summary must be a non-empty source-id array',
    );
  }
  return value;
}

function assertInstant(value: string): void {
  if (!Number.isFinite(Date.parse(value))) {
    throw new RangeError(
      'activation timestamp must be a valid ISO instant',
    );
  }
}

function curveChecksum(curve: {
  readonly stationId: string;
  readonly riverReachId: string;
  readonly calibrationRunId: string;
  readonly version: string;
  readonly datumId: string;
  readonly method: string;
  readonly stageUnit: string;
  readonly dischargeUnit: string;
  readonly validDischargeMinCms: number;
  readonly validDischargeMaxCms: number;
  readonly extrapolationPolicy: string;
  readonly points: readonly {
    readonly dischargeCms: number;
    readonly stageM: number;
  }[];
}): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        stationId: curve.stationId,
        riverReachId: curve.riverReachId,
        calibrationRunId: curve.calibrationRunId,
        version: curve.version,
        datumId: curve.datumId,
        method: curve.method,
        stageUnit: curve.stageUnit,
        dischargeUnit: curve.dischargeUnit,
        validDischargeMinCms: curve.validDischargeMinCms,
        validDischargeMaxCms: curve.validDischargeMaxCms,
        extrapolationPolicy: curve.extrapolationPolicy,
        points: curve.points.map((point) => ({
          dischargeCms: point.dischargeCms,
          stageM: point.stageM,
        })),
      }),
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

export interface ActiveStageCalibration {
  readonly curve: RatingCurveModel;
  readonly calibration: CalibrationRunSummary;
}

export class StageCalibrationRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new Error(
        'Stage calibration database is not configured.',
      );
    }
    return this.pool;
  }

  async saveCalibrationRun(
    rawRun: CalibrationRunSummary,
  ): Promise<string> {
    const run = CalibrationRunSummarySchema.parse(rawRun);
    const database = this.database();

    const stationId = await this.resolveEntityId(
      database,
      'stations',
      run.stationId,
    );
    const riverReachId = await this.resolveEntityId(
      database,
      'river_reaches',
      run.riverReachId,
    );

    const inserted = await database.query<EntityIdRow>(
      `INSERT INTO calibration_runs (
         public_id,
         version,
         station_id,
         river_reach_id,
         datum_id,
         model_kind,
         model_version,
         feature_version,
         split_strategy,
         train_start,
         train_end,
         validation_start,
         validation_end,
         test_start,
         test_end,
         validation_mae_m,
         validation_rmse_m,
         validation_sample_count,
         test_mae_m,
         test_rmse_m,
         test_sample_count,
         accepted_test_rmse_m,
         source_summary,
         artifact_checksum_sha256,
         deployment_status
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9,
         $10, $11, $12, $13, $14, $15,
         $16, $17, $18, $19, $20, $21, $22,
         $23::jsonb, $24, $25
       )
       ON CONFLICT (public_id) DO NOTHING
       RETURNING id::text AS id`,
      [
        run.id,
        run.version,
        stationId,
        riverReachId,
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
        run.deploymentStatus,
      ],
    );

    let runId = inserted.rows[0]?.id;
    if (!runId) {
      const existing =
        await database.query<ExistingArtifactRow>(
          `SELECT
             id::text AS id,
             artifact_checksum_sha256::text
           FROM calibration_runs
           WHERE public_id = $1`,
          [run.id],
        );
      const row = existing.rows[0];
      if (!row) {
        throw new Error(
          'calibration run insert did not return or resolve an id',
        );
      }
      if (
        row.artifact_checksum_sha256 !==
        run.artifactChecksumSha256
      ) {
        throw new Error(
          'calibration public id already exists with a different artifact checksum',
        );
      }
      runId = row.id;
    }

    for (const item of run.metricBreakdowns) {
      await database.query(
        `INSERT INTO calibration_metric_breakdowns (
           calibration_run_id,
           dataset_split,
           lead_seconds,
           season,
           event_subset,
           mae_m,
           rmse_m,
           sample_count
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8
         )
         ON CONFLICT (
           calibration_run_id,
           dataset_split,
           lead_seconds,
           season,
           event_subset
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

    return runId;
  }

  async saveRatingCurve(
    rawCurve: RatingCurveModel,
  ): Promise<string> {
    const curve = RatingCurveModelSchema.parse(rawCurve);
    const database = this.database();

    const stationId = await this.resolveEntityId(
      database,
      'stations',
      curve.stationId,
    );
    const riverReachId = await this.resolveEntityId(
      database,
      'river_reaches',
      curve.riverReachId,
    );
    const calibration = await database.query<{
      id: string;
      station_id: string;
      river_reach_id: string;
      datum_id: string;
    }>(
      `SELECT
         id::text AS id,
         station_id::text,
         river_reach_id::text,
         datum_id
       FROM calibration_runs
       WHERE public_id = $1`,
      [curve.calibrationRunId],
    );
    const run = calibration.rows[0];
    if (!run) {
      throw new RangeError(
        `Unknown calibration run ${curve.calibrationRunId}`,
      );
    }
    if (
      run.station_id !== stationId ||
      run.river_reach_id !== riverReachId ||
      run.datum_id !== curve.datumId
    ) {
      throw new RangeError(
        'rating curve scope/datum does not match its calibration run',
      );
    }

    const checksum = curveChecksum({
      stationId: curve.stationId,
      riverReachId: curve.riverReachId,
      calibrationRunId: curve.calibrationRunId,
      version: curve.version,
      datumId: curve.datumId,
      method: curve.method,
      stageUnit: curve.stageUnit,
      dischargeUnit: curve.dischargeUnit,
      validDischargeMinCms: curve.validDischargeMinCms,
      validDischargeMaxCms: curve.validDischargeMaxCms,
      extrapolationPolicy: curve.extrapolationPolicy,
      points: curve.points,
    });

    const inserted = await database.query<EntityIdRow>(
      `INSERT INTO rating_curves (
         public_id,
         station_id,
         river_reach_id,
         calibration_run_id,
         curve_version,
         datum_id,
         method,
         stage_unit,
         discharge_unit,
         valid_discharge_min_cms,
         valid_discharge_max_cms,
         extrapolation_policy,
         status,
         curve_checksum_sha256
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14
       )
       ON CONFLICT (public_id) DO NOTHING
       RETURNING id::text AS id`,
      [
        curve.id,
        stationId,
        riverReachId,
        run.id,
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
        await database.query<ExistingCurveRow>(
          `SELECT
             id::text AS id,
             curve_checksum_sha256::text
           FROM rating_curves
           WHERE public_id = $1`,
          [curve.id],
        );
      const row = existing.rows[0];
      if (!row) {
        throw new Error(
          'rating curve insert did not return or resolve an id',
        );
      }
      if (row.curve_checksum_sha256 !== checksum) {
        throw new Error(
          'rating-curve public id already exists with a different checksum',
        );
      }
      curveId = row.id;
    }

    if (isNew) {
      for (const [index, point] of curve.points.entries()) {
        await database.query(
          `INSERT INTO rating_curve_points (
             rating_curve_id,
             point_order,
             discharge_cms,
             stage_m
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

    return curveId;
  }

  async activateRatingCurve(
    curvePublicId: string,
    activatedAtUtc: string,
  ): Promise<void> {
    await this.activateOrRollback(
      curvePublicId,
      activatedAtUtc,
    );
  }

  async rollbackToRatingCurve(
    curvePublicId: string,
    activatedAtUtc: string,
  ): Promise<void> {
    await this.activateOrRollback(
      curvePublicId,
      activatedAtUtc,
    );
  }

  async findActiveCurveForReach(
    riverReachPublicId: string,
    atUtc: string,
  ): Promise<ActiveStageCalibration | null> {
    assertInstant(atUtc);
    const rows =
      await this.database().query<ActivationRow>(
        `SELECT
           c.id::text AS curve_id,
           c.public_id AS curve_public_id,
           c.curve_version,
           c.status AS curve_status,
           c.datum_id AS curve_datum_id,
           c.method AS curve_method,
           c.stage_unit AS curve_stage_unit,
           c.discharge_unit AS curve_discharge_unit,
           c.valid_discharge_min_cms,
           c.valid_discharge_max_cms,
           c.extrapolation_policy,
           c.curve_checksum_sha256::text,
           s.id::text AS station_id,
           s.public_id AS station_public_id,
           s.default_datum_id AS station_default_datum_id,
           rr.id::text AS river_reach_id,
           rr.public_id AS river_reach_public_id,
           r.id::text AS calibration_run_id,
           r.public_id AS calibration_public_id,
           r.version AS calibration_version,
           r.datum_id AS calibration_datum_id,
           r.model_kind,
           r.model_version,
           r.feature_version,
           r.split_strategy,
           r.train_start,
           r.train_end,
           r.validation_start,
           r.validation_end,
           r.test_start,
           r.test_end,
           r.validation_mae_m,
           r.validation_rmse_m,
           r.validation_sample_count,
           r.test_mae_m,
           r.test_rmse_m,
           r.test_sample_count,
           r.accepted_test_rmse_m,
           r.source_summary,
           r.artifact_checksum_sha256::text,
           r.deployment_status
         FROM rating_curves c
         JOIN calibration_runs r
           ON r.id = c.calibration_run_id
         JOIN stations s
           ON s.id = c.station_id
         JOIN river_reaches rr
           ON rr.id = c.river_reach_id
         JOIN gauge_reach_links l
           ON l.station_id = c.station_id
          AND l.river_reach_id = c.river_reach_id
          AND l.link_state = 'MAPPED'
          AND l.effective_from <= $2::timestamptz
          AND (
            l.effective_to IS NULL
            OR l.effective_to >= $2::timestamptz
          )
         WHERE rr.public_id = $1
           AND c.status = 'ACTIVE'
           AND r.deployment_status = 'ACTIVE'
           AND c.effective_from <= $2::timestamptz
           AND (
             c.effective_to IS NULL
             OR c.effective_to >= $2::timestamptz
           )
         ORDER BY l.confidence DESC, s.public_id ASC
         LIMIT 2`,
        [riverReachPublicId, atUtc],
      );

    if (rows.rows.length === 0) return null;
    if (rows.rows.length > 1) {
      throw new Error(
        'multiple active gauge calibrations exist for this river reach; station selection is required',
      );
    }

    return this.materializeActive(rows.rows[0]!);
  }

  async findCalibrationMetrics(
    calibrationPublicId: string,
  ): Promise<readonly CalibrationMetricBreakdown[]> {
    const result =
      await this.database().query<BreakdownRow>(
        `SELECT
           m.dataset_split,
           m.lead_seconds,
           m.season,
           m.event_subset,
           m.mae_m,
           m.rmse_m,
           m.sample_count
         FROM calibration_metric_breakdowns m
         JOIN calibration_runs r
           ON r.id = m.calibration_run_id
         WHERE r.public_id = $1
         ORDER BY
           m.dataset_split,
           m.lead_seconds ASC NULLS LAST,
           m.season ASC NULLS LAST,
           m.event_subset ASC NULLS LAST`,
        [calibrationPublicId],
      );
    return result.rows.map(breakdownFromRow);
  }

  private async activateOrRollback(
    curvePublicId: string,
    activatedAtUtc: string,
  ): Promise<void> {
    assertInstant(activatedAtUtc);
    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const target = await this.activationTarget(
        client,
        curvePublicId,
      );

      if (
        target.station_default_datum_id === null ||
        target.station_default_datum_id !==
          target.curve_datum_id ||
        target.calibration_datum_id !==
          target.curve_datum_id
      ) {
        throw new Error(
          'rating-curve datum is incompatible with the target station/calibration datum',
        );
      }

      const points = await this.curvePoints(
        client,
        target.curve_id,
      );
      const curve = RatingCurveModelSchema.parse({
        id: target.curve_public_id,
        version: target.curve_version,
        stationId: target.station_public_id,
        riverReachId: target.river_reach_public_id,
        calibrationRunId: target.calibration_public_id,
        datumId: target.curve_datum_id,
        method: target.curve_method,
        stageUnit: target.curve_stage_unit,
        dischargeUnit: target.curve_discharge_unit,
        validDischargeMinCms: asNumber(
          target.valid_discharge_min_cms,
        ),
        validDischargeMaxCms: asNumber(
          target.valid_discharge_max_cms,
        ),
        extrapolationPolicy:
          target.extrapolation_policy,
        status: target.curve_status,
        points,
      });

      const expectedChecksum = curveChecksum({
        stationId: curve.stationId,
        riverReachId: curve.riverReachId,
        calibrationRunId: curve.calibrationRunId,
        version: curve.version,
        datumId: curve.datumId,
        method: curve.method,
        stageUnit: curve.stageUnit,
        dischargeUnit: curve.dischargeUnit,
        validDischargeMinCms:
          curve.validDischargeMinCms,
        validDischargeMaxCms:
          curve.validDischargeMaxCms,
        extrapolationPolicy:
          curve.extrapolationPolicy,
        points: curve.points,
      });
      if (
        expectedChecksum !==
        target.curve_checksum_sha256
      ) {
        throw new Error(
          'rating-curve checksum does not match stored calibration points',
        );
      }

      const breakdowns = await this.breakdowns(
        client,
        target.calibration_run_id,
      );
      const calibration =
        CalibrationRunSummarySchema.parse({
          id: target.calibration_public_id,
          version: target.calibration_version,
          stationId: target.station_public_id,
          riverReachId:
            target.river_reach_public_id,
          datumId: target.calibration_datum_id,
          sourceIds: sourceIds(
            target.source_summary,
          ),
          modelKind: target.model_kind,
          modelVersion: target.model_version,
          featureVersion: target.feature_version,
          splitStrategy: target.split_strategy,
          trainPeriod: period(
            target.train_start,
            target.train_end,
          ),
          validationPeriod: period(
            target.validation_start,
            target.validation_end,
          ),
          testPeriod: period(
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

      // Parsing as ACTIVE above is the deployment evidence gate.
      void calibration;

      await client.query(
        `UPDATE rating_curves
         SET
           status = 'SUPERSEDED',
           effective_to = $4::timestamptz,
           updated_at = now()
         WHERE station_id = $1::uuid
           AND river_reach_id = $2::uuid
           AND datum_id = $3
           AND status = 'ACTIVE'
           AND id <> $5::uuid`,
        [
          target.station_id,
          target.river_reach_id,
          target.curve_datum_id,
          activatedAtUtc,
          target.curve_id,
        ],
      );

      await client.query(
        `UPDATE calibration_runs
         SET
           deployment_status = 'ROLLED_BACK',
           rolled_back_at = $4::timestamptz,
           updated_at = now()
         WHERE station_id = $1::uuid
           AND river_reach_id = $2::uuid
           AND model_kind = $3
           AND deployment_status = 'ACTIVE'
           AND id <> $5::uuid`,
        [
          target.station_id,
          target.river_reach_id,
          target.model_kind,
          activatedAtUtc,
          target.calibration_run_id,
        ],
      );

      await client.query(
        `UPDATE calibration_runs
         SET
           deployment_status = 'ACTIVE',
           validated_at = COALESCE(
             validated_at,
             $2::timestamptz
           ),
           activated_at = $2::timestamptz,
           rolled_back_at = NULL,
           updated_at = now()
         WHERE id = $1::uuid`,
        [
          target.calibration_run_id,
          activatedAtUtc,
        ],
      );

      await client.query(
        `UPDATE rating_curves
         SET
           status = 'ACTIVE',
           effective_from = $2::timestamptz,
           effective_to = NULL,
           updated_at = now()
         WHERE id = $1::uuid`,
        [target.curve_id, activatedAtUtc],
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
    row: ActivationRow,
  ): Promise<ActiveStageCalibration> {
    const points = await this.curvePoints(
      this.database(),
      row.curve_id,
    );
    const breakdowns = await this.findCalibrationMetrics(
      row.calibration_public_id,
    );

    return {
      curve: RatingCurveModelSchema.parse({
        id: row.curve_public_id,
        version: row.curve_version,
        stationId: row.station_public_id,
        riverReachId: row.river_reach_public_id,
        calibrationRunId: row.calibration_public_id,
        datumId: row.curve_datum_id,
        method: row.curve_method,
        stageUnit: row.curve_stage_unit,
        dischargeUnit: row.curve_discharge_unit,
        validDischargeMinCms: asNumber(
          row.valid_discharge_min_cms,
        ),
        validDischargeMaxCms: asNumber(
          row.valid_discharge_max_cms,
        ),
        extrapolationPolicy:
          row.extrapolation_policy,
        status: row.curve_status,
        points,
      }),
      calibration: CalibrationRunSummarySchema.parse({
        id: row.calibration_public_id,
        version: row.calibration_version,
        stationId: row.station_public_id,
        riverReachId: row.river_reach_public_id,
        datumId: row.calibration_datum_id,
        sourceIds: sourceIds(row.source_summary),
        modelKind: row.model_kind,
        modelVersion: row.model_version,
        featureVersion: row.feature_version,
        splitStrategy: row.split_strategy,
        trainPeriod: period(
          row.train_start,
          row.train_end,
        ),
        validationPeriod: period(
          row.validation_start,
          row.validation_end,
        ),
        testPeriod: period(
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
            : asNumber(
                row.accepted_test_rmse_m,
              ),
        metricBreakdowns: breakdowns,
        artifactChecksumSha256:
          row.artifact_checksum_sha256,
        deploymentStatus: row.deployment_status,
      }),
    };
  }

  private async activationTarget(
    client: PoolClient,
    curvePublicId: string,
  ): Promise<ActivationRow> {
    const result = await client.query<ActivationRow>(
      `SELECT
         c.id::text AS curve_id,
         c.public_id AS curve_public_id,
         c.curve_version,
         c.status AS curve_status,
         c.datum_id AS curve_datum_id,
         c.method AS curve_method,
         c.stage_unit AS curve_stage_unit,
         c.discharge_unit AS curve_discharge_unit,
         c.valid_discharge_min_cms,
         c.valid_discharge_max_cms,
         c.extrapolation_policy,
         c.curve_checksum_sha256::text,
         s.id::text AS station_id,
         s.public_id AS station_public_id,
         s.default_datum_id AS station_default_datum_id,
         rr.id::text AS river_reach_id,
         rr.public_id AS river_reach_public_id,
         r.id::text AS calibration_run_id,
         r.public_id AS calibration_public_id,
         r.version AS calibration_version,
         r.datum_id AS calibration_datum_id,
         r.model_kind,
         r.model_version,
         r.feature_version,
         r.split_strategy,
         r.train_start,
         r.train_end,
         r.validation_start,
         r.validation_end,
         r.test_start,
         r.test_end,
         r.validation_mae_m,
         r.validation_rmse_m,
         r.validation_sample_count,
         r.test_mae_m,
         r.test_rmse_m,
         r.test_sample_count,
         r.accepted_test_rmse_m,
         r.source_summary,
         r.artifact_checksum_sha256::text,
         r.deployment_status
       FROM rating_curves c
       JOIN calibration_runs r
         ON r.id = c.calibration_run_id
       JOIN stations s
         ON s.id = c.station_id
       JOIN river_reaches rr
         ON rr.id = c.river_reach_id
       WHERE c.public_id = $1
       FOR UPDATE OF c, r`,
      [curvePublicId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new RangeError(
        `Unknown rating curve ${curvePublicId}`,
      );
    }
    if (
      row.curve_status === 'REJECTED' ||
      row.deployment_status === 'REJECTED'
    ) {
      throw new Error(
        'rejected calibration artifacts cannot be activated',
      );
    }
    return row;
  }

  private async curvePoints(
    client: Pick<Pool, 'query'> | Pick<PoolClient, 'query'>,
    curveId: string,
  ): Promise<RatingCurveModel['points']> {
    const result = await client.query<CurvePointRow>(
      `SELECT discharge_cms, stage_m
       FROM rating_curve_points
       WHERE rating_curve_id = $1::uuid
       ORDER BY point_order ASC`,
      [curveId],
    );
    return result.rows.map((row) => ({
      dischargeCms: asNumber(row.discharge_cms),
      stageM: asNumber(row.stage_m),
    }));
  }

  private async breakdowns(
    client: PoolClient,
    calibrationRunId: string,
  ): Promise<CalibrationMetricBreakdown[]> {
    const result = await client.query<BreakdownRow>(
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
      [calibrationRunId],
    );
    return result.rows.map(breakdownFromRow);
  }

  private async resolveEntityId(
    client: Pick<Pool, 'query'>,
    table: 'stations' | 'river_reaches',
    publicId: string,
  ): Promise<string> {
    const result = await client.query<EntityIdRow>(
      `SELECT id::text AS id
       FROM ${table}
       WHERE public_id = $1`,
      [publicId],
    );
    const id = result.rows[0]?.id;
    if (!id) {
      throw new RangeError(
        `Unknown ${table} public id ${publicId}`,
      );
    }
    return id;
  }
}
