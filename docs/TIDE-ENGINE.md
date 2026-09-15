# Tide Engine

## Purpose

`packages/tide-engine` cung cấp dự báo thủy triều thiên văn deterministic, offline-capable và có thể kiểm chứng độc lập với UI/database/network.

## Inputs

```text
stationId
coordinates/timezone metadata
datum + unit
harmonic constituents
reference epoch + phase convention
prediction range
sampling interval
model/version metadata
```

## Outputs

```text
UTC time series
high-tide extrema
low-tide extrema
rising/falling/stand state
model metadata
datum/unit
```

## Design rules

- Pure functions where practical.
- UTC internally; local timezone is explicit boundary metadata, never guessed.
- No hidden network access.
- Explicit units.
- Explicit datum.
- Explicit phase convention and reference epoch.
- Reproducible output from same inputs/version.
- Numerical tolerance documented in tests.

## Harmonic model v1

The Phase 1 deterministic API supports **fixed-frequency constituent reconstruction** using station-specific amplitude, phase and angular speed.

A source adapter must normalize source constituents into one of these explicit conventions:

```text
cosine_lag_degrees:
h(t) = Z0 + Σ Aᵢ cos(ωᵢ Δt - gᵢ)

cosine_lead_degrees:
h(t) = Z0 + Σ Aᵢ cos(ωᵢ Δt + gᵢ)
```

Where:
- `Z0` is the datum-relative mean/offset in the model unit,
- `Aᵢ` is non-negative amplitude,
- `ωᵢ` is degrees per mean solar hour,
- `gᵢ` is normalized to `[0, 360)`,
- `Δt` is elapsed mean solar hours from `referenceEpochUtc`.

The engine intentionally does not infer or silently translate a publisher's epoch/phase convention.

### Scientific capability boundary

Many NOAA/IHO-style predictors calculate astronomical constituent argument `V0` and time-varying nodal corrections `f/u`. The Phase 1 fixed-frequency core does **not** implement those corrections. Independent review against the MIT `openwatersio/neaps` predictor confirmed that its published NOAA-comparison path includes these astronomy/nodal steps.

Therefore:

- Phase 1 can validate fixed-frequency harmonic reconstruction and extrema/state logic exactly.
- Raw NOAA/other harmonic constants must not be described as reproduced with official-prediction parity merely by loading amplitude/phase/speed into this v1 formula.
- The external Neaps reference vectors are pinned in the fixture as a capability target and explicitly marked `not-directly-comparable` to the Phase 1 model.
- Astronomy/nodal parity is tracked in issue #23 and must pass independent external level/time error metrics before any NOAA-equivalent claim.

## Sampling semantics

- `startUtc` and `endUtc` are explicit ISO instants.
- Samples begin at `startUtc` and continue at `intervalSeconds` while timestamp `<= endUtc`.
- Output timestamps are canonical UTC ISO strings.
- Prediction requests are capped to prevent accidental unbounded memory use.

## Extrema detection

High/low events are derived from the generated curve rather than simply selecting coarse sample maxima/minima.

Phase 1 behavior:
- sharp extrema use local three-point quadratic refinement,
- flat high/low plateaus collapse to one midpoint event,
- non-monotonic/invalid series are rejected,
- event timestamps remain explicit UTC instants.

Tests cover synthetic semidiurnal patterns, refinement, plateaus and state near extrema.

## Water state

```text
RISING
FALLING
NEAR_HIGH_STAND
NEAR_LOW_STAND
UNKNOWN
```

Thresholds for `stand` are explicit `WaterStateConfig`; they are model/caller policy, never hidden UI logic.

## Confidence

Astronomical tide confidence is different from river water-level confidence.

Tide confidence may eventually reflect constituent completeness, station calibration quality, prediction horizon and datum certainty. It must never imply weather/surge/river effects are modeled unless they actually are.

## River use

A tide prediction at an estuary/sea station must not be presented as measured river level upstream. River projection belongs to a separate lag/damping or hydrological model.

## Offline packs

Two supported strategies:
1. Ship/download compatible harmonic model data and calculate locally.
2. Download precomputed series where licensing/model constraints require it.

Each offline pack must include model/data version and datum metadata.

## Phase 1 validation

Validation artifacts are version-controlled and run without network access:

- `packages/tide-engine/test/fixtures/tide-reference.json` — closed-form analytic golden plus pinned Neaps external reference metadata/capability boundary.
- `packages/tide-engine/test/reference.test.ts` — exact level and high/low event checks plus assertions preventing accidental astronomy/nodal parity claims.
- Existing prediction/extrema/state unit tests — phase conventions, time ranges, invalid input, refinement and plateaus.
- `packages/tide-engine/scripts/benchmark.mjs` — deterministic 24h/7d/30d, 10-minute sampling benchmark with repeated-run checksum checks.
- `docs/benchmarks/TIDE-ENGINE-BASELINE.md` — observed GitHub Actions baseline; not a machine-independent SLA.

## Public API v1

```ts
predictTideLevelAt(model, atUtc): number
predictTide(request): TidePrediction
findExtrema(points, options?): TideExtremum[]
getWaterState(points, atUtc, config): WaterState
```

Initial prediction types live in the tide package public boundary. Shared station/source/datum contracts remain in `@connuoc/shared-types`.
