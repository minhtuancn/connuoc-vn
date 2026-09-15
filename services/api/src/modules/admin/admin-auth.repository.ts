import type { Pool } from 'pg';

import type { AdminPrincipalRecord, AdminRole } from './admin.types.js';

export interface AdminAuthRepository {
  findPrincipalByTokenHash(tokenHashSha256: string): Promise<AdminPrincipalRecord | null>;
}

interface PrincipalRow {
  readonly id: string;
  readonly actor_id: string;
  readonly display_name: string;
  readonly role: AdminRole;
}

export class PgAdminAuthRepository implements AdminAuthRepository {
  constructor(private readonly pool: Pool | null) {}

  async findPrincipalByTokenHash(tokenHashSha256: string): Promise<AdminPrincipalRecord | null> {
    if (!this.pool) return null;

    const result = await this.pool.query<PrincipalRow>(
      `SELECT p.id, p.actor_id, p.display_name, p.role
       FROM admin_api_tokens t
       JOIN admin_principals p ON p.id = t.principal_id
       WHERE t.token_hash_sha256 = $1
         AND t.is_active = true
         AND p.is_active = true
         AND (t.expires_at IS NULL OR t.expires_at > now())
       LIMIT 1`,
      [tokenHashSha256],
    );

    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      actorId: row.actor_id,
      displayName: row.display_name,
      role: row.role,
    };
  }
}
