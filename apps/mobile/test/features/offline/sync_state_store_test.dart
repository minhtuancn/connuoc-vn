import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:connuoc_viet/features/offline/data/drift_sync_state_store.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late AppDatabase database;
  late DriftSyncStateStore store;

  setUp(() {
    database = AppDatabase.inMemory();
    store = DriftSyncStateStore(database);
  });

  tearDown(() async {
    await database.close();
  });

  test(
    'attempt success and later failure preserve last successful metadata',
    () async {
      final attempt = DateTime.utc(2026, 9, 16, 1);
      final success = DateTime.utc(2026, 9, 16, 1, 1);
      final failure = DateTime.utc(2026, 9, 16, 2);
      final generated = DateTime.utc(2026, 9, 16, 0, 59);
      final observed = DateTime.utc(2026, 9, 16, 0, 55);

      await store.recordAttempt(
        resourceKey: 'station|id=station-1',
        resourceKind: 'station',
        atUtc: attempt,
      );
      await store.recordSuccess(
        resourceKey: 'station|id=station-1',
        resourceKind: 'station',
        atUtc: success,
        latestRemoteGeneratedAtUtc: generated,
        latestObservedAtUtc: observed,
      );
      await store.recordFailure(
        resourceKey: 'station|id=station-1',
        resourceKind: 'station',
        atUtc: failure,
        failureKind: 'network',
      );

      final row =
          await (database.select(database.syncStates)..where(
                (table) => table.resourceKey.equals('station|id=station-1'),
              ))
              .getSingle();

      expect(row.resourceKind, 'station');
      expect(row.lastAttemptAtUtc?.toUtc(), failure);
      expect(row.lastSuccessfulRefreshAtUtc?.toUtc(), success);
      expect(row.lastFailureKind, 'network');
      expect(row.latestRemoteGeneratedAtUtc?.toUtc(), generated);
      expect(row.latestObservedAtUtc?.toUtc(), observed);
    },
  );

  test(
    'new success clears previous failure without erasing optional metadata',
    () async {
      final firstSuccess = DateTime.utc(2026, 9, 16, 1);
      final generated = DateTime.utc(2026, 9, 16, 0, 59);

      await store.recordSuccess(
        resourceKey: 'calendar|date=2026-09-16',
        resourceKind: 'calendar',
        atUtc: firstSuccess,
        latestRemoteGeneratedAtUtc: generated,
      );
      await store.recordFailure(
        resourceKey: 'calendar|date=2026-09-16',
        resourceKind: 'calendar',
        atUtc: DateTime.utc(2026, 9, 16, 2),
        failureKind: 'timeout',
      );
      await store.recordSuccess(
        resourceKey: 'calendar|date=2026-09-16',
        resourceKind: 'calendar',
        atUtc: DateTime.utc(2026, 9, 16, 3),
      );

      final row =
          await (database.select(database.syncStates)..where(
                (table) => table.resourceKey.equals('calendar|date=2026-09-16'),
              ))
              .getSingle();

      expect(row.lastFailureKind, isNull);
      expect(row.latestRemoteGeneratedAtUtc?.toUtc(), generated);
      expect(row.latestObservedAtUtc, isNull);
    },
  );
}
