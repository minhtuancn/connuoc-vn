# `@connuoc/tide-engine`

Pure deterministic astronomical tide prediction from station-specific harmonic constituents.

## Phase 1 API

```ts
predictTideLevelAt(model, atUtc): number
predictTide(request): TidePrediction
```

All calculation timestamps are explicit instants and output series timestamps are normalized to UTC. The request also carries an IANA `timeZone` as presentation metadata; the engine does not create ambiguous local-time timestamps.

## Harmonic convention

A model must declare its phase convention and reference epoch. The engine does **not** guess how a source table encodes phase.

For `cosine_lag_degrees`:

```text
h(t) = Z0 + Σ Aᵢ cos(ωᵢ Δt - gᵢ)
```

For `cosine_lead_degrees`:

```text
h(t) = Z0 + Σ Aᵢ cos(ωᵢ Δt + gᵢ)
```

where speeds are degrees per mean solar hour and phases are normalized to `[0, 360)`.

## Safety/data rules

- `datumId` and unit are mandatory model metadata.
- Equal units do not imply compatible vertical datums.
- At least one constituent is required.
- No network, database, filesystem or hidden source lookup occurs during prediction.
- Output represents astronomical tide only; it does not include surge, rainfall, river discharge or upstream lag unless a separate model explicitly adds those effects.

## Validation status

Current unit tests use synthetic constituents with mathematically known results. Production claims require trusted station fixtures and golden validation under issues #7 and #12.
