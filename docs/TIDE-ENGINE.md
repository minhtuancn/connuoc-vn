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
high-tide extrema (Phase 1 issue #6)
low-tide extrema (Phase 1 issue #6)
rising/falling/stand state (Phase 1 issue #6)
model metadata
datum/unit
quality/confidence metadata (after reference validation)
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

The initial deterministic API supports constituent-based prediction using station-specific amplitude, phase and angular speed.

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

The engine intentionally does not infer or silently translate a publisher's epoch/phase convention. Source-specific astronomy/nodal adjustments must be represented by a documented model/version or preprocessing layer before being claimed as production-equivalent to official predictions.

## Sampling semantics

- `startUtc` and `endUtc` are explicit ISO instants.
- Samples begin at `startUtc` and continue at `intervalSeconds` while timestamp `<= endUtc`.
- Output timestamps are canonical UTC ISO strings.
- Prediction requests are capped to prevent accidental unbounded memory use.

## Extrema detection

High/low events must be derived from the generated curve with robust interpolation/refinement rather than simply selecting coarse sample maxima/minima.

Tests must cover:
- semidiurnal patterns,
- diurnal patterns,
- mixed tides,
- small-amplitude/neap periods,
- day-boundary extrema,
- timezone/DST assumptions (Vietnam has no current DST, but engine should remain explicit).

## Water state

Suggested states:

```text
RISING
FALLING
NEAR_HIGH_STAND
NEAR_LOW_STAND
UNKNOWN
```

Thresholds for `stand` must be model/version controlled, not arbitrary UI logic.

## Confidence

Astronomical tide confidence is different from river water-level confidence.

Tide engine confidence may reflect:
- constituent completeness,
- station calibration quality,
- supported prediction horizon,
- datum certainty.

It must not imply weather/surge/river effects are modeled unless they actually are.

## River use

A tide prediction at an estuary/sea station must not be presented as measured river level upstream. River projection belongs to a separate lag/damping or hydrological model.

## Offline packs

Two supported strategies:
1. Ship/download harmonic constituents and calculate locally.
2. Download precomputed series where licensing/model constraints require it.

Each offline pack must include model/data version.

## Validation

Required before release:
- trusted station fixtures,
- cross-check multiple dates/seasons,
- extrema time error metrics,
- water-level error metrics,
- regression snapshots,
- numeric precision tests.

## Public API v1

```ts
predictTideLevelAt(model, atUtc): number
predictTide(request): TidePrediction
findExtrema(series): TideExtrema[]          // issue #6
getWaterState(series, at): WaterState       // issue #6
summarizePrediction(prediction): TideSummary // later consumer helper
```

Initial prediction types live in the tide package public boundary. Shared station/source/datum contracts remain in `@connuoc/shared-types`; integration can tighten branded ID typing after package build/reference strategy is stabilized.
