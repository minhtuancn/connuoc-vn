# Weather / Hydrology Worker

Background worker foundation for approved weather, rainfall and hydrology source ingestion.

## Phase 5A boundary

The current package defines vendor-neutral provider adapter contracts, exact capability matching, deterministic provider selection and fail-closed source/licence policy. It does **not** fetch live weather, rainfall or hydrology values yet.

Provider credentials remain opaque `secretRef` values. Health/probe results and selector diagnostics must never echo secret references or raw credentials.

## Deterministic provider selection

`src/provider-selector.ts` is a pure function. DB/network access stays outside the selector. Candidate facts such as geographic coverage, quota/budget availability and health are normalized before selection.

Accepted candidates are ordered by:

```text
priority DESC -> weight DESC -> providerKey ASC
```

Weight is a deterministic tie-breaker in Phase 5A, not random traffic splitting. Rejection reasons accumulate independently so operators can see whether a provider is blocked by capability, coverage, licence, health, quota, budget, disabled state or effective window.

## Source policy

`src/source-policy.ts` is the shared fail-closed rights helper used by provider selection and later ingestion policy. Commercial deployments require explicit `ALLOWED` commercial-use status. Raw redistribution additionally requires compatible redistribution and raw-payload retention states.

Reviewed source policy is stored in `data/sources/registry.json`; transport availability never overrides licence/attribution/retention policy.

## Phase 5A verification

The focused integration scenario lives at:

`services/api/test/phase5a-provider-foundation.integration.test.ts`

The dedicated workflow is:

`.github/workflows/phase5a-provider-foundation.yml`

Together they verify current/historical Vietnam location resolution, PostGIS provider coverage, licence-blocked preferred-provider fallback, authenticated priority changes and secret-safe audit state without calling any live external weather/hydrology provider.

## Responsibilities
- Host provider adapter contracts behind normalized capability names.
- Support deterministic provider health/probe behavior for orchestration.
- Apply source/licence policy before provider use.
- Fetch approved sources in later Phase 5 workstreams.
- Archive/checksum raw payload metadata where source terms permit.
- Normalize observations/forecasts.
- Apply units/timezone/datum metadata.
- Apply quality/freshness flags.
- Store observations and forecast runs.
- Emit freshness/error metrics.

This worker does not make drainage decisions, invent stage from discharge, or calculate flood probability; it only supplies normalized inputs to later calibrated layers.
