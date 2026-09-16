import {
  CommercialUseStatusSchema,
  ProviderCapabilitySchema,
  ProviderHealthStateSchema,
  ProviderRedistributionStatusSchema,
} from '@connuoc/shared-types';
import { z } from 'zod';

const CREDENTIAL_KEYS = new Set([
  'apikey',
  'api_key',
  'token',
  'password',
  'secretvalue',
  'secret_value',
  'authorization',
  'bearer',
]);

function containsCredentialKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsCredentialKey);
  if (typeof value !== 'object' || value === null) return false;
  return Object.entries(value).some(
    ([key, nested]) => CREDENTIAL_KEYS.has(key.toLowerCase()) || containsCredentialKey(nested),
  );
}

const SafeMetadataSchema = z
  .record(z.string().min(1).max(128), z.unknown())
  .refine((value) => !containsCredentialKey(value), 'credential-looking metadata fields are not allowed');

const EndpointConfigSchema = z
  .object({
    baseUrl: z.string().url().max(2048).optional(),
    timeoutMs: z.number().int().min(100).max(120_000).optional(),
  })
  .strict();

const QuotaPolicySchema = z
  .object({
    requestsPerDay: z.number().int().min(1).max(1_000_000_000).optional(),
    blockWhenExhausted: z.boolean().optional(),
  })
  .strict();

const BudgetPolicySchema = z
  .object({
    monthlyUsd: z.number().finite().min(0).max(1_000_000_000).optional(),
    blockWhenExceeded: z.boolean().optional(),
  })
  .strict();

const FreshnessPolicySchema = z
  .object({
    maxAgeSeconds: z.number().int().min(60).max(31_536_000).optional(),
  })
  .strict();

const PositionSchema = z.tuple([
  z.number().finite().min(-180).max(180),
  z.number().finite().min(-90).max(90),
]);
const LinearRingSchema = z.array(PositionSchema).min(4).max(10_000);
const PolygonSchema = z.array(LinearRingSchema).min(1).max(1_000);

export const ProviderCoverageGeoJsonSchema = z
  .object({
    type: z.literal('MultiPolygon'),
    coordinates: z.array(PolygonSchema).min(1).max(1_000),
  })
  .strict()
  .superRefine((value, context) => {
    let points = 0;
    for (const polygon of value.coordinates) {
      for (const ring of polygon) {
        points += ring.length;
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
          context.addIssue({ code: 'custom', message: 'coverage rings must be closed' });
          return;
        }
      }
    }
    if (points > 50_000) {
      context.addIssue({ code: 'custom', message: 'coverage exceeds the 50000-point limit' });
    }
  });

const NullableTextSchema = z.string().trim().min(1).max(500).nullable();
const NullableUrlSchema = z.string().url().max(2048).nullable();

export const ProviderConfigWriteSchema = z
  .object({
    providerType: z.string().trim().min(1).max(128),
    enabled: z.boolean(),
    priority: z.number().int().min(0).max(1_000_000),
    weight: z.number().finite().min(0).max(1_000_000),
    secretRef: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._:/@-]*$/, 'secretRef must be an opaque reference identifier')
      .nullable(),
    endpointConfig: EndpointConfigSchema,
    commercialUseStatus: CommercialUseStatusSchema,
    redistributionStatus: ProviderRedistributionStatusSchema,
    licenceStatus: z.enum(['REVIEWED', 'APPROVAL_REQUIRED', 'UNKNOWN']),
    attributionText: NullableTextSchema,
    attributionUrl: NullableUrlSchema,
    coverageGeoJson: ProviderCoverageGeoJsonSchema.nullable(),
    quotaPolicy: QuotaPolicySchema,
    budgetPolicy: BudgetPolicySchema,
    freshnessPolicy: FreshnessPolicySchema,
    modelAllowList: z.array(z.string().trim().min(1).max(160)).max(128),
    fallbackGroup: z.string().trim().min(1).max(128).nullable(),
    healthState: ProviderHealthStateSchema,
    healthBlocksSelection: z.boolean(),
    capabilities: z
      .array(ProviderCapabilitySchema)
      .min(1)
      .max(64)
      .refine((items) => new Set(items).size === items.length, 'capabilities must be unique'),
    metadata: SafeMetadataSchema,
  })
  .strict();
export type ProviderConfigWrite = z.infer<typeof ProviderConfigWriteSchema>;

export const ProviderStatusPatchSchema = z
  .object({
    enabled: z.boolean().optional(),
    healthState: ProviderHealthStateSchema.optional(),
    healthBlocksSelection: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'at least one status field is required');
export type ProviderStatusPatch = z.infer<typeof ProviderStatusPatchSchema>;
