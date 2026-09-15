import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { FixtureWaterLevelAdapter } from '../src/fixture-adapter.js';
import { importIdempotencyKey, sha256Hex } from '../src/identity.js';

const validFixtureUrl = new URL('../../../data/fixtures/ingestion/water-level-valid.json', import.meta.url);
const invalidFixtureUrl = new URL('../../../data/fixtures/ingestion/water-level-invalid.json', import.meta.url);

describe('fixture ingestion adapter', () => {
  it('derives stable raw and import identities from exact payload bytes and versions', async () => {
    const bytes = await readFile(fileURLToPath(validFixtureUrl));
    const checksum = sha256Hex(bytes);

    expect(checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256Hex(bytes)).toBe(checksum);
    expect(importIdempotencyKey('fixture-water-level', checksum, 'fixture-parser-v1', 'water-level-normalizer-v1'))
      .toBe(importIdempotencyKey('fixture-water-level', checksum, 'fixture-parser-v1', 'water-level-normalizer-v1'));
    expect(importIdempotencyKey('fixture-water-level', checksum, 'fixture-parser-v2', 'water-level-normalizer-v1'))
      .not.toBe(importIdempotencyKey('fixture-water-level', checksum, 'fixture-parser-v1', 'water-level-normalizer-v1'));
  });

  it('normalizes the valid fixture into one canonical station and explicit observations', async () => {
    const adapter = new FixtureWaterLevelAdapter(validFixtureUrl);
    const raw = await adapter.read();
    const parsed = adapter.parse(raw);
    const batch = adapter.normalize(parsed);

    expect(raw.sourceKey).toBe('fixture-water-level');
    expect(raw.payloadKey).toContain('2026-09-15');
    expect(batch.station.publicId).toBe('fixture-ninh-binh-001');
    expect(batch.station.timeZone).toBe('Asia/Ho_Chi_Minh');
    expect(batch.observations).toHaveLength(2);
    expect(batch.observations[0]).toMatchObject({
      sourceRecordKey: 'fixture-observation-001',
      unit: 'cm',
      datumId: 'local-gauge-fixture',
      qualityState: 'GOOD',
    });
  });

  it('rejects an invalid fixture before any persistence boundary is called', async () => {
    const adapter = new FixtureWaterLevelAdapter(invalidFixtureUrl);
    const raw = await adapter.read();

    expect(() => adapter.parse(raw)).toThrow();
  });
});
