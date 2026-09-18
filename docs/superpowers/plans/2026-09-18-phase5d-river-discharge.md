# Phase 5D — River Network & Discharge Intelligence Implementation Plan

Date: 2026-09-18  
Issue: #56  
Parent: #52  
Base: Phase 5A provider/location foundation + Phase 5B weather + Phase 5C rainfall

## Objective

Add a provenance-first river-network and discharge subsystem for Vietnam that can resolve nearby normalized river reaches, map them to external provider reach/cell identifiers, persist forecast/ensemble/retrospective/return-period discharge products, and expose vendor-neutral public APIs.

This phase is **discharge-only**. It must never fabricate river stage/water level from discharge. Stage conversion/calibration belongs to #57.

## Locked safety rules

1. Streamflow/discharge remains discharge in `m3/s`.
2. No field named `stage`, `waterLevel`, `levelM` or equivalent may be synthesized from discharge.
3. Provider model run, valid time, lead time, member/statistic and source provenance are preserved.
4. Retrospective simulation is not an observation.
5. Return-period reference flow is contextual reference data, not a flood probability.
6. Reach/cell association uncertainty is explicit. Ambiguous and unmapped results must not be silently promoted to exact mapping.
7. Public responses never expose provider credentials, secret refs or endpoint configuration.
8. Exact request coordinates are not retained as user location history.
9. Provider licence/commercial-use policy remains fail-closed and reuses the Phase 5A selector.
10. Last-known-good fallback must preserve provider/reach identity and freshness; stale data is never labelled fresh.

## Current provider evidence

GEOGLOWS Data Service v2 exposes:
- nearest river/reach lookup;
- average forecast;
- forecast statistics;
- forecast ensemble;
- rolling forecast records;
- hourly/daily/monthly retrospective simulations;
- return periods.

Open-Meteo Flood API exposes GloFAS discharge and ensemble statistics at a model grid/cell. Its documentation warns that the selected river cell may not represent the intended local river; therefore mapping confidence and provider-grid metadata are first-class fields.

## Task 1 — Shared river/discharge contracts

TDD:
1. Add RED tests for:
   - normalized river reach/provider mapping;
   - mapped/ambiguous/unmapped states;
   - deterministic forecast mean;
   - forecast statistic and ensemble-member records;
   - retrospective simulation;
   - return-period reference;
   - rejection of negative discharge;
   - forecast lead-time consistency;
   - rejection of any fabricated stage/water-level fields.
2. Implement `packages/shared-types/src/hydrology.ts`.
3. Export contracts from `packages/shared-types/src/index.ts`.
4. Run shared-types lint/typecheck/tests.

Exit:
- vendor-neutral discharge contracts are stable;
- no stage derivation exists in the type system.

## Task 2 — River/basin/reach mapping persistence

Add migration `0007_hydrology_discharge.sql`.

Reuse the existing Phase 2 `basins`, `rivers` and `stations` tables rather than duplicating those concepts.

Minimum new tables:
- `river_reaches`;
- `river_reach_provider_mappings`;
- `hydrology_forecast_runs`;
- `hydrology_discharge_points`;
- `hydrology_return_periods`.

Forecast and retrospective discharge records share `hydrology_discharge_points`; their `product_kind` and run capability keep the semantics distinct.

Storage rules:
- stable public IDs for basin/reach;
- PostGIS reach geometry/centroid where available;
- mapping state, method, confidence and distance retained;
- provider reach/cell IDs versioned by provider/product;
- run checksum makes re-ingestion idempotent;
- forecast point uniqueness covers run + valid time + member/statistic;
- no request-coordinate/user-history columns;
- no stage column in Phase 5D tables.

Add repository integration tests and db-smoke coverage before implementation.

## Task 3 — Hydrology adapter contracts + fixtures

Add weather-worker hydrology contracts:
- `HydrologyProviderCapability`;
- reach lookup request/result;
- forecast/ensemble/retrospective/return-period bundle types;
- `HydrologyProviderAdapter`.

Add deterministic fixture adapter covering every capability used by #56.

The fixture must include:
- one exact/mapped reach;
- one ambiguous mapping case;
- one unmapped case;
- mean forecast;
- statistics/quantiles;
- ensemble members;
- retrospective simulation;
- return-period reference.

## Task 4 — GEOGLOWS/GloFAS adapters

### GEOGLOWS v2

Implement a bounded HTTP adapter for:
- nearest river ID;
- forecast;
- forecast statistics;
- forecast ensemble;
- retrospective;
- return periods.

Requirements:
- parse provider river ID as opaque text;
- retain exact product/model/run metadata available from response/request context;
- normalize all discharge values to `m3/s`;
- malformed/non-finite/negative discharge fails closed;
- retrospective remains `RETROSPECTIVE_SIMULATION`;
- return periods remain reference thresholds;
- endpoint failures map to bounded provider errors;
- fixture payloads only; no live internet dependency in tests.

### Open-Meteo Flood / GloFAS

Implement a coordinate/grid adapter where useful for fallback/model comparison.

Requirements:
- retain returned grid coordinate separately from request coordinate;
- mark mapping as model-cell association, never exact local reach unless independently mapped;
- preserve GloFAS model/version and ensemble statistic/member semantics;
- free-hosted/commercial/self-hosted policy follows existing Open-Meteo deployment policy.

## Task 5 — River reach resolver

Add repository/service for:
- nearest normalized river reaches around a WGS84 point;
- provider mapping lookup;
- mapping state: `MAPPED | AMBIGUOUS | UNMAPPED`;
- confidence score 0..1;
- mapping method and distance;
- nearby limit/radius validation.

Rules:
- geometry proximity alone cannot claim exact provider identity;
- ties/near-ties become `AMBIGUOUS`;
- absence becomes `UNMAPPED`, not a fabricated provider ID.

## Task 6 — Provider orchestration + persistence + LKG

Reuse Phase 5A provider selection for:
- `hydrology.dischargeForecast`;
- `hydrology.dischargeEnsemble`;
- `hydrology.retrospective`;
- `hydrology.returnPeriods`.

Implement:
- runtime provider repository;
- adapter factory with server-side secret resolution;
- deterministic fallback;
- health telemetry;
- successful normalized bundle persistence;
- nearest compatible last-known-good forecast fallback.

LKG compatibility requires:
- same capability;
- same normalized/provider reach mapping identity;
- bounded freshness/stale grace;
- no substitution across ambiguous/unmapped reaches.

## Task 7 — Public APIs

Public endpoints:

### `GET /v1/rivers/nearby?lat=&lon=&radiusKm=&limit=`
Returns normalized nearby river reaches with:
- basin/reach identity;
- proximity;
- mapping state/confidence/method;
- provider coverage summary.

### `GET /v1/rivers/:reachId/forecast?days=`
Returns:
- discharge forecast in `m3/s`;
- mean/statistics and ensemble context when available;
- trend relative to preceding forecast points;
- return-period discharge thresholds when available;
- source/model/run/freshness;
- mapping confidence;
- fallback/LKG state.

Optional internal/public follow-up endpoints may expose retrospective data if needed by product UX, but they must preserve simulation semantics.

Public safety tests must assert:
- no stage/water-level fields;
- no provider secret/runtime config;
- bounded 4xx validation;
- bounded 503 `HYDROLOGY_UNAVAILABLE`;
- stale LKG is explicit.

## Task 8 — Dedicated Phase 5D exit gate and documentation

Add:
- `docs/PHASE-5D-RIVER-DISCHARGE.md`;
- source-policy amendments;
- `.github/workflows/phase5d-river-discharge.yml`;
- focused Phase 5D E2E scenario.

Exit gate on fresh PostGIS:
1. migration/schema smoke;
2. shared hydrology contracts;
3. fixture + GEOGLOWS/GloFAS adapter tests;
4. reach mapping ambiguity/no-match tests;
5. repository idempotency/LKG tests;
6. public API tests;
7. focused Phase 5D E2E;
8. full API integration regression;
9. API build;
10. existing Phase 5A/5B/5C gates remain green.

Only after the final immutable head is green:
- update `PROJECT-STATUS.md` and `ROADMAP.md`;
- mark #56 complete;
- merge the PR;
- unblock #57 from the discharge dependency.

## Definition of done

Phase 5D is done when a user-selected point can resolve nearby river coverage and receive traceable discharge forecast/context from an eligible provider while the system:
- exposes mapping uncertainty;
- preserves model/member/statistic/run provenance;
- persists idempotently;
- falls back safely;
- provides retrospective/return-period context;
- and never emits fabricated stage/water-level or flood probability.
