# Mobile Offline Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Drift-backed offline/cache subsystem for the Flutter app that preserves provenance/freshness, survives restarts, supports deterministic migrations, and keeps last-known-good data without changing the public `PublicDataRepository` interface.

**Architecture:** `AppDatabase` and focused store/repository classes live under `apps/mobile/lib/core/database` and `features/offline`. The application-facing `publicDataRepositoryProvider` becomes a `CachedPublicDataRepository` decorator over the existing remote repository and a typed Drift cache store. Favorites, preferences, sync state and offline-pack persistence remain separate interfaces so widgets never depend on SQLite.

**Tech Stack:** Flutter 3.47.3, Dart 3.12+, Drift 2.35.0, drift_flutter 0.3.1, drift_dev 2.35.0, build_runner 2.16.1, Riverpod 3.4.3, flutter_test.

**Spec:** `docs/superpowers/specs/2026-09-16-mobile-offline-persistence-design.md`

## Global Constraints

- Keep Flutter outside the pnpm workspace.
- Pin `drift` `2.35.0`, `drift_flutter` `0.3.1`, `drift_dev` `2.35.0`, and `build_runner` `2.16.1`.
- Do not add direct `sqlite3` or `sqlite3_flutter_libs` unless compilation proves it is required.
- Commit generated Drift `.g.dart` files and make CI regenerate + assert no diff.
- Persist instants as UTC and preserve source timezone strings separately.
- Store enum values by stable string value, never ordinal.
- Do not store admin credentials or authentication secrets.
- Do not add tide/lunar/drainage calculations to persistence code.
- Keep `PublicDataRepository` method signatures unchanged.
- Cached/expired data must retain its original `fetchedAtUtc`; reads never relabel stale data as fresh.
- Failed refresh must preserve last-known-good rows.
- Offline-pack replacement must be a single transaction with manifest written last.

---

### Task 1: Drift dependency, database schema, generated code and real migration path

**Files:**
- Modify: `apps/mobile/pubspec.yaml`
- Modify: `apps/mobile/pubspec.lock`
- Create: `apps/mobile/lib/core/database/app_database.dart`
- Create: `apps/mobile/lib/core/database/app_database.g.dart` (generated)
- Create: `apps/mobile/lib/core/database/schema_versions.dart`
- Create: `apps/mobile/test/core/database/app_database_migration_test.dart`
- Create: `apps/mobile/drift_schemas/schema_v1.json` (generated schema snapshot)
- Create: `apps/mobile/drift_schemas/schema_v2.json` (generated schema snapshot)

**Interfaces:**
- Produces: `AppDatabase`, `AppDatabase.inMemory()`, `schemaVersion == 2`, and typed tables required by later tasks.
- Produces logical tables: stations, stationAliases, locationSearchPages, locationSearchPageItems, tideSeries, tidePoints, waterLevelPages, waterLevelObservations, waterLevelPageItems, calendarDays, favorites, preferences, offlineManifests, offlinePackEntries, syncStates.

- [ ] **Step 1: Add a migration test before production schema implementation**

Create a test that opens an in-memory version-1 schema with representative station/tide/favorite rows, upgrades it through `AppDatabase` to schema version 2, and asserts old rows remain plus `offline_manifests`, `offline_pack_entries`, and `sync_states` exist.

```dart
test('migrates v1 cache rows to v2 without data loss', () async {
  final database = await TestDatabaseFactory.openVersion1();
  await TestDatabaseFactory.seedVersion1(database);

  final upgraded = await TestDatabaseFactory.openCurrentFrom(database);

  expect(upgraded.schemaVersion, 2);
  expect(await upgraded.select(upgraded.stations).get(), hasLength(1));
  expect(await upgraded.select(upgraded.favorites).get(), hasLength(1));
  expect(await upgraded.select(upgraded.offlineManifests).get(), isEmpty);
  expect(await upgraded.select(upgraded.syncStates).get(), isEmpty);
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
cd apps/mobile
flutter test test/core/database/app_database_migration_test.dart
```

Expected: FAIL because Drift dependencies / `AppDatabase` / test schema helpers do not exist.

- [ ] **Step 3: Add exact Drift dependencies and schema definitions**

Add the pinned dependencies from Global Constraints. Define tables with explicit primary keys, foreign keys and indexes. `AppDatabase.schemaVersion` is `2`. `onCreate` creates all current tables. `onUpgrade` supports `1 -> 2` by adding only lifecycle tables without rewriting existing rows.

Required table invariants include:

```dart
class Favorites extends Table {
  TextColumn get stationId => text()();
  DateTimeColumn get createdAtUtc => dateTime()();
  @override
  Set<Column<Object>> get primaryKey => {stationId};
}

class SyncStates extends Table {
  TextColumn get resourceKey => text()();
  TextColumn get resourceKind => text()();
  DateTimeColumn get lastAttemptAtUtc => dateTime().nullable()();
  DateTimeColumn get lastSuccessfulRefreshAtUtc => dateTime().nullable()();
  TextColumn get lastFailureKind => text().nullable()();
  DateTimeColumn get latestRemoteGeneratedAtUtc => dateTime().nullable()();
  DateTimeColumn get latestObservedAtUtc => dateTime().nullable()();
  @override
  Set<Column<Object>> get primaryKey => {resourceKey};
}
```

- [ ] **Step 4: Generate Drift output and schema snapshots**

Run:

```bash
cd apps/mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
dart run drift_dev schema dump lib/core/database/app_database.dart drift_schemas/
```

Commit `pubspec.lock`, generated `.g.dart`, and both schema snapshots.

- [ ] **Step 5: Run migration test and core Flutter gates**

Run:

```bash
cd apps/mobile
flutter test test/core/database/app_database_migration_test.dart
flutter analyze
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/pubspec.yaml apps/mobile/pubspec.lock apps/mobile/lib/core/database apps/mobile/test/core/database apps/mobile/drift_schemas
git commit -m "feat(mobile): add Drift database and migrations"
```

---

### Task 2: Canonical cache keys, freshness model and typed cache round-trip

**Files:**
- Create: `apps/mobile/lib/core/database/cache_key.dart`
- Create: `apps/mobile/lib/core/database/cache_freshness.dart`
- Create: `apps/mobile/lib/features/public_data/data/drift_public_data_cache_store.dart`
- Create: `apps/mobile/lib/features/public_data/data/public_data_cache_store.dart`
- Create: `apps/mobile/test/core/database/cache_key_test.dart`
- Create: `apps/mobile/test/core/database/cache_freshness_test.dart`
- Create: `apps/mobile/test/features/public_data/drift_public_data_cache_store_test.dart`

**Interfaces:**
- Produces: `CacheFreshness { fresh, staleRevalidatable, expired }`.
- Produces: `String cacheKeyForStation(String stationId)`, `cacheKeyForSearch(SearchLocationsRequest)`, `cacheKeyForTide(TideRequest)`, `cacheKeyForWaterLevels(WaterLevelRequest)`, `cacheKeyForCalendar(CalendarRequest)`.
- Produces `PublicDataCacheStore` exact get/put methods returning `RemoteResource<T>?`.

- [ ] **Step 1: Write failing deterministic key/freshness tests**

```dart
test('tide key is stable across equivalent UTC instants', () {
  final a = TideRequest(
    stationId: ' station-1 ',
    startUtc: DateTime.parse('2026-09-16T00:00:00+07:00'),
    endUtc: DateTime.parse('2026-09-16T06:00:00+07:00'),
    intervalSeconds: 600,
  );
  final b = TideRequest(
    stationId: 'station-1',
    startUtc: DateTime.parse('2026-09-15T17:00:00Z'),
    endUtc: DateTime.parse('2026-09-15T23:00:00Z'),
    intervalSeconds: 600,
  );
  expect(cacheKeyForTide(a), cacheKeyForTide(b));
});

test('freshness becomes stale then expired without changing fetchedAt', () {
  final fetched = DateTime.utc(2026, 9, 16, 0);
  final policy = CachePolicy(
    maxAge: const Duration(minutes: 10),
    staleWhileRevalidate: const Duration(minutes: 20),
  );
  expect(classifyFreshness(fetched, policy, DateTime.utc(2026, 9, 16, 0, 5)), CacheFreshness.fresh);
  expect(classifyFreshness(fetched, policy, DateTime.utc(2026, 9, 16, 0, 15)), CacheFreshness.staleRevalidatable);
  expect(classifyFreshness(fetched, policy, DateTime.utc(2026, 9, 16, 0, 31)), CacheFreshness.expired);
});
```

- [ ] **Step 2: Run and verify RED**

Run the three new test files; expect missing symbols.

- [ ] **Step 3: Implement cache keys/freshness and `PublicDataCacheStore`**

Use explicit strings from the design; never `hashCode`. Exact request/page keys must preserve cursor/range semantics.

- [ ] **Step 4: Write cache round-trip tests before Drift store implementation**

For station, tide and water-level fixtures parsed through the existing #41 models, write a `RemoteResource<T>`, close/reopen the in-memory store facade, and assert datum, unit, timezone, model/observation provenance, generated/observed/fetched timestamps and cache policy are unchanged.

- [ ] **Step 5: Implement `DriftPublicDataCacheStore` transactionally**

Persist normalized station/alias, tide points and water observations. A successful page/series put writes its metadata and ordered child rows inside one Drift transaction. Search summary upserts must not erase detail-only datum/provenance.

- [ ] **Step 6: Run focused and full tests**

```bash
flutter test test/core/database/cache_key_test.dart
flutter test test/core/database/cache_freshness_test.dart
flutter test test/features/public_data/drift_public_data_cache_store_test.dart
flutter test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/lib/core/database apps/mobile/lib/features/public_data/data apps/mobile/test/core/database apps/mobile/test/features/public_data
git commit -m "feat(mobile): persist typed public data cache"
```

---

### Task 3: Favorites and typed local preferences

**Files:**
- Create: `apps/mobile/lib/features/offline/domain/favorites_repository.dart`
- Create: `apps/mobile/lib/features/offline/data/drift_favorites_repository.dart`
- Create: `apps/mobile/lib/features/settings/domain/preferences_repository.dart`
- Create: `apps/mobile/lib/features/settings/data/drift_preferences_repository.dart`
- Create: `apps/mobile/test/features/offline/favorites_repository_test.dart`
- Create: `apps/mobile/test/features/settings/preferences_repository_test.dart`

**Interfaces:**
- `FavoritesRepository`: `Future<List<String>> list()`, `Stream<List<String>> watch()`, `Future<void> add(String stationId)`, `Future<void> remove(String stationId)`.
- `PreferencesRepository`: typed keys only. Phase-3 foundation keys: `wifiOnlyDownloads`, `preferredLocaleTag`, `largeTextMode` with nullable/default-aware getters and setters.

- [ ] **Step 1: Write reconstruction tests first**

Create repositories, write favorite + preferences, dispose repository objects without deleting the DB, reconstruct repositories against the same in-memory DB and assert data survives.

- [ ] **Step 2: Verify RED**

Expected: missing interfaces/implementations.

- [ ] **Step 3: Implement minimal repositories**

Preferences serialize only JSON scalar values and reject unknown arbitrary keys by not exposing a string-keyed public setter. No secrets/tokens are represented.

- [ ] **Step 4: Verify GREEN and migration regression**

Run favorites/preferences tests plus Task 1 migration test.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/features/offline apps/mobile/lib/features/settings apps/mobile/test/features/offline apps/mobile/test/features/settings
git commit -m "feat(mobile): persist favorites and preferences"
```

---

### Task 4: Cached repository with stale-while-revalidate, last-known-good and refresh de-duplication

**Files:**
- Create: `apps/mobile/lib/features/public_data/data/cached_public_data_repository.dart`
- Create: `apps/mobile/lib/features/offline/data/sync_state_store.dart`
- Create: `apps/mobile/lib/features/offline/data/drift_sync_state_store.dart`
- Create: `apps/mobile/test/features/public_data/cached_public_data_repository_test.dart`

**Interfaces:**
- `CachedPublicDataRepository implements PublicDataRepository`.
- Constructor consumes `remote`, `cacheStore`, `syncStateStore`, and injectable UTC clock.
- Process-local `_inFlightRefreshes: Map<String, Future<void>>` de-duplicates background refresh by canonical key.

- [ ] **Step 1: Write behavior tests before implementation**

Required tests:

```text
fresh cache -> returns cache, remote call count 0
stale-revalidatable -> returns cache immediately, one background refresh
2 concurrent stale reads -> one remote refresh
expired cache + remote success -> returns remote and replaces cache
expired cache + remote failure -> returns old cache with old fetchedAt
no cache + remote failure -> propagates ApiFailure
malformed remote response never overwrites old cache
caller cancellation reaches remote and creates no retry loop
```

Use fakes for `PublicDataCacheStore`, `PublicDataRepository`, and `SyncStateStore`; do not depend on wall-clock timing.

- [ ] **Step 2: Run tests and confirm RED**

Expected: missing cached repository/sync store.

- [ ] **Step 3: Implement minimal orchestration**

Fresh path never calls remote. Stale-revalidatable path schedules exactly one de-duplicated refresh and returns old data. Expired path tries remote synchronously and falls back to old data only if one exists. Persist only already-validated `RemoteResource<T>` objects.

- [ ] **Step 4: Implement sync-state recording**

Record attempt/success/failure without mutating cached payload timestamps.

- [ ] **Step 5: Verify focused tests and full Flutter suite**

```bash
flutter test test/features/public_data/cached_public_data_repository_test.dart
flutter test
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/lib/features/public_data/data/cached_public_data_repository.dart apps/mobile/lib/features/offline/data apps/mobile/test/features/public_data/cached_public_data_repository_test.dart
git commit -m "feat(mobile): add stale-aware cached repository"
```

---

### Task 5: Offline manifest storage and atomic dataset replacement

**Files:**
- Create: `apps/mobile/lib/features/offline/domain/offline_pack.dart`
- Create: `apps/mobile/lib/features/offline/data/offline_pack_store.dart`
- Create: `apps/mobile/lib/features/offline/data/drift_offline_pack_store.dart`
- Create: `apps/mobile/test/features/offline/offline_pack_store_test.dart`

**Interfaces:**
- `OfflinePackManifest` preserves pack id/version/schema version/generated/expires/checksum/content/source/min-app-version/installed timestamps.
- `ValidatedOfflineDataset` contains a manifest plus already typed/validated resource writes and membership rows.
- `OfflinePackStore.replaceValidatedDataset(ValidatedOfflineDataset dataset)` is atomic.

- [ ] **Step 1: Write rollback test before implementation**

Seed `pack-A` version 1 and old membership. Attempt version 2 replacement using a test failure hook immediately before manifest write. Assert version 1 manifest/membership/data remain visible and no version-2 partial rows become externally visible.

- [ ] **Step 2: Verify RED**

Expected: missing pack store/types.

- [ ] **Step 3: Implement transaction with manifest written last**

All normalized entity writes + membership replacement + manifest update execute inside one `database.transaction`. The failure hook exists only as an injectable test seam and is not part of presentation APIs.

- [ ] **Step 4: Add successful replacement/removal tests**

Verify successful version change, membership replacement, manifest fields, and removal behavior without touching favorites.

- [ ] **Step 5: Run tests and commit**

```bash
flutter test test/features/offline/offline_pack_store_test.dart
git add apps/mobile/lib/features/offline apps/mobile/test/features/offline
git commit -m "feat(mobile): add atomic offline pack persistence"
```

---

### Task 6: Riverpod composition, generated-code CI gate, docs and full Phase-3 regression

**Files:**
- Modify: `apps/mobile/lib/features/public_data/data/public_data_providers.dart`
- Create: `apps/mobile/lib/core/database/database_providers.dart`
- Create: `apps/mobile/lib/features/offline/data/offline_providers.dart`
- Modify: `apps/mobile/test/features/public_data/public_data_providers_test.dart`
- Create: `apps/mobile/test/core/database/database_providers_test.dart`
- Modify: `.github/workflows/mobile-ci.yml`
- Modify: `apps/mobile/README.md`
- Create: `docs/PHASE-3-MOBILE-OFFLINE-PERSISTENCE.md`

**Interfaces:**
- `remotePublicDataRepositoryProvider -> HttpPublicDataRepository`.
- `appDatabaseProvider -> AppDatabase` and closes on disposal.
- `publicDataCacheStoreProvider`, `syncStateStoreProvider`, `favoritesRepositoryProvider`, `preferencesRepositoryProvider`, `offlinePackStoreProvider`.
- `publicDataRepositoryProvider -> CachedPublicDataRepository`.

- [ ] **Step 1: Write provider tests first**

Prove remote provider builds from overridden config/client, cached provider builds from overridden remote/local dependencies, no construction performs network IO, and database provider can be overridden with in-memory DB.

- [ ] **Step 2: Verify RED**

Expected: missing new provider symbols / old provider composition mismatch.

- [ ] **Step 3: Implement provider composition**

Widgets keep reading `publicDataRepositoryProvider`; no UI code imports Drift. Default database lifecycle is owned by Riverpod and closes on disposal.

- [ ] **Step 4: Add deterministic code-generation gate to Mobile CI**

After `flutter pub get`, run:

```bash
dart run build_runner build --delete-conflicting-outputs
git diff --exit-code -- lib/core/database '*.g.dart' drift_schemas pubspec.lock
```

Then keep existing format/analyze/test/Android/iOS gates.

- [ ] **Step 5: Update docs**

Document schema version 2, migration policy, local DB location/lifecycle, cache freshness semantics, last-known-good behavior, provider seam, no-secret rule, atomic pack store, and handoff to #44/#45/#46.

- [ ] **Step 6: Run fresh full verification**

```bash
cd apps/mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
git diff --exit-code -- pubspec.lock lib/core/database drift_schemas
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build apk --debug
```

On macOS CI also require:

```bash
flutter build ios --debug --no-codesign
```

Existing repository CI, ingestion regression and Phase 2 exit gate must remain green on the PR merge ref.

- [ ] **Step 7: Scope review**

Confirm the diff contains no production UI journey, map tiles, user account/cloud sync, admin credential handling, notification/widget work, or duplicated tide/lunar/drainage formulas.

- [ ] **Step 8: Commit**

```bash
git add apps/mobile .github/workflows/mobile-ci.yml docs/PHASE-3-MOBILE-OFFLINE-PERSISTENCE.md
git commit -m "feat(mobile): wire offline persistence foundation"
```

---

## Final Merge Gate

Before marking the PR ready:

- [ ] schema v1 -> v2 migration test passes with representative existing rows;
- [ ] station/tide/water-level round trips preserve provenance/datum/unit/timezone/fetched/generated/observed timestamps;
- [ ] favorites/preferences survive repository reconstruction;
- [ ] stale/expired cache tests prove original `fetchedAtUtc` is retained;
- [ ] failed refresh keeps last-known-good data;
- [ ] concurrent stale reads trigger one remote refresh;
- [ ] offline-pack rollback test proves no partial replacement;
- [ ] generated Drift output is deterministic and clean;
- [ ] `flutter analyze` and full `flutter test` pass;
- [ ] Android debug APK builds;
- [ ] iOS debug no-sign build passes;
- [ ] repository CI, ingestion integration and Phase 2 backend exit gate remain green;
- [ ] no unresolved review threads;
- [ ] merge uses expected-head guard so a concurrent agent update cannot be merged unverified.
