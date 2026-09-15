# Phase 1 — Core Engines Execution Plan

Parent epic: #2

## Objective

Deliver deterministic, offline-capable and independently testable core libraries before production backend/mobile UI work.

## Work lanes

### Lane A — Tooling and contracts
1. #3 Bootstrap core package toolchain.
2. #4 Shared domain schemas and identifiers.
3. #11 Geo/search utilities can start after #3/#4 contracts are stable enough.

### Lane B — Tide
1. #5 Harmonic constituent model + prediction API.
2. #6 Extrema + rising/falling + event timestamps.
3. #7 Reference fixtures + golden tests + benchmark baseline.

### Lane C — Vietnamese lunar calendar
1. #8 Solar/lunar conversion + leap-month rules.
2. #9 Can Chi + solar terms + moon-phase interface.
3. #10 Known-date fixtures + golden validation.

### Lane D — Data governance
- #12 Source inventory, licensing and fixture provenance.
- Runs in parallel but must complete before #7/#10 can be considered final.

### Exit gate
- #13 performs clean-checkout integration verification and closes Phase 1.

## Parallelization guidance

After #3 is merged, agents may work on #4, #8 and #12 in parallel. Once the minimum contracts from #4 are stable, #5 and #11 can run independently. Avoid assigning #5 and #6 simultaneously unless the #5 public API has been merged or explicitly frozen.

## Agent context rule

Agents should load only:
- their issue body,
- the relevant package directory,
- the matching domain spec under `docs/`,
- `tsconfig.base.json` / root package config when required,
- fixture directories relevant to their task.

Do not load mobile/web/admin/backend directories for Phase 1 core-engine tasks.

## Definition of done

A core task is complete only when public API, tests, edge cases, timezone/unit/datum rules and reference provenance are explicit as required by `docs/TODO.md`.
