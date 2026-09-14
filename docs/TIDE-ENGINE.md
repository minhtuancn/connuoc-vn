# Tide Engine

## Purpose

`packages/tide-engine` cung cấp dự báo thủy triều thiên văn deterministic, offline-capable và có thể kiểm chứng độc lập với UI/database/network.

## Inputs

```text
stationId
coordinates
timezone
datum
harmonic constituents
prediction range
sampling interval
model/version metadata
```

## Outputs

```text
time series
high-tide extrema
low-tide extrema
rising/falling/stand state
model metadata
datum/unit
quality/confidence metadata
```

## Design rules

- Pure functions where practical.
- UTC internally; convert only at boundaries.
- No hidden network access.
- Explicit units.
- Explicit datum.
- Reproducible output from same inputs/version.
- Numerical tolerance documented in tests.

## Harmonic model

Engine should support constituent-based prediction using station-specific amplitude and phase parameters. Implementation details must be validated against trusted reference fixtures before production use.

Do not hardcode a single regional phase convention without documenting the epoch/time standard used by source constituents.

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
1. Ship/ download harmonic constituents and calculate locally.
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

## Public API sketch

```ts
predictTide(input): TidePrediction
findExtrema(series): TideExtrema[]
getWaterState(series, at): WaterState
summarizePrediction(prediction): TideSummary
```

Final types belong in `packages/shared-types` or the tide package public boundary after ADR review.
