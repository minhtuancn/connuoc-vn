# Phase 5E — Gauge Calibration & River-Rise Forecasting

Status: implementation/verification for issue #57.

Phase 5E converts **normalized discharge forecasts** from Phase 5D into
**derived stage forecasts only where local evidence permits it**. It does not
assume that discharge is interchangeable with river level.

## Safety contract

An exact stage value may be emitted only when all of the following are true:

1. a gauge station has a current, explicit `MAPPED` association to the
   normalized river reach;
2. the gauge has a non-empty datum id;
3. the active rating curve uses that same datum;
4. the calibration run and curve identify the same station/reach/datum;
5. the calibration artifact has held-out validation/test evidence;
6. the active run has an accepted held-out RMSE threshold and actual test RMSE
   does not exceed it;
7. lead-time test metrics exist;
8. the rating-curve checksum still matches its immutable point set;
9. the input discharge is inside the validated curve domain;
10. the source hydrology run can be traced to the persisted Phase 5D forecast.

If any mandatory evidence is missing, the stage layer returns
`INSUFFICIENT_DATA` rather than fabricating a level.

Phase 5E does **not**:
- infer a gauge datum from station location/name;
- extrapolate beyond the validated discharge domain;
- translate return-period flow into flood probability;
- turn model retrospective discharge into observed stage;
- issue an official flood warning.

## Migration 0008

`infrastructure/database/migrations/0008_stage_calibration.sql` introduces:

- `gauge_reach_links`
- `calibration_runs`
- `calibration_metric_breakdowns`
- `rating_curves`
- `rating_curve_points`
- `stage_forecast_runs`
- `stage_forecast_points`

### Gauge/reach association

A gauge→reach link has:
- state: `MAPPED | AMBIGUOUS`;
- method;
- confidence;
- optional distance;
- effective time range.

A station may have only one current `MAPPED` reach. Ambiguous associations are
not eligible for stage deployment.

### Calibration evidence

A calibration run stores:
- station/reach/datum identity;
- model kind/version;
- feature version;
- split strategy;
- train/validation/test periods;
- overall validation/test MAE and RMSE;
- accepted test RMSE threshold;
- exact source ids;
- lead/season/event metric breakdowns;
- artifact checksum and optional artifact location;
- deployment status and timestamps.

An `ACTIVE` run requires held-out test evidence and
`test_rmse_m <= accepted_test_rmse_m`.

### Rating curves

The baseline production curve is:
- piecewise-linear;
- monotonic non-decreasing stage vs discharge;
- explicit valid discharge domain;
- stage unit `m`;
- discharge unit `m3/s`;
- exact datum id;
- extrapolation policy `REJECT`.

The first and last curve points define the exact validated Q domain.

Once a calibration is validated or a curve is activated, scientific fields are
immutable. New science is a new version; rollback changes deployment status,
not historical model contents.

## Baselines and validation

Phase 5E intentionally starts with simple, auditable baselines.

### Persistence baseline

The persistence backtest predicts that future stage equals the origin stage.
It is evaluated only across compatible datum observations and records:

- overall MAE/RMSE;
- MAE/RMSE by forecast lead.

This is a minimum comparator for any later statistical/ML model.

### Rating-curve baseline

The first discharge→stage production path uses a versioned piecewise-linear
rating curve.

Complex models are not promoted merely because they exist. A later model must
have reproducible feature/model versions, held-out evaluation and evidence that
it improves materially over the simpler baseline without violating datum/domain
constraints.

## Activation and rollback

`CalibrationRepository` is the canonical deployment boundary.

Activation is transactional and verifies:
- current gauge→reach mapping;
- gauge/curve/calibration datum equality;
- validated calibration evidence;
- accepted held-out RMSE;
- lead-time evidence;
- curve point checksum.

Activating a new version supersedes the prior active version.

Rollback activates an earlier validated version transactionally and marks the
replaced active calibration as rolled back. Scientific fields of the previous
artifact remain immutable.

## Stage derivation

`evaluateRatingCurve` supports three outcomes:

- `AVAILABLE`: Q is within the validated domain and datum matches;
- `OUTSIDE_CALIBRATED_DOMAIN`: stage is `null`;
- `DATUM_MISMATCH`: stage is `null`.

There is no silent extrapolation.

Each derived point retains:
- source discharge record id;
- valid time;
- lead seconds;
- discharge;
- stage when available;
- datum;
- curve id/version;
- calibration run id;
- held-out test RMSE;
- `extrapolated=false`.

## Stage forecast persistence

A persisted stage run references:
- normalized river reach;
- gauge station;
- calibration run;
- rating curve;
- exact Phase 5D hydrology forecast run.

This makes the public stage output reproducible back to the provider discharge
forecast and calibration artifact.

Only `AVAILABLE` or `PARTIAL` stage forecasts are persisted. If every
discharge point is outside the calibrated domain, the request returns
`INSUFFICIENT_DATA` and no false exact stage is stored.

## Observed-stage baseline

When a recent gauge observation exists with:
- the same station;
- exact datum equality;
- `quality_state=GOOD`;
- timestamp not later than the request time;

it is normalized to metres and used as the stage-change baseline.

When no compatible observed stage is available but calibrated forecast points
are available, the first derived forecast point may be used as an explicitly
labelled `FIRST_FORECAST` baseline. The response carries that limitation and
does not label it observed.

## Public APIs

### River stage forecast

`GET /v1/rivers/:reachId/stage-forecast?days=...`

Returns:
- the Phase 5D discharge response unchanged as context;
- stage evidence status:
  `AVAILABLE | PARTIAL | INSUFFICIENT_DATA`;
- gauge and datum identity when known;
- baseline type;
- rise/fall direction and deltas;
- peak derived stage;
- rating-curve public identity/domain;
- calibration public identity and held-out metrics;
- point-level derivation status;
- explicit limitations.

The API never exposes:
- provider secret references;
- provider endpoints/keys;
- calibration artifact URI;
- internal database ids;
- invented flood probability.

### Gauge calibration evidence

`GET /v1/hydrology/stations/:stationId/calibration`

Returns the currently active public calibration evidence, or
`INSUFFICIENT_DATA` when the station has no safe active calibration.

## Evidence states

### AVAILABLE

All discharge forecast points considered by the stage path are in-domain and
the calibration evidence gate is satisfied.

### PARTIAL

At least one point can be derived safely, but one or more points are outside
the validated rating-curve domain. Those points have `stageM=null`.

### INSUFFICIENT_DATA

Examples:
- no active validated calibration;
- ambiguous/missing gauge→reach link;
- gauge/curve datum mismatch;
- held-out evidence unavailable;
- no discharge forecast mean;
- hydrology-run lineage unavailable;
- all forecast discharge points lie outside the calibrated domain.

## Dedicated verification

Workflow: `.github/workflows/phase5e-river-rise.yml`.

The exit gate runs on a fresh PostGIS database and verifies:

1. migrations and schema constraints;
2. rating-curve interpolation, exact boundaries, datum mismatch and
   no-extrapolation;
3. persistence baseline MAE/RMSE;
4. calibration evidence contracts;
5. transactional activation/supersede/rollback;
6. calibration and curve checksum guards;
7. public stage API:
   - in-domain exact stage;
   - partial out-of-domain forecast;
   - uncalibrated reach -> `INSUFFICIENT_DATA`;
8. full API integration regressions;
9. API build.

## Handoff to Phase 5F

Phase 5F may consume stage output only with the evidence status and uncertainty
metadata intact.

A Phase 5E stage forecast is still **not** an official flood warning and does
not by itself establish flood probability or inundation extent.
