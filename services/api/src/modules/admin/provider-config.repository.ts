import type { Pool, PoolClient } from 'pg';

import { AdminDataError, type AdminMutationContext } from './admin.repository.js';
import type { ProviderConfigWrite, ProviderStatusPatch } from './provider-config.types.js';

interface IdRow {
  readonly id: string;
}

export class PgProviderConfigRepository {
  constructor(private readonly pool: Pool | null) {}

  private database(): Pool {
    if (!this.pool) {
      throw new AdminDataError('DATABASE_UNAVAILABLE', 'Provider configuration database is not configured.');
    }
    return this.pool;
  }

  async listProviders(): Promise<readonly Record<string, unknown>[]> {
    const result = await this.database().query(this.safeSelectSql());
    return result.rows;
  }

  async getProvider(providerKey: string): Promise<Record<string, unknown> | null> {
    const result = await this.database().query(`${this.safeSelectSql()} WHERE pc.provider_key = $1`, [providerKey]);
    return result.rows[0] ?? null;
  }

  async putProvider(
    providerKey: string,
    input: ProviderConfigWrite,
    context: AdminMutationContext,
  ): Promise<Record<string, unknown>> {
    return this.withMutation(async (client) => {
      const before = await this.safeState(client, providerKey, true) ?? {
        providerKey,
        exists: false,
      };
      const coverage = input.coverageGeoJson === null ? null : JSON.stringify(input.coverageGeoJson);

      const upsert = await client.query<IdRow>(
        `INSERT INTO provider_configs (
           provider_key, provider_type, enabled, priority, weight, secret_ref,
           endpoint_config, commercial_use_status, redistribution_status, licence_status,
           attribution_text, attribution_url, coverage, quota_policy, budget_policy,
           freshness_policy, model_allow_list, fallback_group, health_state,
           health_blocks_selection, metadata
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7::jsonb, $8, $9, $10,
           $11, $12,
           CASE WHEN $13::text IS NULL THEN NULL
             ELSE ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($13::text), 4326)) END,
           $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb, $18, $19, $20, $21::jsonb
         )
         ON CONFLICT (provider_key) DO UPDATE SET
           provider_type = EXCLUDED.provider_type,
           enabled = EXCLUDED.enabled,
           priority = EXCLUDED.priority,
           weight = EXCLUDED.weight,
           secret_ref = EXCLUDED.secret_ref,
           endpoint_config = EXCLUDED.endpoint_config,
           commercial_use_status = EXCLUDED.commercial_use_status,
           redistribution_status = EXCLUDED.redistribution_status,
           licence_status = EXCLUDED.licence_status,
           attribution_text = EXCLUDED.attribution_text,
           attribution_url = EXCLUDED.attribution_url,
           coverage = EXCLUDED.coverage,
           quota_policy = EXCLUDED.quota_policy,
           budget_policy = EXCLUDED.budget_policy,
           freshness_policy = EXCLUDED.freshness_policy,
           model_allow_list = EXCLUDED.model_allow_list,
           fallback_group = EXCLUDED.fallback_group,
           health_state = EXCLUDED.health_state,
           health_blocks_selection = EXCLUDED.health_blocks_selection,
           metadata = EXCLUDED.metadata,
           updated_at = now()
         RETURNING id::text AS id`,
        [
          providerKey,
          input.providerType,
          input.enabled,
          input.priority,
          input.weight,
          input.secretRef,
          JSON.stringify(input.endpointConfig),
          input.commercialUseStatus,
          input.redistributionStatus,
          input.licenceStatus,
          input.attributionText,
          input.attributionUrl,
          coverage,
          JSON.stringify(input.quotaPolicy),
          JSON.stringify(input.budgetPolicy),
          JSON.stringify(input.freshnessPolicy),
          JSON.stringify(input.modelAllowList),
          input.fallbackGroup,
          input.healthState,
          input.healthBlocksSelection,
          JSON.stringify(input.metadata),
        ],
      );
      const providerId = upsert.rows[0]?.id;
      if (!providerId) throw new Error(`Provider '${providerKey}' upsert did not return an id.`);

      await client.query('DELETE FROM provider_capabilities WHERE provider_config_id = $1::uuid', [providerId]);
      await client.query(
        `INSERT INTO provider_capabilities (provider_config_id, capability, enabled)
         SELECT $1::uuid, capability, true
         FROM unnest($2::text[]) AS capability`,
        [providerId, input.capabilities],
      );

      const after = await this.safeState(client, providerKey, false);
      if (!after) throw new Error(`Provider '${providerKey}' disappeared during update.`);
      await this.appendAudit(client, context, 'admin.provider.put', providerKey, before, after);
      return after;
    });
  }

  async patchStatus(
    providerKey: string,
    patch: ProviderStatusPatch,
    context: AdminMutationContext,
  ): Promise<Record<string, unknown>> {
    return this.withMutation(async (client) => {
      const before = await this.safeState(client, providerKey, true);
      if (!before) throw new AdminDataError('NOT_FOUND', `Provider '${providerKey}' was not found.`);

      await client.query(
        `UPDATE provider_configs SET
           enabled = COALESCE($2::boolean, enabled),
           health_state = COALESCE($3, health_state),
           health_blocks_selection = COALESCE($4::boolean, health_blocks_selection),
           updated_at = now()
         WHERE provider_key = $1`,
        [
          providerKey,
          patch.enabled ?? null,
          patch.healthState ?? null,
          patch.healthBlocksSelection ?? null,
        ],
      );

      const after = await this.safeState(client, providerKey, false);
      if (!after) throw new Error(`Provider '${providerKey}' disappeared during status update.`);
      await this.appendAudit(client, context, 'admin.provider.status', providerKey, before, after);
      return after;
    });
  }

  private safeSelectSql(): string {
    return `SELECT
      pc.provider_key AS "providerKey",
      pc.provider_type AS "providerType",
      pc.enabled,
      pc.priority,
      pc.weight::float8 AS weight,
      (pc.secret_ref IS NOT NULL) AS "hasSecretRef",
      pc.endpoint_config AS "endpointConfig",
      pc.commercial_use_status AS "commercialUseStatus",
      pc.redistribution_status AS "redistributionStatus",
      pc.licence_status AS "licenceStatus",
      pc.attribution_text AS "attributionText",
      pc.attribution_url AS "attributionUrl",
      CASE WHEN pc.coverage IS NULL THEN NULL ELSE ST_AsGeoJSON(pc.coverage)::jsonb END AS "coverageGeoJson",
      pc.quota_policy AS "quotaPolicy",
      pc.budget_policy AS "budgetPolicy",
      pc.freshness_policy AS "freshnessPolicy",
      pc.model_allow_list AS "modelAllowList",
      pc.fallback_group AS "fallbackGroup",
      pc.health_state AS "healthState",
      pc.health_blocks_selection AS "healthBlocksSelection",
      pc.metadata,
      COALESCE(
        (SELECT array_agg(cap.capability ORDER BY cap.capability)
         FROM provider_capabilities cap
         WHERE cap.provider_config_id = pc.id AND cap.enabled),
        ARRAY[]::text[]
      ) AS capabilities,
      pc.created_at AS "createdAt",
      pc.updated_at AS "updatedAt"
    FROM provider_configs pc`;
  }

  private async safeState(
    client: PoolClient,
    providerKey: string,
    lock: boolean,
  ): Promise<Record<string, unknown> | null> {
    const suffix = lock ? ' FOR UPDATE OF pc' : '';
    const result = await client.query(`${this.safeSelectSql()} WHERE pc.provider_key = $1${suffix}`, [providerKey]);
    return result.rows[0] ?? null;
  }

  private async withMutation<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.database().connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async appendAudit(
    client: PoolClient,
    context: AdminMutationContext,
    action: string,
    providerKey: string,
    beforeState: Record<string, unknown>,
    afterState: Record<string, unknown>,
  ): Promise<void> {
    await client.query(
      `INSERT INTO audit_log (
         actor_type, actor_id, action, target_type, target_id, correlation_id,
         before_state, after_state, metadata
       ) VALUES ('ADMIN', $1, $2, 'provider_config', $3, $4, $5::jsonb, $6::jsonb, $7::jsonb)`,
      [
        context.actor.actorId,
        action,
        providerKey,
        context.correlationId,
        JSON.stringify(beforeState),
        JSON.stringify(afterState),
        JSON.stringify({
          role: context.actor.role,
          requestMethod: context.requestMethod,
          requestPath: context.requestPath,
        }),
      ],
    );
  }
}
