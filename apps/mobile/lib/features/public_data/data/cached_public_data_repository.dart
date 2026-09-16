import 'dart:async';

import 'package:connuoc_viet/core/database/cache_freshness.dart';
import 'package:connuoc_viet/core/database/cache_key.dart';
import 'package:connuoc_viet/core/network/api_failure.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/core/network/request_cancellation.dart';
import 'package:connuoc_viet/features/offline/data/sync_state_store.dart';
import 'package:connuoc_viet/features/public_data/data/public_data_cache_store.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_repository.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';

DateTime _systemUtcNow() => DateTime.now().toUtc();

class CachedPublicDataRepository implements PublicDataRepository {
  CachedPublicDataRepository({
    required PublicDataRepository remote,
    required PublicDataCacheStore cacheStore,
    required SyncStateStore syncStateStore,
    DateTime Function()? nowUtc,
  }) : _remote = remote,
       _cacheStore = cacheStore,
       _syncStateStore = syncStateStore,
       _nowUtc = nowUtc ?? _systemUtcNow;

  final PublicDataRepository _remote;
  final PublicDataCacheStore _cacheStore;
  final SyncStateStore _syncStateStore;
  final DateTime Function() _nowUtc;
  final Map<String, Future<void>> _inFlightRefreshes = {};

  @override
  Future<RemoteResource<LocationSearchPage>> searchLocations(
    SearchLocationsRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _readThrough<LocationSearchPage>(
      resourceKey: cacheKeyForSearch(request),
      resourceKind: 'search',
      loadCached: () => _cacheStore.getSearch(request),
      loadRemote: () =>
          _remote.searchLocations(request, cancellation: cancellation),
      loadRemoteInBackground: () => _remote.searchLocations(request),
      saveCached: (resource) => _cacheStore.putSearch(request, resource),
    );
  }

  @override
  Future<RemoteResource<StationDetails>> getStation(
    String stationId, {
    RequestCancellation? cancellation,
  }) {
    return _readThrough<StationDetails>(
      resourceKey: cacheKeyForStation(stationId),
      resourceKind: 'station',
      loadCached: () => _cacheStore.getStation(stationId),
      loadRemote: () => _remote.getStation(
        stationId,
        cancellation: cancellation,
      ),
      loadRemoteInBackground: () => _remote.getStation(stationId),
      saveCached: _cacheStore.putStation,
    );
  }

  @override
  Future<RemoteResource<TideSeries>> getTide(
    TideRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _readThrough<TideSeries>(
      resourceKey: cacheKeyForTide(request),
      resourceKind: 'tide',
      loadCached: () => _cacheStore.getTide(request),
      loadRemote: () => _remote.getTide(request, cancellation: cancellation),
      loadRemoteInBackground: () => _remote.getTide(request),
      saveCached: (resource) => _cacheStore.putTide(request, resource),
    );
  }

  @override
  Future<RemoteResource<WaterLevelPage>> getWaterLevels(
    WaterLevelRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _readThrough<WaterLevelPage>(
      resourceKey: cacheKeyForWaterLevels(request),
      resourceKind: 'water-level',
      loadCached: () => _cacheStore.getWaterLevels(request),
      loadRemote: () =>
          _remote.getWaterLevels(request, cancellation: cancellation),
      loadRemoteInBackground: () => _remote.getWaterLevels(request),
      saveCached: (resource) => _cacheStore.putWaterLevels(request, resource),
    );
  }

  @override
  Future<RemoteResource<CalendarDay>> getCalendar(
    CalendarRequest request, {
    RequestCancellation? cancellation,
  }) {
    return _readThrough<CalendarDay>(
      resourceKey: cacheKeyForCalendar(request),
      resourceKind: 'calendar',
      loadCached: () => _cacheStore.getCalendar(request),
      loadRemote: () =>
          _remote.getCalendar(request, cancellation: cancellation),
      loadRemoteInBackground: () => _remote.getCalendar(request),
      saveCached: (resource) => _cacheStore.putCalendar(request, resource),
    );
  }

  Future<RemoteResource<T>> _readThrough<T>({
    required String resourceKey,
    required String resourceKind,
    required Future<RemoteResource<T>?> Function() loadCached,
    required Future<RemoteResource<T>> Function() loadRemote,
    required Future<RemoteResource<T>> Function() loadRemoteInBackground,
    required Future<void> Function(RemoteResource<T>) saveCached,
  }) async {
    final cached = await loadCached();
    if (cached != null) {
      final freshness = classifyResourceFreshness(cached, _nowUtc());
      if (freshness == CacheFreshness.fresh) {
        return cached;
      }
      if (freshness == CacheFreshness.staleRevalidatable) {
        _scheduleBackgroundRefresh<T>(
          resourceKey: resourceKey,
          resourceKind: resourceKind,
          loadRemote: loadRemoteInBackground,
          saveCached: saveCached,
        );
        return cached;
      }
    }

    try {
      return await _refreshAndStore<T>(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        loadRemote: loadRemote,
        saveCached: saveCached,
      );
    } catch (error, stackTrace) {
      if (cached != null) {
        return cached;
      }
      Error.throwWithStackTrace(error, stackTrace);
    }
  }

  void _scheduleBackgroundRefresh<T>({
    required String resourceKey,
    required String resourceKind,
    required Future<RemoteResource<T>> Function() loadRemote,
    required Future<void> Function(RemoteResource<T>) saveCached,
  }) {
    if (_inFlightRefreshes.containsKey(resourceKey)) {
      return;
    }

    final task = _runBackgroundRefresh<T>(
      resourceKey: resourceKey,
      resourceKind: resourceKind,
      loadRemote: loadRemote,
      saveCached: saveCached,
    );
    _inFlightRefreshes[resourceKey] = task;
    unawaited(
      task.whenComplete(() {
        if (identical(_inFlightRefreshes[resourceKey], task)) {
          _inFlightRefreshes.remove(resourceKey);
        }
      }),
    );
  }

  Future<void> _runBackgroundRefresh<T>({
    required String resourceKey,
    required String resourceKind,
    required Future<RemoteResource<T>> Function() loadRemote,
    required Future<void> Function(RemoteResource<T>) saveCached,
  }) async {
    try {
      await _refreshAndStore<T>(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        loadRemote: loadRemote,
        saveCached: saveCached,
      );
    } catch (_) {
      // A stale read already returned last-known-good data. The failure is
      // recorded in SyncStateStore and must not surface as an unhandled error.
    }
  }

  Future<RemoteResource<T>> _refreshAndStore<T>({
    required String resourceKey,
    required String resourceKind,
    required Future<RemoteResource<T>> Function() loadRemote,
    required Future<void> Function(RemoteResource<T>) saveCached,
  }) async {
    final attemptedAtUtc = _nowUtc().toUtc();
    await _recordAttemptSafely(
      resourceKey: resourceKey,
      resourceKind: resourceKind,
      atUtc: attemptedAtUtc,
    );

    try {
      final remoteResource = await loadRemote();
      await saveCached(remoteResource);
      final timestamps = _timestampsFor(remoteResource.value);
      await _recordSuccessSafely(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        atUtc: _nowUtc().toUtc(),
        latestRemoteGeneratedAtUtc: timestamps.generatedAtUtc,
        latestObservedAtUtc: timestamps.observedAtUtc,
      );
      return remoteResource;
    } catch (error, stackTrace) {
      await _recordFailureSafely(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        atUtc: _nowUtc().toUtc(),
        failureKind: _failureKind(error),
      );
      Error.throwWithStackTrace(error, stackTrace);
    }
  }

  Future<void> _recordAttemptSafely({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
  }) async {
    try {
      await _syncStateStore.recordAttempt(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        atUtc: atUtc,
      );
    } catch (_) {
      // Sync metadata must never make public data unavailable.
    }
  }

  Future<void> _recordSuccessSafely({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    DateTime? latestRemoteGeneratedAtUtc,
    DateTime? latestObservedAtUtc,
  }) async {
    try {
      await _syncStateStore.recordSuccess(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        atUtc: atUtc,
        latestRemoteGeneratedAtUtc: latestRemoteGeneratedAtUtc,
        latestObservedAtUtc: latestObservedAtUtc,
      );
    } catch (_) {
      // Sync metadata must never make public data unavailable.
    }
  }

  Future<void> _recordFailureSafely({
    required String resourceKey,
    required String resourceKind,
    required DateTime atUtc,
    required String failureKind,
  }) async {
    try {
      await _syncStateStore.recordFailure(
        resourceKey: resourceKey,
        resourceKind: resourceKind,
        atUtc: atUtc,
        failureKind: failureKind,
      );
    } catch (_) {
      // Preserve the original remote/cache failure.
    }
  }
}

String _failureKind(Object error) {
  return error is ApiFailure ? error.kind.name : error.runtimeType.toString();
}

_ResourceTimestamps _timestampsFor(Object value) {
  if (value is LocationSearchPage) {
    return _ResourceTimestamps(generatedAtUtc: value.meta.generatedAtUtc);
  }
  if (value is StationDetails) {
    return _ResourceTimestamps(
      generatedAtUtc: value.meta.generatedAtUtc,
      observedAtUtc: value.provenance?.observedAtUtc,
    );
  }
  if (value is TideSeries) {
    return _ResourceTimestamps(generatedAtUtc: value.generatedAtUtc);
  }
  if (value is WaterLevelPage) {
    return _ResourceTimestamps(
      generatedAtUtc: value.meta.generatedAtUtc,
      observedAtUtc: value.meta.latestObservedAtUtc,
    );
  }
  if (value is CalendarDay) {
    return _ResourceTimestamps(generatedAtUtc: value.generatedAtUtc);
  }
  return const _ResourceTimestamps();
}

class _ResourceTimestamps {
  const _ResourceTimestamps({this.generatedAtUtc, this.observedAtUtc});

  final DateTime? generatedAtUtc;
  final DateTime? observedAtUtc;
}
