import { createHash } from 'node:crypto';

import { z } from 'zod';

const IdentityPartSchema = z.string().trim().min(1).max(300);
const ChecksumSchema = z.string().regex(/^[0-9a-f]{64}$/);

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function importIdempotencyKey(
  sourceKey: string,
  checksumSha256: string,
  parserVersion: string,
  normalizerVersion: string,
): string {
  const identity = [
    IdentityPartSchema.parse(sourceKey),
    ChecksumSchema.parse(checksumSha256),
    IdentityPartSchema.parse(parserVersion),
    IdentityPartSchema.parse(normalizerVersion),
  ].join('\n');

  return `ingestion-v1-${createHash('sha256').update(identity).digest('hex')}`;
}
