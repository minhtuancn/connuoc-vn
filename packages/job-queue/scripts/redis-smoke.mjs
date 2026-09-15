import {
  QUEUE_NAMES,
  SourceIngestionJobSchema,
  bullMqConnectionFromUrl,
  closeQueueResources,
  createJobQueue,
  deterministicJobId,
  probeQueue,
} from '../dist/index.js';

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is required for Redis smoke tests.');
}

const connection = bullMqConnectionFromUrl(redisUrl);
const queue = createJobQueue(QUEUE_NAMES.sourceIngestion, connection);

try {
  await probeQueue(queue);

  const payload = SourceIngestionJobSchema.parse({
    schemaVersion: 1,
    sourceKey: 'ci-fixture',
    adapterVersion: '1.0.0',
    idempotencyKey: 'ci-fixture:2026-09-15T12:00:00Z',
    requestedAtUtc: '2026-09-15T12:00:00Z',
    trigger: 'manual',
  });
  const jobId = deterministicJobId(QUEUE_NAMES.sourceIngestion, payload.idempotencyKey);

  const first = await queue.add('ingest-source', payload, { jobId });
  const second = await queue.add('ingest-source', payload, { jobId });
  const stored = await queue.getJob(jobId);
  const counts = await queue.getJobCounts('waiting', 'delayed', 'active', 'completed', 'failed');

  if (first.id !== jobId || second.id !== jobId || stored?.id !== jobId) {
    throw new Error('Deterministic BullMQ job identity was not preserved.');
  }
  if ((counts.waiting ?? 0) !== 1) {
    throw new Error(`Expected one waiting job after duplicate enqueue, found ${counts.waiting ?? 0}.`);
  }

  console.log(JSON.stringify({
    status: 'ok',
    queue: QUEUE_NAMES.sourceIngestion,
    jobId,
    waitingJobs: counts.waiting ?? 0,
  }));
} finally {
  await queue.drain(true);
  await closeQueueResources([queue]);
}
