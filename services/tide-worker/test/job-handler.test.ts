import { PermanentJobError, RetryableJobError, QUEUE_NAMES } from '@connuoc/job-queue';
import { describe, expect, it } from 'vitest';

import type { RawSourcePayload, SourceAdapter } from '../src/contracts.js';
import { buildSourceIngestionDeadLetter, handleSourceIngestionJob } from '../src/job-handler.js';
import type { IngestionRepository } from '../src/repository.js';

const job = {
  schemaVersion: 1 as const,
  sourceKey: 'fixture-water-level',
  adapterVersion: 'fixture-adapter-v1',
  idempotencyKey: 'request-1',
  requestedAtUtc: '2026-09-15T00:00:00Z',
  trigger: 'manual' as const,
};

function repositoryStub(): IngestionRepository {
  return {
    ensureSource: async () => ({ id: 'source-id', sourceKey: job.sourceKey }),
    archiveRawPayload: async () => ({ id: 'raw-id', sourceId: 'source-id', checksumSha256: '0'.repeat(64), duplicate: false }),
    findImportRun: async () => ({ id: 'run-id', status: 'SUCCEEDED' }),
    commitNormalizedImport: async () => ({ importRunId: 'run-id', insertedObservations: 0 }),
    recordFailedImport: async () => ({ importRunId: 'failed-run-id' }),
  };
}

describe('source ingestion job handler', () => {
  it('treats a missing adapter as permanent', async () => {
    await expect(handleSourceIngestionJob(repositoryStub(), new Map(), job))
      .rejects.toBeInstanceOf(PermanentJobError);
  });

  it('treats adapter read failures as retryable', async () => {
    const adapter: SourceAdapter = {
      sourceKey: job.sourceKey,
      sourceName: 'fixture',
      sourceType: 'fixture',
      adapterVersion: job.adapterVersion,
      parserVersion: 'p1',
      normalizerVersion: 'n1',
      read: async (): Promise<RawSourcePayload> => { throw new Error('temporary read failure'); },
      parse: () => ({}),
      normalize: () => ({
        station: { publicId: 's', name: 's', stationType: 'water_level', timeZone: 'UTC', latitude: 0, longitude: 0 },
        observations: [],
      }),
    };

    await expect(handleSourceIngestionJob(repositoryStub(), new Map([[job.sourceKey, adapter]]), job))
      .rejects.toBeInstanceOf(RetryableJobError);
  });

  it('uses the shared dead-letter contract', () => {
    const envelope = buildSourceIngestionDeadLetter(job, new PermanentJobError('bad source payload'), 3, '2026-09-15T01:00:00Z');
    expect(envelope.queueName).toBe(QUEUE_NAMES.sourceIngestion);
    expect(envelope.permanent).toBe(true);
    expect(envelope.attemptsMade).toBe(3);
  });
});
