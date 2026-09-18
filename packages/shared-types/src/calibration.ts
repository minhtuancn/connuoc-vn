import { z } from 'zod';

import { IsoInstantSchema } from './common.js';

const NonEmptyIdSchema = z.string().trim().min(1).max(240);
const DischargeCmsSchema = z.number().finite().min(0).max(100_000_000);
const StageMetresSchema = z.number().finite().min(-1000).max(10000);

export const CalibrationPeriodSchema = z
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
        message: 'period end must be later than start',
      });
    }
  });
export type CalibrationPeriod = z.infer<typeof CalibrationPeriodSchema>;

export const CalibrationMetricsSchema = z
  .object({
    maeM: z.number().finite().min(0).max(10000),
    rmseM: z.number().finite().min(0).max(10000),
    sampleCount: z.number().int().min(1).max(100_000_000),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.rmseM + Number.EPSILON < value.maeM) {
      context.addIssue({
        code: 'custom',
        path: ['rmseM'],
        message: 'RMSE cannot be lower than MAE for the same evaluation set',
      });
    }
  });
export type CalibrationMetrics = z.infer<typeof CalibrationMetricsSchema>;

export const CalibrationMetricBreakdownSchema = z
  .object({
    datasetSplit: z.enum(['VALIDATION', 'TEST']),
    leadSeconds: z.number().int().min(0).max(31_536_000).nullable(),
    season: z.string().trim().min(1).max(120).nullable(),
    eventSubset: z.string().trim().min(1).max(160).nullable(),
    metrics: CalibrationMetricsSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.leadSeconds === null &&
      value.season === null &&
      value.eventSubset === null
    ) {
      context.addIssue({
        code: 'custom',
        path: ['leadSeconds'],
        message:
          'metric breakdown must identify lead time, season or event subset',
      });
    }
  });
export type CalibrationMetricBreakdown = z.infer<
  typeof CalibrationMetricBreakdownSchema
>;

export const CalibrationModelKindSchema = z.enum([
  'RATING_CURVE',
  'PERSISTENCE_BASELINE',
  'LINEAR_REGRESSION',
  'REGULARIZED_REGRESSION',
]);
export type CalibrationModelKind = z.infer<typeof CalibrationModelKindSchema>;

export const CalibrationDeploymentStatusSchema = z.enum([
  'CANDIDATE',
  'ACTIVE',
  'SUPERSEDED',
  'ROLLED_BACK',
  'REJECTED',
]);
export type CalibrationDeploymentStatus = z.infer<
  typeof CalibrationDeploymentStatusSchema
>;

export const CalibrationRunSummarySchema = z
  .object({
    id: NonEmptyIdSchema,
    version: NonEmptyIdSchema,
    stationId: NonEmptyIdSchema,
    riverReachId: NonEmptyIdSchema,
    datumId: NonEmptyIdSchema,
    modelKind: CalibrationModelKindSchema,
    modelVersion: NonEmptyIdSchema,
    featureVersion: NonEmptyIdSchema,
    splitStrategy: z.enum([
      'CHRONOLOGICAL_HOLDOUT',
      'EVENT_HOLDOUT',
      'ROLLING_ORIGIN',
    ]),
    trainPeriod: CalibrationPeriodSchema,
    validationPeriod: CalibrationPeriodSchema,
    testPeriod: CalibrationPeriodSchema.nullable(),
    validationMetrics: CalibrationMetricsSchema.nullable(),
    testMetrics: CalibrationMetricsSchema.nullable(),
    acceptedTestRmseM: z.number().finite().min(0).max(10000).nullable(),
    metricBreakdowns: z.array(CalibrationMetricBreakdownSchema).max(2048),
    artifactChecksumSha256: z
      .string()
      .regex(/^[0-9a-f]{64}$/),
    deploymentStatus: CalibrationDeploymentStatusSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      Date.parse(value.validationPeriod.start) <
      Date.parse(value.trainPeriod.end)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['validationPeriod'],
        message: 'validation period must not overlap the training period',
      });
    }

    if (
      value.testPeriod !== null &&
      Date.parse(value.testPeriod.start) <
        Date.parse(value.validationPeriod.end)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['testPeriod'],
        message: 'test period must not overlap the validation period',
      });
    }

    if (value.deploymentStatus === 'ACTIVE') {
      if (
        value.testPeriod === null ||
        value.validationMetrics === null ||
        value.testMetrics === null ||
        value.acceptedTestRmseM === null
      ) {
        context.addIssue({
          code: 'custom',
          path: ['deploymentStatus'],
          message:
            'active calibration requires validation, held-out test evidence and an accepted RMSE bound',
        });
      } else if (
        value.testMetrics.rmseM > value.acceptedTestRmseM
      ) {
        context.addIssue({
          code: 'custom',
          path: ['testMetrics', 'rmseM'],
          message:
            'held-out test RMSE exceeds the accepted deployment error bound',
        });
      }

      const testLeadBreakdown = value.metricBreakdowns.find(
        (breakdown) =>
          breakdown.datasetSplit === 'TEST' &&
          breakdown.leadSeconds !== null,
      );
      if (!testLeadBreakdown) {
        context.addIssue({
          code: 'custom',
          path: ['metricBreakdowns'],
          message:
            'active stage calibration requires held-out lead-time MAE/RMSE breakdown',
        });
      }
    }
  });
export type CalibrationRunSummary = z.infer<
  typeof CalibrationRunSummarySchema
>;

export const RatingCurvePointSchema = z
  .object({
    dischargeCms: DischargeCmsSchema,
    stageM: StageMetresSchema,
  })
  .strict();
export type RatingCurvePoint = z.infer<typeof RatingCurvePointSchema>;

export const RatingCurveStatusSchema = z.enum([
  'CANDIDATE',
  'ACTIVE',
  'SUPERSEDED',
  'REJECTED',
]);
export type RatingCurveStatus = z.infer<typeof RatingCurveStatusSchema>;

export const RatingCurveModelSchema = z
  .object({
    id: NonEmptyIdSchema,
    version: NonEmptyIdSchema,
    stationId: NonEmptyIdSchema,
    riverReachId: NonEmptyIdSchema,
    calibrationRunId: NonEmptyIdSchema,
    datumId: NonEmptyIdSchema,
    method: z.literal('PIECEWISE_LINEAR'),
    stageUnit: z.literal('m'),
    dischargeUnit: z.literal('m3/s'),
    validDischargeMinCms: DischargeCmsSchema,
    validDischargeMaxCms: DischargeCmsSchema,
    extrapolationPolicy: z.literal('REJECT'),
    status: RatingCurveStatusSchema,
    points: z.array(RatingCurvePointSchema).min(2).max(10000),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.validDischargeMaxCms <= value.validDischargeMinCms) {
      context.addIssue({
        code: 'custom',
        path: ['validDischargeMaxCms'],
        message: 'rating-curve maximum discharge must exceed the minimum',
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
      if (current.stageM < previous.stageM) {
        context.addIssue({
          code: 'custom',
          path: ['points', index, 'stageM'],
          message: 'rating-curve stage points must be non-decreasing',
        });
      }
    }

    const first = value.points[0];
    const last = value.points[value.points.length - 1];
    if (
      first &&
      Math.abs(first.dischargeCms - value.validDischargeMinCms) >
        Number.EPSILON
    ) {
      context.addIssue({
        code: 'custom',
        path: ['validDischargeMinCms'],
        message:
          'validated minimum discharge must equal the first rating-curve point',
      });
    }
    if (
      last &&
      Math.abs(last.dischargeCms - value.validDischargeMaxCms) >
        Number.EPSILON
    ) {
      context.addIssue({
        code: 'custom',
        path: ['validDischargeMaxCms'],
        message:
          'validated maximum discharge must equal the last rating-curve point',
      });
    }
  });
export type RatingCurveModel = z.infer<typeof RatingCurveModelSchema>;

export const StageDerivationStatusSchema = z.enum([
  'AVAILABLE',
  'OUTSIDE_CALIBRATED_DOMAIN',
  'DATUM_MISMATCH',
]);
export type StageDerivationStatus = z.infer<
  typeof StageDerivationStatusSchema
>;

export type StageDerivationResult =
  | {
      readonly status: 'AVAILABLE';
      readonly dischargeCms: number;
      readonly stageM: number;
      readonly datumId: string;
      readonly curveId: string;
      readonly curveVersion: string;
      readonly calibrationRunId: string;
      readonly extrapolated: false;
    }
  | {
      readonly status:
        | 'OUTSIDE_CALIBRATED_DOMAIN'
        | 'DATUM_MISMATCH';
      readonly dischargeCms: number;
      readonly stageM: null;
      readonly datumId: string;
      readonly curveId: string;
      readonly curveVersion: string;
      readonly calibrationRunId: string;
      readonly extrapolated: false;
    };

export interface EvaluateRatingCurveInput {
  readonly dischargeCms: number;
  readonly expectedDatumId?: string;
}

function unavailable(
  curve: RatingCurveModel,
  dischargeCms: number,
  status:
    | 'OUTSIDE_CALIBRATED_DOMAIN'
    | 'DATUM_MISMATCH',
): StageDerivationResult {
  return {
    status,
    dischargeCms,
    stageM: null,
    datumId: curve.datumId,
    curveId: curve.id,
    curveVersion: curve.version,
    calibrationRunId: curve.calibrationRunId,
    extrapolated: false,
  };
}

export function evaluateRatingCurve(
  rawCurve: RatingCurveModel,
  input: EvaluateRatingCurveInput,
): StageDerivationResult {
  const curve = RatingCurveModelSchema.parse(rawCurve);
  const dischargeCms = DischargeCmsSchema.parse(
    input.dischargeCms,
  );

  if (
    input.expectedDatumId !== undefined &&
    input.expectedDatumId.trim() !== curve.datumId
  ) {
    return unavailable(
      curve,
      dischargeCms,
      'DATUM_MISMATCH',
    );
  }

  if (
    dischargeCms < curve.validDischargeMinCms ||
    dischargeCms > curve.validDischargeMaxCms
  ) {
    return unavailable(
      curve,
      dischargeCms,
      'OUTSIDE_CALIBRATED_DOMAIN',
    );
  }

  let stageM: number | null = null;
  for (let index = 0; index < curve.points.length; index += 1) {
    const point = curve.points[index]!;
    if (dischargeCms === point.dischargeCms) {
      stageM = point.stageM;
      break;
    }

    if (index === 0) continue;
    const previous = curve.points[index - 1]!;
    if (
      dischargeCms > previous.dischargeCms &&
      dischargeCms < point.dischargeCms
    ) {
      const ratio =
        (dischargeCms - previous.dischargeCms) /
        (point.dischargeCms - previous.dischargeCms);
      stageM =
        previous.stageM +
        ratio * (point.stageM - previous.stageM);
      break;
    }
  }

  if (stageM === null || !Number.isFinite(stageM)) {
    throw new Error(
      'validated rating curve could not interpolate an in-domain discharge',
    );
  }

  return {
    status: 'AVAILABLE',
    dischargeCms,
    stageM,
    datumId: curve.datumId,
    curveId: curve.id,
    curveVersion: curve.version,
    calibrationRunId: curve.calibrationRunId,
    extrapolated: false,
  };
}

export const RiverRiseDirectionSchema = z.enum([
  'RISING',
  'FALLING',
  'STABLE',
  'UNKNOWN',
]);
export type RiverRiseDirection = z.infer<
  typeof RiverRiseDirectionSchema
>;

export const StageEvidenceStatusSchema = z.enum([
  'AVAILABLE',
  'PARTIAL',
  'INSUFFICIENT_DATA',
]);
export type StageEvidenceStatus = z.infer<
  typeof StageEvidenceStatusSchema
>;


export const StageForecastPointSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('AVAILABLE'),
      sourceDischargeRecordId: NonEmptyIdSchema,
      validAt: IsoInstantSchema,
      leadSeconds: z.number().int().min(0).max(31_536_000),
      dischargeCms: DischargeCmsSchema,
      stageM: StageMetresSchema,
      unit: z.literal('m'),
      datumId: NonEmptyIdSchema,
      curveId: NonEmptyIdSchema,
      curveVersion: NonEmptyIdSchema,
      calibrationRunId: NonEmptyIdSchema,
      testRmseM: z.number().finite().min(0).max(10000),
      extrapolated: z.literal(false),
    })
    .strict(),
  z
    .object({
      status: z.enum([
        'OUTSIDE_CALIBRATED_DOMAIN',
        'DATUM_MISMATCH',
      ]),
      sourceDischargeRecordId: NonEmptyIdSchema,
      validAt: IsoInstantSchema,
      leadSeconds: z.number().int().min(0).max(31_536_000),
      dischargeCms: DischargeCmsSchema,
      stageM: z.null(),
      unit: z.literal('m'),
      datumId: NonEmptyIdSchema,
      curveId: NonEmptyIdSchema,
      curveVersion: NonEmptyIdSchema,
      calibrationRunId: NonEmptyIdSchema,
      testRmseM: z.number().finite().min(0).max(10000),
      extrapolated: z.literal(false),
    })
    .strict(),
]);
export type StageForecastPoint = z.infer<
  typeof StageForecastPointSchema
>;

export const PersistenceBacktestCaseSchema = z
  .object({
    originAt: IsoInstantSchema,
    validAt: IsoInstantSchema,
    leadSeconds: z.number().int().min(0).max(31_536_000),
    originStageM: StageMetresSchema,
    observedStageM: StageMetresSchema,
    datumId: NonEmptyIdSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const expectedLead =
      (Date.parse(value.validAt) - Date.parse(value.originAt)) /
      1000;
    if (
      expectedLead < 0 ||
      expectedLead !== value.leadSeconds
    ) {
      context.addIssue({
        code: 'custom',
        path: ['leadSeconds'],
        message:
          'leadSeconds must equal validAt minus originAt',
      });
    }
  });
export type PersistenceBacktestCase = z.infer<
  typeof PersistenceBacktestCaseSchema
>;

export interface PersistenceBacktestResult {
  readonly datumId: string;
  readonly overall: CalibrationMetrics | null;
  readonly byLead: readonly {
    readonly leadSeconds: number;
    readonly metrics: CalibrationMetrics;
  }[];
}

export function calculateCalibrationMetrics(
  errorsM: readonly number[],
): CalibrationMetrics | null {
  if (errorsM.length === 0) return null;
  if (
    errorsM.some(
      (error) => !Number.isFinite(error),
    )
  ) {
    throw new RangeError(
      'calibration errors must be finite',
    );
  }

  const absolute = errorsM.map((error) => Math.abs(error));
  const maeM =
    absolute.reduce((sum, value) => sum + value, 0) /
    absolute.length;
  const rmseM = Math.sqrt(
    errorsM.reduce(
      (sum, value) => sum + value * value,
      0,
    ) / errorsM.length,
  );

  return CalibrationMetricsSchema.parse({
    maeM,
    rmseM,
    sampleCount: errorsM.length,
  });
}

export function backtestPersistenceBaseline(
  rawCases: readonly PersistenceBacktestCase[],
  expectedDatumId: string,
): PersistenceBacktestResult {
  const datumId = NonEmptyIdSchema.parse(expectedDatumId);
  const cases = rawCases.map((item) =>
    PersistenceBacktestCaseSchema.parse(item),
  );

  if (
    cases.some((item) => item.datumId !== datumId)
  ) {
    throw new RangeError(
      'persistence baseline cannot mix incompatible stage datums',
    );
  }

  const overallErrors = cases.map(
    (item) => item.originStageM - item.observedStageM,
  );
  const byLeadMap = new Map<number, number[]>();
  for (const item of cases) {
    const errors = byLeadMap.get(item.leadSeconds) ?? [];
    errors.push(item.originStageM - item.observedStageM);
    byLeadMap.set(item.leadSeconds, errors);
  }

  return {
    datumId,
    overall: calculateCalibrationMetrics(overallErrors),
    byLead: [...byLeadMap.entries()]
      .sort(([left], [right]) => left - right)
      .map(([leadSeconds, errors]) => {
        const metrics = calculateCalibrationMetrics(errors);
        if (metrics === null) {
          throw new Error(
            'non-empty lead bucket unexpectedly produced no metrics',
          );
        }
        return { leadSeconds, metrics };
      }),
  };
}
