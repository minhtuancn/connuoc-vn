import 'package:connuoc_viet/core/database/app_database.dart' show AppDatabase;
import 'package:connuoc_viet/features/settings/data/drift_preferences_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late AppDatabase database;

  setUp(() {
    database = AppDatabase.inMemory();
  });

  tearDown(() async {
    await database.close();
  });

  test('typed preferences survive repository reconstruction', () async {
    final first = DriftPreferencesRepository(
      database,
      nowUtc: () => DateTime.utc(2026, 9, 16, 4),
    );

    await first.setWifiOnlyDownloads(true);
    await first.setPreferredLocaleTag('vi-VN');
    await first.setLargeTextMode(true);

    final reconstructed = DriftPreferencesRepository(database);
    expect(await reconstructed.wifiOnlyDownloads(), isTrue);
    expect(await reconstructed.preferredLocaleTag(), 'vi-VN');
    expect(await reconstructed.largeTextMode(), isTrue);
  });

  test(
    'boolean getters use explicit defaults when values are absent',
    () async {
      final repository = DriftPreferencesRepository(database);

      expect(await repository.wifiOnlyDownloads(), isFalse);
      expect(await repository.wifiOnlyDownloads(defaultValue: true), isTrue);
      expect(await repository.largeTextMode(), isFalse);
      expect(await repository.largeTextMode(defaultValue: true), isTrue);
      expect(await repository.preferredLocaleTag(), isNull);
    },
  );

  test('nullable locale removes the stored preference', () async {
    final repository = DriftPreferencesRepository(database);

    await repository.setPreferredLocaleTag('en-US');
    expect(await repository.preferredLocaleTag(), 'en-US');

    await repository.setPreferredLocaleTag(null);
    expect(await repository.preferredLocaleTag(), isNull);
  });
}
