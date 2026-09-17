import 'dart:async';
import 'dart:convert';

import 'package:connuoc_viet/core/database/app_database.dart' as db;
import 'package:connuoc_viet/features/offline/data/offline_pack_store.dart';
import 'package:connuoc_viet/features/offline/domain/offline_pack.dart';
import 'package:connuoc_viet/features/public_data/data/drift_public_data_cache_store.dart';
import 'package:drift/drift.dart' show OrderingTerm;

class DriftOfflinePackStore implements OfflinePackStore {
  DriftOfflinePackStore(
    this._database, {
    FutureOr<void> Function()? beforeManifestWrite,
  }) : _cacheStore = DriftPublicDataCacheStore(_database),
       _beforeManifestWrite = beforeManifestWrite;

  final db.AppDatabase _database;
  final DriftPublicDataCacheStore _cacheStore;
  final FutureOr<void> Function()? _beforeManifestWrite;

  @override
  Future<List<OfflinePackManifest>> listManifests() async {
    final rows = await (_database.select(
      _database.offlineManifests,
    )..orderBy([(table) => OrderingTerm.asc(table.packId)])).get();
    return rows.map(_manifestFromRow).toList(growable: false);
  }

  @override
  Future<OfflinePackManifest?> getManifest(String packId) async {
    final normalizedPackId = _requireText(packId, 'packId');
    final row =
        await (_database.select(_database.offlineManifests)
              ..where((table) => table.packId.equals(normalizedPackId)))
            .getSingleOrNull();
    return row == null ? null : _manifestFromRow(row);
  }

  @override
  Future<void> replaceValidatedDataset(ValidatedOfflineDataset dataset) async {
    await _database.transaction(() async {
      // Keep foreign-key validation at commit so a brand-new pack can write
      // membership first and make the final manifest row the activation point.
      await _database.customStatement('PRAGMA defer_foreign_keys = ON');

      for (final write in dataset.resourceWrites) {
        await _writeResource(write);
      }

      await (_database.delete(
        _database.offlinePackEntries,
      )..where((table) => table.packId.equals(dataset.manifest.packId))).go();

      for (final entry in dataset.entries) {
        await _database
            .into(_database.offlinePackEntries)
            .insert(
              db.OfflinePackEntriesCompanion.insert(
                packId: dataset.manifest.packId,
                entityType: entry.entityType.storageValue,
                entityKey: entry.entityKey,
              ),
            );
      }

      final hook = _beforeManifestWrite;
      if (hook != null) {
        await Future<void>.sync(hook);
      }

      await _database
          .into(_database.offlineManifests)
          .insertOnConflictUpdate(_manifestCompanion(dataset.manifest));
    });
  }

  @override
  Future<void> remove(String packId) async {
    final normalizedPackId = _requireText(packId, 'packId');
    await _database.transaction(() async {
      await (_database.delete(
        _database.offlinePackEntries,
      )..where((table) => table.packId.equals(normalizedPackId))).go();
      await (_database.delete(
        _database.offlineManifests,
      )..where((table) => table.packId.equals(normalizedPackId))).go();
    });
  }

  Future<void> _writeResource(OfflinePackResourceWrite write) async {
    switch (write) {
      case OfflineStationResourceWrite(:final resource):
        await _cacheStore.putStation(resource);
      case OfflineTideResourceWrite(:final request, :final resource):
        await _cacheStore.putTide(request, resource);
      case OfflineWaterLevelResourceWrite(:final request, :final resource):
        await _cacheStore.putWaterLevels(request, resource);
      case OfflineCalendarResourceWrite(:final request, :final resource):
        await _cacheStore.putCalendar(request, resource);
    }
  }
}

OfflinePackManifest _manifestFromRow(db.OfflineManifest row) {
  return OfflinePackManifest(
    packId: row.packId,
    version: row.version,
    schemaVersion: row.packSchemaVersion,
    generatedAtUtc: row.generatedAtUtc.toUtc(),
    expiresAtUtc: row.expiresAtUtc.toUtc(),
    checksum: row.checksum,
    contentSummary: _decodeMap(row.contentSummaryJson),
    sourceSummary: _decodeMap(row.sourceSummaryJson),
    minimumAppVersion: row.minimumAppVersion,
    installedAtUtc: row.installedAtUtc.toUtc(),
  );
}

db.OfflineManifestsCompanion _manifestCompanion(OfflinePackManifest manifest) {
  return db.OfflineManifestsCompanion.insert(
    packId: manifest.packId,
    version: manifest.version,
    packSchemaVersion: manifest.schemaVersion,
    generatedAtUtc: manifest.generatedAtUtc,
    expiresAtUtc: manifest.expiresAtUtc,
    checksum: manifest.checksum,
    contentSummaryJson: _encodeCanonicalMap(manifest.contentSummary),
    sourceSummaryJson: _encodeCanonicalMap(manifest.sourceSummary),
    minimumAppVersion: manifest.minimumAppVersion,
    installedAtUtc: manifest.installedAtUtc,
  );
}

String _encodeCanonicalMap(Map<String, Object?> value) {
  return jsonEncode(_canonicalJsonValue(value));
}

Object? _canonicalJsonValue(Object? value) {
  if (value is Map) {
    final entries =
        value.entries
            .map((entry) => MapEntry(entry.key.toString(), entry.value))
            .toList()
          ..sort((a, b) => a.key.compareTo(b.key));
    return <String, Object?>{
      for (final entry in entries) entry.key: _canonicalJsonValue(entry.value),
    };
  }
  if (value is Iterable) {
    return value.map(_canonicalJsonValue).toList(growable: false);
  }
  return value;
}

Map<String, Object?> _decodeMap(String value) {
  final decoded = jsonDecode(value);
  if (decoded is! Map) {
    throw const FormatException(
      'offline manifest summary must be a JSON object',
    );
  }
  return decoded.map<String, Object?>((key, value) {
    return MapEntry(key.toString(), value);
  });
}

String _requireText(String value, String name) {
  final normalized = value.trim();
  if (normalized.isEmpty) {
    throw ArgumentError.value(value, name, 'must not be empty');
  }
  return normalized;
}
