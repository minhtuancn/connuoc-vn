import { z } from 'zod';

import { IsoInstantSchema } from './common.js';

const NonEmptyIdSchema = z.string().trim().min(1).max(240);
const StageMetersSchema = z.number().finite().min(-100).max(10_000);
const DischargeCmsSchema = z.number().finite().min(0).max(100_000_000);
const ErrorMetersSchema = z.number().finite().min(0).max(10_000);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const RatingCurveStatusSchema = z.enum([
  'DRAFT',
  'VALIDATED',
  'ACTIVE',
  'RETIRED',
]);
export type RatingCurveStatus = z.infer<
  typeof RatingCurveStatusSchema
>;

export const RatingCurveExtrapolationPolicySchema = z.enum([
  'REJECT',
  'ALLOW_WITH_DOWNGRADE',
]);
export type RatingCurveExtrapolationPolicy = z.infer<
  typeof RatingCurveExtrapolationPolicySchema
>;

export const RatingCurvePointSchema = z
  .object({
    dischargeCms: DischargeCmsSchema,
    stageM: StageMetersSchema,
  })
  .strict();
export type RatingCurvePoint = z.infer<
  typeof RatingCurvePointSchema
>;

export const RatingCurveValidationSchema = z
  .object({
    periodStart: IsoInstantSchema,
    periodEnd: IsoInstantSchema,
    maeM: ErrorMetersSchema,
    rmseM: ErrorMetersSchema,
    sampleCount: z.number().int().min(2).max(100_000_000),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      Date.parse(value.periodEnd) <= Date.parse(value.periodStart)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['periodEnd'],
        message: 'validation period must end after it starts',
      });
    }
    if (value.rmseM < value.maeM) {
      context.addIssue({
        code: 'custom',
        path: ['rmseM'],
        message: 'RMSE cannot be lower than MAE for the same sample',
      });
    }
  });
export type RatingCurveValidation = z.infer<
  typeof RatingCurveValidationSchema
>;

export const RatingCurveSchema = z
  .object({
    id: NonEmptyIdSchema,
    stationId: NonEmptyIdSchema,
    riverReachId: NonEmptyIdSchema,
    version: z.string().trim().min(1).max(120),
    datumId: z.string().trim().min(1).max(240),
    status: RatingCurveStatusSchema,
    extrapolationPolicy:
      RatingCurveExtrapolationPolicySchema,
    dischargeDomain: z
      .object({
        minCms: DischargeCmsSchema,
        maxCms: DischargeCmsSchema,
      })
      .strict(),
    stageDomain: z
      .object({
        minM: StageMetersSchema,
        maxM: StageMetersSchema,
      })
      .strict(),
    validation: RatingCurveValidationSchema,
    artifactChecksumSha256: Sha256Schema,
    points: z.array(RatingCurvePointSchema).min(2).max(512),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.dischargeDomain.maxCms <=
      value.dischargeDomain.minCms
    ) {
      context.addIssue({
        code: 'custom',
        path: ['dischargeDomain', 'maxCms'],
        message:
          'rating-curve discharge domain must have positive width',
      });
    }

    if (value.stageDomain.maxM <= value.stageDomain.minM) {
      context.addIssue({
        code: 'custom',
        path: ['stageDomain', 'maxM'],
        message:
          'rating-curve stage domain must have positive width',
      });
    }

    for (let index = 1; index < value.points.length; index += 1) {
      const previous = value.points[index - 1]!;
      const current = value.points[index]!;
      if (current.dischargeCms <= previous.dischargeCms) {
        context.addIssue({
          code: 'custom',
          path: ['points', index, 'dischargeCms'],
          message:
            'rating-curve discharge points must be strictly increasing',
        });
      }
      if (current.stageM < previous.stageM) {
        context.addIssue({
          code: 'custom',
          path: ['points', index, 'stageM'],
          message:
            'rating-curve stage points must be monotonic non-decreasing',
        });
      }
    }

    const first = value.points[0]!;
    const last = value.points[value.points.length - 1]!;
    if (
      first.dischargeCms !== value.dischargeDomain.minCms ||
      last.dischargeCms !== value.dischargeDomain.maxCms
    ) {
      context.addIssue({
        code: 'custom',
        path: ['dischargeDomain'],
        message:
          'rating-curve discharge domain must match the first and last calibration points',
      });
    }
    if (
      first.stageM !== value.stageDomain.minM ||
      last.stageM !== value.stageDomain.maxM
    ) {
      context.addIssue({
        code: 'custom',
        path: ['stageDomain'],
        message:
          'rating-curve stage domain must match the first and last calibration points',
      });
    }
  });
export type RatingCurve = z.infer<typeof RatingCurveSchema>;

export const CalibrationModelKindSchema = z.enum([
  'RATING_CURVE',
  'PERSISTENCE',
  'LINEAR_REGRESSION',
  'RIDGE_REGRESSION',
  'GRADIENT_BOOSTED',
]);
export type CalibrationModelKind = z.infer<
  typeof CalibrationModelKindSchema
>;

export const CalibrationRunStatusSchema = z.enum([
  'DRAFT',
  'VALIDATED',
  'ACTIVE',
  'ROLLED_BACK',
  'REJECTED',
]);
export type CalibrationRunStatus = z.infer<
  typeof CalibrationRunStatusSchema
>;

export const CalibrationMetricScopeSchema = z.enum([
  'OVERALL',
  'LEAD_TIME',
  'SEASON',
  'EVENT_SUBSET',
]);
export type CalibrationMetricScope = z.infer<
  typeof CalibrationMetricScopeSchema
>;

export const CalibrationMetricNameSchema = z.enum([
  'MAE_M',
  'RMSE_M',
  'BIAS_M',
]);
export type CalibrationMetricName = z.infer<
  typeof CalibrationMetricNameSchema
>;

export const CalibrationMetricSchema = z
  .object({
    scope: CalibrationMetricScopeSchema,
    name: CalibrationMetricNameSchema,
    valueM: z.number().finite().min(-10_000).max(10_000),
    sampleCount: z.number().int().min(1).max(100_000_000),
    leadSeconds: z
      .number()
      .int()
      .min(0)
      .max(31_536_000)
      .nullable(),
    segmentKey: z.string().trim().min(1).max(200).nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.name !== 'BIAS_M' &&
      value.valueM < 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['valueM'],
        message: 'MAE/RMSE metrics cannot be negative',
      });
    }
    if (
      value.scope === 'LEAD_TIME' &&
      value.leadSeconds === null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['leadSeconds'],
        message:
          'lead-time calibration metrics require leadSeconds',
      });
    }
    if (
      value.scope !== 'LEAD_TIME' &&
      value.leadSeconds !== null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['leadSeconds'],
        message:
          'non-lead calibration metrics cannot carry leadSeconds',
      });
    }
  });
export type CalibrationMetric = z.infer<
  typeof CalibrationMetricSchema
>;

const CalibrationPeriodSchema = z
  .object({
    start: IsoInstantSchema,
    end: IsoInstantSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.end) <= Date.parse(value.start)) {
      context.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'calibration period must end after it starts',
      });
    }
  });

export const CalibrationRunSchema = z
  .object({
    id: NonEmptyIdSchema,
    stationId: NonEmptyIdSchema,
    riverReachId: NonEmptyIdSchema,
    modelKind: CalibrationModelKindSchema,
    modelId: z.string().trim().min(1).max(200),
    modelVersion: z.string().trim().min(1).max(120),
    featureVersion: z.string().trim().min(1).max(160),
    datumId: z.string().trim().min(1).max(240),
    sourceIds: z.array(NonEmptyIdSchema).min(1).max(64),
    trainPeriod: CalibrationPeriodSchema.nullable(),
    validationPeriod: CalibrationPeriodSchema.nullable(),
    testPeriod: CalibrationPeriodSchema.nullable(),
    splitStrategy: z.string().trim().min(1).max(300),
    artifactChecksumSha256: Sha256Schema.nullable(),
    acceptedRmseM: ErrorMetersSchema.nullable(),
    status: CalibrationRunStatusSchema,
    metrics: z.array(CalibrationMetricSchema).max(2048),
  })
  .strict()
  .superRefine((value, context) => {
    const evidenceRequired = [
      'VALIDATED',
      'ACTIVE',
      'ROLLED_BACK',
    ].includes(value.status);

    if (!evidenceRequired) return;

    if (
      value.trainPeriod === null ||
      value.validationPeriod === null ||
      value.testPeriod === null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['testPeriod'],
        message:
          'validated calibration requires train/validation/test periods',
      });
    }
    if (value.artifactChecksumSha256 === null) {
      context.addIssue({
        code: 'custom',
        path: ['artifactChecksumSha256'],
        message:
          'validated calibration requires an artifact checksum',
      });
    }

    const overallMae = value.metrics.find(
      (metric) =>
        metric.scope === 'OVERALL' &&
        metric.name === 'MAE_M',
    );
    const overallRmse = value.metrics.find(
      (metric) =>
        metric.scope === 'OVERALL' &&
        metric.name === 'RMSE_M',
    );
    const leadMae = value.metrics.find(
      (metric) =>
        metric.scope === 'LEAD_TIME' &&
        metric.name === 'MAE_M',
    );
    const leadRmse = value.metrics.find(
      (metric) =>
        metric.scope === 'LEAD_TIME' &&
        metric.name === 'RMSE_M',
    );

    if (!overallMae || !overallRmse) {
      context.addIssue({
        code: 'custom',
        path: ['metrics'],
        message:
          'validated calibration requires held-out overall MAE and RMSE',
      });
    }
    if (!leadMae || !leadRmse) {
      context.addIssue({
        code: 'custom',
        path: ['metrics'],
        message:
          'validated stage-capable calibration requires lead-time MAE and RMSE breakdown',
      });
    }

    if (value.status === 'ACTIVE') {
      if (value.acceptedRmseM === null) {
        context.addIssue({
          code: 'custom',
          path: ['acceptedRmseM'],
          message:
            'active calibration requires an accepted RMSE threshold',
        });
      } else if (
        overallRmse &&
        overallRmse.valueM > value.acceptedRmseM
      ) {
        context.addIssue({
          code: 'custom',
          path: ['metrics'],
          message:
            'active calibration held-out RMSE exceeds the accepted error bound',
        });
      }
    }
  });
export type CalibrationRun = z.infer<
  typeof CalibrationRunSchema
>;

export const StageForecastConfidenceSchema = z.enum([
  'VALIDATED_CALIBRATION',
  'DOWNGRADED_EXTRAPOLATION',
]);
export type StageForecastConfidence = z.infer<
  typeof StageForecastConfidenceSchema
>;

export const StageForecastPointSchema = z
  .object({
    validAt: IsoInstantSchema,
    leadSeconds: z.number().int().min(0).max(31_536_000),
    dischargeCms: DischargeCmsSchema,
    stageM: StageMetersSchema,
    unit: z.literal('m'),
    datumId: z.string().trim().min(1).max(240),
    derivationMethod: z.literal('RATING_CURVE'),
    calibrationId: NonEmptyIdSchema,
    calibrationVersion: z.string().trim().min(1).max(120),
    sourceDischargeRecordId: NonEmptyIdSchema,
    extrapolated: z.boolean(),
    confidence: StageForecastConfidenceSchema,
    uncertainty: z
      .object({
        kind: z.literal('VALIDATION_RMSE'),
        valueM: ErrorMetersSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.extrapolated &&
      value.confidence !== 'DOWNGRADED_EXTRAPOLATION'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['confidence'],
        message:
          'extrapolated stage forecast must downgrade confidence',
      });
    }
    if (
      !value.extrapolated &&
      value.confidence !== 'VALIDATED_CALIBRATION'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['confidence'],
        message:
          'in-domain stage forecast must identify validated calibration evidence',
      });
    }
  });
export type StageForecastPoint = z.infer<
  typeof StageForecastPointSchema
>;
