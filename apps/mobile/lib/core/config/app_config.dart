import 'package:flutter_riverpod/flutter_riverpod.dart';

class AppConfig {
  AppConfig({required this.apiBaseUrl});

  factory AppConfig.fromEnvironment() {
    return AppConfig.fromApiBaseUrl(
      _configuredApiBaseUrl.isEmpty ? null : _configuredApiBaseUrl,
    );
  }

  factory AppConfig.fromApiBaseUrl(String? rawValue) {
    final value = rawValue?.trim();
    final uri = Uri.parse(
      value == null || value.isEmpty ? _defaultApiBaseUrl : value,
    );

    if ((uri.scheme != 'http' && uri.scheme != 'https') || uri.host.isEmpty) {
      throw FormatException(
        'CONNUOC_API_BASE_URL must be an absolute http(s) URL.',
        rawValue,
      );
    }

    return AppConfig(apiBaseUrl: uri);
  }

  static const String _defaultApiBaseUrl = 'http://10.0.2.2:3000';
  static const String _configuredApiBaseUrl = String.fromEnvironment(
    'CONNUOC_API_BASE_URL',
  );

  final Uri apiBaseUrl;
}

final Provider<AppConfig> appConfigProvider = Provider<AppConfig>(
  (ref) => AppConfig.fromEnvironment(),
);
