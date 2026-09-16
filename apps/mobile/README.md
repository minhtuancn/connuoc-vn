# Mobile App

Flutter application for Android and iOS. Phase 3 bootstrap is tracked by issue #40 and uses the architecture decision in `docs/ADR/0002-mobile-flutter-bootstrap.md`.

## Toolchain

- Flutter `3.47.3` (also recorded in `.flutter-version`).
- Dart version bundled with the pinned Flutter SDK.
- Riverpod for app state/dependency overrides.
- go_router for navigation.
- Flutter gen-l10n with Vietnamese primary and English secondary.
- Flutter remains outside the pnpm workspace.

## Local setup

```bash
cd apps/mobile
flutter --version
flutter pub get
flutter gen-l10n
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
flutter build apk --debug
```

On macOS with Xcode installed, verify the iOS target without signing:

```bash
cd apps/mobile
flutter build ios --debug --no-codesign
```

The public API base URL is configuration, not a secret. Development/test defaults to the Android-emulator host `http://10.0.2.2:3000`. Override it without committing credentials:

```bash
flutter run --dart-define=CONNUOC_API_BASE_URL=https://api.example.test
```

Mobile configuration intentionally has no admin token or production credential field.

## Responsibilities

- Home water-status experience.
- Tide charts.
- Vietnamese lunar/Gregorian calendar.
- Map and location selection.
- Drainage decision-support UI in its later roadmap phase.
- Offline station/region packs via local SQLite/Drift when implemented by #42/#46.
- Notifications and widgets in later phases.
- PDF preview/export for supported offline templates in later phases.
- Accessibility: platform text scaling, TalkBack, VoiceOver, high contrast.

## Architecture direction

Use feature-first modules with clear layers:

```text
lib/
├── app/
├── core/
│   ├── design/
│   ├── network/
│   ├── database/
│   ├── localization/
│   └── accessibility/
├── features/
│   ├── home/
│   ├── tide/
│   ├── calendar/
│   ├── map/
│   ├── drainage/
│   ├── offline/
│   ├── settings/
│   └── notifications/
└── shared/
```

Only directories needed by implemented features are committed. Widgets must not duplicate tide/lunar/drainage formulas or call raw HTTP/SQLite directly. Domain calculations come from approved shared/native/Dart engine implementations with parity tests or normalized API contracts.

## Phase 3 dependency handoff

After #40 merges:

- #41 owns typed public API requests/DTO mapping and transport failures.
- #43 owns the production app shell, navigation, design, localization and accessibility primitives.
- #42 owns Drift/local database and repository persistence.

Bootstrap code should remain small enough that these issues extend it rather than replace it.
