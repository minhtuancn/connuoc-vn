import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:drift_flutter/drift_flutter.dart';

part 'app_database.g.dart';

class Stations extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get stationType => text()();
  TextColumn get timeZone => text()();
  RealColumn get latitude => real()();
  RealColumn get longitude => real()();
  TextColumn get defaultDatumId => text().nullable()();
  DateTimeColumn get detailGeneratedAtUtc => dateTime().nullable()();
  TextColumn get provenanceSourceKey => text().nullable()();
  TextColumn get provenanceImportRunId => text().nullable()();
  TextColumn get provenanceRawChecksumSha256 => text().nullable()();
  TextColumn get provenanceParserVersion => text().nullable()();
  TextColumn get provenanceNormalizerVersion => text().nullable()();
  DateTimeColumn get provenanceObservedAtUtc => dateTime().nullable()();
  DateTimeColumn get localUpdatedAtUtc => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

class StationAliases extends Table {
  TextColumn get stationId => text().references(
    Stations,
    #id,
    onDelete: KeyAction.cascade,
  )();
  TextColumn get alias => text()();

  @override
  Set<Column<Object>> get primaryKey => {stationId, alias};
}

class LocationSearchPages extends Table {
  TextColumn get cacheKey => text()();
  TextColumn get query => text()();
  IntColumn get limit => integer()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get generatedAtUtc => dateTime()();
  TextColumn get nextCursor => text().nullable()();
  DateTimeColumn get fetchedAtUtc => dateTime()();
  IntColumn get maxAgeSeconds => integer()();
  IntColumn get staleWhileRevalidateSeconds => integer()();

  @override
  Set<Column<Object>> get primaryKey => {cacheKey};
}

class LocationSearchPageItems extends Table {
  TextColumn get cacheKey => text().references(
    LocationSearchPages,
    #cacheKey,
    onDelete: KeyAction.cascade,
  )();
  IntColumn get ordinal => integer()();
  TextColumn get stationId => text().references(Stations, #id)();

  @override
  Set<Column<Object>> get primaryKey => {cacheKey, ordinal};
}

class TideSeries extends Table {
  TextColumn get cacheKey => text()();
  TextColumn get stationId => text().references(Stations, #id)();
  DateTimeColumn get startUtc => dateTime()();
  DateTimeColumn get endUtc => dateTime()();
  IntColumn get intervalSeconds => integer()();
  TextColumn get modelId => text()();
  TextColumn get modelVersion => text().nullable()();
  TextColumn get datumId => text()();
  TextColumn get unit => text()();
  TextColumn get timeZone => text()();
  TextColumn get phaseConvention => text()();
  DateTimeColumn get referenceEpochUtc => dateTime()();
  IntColumn get constituentCount => integer()();
  TextColumn get provenanceSourceKey => text().nullable()();
  TextColumn get provenanceImportRunId => text().nullable()();
  DateTimeColumn get generatedAtUtc => dateTime()();
  DateTimeColumn get fetchedAtUtc => dateTime()();
  IntColumn get maxAgeSeconds => integer()();
  IntColumn get staleWhileRevalidateSeconds => integer()();

  @override
  Set<Column<Object>> get primaryKey => {cacheKey};
}

class TidePoints extends Table {
  TextColumn get seriesKey => text().references(
    TideSeries,
    #cacheKey,
    onDelete: KeyAction.cascade,
  )();
  DateTimeColumn get timestampUtc => dateTime()();
  RealColumn get value => real()();

  @override
  Set<Column<Object>> get primaryKey => {seriesKey, timestampUtc};
}

class WaterLevelPages extends Table {
  TextColumn get cacheKey => text()();
  TextColumn get stationId => text()();
  TextColumn get stationName => text()();
  TextColumn get timeZone => text()();
  TextColumn get defaultDatumId => text().nullable()();
  DateTimeColumn get startUtc => dateTime().nullable()();
  DateTimeColumn get endUtc => dateTime().nullable()();
  IntColumn get limit => integer()();
  TextColumn get cursor => text().nullable()();
  DateTimeColumn get generatedAtUtc => dateTime()();
  DateTimeColumn get latestObservedAtUtc => dateTime().nullable()();
  TextColumn get nextCursor => text().nullable()();
  DateTimeColumn get fetchedAtUtc => dateTime()();
  IntColumn get maxAgeSeconds => integer()();
  IntColumn get staleWhileRevalidateSeconds => integer()();

  @override
  Set<Column<Object>> get primaryKey => {cacheKey};
}

class WaterLevelObservations extends Table {
  TextColumn get stationId => text()();
  TextColumn get sourceRecordKey => text()();
  DateTimeColumn get observedAtUtc => dateTime()();
  RealColumn get value => real()();
  TextColumn get unit => text()();
  TextColumn get datumId => text().nullable()();
  TextColumn get qualityState => text()();
  TextColumn get provenanceSourceKey => text()();
  TextColumn get provenanceImportRunId => text()();
  TextColumn get rawChecksumSha256 => text()();
  TextColumn get parserVersion => text()();
  TextColumn get normalizerVersion => text()();
  DateTimeColumn get provenanceObservedAtUtc => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {stationId, sourceRecordKey};
}

class WaterLevelPageItems extends Table {
  TextColumn get pageKey => text().references(
    WaterLevelPages,
    #cacheKey,
    onDelete: KeyAction.cascade,
  )();
  IntColumn get ordinal => integer()();
  TextColumn get stationId => text()();
  TextColumn get sourceRecordKey => text()();

  @override
  Set<Column<Object>> get primaryKey => {pageKey, ordinal};
}

class CalendarDays extends Table {
  TextColumn get cacheKey => text()();
  IntColumn get solarYear => integer()();
  IntColumn get solarMonth => integer()();
  IntColumn get solarDay => integer()();
  IntColumn get lunarYear => integer()();
  IntColumn get lunarMonth => integer()();
  IntColumn get lunarDay => integer()();
  BoolColumn get isLeapMonth => boolean()();
  TextColumn get timeZone => text()();
  DateTimeColumn get generatedAtUtc => dateTime()();
  DateTimeColumn get fetchedAtUtc => dateTime()();
  IntColumn get maxAgeSeconds => integer()();
  IntColumn get staleWhileRevalidateSeconds => integer()();

  @override
  Set<Column<Object>> get primaryKey => {cacheKey};
}

class Favorites extends Table {
  TextColumn get stationId => text()();
  DateTimeColumn get createdAtUtc => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {stationId};
}

class Preferences extends Table {
  TextColumn get key => text()();
  TextColumn get jsonScalarValue => text()();
  DateTimeColumn get updatedAtUtc => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

class OfflineManifests extends Table {
  TextColumn get packId => text()();
  TextColumn get version => text()();
  IntColumn get packSchemaVersion => integer()();
  DateTimeColumn get generatedAtUtc => dateTime()();
  DateTimeColumn get expiresAtUtc => dateTime()();
  TextColumn get checksum => text()();
  TextColumn get contentSummaryJson => text()();
  TextColumn get sourceSummaryJson => text()();
  TextColumn get minimumAppVersion => text()();
  DateTimeColumn get installedAtUtc => dateTime()();

  @override
  Set<Column<Object>> get primaryKey => {packId};
}

class OfflinePackEntries extends Table {
  TextColumn get packId => text().references(
    OfflineManifests,
    #packId,
    onDelete: KeyAction.cascade,
  )();
  TextColumn get entityType => text()();
  TextColumn get entityKey => text()();

  @override
  Set<Column<Object>> get primaryKey => {packId, entityType, entityKey};
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

@DriftDatabase(
  tables: [
    Stations,
    StationAliases,
    LocationSearchPages,
    LocationSearchPageItems,
    TideSeries,
    TidePoints,
    WaterLevelPages,
    WaterLevelObservations,
    WaterLevelPageItems,
    CalendarDays,
    Favorites,
    Preferences,
    OfflineManifests,
    OfflinePackEntries,
    SyncStates,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(driftDatabase(name: 'connuoc_mobile'));

  AppDatabase.forTesting(super.executor);

  factory AppDatabase.inMemory() => AppDatabase.forTesting(NativeDatabase.memory());

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (migrator) => migrator.createAll(),
    onUpgrade: (migrator, from, to) async {
      if (from < 2) {
        await migrator.createTable(offlineManifests);
        await migrator.createTable(offlinePackEntries);
        await migrator.createTable(syncStates);
      }
    },
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys = ON');
    },
  );

  Future<int> stationCount() async => (await select(stations).get()).length;

  Future<int> favoriteCount() async => (await select(favorites).get()).length;

  Future<int> offlineManifestCount() async =>
      (await select(offlineManifests).get()).length;

  Future<int> syncStateCount() async => (await select(syncStates).get()).length;
}
