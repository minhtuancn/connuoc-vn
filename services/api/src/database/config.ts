import { z } from 'zod';

const DatabaseEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1).refine(
    (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'DATABASE_URL must use postgres:// or postgresql://',
  ),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
});

export type DatabaseEnvironment = z.infer<typeof DatabaseEnvironmentSchema>;

export function parseDatabaseEnvironment(input: NodeJS.ProcessEnv = process.env): DatabaseEnvironment {
  return DatabaseEnvironmentSchema.parse(input);
}
