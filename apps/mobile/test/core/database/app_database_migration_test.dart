import 'package:connuoc_viet/core/database/app_database.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('current mobile database schema version is 2', () async {
    final database = AppDatabase.inMemory();
    addTearDown(database.close);

    expect(database.schemaVersion, 2);
  });

  test('migrates representative v1 rows to v2 without data loss', () async {
    final fixture = await AppDatabaseMigrationFixture.createVersion1();
    addTearDown(fixture.close);

    await fixture.seedStation(
      id: 'station-nghia-phong',
      name: 'Nghia Phong',
      timeZone: 'Asia/Ho_Chi_Minh',
    );
    await fixture.seedFavorite('station-nghia-phong');

    final database = await fixture.upgradeToCurrent();

    expect(database.schemaVersion, 2);
    expect(await database.stationCount(), 1);
    expect(await database.favoriteCount(), 1);
    expect(await database.offlineManifestCount(), 0);
    expect(await database.syncStateCount(), 0);
  });
}
