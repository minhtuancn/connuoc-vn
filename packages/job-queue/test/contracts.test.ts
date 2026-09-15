import { describe, expect, it } from 'vitest';

import {
  DEFAULT_JOB_OPTIONS,
  JOB_EXECUTION_TIMEOUT_MS,
  PermanentJobError,
  QUEUE_NAMES,
  SourceIngestionJobSchema,
  TideForecastJobSchema,
  buildDeadLetterEnvelope,
  bullMqConnectionFromUrl,
  classifyJobError,
  deadLetterQueueName,
  deterministicJobId,
  parseRedisQueueEnvironment,
} from '../src/index.js';

describe('queue contracts', () => {
  it('requires explicit valid Redis URLs', () => {
    expect(() => parseRedisQueueEnvironment({})).toThrow();
    expect(() => parseRedisQueueEnvironment({ REDIS_URL: 'https://example.com' })).toThrow();
    expect(parseRedisQueueEnvironment({ REDIS_URL: 'redis://localhost:6379/2' })).toEqual({
      REDIS_URL: 'redis://localhost:6379/2',
    });
  });

  it('converts redis/rediss URLs without leaking parsing into workers', () => {
    expect(bullMqConnectionFromUrl('redis://user:secret@redis.internal:6380/3')).toEqual({
      host: 'redis.internal',
      port: 6380,
      db: 3,
      username: 'user',
      password: 'secret',
    });

    expect(bullMqConnectionFromUrl('rediss://redis.example.com')).toEqual({
      host: 'redis.example.com',
      port: 6379,
      db: 0,
      tls: { servername: 'redis.example.com' },
    });
  });

  it('validates ingestion identity before enqueue', () => {
    const valid = SourceIngestionJobSchema.parse({
      schemaVersion: 1,
      sourceKey: 'official-tide-source',
      adapterVersion: '1.0.0',
      idempotencyKey: 'official-tide-source:2026-09-15T12',
      requestedAtUtc: '2026-09-15T12:00:00Z',
      trigger: 'schedule',
    });
    expect(valid.sourceKey).toBe('official-tide-source');

    expect(() => SourceIngestionJobSchema.parse({
      schemaVersion: 1,
      sourceKey: 'official-tide-source',
      adapterVersion: '1.0.0',
      requestedAtUtc: '2026-09-15T12:00:00Z',
      trigger: 'schedule',
    })).toThrow();
  });

  it('rejects inverted forecast windows', () => {
    expect(() => TideForecastJobSchema.parse({
      schemaVersion: 1,
      stationId: 'station-a',
      modelId: 'model-a',
      startUtc: '2026-09-16T00:00:00Z',
      endUtc: '2026-09-15T00:00:00Z',
      idempotencyKey: 'forecast:station-a:2026-09-15',
    })).toThrow();
  });

  it('derives stable BullMQ-safe job IDs from idempotency keys', () => {
    const first = deterministicJobId(QUEUE_NAMES.sourceIngestion, 'source:a:2026-09-15');
    const second = deterministicJobId(QUEUE_NAMES.sourceIngestion, 'source:a:2026-09-15');
    const different = deterministicJobId(QUEUE_NAMES.sourceIngestion, 'source:a:2026-09-16');

    expect(first).toBe(second);
    expect(first).not.toBe(different);
    expect(first).toMatch(/^v1-[0-9a-f]{64}$/);
    expect(first).not.toContain(':');
  });

  it('keeps retry and execution timeout policy explicit', () => {
    expect(DEFAULT_JOB_OPTIONS.attempts).toBe(5);
    expect(DEFAULT_JOB_OPTIONS.backoff).toEqual({ type: 'exponential', delay: 5_000 });
    expect(JOB_EXECUTION_TIMEOUT_MS[QUEUE_NAMES.notifications]).toBe(30_000);
    expect(JOB_EXECUTION_TIMEOUT_MS[QUEUE_NAMES.sourceIngestion]).toBe(120_000);
  });

  it('classifies permanent failures and builds a validated dead-letter envelope', () => {
    const error = new PermanentJobError('payload is structurally invalid');
    expect(classifyJobError(error)).toBe('permanent');
    expect(classifyJobError(new Error('connection reset'))).toBe('retryable');

    expect(buildDeadLetterEnvelope({
      queueName: QUEUE_NAMES.sourceIngestion,
      jobId: 'v1-abc',
      idempotencyKey: 'source:a:2026-09-15',
      failedAtUtc: '2026-09-15T12:30:00Z',
      attemptsMade: 1,
      error,
    })).toMatchObject({
      schemaVersion: 1,
      queueName: QUEUE_NAMES.sourceIngestion,
      permanent: true,
      errorName: 'PermanentJobError',
    });

    expect(deadLetterQueueName(QUEUE_NAMES.sourceIngestion)).toBe('source-ingestion.v1.dead-letter');
  });
});
