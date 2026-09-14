# Testing Strategy

## Goals

Testing phải ưu tiên correctness của engine và provenance trước UI polish.

## Test layers

### 1. Pure unit tests
Mandatory for:
- tide engine,
- lunar calendar,
- drainage engine,
- unit/time/datum utilities,
- Vietnamese search normalization.

### 2. Golden/reference tests
External-reference fixtures for:
- tide series/extrema,
- lunar conversions,
- solar terms where supported,
- drainage pilot scenarios.

Fixture metadata must document source/version/license where applicable.

### 3. Integration tests
- PostgreSQL/PostGIS repositories.
- API endpoints.
- queue jobs.
- source parsers.
- raw → normalized ingestion.
- idempotent re-import.

### 4. Contract tests
- OpenAPI compatibility.
- app ↔ API DTO schemas.
- source adapter schemas.
- offline manifest schema.

### 5. UI/component tests
- mobile core widgets/screens,
- web/admin components,
- error/loading/stale states,
- large text.

### 6. E2E
Critical journeys:
1. Select location → see tide status.
2. Open chart → inspect event.
3. Open calendar → select date.
4. Download region → go offline → still use core data.
5. Drainage site → get explainable result.
6. Export PDF.
7. Admin imports source fixture and traces provenance.

## Tide engine quality

Track at minimum:
- level error against reference,
- high/low timing error,
- extrema count mismatches,
- timezone/date-boundary regressions.

## Lunar quality

- known holiday/new-year fixtures,
- leap month fixtures,
- round-trip conversions,
- midnight/timezone boundaries,
- supported-range boundaries.

## Drainage quality

Test classes:
- clearly positive ΔH,
- clearly negative ΔH,
- outside level falling/rising,
- stale input,
- datum mismatch,
- manual + forecast combinations,
- narrow valid window,
- no valid window,
- missing mandatory input.

Safety expectation: ambiguous/invalid mandatory inputs should fail closed to `INSUFFICIENT_DATA`, not optimistic recommendation.

## Source parser tests

Each adapter requires:
- representative fixture,
- missing field fixture,
- malformed payload,
- timezone/unit case,
- duplicate/replay case,
- stale issue time,
- parser version test.

## Accessibility testing

- TalkBack smoke test.
- VoiceOver smoke test.
- web keyboard navigation.
- text scaling.
- high contrast.
- reduced motion.
- chart textual alternative.

## Performance

Measure:
- tide generation per station/range,
- API p50/p95 latency,
- station search,
- chart rendering,
- mobile cold/warm start,
- offline DB query latency,
- PDF generation.

Avoid arbitrary optimization before baseline measurements.

## CI gates

Initial required gates:
- format/lint,
- typecheck/analyze,
- unit tests,
- contract/schema tests,
- build smoke test.

Later:
- integration tests with service containers,
- E2E,
- accessibility checks,
- security/dependency scans,
- release artifact verification.

## Regression policy

Any production data/calc incident should add a fixture/regression test before or with the fix where technically possible.
