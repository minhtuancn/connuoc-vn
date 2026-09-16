# Mobile Public API Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a typed, cancellable, no-hidden-retry Flutter repository for all five Phase 2 public endpoints while preserving provenance and freshness metadata.

**Architecture:** `PublicDataRepository` is the app-facing interface. `HttpPublicDataRepository` uses the pinned `http` client, strict JSON readers, real `AbortableRequest` cancellation, explicit timeout handling, and typed failures. Transport freshness (`Cache-Control` + fetch time) wraps endpoint-specific immutable models so #42 can add caching without changing #44 widgets.

**Tech Stack:** Flutter 3.47.3, Dart, `http` 1.6.0, `flutter_test`, `http/testing.dart`.

**Spec:** `docs/superpowers/specs/2026-09-16-mobile-public-api-client-design.md`

## Global Constraints

- No Flutter widget may parse JSON or call raw HTTP.
- No admin endpoint/token/auth support is added.
- No tide/calendar formula is duplicated on device.
- Automatic retry count is exactly zero.
- Default timeout is 15 seconds and request cancellation must use `AbortableRequest`.
- Required provenance/datum/unit/timezone/timestamp fields are never silently dropped or coerced.
- Extra JSON fields may be ignored for forward compatibility; malformed required fields fail closed as `malformedResponse`.
- All tests run without public internet, PostgreSQL, or Redis.

---

### Task 1: Add fixture-backed immutable public data models

**Files:**
- Create: `apps/mobile/lib/core/network/json_readers.dart`
- Create: `apps/mobile/lib/features/public_data/domain/public_data_models.dart`
- Create: `apps/mobile/test/fixtures/public_api/search.json`
- Create: `apps/mobile/test/fixtures/public_api/station.json`
- Create: `apps/mobile/test/fixtures/public_api/water_levels.json`
- Create: `apps/mobile/test/fixtures/public_api/tide.json`
- Create: `apps/mobile/test/fixtures/public_api/calendar.json`
- Create: `apps/mobile/test/features/public_data/public_data_models_test.dart`

**Interfaces:**
- Produces: `GeoPoint`, `ObservationProvenance`, `ModelProvenance`, `LocationSearchPage`, `StationDetails`, `WaterLevelObservation`, `WaterLevelPage`, `TidePoint`, `TideSeries`, `CalendarDay`, endpoint meta classes and exact enum parsers.
- Consumes: Phase 2 response shapes in `services/api/src/modules/public-data/public-data.service.ts` and `public-data.types.ts`.

- [ ] **Step 1: Add repository-owned fixtures matching Phase 2 integration responses**

Use stable values from `public-api.integration.test.ts`: station `public-api-station`, source `public-api-fixture`, datum `local-gauge-fixture`, timezone `Asia/Ho_Chi_Minh`, tide model `public-api-harmonic` version `1.0.0`, observation values `130.2/123.4 cm`, and Tết 2024 calendar `2024-02-10 -> 1/1 lunar`.

- [ ] **Step 2: Write failing parser tests**

Tests must assert:

```dart
expect(station.defaultDatumId, 'local-gauge-fixture');
expect(station.provenance?.rawChecksumSha256, 'bbbb...');
expect(water.items.single.provenance.parserVersion, 'fixture-parser@1');
expect(tide.modelVersion, '1.0.0');
expect(tide.points.first.timestampUtc, DateTime.parse('2026-01-01T00:00:00Z'));
expect(calendar.lunarDate.isLeapMonth, isFalse);
```

Also mutate one required field to a wrong type and assert a `JsonContractException` is thrown.

- [ ] **Step 3: Run focused tests to verify RED**

Run:

```bash
cd apps/mobile
flutter test test/features/public_data/public_data_models_test.dart
```

Expected: compilation fails because model/parser classes do not exist.

- [ ] **Step 4: Implement strict JSON readers and immutable models**

`json_readers.dart` provides focused helpers such as:

```dart
Map<String, Object?> readObject(Object? value, String path)
List<Object?> readList(Object? value, String path)
String readString(Map<String, Object?> json, String key, String path)
String? readNullableString(...)
double readDouble(...)
int readInt(...)
DateTime readInstant(...)
```

Each model has a `factory ...fromJson(Map<String, Object?> json)` and normalizes parsed instants to UTC.

- [ ] **Step 5: Run parser tests and full analyze**

```bash
cd apps/mobile
flutter test test/features/public_data/public_data_models_test.dart
flutter analyze
```

Expected: PASS.

- [ ] **Step 6: Commit**

Commit fixtures, readers, models, and parser tests together.

---

### Task 2: Define request, freshness, cancellation, and failure contracts

**Files:**
- Create: `apps/mobile/lib/core/network/api_failure.dart`
- Create: `apps/mobile/lib/core/network/cache_policy.dart`
- Create: `apps/mobile/lib/core/network/request_cancellation.dart`
- Create: `apps/mobile/lib/features/public_data/domain/public_data_requests.dart`
- Create: `apps/mobile/lib/features/public_data/domain/public_data_repository.dart`
- Create: `apps/mobile/test/core/network/network_contracts_test.dart`

**Interfaces:**
- Produces: `ApiFailure`, `ApiFailureKind`, `ProblemDetails`, `CachePolicy`, `RemoteResource<T>`, `RequestCancellation`, request value objects, and `PublicDataRepository`.
- Consumers: Task 3 HTTP implementation, #42 cache decorator, #44 widgets via repository abstraction.

- [ ] **Step 1: Write failing tests for cache/problem/request validation**

Assert:

```dart
expect(CachePolicy.parse('public, max-age=60, stale-while-revalidate=120').maxAge,
       const Duration(seconds: 60));
expect(() => TideRequest(...end before start...), throwsArgumentError);
expect(ProblemDetails.fromJson(problemFixture).status, 404);
```

`RequestCancellation.cancel()` must be idempotent and expose a future that completes once.

- [ ] **Step 2: Verify RED**

```bash
cd apps/mobile
flutter test test/core/network/network_contracts_test.dart
```

- [ ] **Step 3: Implement the contracts**

`RemoteResource<T>` stores `value`, `fetchedAtUtc`, and `CachePolicy`; request constructors validate only obvious local invariants. `ApiFailure` is an exception object carrying kind, optional status code/problem details, and original cause.

- [ ] **Step 4: Run tests/analyzer**

```bash
cd apps/mobile
flutter test test/core/network/network_contracts_test.dart
flutter analyze
```

Expected: PASS.

- [ ] **Step 5: Commit**

Commit network contracts and repository interface.

---

### Task 3: Implement cancellable HTTP repository with no hidden retries

**Files:**
- Create: `apps/mobile/lib/features/public_data/data/http_public_data_repository.dart`
- Create: `apps/mobile/test/features/public_data/http_public_data_repository_test.dart`
- Create: `apps/mobile/test/fixtures/public_api/problem_404.json`

**Interfaces:**
- Implements: `PublicDataRepository`.
- Consumes: injected `AppConfig`, injected `http.Client`, optional clock, request timeout.
- Produces: `RemoteResource<T>` or typed `ApiFailure`.

- [ ] **Step 1: Write URI/response tests with `MockClient`**

Capture requests and assert exact API paths/query parameters for all five methods. Return fixture JSON plus endpoint `Cache-Control` headers and assert parsed `CachePolicy`, fetch time and endpoint metadata.

- [ ] **Step 2: Write error/no-retry tests**

Return the repository-owned 404 problem fixture with `application/problem+json`; assert `ApiFailureKind.notFound` and parsed `ProblemDetails`. Return 503 and assert the mock invocation count is exactly `1`.

- [ ] **Step 3: Write cancellation/timeout tests using an abort-aware fake `BaseClient`**

The fake client waits on the request's `abortTrigger` and throws `http.RequestAbortedException`. Test caller cancellation maps to `cancelled`; a very short configured timeout maps to `timeout`.

- [ ] **Step 4: Verify RED**

```bash
cd apps/mobile
flutter test test/features/public_data/http_public_data_repository_test.dart
```

Expected: missing implementation failures.

- [ ] **Step 5: Implement request execution**

For each request create `http.AbortableRequest('GET', uri, abortTrigger: internalAbort.future)`, send via the injected client, collect `http.Response.fromStream`, parse success JSON, or map non-2xx/problem responses. A timer completes the internal abort trigger after `requestTimeout`; external cancellation completes the same trigger. Track which event fired to distinguish timeout from caller cancellation.

Do not wrap the client in `RetryClient` and do not resubmit failed requests.

- [ ] **Step 6: Run focused and full mobile tests**

```bash
cd apps/mobile
flutter test test/features/public_data/http_public_data_repository_test.dart
flutter test
flutter analyze
```

Expected: PASS.

- [ ] **Step 7: Commit**

Commit the HTTP repository and tests.

---

### Task 4: Wire Riverpod provider boundary without coupling widgets

**Files:**
- Create: `apps/mobile/lib/features/public_data/data/public_data_providers.dart`
- Create: `apps/mobile/test/features/public_data/public_data_providers_test.dart`

**Interfaces:**
- Produces: `httpClientProvider`, `publicDataRepositoryProvider`.
- Consumes: existing `appConfigProvider` from #40.
- Allows: tests/#42/#44 to override `PublicDataRepository` without raw HTTP access.

- [ ] **Step 1: Write provider override test**

Create a minimal fake `PublicDataRepository`, override `publicDataRepositoryProvider`, and assert a `ProviderContainer` resolves the fake instance. Verify the default provider can be constructed from overridden `AppConfig` + HTTP client without sending a request.

- [ ] **Step 2: Verify RED**

```bash
cd apps/mobile
flutter test test/features/public_data/public_data_providers_test.dart
```

- [ ] **Step 3: Implement providers**

The default HTTP client provider owns `http.Client()` and closes it via `ref.onDispose`. `publicDataRepositoryProvider` constructs `HttpPublicDataRepository` from `appConfigProvider` and the client provider.

- [ ] **Step 4: Run tests/analyze**

```bash
cd apps/mobile
flutter test
flutter analyze
```

Expected: PASS.

- [ ] **Step 5: Commit**

Commit provider wiring and tests.

---

### Task 5: Document compatibility and verify PR merge-ref

**Files:**
- Create: `docs/PHASE-3-MOBILE-API-CLIENT.md`
- Modify: `apps/mobile/README.md`
- PR body: record final CI evidence.

**Interfaces:**
- Produces: API version/drift policy and #42/#44 handoff.

- [ ] **Step 1: Document compatibility policy**

State that Phase 3 targets `/v1`; extra fields are tolerated, missing/wrong required fields fail closed, and breaking backend response changes require synchronized mobile contract changes. List provenance/freshness fields that are mandatory.

- [ ] **Step 2: Document cancellation/retry policy**

Record 15-second default timeout, real abort-trigger cancellation, and zero automatic retries.

- [ ] **Step 3: Open draft PR and run fresh merge-ref CI**

Require current-head success for repository CI and Mobile CI. Existing Phase 2 integration lanes that run on the PR must remain green.

- [ ] **Step 4: Review scope**

Confirm no Drift database, production feature UI, admin endpoint/token, backend response change, or duplicated deterministic formula entered the diff.

- [ ] **Step 5: Mark ready and merge only with fresh green evidence**

After merge, close #41 and mark it complete in #39; #42 becomes unblocked.
