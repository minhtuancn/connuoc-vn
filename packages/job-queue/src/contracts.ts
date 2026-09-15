import { createHash } from 'node:crypto';

import { IsoInstantSchema } from '@connuoc/shared-types';
import { z } from 'zod';

export const QUEUE_NAMES = {
  sourceIngestion: 'source-ingestion.v1',
  tideForecast: 'tide-forecast.v1',
  notifications: 'notifications.v1',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const IdempotencyKeySchema = z.string().trim().min(1).max(300);

export const SourceIngestionJobSchema = z
  .object({
    schemaVersion: z.literal(1),
    sourceKey: z.string().trim().min(1).max(160),
    adapterVersion: z.string().trim().min(1).max(120),
    idempotencyKey: IdempotencyKeySchema,
    requestedAtUtc: IsoInstantSchema,
    trigger: z.enum(['schedule', 'manual', 'retry', 'backfill']),
  })
  .strict();
export type SourceIngestionJob = z.infer<typeof SourceIngestionJobSchema>;

export const TideForecastJobSchema = z
  .object({
    schemaVersion: z.literal(1),
    stationId: z.string().trim().min(1).max(160),
    modelId: z.string().trim().min(1).max(160),
    modelVersion: z.string().trim().min(1).max(160).optional(),
    startUtc: IsoInstantSchema,
    endUtc: IsoInstantSchema,
    idempotencyKey: IdempotencyKeySchema,
  })
  .strict()
  .refine((value) => Date.parse(value.endUtc) >= Date.parse(value.startUtc), {
    message: 'endUtc must not be before startUtc',
    path: ['endUtc'],
  });
export type TideForecastJob = z.infer<typeof TideForecastJobSchema>;

export const NotificationJobSchema = z
  .object({
    schemaVersion: z.literal(1),
    notificationKey: z.string().trim().min(1).max(200),
    recipientKey: z.string().trim().min(1).max(200),
    idempotencyKey: IdempotencyKeySchema,
    scheduledForUtc: IsoInstantSchema,
  })
  .strict();
export type NotificationJob = z.infer<typeof NotificationJobSchema>;

export const DeadLetterEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(1),
    queueName: z.string().trim().min(1).max(160),
    jobId: z.string().trim().min(1).max(160),
    idempotencyKey: IdempotencyKeySchema,
    failedAtUtc: IsoInstantSchema,
    attemptsMade: z.number().int().min(0),
    permanent: z.boolean(),
    errorName: z.string().trim().min(1).max(200),
    errorMessage: z.string().trim().min(1).max(2_000),
  })
  .strict();
export type DeadLetterEnvelope = z.infer<typeof DeadLetterEnvelopeSchema>;

export function deterministicJobId(queueName: QueueName, idempotencyKey: string): string {
  const normalized = IdempotencyKeySchema.parse(idempotencyKey);
  const digest = createHash('sha256').update(`${queueName}\n${normalized}`).digest('hex');
  return `v1-${digest}`;
}

export function deadLetterQueueName(queueName: QueueName): string {
  return `${queueName}.dead-letter`;
}
