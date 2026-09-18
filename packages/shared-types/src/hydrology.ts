import { z } from 'zod';

import { IsoInstantSchema } from './common.js';

const NonEmptyIdSchema = z.string().trim().min(1).max(240);
const DischargeCmsSchema = z.number().finite().min(0).max(100_000_000);
const MappingConfidenceSchema = z.number().finite().min(0).max(1);
const DistanceKmSchema = z.number().finite().min(0).max(20_000);

export const RiverReachMappingStateSchema = z.enum([
  'MAPPED',
  'AMBIGUOUS',
  'UNMAPPED',
]);
export type RiverReachMappingState = z.infer<typeof RiverReachMappingStateSchema>;

export const RiverReachMappingMethodSchema = z.enum([
  'PROVIDER_ID',
  'MANUAL',
  'NAME_SPATIAL',
  'NEAREST_GEOMETRY',
  'MODEL_GRID_CELL',
]);
export type RiverReachMappingMethod = z.infer<typeof RiverReachMappingMethodSchema>;

export const RiverReachMappingCandidateSchema = z
  .object({
    providerReachId: NonEmptyIdSchema,
    distanceKm: DistanceKmSchema,
    confidence: MappingConfidenceSchema,
  })
  .strict();
export type RiverReachMappingCandidate = z.infer<
  typeof RiverReachMappingCandidateSchema
>;

export const RiverReachResolutionSchema = z
  .object({
    state: RiverReachMappingStateSchema,
    providerKey: z.string().trim().min(1).max(160),
    selectedProviderReachId: NonEmptyIdSchema.nullable(),
    candidates: z.array(RiverReachMappingCandidateSchema).max(32),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.state === 'MAPPED') {
      if (value.selectedProviderReachId === null) {
        context.addIssue({
          code: 'custom',
          path: ['selectedProviderReachId'],
          message: 'mapped reach resolution requires a selected provider reach id',
        });
      }
      if (
        value.selectedProviderReachId !== null &&
        !value.candidates.some(
          (candidate) =>
            candidate.providerReachId === value.selectedProviderReachId,
        )
      ) {
        context.addIssue({
          code: 'custom',
          path: ['candidates'],
          message: 'mapped reach resolution must include the selected provider reach candidate',
        });
      }
    }

    if (value.state === 'AMBIGUOUS') {
      if (value.selectedProviderReachId !== null) {
        context.addIssue({
          code: 'custom',
          path: ['selectedProviderReachId'],
          message: 'ambiguous reach resolution cannot select a provider reach',
        });
      }
      if (value.candidates.length < 2) {
        context.addIssue({
          code: 'custom',
          path: ['candidates'],
          message: 'ambiguous reach resolution requires at least two candidates',
        });
      }
    }

    if (value.state === 'UNMAPPED') {
      if (value.selectedProviderReachId !== null || value.candidates.length !== 0) {
        context.addIssue({
          code: 'custom',
          path: ['candidates'],
          message: 'unmapped reach resolution cannot contain selected/candidate reaches',
        });
      }
    }
  });
export type RiverReachResolution = z.infer<typeof RiverReachResolutionSchema>;

export const HydrologyDischargeProductKindSchema = z.enum([
  'FORECAST_MEAN',
  'FORECAST_STATISTIC',
  'FORECAST_ENSEMBLE_MEMBER',
  'RETROSPECTIVE_SIMULATION',
]);
export type HydrologyDischargeProductKind = z.infer<
  typeof HydrologyDischargeProductKindSchema
>;

export const HydrologyDischargeStatisticSchema = z.enum([
  'MEAN',
  'MEDIAN',
  'MIN',
  'MAX',
  'P10',
  'P25',
  'P75',
  'P90',
]);
export type HydrologyDischargeStatistic = z.infer<
  typeof HydrologyDischargeStatisticSchema
>;

export const HydrologyQualityStateSchema = z.enum([
  'VALID',
  'ESTIMATED',
  'SIMULATED',
  'SUSPECT',
  'MISSING',
]);
export type HydrologyQualityState = z.infer<typeof HydrologyQualityStateSchema>;

export const HydrologyQualitySchema = z
  .object({
    state: HydrologyQualityStateSchema,
    flags: z.array(z.string().trim().min(1).max(120)).max(64),
  })
  .strict();
export type HydrologyQuality = z.infer<typeof HydrologyQualitySchema>;

export const HydrologyReachMappingMetadataSchema = z
  .object({
    state: z.enum(['MAPPED', 'AMBIGUOUS']),
    method: RiverReachMappingMethodSchema,
    confidence: MappingConfidenceSchema,
    distanceKm: DistanceKmSchema.nullable(),
  })
  .strict();
export type HydrologyReachMappingMetadata = z.infer<
  typeof HydrologyReachMappingMetadataSchema
>;

export const HydrologySourceProvenanceSchema = z
  .object({
    sourceId: z.string().trim().min(1).max(200),
    providerConfigId: z.string().trim().min(1).max(200).nullable(),
    productId: z.string().trim().min(1).max(200),
    productVersion: z.string().trim().min(1).max(200).nullable(),
    fetchedAt: IsoInstantSchema,
    attributionText: z.string().trim().min(1).max(500),
    attributionUrl: z.string().url().max(2048).nullable(),
  })
  .strict();
export type HydrologySourceProvenance = z.infer<
  typeof HydrologySourceProvenanceSchema
>;

export const HydrologyDischargeRecordSchema = z
  .object({
    id: NonEmptyIdSchema,
    productKind: HydrologyDischargeProductKindSchema,
    riverReachId: NonEmptyIdSchema,
    providerReachId: NonEmptyIdSchema,
    mapping: HydrologyReachMappingMetadataSchema,
    validAt: IsoInstantSchema,
    modelRunAt: IsoInstantSchema.nullable(),
    leadSeconds: z.number().int().min(0).max(31_536_000).nullable(),
    dischargeCms: DischargeCmsSchema,
    unit: z.literal('m3/s'),
    ensembleMember: z.number().int().min(0).max(10_000).nullable(),
    statistic: HydrologyDischargeStatisticSchema.nullable(),
    quality: HydrologyQualitySchema,
    source: HydrologySourceProvenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const isForecast =
      value.productKind === 'FORECAST_MEAN' ||
      value.productKind === 'FORECAST_STATISTIC' ||
      value.productKind === 'FORECAST_ENSEMBLE_MEMBER';

    if (isForecast) {
      if (value.modelRunAt === null || value.leadSeconds === null) {
        context.addIssue({
          code: 'custom',
          path: ['modelRunAt'],
          message: 'forecast discharge requires modelRunAt and leadSeconds',
        });
      } else {
        const expectedLead = (Date.parse(value.validAt) - Date.parse(value.modelRunAt)) / 1000;
        if (expectedLead < 0 || expectedLead !== value.leadSeconds) {
          context.addIssue({
            code: 'custom',
            path: ['leadSeconds'],
            message: 'leadSeconds must equal validAt minus modelRunAt',
          });
        }
      }
    } else if (value.modelRunAt !== null || value.leadSeconds !== null) {
      context.addIssue({
        code: 'custom',
        path: ['modelRunAt'],
        message: 'retrospective simulation cannot masquerade as a forecast run',
      });
    }

    if (value.productKind === 'FORECAST_MEAN') {
      if (value.statistic !== 'MEAN' || value.ensembleMember !== null) {
        context.addIssue({
          code: 'custom',
          path: ['statistic'],
          message: 'forecast mean requires MEAN statistic and no ensemble member',
        });
      }
    }

    if (value.productKind === 'FORECAST_STATISTIC') {
      if (value.statistic === null || value.ensembleMember !== null) {
        context.addIssue({
          code: 'custom',
          path: ['statistic'],
          message: 'forecast statistic requires a statistic and no ensemble member',
        });
      }
    }

    if (value.productKind === 'FORECAST_ENSEMBLE_MEMBER') {
      if (value.ensembleMember === null || value.statistic !== null) {
        context.addIssue({
          code: 'custom',
          path: ['ensembleMember'],
          message: 'ensemble forecast requires member id and no statistic label',
        });
      }
    }

    if (value.productKind === 'RETROSPECTIVE_SIMULATION') {
      if (
        value.ensembleMember !== null ||
        value.statistic !== null ||
        value.quality.state !== 'SIMULATED'
      ) {
        context.addIssue({
          code: 'custom',
          path: ['quality', 'state'],
          message: 'retrospective discharge must remain an explicit simulation',
        });
      }
    }
  });
export type HydrologyDischargeRecord = z.infer<
  typeof HydrologyDischargeRecordSchema
>;

export const HydrologyReturnPeriodRecordSchema = z
  .object({
    id: NonEmptyIdSchema,
    riverReachId: NonEmptyIdSchema,
    providerReachId: NonEmptyIdSchema,
    mapping: HydrologyReachMappingMetadataSchema,
    returnPeriodYears: z.number().int().min(2).max(10_000),
    dischargeCms: DischargeCmsSchema,
    unit: z.literal('m3/s'),
    retrospectivePeriodStart: IsoInstantSchema,
    retrospectivePeriodEnd: IsoInstantSchema,
    source: HydrologySourceProvenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      Date.parse(value.retrospectivePeriodEnd) <=
      Date.parse(value.retrospectivePeriodStart)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['retrospectivePeriodEnd'],
        message: 'retrospectivePeriodEnd must be later than retrospectivePeriodStart',
      });
    }
  });
export type HydrologyReturnPeriodRecord = z.infer<
  typeof HydrologyReturnPeriodRecordSchema
>;
