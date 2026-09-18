import { z } from 'zod';

import { IsoInstantSchema } from './common.js';

const NonEmptyIdSchema = z.string().trim().min(1).max(240);
const StageMValueSchema = z.number().finite().min(-1_000).max(20_000);
const DischargeCmsSchema = z.number().finite().min(0).max(100_000_000);
const NonNegativeMetricSchema = z.number().finite().min(0).max(100_000);
const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);

export const RatingCurveKindSchema = z.literal('PIECEWISE_LINEAR');
export type RatingCurveKind = z.infer<typeof RatingCurveKindSchema>;

export const RatingCurveStatusSchema = z.enum([
  'CANDIDATE',
  'ACTIVE',
  'ROLLED_BACK',
  'RETIRED',
]);
export type RatingCurveStatus = z.infer<typeof RatingCurveStatusSchema>;

export const RatingCurvePointSchema = z
  .object({
    dischargeCms: DischargeCmsSchema,
    stageM: StageMValueSchema,
  })
  .strict();
export type RatingCurvePoint = z.infer<typeof RatingCurvePointSchema>;

export const CalibrationLeadMetricSchema = z
  .object({
    leadSeconds: z.number().int().min(0).max(31_536_000),
    sampleCount: z.number().int().min(1).max(100_000_000),
    maeM: NonNegativeMetricSchema,
    rmseM: NonNegativeMetricSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.rmseM < value.maeM) {
      context.addIssue({
        code: 'custom',
        path: ['rmseM'],
        message: 'RMSE cannot be lower than MAE for the same sample set',
      });
    }
  });
export type CalibrationLeadMetric = z.infer<
  typeof CalibrationLeadMetricSchema
>;

export const CalibrationValidationMetricsSchema = z
  .object({
    sampleCount: z.number().int().min(2).max(100_000_000),
    maeM: NonNegativeMetricSchema,
    rmseM: NonNegativeMetricSchema,
    biasM: z.number().finite().min(-100_000).max(100_000).nullable(),
    validationStart: IsoInstantSchema,
    validationEnd: IsoInstantSchema,
    leadMetrics: z.array(CalibrationLeadMetricSchema).max(512),
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.validationEnd) <= Date.parse(value.validationStart)) {
      context.addIssue({
        code: 'custom',
        path: ['validationEnd'],
        message: 'validationEnd must be later than validationStart',
      });
    }
    if (value.rmseM < value.maeM) {
      context.addIssue({
        code: 'custom',
        path: ['rmseM'],
        message: 'RMSE cannot be lower than MAE for the same sample set',
      });
    }
  });
export type CalibrationValidationMetrics = z.infer<
  typeof CalibrationValidationMetricsSchema
>;

export const RatingCurveDefinitionSchema = z
  .object({
    id: NonEmptyIdSchema,
    stationId: NonEmptyIdSchema,
    riverReachId: NonEmptyIdSchema,
    version: z.string().trim().min(1).max(160),
    datumId: NonEmptyIdSchema,
    stageUnit: z.literal('m'),
    curveKind: RatingCurveKindSchema,
    status: RatingCurveStatusSchema,
    points: z.array(RatingCurvePointSchema).min(2).max(4_096),
    validFrom: IsoInstantSchema,
    validTo: IsoInstantSchema.nullable(),
    calibrationRunId: NonEmptyIdSchema.nullable(),
    validation: CalibrationValidationMetricsSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.validTo !== null &&
      Date.parse(value.validTo) <= Date.parse(value.validFrom)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['validTo'],
        message: 'validTo must be later than validFrom',
      });
    }

    for (let index = 1; index < value.points.length; index += 1) {
      const previous = value.points[index - 1]!;
      const current = value.points[index]!;
      if (current.dischargeCms <= previous.dischargeCms) {
        context.addIssue({
          code: 'custom',
          path: ['points', index, 'dischargeCms'],
          message: 'rating-curve discharge points must be strictly increasing',
        });
      }
      if (current.stageM <= previous.stageM) {
        context.addIssue({
          code: 'custom',
          path: ['points', index, 'stageM'],
          message: 'rating-curve stage points must be strictly increasing',
        });
      }
    }

    if (value.status === 'ACTIVE') {
      if (value.validation === null || value.calibrationRunId === null) {
        context.addIssue({
          code: 'custom',
          path: ['validation'],
          message:
            'active rating curves require a calibration run and validation evidence',
        });
      }
    }
  });
export type RatingCurveDefinition = z.infer<
  typeof RatingCurveDefinitionSchema
>;

export const CalibrationRunStatusSchema = z.enum([
  'CANDIDATE',
  'APPROVED',
  'ACTIVE',
  'ROLLED_BACK',
  'REJECTED',
]);
export type CalibrationRunStatus = z.infer<
  typeof CalibrationRunStatusSchema
>;

export const CalibrationSplitStrategySchema = z.enum([
  'TIME_ORDERED_HOLDOUT',
  'EVENT_HOLDOUT',
  'SEASONAL_HOLDOUT',
]);
export type CalibrationSplitStrategy = z.infer<
  typeof CalibrationSplitStrategySchema
>;

export const CalibrationRunSchema = z
  .object({
    id: NonEmptyIdSchema,
    stationId: NonEmptyIdSchema,
    riverReachId: NonEmptyIdSchema,
    modelFamily: z.string().trim().min(1).max(160),
    modelVersion: z.string().trim().min(1).max(160),
    featureVersion: z.string().trim().min(1).max(160),
    sourceIds: z.array(NonEmptyIdSchema).min(1).max(128),
    trainingStart: IsoInstantSchema,
    trainingEnd: IsoInstantSchema,
    validationStart: IsoInstantSchema,
    validationEnd: IsoInstantSchema,
    testStart: IsoInstantSchema,
    testEnd: IsoInstantSchema,
    splitStrategy: CalibrationSplitStrategySchema,
    metrics: CalibrationValidationMetricsSchema,
    artifactSha256: Sha256Schema,
    status: CalibrationRunStatusSchema,
    baselineModelFamily: z.string().trim().min(1).max(160).nullable(),
    baselineRmseM: NonNegativeMetricSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    const periods: ReadonlyArray<[string, string, string]> = [
      ['trainingStart', value.trainingStart, value.trainingEnd],
      ['validationStart', value.validationStart, value.validationEnd],
      ['testStart', value.testStart, value.testEnd],
    ];
    for (const [path, start, end] of periods) {
      if (Date.parse(end) <= Date.parse(start)) {
        context.addIssue({
          code: 'custom',
          path: [path.replace('Start', 'End')],
          message:
            path.replace('Start', '') +
            ' period end must be later than start',
        });
      }
    }

    if (
      value.splitStrategy === 'TIME_ORDERED_HOLDOUT' &&
      !(
        Date.parse(value.trainingEnd) <= Date.parse(value.validationStart) &&
        Date.parse(value.validationEnd) <= Date.parse(value.testStart)
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: ['splitStrategy'],
        message:
          'time-ordered holdout requires training, validation and test periods in chronological order',
      });
    }

    if (
      (value.baselineModelFamily === null) !==
      (value.baselineRmseM === null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['baselineModelFamily'],
        message:
          'baseline model family and baseline RMSE must be supplied together',
      });
    }
  });
export type CalibrationRun = z.infer<typeof CalibrationRunSchema>;

export const StageInsufficientReasonSchema = z.enum([
  'NO_ACTIVE_CALIBRATION',
  'DATUM_MISMATCH',
  'BELOW_CALIBRATED_DOMAIN',
  'ABOVE_CALIBRATED_DOMAIN',
  'INVALID_CURVE',
  'MISSING_DISCHARGE',
]);
export type StageInsufficientReason = z.infer<
  typeof StageInsufficientReasonSchema
>;

export const StageDomainStatusSchema = z.enum([
  'BOUNDARY',
  'INTERPOLATED',
]);
export type StageDomainStatus = z.infer<
  typeof StageDomainStatusSchema
>;

export const StageDerivationAvailableSchema = z
  .object({
    state: z.literal('AVAILABLE'),
    dischargeCms: DischargeCmsSchema,
    stageM: StageMValueSchema,
    stageUnit: z.literal('m'),
    datumId: NonEmptyIdSchema,
    calibrationId: NonEmptyIdSchema,
    calibrationVersion: z.string().trim().min(1).max(160),
    domainStatus: StageDomainStatusSchema,
    uncertaintyM: NonNegativeMetricSchema,
    limitations: z.array(z.string().trim().min(1).max(500)).max(32),
  })
  .strict();
export type StageDerivationAvailable = z.infer<
  typeof StageDerivationAvailableSchema
>;

export const StageDerivationInsufficientSchema = z
  .object({
    state: z.literal('INSUFFICIENT_DATA'),
    reason: StageInsufficientReasonSchema,
    dischargeCms: DischargeCmsSchema.nullable(),
    requiredDatumId: NonEmptyIdSchema.nullable(),
    availableDatumId: NonEmptyIdSchema.nullable(),
    calibrationId: NonEmptyIdSchema.nullable(),
    limitations: z.array(z.string().trim().min(1).max(500)).min(1).max(32),
  })
  .strict();
export type StageDerivationInsufficient = z.infer<
  typeof StageDerivationInsufficientSchema
>;

export const StageDerivationResultSchema = z.discriminatedUnion('state', [
  StageDerivationAvailableSchema,
  StageDerivationInsufficientSchema,
]);
export type StageDerivationResult = z.infer<
  typeof StageDerivationResultSchema
>;

export const RiverRiseDirectionSchema = z.enum([
  'RISING',
  'FALLING',
  'STABLE',
  'UNKNOWN',
]);
export type RiverRiseDirection = z.infer<
  typeof RiverRiseDirectionSchema
>;

export const RiverRiseSummarySchema = z
  .object({
    direction: RiverRiseDirectionSchema,
    deltaM: z.number().finite().min(-10_000).max(10_000).nullable(),
    leadSeconds: z.number().int().min(0).max(31_536_000).nullable(),
    peakStageM: StageMValueSchema.nullable(),
    peakAt: IsoInstantSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.deltaM === null) !== (value.leadSeconds === null)) {
      context.addIssue({
        code: 'custom',
        path: ['deltaM'],
        message: 'deltaM and leadSeconds must be supplied together',
      });
    }
    if ((value.peakStageM === null) !== (value.peakAt === null)) {
      context.addIssue({
        code: 'custom',
        path: ['peakStageM'],
        message: 'peakStageM and peakAt must be supplied together',
      });
    }
  });
export type RiverRiseSummary = z.infer<
  typeof RiverRiseSummarySchema
>;
