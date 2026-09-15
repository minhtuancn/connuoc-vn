import {
  QUEUE_NAMES,
  PermanentJobError,
  buildDeadLetterEnvelope,
  deterministicJobId,
} from '@connuoc/job-queue';

import type { RawSourcePayload, SourceAdapter } from './contracts.js';
import { importIdempotencyKey, sha256Hex } from './identity.js';
import type { IngestionRepository } from './repository.js';

export interface IngestionResult {
  readonly status: 'imported' | 'duplicate';
  readonly importRunId: string;
  readonly checksumSha256: string;
  readonly insertedObservations: number;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function ingestSourcePayload(
  repository: IngestionRepository,
  adapter: SourceAdapter,
  raw: RawSourcePayload,
): Promise<IngestionResult> {
  const source = await repository.ensureSource({
    sourceKey: adapter.sourceKey,
    name: adapter.sourceName,
    sourceType: adapter.sourceType,
    metadata: { adapterVersion: adapter.adapterVersion },
  });

  const checksumSha256 = sha256Hex(raw.bytes);
  const archived = await repository.archiveRawPayload({
    sourceId: source.id,
    raw,
    checksumSha256,
  });
  const idempotencyKey = importIdempotencyKey(
    adapter.sourceKey,
    checksumSha256,
    adapter.parserVersion,
    adapter.normalizerVersion,
  );

  const existing = await repository.findImportRun(idempotencyKey);
  if (existing?.status === 'SUCCEEDED') {
    return {
      status: 'duplicate',
      importRunId: existing.id,
      checksumSha256,
      insertedObservations: 0,
    };
  }

  let batch;
  try {
    if (raw.sourceKey !== adapter.sourceKey) {
      throw new Error(`Source key mismatch: expected ${adapter.sourceKey}, received ${raw.sourceKey}`);
    }
    batch = adapter.normalize(adapter.parse(raw));
  } catch (error) {
    const permanentError = new PermanentJobError(`Invalid source payload: ${errorMessage(error)}`);
    const deadLetter = buildDeadLetterEnvelope({
      queueName: QUEUE_NAMES.sourceIngestion,
      jobId: deterministicJobId(QUEUE_NAMES.sourceIngestion, idempotencyKey),
      idempotencyKey,
      failedAtUtc: new Date().toISOString(),
      attemptsMade: 1,
      error: permanentError,
    });

    await repository.recordFailedImport({
      sourceId: source.id,
      rawPayloadId: archived.id,
      idempotencyKey,
      parserVersion: adapter.parserVersion,
      normalizerVersion: adapter.normalizerVersion,
      status: 'REJECTED',
      errorSummary: permanentError.message,
      metadata: {
        adapterVersion: adapter.adapterVersion,
        failureClassification: 'permanent',
        deadLetter,
      },
    });
    throw permanentError;
  }

  const committed = await repository.commitNormalizedImport({
    sourceId: source.id,
    rawPayloadId: archived.id,
    idempotencyKey,
    parserVersion: adapter.parserVersion,
    normalizerVersion: adapter.normalizerVersion,
    batch,
  });

  return {
    status: committed.duplicate ? 'duplicate' : 'imported',
    importRunId: committed.importRunId,
    checksumSha256,
    insertedObservations: committed.insertedObservations,
  };
}
