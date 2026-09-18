# Phase 5D — River Network & Discharge Intelligence

Status: implementation and exit gate for issue #56.

Phase 5D adds normalized river-reach coverage and modelled discharge/streamflow intelligence. It deliberately stops before local stage/water-level conversion or flood-probability modelling.

## Safety boundary

Phase 5D is discharge-only.

- Provider streamflow remains discharge in `m3/s`.
- GEOGLOWS/GloFAS forecast or retrospective values are not gauge-stage observations.
- No discharge value is silently converted to stage, water level or local river rise.
- Return-period discharge thresholds are reference-flow context, not flood probabilities.
- Retrospective simulations remain explicitly simulated, never observed.
- Mapping uncertainty is part of the public contract.
- Precise stage/water-level output belongs to Phase 5E/#57 and requires provider-native stage with known datum or validated local calibration/rating curves.

## Normalized river mapping

Migration `0007_hydrology_discharge.sql` adds a normalized river-reach layer on top of existing basin/river entities.

`river_reaches` stores:
- stable public reach id;
- optional normalized river/basin identity;
- reach geometry;
- source/provenance metadata.

`river_reach_provider_mappings` stores provider associations with:
- provider reach/grid id;
- product/version;
- state: `MAPPED` or `AMBIGUOUS`;
- method: `PROVIDER_ID`, `MANUAL`, `NAME_SPATIAL`, `NEAREST_GEOMETRY` or `MODEL_GRID_CELL`;
- confidence 0..1;
- optional distance;
- effective interval.

No mapping row means `UNMAPPED`.

Multiple valid mappings to different providers are provider coverage, not ambiguity by themselves. Ambiguity means one provider association cannot be resolved to one provider reach/cell safely.

## Hydrology products

Normalized discharge products are:

| Product | Meaning |
| --- | --- |
| `FORECAST_MEAN` | Mean provider forecast discharge. |
| `FORECAST_STATISTIC` | Explicit forecast statistic such as median/P25/P75/min/max. |
| `FORECAST_ENSEMBLE_MEMBER` | One provider ensemble member. |
| `RETROSPECTIVE_SIMULATION` | Historical model simulation; never an observation. |

Every discharge record carries:
- normalized river reach id;
- provider reach/grid id;
- mapping state/method/confidence/distance;
- valid time;
- model run time and exact lead time for forecasts;
- discharge in `m3/s`;
- member/statistic identity where applicable;
- quality flags;
- source/product/version/fetch-time/attribution provenance.

Forecast lead time must equal `validAt - modelRunAt`.

## Return-period context

Return-period rows store:
- provider/normalized reach identity;
- return period in years;
- threshold discharge in `m3/s`;
- optional retrospective baseline period;
- source/product/version attribution.

A 20-year return-period flow is a reference threshold. It is not rendered or described as a 5% flood probability by Phase 5D.

## Persistence and idempotency

Phase 5D stores:
- `hydrology_forecast_runs`;
- `hydrology_discharge_points`;
- `hydrology_return_periods`.

Normalized bundles are checksummed deterministically. Re-ingestion of the same provider/reach/capability/bundle reuses the existing run and does not duplicate points.

Exact user request coordinates are not stored in hydrology run tables.

## Provider adapters

### Deterministic fixture

The fixture adapter covers:
- mapped, ambiguous and unmapped reach lookup;
- forecast mean;
- ensemble statistics and members;
- retrospective simulation;
- return-period thresholds.

It exists for deterministic regression tests and is not evidence of real-world hydrologic accuracy.

### GEOGLOWS v2

The adapter follows the GEOGLOWS Data Service v2 response structures for:
- nearest river id lookup;
- forecast statistics/mean;
- forecast ensemble;
- daily retrospective;
- return periods.

`getriverid` returns a nearest provider river id but no distance in the response consumed by this adapter. Phase 5D therefore assigns bounded lookup confidence rather than claiming exact local named-river identity.

All malformed, non-finite or negative discharge values fail closed.

### Open-Meteo Flood / GloFAS

The adapter treats the returned model cell as a model-grid association:
- provider id is derived from the returned grid coordinate;
- mapping method is `MODEL_GRID_CELL`;
- confidence is intentionally low;
- request-to-grid distance is retained;
- grid drift between mapping and forecast is rejected.

This is important because a nearest model cell is not automatically the intended local river reach.

The current Open-Meteo Flood adapter covers forecast/ensemble discharge. It does not invent unsupported retrospective or return-period endpoints.

## GEOGLOWS licence fail-closed policy

As reviewed on 2026-09-18, official GEOGLOWS materials do not present one unambiguous product-level licence signal for every RFS v2 distribution path: the Streamflow Service licence page and the RFS v2 dataset catalog expose different licence labels.

For this reason the machine registry now uses:
- `licenseStatus: PRODUCT_SCOPE_CONFLICT_REVIEW_REQUIRED`;
- `commercialUseStatus: UNKNOWN`;
- `redistribution: UNKNOWN`;
- `rawPayloadRetention: REFERENCE_ONLY`.

That means a GEOGLOWS v2 provider is blocked by the commercial selector until the exact production product/distribution licence scope is clarified. Phase 5D tests this fail-closed behavior.

## Provider selection and fallback

Hydrology reuses the Phase 5A server-side provider selector.

Capabilities:
- `hydrology.dischargeForecast`;
- `hydrology.dischargeEnsemble`;
- `hydrology.retrospective`;
- `hydrology.returnPeriods`.

The runtime sequence is:
1. filter providers by enabled/coverage/capability/licence/commercial policy;
2. resolve the normalized reach against that provider;
3. call an adapter only if that provider mapping is exactly `MAPPED`;
4. record health evidence;
5. fallback to the next eligible provider on bounded provider failure.

An `AMBIGUOUS` or `UNMAPPED` reach is not treated as a provider outage and is never auto-selected.

## Last-known-good policy

When all live paths fail or are unavailable, persisted LKG data may be reused only when:
- normalized river reach matches;
- hydrology capability matches;
- provider reach id still has a current `MAPPED` relation to that normalized reach;
- the persisted run remains within its stale grace.

Phase 5D uses a 6-hour stale grace.

If the provider mapping expires or changes, old cached data is rejected even if its time-based stale grace has not expired.

## Public APIs

All endpoints use the global `/v1` prefix.

### Nearby rivers

`GET /v1/rivers/nearby?lat=&lon=&radiusKm=&limit=`

Returns:
- normalized reach/river/basin identity;
- geometric distance;
- mapping state;
- best mapping confidence;
- mapped-provider and candidate counts.

It does not expose provider configuration ids, provider keys, credentials or endpoints.

### River forecast

`GET /v1/rivers/:reachId/forecast?days=`

Returns:
- discharge forecast records in `m3/s`;
- trend: `RISING | FALLING | STABLE | UNKNOWN`;
- FRESH/STALE state;
- fallback/LKG flags;
- mapped provider reach id plus public mapping method/confidence/distance;
- source/product/model/fetch attribution;
- return-period discharge context where available.

Public source metadata removes internal `providerConfigId`. Provider keys, secret refs and endpoint config never appear.

If no eligible mapped live provider or compatible LKG exists, the API returns HTTP 503:

```json
{
  "statusCode": 503,
  "code": "HYDROLOGY_UNAVAILABLE",
  "message": "Hydrology data is temporarily unavailable."
}
```

## Operational verification

Dedicated workflow: `.github/workflows/phase5d-river-discharge.yml`.

The gate proves on a fresh PostGIS database:
1. migrations/schema constraints;
2. shared discharge/reach contracts;
3. fixture, GEOGLOWS and Open-Meteo Flood adapter tests;
4. source-policy fail-closed behavior;
5. reach ambiguity/no-match behavior;
6. persistence idempotency and mapping-compatible LKG;
7. API unit contracts;
8. focused Phase 5D end-to-end scenario;
9. full API integration regression;
10. API build.

The focused scenario specifically proves:
- multiple valid provider mappings are coverage, not ambiguity;
- a higher-priority commercial-unknown GEOGLOWS provider is skipped;
- an allowed fallback provider serves and persists discharge;
- disabling the live provider uses compatible stale LKG;
- ambiguous reach mapping fails closed;
- public JSON contains no provider runtime secrets, fabricated stage/water-level or flood probability.

## Handoff to Phase 5E

Phase 5E/#57 can now consume:
- normalized reach identity;
- forecast/ensemble discharge;
- retrospective simulations;
- return-period reference flow;
- rainfall foundations from Phase 5C.

Phase 5E still needs local evidence before emitting stage or river-rise values. A discharge forecast alone is not enough.
