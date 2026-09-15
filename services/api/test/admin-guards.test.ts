import 'reflect-metadata';

import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it } from 'vitest';

import { capabilitiesForRole, hashAdminBearerToken } from '../src/modules/admin/admin-auth.js';
import type { AdminAuthRepository } from '../src/modules/admin/admin-auth.repository.js';
import { ADMIN_CAPABILITIES_METADATA } from '../src/modules/admin/admin.decorators.js';
import { AdminAuthGuard, AdminCapabilityGuard } from '../src/modules/admin/admin.guards.js';
import {
  ADMIN_ACTOR_REQUEST_PROPERTY,
  type AdminActor,
} from '../src/modules/admin/admin.types.js';

const rawToken = 'fixture-guard-token-0123456789-abcdef-XYZ';
const tokenHash = hashAdminBearerToken(rawToken);

class FakeAuthRepository implements AdminAuthRepository {
  async findPrincipalByTokenHash(hash: string) {
    if (hash !== tokenHash) return null;
    return {
      id: 'principal-1',
      actorId: 'operator-1',
      displayName: 'Operator One',
      role: 'data-operator' as const,
    };
  }
}

function contextFor(
  request: Record<string, unknown>,
  handler: (...args: never[]) => unknown = () => undefined,
): ExecutionContext {
  class AdminFixtureController {}
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
    getHandler: () => handler,
    getClass: () => AdminFixtureController,
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({ getData: () => undefined, getContext: () => undefined }),
    switchToWs: () => ({ getData: () => undefined, getClient: () => undefined, getPattern: () => undefined }),
    getType: () => 'http',
  } as unknown as ExecutionContext;
}

describe('admin guards', () => {
  it('rejects missing bearer authentication and attaches only sanitized actor data on success', async () => {
    const guard = new AdminAuthGuard(new FakeAuthRepository());
    await expect(guard.canActivate(contextFor({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);

    const request: Record<string, unknown> = { headers: { authorization: `Bearer ${rawToken}` } };
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request[ADMIN_ACTOR_REQUEST_PROPERTY]).toEqual({
      actorId: 'operator-1',
      displayName: 'Operator One',
      role: 'data-operator',
      capabilities: capabilitiesForRole('data-operator'),
    });
    expect(JSON.stringify(request[ADMIN_ACTOR_REQUEST_PROPERTY])).not.toContain(rawToken);
  });

  it('denies guarded routes with no capability metadata', () => {
    const guard = new AdminCapabilityGuard(new Reflector());
    const actor: AdminActor = {
      actorId: 'viewer-1',
      displayName: 'Viewer One',
      role: 'viewer',
      capabilities: capabilitiesForRole('viewer'),
    };
    const request = { headers: {}, [ADMIN_ACTOR_REQUEST_PROPERTY]: actor };
    expect(() => guard.canActivate(contextFor(request))).toThrow(ForbiddenException);
  });

  it('returns 403 semantics for insufficient capability and permits an operator', () => {
    const guard = new AdminCapabilityGuard(new Reflector());
    const handler = () => undefined;
    Reflect.defineMetadata(ADMIN_CAPABILITIES_METADATA, ['sources:write'], handler);

    const viewer: AdminActor = {
      actorId: 'viewer-1',
      displayName: 'Viewer One',
      role: 'viewer',
      capabilities: capabilitiesForRole('viewer'),
    };
    expect(() =>
      guard.canActivate(contextFor({ headers: {}, [ADMIN_ACTOR_REQUEST_PROPERTY]: viewer }, handler)),
    ).toThrow(ForbiddenException);

    const operator: AdminActor = {
      actorId: 'operator-1',
      displayName: 'Operator One',
      role: 'data-operator',
      capabilities: capabilitiesForRole('data-operator'),
    };
    expect(
      guard.canActivate(contextFor({ headers: {}, [ADMIN_ACTOR_REQUEST_PROPERTY]: operator }, handler)),
    ).toBe(true);
  });
});
