import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';

import { ADMIN_ACTOR_REQUEST_PROPERTY, type AdminActor, type AdminCapability } from './admin.types.js';

export const ADMIN_CAPABILITIES_METADATA = 'connuoc:admin-capabilities';

export const RequireAdminCapabilities = (...capabilities: readonly AdminCapability[]) =>
  SetMetadata(ADMIN_CAPABILITIES_METADATA, capabilities);

export const CurrentAdminActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminActor => {
    const request = context.switchToHttp().getRequest<Record<string, unknown>>();
    const actor = request[ADMIN_ACTOR_REQUEST_PROPERTY];
    if (!actor) {
      throw new Error('Admin actor was not attached by the authentication guard.');
    }
    return actor as AdminActor;
  },
);
