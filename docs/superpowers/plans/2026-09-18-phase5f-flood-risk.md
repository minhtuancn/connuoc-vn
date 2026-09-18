# Phase 5F — Flood-Risk Engine & Hazard/Susceptibility Baselines

Date: 2026-09-18
Issue: #58
Parent: #52
Depends on: completed #55, #56 and #57

## Objective

Create a deterministic, explainable flood-risk decision-support layer that combines normalized rainfall, river discharge/return-period context and evidence-gated local stage/rise without claiming street-level inundation certainty.

Phase 5F v1 is primarily a **risk-band engine**, not a probability model.

## Locked scientific/safety rules

1. Numerical flood probability is absent unless a separately versioned probability calibration has an explicit event definition, held-out validation period and accepted metrics.
2. Rainfall and discharge are mandatory v1 hydrologic inputs.
3. A stale mandatory input cannot produce a LIVE/FRESH risk assessment. It produces `INSUFFICIENT_DATA`.
4. Missing mandatory input produces `INSUFFICIENT_DATA`.
5. Stage/river-rise is optional enrichment. If unavailable, assessment may still run from rain+discharge but confidence is downgraded and a limitation is emitted.
6. Provider disagreement or ambiguous/conflicting evidence lowers confidence; it must not be averaged away silently.
7. Coarse susceptibility/hazard layers always retain spatial resolution and limitations; they are never described as official parcel/street inundation maps.
8. Local impact/exposure remains `NOT_ASSESSED` unless an approved exposure dataset is explicitly supplied.
9. Official warnings are not converted into model probability or hidden inside risk scoring. Phase 5G owns authoritative alerts.
10. Identical versioned inputs + rule configuration produce byte-stable deterministic assessment semantics.

## Task 1 — Shared flood-risk contracts + pure deterministic engine

Add contracts:

- FloodRiskLevel: LOW | MODERATE | HIGH | VERY_HIGH | EXTREME | INSUFFICIENT_DATA
- FloodRiskConfidence: LOW | MEDIUM | HIGH
- InputFreshness: FRESH | STALE | UNAVAILABLE
- FloodRiskDriver
- HydrologicHazardAssessment
- SusceptibilityAssessment
- LocalImpactAssessment
- FloodRiskAssessment
- FloodRiskRuleConfig
- ProbabilityCalibrationEvidence

V1 input features:

### Mandatory rainfall
- 24h accumulation mm;
- 72h accumulation mm;
- coverage/completeness;
- freshness.

### Mandatory river discharge
- forecast mean;
- return-period thresholds where available;
- discharge trend;
- freshness.

### Optional calibrated stage/rise
- stage evidence state;
- delta/rise direction;
- peak stage;
- held-out RMSE;
- freshness inherited from discharge;
- limitations.

### Optional susceptibility baseline
- band;
- spatial resolution;
- source;
- limitations.

The engine emits explicit drivers/reasons/limitations and source summary.

## Task 2 — Versioned deterministic configuration

Persist/reuse a versioned rule config instead of hard-coding “truth”.

Initial config expresses transparent thresholds, e.g.:

- rainfall 24h/72h bands;
- discharge ratio/return-period band rules;
- rapid-rise delta bands;
- driver weights/severity floor;
- source-disagreement confidence penalty;
- missing optional-stage penalty;
- susceptibility adjustment.

Threshold values are configuration, not universal hydrologic claims. Public output includes `modelVersion`/config version.

## Task 3 — Probability calibration gate

Probability remains absent by default.

A probability range may only be emitted when a calibration record has:

- explicit eventDefinition;
- train/validation/test periods;
- held-out event labels;
- metric names/values (at least Brier score and sample count);
- artifact checksum;
- deployment status ACTIVE;
- accepted metric bound;
- matching model/config version and spatial scope.

V1 can store/evaluate this gate without requiring a production probability model.

## Task 4 — Persistence

Migration `0009_flood_risk.sql`:

- flood_risk_rule_configs
- flood_probability_calibrations
- flood_risk_runs
- flood_risk_assessments
- flood_risk_driver_evidence
- flood_event_labels / backtest metadata hooks

Requirements:
- deterministic input checksum/idempotency;
- validFrom/validTo;
- freshness state;
- source/provenance summary;
- exact rainfall/hydrology/stage lineage where available;
- probability columns nullable and DB-constrained to require active calibration reference;
- coarse susceptibility metadata includes representation/resolution;
- impact state separated from hazard/susceptibility.

## Task 5 — Input assembler/service

Compose existing Phase 5C/D/E services/repositories:

- rainfall summary 24h + 72h;
- river discharge forecast + return periods;
- stage forecast if calibrated;
- susceptibility baseline if configured.

Important:
- do not call stage as mandatory;
- do not treat return-period threshold as probability;
- reject stale mandatory rain/discharge;
- preserve source freshness and limitations.

## Task 6 — Public APIs

Initial API:

### Reach
`GET /v1/flood-risk?reachId=&days=`

Returns:
- riskLevel;
- confidence;
- hydrologic hazard;
- susceptibility;
- local impact state;
- reasons;
- drivers;
- freshness/validity;
- provenance/source summary;
- model/config version;
- limitations;
- probabilityRange only when probability calibration gate passes.

### Point
`GET /v1/flood-risk?lat=&lon=&days=`

Resolve nearby reach coverage. If reach association is ambiguous/missing, return `INSUFFICIENT_DATA` with explanation rather than guessing.

### Basin
Follow-up in same phase if normalized basin aggregation inputs are sufficient; otherwise provide explicit unsupported/insufficient-data response without fabricating point precision.

## Task 7 — Backtesting hooks

Define flood event labels before any production probability promotion:

- eventDefinition;
- spatial scope;
- label source;
- event start/end;
- positive/negative label;
- source rights/provenance.

Backtest report contract includes:
- period;
- event count;
- confusion matrix / precision / recall for bands if appropriate;
- Brier score only for calibrated probability;
- version/config checksum;
- limitations.

## Task 8 — Phase 5F exit gate

Dedicated workflow on fresh PostGIS verifies:

1. schema/migration;
2. pure deterministic risk transitions;
3. stale/missing mandatory inputs;
4. stage unavailable confidence downgrade;
5. provider/source disagreement confidence downgrade;
6. probability absent without calibration;
7. probability present only with valid active calibration evidence;
8. deterministic idempotent persistence;
9. public reach/point API explanations and freshness;
10. Phase 5C/D/E regressions remain green;
11. full API integration + build.

## Definition of done

Phase 5F v1 is complete when the system can produce a reproducible, explainable flood-risk band from fresh rainfall + discharge evidence, enrich it with calibrated stage/susceptibility where available, fail closed on missing/stale mandatory inputs, preserve hazard/susceptibility/impact distinctions, and never expose numerical probability without a dedicated calibration gate.
