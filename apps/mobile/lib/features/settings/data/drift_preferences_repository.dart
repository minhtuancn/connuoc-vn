import 'dart:convert';

import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:connuoc_viet/features/settings/domain/preferences_repository.dart';

DateTime _systemUtcNow() => DateTime.now().toUtc();

class DriftPreferencesRepository implements PreferencesRepository {
  DriftPreferencesRepository(
    this._database, {
    DateTime Function()? nowUtc,
  }) : _nowUtc = nowUtc ?? _systemUtcNow;

  static const _wifiOnlyDownloadsKey = 'wifi_only_downloads';
  static const _preferredLocaleTagKey = 'preferred_locale_tag';
  static const _largeTextModeKey = 'large_text_mode';

  final AppDatabase _database;
  final DateTime Function() _nowUtc;

  @override
  Future<bool> wifiOnlyDownloads({bool defaultValue = false}) async {
    final value = await _readScalar(_wifiOnlyDownloadsKey);
    if (value == null) {
      return defaultValue;
    }
    if (value is! bool) {
      throw StateError('Stored wifiOnlyDownloads preference is not a boolean.');
    }
    return value;
  }

  @override
  Future<void> setWifiOnlyDownloads(bool value) {
    return _putScalar(_wifiOnlyDownloadsKey, value);
  }

  @override
  Future<String?> preferredLocaleTag() async {
    final value = await _readScalar(_preferredLocaleTagKey);
    if (value == null) {
      return null;
    }
    if (value is! String) {
      throw StateError('Stored preferredLocaleTag preference is not a string.');
    }
    return value;
  }

  @override
  Future<void> setPreferredLocaleTag(String? value) {
    if (value == null) {
      return _delete(_preferredLocaleTagKey);
    }
    return _putScalar(_preferredLocaleTagKey, value);
  }

  @override
  Future<bool> largeTextMode({bool defaultValue = false}) async {
    final value = await _readScalar(_largeTextModeKey);
    if (value == null) {
      return defaultValue;
    }
    if (value is! bool) {
      throw StateError('Stored largeTextMode preference is not a boolean.');
    }
    return value;
  }

  @override
  Future<void> setLargeTextMode(bool value) {
    return _putScalar(_largeTextModeKey, value);
  }

  Future<Object?> _readScalar(String key) async {
    final row = await (_database.select(_database.preferences)
          ..where((table) => table.key.equals(key)))
        .getSingleOrNull();
    if (row == null) {
      return null;
    }

    final decoded = jsonDecode(row.jsonScalarValue);
    if (decoded is num || decoded is bool || decoded is String || decoded == null) {
      return decoded;
    }
    throw StateError('Stored preference $key is not a JSON scalar.');
  }

  Future<void> _putScalar(String key, Object value) async {
    await _database.into(_database.preferences).insertOnConflictUpdate(
          PreferencesCompanion.insert(
            key: key,
            jsonScalarValue: jsonEncode(value),
            updatedAtUtc: _nowUtc().toUtc(),
          ),
        );
  }

  Future<void> _delete(String key) {
    return (_database.delete(_database.preferences)
          ..where((table) => table.key.equals(key)))
        .go()
        .then((_) {});
  }
}
