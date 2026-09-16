import 'dart:io';

import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:drift/native.dart';

class AppDatabaseMigrationFixture {
  AppDatabaseMigrationFixture._(this._directory, this._file, this._database);

  final Directory _directory;
  final File _file;
  AppDatabase? _database;

  static Future<AppDatabaseMigrationFixture> createVersion1() async {
    final directory = await Directory.systemTemp.createTemp(
      'connuoc-mobile-v1-',
    );
    final file = File('${directory.path}/database.sqlite');
    final database = AppDatabase.forTesting(NativeDatabase(file));

    // Force creation of the current schema, then reduce it to the exact
    // version-1 table set used by issue #42 before setting user_version = 1.
    await database.customSelect('SELECT 1').get();
    await database.customStatement('DROP TABLE offline_pack_entries');
    await database.customStatement('DROP TABLE offline_manifests');
    await database.customStatement('DROP TABLE sync_states');
    await database.customStatement('PRAGMA user_version = 1');

    return AppDatabaseMigrationFixture._(directory, file, database);
  }

  Future<void> seedStation({
    required String id,
    required String name,
    required String timeZone,
  }) async {
    final database = _requireDatabase();
    await database
        .into(database.stations)
        .insert(
          StationsCompanion.insert(
            id: id,
            name: name,
            stationType: 'tide',
            timeZone: timeZone,
            latitude: 20.15,
            longitude: 106.15,
            localUpdatedAtUtc: DateTime.utc(2026, 9, 16),
          ),
        );
  }

  Future<void> seedFavorite(String stationId) async {
    final database = _requireDatabase();
    await database
        .into(database.favorites)
        .insert(
          FavoritesCompanion.insert(
            stationId: stationId,
            createdAtUtc: DateTime.utc(2026, 9, 16, 1),
          ),
        );
  }

  Future<AppDatabase> upgradeToCurrent() async {
    await _database?.close();
    final upgraded = AppDatabase.forTesting(NativeDatabase(_file));
    await upgraded.customSelect('SELECT 1').get();
    _database = upgraded;
    return upgraded;
  }

  Future<void> close() async {
    await _database?.close();
    _database = null;
    if (await _directory.exists()) {
      await _directory.delete(recursive: true);
    }
  }

  AppDatabase _requireDatabase() {
    final database = _database;
    if (database == null) {
      throw StateError('Migration fixture is already closed.');
    }
    return database;
  }
}
