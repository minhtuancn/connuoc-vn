import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:connuoc_viet/features/offline/domain/favorites_repository.dart';
import 'package:drift/drift.dart' show InsertMode;

DateTime _systemUtcNow() => DateTime.now().toUtc();

class DriftFavoritesRepository implements FavoritesRepository {
  DriftFavoritesRepository(
    this._database, {
    DateTime Function()? nowUtc,
  }) : _nowUtc = nowUtc ?? _systemUtcNow;

  final AppDatabase _database;
  final DateTime Function() _nowUtc;

  @override
  Future<List<String>> list() async {
    final rows = await _database.select(_database.favorites).get();
    rows.sort((a, b) {
      final created = a.createdAtUtc.compareTo(b.createdAtUtc);
      if (created != 0) {
        return created;
      }
      return a.stationId.compareTo(b.stationId);
    });
    return List<String>.unmodifiable(rows.map((row) => row.stationId));
  }

  @override
  Stream<List<String>> watch() {
    return _database.select(_database.favorites).watch().map((rows) {
      final sorted = [...rows]..sort((a, b) {
          final created = a.createdAtUtc.compareTo(b.createdAtUtc);
          if (created != 0) {
            return created;
          }
          return a.stationId.compareTo(b.stationId);
        });
      return List<String>.unmodifiable(sorted.map((row) => row.stationId));
    });
  }

  @override
  Future<void> add(String stationId) {
    final normalized = _normalizeStationId(stationId);
    return _add(normalized);
  }

  Future<void> _add(String stationId) async {
    await _database.into(_database.favorites).insert(
          FavoritesCompanion.insert(
            stationId: stationId,
            createdAtUtc: _nowUtc().toUtc(),
          ),
          mode: InsertMode.insertOrIgnore,
        );
  }

  @override
  Future<void> remove(String stationId) {
    final normalized = _normalizeStationId(stationId);
    return (_database.delete(_database.favorites)
          ..where((table) => table.stationId.equals(normalized)))
        .go()
        .then((_) {});
  }

  String _normalizeStationId(String stationId) {
    final normalized = stationId.trim();
    if (normalized.isEmpty) {
      throw ArgumentError.value(stationId, 'stationId', 'must not be empty');
    }
    return normalized;
  }
}
