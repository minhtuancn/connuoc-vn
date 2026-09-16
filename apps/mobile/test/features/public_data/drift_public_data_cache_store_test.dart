import 'dart:convert';
import 'dart:io';

import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/features/public_data/data/drift_public_data_cache_store.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_requests.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, Object?> fixture(String name) {
  final raw = File('test/fixtures/public_api/$name.json').readAsStringSync();
  return (jsonDecode(raw) as Map).cast<String, Object?>();
}

RemoteResource<T> cached<T>(T value) {
  return RemoteResource<T>(
    value: value,
    fetchedAtUtc: DateTime.parse('2026-09-15T02:30:00Z'),
    cachePolicy: const CachePolicy(
      maxAge: Duration(minutes: 10),
      staleWhileRevalidate: Duration(minutes: 20),
    ),
  );
}

void expectPolicyAndFetchTime<T>(RemoteResource<T> resource) {
  expect(resource.fetchedAtUtc, DateTime.parse('2026-09-15T02:30:00Z'));
  expect(resource.cachePolicy.maxAge, const Duration(minutes: 10));
  expect(
    resource.cachePolicy.staleWhileRevalidate,
    const Duration(minutes: 20),
  );
}

void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase.inMemory();
  });

  tearDown(() async {
    await database.close();
  });

  test('station survives cache-store reconstruction with full provenance', () async {
    final station = StationDetails.fromJson(fixture('station'));
    final firstStore = DriftPublicDataCacheStore(database);

    await firstStore.putStation(cached(station));

    final reconstructedStore = DriftPublicDataCacheStore(database);
    final restored = await reconstructedStore.getStation(station.id);

    expect(restored, isNotNull);
    expectPolicyAndFetchTime(restored!);
    expect(restored.value.id, station.id);
    expect(restored.value.name, station.name);
    expect(restored.value.timeZone, station.timeZone);
    expect(restored.value.defaultDatumId, 'local-gauge-fixture');
    expect(restored.value.meta.generatedAtUtc, station.meta.generatedAtUtc);
    expect(restored.value.provenance?.sourceKey, 'public-api-fixture');
    expect(
      restored.value.provenance?.rawChecksumSha256,
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    );
    expect(
      restored.value.provenance?.observedAtUtc,
      DateTime.parse('2026-09-15T01:00:00Z'),
    );
    expect(restored.value.aliases, station.aliases);
  });

  test('search summary never erases station detail-only metadata', () async {
    final station = StationDetails.fromJson(fixture('station'));
    final search = LocationSearchPage.fromJson(fixture('search'));
    final store = DriftPublicDataCacheStore(database);
    final request = SearchLocationsRequest(query: 'Public API', limit: 20);

    await store.putStation(cached(station));
    await store.putSearch(request, cached(search));

    final restoredStation = await store.getStation(station.id);
    final restoredSearch = await store.getSearch(request);

    expect(restoredStation, isNotNull);
    expect(restoredStation!.value.defaultDatumId, 'local-gauge-fixture');
    expect(restoredStation.value.provenance?.parserVersion, 'fixture-parser@1');
    expect(restoredSearch, isNotNull);
    expect(restoredSearch!.value.items.single.id, station.id);
    expect(restoredSearch.value.meta.nextCursor, 'eyJvZmZzZXQiOjF9');
    expectPolicyAndFetchTime(restoredSearch);
  });

  test('tide round trip preserves datum, unit, timezone and model provenance', () async {
    final station = StationDetails.fromJson(fixture('station'));
    final tide = TideSeries.fromJson(fixture('tide'));
    final request = TideRequest(
      stationId: tide.stationId,
      startUtc: tide.startUtc,
      endUtc: tide.endUtc,
      intervalSeconds: tide.intervalSeconds,
    );
    final firstStore = DriftPublicDataCacheStore(database);

    await firstStore.putStation(cached(station));
    await firstStore.putTide(request, cached(tide));

    final reconstructedStore = DriftPublicDataCacheStore(database);
    final restored = await reconstructedStore.getTide(request);

    expect(restored, isNotNull);
    expectPolicyAndFetchTime(restored!);
    expect(restored.value.datumId, tide.datumId);
    expect(restored.value.unit, WaterLevelUnit.m);
    expect(restored.value.timeZone, 'Asia/Ho_Chi_Minh');
    expect(restored.value.phaseConvention, tide.phaseConvention);
    expect(restored.value.referenceEpochUtc, tide.referenceEpochUtc);
    expect(restored.value.generatedAtUtc, tide.generatedAtUtc);
    expect(restored.value.provenance.sourceKey, 'public-api-fixture');
    expect(restored.value.provenance.importRunId, tide.provenance.importRunId);
    expect(restored.value.points, hasLength(3));
    expect(restored.value.points.first.timestampUtc, tide.points.first.timestampUtc);
    expect(restored.value.points.first.value, tide.points.first.value);
  });

  test('water-level round trip preserves observation provenance and page order', () async {
    final page = WaterLevelPage.fromJson(fixture('water_levels'));
    final request = WaterLevelRequest(stationId: page.station.id, limit: 20);
    final firstStore = DriftPublicDataCacheStore(database);

    await firstStore.putWaterLevels(request, cached(page));

    final reconstructedStore = DriftPublicDataCacheStore(database);
    final restored = await reconstructedStore.getWaterLevels(request);

    expect(restored, isNotNull);
    expectPolicyAndFetchTime(restored!);
    expect(restored.value.station.id, page.station.id);
    expect(restored.value.station.timeZone, 'Asia/Ho_Chi_Minh');
    expect(restored.value.station.defaultDatumId, 'local-gauge-fixture');
    expect(restored.value.meta.generatedAtUtc, page.meta.generatedAtUtc);
    expect(
      restored.value.meta.latestObservedAtUtc,
      DateTime.parse('2026-09-15T01:00:00Z'),
    );
    expect(restored.value.meta.nextCursor, 'eyJvZmZzZXQiOjF9');

    final observation = restored.value.items.single;
    expect(observation.sourceRecordKey, 'public-api-obs-2');
    expect(observation.value, 130.2);
    expect(observation.unit, WaterLevelUnit.cm);
    expect(observation.datumId, 'local-gauge-fixture');
    expect(observation.qualityState, QualityState.good);
    expect(observation.observedAtUtc, DateTime.parse('2026-09-15T01:00:00Z'));
    expect(observation.provenance.sourceKey, 'public-api-fixture');
    expect(observation.provenance.parserVersion, 'fixture-parser@1');
    expect(observation.provenance.normalizerVersion, 'fixture-normalizer@1');
  });
}
