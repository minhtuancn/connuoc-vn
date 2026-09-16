import 'package:connuoc_viet/core/config/app_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppConfig', () {
    test('uses the documented Android-emulator local API by default', () {
      final config = AppConfig.fromApiBaseUrl(null);

      expect(config.apiBaseUrl, Uri.parse('http://10.0.2.2:3000'));
    });

    test('accepts an explicit https API base URL', () {
      final config = AppConfig.fromApiBaseUrl('https://api.example.test/v1');

      expect(config.apiBaseUrl, Uri.parse('https://api.example.test/v1'));
    });

    test('rejects non-http API schemes', () {
      expect(
        () => AppConfig.fromApiBaseUrl('ftp://api.example.test'),
        throwsA(isA<FormatException>()),
      );
    });
  });
}
