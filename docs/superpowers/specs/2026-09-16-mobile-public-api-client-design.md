# Mobile Public API Client Design

Issue: #41  
Parent: #39  
Depends on: #40, Phase 2 public API #29

## Goal

Provide a typed, cancellable, testable Dart boundary for the five Phase 2 public endpoints before any production mobile feature reads transport JSON directly.

## Chosen approach

Use hand-written immutable Dart API/domain models plus strict `fromJson` parsing and a small `PublicDataRepository` interface implemented by `HttpPublicDataRepository`.

This is preferred over OpenAPI code generation for Phase 3 because the current NestJS Swagger decorators intentionally expose the public responses as `additionalProperties: true`; generated Dart clients would therefore add tooling without giving strong response types. A cross-language shared TypeScript/Dart runtime package is also rejected because it would make Flutter depend on the JS workspace and violate ADR-0001.

## Transport

Use the already-pinned `package:http` 1.6.0.

- Requests use `http.AbortableRequest` and `Client.send` so cancellation aborts supported native/web requests rather than merely abandoning the Dart `Future`.
- Every request has an explicit timeout, default 15 seconds.
- Timeout completes the same abort trigger and maps to a typed `timeout` failure.
- Caller cancellation maps to a typed `cancelled` failure.
- Automatic retry count is zero. Retrying is a repository/application policy for later work; the low-level client never silently resubmits a request.
- The injected `http.Client` is owned by the caller unless the default constructor creates it; `close()` is explicit.
- No admin/auth token is accepted by this client.

## Public repository interface

`PublicDataRepository` exposes:

```dart
Future<RemoteResource<LocationSearchPage>> searchLocations(
  SearchLocationsRequest request, {
  RequestCancellation? cancellation,
});

Future<RemoteResource<StationDetails>> getStation(
  String stationId, {
  RequestCancellation? cancellation,
});

Future<RemoteResource<TideSeries>> getTide(
  TideRequest request, {
  RequestCancellation? cancellation,
});

Future<RemoteResource<WaterLevelPage>> getWaterLevels(
  WaterLevelRequest request, {
  RequestCancellation? cancellation,
});

Future<RemoteResource<CalendarDay>> getCalendar(
  CalendarRequest request, {
  RequestCancellation? cancellation,
});
```

`HttpPublicDataRepository` is the network implementation. #42 may later create a cache/offline decorator implementing the same interface without changing widgets.

## Resource freshness contract

Each successful request returns `RemoteResource<T>` containing:

- parsed typed value;
- `fetchedAtUtc` from an injected clock;
- parsed `CachePolicy` from `Cache-Control`:
  - `maxAge`;
  - `staleWhileRevalidate`.

Body `meta.generatedAt` remains part of each endpoint model. Water-level `meta.latestObservedAt` is preserved separately. This gives #42 enough information to decide fresh/stale while never rewriting observed/model timestamps.

## Typed models

### Shared

- `GeoPoint(latitude, longitude)`
- `ObservationProvenance(sourceKey, importRunId, rawChecksumSha256, parserVersion, normalizerVersion, observedAtUtc)`
- `ModelProvenance(sourceKey?, importRunId?)`
- `PageMeta(generatedAtUtc, nextCursor?)`
- `WaterLevelUnit { m, cm, mm }`
- `QualityState { good, suspect, bad, unknown }`
- `HarmonicPhaseConvention { cosineLagDegrees, cosineLeadDegrees }`

Unknown enum values fail parsing instead of being silently coerced. Nullable datum/source fields remain nullable.

### Search

`LocationSearchPage` preserves station id/name/type/timezone/location/aliases, `generatedAtUtc`, and `nextCursor`.

### Station

`StationDetails` preserves id/name/type/timezone/location/aliases, nullable `defaultDatumId`, nullable latest `ObservationProvenance`, and generated time.

### Water levels

`WaterLevelObservation` preserves source record key, observed time, numeric value, unit, nullable datum, quality state, and full ingestion provenance.

`WaterLevelPage` preserves station metadata, items, generated time, nullable latest observed time, and cursor.

### Tide

`TidePoint(timestampUtc, value)`.

`TideSeries` preserves station id/range/interval/points plus model id/version, datum, unit, timezone, phase convention, reference epoch, constituent count, model provenance, and generated time. The mobile client does not calculate tide values.

### Calendar

`CalendarDay` preserves Gregorian year/month/day, lunar year/month/day/leap flag, Vietnam timezone, and generated time. #41 does not invent Can Chi, solar-term, or moon-phase fields absent from the Phase 2 endpoint.

## Requests and URI construction

- Search: `q`, bounded `limit`, optional cursor.
- Station: path station id.
- Tide: station id, UTC start/end, interval seconds.
- Water level: station id, optional UTC start/end, bounded limit, optional cursor.
- Calendar: Gregorian date encoded as `YYYY-MM-DD`.

Request objects validate obvious client-side invariants before network I/O: non-empty station/query, positive limits, ordered ranges, positive interval. The server remains authoritative for its stricter maximums.

All path segments and query values use `Uri` construction/encoding; no manual string concatenation of user input.

## JSON parsing policy

Response parsing is strict for fields the mobile app relies on:

- required maps/lists/scalars must have the expected type;
- timestamps must parse as offset-aware ISO instants and are normalized to UTC `DateTime`;
- required provenance fields cannot disappear silently;
- numeric JSON values accept Dart `num` and convert to `double` where appropriate;
- extra response fields are ignored for forward compatibility;
- malformed required data maps to `ApiFailureKind.malformedResponse`.

## Error contract

`ProblemDetails` mirrors the server envelope: `type`, `title`, `status`, `detail`, `instance`.

`ApiFailureKind`:

- `badRequest` (400)
- `unauthorized` (401, defensive even though public endpoints do not require auth)
- `forbidden` (403)
- `notFound` (404)
- `unprocessable` (422)
- `unavailable` (503)
- `server` (other 5xx)
- `http` (other non-2xx)
- `network`
- `timeout`
- `cancelled`
- `malformedResponse`

When a non-2xx body is valid problem+json, attach parsed `ProblemDetails`. Invalid/non-JSON error bodies still produce an HTTP failure with status code and no invented detail.

## Fixtures and tests

Repository-owned mobile fixtures mirror the actual Phase 2 integration contract:

- search success;
- station success with ingestion provenance;
- water-level page with nullable datum semantics and cursor;
- tide series with model provenance;
- calendar date;
- problem-details 404.

Tests cover:

1. all five model parsers and provenance/freshness preservation;
2. URI/query encoding and cursor propagation;
3. cache-control parsing;
4. 404 problem-details mapping;
5. malformed success body mapping;
6. transport/network error mapping;
7. real abort-trigger cancellation behavior through an abort-aware fake client;
8. timeout mapping;
9. 503 results in exactly one request (no hidden retries).

No test requires public internet or PostgreSQL.

## Handoff

- #42 may implement cached/local `PublicDataRepository` using these models and freshness policy.
- #44 consumes only `PublicDataRepository`, never `HttpPublicDataRepository` or JSON.
- Backend contract drift that changes required fields must fail parser tests rather than degrade silently.
