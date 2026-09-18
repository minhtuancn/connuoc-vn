# Phase 5E — Gauge Calibration, Rating Curves and River-Rise Forecasting

Date: 2026-09-18
Issue: #57
Parent: #52
Depends on: completed #54, #55 and #56

## Objective

Allow precise future river stage only at evidence-rich stations/reaches where Con Nước Việt can prove one of these paths:

1. provider-native stage with explicit datum and station semantics; or
2. a validated, versioned local rating curve converting discharge to stage inside a documented domain; or
3. a locally calibrated stage forecast model with held-out validation evidence.

This implementation starts with the interpretable Level-1 baseline: versioned piecewise-linear rating curves plus persistence backtesting. More complex regression/ML remains blocked until it beats these baselines on held-out data.

## Locked safety rules

1. Discharge is never silently presented as stage.
2. Stage always carries a non-empty datum id.
3. Rating-curve conversion is allowed only inside the validated discharge domain.
4. Extrapolation policy defaults to REJECT. No implicit extrapolation.
5. Rating-curve points must be strictly increasing in discharge and non-decreasing in stage.
6. A curve must be linked to a calibration run whose deployment status is ACTIVE before public derived stage can use it.
7. A calibration run stores exact train/validation/test periods, source/feature/model versions, split strategy, metrics and artifact SHA-256.
8. Held-out MAE and RMSE are mandatory for a deployable stage-capable calibration.
9. Public stage output includes curve/calibration version, datum, uncertainty/error evidence and limitations.
10. If evidence gate fails, API returns discharge/trend context with stage state INSUFFICIENT_DATA instead of fabricating a number.
11. Rollback means atomically activating a previously validated calibration/curve version while retiring the current active version.
12. Numerical flood probability remains out of scope.

## Task 0 — Clean test-workflow credential warning

Replace hard-coded Postgres test password in the Phase 5D workflow with a per-run non-secret expression and keep DATABASE_URL consistent. This is a test-only credential but should not trigger secret scanners.

## Task 1 — Shared calibration/stage contracts and evaluator

TDD first.

Add shared contracts for:

- StageDatumRef
- RatingCurvePoint
- RatingCurveModel
- CalibrationMetrics
- CalibrationRunSummary
- StageDerivationResult
- RiverRiseForecast

Initial rating-curve implementation:

- method: PIECEWISE_LINEAR;
- stage unit: m;
- discharge unit: m3/s;
- explicit validDischargeMinCms / validDischargeMaxCms;
- explicit datumId;
- interpolation only between neighboring validated points;
- boundary values allowed;
- outside-domain requests return OUTSIDE_CALIBRATED_DOMAIN, not a stage number;
- incompatible expected datum returns DATUM_MISMATCH;
- invalid/non-monotonic curves are rejected.

River-rise output contains:

- current/baseline stage where available;
- forecast stage points;
- direction: RISING | FALLING | STABLE | UNKNOWN;
- delta over configured horizons;
- peak stage + peak valid time;
- datum;
- calibration/curve versions;
- evidence confidence;
- limitations.

## Task 2 — Migration 0008 calibration schema

Add:

### gauge_reach_links
- station_id;
- river_reach_id;
- confidence/method;
- effective range;
- only one current selected link per station/reach scope.

### calibration_runs
- public id/version;
- station/reach;
- model kind;
- feature/model versions;
- train/validation/test periods;
- split strategy;
- source summary JSON;
- metrics JSON plus explicit MAE/RMSE columns;
- artifact SHA-256 / URI;
- deployment status: CANDIDATE | ACTIVE | ROLLED_BACK | REJECTED;
- created/validated/activated timestamps;
- immutable scientific fields after validation/activation.

### rating_curves
- station/reach;
- calibration_run_id;
- curve version;
- datum id;
- method PIECEWISE_LINEAR;
- valid discharge min/max;
- extrapolation policy REJECT;
- effective range;
- status CANDIDATE | ACTIVE | SUPERSEDED | REJECTED;
- checksum.

### rating_curve_points
- point order;
- discharge m3/s;
- stage m;
- unique ordering and discharge.

### stage_forecast_runs / stage_forecast_points
- input hydrology run;
- rating curve/calibration version;
- generated/valid times;
- derived stage m + datum;
- uncertainty/error metadata;
- provenance checksum;
- idempotency.

Schema must prevent empty datum, negative discharge, malformed checksum and multiple active curves for the same station/reach+datum.

## Task 3 — Repository and rating-curve activation/rollback

Implement repository methods:

- saveCalibrationRun
- saveRatingCurve
- activateCalibration
- activateRatingCurve
- rollbackToCalibrationVersion
- findActiveCurveForReach
- findCalibrationMetrics
- saveDerivedStageForecast
- findLatestDerivedStageForecast

Activation gate:

- validation/test MAE and RMSE must exist and be finite/non-negative;
- calibration must have a test period;
- rating curve checksum matches stored points;
- curve datum matches target station datum;
- curve domain matches min/max point bounds;
- activation is transactional;
- prior active curve becomes SUPERSEDED, not deleted.

Rollback is transactional and audited in metadata/state.

## Task 4 — Persistence baseline/backtesting

Implement a deterministic persistence baseline from observed gauge stage:

- forecast H(t+k) = latest observed stage;
- evaluate only against held-out observed stage with same datum;
- report MAE/RMSE/count by lead bucket;
- no interpolation across incompatible datum;
- no metric when truth count is zero.

This baseline becomes the minimum benchmark future regression/ML must beat.

## Task 5 — Derived stage service

For a normalized river reach:

1. get Phase 5D discharge forecast;
2. resolve active station/reach link;
3. resolve active validated rating curve;
4. verify datum and curve domain for each discharge point;
5. derive stage only for in-domain points;
6. if any requested precise stage would require extrapolation, mark that point unavailable with explicit limitation;
7. compute rise/fall direction, deltas and peak from available stage points;
8. persist idempotently.

Evidence state:

- AVAILABLE: active validated curve + compatible datum + in-domain forecast points;
- PARTIAL: some points outside domain or missing;
- INSUFFICIENT_DATA: no active validated curve, datum mismatch, no linked station or no usable discharge forecast.

## Task 6 — Public APIs

Add:

GET /v1/hydrology/stations/:stationId/calibration
- active curve/calibration metadata;
- datum;
- valid discharge domain;
- MAE/RMSE/test period;
- no internal artifact URI/secret.

GET /v1/rivers/:reachId/stage-forecast?days=
- always returns discharge context when Phase 5D can provide it;
- stage.status = AVAILABLE | PARTIAL | INSUFFICIENT_DATA;
- precise stage only when evidence gate passes;
- datum mandatory on every stage value;
- limitations[] explain unavailable/out-of-domain cases;
- curve/calibration versions + MAE/RMSE surfaced;
- no flood probability.

Optional admin mutation APIs are deferred unless needed by acceptance; repository activation/rollback is covered by integration tests.

## Task 7 — Phase 5E exit gate

Dedicated workflow proves on fresh PostGIS:

1. migrations/schema smoke;
2. shared calibration/rating-curve tests;
3. boundary/interpolation/datum/extrapolation tests;
4. repository version/activation/rollback tests;
5. persistence baseline MAE/RMSE tests;
6. public API AVAILABLE/PARTIAL/INSUFFICIENT_DATA behavior;
7. no stage emitted without datum/evidence;
8. full API integration regression;
9. Phase 5D regression remains green;
10. API build.

## Definition of done

Phase 5E is complete when a validated test fixture can:

- link a gauge to a normalized reach;
- activate a reproducible calibration run and rating curve;
- convert in-domain discharge forecast to stage with explicit datum;
- reject extrapolation and datum mismatch;
- expose held-out MAE/RMSE and curve domain;
- compute river-rise direction/deltas/peak;
- persist forecasts idempotently;
- rollback to a previous validated version;
- return INSUFFICIENT_DATA instead of stage when any evidence gate fails.
