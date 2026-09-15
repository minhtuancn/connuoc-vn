import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';

import type { QueueName } from './contracts.js';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5_000,
  },
  removeOnComplete: {
    count: 1_000,
  },
  removeOnFail: false,
} satisfies JobsOptions;

export const JOB_EXECUTION_TIMEOUT_MS: Readonly<Record<QueueName, number>> = {
  'source-ingestion.v1': 120_000,
  'tide-forecast.v1': 120_000,
  'notifications.v1': 30_000,
};

export function createJobQueue<DataType>(
  queueName: QueueName,
  connection: ConnectionOptions,
): Queue<DataType> {
  return new Queue<DataType>(queueName, {
    connection,
    defaultJobOptions: DEFAULT_JOB_OPTIONS,
  });
}

export interface QueueClosable {
  close(): Promise<void>;
}

export async function closeQueueResources(resources: readonly QueueClosable[]): Promise<void> {
  await Promise.all(resources.map(async (resource) => resource.close()));
}

export async function probeQueue(queue: Queue<unknown>): Promise<{ readonly status: 'ok' }> {
  await queue.waitUntilReady();
  return { status: 'ok' };
}
