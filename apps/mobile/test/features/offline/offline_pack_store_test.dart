import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:connuoc_viet/core/database/cache_key.dart';
import 'package:connuoc_viet/core/network/cache_policy.dart';
import 'package:connuoc_viet/features/offline/data/drift_offline_pack_store.dart';
import 'package:connuoc_viet/features/offline/domain/offline_pack.dart';
import 'package:connuoc_viet/features/public_data/data/drift_public_data_cache_store.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_models.dart';
import 'package:connuoc_viet/features/public_data/domain/public_data_repository.dart';
import 'package:drift/drift.dart';
import 'package:flutter_test/flutter_test.dart';

RemoteResource<StationDetails> stationResource(
  String id, {
  required DateTime fetchedAtUtc,
}) {
  return RemoteResource<StationDetails>(
    value: StationDetails(
      id: id,
      name: 'Station $id',
      stationType: 'river',
      timeZone: 'Asia/Ho_Chi_Minh',
      location: const GeoPoint(latitude: 20.25, longitude: 106.10),
      aliases: const [],
      defaultDatumId: 'datum-local',
      provenance: null,
      meta: StationMeta(generatedAtUtc: fetchedAtUtc),
    ),
    fetchedAtUtc: fetchedAtUtc,
    cachePolicy: const CachePolicy(
      maxAge: Duration(minutes: 10),
      staleWhileRevalidate: Duration(minutes: 20),
    ),
  );
}

OfflinePackManifest manifest(String version, {String packId = 'pack-A'}) {
  return OfflinePackManifest(
    packId: packId,
    version: version,
    schemaVersion: 1,
    generatedAtUtc: DateTime.utc(2026, 9, 16, 1),
    expiresAtUtc: DateTime.utc(2026, 9, 18, 1),
    checksum: 'sha256-$version',
    contentSummary: const {'stations': 1},
    sourceSummary: const {
      'sources': ['fixture'],
    },
    minimumAppVersion: '1.0.0',
    installedAtUtc: DateTime.utc(2026, 9, 16, 2),
  );
}

ValidatedOfflineDataset replacementDataset() {
  final resource = stationResource(
    'station-new',
    fetchedAtUtc: DateTime.utc(2026, 9, 16, 3),
  );
  return ValidatedOfflineDataset(
    manifest: manifest('2'),
    resourceWrites: [OfflineStationResourceWrite(resource)],
    entries: [
      OfflinePackEntry(
        entityType: OfflinePackEntityType.station,
        entityKey: cacheKeyForStation(resource.value.id),
      ),
    ],
  );
}

Future<void> seedVersionOne(
  AppDatabase database,
  DriftPublicDataCacheStore cacheStore,
) async {
  await cacheStore.putStation(
    stationResource('station-old', fetchedAtUtc: DateTime.utc(2026, 9, 15, 3)),
  );
  await database
      .into(database.offlineManifests)
      .insert(
        OfflineManifestsCompanion.insert(
          packId: 'pack-A',
          version: '1',
          packSchemaVersion: 1,
          generatedAtUtc: DateTime.utc(2026, 9, 15),
          expiresAtUtc: DateTime.utc(2026, 9, 17),
          checksum: 'sha256-1',
          contentSummaryJson: '{"stations":1}',
          sourceSummaryJson: '{"sources":["fixture"]}',
          minimumAppVersion: '1.0.0',
          installedAtUtc: DateTime.utc(2026, 9, 15, 1),
        ),
      );
  await database
      .into(database.offlinePackEntries)
      .insert(
        OfflinePackEntriesCompanion.insert(
          packId: 'pack-A',
          entityType: 'station',
          entityKey: cacheKeyForStation('station-old'),
        ),
      );
  await database
      .into(database.favorites)
      .insert(
        FavoritesCompanion.insert(
          stationId: 'favorite-station',
          createdAtUtc: DateTime.utc(2026, 9, 15),
        ),
      );
}

void main() {
  late AppDatabase database;
  late DriftPublicDataCacheStore cacheStore;

  setUp(() async {
    database = AppDatabase.inMemory();
    cacheStore = DriftPublicDataCacheStore(database);
    await seedVersionOne(database, cacheStore);
  });

  tearDown(() async {
    await database.close();
  });

  test('failed replacement rolls back data membership and manifest', () async {
    final store = DriftOfflinePackStore(
      database,
      beforeManifestWrite: () async {
        throw StateError('injected failure before manifest write');
      },
    );

    await expectLater(
      store.replaceValidatedDataset(replacementDataset()),
      throwsA(isA<StateError>()),
    );

    final existing = await store.getManifest('pack-A');
    expect(existing?.version, '1');

    final entries = await (database.select(
      database.offlinePackEntries,
    )..where((table) => table.packId.equals('pack-A'))).get();
    expect(entries, hasLength(1));
    expect(entries.single.entityKey, cacheKeyForStation('station-old'));

    expect(await cacheStore.getStation('station-new'), isNull);
    expect(await cacheStore.getStation('station-old'), isNotNull);
    expect(await database.select(database.favorites).get(), hasLength(1));
  });

  test(
    'successful replacement exposes new manifest and membership atomically',
    () async {
      final store = DriftOfflinePackStore(database);
      final dataset = replacementDataset();

      await store.replaceValidatedDataset(dataset);

      final installed = await store.getManifest('pack-A');
      expect(installed?.version, '2');
      expect(installed?.schemaVersion, 1);
      expect(installed?.checksum, 'sha256-2');
      expect(installed?.contentSummary, {'stations': 1});
      expect(installed?.sourceSummary, {
        'sources': ['fixture'],
      });
      expect(installed?.minimumAppVersion, '1.0.0');
      expect(installed?.generatedAtUtc, dataset.manifest.generatedAtUtc);
      expect(installed?.expiresAtUtc, dataset.manifest.expiresAtUtc);
      expect(installed?.installedAtUtc, dataset.manifest.installedAtUtc);

      final entries = await (database.select(
        database.offlinePackEntries,
      )..where((table) => table.packId.equals('pack-A'))).get();
      expect(entries, hasLength(1));
      expect(entries.single.entityType, 'station');
      expect(entries.single.entityKey, cacheKeyForStation('station-new'));

      expect(await cacheStore.getStation('station-new'), isNotNull);
      expect(await database.select(database.favorites).get(), hasLength(1));
    },
  );

  test(
    'remove deletes pack metadata without deleting shared cache or favorites',
    () async {
      final store = DriftOfflinePackStore(database);
      await store.replaceValidatedDataset(replacementDataset());

      await store.remove('pack-A');

      expect(await store.getManifest('pack-A'), isNull);
      expect(
        await (database.select(
          database.offlinePackEntries,
        )..where((table) => table.packId.equals('pack-A'))).get(),
        isEmpty,
      );
      expect(await cacheStore.getStation('station-new'), isNotNull);
      expect(await database.select(database.favorites).get(), hasLength(1));
    },
  );

  test('listManifests returns installed packs ordered by pack id', () async {
    final store = DriftOfflinePackStore(database);
    final second = ValidatedOfflineDataset(
      manifest: manifest('1', packId: 'pack-B'),
      resourceWrites: const [],
      entries: const [],
    );
    await store.replaceValidatedDataset(second);

    final manifests = await store.listManifests();

    expect(manifests.map((item) => item.packId), ['pack-A', 'pack-B']);
  });
}
