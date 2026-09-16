import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:connuoc_viet/features/offline/data/sync_state_store.dart';
import 'package:drift/drift.dart';

class DriftSyncStateStore implements SyncStateStore {
  DriftSyncStateStore(this._database);

  final AppDatabase _database;

  @override
  Future<void> recordAttempt({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
  }) async {
    final existing = await _get(resourceKey);
    await _database.into(_database.syncStates).insertOnConflictUpdate(
      SyncStatesCompanion.insert(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        lastAttemptAtUtc: Value(atUtc.toUtc()),
        lastSuccessfulRefreshAtUtc: Value(existing?.lastSuccessfulRefreshAtUtc),
        lastFailureKind: Value(existing?.lastFailureKind),
        latestRemoteGeneratedAtUtc: Value(existing?.latestRemoteGeneratedAtUtc),
        latestObservedAtUtc: Value(existing?.latestObservedAtUtc),
      ),
    );
  }

  @override
  Future<void> recordSuccess({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    DateTime? latestRemoteGeneratedAtUtc,
    DateTime? latestObservedAtUtc,
  }) async {
    final existing = await _get(resourceKey);
    final successAt = atUtc.toUtc();
    await _database.into(_database.syncStates).insertOnConflictUpdate(
      SyncStatesCompanion.insert(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        lastAttemptAtUtc: Value(successAt),
        lastSuccessfulRefreshAtUtc: Value(successAt),
        lastFailureKind: const Value(null),
        latestRemoteGeneratedAtUtc: Value(
          latestRemoteGeneratedAtUtc?.toUtc() ??
              existing?.latestRemoteGeneratedAtUtc,
        ),
        latestObservedAtUtc: Value(
          latestObservedAtUtc?.toUtc() ?? existing?.latestObservedAtUtc,
        ),
      ),
    );
  }

  @override
  Future<void> recordFailure({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    required String failureKind,
  }) async {
    final existing = await _get(resourceKey);
    await _database.into(_database.syncStates).insertOnConflictUpdate(
      SyncStatesCompanion.insert(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        lastAttemptAtUtc: Value(atUtc.toUtc()),
        lastSuccessfulRefreshAtUtc: Value(existing?.lastSuccessfulRefreshAtUtc),
        lastFailureKind: Value(failureKind),
        latestRemoteGeneratedAtUtc: Value(existing?.latestRemoteGeneratedAtUtc),
        latestObservedAtUtc: Value(existing?.latestObservedAtUtc),
      ),
    );
  }

  Future<SyncState?> _get(String resourceKey) {
    return (_database.select(_database.syncStates)
          ..where((table) => table.resourceKey.equals(resourceKey)))
        .getSingleOrNull();
  }
}
