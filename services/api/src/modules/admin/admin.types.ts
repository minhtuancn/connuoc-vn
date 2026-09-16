export type AdminRole = 'viewer' | 'data-operator' | 'administrator';

export type AdminCapability =
  | 'admin:read'
  | 'sources:write'
  | 'stations:write'
  | 'imports:annotate'
  | 'providers:write'
  | 'admin:manage';

export interface AdminActor {
  readonly actorId: string;
  readonly displayName: string;
  readonly role: AdminRole;
  readonly capabilities: readonly AdminCapability[];
}

export interface AdminPrincipalRecord {
  readonly id: string;
  readonly actorId: string;
  readonly displayName: string;
  readonly role: AdminRole;
}

export const ADMIN_ACTOR_REQUEST_PROPERTY = 'connuocAdminActor' as const;
