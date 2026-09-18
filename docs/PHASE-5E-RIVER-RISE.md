# Phase 5E — Gauge Calibration, Rating Curves and River-Rise Forecasting

Status: implementation/verification handoff for issue #57.

Phase 5E is the first Con Nước Việt phase allowed to emit a precise future river-stage value, but only when explicit local evidence gates pass. It consumes the normalized discharge foundation from Phase 5D and does not change the meaning of provider discharge.

## Scientific safety boundary

A precise derived stage is allowed only when all of the following are true:

- the river reach has exactly one active calibrated gauge selected by a current `MAPPED` gauge↔reach link;
- the gauge has a non-empty datum;
- an active calibration run exists for that same station, reach and datum;
- held-out validation/test MAE and RMSE exist;
- the held-out test RMSE is at or below the calibration's accepted RMSE bound;
- at least one held-out TEST lead-time metric exists;
- an active rating curve exists for the same station/reach/datum;
- the rating-curve checksum still matches its immutable scientific points;
- requested discharge lies inside the validated curve domain.

If any evidence requirement fails, public stage output is not invented. The API keeps Phase 5D discharge context and returns `INSUFFICIENT_DATA`.

Numerical flood probability and official warning interpretation remain out of scope.

## Initial model level

The production baseline is intentionally interpretable:

- method: `PIECEWISE_LINEAR`;
- discharge unit: `m3/s`;
- stage unit: `m`;
- stage datum: mandatory;
- validated discharge domain: closed interval from first to last curve point;
- extrapolation policy: `REJECT`;
- discharge points: strictly increasing;
- stage points: non-decreasing.

A future regression/ML model must beat the persistence/interpretable baseline on held-out evidence before production promotion.

## Shared contracts

`packages/shared-types/src/calibration.ts` defines:

- calibration periods and MAE/RMSE metrics;
- lead/season/event metric breakdowns;
- calibration lifecycle;
- rating-curve points/model;
- evidence-gated rating-curve evaluator;
- stage derivation states;
- stage forecast points;
- persistence baseline backtesting.

Important derivation states:

- `AVAILABLE`: precise stage exists with datum and validated evidence;
- `OUTSIDE_CALIBRATED_DOMAIN`: stage is null; no extrapolation;
- `DATUM_MISMATCH`: stage is null;
- overall stage evidence: `AVAILABLE | PARTIAL | INSUFFICIENT_DATA`.

## Database model

Migration `0008_stage_calibration.sql` adds:

### `gauge_reach_links`

Stores station↔normalized-reach association with:

- `MAPPED | AMBIGUOUS`;
- method;
- confidence/distance;
- effective range.

The public stage service fails closed when a reach has multiple current calibrated gauge candidates and no explicit selection rule.

### `calibration_runs`

Stores reproducible calibration evidence:

- station/reach/datum;
- model kind/version;
- feature version;
- train/validation/test periods;
- split strategy;
- validation/test MAE/RMSE/sample counts;
- accepted test RMSE bound;
- source summary;
- artifact SHA-256 and optional internal URI;
- lifecycle state;
- validation/activation/rollback timestamps.

Active calibrations require held-out evidence at the database and application layers.

### `calibration_metric_breakdowns`

Stores queryable validation/test metrics by:

- lead time;
- season;
- event subset.

At least one of those dimensions must identify each breakdown row.

### `rating_curves` + `rating_curve_points`

Stores versioned datum-aware curves with:

- exact domain;
- checksum;
- lifecycle status;
- effective range;
- immutable scientific points after activation.

### `stage_forecast_runs` + `stage_forecast_points`

Stores derived stage forecasts with immutable lineage to:

- normalized reach;
- gauge station;
- calibration run;
- rating curve;
- exact Phase 5D hydrology forecast run;
- datum;
- evidence status;
- held-out MAE/RMSE;
- limitations;
- derivation state per discharge record.

The stage run checksum makes repeated persistence idempotent for the same scientific inputs.

## Activation and rollback

Calibration and curve records must first be stored as candidates.

Activation is transactional and verifies:

1. gauge datum = calibration datum = curve datum;
2. current gauge↔reach link is `MAPPED`;
3. validation/test metrics exist;
4. accepted RMSE bound exists;
5. test RMSE does not exceed the accepted bound;
6. TEST lead-time metrics exist;
7. curve checksum matches its stored points.

On a normal upgrade:

- prior curve → `SUPERSEDED`;
- prior calibration → `SUPERSEDED`;
- target curve/calibration → `ACTIVE`.

On rollback:

- current calibration → `ROLLED_BACK`;
- current curve → `SUPERSEDED`;
- previously validated target version becomes `ACTIVE`.

Validated calibration scientific fields and non-candidate curve scientific fields/points are protected by database triggers.

## Baseline backtesting

Persistence baseline behavior is available before more complex modelling:

- forecast stage = latest baseline stage;
- MAE/RMSE are computed on held-out truth;
- lead-time breakdown is explicit;
- datum mixing is rejected or excluded according to the evaluator contract;
- no metric is invented for an empty compatible truth set.

## Stage forecast runtime

`StageForecastService` performs:

1. obtain the Phase 5D discharge forecast;
2. keep the full discharge response for public context;
3. resolve exactly one active calibrated curve for the reach;
4. verify held-out calibration evidence;
5. use only `FORECAST_MEAN` discharge points for initial stage derivation;
6. resolve the exact persisted hydrology run lineage;
7. evaluate each mean discharge through the active curve;
8. never extrapolate outside the calibrated domain;
9. use latest GOOD same-datum observed gauge stage as the preferred rise baseline;
10. otherwise use the first available stage forecast and emit a limitation;
11. compute direction, delta, per-lead deltas and peak;
12. persist evidence-rich stage output idempotently.

Ensemble/statistical discharge remains visible in discharge context but is not silently transformed into stage uncertainty in this initial level.

## Public APIs

All routes use the global `/v1` prefix.

### Stage forecast

`GET /v1/rivers/:reachId/stage-forecast?days=`

Returns:

- the Phase 5D discharge forecast context;
- stage evidence state;
- station/datum;
- precise stage points only where evidence permits;
- rise/fall/stable direction;
- baseline and deltas;
- peak stage/time;
- curve version/domain/extrapolation policy;
- calibration version/source ids/test period/test MAE/RMSE;
- limitations.

Examples of limitations include:

- `NO_ACTIVE_VALIDATED_CALIBRATION`;
- `CALIBRATION_HELD_OUT_EVIDENCE_UNAVAILABLE`;
- `HYDROLOGY_RUN_LINEAGE_UNAVAILABLE`;
- `DISCHARGE_FORECAST_MEAN_UNAVAILABLE`;
- `SOME_DISCHARGE_OUTSIDE_CALIBRATED_DOMAIN`;
- `ALL_FORECAST_DISCHARGE_OUTSIDE_CALIBRATED_DOMAIN`;
- `OBSERVED_STAGE_BASELINE_UNAVAILABLE`.

### Station calibration evidence

`GET /v1/hydrology/stations/:stationId/calibration`

Returns public evidence for the active calibration:

- reach;
- datum;
- curve version/domain/method;
- calibration/model/feature version;
- source ids;
- held-out test period and metrics;
- accepted RMSE bound.

It never returns internal artifact URI, provider credential/configuration or flood probability.

## Verification

Dedicated workflow: `.github/workflows/phase5e-river-rise.yml`.

The gate runs on a fresh PostGIS database and verifies:

1. migration/schema constraints;
2. shared contracts and rating-curve evaluator;
3. API type/unit tests;
4. calibration repository activation/upgrade/rollback;
5. public stage integration scenarios;
6. full API integration regression;
7. API build.

The public integration scenarios verify:

- `AVAILABLE` for fully in-domain discharge;
- `PARTIAL` when some discharge points fall outside the validated domain;
- exact out-of-domain points have `stageM=null` and `extrapolated=false`;
- `INSUFFICIENT_DATA` preserves discharge context when no active calibration exists;
- calibration evidence is queryable without artifact/provider secret leakage;
- derived stage runs persist with exact hydrology lineage.

## Handoff to Phase 5F

Phase 5F may consume:

- calibrated stage/rise evidence;
- discharge forecast/ensemble;
- rainfall accumulation/forecast;
- return-period flow;
- model uncertainty and limitations.

Phase 5F must still independently calibrate any numerical flood probability. A precise stage forecast does not by itself justify a flood probability or official warning.
