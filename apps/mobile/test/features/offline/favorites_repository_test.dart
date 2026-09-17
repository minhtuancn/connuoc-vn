import 'package:connuoc_viet/core/database/app_database.dart' show AppDatabase;
import 'package:connuoc_viet/features/offline/data/drift_favorites_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase.inMemory();
  });

  tearDown(() async {
    await database.close();
  });

  test('favorites survive repository reconstruction', () async {
    final first = DriftFavoritesRepository(
      database,
      nowUtc: () => DateTime.utc(2026, 9, 16, 3),
    );

    await first.add(' station-b ');
    await first.add('station-a');

    final reconstructed = DriftFavoritesRepository(database);
    expect(
      await reconstructed.list(),
      unorderedEquals(<String>['station-a', 'station-b']),
    );

    await reconstructed.remove(' station-a ');
    expect(await reconstructed.list(), <String>['station-b']);
  });

  test('favorite ids are normalized and empty ids are rejected', () async {
    final repository = DriftFavoritesRepository(database);

    await repository.add(' station-a ');
    await repository.add('station-a');

    expect(await repository.list(), <String>['station-a']);
    expect(() => repository.add('   '), throwsArgumentError);
  });
}
