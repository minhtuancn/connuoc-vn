# Phase 5E implementation plan — calibrated river-rise

Date: 2026-09-18
Issue: #57
Parent: #52
Dependencies: #54, #55, #56 complete.

## Goal

Add defensible stage/river-rise outputs only for evidence-rich gauges/reaches. Phase 5E must never turn provider discharge into precise stage unless a validated local calibration is active and the request stays inside its documented domain.

## Initial maturity level

Implement Level 1 first:

- versioned piecewise-linear rating curves;
- strictly monotonic discharge/stage control points;
- mandatory vertical datum id;
- exact valid discharge domain;
- deterministic interpolation only;
- no silent extrapolation;
- reproducible calibration run metadata and metrics;
- active/rollback calibration state;
- derived stage forecast from normalized Phase 5D discharge;
- explicit INSUFFICIENT_DATA output when evidence gates fail.

Level 2 rainfall/upstream/tide regression remains represented in calibration metadata/contracts but is not promoted to production until it beats interpretable baselines on held-out events.

## Safety invariants

1. Equal units do not imply datum compatibility.
2. A curve requires a non-empty datum id and station/reach identity.
3. Control points are strictly increasing by discharge and stage.
4. Stage is emitted only inside the calibrated discharge domain.
5. Below/above-domain discharge returns INSUFFICIENT_DATA; no implicit extrapolation.
6. An active calibration must have validation metrics and artifact checksum.
7. Public responses expose calibration/model version, datum, uncertainty and limitations, but never internal DB ids/provider secrets.
8. Rollback changes the active calibration version without rewriting historical runs.
9. Provider-native discharge and derived stage remain separately typed/provenanced.

## Work order

### Task 1 — Shared contracts and deterministic rating-curve engine

Create `packages/shared-types/src/river-rise.ts` and tests.

Contracts:
- rating-curve point/version;
- validation metrics;
- calibration state;
- stage derivation result;
- river-rise trend/delta/peak-window summary;
- INSUFFICIENT_DATA reasons.

Create a small deterministic evaluator in API/domain code or a dedicated package boundary:
- exact boundary behavior;
- linear interpolation;
- datum compatibility;
- domain rejection;
- uncertainty propagation from validation RMSE.

### Task 2 — Migration 0008 and schema smoke

Add:
- optional station→river-reach link;
- `rating_curves`;
- `calibration_runs`;
- `river_stage_forecast_runs`;
- `river_stage_forecast_points`.

Constraints:
- immutable/versioned calibration identity;
- checksum format;
- valid time/domain ordering;
- metric non-negativity;
- one active rating curve per station/reach/datum/model family;
- stage unit restricted to m/cm where appropriate;
- no cascade that erases calibration history unexpectedly.

### Task 3 — Repository and rollback semantics

Implement:
- active curve lookup by public station/reach;
- calibration metrics lookup;
- activate/rollback in one transaction;
- idempotent stage forecast persistence;
- historical run reconstruction.

### Task 4 — Stage forecast service

Compose:
- normalized Phase 5D discharge forecast;
- active rating curve;
- datum/domain safety gate;
- deterministic derived stage points;
- rise direction;
- delta by supported lead window;
- peak stage/time;
- uncertainty/confidence/limitations.

If any mandatory evidence is missing, return an explicit insufficient-data result while retaining discharge context.

### Task 5 — Public API

Implement:
- `GET /v1/hydrology/stations/:stationId`;
- `GET /v1/hydrology/stations/:stationId/forecast?days=`.

The forecast response must distinguish:
- `DERIVED_STAGE`;
- discharge context;
- datum;
- calibration version;
- validation RMSE/MAE;
- domain status;
- FRESH/STALE;
- INSUFFICIENT_DATA reasons.

### Task 6 — Calibration/backtest evidence

Persist/query:
- train/validation/test periods;
- split strategy;
- sample counts;
- MAE;
- RMSE;
- optional bias/R2/NSE only when computed;
- lead-time metrics;
- season/event subsets;
- feature/model version;
- artifact SHA-256.

No complex model can be ACTIVE without an explicit baseline comparison field showing it beats the accepted baseline on the required held-out set.

### Task 7 — Dedicated Phase 5E gate

Fresh PostGIS workflow must prove:
- schema constraints;
- interpolation/boundary tests;
- incompatible datum rejection;
- extrapolation rejection;
- calibration activation/rollback;
- reproducible metrics/artifact metadata;
- API emits precise stage only when evidence passes;
- API emits INSUFFICIENT_DATA while preserving discharge context otherwise;
- full API regression/build.

## Exit criteria

#57 may close only when the dedicated Phase 5E workflow and existing CI/Public API/Admin/Ingestion/Phase 2/Phase 5A–5D regression gates are green on the same immutable head.
