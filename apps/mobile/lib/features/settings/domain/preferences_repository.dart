abstract interface class PreferencesRepository {
  Future<bool> wifiOnlyDownloads({bool defaultValue = false});

  Future<void> setWifiOnlyDownloads(bool value);

  Future<String?> preferredLocaleTag();

  Future<void> setPreferredLocaleTag(String? value);

  Future<bool> largeTextMode({bool defaultValue = false});

  Future<void> setLargeTextMode(bool value);
}
