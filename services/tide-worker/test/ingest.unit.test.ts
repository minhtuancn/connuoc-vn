import { readFile } from 'node:fs/promises';

import { PermanentJobError } from '@connuoc/job-queue';
import { describe, expect, it } from 'vitest';

import { FixtureWaterLevelAdapter } from '../src/fixture-adapter.js';
import { ingestSourcePayload } from '../src/ingest.js';
import type {
  ArchivedPayload,
  ImportRunSnapshot,
  IngestionRepository,
  NormalizedCommitInput,
  RecordFailedImportInput,
  SourceSnapshot,
} from '../src/repository.js';

class FakeRepository implements IngestionRepository {
  source: SourceSnapshot = { id: 'source-uuid', sourceKey: 'fixture-water-level' };
  archived: ArchivedPayload = {
    id: 'raw-uuid',
    sourceId: 'source-uuid',
    checksumSha256: '0'.repeat(64),
    duplicate: false,
  };
  existing: ImportRunSnapshot | null = null;
  normalizedCommits: NormalizedCommitInput[] = [];
  failures: RecordFailedImportInput[] = [];

  async ensureSource(): Promise<SourceSnapshot> {
    return this.source;
  }

  async archiveRawPayload(input: Parameters<IngestionRepository['archiveRawPayload']>[0]): Promise<ArchivedPayload> {
    this.archived = { ...this.archived, checksumSha256: input.checksumSha256 };
    return this.archived;
  }

  async findImportRun(): Promise<ImportRunSnapshot | null> {
    return this.existing;
  }

  async commitNormalizedImport(input: NormalizedCommitInput) {
    this.normalizedCommits.push(input);
    return { importRunId: 'run-uuid', insertedObservations: input.batch.observations.length };
  }

  async recordFailedImport(input: RecordFailedImportInput) {
    this.failures.push(input);
    return { importRunId: 'failed-run-uuid' };
  }
}

const validUrl = new URL('../../../data/fixtures/ingestion/water-level-valid.json', import.meta.url);
const invalidUrl = new URL('../../../data/fixtures/ingestion/water-level-invalid.json', import.meta.url);

describe('ingestion orchestration', () => {
  it('short-circuits an already successful import without normalized writes', async () => {
    const repository = new FakeRepository();
    repository.existing = { id: 'existing-run', status: 'SUCCEEDED' };
    const adapter = new FixtureWaterLevelAdapter(validUrl);
    const raw = await adapter.read();

    const result = await ingestSourcePayload(repository, adapter, raw);

    expect(result.status).toBe('duplicate');
    expect(repository.normalizedCommits).toHaveLength(0);
  });

  it('archives raw data before committing a valid normalized batch', async () => {
    const repository = new FakeRepository();
    const adapter = new FixtureWaterLevelAdapter(validUrl);
    const raw = await adapter.read();

    const result = await ingestSourcePayload(repository, adapter, raw);

    expect(result.status).toBe('imported');
    expect(repository.archived.checksumSha256).not.toBe('0'.repeat(64));
    expect(repository.normalizedCommits).toHaveLength(1);
    expect(repository.normalizedCommits[0]?.batch.observations).toHaveLength(2);
  });

  it('persists failure diagnostics but never opens normalized writes for invalid source data', async () => {
    const repository = new FakeRepository();
    const adapter = new FixtureWaterLevelAdapter(invalidUrl);
    const bytes = await readFile(invalidUrl);
    expect(bytes.byteLength).toBeGreaterThan(0);
    const raw = await adapter.read();

    await expect(ingestSourcePayload(repository, adapter, raw)).rejects.toBeInstanceOf(PermanentJobError);

    expect(repository.normalizedCommits).toHaveLength(0);
    expect(repository.failures).toHaveLength(1);
    expect(repository.failures[0]?.errorSummary).toContain('Invalid source payload');
  });
});
