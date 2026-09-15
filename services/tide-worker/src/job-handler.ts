import {
  QUEUE_NAMES,
  PermanentJobError,
  RetryableJobError,
  SourceIngestionJobSchema,
  buildDeadLetterEnvelope,
  deterministicJobId,
  type DeadLetterEnvelope,
  type SourceIngestionJob,
} from '@connuoc/job-queue';

import type { SourceAdapter } from './contracts.js';
import { ingestSourcePayload, type IngestionResult } from './ingest.js';
import type { IngestionRepository } from './repository.js';

export type SourceAdapterRegistry = ReadonlyMap<string, SourceAdapter>;

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function handleSourceIngestionJob(
  repository: IngestionRepository,
  adapters: SourceAdapterRegistry,
  input: unknown,
): Promise<IngestionResult> {
  let job: SourceIngestionJob;
  try {
    job = SourceIngestionJobSchema.parse(input);
  } catch (error) {
    throw new PermanentJobError(`Invalid source-ingestion job: ${messageOf(error)}`);
  }

  const adapter = adapters.get(job.sourceKey);
  if (!adapter) {
    throw new PermanentJobError(`No source adapter registered for ${job.sourceKey}`);
  }
  if (adapter.adapterVersion !== job.adapterVersion) {
    throw new PermanentJobError(
      `Adapter version mismatch for ${job.sourceKey}: expected ${job.adapterVersion}, loaded ${adapter.adapterVersion}`,
    );
  }

  try {
    const raw = await adapter.read();
    return await ingestSourcePayload(repository, adapter, raw);
  } catch (error) {
    if (error instanceof PermanentJobError || error instanceof RetryableJobError) {
      throw error;
    }
    throw new RetryableJobError(`Source ingestion infrastructure failure: ${messageOf(error)}`);
  }
}

export function buildSourceIngestionDeadLetter(
  input: unknown,
  error: Error,
  attemptsMade: number,
  failedAtUtc: string,
): DeadLetterEnvelope {
  const job = SourceIngestionJobSchema.parse(input);
  return buildDeadLetterEnvelope({
    queueName: QUEUE_NAMES.sourceIngestion,
    jobId: deterministicJobId(QUEUE_NAMES.sourceIngestion, job.idempotencyKey),
    idempotencyKey: job.idempotencyKey,
    failedAtUtc,
    attemptsMade,
    error,
  });
}
