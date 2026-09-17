# Weather / Hydrology Worker

Provider adapter, source-policy and normalization package for approved weather, rainfall and hydrology ingestion.

## Phase 5B boundary

Phase 5B adds production-shaped weather forecast adapters on top of the Phase 5A provider foundation:

- vendor-neutral weather adapter contracts;
- deterministic provider selection and fail-closed source/licence policy;
- synthetic fixture adapter for deterministic integration tests;
- Open-Meteo current/hourly/daily normalization;
- typed provider/network/payload failures;
- source attribution, model/run/fetched-time and provider-grid provenance.

Runtime database loading, secret resolution, provider fallback orchestration, cache persistence and public HTTP routes live in `services/api`. This package intentionally keeps provider parsing/normalization separate from API and persistence concerns.

Phase 5B does **not** implement rainfall fusion, river discharge, local river-stage calibration or flood probability.

## Deterministic provider selection

`src/provider-selector.ts` is a pure function. DB/network access stays outside the selector. Candidate facts such as geographic coverage, quota/budget availability and health are normalized before selection.

Accepted candidates are ordered by:

```text
priority DESC -> weight DESC -> providerKey ASC
```

Weight is a deterministic tie-breaker, not random traffic splitting. Rejection reasons accumulate independently so operators can see whether a provider is blocked by capability, coverage, licence, health, quota, budget, disabled state or effective window.

A rejected provider is never attempted by runtime orchestration. Fallback cannot override a licence/policy rejection.

## Source policy

`src/source-policy.ts` is the shared fail-closed rights helper used by provider selection and ingestion policy. Commercial deployments require explicit `ALLOWED` commercial-use status. Raw redistribution additionally requires compatible redistribution and raw-payload retention states.

Reviewed source policy is stored in `data/sources/registry.json`; transport availability never overrides licence/attribution/retention policy.

## Adapter contract

Weather adapters receive only the runtime context needed for provider execution and return a normalized bundle for one of:

```text
weather.current
weather.hourlyForecast
weather.dailyForecast
```

Normalized bundles preserve:

- provider/model grid latitude and longitude;
- provider timezone;
- source registry id;
- attribution text/url;
- model id;
- model run time where supplied;
- fetched time;
- valid timestamp/date for every record.

Adapters must not expose credentials in their normalized output.

## Fixture adapter

`FixtureProviderAdapter` is synthetic and deterministic. It is used to prove contracts, fallback, persistence and public-response behavior without depending on a live third-party provider.

Synthetic fixture output is implementation evidence only. It is not evidence of real-world forecast accuracy.

## Open-Meteo adapter

`OpenMeteoWeatherAdapter` maps Open-Meteo forecast responses into Con Nước normalized current/hourly/daily records.

The adapter supports separate hosted deployment configurations rather than assuming one endpoint is valid for every deployment mode.

Open-Meteo policy review dated 2026-09-17 is recorded in `data/sources/registry.json` and `docs/DATA-SOURCES.md`:

- free hosted API is non-commercial under the reviewed hosted-service terms;
- paid customer API provides commercial-use entitlement for the hosted service;
- returned API data has attribution obligations described by Open-Meteo under CC BY 4.0;
- self-hosting does not erase upstream model/data obligations.

Terms/pricing are external and must be re-reviewed before production onboarding. The project does not hardcode subscription prices.

## Failure model

Provider failures use bounded machine-readable codes such as:

```text
INVALID_REQUEST
UNSUPPORTED_CAPABILITY
INVALID_PAYLOAD
HTTP_RETRYABLE
HTTP_REJECTED
NETWORK
```

The API orchestration layer also handles secret/provider factory failures and records only bounded failure evidence in provider health history. Arbitrary upstream response bodies and credentials are not health-event payloads.

## Phase 5A verification

Foundation scenario:

`services/api/test/phase5a-provider-foundation.integration.test.ts`

Foundation workflow:

`.github/workflows/phase5a-provider-foundation.yml`

They verify location/provider/source policy, PostGIS coverage, licence-blocked selection, authenticated provider priority changes and secret-safe audit behavior.

## Phase 5B verification

Weather acceptance scenario:

`services/api/test/phase5b-weather.integration.test.ts`

Dedicated workflow:

`.github/workflows/phase5b-weather.yml`

The Phase 5B gate proves:

- policy-blocked preferred provider is skipped;
- allowed deterministic fallback serves normalized weather;
- current/hourly/daily contracts work end-to-end;
- provider-grid history is persisted;
- stale nearest-grid fallback works after live providers become unavailable;
- unavailable requests fail closed;
- provider keys, secret references, endpoint config and credential canaries do not leak publicly.

## Responsibilities

- Host provider adapter contracts behind normalized capability names.
- Support deterministic provider health/probe behavior for orchestration.
- Apply source/licence policy before provider use.
- Fetch only approved sources.
- Normalize current/hourly/daily weather values and provenance.
- Preserve units/timezone/model-run semantics.
- Archive/checksum raw payload metadata only where source terms permit.
- Emit bounded provider failures suitable for safe operational telemetry.
- Provide normalized inputs to later rainfall/hydrology layers.

This worker does not make drainage decisions, invent stage from discharge, or calculate flood probability; it only supplies normalized inputs to later calibrated layers.
