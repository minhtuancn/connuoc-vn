import type { ConnectionOptions } from 'bullmq';
import { z } from 'zod';

const RedisEnvironmentSchema = z.object({
  REDIS_URL: z.string().min(1),
});

export interface RedisQueueEnvironment {
  readonly REDIS_URL: string;
}

export function parseRedisQueueEnvironment(input: NodeJS.ProcessEnv = process.env): RedisQueueEnvironment {
  const parsed = RedisEnvironmentSchema.parse(input);
  const url = new URL(parsed.REDIS_URL);
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://');
  }
  return parsed;
}

export function bullMqConnectionFromUrl(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error('Redis connection URL must use redis:// or rediss://');
  }

  const path = url.pathname.replace(/^\//, '');
  const db = path.length === 0 ? 0 : Number(path);
  if (!Number.isInteger(db) || db < 0) {
    throw new Error('Redis database path must be a non-negative integer.');
  }

  return {
    host: url.hostname,
    port: url.port.length > 0 ? Number(url.port) : 6379,
    db,
    ...(url.username.length > 0 ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password.length > 0 ? { password: decodeURIComponent(url.password) } : {}),
    ...(url.protocol === 'rediss:' ? { tls: { servername: url.hostname } } : {}),
  };
}
