# Phase 3 Mobile Public API Client

Issue: #41  
Parent: #39

## Purpose

The Flutter application consumes the Phase 2 public backend through one typed repository boundary. Production widgets and feature controllers depend on `PublicDataRepository`; they do not parse transport JSON or call `http.Client` directly.

The client targets the public `/v1` API only. It has no admin token, admin endpoint, or production credential surface.

## Public endpoints

`HttpPublicDataRepository` covers the five Phase 2 public endpoints:

- `GET /v1/locations/search`
- `GET /v1/stations/{stationId}`
- `GET /v1/stations/{stationId}/tide`
- `GET /v1/stations/{stationId}/water-level`
- `GET /v1/calendar`

Path segments and query values are built with `Uri` APIs. User input is not concatenated into URLs manually.

## Compatibility and drift policy

Phase 3 is compatible with additive `/v1` response evolution:

- Unknown extra JSON fields are ignored.
- Fields required by the mobile domain model must keep their documented type and meaning.
- A missing, malformed, or wrong-typed required field fails closed as `ApiFailureKind.malformedResponse`.
- Unknown values for relied-on enums fail parsing instead of being silently coerced.
- Offset-aware timestamps are normalized to UTC while station/model timezone metadata is preserved separately.
- A breaking backend response change requires a synchronized mobile contract/model/test update. The mobile client must not guess or synthesize replacement values.

The contract deliberately preserves source and freshness metadata rather than rewriting it. Important fields include:

- response `meta.generatedAt` where defined by the endpoint;
- water-level `meta.latestObservedAt` when supplied;
- water-level observation ingestion provenance: source key, import run id, raw checksum, parser version, normalizer version, and observed timestamp;
- tide model metadata: model id/version, datum, unit, timezone, phase convention, reference epoch, constituent count, and model provenance;
- station latest provenance when supplied by the backend;
- HTTP `Cache-Control` freshness directives, specifically `max-age` and `stale-while-revalidate`.

`RemoteResource<T>` records the parsed value, the UTC client fetch time, and parsed cache policy. Backend observation/model timestamps remain authoritative and are not replaced by the fetch time.

## Request and transport policy

The transport implementation uses the pinned `package:http` client and `http.AbortableRequest`.

- Default request timeout: 15 seconds.
- Caller cancellation completes the request abort trigger and maps to `ApiFailureKind.cancelled`.
- Timeout completes the same abort trigger and maps to `ApiFailureKind.timeout`.
- Automatic retry count: zero.
- A 503 response is surfaced once as `ApiFailureKind.unavailable`; the transport does not silently resubmit it.
- Network/client failures map to `ApiFailureKind.network`.
- Non-2xx responses map to typed HTTP failure kinds.
- Valid `application/problem+json` responses preserve RFC problem details.
- Invalid or non-JSON error bodies do not cause invented problem details.

Retry, stale-cache fallback, and refresh orchestration belong above the low-level HTTP transport. #42 can add persistence/offline policy behind the same `PublicDataRepository` interface.

## Dependency injection boundary

Riverpod exposes:

- `httpClientProvider` — owns the default `http.Client` and closes it on provider disposal;
- `publicDataRepositoryProvider` — constructs the default `HttpPublicDataRepository` from `appConfigProvider` and `httpClientProvider`.

Tests and later features can override `publicDataRepositoryProvider` with a fake/cached implementation. Widgets should consume the repository abstraction rather than importing `HttpPublicDataRepository`.

## What this layer does not do

This issue intentionally does not add:

- Drift/SQLite persistence or offline packs;
- production feature screens;
- admin authentication or admin API access;
- backend response changes;
- local tide, lunar-calendar, or drainage formula duplication;
- hidden retry/backoff behavior.

## Verification contract

Mobile CI must pass on the PR merge ref with the pinned Flutter toolchain:

```bash
cd apps/mobile
flutter pub get
flutter gen-l10n
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build apk --debug
```

The macOS lane also verifies:

```bash
flutter build ios --debug --no-codesign
```

Parser tests use repository-owned Phase 2 response fixtures. HTTP tests verify endpoint construction, freshness, problem-details mapping, malformed responses, network failures, true abort-trigger cancellation, timeout behavior, and zero hidden retries.

## Handoff

- #42 can implement cached/offline `PublicDataRepository` behavior without changing feature widgets or JSON parsing contracts.
- #44 consumes `PublicDataRepository` for production mobile data flows.
- Backend contract drift that affects required fields must first update the typed models, fixtures, and contract tests here.
