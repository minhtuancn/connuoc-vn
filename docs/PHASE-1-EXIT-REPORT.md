# Phase 1 Exit Report — Core Deterministic Engines

Date: 2026-09-15  
Parent epic: #2  
Exit issue: #13

## Result

**Phase 1 core deterministic v1 is ready to exit once this PR is merged.**

The four public core packages are buildable/testable without backend, database, network, Flutter, browser, or application runtime dependencies in their calculation paths:

- `@connuoc/shared-types`
- `@connuoc/geo`
- `@connuoc/lunar-calendar`
- `@connuoc/tide-engine`

## Clean-checkout verification

Authoritative verification: GitHub Actions run `34966535206`, job `Core package checks`.

The run completed successfully with:

```text
pnpm install --frozen-lockfile  PASS
pnpm lint                       PASS
pnpm typecheck                  PASS
pnpm test                       PASS
pnpm build                      PASS
pnpm bench                      PASS
```

The committed lockfile was generated with pnpm `12.4.1`; CI verifies it in frozen mode. The runner also reported the lockfile passed pnpm supply-chain policy verification for 154 entries.

## Test inventory at exit

```text
@connuoc/shared-types    8 tests PASS
@connuoc/geo             7 tests PASS
@connuoc/lunar-calendar 45 tests PASS
@connuoc/tide-engine    21 tests PASS
-----------------------------------
Total                    81 tests PASS
```

## Shared contracts

Phase 1 provides runtime-validated contracts for core station/geography/source/datum/water-level/forecast concepts. Timezone, unit, datum and source/provenance are explicit at domain boundaries; ORM/NestJS/database transport concerns are intentionally excluded.

## Geo/search

Phase 1 provides:

- canonical-name preserving Vietnamese normalization,
- diacritic-insensitive search keys including explicit `Đ/đ` behavior,
- alias search documents,
- validated coordinates through shared contracts,
- Haversine distance helper for nearby ranking.

## Vietnamese lunar calendar

Public APIs:

```ts
solarToLunar(solarDate)
lunarToSolar(lunarDate)
getCalendarCanChi(solarDate)
getSolarTermAt(isoInstant)
getMoonPhaseAt(isoInstant)
```

Validation includes independently cited factual fixtures for Tết 1900, 1950, 2000, 2024, 2025, 2026; the 2025 leap-sixth-month boundary; and 15/09/2026. Fixture URLs live beside expected facts in `packages/lunar-calendar/test/fixtures/vietnamese-lunar-golden.json`.

Generated round-trip tests are deliberately classified as internal consistency coverage, not independent golden truth.

## Tide engine

Public APIs:

```ts
predictTideLevelAt(model, atUtc)
predictTide(request)
findExtrema(points, options?)
getWaterState(points, atUtc, config)
```

Phase 1 supports deterministic fixed-frequency harmonic reconstruction with explicit reference epoch and cosine lag/lead phase convention, refined extrema, plateau handling and explicit water-state thresholds.

### Reference validation

`packages/tide-engine/test/fixtures/tide-reference.json` contains:

1. a closed-form analytic golden (`h(t)=2+cos(30°×hours)`) with exact level and extrema expectations;
2. a pinned independent MIT `openwatersio/neaps` reference commit and published reference vectors;
3. an explicit compatibility classification stating that Neaps/NOAA-style vectors requiring astronomical `V0` and nodal `f/u` corrections are **not directly comparable** to the Phase 1 fixed-frequency model.

This prevents false scientific claims. Astronomy/nodal parity is tracked in #23 and is required before claiming reproduction of official NOAA/IHO-style predictions from raw harmonic constants.

## Tide benchmark baseline

GitHub Actions runner: Ubuntu 24.04.5, Node `v24.20.0`, linux-x64, 12 constituents, 10-minute samples, warm-up + median of 9 runs.

| Workload | Points | Median | Points/sec | Checksum |
| --- | ---: | ---: | ---: | ---: |
| 24h | 145 | 0.308 ms | 470,983 | 167.045961280 |
| 7d | 1,009 | 1.404 ms | 718,733 | 1151.831972775 |
| 30d | 4,321 | 5.053 ms | 855,098 | 5034.840804749 |

Full notes: `docs/benchmarks/TIDE-ENGINE-BASELINE.md`.

Timing is observational, not a CI SLA. Deterministic point-count/checksum mismatches do fail the benchmark.

## Dependency/layering review

Core package rules at exit:

- no NestJS/Next.js/Flutter imports,
- no PostgreSQL/Redis client imports,
- no network fetch in calculation paths,
- no hidden filesystem/source lookup in calculation paths,
- source/datum/time semantics are explicit inputs/metadata,
- backend/apps may consume core packages; core packages do not consume backend/apps.

## Known limitations carried forward

- Tide astronomy/nodal corrections and official-station parity: #23.
- Weather/surge/river hydrodynamics are not part of `tide-engine` v1.
- Tide-to-river lag/damping and drainage decisions belong to later roadmap phases.
- Lunar moon phase/solar term helpers are calendar-level approximations, not precision ephemeris/navigation products.
- Source licensing/redistribution remains source-specific; validation permission does not automatically imply redistribution permission.

## Phase 2 entry condition

Phase 2 may now build backend/data-platform adapters around these stable core boundaries. Backend ingestion must preserve source provenance and must not weaken datum/timezone validation established in Phase 1.
