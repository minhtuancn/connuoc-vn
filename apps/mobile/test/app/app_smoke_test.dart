import 'package:connuoc_viet/app/app.dart';
import 'package:connuoc_viet/core/config/app_config.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('boots in Vietnamese and allows config override', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(
            AppConfig(apiBaseUrl: Uri.parse('https://api.example.test')),
          ),
        ],
        child: const ConNuocApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Lịch con nước Việt Nam'), findsOneWidget);
    expect(find.text('Vietnam tide calendar'), findsNothing);
    expect(find.textContaining('api.example.test'), findsOneWidget);
  });
}
