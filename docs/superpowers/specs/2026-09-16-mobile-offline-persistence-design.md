# Phase 3 Mobile Offline Persistence Design

- Date: 2026-09-16
- Issue: #42
- Parent: #39
- Depends on: #40, #41
- Branch: `phase-3/mobile-offline-persistence`
- Status: Approved design, pending implementation plan

## 1. Purpose

Issue #42 adds the first persistent offline/data-cache subsystem to the Flutter application. The subsystem must preserve the typed public API contracts introduced by #41, keep provenance and freshness explicit, support deterministic schema migrations, and provide a stable seam for #44/#45/#46 without letting widgets depend on SQLite or transport JSON.

The implementation must satisfy these product guarantees:

1. Previously validated data remains useful when the backend or network is unavailable.
2. Cached data never masquerades as live data; original fetch and source timestamps remain intact.
3. A failed refresh never destroys the last-known-good value.
4. Replacing a validated offline dataset is atomic.
5. Favorites and local preferences survive repository/database reconstruction.
6. Schema evolution is explicit and tested before Phase 3 reaches production.

This issue does not implement the final offline-pack UI, map tiles, accounts/cloud sync, live notifications, or any tide/lunar/drainage formula.

## 2. Design decision

Use **Drift over SQLite** with normalized typed tables and a cached `PublicDataRepository` decorator.

The default application-facing `publicDataRepositoryProvider` remains the single abstraction consumed by widgets and controllers. #42 adds a separate remote provider for the #41 HTTP implementation and makes the default provider compose remote transport with local persistence.

```text
Widget / Controller
        |
        v
publicDataRepositoryProvider
        |
        v
CachedPublicDataRepository
   |                 |
   v                 v
Local Drift store   remotePublicDataRepositoryProvider
                         |
                         v
                 HttpPublicDataRepository
```

The local database is never imported from presentation widgets. Drift DAOs/stores expose storage operations to repository classes only.

### Rejected alternatives

**One monolithic database facade** was rejected because it would mix cache policy, preferences, offline packs, and raw table operations into one large dependency that later issues would be forced to understand.

**Opaque JSON/blob cache only** was rejected because it weakens migration guarantees, normalized lookup/query behavior, provenance inspection, transactional replacement, and testability.

**A new sync framework** was rejected for Phase 3. The product does not yet have user accounts/cloud sync, so Drift transactions plus explicit repository orchestration are sufficient and substantially easier to verify.

## 3. Dependency policy

Pin database/code-generation dependencies deliberately rather than following floating latest versions.

At design time on 2026-09-16, the intended versions are:

- `drift` `2.35.0`
- `drift_flutter` `0.3.1`
- `drift_dev` `2.35.0` as a dev dependency
- `build_runner` `2.16.1` as a dev dependency

The implementation must run `flutter pub get` under the repository-pinned Flutter `3.47.3`, commit the resulting `pubspec.lock`, and let dependency resolution fail rather than silently loosening SDK/toolchain constraints.

Do not add a direct `sqlite3` or `sqlite3_flutter_libs` dependency unless the chosen Drift/Flutter setup demonstrably requires direct application imports. Prefer the platform setup already provided by `drift_flutter`.

Generated Drift code is committed because clean checkout CI must build without relying on hidden local generation state. CI also runs generation and verifies there is no diff.

## 4. Database lifecycle

Create `AppDatabase` under `apps/mobile/lib/core/database/`.

Production opening uses `drift_flutter` with the application database name `connuoc_mobile`. Native Flutter connections must be hosted off the UI isolate through the package's native/background connection behavior. Tests use an in-memory executor.

Riverpod owns database lifetime:

```text
appDatabaseProvider
  -> creates AppDatabase
  -> ref.onDispose(database.close)
```

The database layer has no dependency on feature presentation code.

All instants are normalized to UTC before persistence. Station/model timezone identifiers remain separate strings and must never be inferred from device timezone. Enum values are stored by stable wire/string value, never by Dart enum ordinal.

## 5. Schema version strategy

The first shipped implementation uses **schema version 2** intentionally so #42 proves a real migration path before production release.

### Version 1

Version 1 establishes the core cache and user-local substrate:

- cached location-search pages
- stations and aliases
- tide series and tide points
- water-level pages and observations
- calendar days
- favorites
- preferences

### Version 2

Version 2 adds lifecycle/orchestration state:

- offline pack manifests and entries
- sync/refresh state

The repository stores a generated schema snapshot for version 1 and current version 2. Migration tests create/open the version-1 schema with representative rows, migrate to version 2, verify existing data remains intact, and verify the new tables and constraints.

Future schema changes must add a new version and migration test. Destructive fallback such as deleting/recreating the database is not an accepted migration strategy.

## 6. Core tables

Table/class names may follow Drift naming conventions, but the following logical entities and invariants are required.

### 6.1 `stations`

Stores the common station fields received from search/detail responses:

- station id primary key
- name
- station type
- timezone id
- latitude
- longitude
- default datum id, nullable
- detail response generated-at timestamp, nullable
- latest station provenance fields, nullable where the public API permits null
- last local update timestamp

Search results do not contain every station-detail field. Upserting a search summary must update common fields without erasing non-null detail-only provenance/datum metadata previously obtained from a station-detail response.

### 6.2 `station_aliases`

- station id
- alias
- composite primary key `(stationId, alias)`
- foreign key to `stations`

A validated response replaces the known alias set transactionally for that station.

### 6.3 `location_search_pages`

Cache exact request/page semantics rather than inventing a new local cursor protocol.

Fields include:

- canonical request cache key
- normalized query
- limit
- cursor, nullable
- response generated-at
- response next cursor, nullable
- fetched-at UTC
- cache max-age seconds
- stale-while-revalidate seconds

### 6.4 `location_search_page_items`

- search cache key
- zero-based ordinal
- station id
- composite primary key `(cacheKey, ordinal)`

This preserves server ordering and exact cached pagination while station data remains normalized in `stations`/`station_aliases`.

### 6.5 `tide_series`

Canonical identity is derived from:

- station id
- start UTC
- end UTC
- interval seconds

Persist all metadata relied on by #41:

- model id/version
- datum id
- unit
- station/model timezone
- phase convention
- reference epoch
- constituent count
- model provenance source/import ids
- response generated-at
- fetched-at
- cache max-age
- stale-while-revalidate

### 6.6 `tide_points`

- tide-series key
- timestamp UTC
- value
- composite primary key `(seriesKey, timestampUtc)`

A successful validated remote series replaces its cached series row and points in one transaction.

### 6.7 `water_level_pages`

Exact page/request cache with:

- canonical request key
- station id/name/timezone/default datum from the response
- optional start/end
- limit
- cursor
- generated-at
- latest observed-at, nullable
- next cursor, nullable
- fetched-at
- cache max-age
- stale-while-revalidate

### 6.8 `water_level_observations`

Observation identity uses `(stationId, sourceRecordKey)` and persists:

- observed-at UTC
- value
- unit
- datum id, nullable
- quality state
- ingestion provenance source key
- import run id
- raw checksum SHA-256
- parser version
- normalizer version
- provenance observed-at

### 6.9 `water_level_page_items`

- water-level page key
- ordinal
- station id
- source record key

This preserves exact server page ordering while observations are normalized and de-duplicated.

### 6.10 `calendar_days`

Key by requested Gregorian date. Persist:

- solar year/month/day
- lunar year/month/day
- leap-month flag
- returned timezone id
- generated-at
- fetched-at
- cache max-age
- stale-while-revalidate

The local cache stores server output only. It does not implement lunar conversion logic.

### 6.11 `favorites`

- station id primary key
- created-at UTC

Favorite persistence is local-only and independent from cache freshness. Removing expired cache data must not remove a favorite.

### 6.12 `preferences`

Use a small versionable key/value table:

- stable preference key primary key
- JSON scalar value
- updated-at UTC

Only typed repository methods may read/write known preference keys. Widgets must not manipulate arbitrary preference strings. This keeps #42 independent from presentation choices owned by #43/#45 while still providing durable preference storage.

No credential/token/secret preference keys are allowed in this table.

### 6.13 `offline_manifests`

- pack id primary key
- version
- pack schema version
- generated-at
- expires-at
- checksum
- content summary canonical JSON
- source summary canonical JSON
- minimum app version
- installed-at

A manifest becomes visible only after all validated pack writes succeed.

### 6.14 `offline_pack_entries`

Tracks logical membership without duplicating all cached payloads:

- pack id
- entity type
- entity key
- composite primary key `(packId, entityType, entityKey)`

Entity type is a stable string enum such as `station`, `tideSeries`, `waterLevelPage`, or `calendarDay`.

### 6.15 `sync_state`

One row per canonical resource key:

- resource key primary key
- resource kind
- last attempt-at, nullable
- last successful refresh-at, nullable
- last failure kind, nullable
- latest remote generated-at, nullable
- latest observed-at, nullable

This records refresh outcome without mutating the original cached resource timestamps.

## 7. Canonical cache keys

Cache keys are deterministic implementation details and must have unit tests.

Rules:

- trim/normalize textual ids exactly as the request models already do;
- dates/ranges use UTC ISO-8601 values;
- nullable request values have an explicit empty marker;
- query key ordering is fixed;
- changing a request parameter changes the key;
- key generation is centralized in one utility, not duplicated across DAOs.

Example logical shapes:

```text
search|q=<query>|limit=<n>|cursor=<cursor-or-empty>
tide|station=<id>|start=<utc>|end=<utc>|interval=<seconds>
water|station=<id>|start=<utc-or-empty>|end=<utc-or-empty>|limit=<n>|cursor=<cursor-or-empty>
calendar|date=YYYY-MM-DD
station|id=<stationId>
```

Do not use `hashCode` as persistent identity because Dart hash behavior is not a stable storage contract.

## 8. Freshness model

`RemoteResource<T>` from #41 already preserves:

- `fetchedAtUtc`
- `CachePolicy.maxAge`
- `CachePolicy.staleWhileRevalidate`

#42 adds shared freshness helpers but does not replace those timestamps.

For a local cache entry at time `now`:

```text
freshUntil = fetchedAtUtc + maxAge
swrUntil   = freshUntil + staleWhileRevalidate
```

States:

- `fresh`: `now <= freshUntil`
- `staleRevalidatable`: `freshUntil < now <= swrUntil`
- `expired`: `now > swrUntil`

A cache policy with zero durations becomes expired immediately after fetch for caching policy purposes, but the last-known-good payload may still be retained for offline fallback unless explicitly removed by storage management.

The app never rewrites `fetchedAtUtc` merely because a cached value was read.

## 9. Cached repository behavior

`CachedPublicDataRepository` implements the existing `PublicDataRepository` interface and composes a local store plus a remote `PublicDataRepository`.

### 9.1 Fresh cache

If an exact cached resource exists and is fresh:

- return it immediately;
- no network request is required.

### 9.2 Stale-while-revalidate cache

If the exact cached resource is `staleRevalidatable`:

- return cached last-known-good immediately;
- trigger one de-duplicated refresh for that canonical key;
- a successful refresh validates and atomically replaces the local entry;
- a failed refresh records `sync_state` failure and leaves the cached payload unchanged.

Because the existing #41 interface returns a single `Future<RemoteResource<T>>`, it cannot emit both cached and refreshed values in one call. #42 therefore does **not** break the interface. Drift watch streams remain available at the local-store layer so #44 can subscribe through Riverpod/controller code when it needs live post-refresh updates.

### 9.3 Expired cache

If cache exists but is expired:

1. try remote first;
2. on success, validate/persist/return remote data;
3. on remote failure, return the unchanged last-known-good cached resource;
4. record the refresh failure in `sync_state`.

The returned resource retains its original old `fetchedAtUtc`, so consumers can identify it as stale/expired. The persistence layer never relabels it as fresh.

If no cache exists and remote fails, propagate the typed #41 `ApiFailure`.

### 9.4 Cancellation

Caller cancellation continues to flow to the remote request. Cache reads/transactions must not turn caller cancellation into retry loops. There are no hidden automatic transport retries in #42.

### 9.5 Search and paginated endpoints

Search and water-level pagination replay only an **exact cached request key**. #42 does not invent local cursor values or silently merge unrelated pages.

A successful remote response persists the page metadata/order plus normalized referenced records in one transaction.

## 10. Refresh de-duplication

Concurrent callers requesting the same stale/expired canonical resource must not fan out identical remote requests.

`CachedPublicDataRepository` keeps an in-memory map of in-flight refresh futures keyed by canonical resource key. The entry is removed in `finally` after completion/failure.

This is process-local coordination only; it is not persisted and does not replace database transactions.

## 11. Last-known-good semantics

A local row/set is considered last-known-good only after the corresponding #41 typed object has already been successfully parsed/validated.

Persistence never manufactures missing provenance or repairs malformed remote data.

Write order:

```text
remote HTTP
  -> #41 strict parse/validation
  -> typed RemoteResource<T>
  -> Drift transaction
  -> commit
```

Malformed remote responses fail before any local write.

## 12. Offline pack atomic replacement

The download/transport of full packs belongs to #46, but #42 provides the transactional persistence boundary.

Input to the store is already validated for checksum, supported pack schema version, and minimum app version.

Replacement contract:

1. begin one Drift transaction;
2. write/replace validated normalized entities;
3. replace membership rows for the pack;
4. write the new manifest **last**;
5. commit.

Any exception rolls back the entire transaction, leaving the old manifest and old data visible.

A test must inject a deterministic failure before manifest commit and prove that no partial replacement is observable.

## 13. Repository boundaries

Keep small focused interfaces:

```text
PublicDataCacheStore
  - exact get/put for search/station/tide/water/calendar resources
  - freshness-preserving RemoteResource reconstruction

FavoritesRepository
  - list/watch favorites
  - add/remove favorite

PreferencesRepository
  - typed get/set for approved local preferences

OfflinePackStore
  - list/read manifests
  - transactionally replace validated dataset
  - remove manifest/membership

SyncStateStore
  - read/watch refresh state
  - record attempt/success/failure
```

DAOs remain implementation details behind these interfaces.

## 14. Riverpod composition

Refactor provider composition without changing what feature widgets depend on:

```text
httpClientProvider
remotePublicDataRepositoryProvider -> HttpPublicDataRepository
appDatabaseProvider                -> AppDatabase
publicDataCacheStoreProvider
syncStateStoreProvider
publicDataRepositoryProvider       -> CachedPublicDataRepository
favoritesRepositoryProvider
preferencesRepositoryProvider
offlinePackStoreProvider
```

Tests and widgets may still override `publicDataRepositoryProvider` directly with a fake.

The #41 provider contract test is updated to prove:

- the remote provider builds `HttpPublicDataRepository` from overridden config/client;
- the application-facing provider builds a cached repository from overridden local/remote dependencies;
- construction sends no network request.

## 15. Generated code policy

Drift table/database definitions are handwritten; generated `.g.dart` output is committed.

Implementation workflow runs:

```bash
cd apps/mobile
dart run build_runner build --delete-conflicting-outputs
dart format lib test
flutter analyze
flutter test
```

Mobile CI gains a code-generation drift check:

```bash
dart run build_runner build --delete-conflicting-outputs
git diff --exit-code -- lib test pubspec.lock
```

The CI check must not rewrite unrelated Flutter-generated platform files.

## 16. Test architecture

### 16.1 Schema tests

- open a fresh in-memory current database;
- assert current schema/version and critical foreign keys/indexes;
- insert representative data and reconstruct the database around the same test executor/file where appropriate.

### 16.2 Migration tests

- repository-owned version-1 schema snapshot;
- populate representative cache/favorite/preference data;
- migrate v1 -> v2;
- verify original rows survive;
- verify offline-manifest/sync tables exist and accept current records;
- validate resulting schema against current Drift expectations.

### 16.3 Round-trip tests

For station/tide/water-level/calendar resources, assert round-trip equality for fields relied on by the domain contract, especially:

- datum
- unit
- timezone
- provenance
- generated/observed timestamps
- fetched-at
- Cache-Control freshness durations
- page order/cursor metadata

### 16.4 Repository cache-policy tests

Use fake clock + fake remote repository to prove:

- fresh cache causes zero remote calls;
- stale-revalidatable returns cache and starts one refresh;
- duplicate concurrent refreshes collapse to one remote call;
- successful refresh atomically replaces cache;
- failed refresh leaves last-known-good unchanged;
- expired cache tries remote first and falls back to old cache on failure;
- no-cache remote failure propagates `ApiFailure`;
- caller cancellation does not create retries.

### 16.5 Local user-data tests

- favorite survives repository/database reconstruction;
- removing a favorite is durable;
- typed preference survives reconstruction;
- cache eviction/replacement does not remove favorite rows.

### 16.6 Offline dataset transaction tests

- valid replacement commits entities + membership + manifest;
- injected mid-transaction failure preserves previous manifest/data;
- unsupported/invalid dataset is rejected before write transaction.

### 16.7 Existing regression gates

The full pre-existing mobile suite, Android debug build, iOS no-sign build, repository CI, ingestion integration, and Phase 2 backend exit gate must remain green before merge.

## 17. File/module layout

Expected implementation shape:

```text
apps/mobile/lib/
├── core/
│   └── database/
│       ├── app_database.dart
│       ├── app_database.g.dart
│       ├── database_provider.dart
│       ├── tables/
│       └── migrations/
├── features/
│   ├── public_data/
│   │   └── data/
│   │       ├── cached_public_data_repository.dart
│   │       ├── public_data_cache_store.dart
│   │       └── public_data_providers.dart
│   ├── favorites/
│   │   └── data/
│   ├── settings/
│   │   └── data/
│   └── offline/
│       └── data/
└── shared/
    └── freshness/
```

Exact splitting may be adjusted to keep files small, but dependency direction and responsibilities above are fixed.

Tests mirror production modules under `apps/mobile/test/` and use repository-owned fixtures from #41 where practical.

## 18. Error handling

Database exceptions do not get reclassified as network errors.

Introduce a small local persistence failure type only where callers need to distinguish storage failures from remote `ApiFailure`. Do not expose raw sqlite exception strings to product UI.

If a remote refresh succeeds but the local persistence write fails:

- return the valid remote value to the current caller;
- record/report storage failure where possible;
- do not delete or partially replace old cached data;
- a later request may try refresh/persistence again.

## 19. Storage cleanup boundaries

#42 provides deletion primitives but not the final storage-management UI.

Rules:

- deleting a pack removes its manifest/membership transactionally;
- shared normalized cache records may remain if referenced by another pack or runtime cache;
- favorites are never cascade-deleted by cache/pack cleanup;
- destructive global cache clear must preserve favorites/preferences unless the caller explicitly requests local user-data reset.

Fine-grained orphan compaction can be implemented later if measured storage usage justifies it.

## 20. Security and privacy

The database may contain public hydrology/tide/calendar data and local app preferences/favorites. It must not contain:

- admin bearer tokens;
- passwords;
- API secrets;
- unnecessary personal information.

If account authentication is introduced later, secrets must use platform secure storage and remain outside this database unless a separate security review explicitly changes the rule.

## 21. Performance constraints

- use indexes for station id, search-page key, tide series key/time, water observation station/time, favorite station id, and pack id;
- use transactions/batch inserts for point/observation sets;
- do not deserialize huge JSON blobs for normal tide/water queries;
- keep database work off the UI isolate;
- avoid an unbounded in-memory cache in addition to SQLite.

Performance optimization beyond these obvious constraints requires profiling rather than speculative complexity.

## 22. Compatibility with #43/#44/#45/#46

- #43 may build app shell/accessibility independently; it does not need database internals.
- #44 consumes `publicDataRepositoryProvider`; no raw Drift/HTTP dependency is required.
- #45 consumes favorites/preferences interfaces rather than Drift tables.
- #46 consumes `OfflinePackStore` for validated pack replacement and builds download/UX orchestration on top.

No child issue may bypass these boundaries merely to access a table directly from a widget.

## 23. Definition of done for #42

#42 is complete only when all of the following are true:

1. Drift dependencies are pinned and lockfile is committed.
2. Current schema v2 and generated schema snapshots are committed.
3. Fresh database tests pass.
4. Real v1 -> v2 migration tests pass.
5. Station/tide/water/calendar cache round-trip preserves contract metadata.
6. Fresh/stale/expired/LKG repository behavior is tested.
7. Concurrent stale refresh is de-duplicated.
8. Failed refresh preserves last-known-good data.
9. Favorites/preferences survive reconstruction.
10. Offline dataset replacement is transactionally atomic with rollback proof.
11. Widgets remain independent of SQLite/raw HTTP.
12. No credentials or formulas enter the persistence layer.
13. Flutter format/analyze/test, Android debug, and iOS no-sign gates pass.
14. Existing repository/backend regression workflows stay green.
15. Documentation records schema/freshness/migration behavior and handoff to #44/#45/#46.

## 24. Implementation sequencing constraint

Implementation follows TDD and must not start from tables first merely because the schema is known.

The plan should proceed in vertical contracts:

1. dependency/codegen + schema/migration RED tests;
2. minimal database v1/v2 lifecycle GREEN;
3. cache round-trip RED/GREEN by resource type;
4. favorites/preferences persistence RED/GREEN;
5. cached repository freshness/LKG RED/GREEN;
6. offline atomic replacement RED/GREEN;
7. provider composition;
8. docs/scope review/fresh merge-ref CI.

Each production behavior must have a failing test or contract check before its implementation.