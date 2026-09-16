import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:connuoc_viet/core/database/cache_key.dart';
import 'package:connuoc_viet/core/network/api_failure.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/core/network/request_cancellation.dart';
import 'package:connuoc_viet/features/offline/data/sync_state_store.dart';
import 'package:connuoc_viet/features/public_data/data/cached_public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/data/public_data_cache_store.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, Object?> fixture(String name) {
  final raw = File('test/fixtures/public_api/$name.json').readAsStringSync();
  return (jsonDecode(raw) as Map).cast<String, Object?>();
}

RemoteResource<T> resource<T>(
  T value, {
  required DateTime fetchedAtUtc,
  Duration maxAge = const Duration(minutes: 10),
  Duration staleWhileRevalidate = const Duration(minutes: 20),
}) {
  return RemoteResource<T>(
    value: value,
    fetchedAtUtc: fetchedAtUtc,
    cachePolicy: CachePolicy(
      maxAge: maxAge,
      staleWhileRevalidate: staleWhileRevalidate,
    ),
  );
}

class FakeCacheStore implements PublicDataCacheStore {
  RemoteResource<StationDetails>? station;
  int stationPutCount = 0;

  @override
  Future<RemoteResource<StationDetails>?> getStation(String stationId) async {
    return station;
  }

  @override
  Future<void> putStation(RemoteResource<StationDetails> resource) async {
    station = resource;
    stationPutCount++;
  }

  @override
  Future<RemoteResource<LocationSearchPage>?> getSearch(
    SearchLocationsRequest request,
  ) async => null;

  @override
  Future<void> putSearch(
    SearchLocationsRequest request,
    RemoteResource<LocationSearchPage> resource,
  ) async {}

  @override
  Future<RemoteResource<TideSeries>?> getTide(TideRequest request) async =>
      null;

  @override
  Future<void> putTide(
    TideRequest request,
    RemoteResource<TideSeries> resource,
  ) async {}

  @override
  Future<RemoteResource<WaterLevelPage>?> getWaterLevels(
    WaterLevelRequest request,
  ) async => null;

  @override
  Future<void> putWaterLevels(
    WaterLevelRequest request,
    RemoteResource<WaterLevelPage> resource,
  ) async {}

  @override
  Future<RemoteResource<CalendarDay>?> getCalendar(
    CalendarRequest request,
  ) async => null;

  @override
  Future<void> putCalendar(
    CalendarRequest request,
    RemoteResource<CalendarDay> resource,
  ) async {}
}

class FakeRemoteRepository implements PublicDataRepository {
  int stationCalls = 0;
  RequestCancellation? lastCancellation;
  Future<RemoteResource<StationDetails>> Function(
    String stationId,
    RequestCancellation? cancellation,
  )?
  onGetStation;

  @override
  Future<RemoteResource<StationDetails>> getStation(
    String stationId, {
    RequestCancellation? cancellation,
  }) {
    stationCalls++;
    lastCancellation = cancellation;
    final handler = onGetStation;
    if (handler == null) {
      throw StateError('getStation handler not configured');
    }
    return handler(stationId, cancellation);
  }

  @override
  Future<RemoteResource<LocationSearchPage>> searchLocations(
    SearchLocationsRequest request, {
    RequestCancellation? cancellation,
  }) => throw UnimplementedError();

  @override
  Future<RemoteResource<TideSeries>> getTide(
    TideRequest request, {
    RequestCancellation? cancellation,
  }) => throw UnimplementedError();

  @override
  Future<RemoteResource<WaterLevelPage>> getWaterLevels(
    WaterLevelRequest request, {
    RequestCancellation? cancellation,
  }) => throw UnimplementedError();

  @override
  Future<RemoteResource<CalendarDay>> getCalendar(
    CalendarRequest request, {
    RequestCancellation? cancellation,
  }) => throw UnimplementedError();
}

class FakeSyncStateStore implements SyncStateStore {
  final attempts = <String>[];
  final successes = <String>[];
  final failures = <String>[];

  @override
  Future<void> recordAttempt({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
  }) async {
    attempts.add(resourceKey);
  }

  @override
  Future<void> recordSuccess({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    DateTime? latestRemoteGeneratedAtUtc,
    DateTime? latestObservedAtUtc,
  }) async {
    successes.add(resourceKey);
  }

  @override
  Future<void> recordFailure({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    required String failureKind,
  }) async {
    failures.add('$resourceKey:$failureKind');
  }
}

void main() {
  final now = DateTime.utc(2026, 9, 16, 1);
  late StationDetails station;
  late StationDetails updatedStation;
  late FakeCacheStore cache;
  late FakeRemoteRepository remote;
  late FakeSyncStateStore sync;
  late CachedPublicDataRepository repository;

  setUp(() {
    station = StationDetails.fromJson(fixture('station'));
    final updatedJson = Map<String, Object?>.from(fixture('station'));
    updatedJson['name'] = 'Public API Station Updated';
    updatedStation = StationDetails.fromJson(updatedJson);
    cache = FakeCacheStore();
    remote = FakeRemoteRepository();
    sync = FakeSyncStateStore();
    repository = CachedPublicDataRepository(
      remote: remote,
      cacheStore: cache,
      syncStateStore: sync,
      nowUtc: () => now,
    );
  });

  test('fresh cache returns immediately without calling remote', () async {
    cache.station = resource(
      station,
      fetchedAtUtc: now.subtract(const Duration(minutes: 5)),
    );

    final result = await repository.getStation(station.id);

    expect(identical(result, cache.station), isTrue);
    expect(remote.stationCalls, 0);
    expect(sync.attempts, isEmpty);
  });

  test(
    'stale cache returns immediately and refreshes once in background',
    () async {
      final old = resource(
        station,
        fetchedAtUtc: now.subtract(const Duration(minutes: 15)),
      );
      final refreshed = resource(updatedStation, fetchedAtUtc: now);
      final refreshGate = Completer<RemoteResource<StationDetails>>();
      cache.station = old;
      remote.onGetStation = (_, _) => refreshGate.future;

      final result = await repository.getStation(station.id);

      expect(identical(result, old), isTrue);
      expect(remote.stationCalls, 1);
      refreshGate.complete(refreshed);
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);
      expect(cache.station?.value.name, 'Public API Station Updated');
      expect(cache.stationPutCount, 1);
      expect(sync.successes, [cacheKeyForStation(station.id)]);
    },
  );

  test('two concurrent stale reads share one background refresh', () async {
    final old = resource(
      station,
      fetchedAtUtc: now.subtract(const Duration(minutes: 15)),
    );
    final refreshGate = Completer<RemoteResource<StationDetails>>();
    cache.station = old;
    remote.onGetStation = (_, _) => refreshGate.future;

    final results = await Future.wait([
      repository.getStation(station.id),
      repository.getStation(station.id),
    ]);

    expect(results, hasLength(2));
    expect(results.every((item) => identical(item, old)), isTrue);
    expect(remote.stationCalls, 1);
    refreshGate.complete(resource(updatedStation, fetchedAtUtc: now));
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);
  });

  test(
    'expired cache uses successful remote response and replaces cache',
    () async {
      final old = resource(
        station,
        fetchedAtUtc: now.subtract(const Duration(minutes: 31)),
      );
      final refreshed = resource(updatedStation, fetchedAtUtc: now);
      cache.station = old;
      remote.onGetStation = (_, _) async => refreshed;

      final result = await repository.getStation(station.id);

      expect(identical(result, refreshed), isTrue);
      expect(cache.station?.value.name, 'Public API Station Updated');
      expect(cache.stationPutCount, 1);
      expect(sync.attempts, [cacheKeyForStation(station.id)]);
      expect(sync.successes, [cacheKeyForStation(station.id)]);
    },
  );

  test('two concurrent expired reads share one foreground refresh', () async {
    final old = resource(
      station,
      fetchedAtUtc: now.subtract(const Duration(minutes: 31)),
    );
    final refreshGate = Completer<RemoteResource<StationDetails>>();
    cache.station = old;
    remote.onGetStation = (_, _) => refreshGate.future;

    final first = repository.getStation(station.id);
    final second = repository.getStation(station.id);
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);

    expect(remote.stationCalls, 1);

    final refreshed = resource(updatedStation, fetchedAtUtc: now);
    refreshGate.complete(refreshed);
    final results = await Future.wait([first, second]);

    expect(results.every((item) => identical(item, refreshed)), isTrue);
    expect(cache.stationPutCount, 1);
  });

  test(
    'expired cache falls back to last known good when remote fails',
    () async {
      final old = resource(
        station,
        fetchedAtUtc: now.subtract(const Duration(minutes: 31)),
      );
      cache.station = old;
      remote.onGetStation = (_, _) async =>
          throw const ApiFailure(kind: ApiFailureKind.network);

      final result = await repository.getStation(station.id);

      expect(identical(result, old), isTrue);
      expect(result.fetchedAtUtc, old.fetchedAtUtc);
      expect(cache.stationPutCount, 0);
      expect(sync.failures.single, contains('network'));
    },
  );

  test('no cache propagates remote failure', () async {
    remote.onGetStation = (_, _) async => throw const ApiFailure(
      kind: ApiFailureKind.unavailable,
      statusCode: 503,
    );

    await expectLater(
      repository.getStation(station.id),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.kind,
          'kind',
          ApiFailureKind.unavailable,
        ),
      ),
    );
    expect(cache.stationPutCount, 0);
  });

  test('malformed remote failure never overwrites expired cache', () async {
    final old = resource(
      station,
      fetchedAtUtc: now.subtract(const Duration(minutes: 31)),
    );
    cache.station = old;
    remote.onGetStation = (_, _) async =>
        throw const ApiFailure(kind: ApiFailureKind.malformedResponse);

    final result = await repository.getStation(station.id);

    expect(identical(result, old), isTrue);
    expect(cache.stationPutCount, 0);
    expect(cache.station?.value.name, station.name);
  });

  test('caller cancellation reaches remote and is not retried', () async {
    final cancellation = RequestCancellation();
    cancellation.cancel();
    remote.onGetStation = (_, receivedCancellation) async {
      expect(identical(receivedCancellation, cancellation), isTrue);
      throw const ApiFailure(kind: ApiFailureKind.cancelled);
    };

    await expectLater(
      repository.getStation(station.id, cancellation: cancellation),
      throwsA(
        isA<ApiFailure>().having(
          (failure) => failure.kind,
          'kind',
          ApiFailureKind.cancelled,
        ),
      ),
    );

    expect(remote.stationCalls, 1);
    expect(cache.stationPutCount, 0);
  });
}
