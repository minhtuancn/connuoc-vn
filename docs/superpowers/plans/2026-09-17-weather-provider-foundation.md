# Phase 5A Location & Provider Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement issue #53: a current, versioned Vietnam location taxonomy and a vendor-neutral provider configuration/selection foundation that later weather, rainfall, hydrology and official-alert adapters can use without changing public/mobile contracts.

**Architecture:** Extend the existing Phase 2 PostgreSQL/PostGIS, provenance, admin RBAC/audit and ingestion boundaries. `packages/shared-types` owns stable cross-service contracts. `services/api` owns current/historical administrative-area lookup plus secret-safe admin provider configuration. `services/weather-worker` owns provider adapter/selection contracts and deterministic fixture implementations. Provider selection is server-side and filters by capability, active/effective coverage, deployment licence policy, health/quota state and priority. No live weather value is introduced in Phase 5A.

**Tech Stack:** Node 24, TypeScript 6, NestJS 12/Fastify 5, PostgreSQL/PostGIS 18, pg 8.23, Zod 4.6.5, Vitest 5, existing pnpm workspace and GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-17-weather-hydrology-intelligence-design.md`

**Normative taxonomy amendment:** `docs/superpowers/specs/2026-09-17-vietnam-administrative-taxonomy-amendment.md`

**Issue:** #53, parent #52.

## Global Constraints

- Treat Vietnam's active local-government hierarchy as two tiers below the country: provincial level and commune level. Do not expose district as a current tier.
- Current area kinds are `PROVINCE`, `CENTRAL_CITY`, `COMMUNE`, `WARD`, `SPECIAL_ZONE`; historical district entities may exist only with effective dates/history semantics.
- Administrative codes, geometry and aliases are versioned; never silently rewrite historical observations to current boundaries.
- Do not persist precise end-user location history. Location resolution is a stateless point-in/query-out operation in this phase.
- Reuse existing `data_sources`, `raw_payloads`, `source_import_runs`, `audit_log`, `basins`, `rivers` and `stations` instead of creating parallel provenance/auth systems.
- Provider credentials are represented only by opaque `secretRef` values. Raw secrets are never returned by API, written to audit `before_state`/`after_state`, committed to fixtures, or logged.
- Provider selection is deterministic for the same persisted configuration and selection context.
- A provider that is disabled, outside effective coverage, unhealthy according to blocking policy, quota/budget-blocked, missing the requested capability, or incompatible with deployment/licence policy is not selectable.
- Rejection/fallback never erases provenance; selection results contain the chosen provider ID and explicit rejected-candidate reasons for internal diagnostics.
- No live third-party HTTP calls are required in unit/integration CI for Phase 5A. Use deterministic fixture adapters.
- No weather/rainfall value, discharge forecast, stage conversion or flood-risk score is implemented in this plan.
- Preserve Phase 2 public API anonymity and all existing Phase 2 exit gates.

---

### Task 1: Add stable shared contracts for administrative locations and providers

**Files:**
- Create: `packages/shared-types/src/location.ts`
- Create: `packages/shared-types/src/provider.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/test/location.test.ts`
- Create: `packages/shared-types/test/provider.test.ts`

**Contract shape:**

```ts
export type AdministrativeAreaKind =
  | 'PROVINCE'
  | 'CENTRAL_CITY'
  | 'COMMUNE'
  | 'WARD'
  | 'SPECIAL_ZONE'
  | 'HISTORICAL_DISTRICT';

export interface AdministrativeAreaRef {
  readonly publicId: string;
  readonly officialCode: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly kind: AdministrativeAreaKind;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly isCurrent: boolean;
}

export interface ForecastLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly timeZone: string;
  readonly administrativeAreas: readonly AdministrativeAreaRef[];
  readonly spatialRepresentation: 'POINT';
}
```

```ts
export type ProviderCapability =
  | 'weather.current'
  | 'weather.hourlyForecast'
  | 'weather.dailyForecast'
  | 'weather.historical'
  | 'weather.ensemble'
  | 'rainfall.observed'
  | 'rainfall.satellite'
  | 'rainfall.radar'
  | 'rainfall.forecast'
  | 'hydrology.dischargeForecast'
  | 'hydrology.dischargeEnsemble'
  | 'hydrology.retrospective'
  | 'hydrology.returnPeriods'
  | 'hydrology.stageObservation'
  | 'hydrology.officialBulletin'
  | 'hazard.floodBaseline'
  | 'alert.official';

export type CommercialUseStatus = 'ALLOWED' | 'RESTRICTED' | 'UNKNOWN';
export type RedistributionStatus = 'ALLOWED' | 'RESTRICTED' | 'ATTRIBUTION_REQUIRED' | 'UNKNOWN';
export type ProviderHealthState = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
export type DeploymentUse = 'NON_COMMERCIAL' | 'COMMERCIAL';

export interface ProviderSelectionRequest {
  readonly capability: ProviderCapability;
  readonly location: { readonly latitude: number; readonly longitude: number };
  readonly atUtc: string;
  readonly deploymentUse: DeploymentUse;
}
```

- [ ] Write RED tests that reject invalid coordinates, invalid effective-date ranges and any current `HISTORICAL_DISTRICT` instance.
- [ ] Write RED tests that assert capability/status string values remain stable and JSON-safe; do not use enum ordinals.
- [ ] Implement minimal exported types plus Zod schemas/helpers following existing `shared-types` patterns.
- [ ] Ensure `effectiveTo === null` alone does not imply current; helper validation must require kind/effective-date consistency.
- [ ] Run `pnpm --filter @connuoc/shared-types test` and `pnpm --filter @connuoc/shared-types typecheck`.
- [ ] Commit: `feat(shared): add location and provider contracts`.

---

### Task 2: Add versioned PostGIS schema for areas and provider policy

**Files:**
- Create: `infrastructure/database/migrations/0004_weather_provider_foundation.sql`
- Modify: `services/api/scripts/db-smoke.mjs`
- Modify: `services/api/test/database.test.ts`

**Tables:**

```text
administrative_areas
  id uuid PK
  public_id text UNIQUE
  official_code text
  name text
  normalized_name text
  area_kind text
  parent_id uuid nullable
  effective_from date
  effective_to date nullable
  is_current boolean
  geometry geometry(MultiPolygon, 4326) nullable
  geometry_source_id uuid nullable -> data_sources
  metadata jsonb
  created_at/updated_at

administrative_area_aliases
  area_id uuid -> administrative_areas
  alias text
  normalized_alias text
  alias_kind text            // CURRENT_NAME | HISTORICAL_NAME | LEGACY_DISTRICT | OTHER
  effective_from/effective_to nullable
  source_id uuid nullable
  PK(area_id, normalized_alias, alias_kind)

administrative_area_successors
  predecessor_area_id uuid
  successor_area_id uuid
  relationship text          // MERGED_INTO | SPLIT_TO | RENAMED_TO | REORGANIZED_TO
  effective_at date
  source_id uuid nullable
  PK(predecessor_area_id, successor_area_id, relationship)

provider_configs
  id uuid PK
  provider_key text UNIQUE
  data_source_id uuid nullable -> data_sources
  provider_type text
  enabled boolean
  priority integer
  weight numeric
  secret_ref text nullable
  endpoint_config jsonb
  commercial_use_status text
  redistribution_status text
  licence_status text
  attribution_text text nullable
  attribution_url text nullable
  coverage geometry(MultiPolygon, 4326) nullable
  quota_policy jsonb
  budget_policy jsonb
  freshness_policy jsonb
  model_allow_list jsonb
  fallback_group text nullable
  health_state text
  health_blocks_selection boolean
  metadata jsonb
  created_at/updated_at

provider_capabilities
  provider_config_id uuid -> provider_configs
  capability text
  enabled boolean
  PK(provider_config_id, capability)

provider_health_events
  id bigint identity PK
  provider_config_id uuid
  occurred_at timestamptz
  state text
  latency_ms integer nullable
  failure_code text nullable
  details jsonb
```

- [ ] Write RED DB tests for allowed area kinds, effective-date ordering, parent self-reference rejection, unique active official code semantics, provider status checks and non-empty `provider_key`.
- [ ] Add migration using PostGIS constraints/indexes: GIST for active geometry/coverage, normalized-name B-tree/trigram only if the extension is already approved; do not introduce an unreviewed extension merely for convenience.
- [ ] Add a check that `HISTORICAL_DISTRICT` cannot have `is_current = true`.
- [ ] Add a check that raw credential-like columns such as `api_key`, `token`, `password` do not exist; only `secret_ref` is persisted.
- [ ] Add indexes for current area lookup, parent chain, normalized alias lookup, provider capability and health history.
- [ ] Update DB smoke assertions to prove migrations `0001 → 0004` run in order on a fresh database.
- [ ] Verify with the repository PostGIS test command used by `services/api/test/database.test.ts`.
- [ ] Commit: `feat(db): add location and provider foundation schema`.

---

### Task 3: Implement current/historical administrative-area repository

**Files:**
- Create: `services/api/src/modules/locations/location.types.ts`
- Create: `services/api/src/modules/locations/location.repository.ts`
- Create: `services/api/src/modules/locations/location.service.ts`
- Create: `services/api/test/location.repository.integration.test.ts`

**Repository API:**

```ts
export interface LocationSearchOptions {
  readonly query: string;
  readonly effectiveAt: Date;
  readonly limit: number;
}

export interface PointResolveOptions {
  readonly latitude: number;
  readonly longitude: number;
  readonly effectiveAt: Date;
}

export class LocationRepository {
  search(options: LocationSearchOptions): Promise<readonly LocationSearchResult[]>;
  resolvePoint(options: PointResolveOptions): Promise<ResolvedLocation>;
}
```

`ResolvedLocation` must contain the active administrative chain for the requested date plus any verified historical match metadata, not an inferred district tier.

- [ ] Write RED PostGIS integration fixtures containing one provincial polygon, two commune-level polygons and one historical district alias/predecessor.
- [ ] RED: point inside commune returns `[province-or-central-city, commune/ward/special-zone]` ordered parent-first.
- [ ] RED: current resolution never returns `HISTORICAL_DISTRICT`.
- [ ] RED: legacy district-name search returns a historical result plus verified successor references when mappings exist.
- [ ] RED: coordinate outside known polygons returns a valid point result with empty administrative context rather than a fabricated nearest area.
- [ ] Implement SQL with `ST_Covers` for point-in-polygon resolution and effective-date filters.
- [ ] Reuse existing Vietnamese normalization behavior from `packages/geo`; do not fork another diacritic normalization implementation.
- [ ] Preserve boundary/source IDs in repository records so geometry provenance can be exposed later.
- [ ] Run focused integration tests.
- [ ] Commit: `feat(api): add versioned administrative location repository`.

---

### Task 4: Add vendor-neutral public location APIs

**Files:**
- Create: `services/api/src/modules/locations/location.controller.ts`
- Create: `services/api/src/modules/locations/location.module.ts`
- Modify: `services/api/src/app.module.ts`
- Modify: `services/api/src/openapi.ts`
- Modify: `services/api/test/public-api.integration.test.ts`
- Create: `services/api/test/location.controller.test.ts`

**Endpoints:**

```text
GET /v1/locations/search?q=<text>&limit=<1..50>&effectiveAt=<YYYY-MM-DD optional>
GET /v1/locations/resolve?lat=<number>&lon=<number>&effectiveAt=<YYYY-MM-DD optional>
```

**Response requirements:**
- coordinates use WGS84;
- timezone is explicit when resolved/known;
- `spatialRepresentation: "POINT"` for point resolution;
- each area contains official code, kind, effective dates and `isCurrent`;
- historical search matches are explicitly marked historical and may contain successor references;
- no device/user/account identifier is stored as part of the request path.

- [ ] Write RED controller tests for coordinate ranges, query length, limit and invalid dates.
- [ ] Write RED integration tests for anonymous access, current two-tier response, legacy-name search and no-match behavior.
- [ ] Implement controller/service validation with Zod/current API error conventions.
- [ ] Register module in `AppModule` and document schemas in OpenAPI.
- [ ] Assert no route writes `lat/lon` to a user-history table (none should exist in Phase 5A).
- [ ] Run `pnpm --filter @connuoc/api test` and `pnpm --filter @connuoc/api test:integration`.
- [ ] Commit: `feat(api): expose versioned location search and resolve`.

---

### Task 5: Bootstrap `weather-worker` as a real workspace package with provider adapter contracts

**Files:**
- Create: `services/weather-worker/package.json`
- Create: `services/weather-worker/tsconfig.json`
- Create: `services/weather-worker/src/contracts.ts`
- Create: `services/weather-worker/src/fixture-provider.ts`
- Create: `services/weather-worker/src/index.ts`
- Create: `services/weather-worker/test/contracts.test.ts`
- Modify: `services/weather-worker/README.md`

**Adapter boundary:**

```ts
export interface ProviderContext {
  readonly providerId: string;
  readonly providerKey: string;
  readonly capabilities: readonly ProviderCapability[];
  readonly secretRef: string | null;
}

export interface WeatherHydrologyProviderAdapter {
  readonly providerType: string;
  supports(capability: ProviderCapability): boolean;
  healthCheck(signal?: AbortSignal): Promise<ProviderProbeResult>;
}
```

Phase 5A deliberately does not add `fetchWeather()`/`fetchRainfall()` payload contracts; those arrive in #54/#55 after the provider-selection boundary is proven.

- [ ] Write RED tests that fixture adapter capability checks are exact and stable.
- [ ] Create package scripts matching repository conventions: `build`, `typecheck`, `test`.
- [ ] Depend on `@connuoc/shared-types` via `workspace:*`; do not add an HTTP client dependency in Phase 5A.
- [ ] Implement deterministic fixture provider and redacted probe result.
- [ ] Document that `secretRef` is resolved only by deployment secret infrastructure, never by public/mobile code.
- [ ] Run `pnpm --filter @connuoc/weather-worker typecheck` and `pnpm --filter @connuoc/weather-worker test`.
- [ ] Commit: `feat(weather-worker): add provider adapter foundation`.

---

### Task 6: Implement deterministic provider selection and fallback policy

**Files:**
- Create: `services/weather-worker/src/provider-selector.ts`
- Create: `services/weather-worker/test/provider-selector.test.ts`
- Modify: `services/weather-worker/src/index.ts`

**Selection API:**

```ts
export type ProviderRejectionCode =
  | 'DISABLED'
  | 'CAPABILITY_UNSUPPORTED'
  | 'OUTSIDE_COVERAGE'
  | 'LICENCE_BLOCKED'
  | 'HEALTH_BLOCKED'
  | 'QUOTA_BLOCKED'
  | 'BUDGET_BLOCKED'
  | 'NOT_EFFECTIVE';

export interface ProviderCandidateDecision {
  readonly providerId: string;
  readonly accepted: boolean;
  readonly rejectionCodes: readonly ProviderRejectionCode[];
}

export interface ProviderSelectionResult {
  readonly selectedProviderId: string | null;
  readonly candidates: readonly ProviderCandidateDecision[];
}

export function selectProvider(
  configs: readonly SelectableProviderConfig[],
  request: ProviderSelectionRequest,
): ProviderSelectionResult;
```

**Deterministic ordering:** accepted candidates are ordered by `priority DESC`, then `weight DESC`, then stable `providerKey ASC`. Weight is not random routing in Phase 5A.

- [ ] RED: disabled provider rejected.
- [ ] RED: missing capability rejected.
- [ ] RED: point outside PostGIS-derived/normalized coverage rejected.
- [ ] RED: `COMMERCIAL` deployment rejects `RESTRICTED` or `UNKNOWN` commercial-use status.
- [ ] RED: blocking health, exhausted quota and breached budget reject candidate independently.
- [ ] RED: healthy fallback is selected when higher-priority provider is rejected.
- [ ] RED: same input always yields same selected ID/order.
- [ ] Implement pure selection logic; keep DB/network access outside the selector.
- [ ] Ensure diagnostic decisions contain provider IDs/reasons but no endpoint credentials/secret refs.
- [ ] Run weather-worker tests/typecheck.
- [ ] Commit: `feat(weather-worker): add deterministic provider selection`.

---

### Task 7: Add secret-safe provider configuration repository and Admin API

**Files:**
- Modify: `services/api/src/modules/admin/admin.types.ts`
- Create: `services/api/src/modules/admin/provider-config.types.ts`
- Create: `services/api/src/modules/admin/provider-config.repository.ts`
- Create: `services/api/src/modules/admin/provider-config.service.ts`
- Modify: `services/api/src/modules/admin/admin.controller.ts`
- Modify: `services/api/src/modules/admin/admin.module.ts`
- Create: `services/api/test/provider-admin.test.ts`
- Modify: `services/api/test/admin.integration.test.ts`

**RBAC:** add stable capability `providers:write`; viewers with `admin:read` may read redacted provider metadata, while mutations require `providers:write`.

**Admin endpoints:**

```text
GET   /admin/providers
GET   /admin/providers/:providerKey
PUT   /admin/providers/:providerKey
PATCH /admin/providers/:providerKey/status
```

**Write DTO rules:**
- accepts `secretRef`, never accepts `apiKey`, `token`, `password`, `secretValue` or arbitrary credential JSON;
- coverage is validated GeoJSON/persisted PostGIS geometry through a bounded repository conversion;
- licence/commercial/redistribution states are explicit;
- capability strings must be from the shared union;
- priority/weight/quota/budget/freshness values are bounded.

**Read DTO rule:** may expose `hasSecretRef: boolean` and a non-sensitive secret reference identifier only if operationally necessary; never return a secret value.

- [ ] RED: anonymous admin request -> 401; viewer mutation -> 403; provider operator/admin with `providers:write` -> allowed.
- [ ] RED: reject credential-looking write fields (`apiKey`, `token`, `password`, `secretValue`).
- [ ] RED: GET/list/audit records do not contain a submitted canary secret string.
- [ ] RED: provider update and append-only audit row commit atomically.
- [ ] RED: enabling a provider with deployment-incompatible `commercial_use_status` fails validation/policy with a machine-readable reason.
- [ ] Implement repository transaction using existing `audit_log` conventions and correlation IDs.
- [ ] Store only `secret_ref` in `provider_configs`; sanitize `before_state` and `after_state` even if future schema changes add sensitive data.
- [ ] Register capability in code-defined role mapping following existing admin-auth patterns.
- [ ] Run admin unit/integration tests.
- [ ] Commit: `feat(admin): add provider configuration controls`.

---

### Task 8: Register reviewed source candidates and make licence policy machine-checkable

**Files:**
- Modify: `data/sources/registry.json`
- Create: `data/sources/registry.schema.json` if the repository has no equivalent machine schema; otherwise extend the existing validator/schema path.
- Create: `services/weather-worker/src/source-policy.ts`
- Create: `services/weather-worker/test/source-policy.test.ts`
- Modify: `docs/DATA-SOURCES.md`

**Registry additions:** create distinct reviewed candidate records for:
- Open-Meteo hosted/self-hosted usage as separate deployment interpretations where required by terms;
- GEOGLOWS ECMWF Streamflow Service;
- NASA GPM IMERG;
- Vietnamese official/partner weather/hydrology feeds as `approval_required`/metadata-only until explicit machine-ingestion/redistribution terms are documented.

Each candidate record must explicitly carry at least:

```text
licenseStatus
commercialUseStatus
redistribution
rawPayloadRetention
attribution
termsReviewedAt
termsReference
notes
```

- [ ] Write RED policy tests: unknown/restricted commercial-use provider cannot be selected in `COMMERCIAL` deployment; unknown redistribution prevents raw republishing/packaging.
- [ ] Add candidate records without overstating rights. If a term is not verified, encode `UNKNOWN`/`approval_required`, not an optimistic default.
- [ ] Implement pure policy helper consumed by provider-selection/config validation.
- [ ] Document attribution and retention behavior separately from transport availability.
- [ ] Run registry/policy tests.
- [ ] Commit: `docs(data): register Phase 5 provider source policy`.

---

### Task 9: Add Phase 5A integration gate and project documentation

**Files:**
- Create: `services/api/test/phase5a-provider-foundation.integration.test.ts`
- Create: `.github/workflows/phase5a-provider-foundation.yml`
- Modify: `.github/workflows/ci.yml` only if shared build/typecheck coverage requires the new workspace package.
- Modify: `docs/ROADMAP.md`
- Create: `docs/PHASE-5A-WEATHER-PROVIDER-FOUNDATION.md`
- Modify: `services/weather-worker/README.md`

**End-to-end fixture scenario:**
1. migrate fresh PostGIS DB through `0004`;
2. seed a current province + commune/ward polygon and a historical district alias/successor mapping;
3. seed two fixture provider configs: preferred provider rejected by policy, fallback provider accepted;
4. resolve a point to current two-tier administrative context;
5. run provider selection for a fixture capability;
6. mutate provider priority through authenticated admin API;
7. verify audit row contains safe before/after state and no secret canary;
8. resolve/select again and prove deterministic new ordering.

- [ ] Write integration test first and prove it fails until all wiring is present.
- [ ] Add workflow with PostgreSQL/PostGIS service matching current repository CI versions.
- [ ] Ensure workflow runs shared-types, weather-worker, API unit/integration plus the focused Phase 5A scenario.
- [ ] Document schema, privacy rule, current Vietnam two-tier taxonomy, historical alias behavior, provider policy and handoff to #54/#55/#56/#59/#60.
- [ ] Update ROADMAP Phase 5 with Epic #52 and child issue numbers #53–#62; do not mark implementation issues complete.
- [ ] Commit: `test(phase5): add provider foundation integration gate`.

---

### Task 10: Fresh verification, scope review and PR handoff

**Files:**
- No new production file expected; only fix defects discovered by verification.

- [ ] From repository root run frozen install using the repository's pinned pnpm/toolchain command.
- [ ] Run repository formatting/lint commands used by `.github/workflows/ci.yml`.
- [ ] Run `pnpm --filter @connuoc/shared-types typecheck` and tests.
- [ ] Run `pnpm --filter @connuoc/weather-worker typecheck`, `test` and `build`.
- [ ] Run `pnpm --filter @connuoc/api typecheck`, `test`, `test:integration` and `build`.
- [ ] Run DB migration/smoke test against clean PostGIS.
- [ ] Run existing ingestion, public API, admin integration and Phase 2 exit gates to prove no regression.
- [ ] Run the new Phase 5A provider-foundation workflow/gate.
- [ ] Search built/source artifacts for test canary secret and credential field names; confirm no actual secret value is present.
- [ ] Confirm mobile sources were not modified by #53.
- [ ] Confirm no live external-provider dependency is needed for tests.
- [ ] Confirm no weather/rainfall/discharge/stage/flood calculation slipped into #53 scope.
- [ ] Review changed files against #53 acceptance criteria and both design documents.
- [ ] Update implementation PR body with exact verification evidence and `Closes #53` only after all gates are green.
- [ ] Mark ready/merge only with expected-head guard and no unresolved review threads.

## Phase 5A Definition of Done

Phase 5A is complete only when all of the following are true:

- current Vietnam administrative resolution uses the active two-tier province/city → commune/ward/special-zone model;
- historical district/place names remain searchable without being represented as a current tier;
- location resolution is stateless with respect to end-user precise-location history;
- shared provider capability/policy contracts are stable and covered by tests;
- provider selection is deterministic and rejects invalid licence/coverage/health/quota candidates;
- provider admin writes are RBAC-protected, audited and secret-safe;
- source/licence policy is machine-checkable without optimistic assumptions;
- Phase 2 public/admin/ingestion behavior remains green;
- no live weather/hydrology data or flood prediction is introduced before the child issues that own those features.
