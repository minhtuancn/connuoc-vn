# Phase 5A — Weather/Provider Foundation

## Purpose

Phase 5A establishes the production-safe foundation required before Con Nước Việt ingests live weather, rainfall or hydrology data. It owns current Vietnam administrative resolution, historical location lookup, vendor-neutral provider contracts, deterministic provider selection, source/licence policy, and secret-safe provider administration.

Implementation issue: #53  
Parent epic: #52  
Implementation PR: #63

Phase 5A deliberately does **not** implement live weather values, rainfall ingestion, discharge forecasts, water-level forecasts, flood probability or flood-risk calculations. Those belong to #54–#62.

## Administrative location model

Current location resolution uses the current two-tier Vietnam hierarchy represented by:

```text
PROVINCE | CENTRAL_CITY
  -> COMMUNE | WARD | SPECIAL_ZONE
```

`HISTORICAL_DISTRICT` is retained only for historical search/provenance. Historical aliases may point to current successor areas using an explicit relationship and effective date.

Every administrative area carries official code, effective dates and current/historical state. Spatial resolution uses WGS84 PostGIS geometry and returns `Asia/Ho_Chi_Minh` only when the resolved context supports it.

### Precise-location privacy

`GET /v1/locations/resolve` is stateless with respect to end-user precise-location history. Coordinates are used to resolve the current request; Phase 5A does not create a user/account/device location-history table. A later saved-location feature must be an explicit user action and must not silently repurpose resolve requests as tracking data.

## Provider contracts

`@connuoc/shared-types` defines normalized capability, commercial-use and provider-health contracts. `@connuoc/weather-worker` provides the adapter boundary and deterministic selection logic.

Selection is pure and contains no DB/network access. The repository/spatial layer supplies normalized candidate facts such as coverage, health, quota and budget state.

Accepted providers are ranked by:

```text
priority DESC
weight DESC
providerKey ASC
```

Phase 5A does not use weight as random routing.

A candidate is rejected independently for disabled state, unsupported capability, coverage miss, commercial-use policy, blocking health, quota, budget or effective-window state. Diagnostic output contains provider identifiers/reason codes only, never credentials or secret references.

## Source/licence policy

`data/sources/registry.json` is the machine-readable reviewed-source registry and `data/sources/registry.schema.json` defines its Phase 5 schema.

The runtime policy is fail-closed:

- commercial deployment requires `commercialUseStatus=ALLOWED`;
- raw redistribution requires both an allowed redistribution state and an allowed raw-retention state;
- `RESTRICTED`, `UNKNOWN`, `REFERENCE_ONLY` and `APPROVAL_REQUIRED` are not silently promoted;
- attribution/retention are independent from whether an endpoint is technically reachable.

Reviewed provider candidates include distinct Open-Meteo hosted/self-hosted interpretations, GEOGLOWS streamflow, NASA GPM IMERG and an approval-gated Vietnamese official/partner-feed candidate. Source terms must be reviewed again when onboarding an actual production adapter.

## Admin provider configuration

Provider operations are available under `/v1/admin/providers` and use existing admin bearer authentication/RBAC/audit infrastructure.

Read access requires `admin:read`. Mutations require `providers:write`, assigned to data operators and administrators.

Writes accept an opaque `secretRef`; they do not accept raw `apiKey`, `token`, `password`, `secretValue` or arbitrary credential-shaped nested values. The database stores only the secret reference. API responses and audit before/after state expose `hasSecretRef` rather than the reference value itself.

Provider update and audit append happen in the same database transaction. Enabling a provider for the commercial deployment policy fails with `LICENCE_BLOCKED` unless commercial use is explicitly `ALLOWED`.

## Phase 5A end-to-end fixture gate

`services/api/test/phase5a-provider-foundation.integration.test.ts` proves the foundation as one scenario:

1. create current province + commune geometry;
2. create a historical district alias and verified successor;
3. seed a higher-priority commercially restricted provider and a lower-priority allowed fallback;
4. resolve a WGS84 point to the current two-tier administrative context;
5. evaluate provider coverage in PostGIS and run deterministic selection;
6. prove the restricted preferred provider is rejected and the healthy fallback is selected;
7. raise fallback priority through authenticated Admin API;
8. prove ordering changes deterministically;
9. prove the audit record is correlated and contains no secret canary.

The dedicated `.github/workflows/phase5a-provider-foundation.yml` gate runs fresh PostGIS migrations/schema smoke plus shared-types, weather-worker, API unit/integration/build verification. Tests use fixtures only and require no live external provider.

## Safety boundaries carried forward

- Do not present modeled discharge as a precise river stage.
- A future stage requires provider-native stage with known datum or a validated local conversion/calibration model.
- Official warnings remain separately attributed and take precedence over internally derived messaging for the same scope/time.
- Unknown source rights fail closed.
- Stale/unknown-datum data must remain explicit and may force later decision engines to return insufficient data.
- Public/mobile APIs remain vendor-neutral; provider credentials never leave server-side infrastructure.

## Handoff to Phase 5 child issues

- #54 — normalized multi-provider weather forecast ingestion/public API.
- #55 — rainfall observations, history, forecast and accumulation intelligence.
- #56 — river network enrichment and GEOGLOWS/GloFAS discharge forecasts.
- #57 — gauge calibration/rating curves and validated river-rise forecasts.
- #58 — flood-risk engine and hazard/susceptibility baselines.
- #59 — Vietnamese official alerts and authorized partner-feed framework.
- #60 — provider health/quota/usage operational tooling beyond the Phase 5A configuration boundary.
- #61 — mobile/web weather, river and flood-risk user journeys.
- #62 — calibration/backtesting and Phase 5 exit gate.

## Phase 5A exit conditions

Phase 5A can be closed only after the implementation PR has fresh green evidence for:

- repository CI;
- PostGIS migration/schema smoke;
- shared location/provider contracts;
- weather-worker selector/source-policy tests and build;
- API unit/integration/build;
- focused Phase 5A end-to-end scenario;
- existing Public API, Admin, Queue, Ingestion and Phase 2 exit workflows;
- review confirming no live weather/rain/discharge/stage/flood calculation slipped into #53;
- review confirming no secret canary/raw credential appears in source, response, logs or audit evidence.
