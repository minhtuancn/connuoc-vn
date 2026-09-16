import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  capabilitiesForRole,
  hasAdminCapabilities,
  hashAdminBearerToken,
} from '../src/modules/admin/admin-auth.js';
import type { AdminActor } from '../src/modules/admin/admin.types.js';

const rawToken = 'fixture-admin-token-0123456789-abcdef-XYZ';

describe('admin authentication contracts', () => {
  it('hashes a high-entropy bearer token without preserving plaintext', () => {
    const expected = createHash('sha256').update(rawToken, 'utf8').digest('hex');
    const digest = hashAdminBearerToken(rawToken);
    expect(digest).toBe(expected);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(digest).not.toContain(rawToken);
  });

  it('rejects short bearer secrets before database lookup', () => {
    expect(() => hashAdminBearerToken('too-short')).toThrow();
  });

  it('maps viewer, data-operator and administrator roles to explicit capabilities', () => {
    expect(capabilitiesForRole('viewer')).toEqual(['admin:read']);
    expect(capabilitiesForRole('data-operator')).toEqual([
      'admin:read',
      'sources:write',
      'stations:write',
      'imports:annotate',
      'providers:write',
    ]);
    expect(capabilitiesForRole('administrator')).toEqual([
      'admin:read',
      'sources:write',
      'stations:write',
      'imports:annotate',
      'providers:write',
      'admin:manage',
    ]);
  });

  it('requires every declared capability rather than any one capability', () => {
    const actor: AdminActor = {
      actorId: 'operator-1',
      displayName: 'Operator One',
      role: 'data-operator',
      capabilities: capabilitiesForRole('data-operator'),
    };
    expect(hasAdminCapabilities(actor, ['admin:read', 'providers:write'])).toBe(true);
    expect(hasAdminCapabilities(actor, ['admin:read', 'admin:manage'])).toBe(false);
  });
});
