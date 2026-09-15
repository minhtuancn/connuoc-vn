import { createHash } from 'node:crypto';

import type { AdminActor, AdminCapability, AdminRole } from './admin.types.js';

const ROLE_CAPABILITIES: Readonly<Record<AdminRole, readonly AdminCapability[]>> = Object.freeze({
  viewer: Object.freeze(['admin:read']),
  'data-operator': Object.freeze([
    'admin:read',
    'sources:write',
    'stations:write',
    'imports:annotate',
  ]),
  administrator: Object.freeze([
    'admin:read',
    'sources:write',
    'stations:write',
    'imports:annotate',
    'admin:manage',
  ]),
});

export function capabilitiesForRole(role: AdminRole): readonly AdminCapability[] {
  return ROLE_CAPABILITIES[role];
}

export function hasAdminCapabilities(
  actor: AdminActor,
  required: readonly AdminCapability[],
): boolean {
  return required.every((capability) => actor.capabilities.includes(capability));
}

export function hashAdminBearerToken(rawToken: string): string {
  const normalized = rawToken.trim();
  if (normalized.length < 32 || normalized.length > 512) {
    throw new Error('Admin bearer token must be between 32 and 512 characters.');
  }
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}
