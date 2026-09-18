import { z } from 'zod';

import { IsoInstantSchema } from './common.js';

const NonEmptyIdSchema = z.string().trim().min(1).max(240);
const CoordinateLatitudeSchema = z.number().finite().min(-90).max(90);
const CoordinateLongitudeSchema = z.number().finite().min(-180).max(180);
const NonNegativeNumberSchema = z.number().finite().min(0);

export const FloodRiskLevelSchema = z.enum([
  'LOW',
  'MODERATE',
  'HIGH',
  'VERY_HIGH',
  'EXTREME',
  'INSUFFICIENT_DATA',
]);
export type FloodRiskLevel = z.infer<typeof FloodRiskLevelSchema>;

export const FloodRiskConfidenceSchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
]);
export type FloodRiskConfidence = z.infer<
  typeof FloodRiskConfidenceSchema
>;

export const FloodInputFreshnessSchema = z.enum([
  'FRESH',
  'STALE',
  'MISSING',
]);
export type FloodInputFreshness = z.infer<
  typeof FloodInputFreshnessSchema
>;

export const FloodRiskScopeSchema = z
  .object({
    kind: z.enum(['POINT', 'REACH', 'BASIN']),
    id: NonEmptyIdSchema.nullable().optional(),
    latitude: CoordinateLatitudeSchema.nullable().optional(),
    longitude: CoordinateLongitudeSchema.nullable().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.kind === 'POINT' &&
      (value.latitude == null || value.longitude == null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['latitude'],
        message: 'point flood-risk scope requires coordinates',
      });
    }
    if (
      value.kind !== 'POINT' &&
      (value.id === undefined || value.id === null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['id'],
        message: 'reach/basin flood-risk scope requires an id',
      });
    }
  });
export type FloodRiskScope = z.infer<typeof FloodRiskScopeSchema>;

export const FloodRainfallInputSchema = z
  .object({
    freshness: FloodInputFreshnessSchema,
    coverageRatio: z.number().finite().min(0).max(1),
    oneHourMm: NonNegativeNumberSchema.nullable(),
    threeHourMm: NonNegativeNumberSchema.nullable(),
    twentyFourHourMm: NonNegativeNumberSchema.nullable(),
    seventyTwoHourMm: NonNegativeNumberSchema.nullable(),
    disagreementRatio: z.number().finite().min(0).max(1).nullable(),
    sourceIds: z.array(NonEmptyIdSchema).max(64),
  })
  .strict();
export type FloodRainfallInput = z.infer<
  typeof FloodRainfallInputSchema
>;

export const FloodRiverInputSchema = z
  .object({
    freshness: FloodInputFreshnessSchema,
    currentDischargeCms: NonNegativeNumberSchema,
    peakDischargeCms: NonNegativeNumberSchema,
    exceededReturnPeriodYears: z
      .number()
      .int()
      .min(2)
      .max(10_000)
      .nullable(),
    disagreementRatio: z.number().finite().min(0).max(1).nullable(),
    sourceIds: z.array(NonEmptyIdSchema).min(1).max(64),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.peakDischargeCms < value.currentDischargeCms) {
      context.addIssue({
        code: 'custom',
        path: ['peakDischargeCms'],
        message: 'peak discharge cannot be lower than current discharge',
      });
    }
  });
export type FloodRiverInput = z.infer<typeof FloodRiverInputSchema>;

export const FloodStageInputSchema = z
  .object({
    freshness: FloodInputFreshnessSchema,
    evidenceStatus: z.enum([
      'AVAILABLE',
      'PARTIAL',
      'INSUFFICIENT_DATA',
    ]),
    maxRiseM: NonNegativeNumberSchema.nullable(),
    peakStageM: z.number().finite().nullable(),
    datumId: NonEmptyIdSchema.nullable(),
    sourceIds: z.array(NonEmptyIdSchema).max(64),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.evidenceStatus !== 'INSUFFICIENT_DATA' &&
      (value.maxRiseM === null ||
        value.peakStageM === null ||
        value.datumId === null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['evidenceStatus'],
        message:
          'available/partial stage evidence requires rise, peak and datum',
      });
    }
  });
export type FloodStageInput = z.infer<typeof FloodStageInputSchema>;

export const FloodTideInputSchema = z
  .object({
    relevant: z.boolean(),
    freshness: FloodInputFreshnessSchema,
    level: z.enum(['NORMAL', 'ELEVATED', 'HIGH']),
    sourceIds: z.array(NonEmptyIdSchema).max(64),
  })
  .strict();
export type FloodTideInput = z.infer<typeof FloodTideInputSchema>;

export const FloodSusceptibilityInputSchema = z
  .object({
    level: z.enum([
      'UNKNOWN',
      'LOW',
      'MODERATE',
      'HIGH',
      'VERY_HIGH',
    ]),
    sourceId: NonEmptyIdSchema.nullable(),
    resolutionMeters: z.number().finite().positive().nullable(),
    limitation: z.string().trim().min(1).max(1000).nullable(),
  })
  .strict();
export type FloodSusceptibilityInput = z.infer<
  typeof FloodSusceptibilityInputSchema
>;

export const DeterministicFloodRiskInputSchema = z
  .object({
    scope: FloodRiskScopeSchema,
    validFrom: IsoInstantSchema,
    validTo: IsoInstantSchema,
    generatedAt: IsoInstantSchema,
    rainfall: FloodRainfallInputSchema.nullable(),
    river: FloodRiverInputSchema.nullable(),
    stage: FloodStageInputSchema.nullable(),
    tide: FloodTideInputSchema.nullable(),
    susceptibility: FloodSusceptibilityInputSchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (Date.parse(value.validTo) <= Date.parse(value.validFrom)) {
      context.addIssue({
        code: 'custom',
        path: ['validTo'],
        message: 'validTo must be later than validFrom',
      });
    }
  });
export type DeterministicFloodRiskInput = z.infer<
  typeof DeterministicFloodRiskInputSchema
>;

export const FloodRiskDriverSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    state: z.enum([
      'AVAILABLE',
      'MISSING',
      'STALE',
      'DISAGREEMENT',
    ]),
    contribution: z.number().int().min(0).max(100),
    value: z.number().finite().nullable(),
    unit: z.string().trim().min(1).max(40).nullable(),
    reason: z.string().trim().min(1).max(500),
    sourceIds: z.array(NonEmptyIdSchema).max(64),
  })
  .strict();
export type FloodRiskDriver = z.infer<typeof FloodRiskDriverSchema>;

const HydrologicHazardSchema = z
  .object({
    level: FloodRiskLevelSchema,
    score: z.number().int().min(0).max(100).nullable(),
  })
  .strict();

const SusceptibilitySummarySchema = z
  .object({
    level: z.enum([
      'UNKNOWN',
      'LOW',
      'MODERATE',
      'HIGH',
      'VERY_HIGH',
    ]),
    sourceId: NonEmptyIdSchema.nullable(),
    resolutionMeters: z.number().finite().positive().nullable(),
  })
  .strict();

const LocalImpactSummarySchema = z
  .object({
    level: z.enum([
      'UNKNOWN',
      'LOW',
      'MODERATE',
      'HIGH',
      'VERY_HIGH',
    ]),
    reasons: z.array(z.string().trim().min(1).max(500)).max(64),
  })
  .strict();

export const FloodProbabilityCalibrationEvidenceSchema = z
  .object({
    id: NonEmptyIdSchema,
    version: NonEmptyIdSchema,
    status: z.literal('VALIDATED'),
    eventDefinition: z.string().trim().min(20).max(2000),
    validationPeriod: z
      .object({
        start: IsoInstantSchema,
        end: IsoInstantSchema,
      })
      .strict(),
    sampleCount: z.number().int().min(30).max(100_000_000),
    brierScore: z.number().finite().min(0).max(1),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      Date.parse(value.validationPeriod.end) <=
      Date.parse(value.validationPeriod.start)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['validationPeriod', 'end'],
        message: 'probability validation period must have positive width',
      });
    }
  });
export type FloodProbabilityCalibrationEvidence = z.infer<
  typeof FloodProbabilityCalibrationEvidenceSchema
>;

export const FloodProbabilityRangeSchema = z
  .object({
    min: z.number().finite().min(0).max(1),
    max: z.number().finite().min(0).max(1),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.max < value.min) {
      context.addIssue({
        code: 'custom',
        path: ['max'],
        message: 'probability range max must be >= min',
      });
    }
  });
export type FloodProbabilityRange = z.infer<
  typeof FloodProbabilityRangeSchema
>;

export const FloodRiskAssessmentSchema = z
  .object({
    scope: FloodRiskScopeSchema,
    validFrom: IsoInstantSchema,
    validTo: IsoInstantSchema,
    generatedAt: IsoInstantSchema,
    riskLevel: FloodRiskLevelSchema,
    confidence: FloodRiskConfidenceSchema,
    hydrologicHazard: HydrologicHazardSchema,
    inundationSusceptibility: SusceptibilitySummarySchema,
    localImpact: LocalImpactSummarySchema,
    drivers: z.array(FloodRiskDriverSchema).max(64),
    reasons: z.array(z.string().trim().min(1).max(500)).max(64),
    sourceSummary: z.array(NonEmptyIdSchema).max(128),
    modelVersion: NonEmptyIdSchema,
    freshness: z
      .object({
        rainfall: FloodInputFreshnessSchema,
        river: FloodInputFreshnessSchema,
        stage: FloodInputFreshnessSchema,
        tide: FloodInputFreshnessSchema,
      })
      .strict(),
    limitations: z.array(z.string().trim().min(1).max(500)).max(128),
    probabilityRange: FloodProbabilityRangeSchema.optional(),
    probabilityCalibration:
      FloodProbabilityCalibrationEvidenceSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const hasRange = value.probabilityRange !== undefined;
    const hasCalibration =
      value.probabilityCalibration !== undefined;
    if (hasRange !== hasCalibration) {
      context.addIssue({
        code: 'custom',
        path: ['probabilityRange'],
        message:
          'numerical probability requires validated probability calibration evidence and vice versa',
      });
    }
    if (
      value.riskLevel === 'INSUFFICIENT_DATA' &&
      (hasRange || hasCalibration)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['probabilityRange'],
        message:
          'insufficient-data assessment cannot publish numerical probability',
      });
    }
  });
export type FloodRiskAssessment = z.infer<
  typeof FloodRiskAssessmentSchema
>;

export interface DeterministicFloodRiskRuleConfig {
  readonly modelVersion: string;
  readonly disagreementThreshold: number;
  readonly minimumFreshDriverGroups: number;
}

export const DEFAULT_DETERMINISTIC_FLOOD_RISK_RULES: DeterministicFloodRiskRuleConfig =
  Object.freeze({
    modelVersion: 'flood-risk-rules-v1',
    disagreementThreshold: 0.5,
    minimumFreshDriverGroups: 2,
  });

function levelForScore(score: number): Exclude<
  FloodRiskLevel,
  'INSUFFICIENT_DATA'
> {
  if (score >= 90) return 'EXTREME';
  if (score >= 55) return 'VERY_HIGH';
  if (score >= 30) return 'HIGH';
  if (score >= 15) return 'MODERATE';
  return 'LOW';
}

function downgrade(
  confidence: FloodRiskConfidence,
): FloodRiskConfidence {
  if (confidence === 'HIGH') return 'MEDIUM';
  return 'LOW';
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right),
  );
}

function rainfallContribution(
  input: FloodRainfallInput,
): { score: number; drivers: FloodRiskDriver[]; reasons: string[] } {
  let score = 0;
  const drivers: FloodRiskDriver[] = [];
  const reasons: string[] = [];

  const add = (
    id: string,
    value: number | null,
    thresholds: readonly [number, number][],
    label: string,
  ) => {
    let contribution = 0;
    if (value !== null) {
      for (const [threshold, points] of thresholds) {
        if (value >= threshold) {
          contribution = points;
          break;
        }
      }
    }
    score += contribution;
    drivers.push({
      id,
      state: value === null ? 'MISSING' : 'AVAILABLE',
      contribution,
      value,
      unit: 'mm',
      reason:
        value === null
          ? `${label} is unavailable.`
          : `${label} = ${value} mm.`,
      sourceIds: input.sourceIds,
    });
    if (contribution > 0) {
      reasons.push(`${label} contributes to hydrologic hazard.`);
    }
  };

  add(
    'rainfall-1h',
    input.oneHourMm,
    [
      [50, 25],
      [25, 15],
      [10, 5],
    ],
    '1-hour rainfall',
  );
  add(
    'rainfall-24h',
    input.twentyFourHourMm,
    [
      [200, 30],
      [100, 20],
      [50, 10],
    ],
    '24-hour rainfall',
  );
  add(
    'antecedent-rainfall-72h',
    input.seventyTwoHourMm,
    [
      [350, 20],
      [200, 12],
      [100, 5],
    ],
    '72-hour antecedent rainfall',
  );

  return { score, drivers, reasons };
}

function riverContribution(
  input: FloodRiverInput,
): { score: number; drivers: FloodRiskDriver[]; reasons: string[] } {
  let returnPeriodPoints = 0;
  const years = input.exceededReturnPeriodYears;
  if (years !== null) {
    if (years >= 100) returnPeriodPoints = 40;
    else if (years >= 50) returnPeriodPoints = 35;
    else if (years >= 20) returnPeriodPoints = 28;
    else if (years >= 10) returnPeriodPoints = 18;
    else if (years >= 5) returnPeriodPoints = 10;
    else if (years >= 2) returnPeriodPoints = 5;
  }

  const ratio =
    input.currentDischargeCms > 0
      ? input.peakDischargeCms / input.currentDischargeCms
      : input.peakDischargeCms > 0
        ? Number.POSITIVE_INFINITY
        : 1;
  const risePoints =
    ratio >= 1.5 ? 10 : ratio >= 1.25 ? 5 : 0;

  const drivers: FloodRiskDriver[] = [
    {
      id: 'discharge-return-period',
      state: 'AVAILABLE',
      contribution: returnPeriodPoints,
      value: years,
      unit: 'years',
      reason:
        years === null
          ? 'Forecast discharge does not exceed a known return-period threshold.'
          : `Forecast discharge exceeds the ${years}-year reference-flow threshold.`,
      sourceIds: input.sourceIds,
    },
    {
      id: 'discharge-rise',
      state: 'AVAILABLE',
      contribution: risePoints,
      value: Number.isFinite(ratio) ? ratio : null,
      unit: 'ratio',
      reason: `Peak/current discharge ratio = ${
        Number.isFinite(ratio) ? ratio.toFixed(3) : 'unbounded'
      }.`,
      sourceIds: input.sourceIds,
    },
  ];

  return {
    score: returnPeriodPoints + risePoints,
    drivers,
    reasons: drivers
      .filter((driver) => driver.contribution > 0)
      .map((driver) => driver.reason),
  };
}

function stageContribution(
  input: FloodStageInput,
): { score: number; driver: FloodRiskDriver; reason: string | null } {
  if (
    input.evidenceStatus === 'INSUFFICIENT_DATA' ||
    input.maxRiseM === null
  ) {
    return {
      score: 0,
      driver: {
        id: 'stage-rise',
        state: 'MISSING',
        contribution: 0,
        value: null,
        unit: 'm',
        reason: 'Calibrated river-stage rise is unavailable.',
        sourceIds: input.sourceIds,
      },
      reason: null,
    };
  }

  const contribution =
    input.maxRiseM >= 1.5
      ? 30
      : input.maxRiseM >= 1
        ? 20
        : input.maxRiseM >= 0.5
          ? 10
          : input.maxRiseM >= 0.2
            ? 5
            : 0;

  return {
    score: contribution,
    driver: {
      id: 'stage-rise',
      state: 'AVAILABLE',
      contribution,
      value: input.maxRiseM,
      unit: 'm',
      reason: `Maximum calibrated stage rise = ${input.maxRiseM} m.`,
      sourceIds: input.sourceIds,
    },
    reason:
      contribution > 0
        ? 'Calibrated river-stage rise contributes to hydrologic hazard.'
        : null,
  };
}

function susceptibilityContribution(
  input: FloodSusceptibilityInput | null,
): number {
  if (input === null) return 0;
  switch (input.level) {
    case 'VERY_HIGH':
      return 15;
    case 'HIGH':
      return 10;
    case 'MODERATE':
      return 5;
    default:
      return 0;
  }
}

function insufficient(
  input: DeterministicFloodRiskInput,
  limitations: readonly string[],
  drivers: readonly FloodRiskDriver[],
  config: DeterministicFloodRiskRuleConfig,
): FloodRiskAssessment {
  const sourceSummary = unique([
    ...(input.rainfall?.sourceIds ?? []),
    ...(input.river?.sourceIds ?? []),
    ...(input.stage?.sourceIds ?? []),
    ...(input.tide?.sourceIds ?? []),
    ...(input.susceptibility?.sourceId
      ? [input.susceptibility.sourceId]
      : []),
  ]);

  return FloodRiskAssessmentSchema.parse({
    scope: input.scope,
    validFrom: input.validFrom,
    validTo: input.validTo,
    generatedAt: input.generatedAt,
    riskLevel: 'INSUFFICIENT_DATA',
    confidence: 'LOW',
    hydrologicHazard: {
      level: 'INSUFFICIENT_DATA',
      score: null,
    },
    inundationSusceptibility: {
      level: input.susceptibility?.level ?? 'UNKNOWN',
      sourceId: input.susceptibility?.sourceId ?? null,
      resolutionMeters:
        input.susceptibility?.resolutionMeters ?? null,
    },
    localImpact: { level: 'UNKNOWN', reasons: [] },
    drivers,
    reasons: [],
    sourceSummary,
    modelVersion: config.modelVersion,
    freshness: {
      rainfall: input.rainfall?.freshness ?? 'MISSING',
      river: input.river?.freshness ?? 'MISSING',
      stage: input.stage?.freshness ?? 'MISSING',
      tide: input.tide?.freshness ?? 'MISSING',
    },
    limitations: unique([
      ...limitations,
      'LOCAL_IMPACT_DATA_UNAVAILABLE',
    ]),
  });
}

export function evaluateDeterministicFloodRisk(
  rawInput: DeterministicFloodRiskInput,
  config: DeterministicFloodRiskRuleConfig =
    DEFAULT_DETERMINISTIC_FLOOD_RISK_RULES,
): FloodRiskAssessment {
  const input = DeterministicFloodRiskInputSchema.parse(rawInput);
  if (
    !Number.isFinite(config.disagreementThreshold) ||
    config.disagreementThreshold < 0 ||
    config.disagreementThreshold > 1 ||
    !Number.isInteger(config.minimumFreshDriverGroups) ||
    config.minimumFreshDriverGroups < 1 ||
    config.minimumFreshDriverGroups > 4 ||
    config.modelVersion.trim().length === 0
  ) {
    throw new RangeError('Flood-risk rule configuration is invalid.');
  }

  const drivers: FloodRiskDriver[] = [];
  const limitations: string[] = [];

  if (input.river === null) {
    return insufficient(
      input,
      ['FRESH_RIVER_DISCHARGE_REQUIRED'],
      drivers,
      config,
    );
  }
  if (input.river.freshness !== 'FRESH') {
    return insufficient(
      input,
      [
        input.river.freshness === 'STALE'
          ? 'STALE_RIVER_DISCHARGE_NOT_USED_AS_LIVE'
          : 'FRESH_RIVER_DISCHARGE_REQUIRED',
      ],
      drivers,
      config,
    );
  }

  let freshGroups = 1;
  if (input.rainfall?.freshness === 'FRESH') freshGroups += 1;
  if (
    input.stage?.freshness === 'FRESH' &&
    input.stage.evidenceStatus !== 'INSUFFICIENT_DATA'
  ) {
    freshGroups += 1;
  }
  if (
    input.tide?.relevant === true &&
    input.tide.freshness === 'FRESH'
  ) {
    freshGroups += 1;
  }

  if (freshGroups < config.minimumFreshDriverGroups) {
    return insufficient(
      input,
      ['INSUFFICIENT_INDEPENDENT_DRIVER_GROUPS'],
      drivers,
      config,
    );
  }

  let confidence: FloodRiskConfidence = 'HIGH';
  let hazardScore = 0;
  const reasons: string[] = [];

  if (input.rainfall === null) {
    confidence = downgrade(confidence);
    limitations.push('RAINFALL_CONTEXT_UNAVAILABLE');
    drivers.push({
      id: 'rainfall-context',
      state: 'MISSING',
      contribution: 0,
      value: null,
      unit: null,
      reason: 'Rainfall context is unavailable.',
      sourceIds: [],
    });
  } else if (input.rainfall.freshness !== 'FRESH') {
    confidence = downgrade(confidence);
    limitations.push('STALE_RAINFALL_NOT_USED_AS_LIVE');
    drivers.push({
      id: 'rainfall-context',
      state: 'STALE',
      contribution: 0,
      value: null,
      unit: null,
      reason: 'Rainfall context is stale and is not scored as live.',
      sourceIds: input.rainfall.sourceIds,
    });
  } else {
    const rainfall = rainfallContribution(input.rainfall);
    hazardScore += rainfall.score;
    drivers.push(...rainfall.drivers);
    reasons.push(...rainfall.reasons);
    if (
      input.rainfall.coverageRatio < 0.75
    ) {
      confidence = downgrade(confidence);
      limitations.push('RAINFALL_TEMPORAL_COVERAGE_INCOMPLETE');
    }
    if (
      input.rainfall.disagreementRatio !== null &&
      input.rainfall.disagreementRatio >
        config.disagreementThreshold
    ) {
      confidence = downgrade(confidence);
      limitations.push('RAINFALL_SOURCE_DISAGREEMENT');
      drivers.push({
        id: 'rainfall-source-disagreement',
        state: 'DISAGREEMENT',
        contribution: 0,
        value: input.rainfall.disagreementRatio,
        unit: 'ratio',
        reason:
          'Comparable rainfall sources materially disagree.',
        sourceIds: input.rainfall.sourceIds,
      });
    }
  }

  const river = riverContribution(input.river);
  hazardScore += river.score;
  drivers.push(...river.drivers);
  reasons.push(...river.reasons);
  if (
    input.river.disagreementRatio !== null &&
    input.river.disagreementRatio >
      config.disagreementThreshold
  ) {
    confidence = downgrade(confidence);
    limitations.push('RIVER_SOURCE_DISAGREEMENT');
    drivers.push({
      id: 'river-source-disagreement',
      state: 'DISAGREEMENT',
      contribution: 0,
      value: input.river.disagreementRatio,
      unit: 'ratio',
      reason:
        'Comparable discharge sources materially disagree.',
      sourceIds: input.river.sourceIds,
    });
  }

  if (input.stage === null) {
    confidence = downgrade(confidence);
    limitations.push('CALIBRATED_STAGE_UNAVAILABLE');
    drivers.push({
      id: 'stage-rise',
      state: 'MISSING',
      contribution: 0,
      value: null,
      unit: 'm',
      reason: 'Calibrated stage evidence is unavailable.',
      sourceIds: [],
    });
  } else if (
    input.stage.freshness !== 'FRESH' ||
    input.stage.evidenceStatus === 'INSUFFICIENT_DATA'
  ) {
    confidence = downgrade(confidence);
    limitations.push(
      input.stage.freshness === 'STALE'
        ? 'STALE_STAGE_NOT_USED_AS_LIVE'
        : 'CALIBRATED_STAGE_UNAVAILABLE',
    );
    const stage = stageContribution(input.stage);
    drivers.push(stage.driver);
  } else {
    const stage = stageContribution(input.stage);
    hazardScore += stage.score;
    drivers.push(stage.driver);
    if (stage.reason) reasons.push(stage.reason);
    if (input.stage.evidenceStatus === 'PARTIAL') {
      confidence = downgrade(confidence);
      limitations.push('CALIBRATED_STAGE_PARTIAL');
    }
  }

  if (input.tide?.relevant === true) {
    if (input.tide.freshness !== 'FRESH') {
      confidence = downgrade(confidence);
      limitations.push('RELEVANT_TIDE_CONTEXT_STALE_OR_MISSING');
      drivers.push({
        id: 'downstream-tide',
        state: 'STALE',
        contribution: 0,
        value: null,
        unit: null,
        reason:
          'Downstream tide is relevant but stale/missing.',
        sourceIds: input.tide.sourceIds,
      });
    } else {
      const contribution =
        input.tide.level === 'HIGH'
          ? 15
          : input.tide.level === 'ELEVATED'
            ? 8
            : 0;
      hazardScore += contribution;
      drivers.push({
        id: 'downstream-tide',
        state: 'AVAILABLE',
        contribution,
        value:
          input.tide.level === 'HIGH'
            ? 2
            : input.tide.level === 'ELEVATED'
              ? 1
              : 0,
        unit: 'ordinal',
        reason: `Downstream tide context = ${input.tide.level}.`,
        sourceIds: input.tide.sourceIds,
      });
      if (contribution > 0) {
        reasons.push(
          'Downstream tide can compound river drainage/flood hazard.',
        );
      }
    }
  }

  const boundedHazardScore = Math.min(
    100,
    Math.max(0, Math.round(hazardScore)),
  );
  const hazardLevel = levelForScore(boundedHazardScore);
  const susceptibilityPoints =
    susceptibilityContribution(input.susceptibility);
  const compositeScore = Math.min(
    100,
    boundedHazardScore + susceptibilityPoints,
  );
  const riskLevel = levelForScore(compositeScore);

  if (
    input.susceptibility === null ||
    input.susceptibility.level === 'UNKNOWN'
  ) {
    limitations.push('INUNDATION_SUSCEPTIBILITY_UNAVAILABLE');
  } else if (input.susceptibility.limitation) {
    limitations.push(
      `SUSCEPTIBILITY_BASELINE_LIMITATION: ${input.susceptibility.limitation}`,
    );
  }

  limitations.push('LOCAL_IMPACT_DATA_UNAVAILABLE');

  const sourceSummary = unique([
    ...(input.rainfall?.sourceIds ?? []),
    ...input.river.sourceIds,
    ...(input.stage?.sourceIds ?? []),
    ...(input.tide?.sourceIds ?? []),
    ...(input.susceptibility?.sourceId
      ? [input.susceptibility.sourceId]
      : []),
  ]);

  return FloodRiskAssessmentSchema.parse({
    scope: input.scope,
    validFrom: input.validFrom,
    validTo: input.validTo,
    generatedAt: input.generatedAt,
    riskLevel,
    confidence,
    hydrologicHazard: {
      level: hazardLevel,
      score: boundedHazardScore,
    },
    inundationSusceptibility: {
      level: input.susceptibility?.level ?? 'UNKNOWN',
      sourceId: input.susceptibility?.sourceId ?? null,
      resolutionMeters:
        input.susceptibility?.resolutionMeters ?? null,
    },
    localImpact: {
      level: 'UNKNOWN',
      reasons: [],
    },
    drivers,
    reasons: unique(reasons),
    sourceSummary,
    modelVersion: config.modelVersion,
    freshness: {
      rainfall: input.rainfall?.freshness ?? 'MISSING',
      river: input.river.freshness,
      stage: input.stage?.freshness ?? 'MISSING',
      tide: input.tide?.freshness ?? 'MISSING',
    },
    limitations: unique(limitations),
  });
}
