# `@connuoc/tide-engine`

Pure deterministic astronomical tide prediction from station-specific harmonic constituents.

## Phase 1 API

```ts
predictTideLevelAt(model, atUtc): number
predictTide(request): TidePrediction
findExtrema(points, options?): TideExtremum[]
getWaterState(points, atUtc, config): WaterState
```

All calculation timestamps are explicit instants and output series/event timestamps are normalized to UTC. The request also carries an IANA `timeZone` as presentation metadata; the engine does not create ambiguous local-time timestamps.

## Harmonic convention

A model must declare its phase convention and reference epoch. The engine does **not** guess how a source table encodes phase.

```text
cosine_lag_degrees:  h(t) = Z0 + Σ Aᵢ cos(ωᵢ Δt - gᵢ)
cosine_lead_degrees: h(t) = Z0 + Σ Aᵢ cos(ωᵢ Δt + gᵢ)
```

## Extrema/state

- Sharp extrema are refined with a local three-point quadratic rather than blindly using the coarse sample timestamp.
- Flat high/low plateaus collapse to one midpoint event.
- `getWaterState` distinguishes rising/falling from near-high/near-low stand.
- Stand slope/window thresholds are explicit `WaterStateConfig`; UI code must not invent its own hidden thresholds.

## Safety/data rules

- `datumId` and unit are mandatory model metadata.
- Equal units do not imply compatible vertical datums.
- At least one constituent is required.
- No network, database, filesystem or hidden source lookup occurs during prediction.
- Output represents astronomical tide only; it does not include surge, rainfall, river discharge or upstream lag unless a separate model explicitly adds those effects.

## Validation status

Current tests use synthetic constituents/curves with mathematically known results. Production claims require trusted station fixtures and golden validation under issues #7 and #12.
