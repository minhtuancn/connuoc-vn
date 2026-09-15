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

Phase 1 is intentionally a **fixed-frequency reconstruction** engine. It does not yet derive astronomical constituent argument `V0` or nodal amplitude/phase corrections `f/u`. That additional NOAA/IHO-style capability is tracked separately in issue #23.

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
- The product must not claim NOAA-equivalent or official-station reproduction from raw harmonic constants until issue #23 is validated.

## Validation status

Phase 1 validation has three layers:

1. **Closed-form analytic golden** — `test/fixtures/tide-reference.json` defines `h(t)=2+cos(30°×hours)` with exact independently calculable values and low/high event times. This validates fixed-frequency reconstruction and extrema logic without snapshotting the implementation's own output.
2. **Independent external capability target** — the fixture pins the MIT `openwatersio/neaps` implementation and published 2019 reference vectors. Neaps performs astronomy/nodal corrections, so those vectors are deliberately marked `not-directly-comparable` rather than accepted using a loose tolerance.
3. **Deterministic benchmark** — the real 12-constituent 24h/7d/30d benchmark validates stable point counts/checksums and records an observed GitHub Actions baseline in `docs/benchmarks/TIDE-ENGINE-BASELINE.md`.

This distinction lets Phase 1 close its deterministic core correctly without overstating scientific parity with a more complete tide astronomy implementation.
