# Mobile App

Target: Flutter application for Android and iOS.

## Responsibilities
- Home water-status experience.
- Tide charts.
- Vietnamese lunar/Gregorian calendar.
- Map and location selection.
- Drainage decision-support UI.
- Offline region packs via local SQLite/Drift.
- Notifications and widgets in later phases.
- PDF preview/export for supported offline templates.
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

Do not duplicate tide/drainage formulas in widgets. Domain calculations must come from approved shared/native/Dart engine implementations or normalized API contracts with parity tests.

Bootstrap is intentionally deferred to a dedicated implementation issue after foundation review.
