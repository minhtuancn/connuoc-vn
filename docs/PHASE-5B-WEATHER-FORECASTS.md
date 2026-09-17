# Phase 5B — Weather Forecast Platform

Status: implementation candidate on PR #102  
Review date: 2026-09-17

## Goal

Phase 5B delivers the first production-shaped weather forecast slice for Con Nước Việt:

- normalized current, hourly and daily weather contracts;
- provider-neutral adapters;
- deterministic multi-provider selection and fallback;
- commercial-use/licence policy enforcement before provider execution;
- provider-grid persistence with provenance;
- bounded nearest-grid stale fallback;
- anonymous public APIs with no provider secret/config leakage;
- a dedicated Phase 5B CI gate.

This phase is intentionally narrower than rainfall intelligence, river discharge, locally calibrated river-stage prediction and flood-risk estimation. Those remain later workstreams.

## Public APIs

```text
GET /v1/weather/current?lat=<latitude>&lon=<longitude>
GET /v1/weather/hourly?lat=<latitude>&lon=<longitude>&hours=<1..168>
GET /v1/weather/daily?lat=<latitude>&lon=<longitude>&days=<1..15>
```

Input bounds:

- latitude: `-90..90`;
- longitude: `-180..180`;
- hourly horizon: `1..168` hours;
- daily horizon: `1..15` days.

HTTP cache policy:

| Endpoint | Cache-Control |
| --- | --- |
| current | `public, max-age=60, stale-while-revalidate=120` |
| hourly | `public, max-age=300, stale-while-revalidate=600` |
| daily | `public, max-age=900, stale-while-revalidate=1800` |

Application freshness remains explicit inside the response and is not replaced by HTTP cache semantics.

## Normalized response contract

Every successful weather response exposes only normalized public information:

```text
freshness.state        FRESH | STALE
freshness.staleAfter   original provider-derived stale boundary
grid                    provider grid location, not the user's stored location
source                   source id, attribution, model id/run/fetched timestamps
fallbackUsed             whether the preferred provider/path was not used
current.data | points    normalized weather measurements/forecast points
```

Provider implementation details are internal and must never appear recursively in public JSON:

```text
providerKey
secretRef
endpointConfig
API keys / credential canaries
```

## Current semantics

`current` is modeled current weather (`MODEL_CURRENT`), not a claim of station observation unless a future adapter explicitly supplies an observation contract.

The weather contract keeps model/source metadata visible so downstream UI can distinguish modeled values from later observed products.

## Provider architecture

Runtime flow:

```text
HTTP request
  -> WeatherController
  -> WeatherService
  -> WeatherOrchestrator
  -> WeatherProviderRepository
  -> deterministic provider selector
  -> WeatherAdapterFactory
  -> provider adapter
  -> normalized bundle
  -> WeatherRepository
  -> PostGIS provider-grid history/cache
```

The public API does not know vendor-specific field names or credentials.

### Selection order

Accepted providers are deterministic:

```text
priority DESC -> weight DESC -> providerKey ASC
```

Before selection, a provider can be rejected for:

- disabled state;
- unsupported capability;
- geographic coverage;
- commercial-use policy;
- health policy;
- quota/budget policy;
- effective-time window.

Fallback is not permission escalation. A provider blocked by licence or deployment policy remains blocked even if all preferred providers fail.

## Secret handling

Phase 5B supports opaque environment-backed references:

```text
env://VARIABLE_NAME
```

`EnvironmentWeatherSecretResolver` resolves the reference only inside the server runtime.

Rules:

- secrets are never stored in source registry JSON;
- public API responses never return `secretRef` or resolved credentials;
- provider health events contain bounded machine-readable failure codes, not arbitrary upstream response bodies;
- fixture providers do not require secret resolution.

Future secret backends may replace the resolver implementation without changing provider/public contracts.

## Open-Meteo adapter

Phase 5B includes a normalized Open-Meteo forecast adapter plus a deterministic fixture adapter used by tests.

The Open-Meteo adapter normalizes provider output into the shared weather contract and preserves:

- selected provider grid;
- provider timezone;
- source attribution;
- model id;
- model run time when available;
- fetched time;
- current/hourly/daily valid times.

### Terms review — 2026-09-17

Reviewed references:

- https://open-meteo.com/en/terms
- https://open-meteo.com/en/pricing

Recorded policy:

- free hosted API: non-commercial hosted use only under the current Open-Meteo terms;
- paid customer API: commercial-use entitlement with API key/customer endpoint under the subscribed plan;
- API data: attribution obligations under CC BY 4.0 as described by Open-Meteo;
- self-hosted server: separate server/software and upstream-data obligations still apply;
- pricing, quotas and terms are external facts and must be re-reviewed before production rollout or provider-policy promotion.

No numeric subscription price is hardcoded in the repository.

The free hosted endpoint must never become an implicit fallback for a commercial deployment.

## Persistence model

Migration:

```text
infrastructure/database/migrations/0005_weather_forecasts.sql
```

Main tables:

```text
weather_forecast_runs
weather_current_points
weather_hourly_points
weather_daily_points
```

A forecast run stores normalized provider evidence including:

- provider config id;
- registry source id;
- capability;
- provider grid point;
- provider timezone;
- attribution text/url;
- model id;
- model run time;
- fetched time;
- stale-after time;
- normalized checksum.

Child tables store capability-specific normalized values.

### Idempotency

Forecast runs are idempotent by normalized content for a provider/capability. Re-saving an identical normalized bundle reuses the run rather than creating duplicate history.

### Request-coordinate privacy

Phase 5B does **not** persist the user's request coordinate in weather history.

The persisted spatial point is the provider/model grid used for the returned bundle. The request coordinate is used transiently for provider coverage/selection and nearest-cache lookup only.

## Freshness state machine

```text
live provider succeeds
  -> persist normalized provider-grid bundle
  -> FRESH

all eligible live providers fail
  + nearest compatible cache <= 25 km
  + cache still within bounded stale grace
  -> STALE

otherwise
  -> WEATHER_UNAVAILABLE
```

Initial stale grace:

- current/hourly: 21,600 seconds (6 hours) after provider `staleAfter`;
- daily: 43,200 seconds (12 hours) after provider `staleAfter`.

The service never rewrites cached timestamps to make old data appear fresh. A STALE response preserves the original:

- fetched time;
- model run time;
- valid time/date;
- provider grid;
- attribution/model metadata.

Cache lookup is capped at 25 km and uses PostGIS geography distance.

## Unavailable response

When no eligible live provider and no eligible stale cache exist, weather endpoints return:

```json
{
  "statusCode": 503,
  "code": "WEATHER_UNAVAILABLE",
  "message": "Weather data is temporarily unavailable."
}
```

This bounded response is handled at the weather-controller scope so the rest of the API can keep its existing global RFC 7807 error behavior.

## Health evidence

Provider attempts record bounded operational evidence:

```text
provider_config_id
state
latency_ms
failure_code
occurred_at
```

Failure codes are bounded machine-readable values. Arbitrary upstream body content and credentials are not persisted into health events.

Health telemetry failure itself must not change fallback semantics.

## Source and licence policy

Machine-readable source policy remains in:

```text
data/sources/registry.json
```

Phase 5B does not infer commercial rights from public availability.

For commercial deployment, provider selection is fail-closed and requires explicit `commercialUseStatus=ALLOWED`.

Attribution must flow to presentation/export layers. Storing attribution in provenance is necessary but not sufficient for product compliance.

See `docs/DATA-SOURCES.md` for the complete source policy.

## Verification

Focused acceptance scenario:

```text
services/api/test/phase5b-weather.integration.test.ts
```

It proves, without calling live external providers:

1. a higher-priority commercial-policy-blocked provider is rejected;
2. an allowed fallback provider serves current/hourly/daily normalized weather;
3. provider-grid runs are persisted;
4. disabling the live provider activates nearest-grid STALE fallback;
5. a request outside provider coverage/cache radius fails closed with bounded 503;
6. provider keys, secret references, endpoint config and credential canaries do not leak publicly.

Dedicated workflow:

```text
.github/workflows/phase5b-weather.yml
```

The gate runs:

```bash
pnpm install --frozen-lockfile
pnpm --filter @connuoc/api db:migrate
pnpm --filter @connuoc/api db:smoke
pnpm --filter @connuoc/shared-types typecheck
pnpm --filter @connuoc/shared-types test
pnpm --filter @connuoc/weather-worker typecheck
pnpm --filter @connuoc/weather-worker test
pnpm --filter @connuoc/weather-worker build
pnpm --filter @connuoc/api typecheck
pnpm --filter @connuoc/api test
pnpm --filter @connuoc/api exec vitest run test/phase5b-weather.integration.test.ts --maxWorkers=1
pnpm --filter @connuoc/api test:integration
pnpm --filter @connuoc/api build
```

## Production onboarding checklist

Before enabling a non-fixture provider in production:

- [ ] source registry policy reviewed on a recent date;
- [ ] commercial-use entitlement matches deployment mode;
- [ ] redistribution/attribution obligations implemented in product UI/export paths;
- [ ] endpoint is approved and protected against unsafe configurable destinations;
- [ ] secret reference resolves only server-side;
- [ ] capability and geographic coverage configured;
- [ ] model allow-list reviewed where applicable;
- [ ] freshness policy configured;
- [ ] timeout/rate/quota/budget policy configured;
- [ ] health monitoring configured;
- [ ] normalized fixture/schema-drift tests exist;
- [ ] provenance/model/run/timezone semantics verified;
- [ ] stale/unavailable behavior exercised;
- [ ] no request-location history is introduced unintentionally.

## Non-goals of Phase 5B

Not implemented here:

- radar/satellite/historical rainfall fusion;
- IMERG ingestion;
- GEOGLOWS river discharge;
- local gauge stage/rating curves;
- tide + rainfall + upstream-flow river-rise models;
- probabilistic flood-risk calibration;
- official warning ingestion;
- mobile/web weather journey polish;
- background refresh scheduling beyond the provider/API foundation.

These are intentionally separated so weather availability cannot be mistaken for calibrated hydrology or flood prediction.

## Exit criteria

Phase 5B may be considered merge-ready only when the dedicated Phase 5B workflow and all existing required regression workflows are green on the same immutable PR head, the PR review is clean, and the head SHA used for merge is explicitly verified.
