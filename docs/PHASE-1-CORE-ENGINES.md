# Phase 1 — Core Engines Execution Plan

Parent epic: #2

## Status

**Implementation complete on Phase 1 completion PR, pending final merge/issue closure.**

Exit evidence: `docs/PHASE-1-EXIT-REPORT.md`.

## Objective

Deliver deterministic, offline-capable and independently testable core libraries before production backend/mobile UI work.

## Work lanes

### Lane A — Tooling and contracts
- [x] #3 Bootstrap core package toolchain + reproducible `pnpm-lock.yaml` + frozen CI install.
- [x] #4 Shared domain schemas and identifiers.
- [x] #11 Geo/search utilities.

### Lane B — Tide
- [x] #5 Harmonic constituent model + prediction API.
- [x] #6 Extrema + rising/falling + event timestamps.
- [x] #7 Analytic golden reference + external capability fixture + benchmark baseline.

Scientific note: Phase 1 closes the fixed-frequency model honestly; NOAA/IHO-style astronomy/nodal parity is a separate follow-up #23 and is required before official-station parity claims.

### Lane C — Vietnamese lunar calendar
- [x] #8 Solar/lunar conversion + leap-month rules.
- [x] #9 Can Chi + solar terms + moon-phase interface.
- [x] #10 Independent factual fixtures + golden validation + cross-range round trips.

### Lane D — Data governance
- [x] #12 Source inventory, licensing and fixture provenance.

### Exit gate
- [x] #13 Clean-checkout integration verification captured in `docs/PHASE-1-EXIT-REPORT.md`.

## Parallelization guidance retained for history

The package split proved suitable for isolated agent contexts: shared contracts and tooling stabilized first; Tide, Lunar, Geo and data governance then progressed independently with CI after each PR.

## Agent context rule

Agents working on these packages should continue loading only:
- their issue body,
- the relevant package directory,
- the matching domain spec under `docs/`,
- root TypeScript/package configuration when required,
- fixture directories relevant to their task.

Do not load mobile/web/admin/backend directories for core-engine-only tasks.

## Definition of done

The Phase 1 exit gate requires public APIs, tests, edge cases, timezone/unit/datum rules, reference provenance, frozen dependency installation and benchmark evidence. All are recorded in `docs/PHASE-1-EXIT-REPORT.md`.
