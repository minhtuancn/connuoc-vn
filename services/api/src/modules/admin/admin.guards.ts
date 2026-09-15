import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { capabilitiesForRole, hasAdminCapabilities, hashAdminBearerToken } from './admin-auth.js';
import { PgAdminAuthRepository, type AdminAuthRepository } from './admin-auth.repository.js';
import { ADMIN_CAPABILITIES_METADATA } from './admin.decorators.js';
import {
  ADMIN_ACTOR_REQUEST_PROPERTY,
  type AdminActor,
  type AdminCapability,
} from './admin.types.js';

interface GuardRequest extends Record<string, unknown> {
  readonly headers: Record<string, string | string[] | undefined>;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    @Inject(PgAdminAuthRepository)
    private readonly repository: AdminAuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<GuardRequest>();
    const header = request.headers.authorization;
    if (typeof header !== 'string') {
      throw new UnauthorizedException('Admin bearer authentication is required.');
    }

    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    if (!match?.[1]) {
      throw new UnauthorizedException('Admin bearer authentication is malformed.');
    }

    let tokenHash: string;
    try {
      tokenHash = hashAdminBearerToken(match[1]);
    } catch {
      throw new UnauthorizedException('Admin bearer authentication is invalid.');
    }

    const principal = await this.repository.findPrincipalByTokenHash(tokenHash);
    if (!principal) {
      throw new UnauthorizedException('Admin bearer authentication is invalid or expired.');
    }

    const actor: AdminActor = {
      actorId: principal.actorId,
      displayName: principal.displayName,
      role: principal.role,
      capabilities: capabilitiesForRole(principal.role),
    };
    request[ADMIN_ACTOR_REQUEST_PROPERTY] = actor;
    return true;
  }
}

@Injectable()
export class AdminCapabilityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<readonly AdminCapability[]>(
      ADMIN_CAPABILITIES_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      throw new ForbiddenException('Admin route capability policy is not configured.');
    }

    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const actor = request[ADMIN_ACTOR_REQUEST_PROPERTY] as AdminActor | undefined;
    if (!actor) {
      throw new UnauthorizedException('Admin authentication context is missing.');
    }
    if (!hasAdminCapabilities(actor, required)) {
      throw new ForbiddenException('Admin actor does not have the required capability.');
    }
    return true;
  }
}
