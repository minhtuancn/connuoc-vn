import type { QueueName } from './contracts.js';
import { DeadLetterEnvelopeSchema, type DeadLetterEnvelope } from './contracts.js';

export class PermanentJobError extends Error {
  override readonly name = 'PermanentJobError';
}

export class RetryableJobError extends Error {
  override readonly name = 'RetryableJobError';
}

export type FailureClassification = 'permanent' | 'retryable';

export function classifyJobError(error: unknown): FailureClassification {
  if (error instanceof PermanentJobError) {
    return 'permanent';
  }
  return 'retryable';
}

export interface DeadLetterInput {
  readonly queueName: QueueName;
  readonly jobId: string;
  readonly idempotencyKey: string;
  readonly failedAtUtc: string;
  readonly attemptsMade: number;
  readonly error: Error;
}

export function buildDeadLetterEnvelope(input: DeadLetterInput): DeadLetterEnvelope {
  return DeadLetterEnvelopeSchema.parse({
    schemaVersion: 1,
    queueName: input.queueName,
    jobId: input.jobId,
    idempotencyKey: input.idempotencyKey,
    failedAtUtc: input.failedAtUtc,
    attemptsMade: input.attemptsMade,
    permanent: classifyJobError(input.error) === 'permanent',
    errorName: input.error.name || 'Error',
    errorMessage: input.error.message || 'Unknown job failure',
  });
}
