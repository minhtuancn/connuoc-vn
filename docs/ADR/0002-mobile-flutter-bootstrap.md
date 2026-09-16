# ADR-0002: Flutter Mobile MVP Bootstrap Architecture

- Status: Accepted for Phase 3 bootstrap
- Date: 2026-09-15
- Issue: #40
- Parent: #39

## Context

Phase 2 delivered stable public station/location/tide/water-level/calendar APIs with explicit provenance, datum, units, timezone and freshness metadata. `apps/mobile` is currently only a documented placeholder. Phase 3 needs a reproducible Flutter application foundation before feature teams add API, offline and UX work in parallel.

The foundation must support Android and iOS, remain outside the pnpm workspace, preserve testability, and avoid moving deterministic tide/lunar/drainage formulas into presentation code.

## Toolchain decision

Pin Flutter `3.47.3` for Phase 3 bootstrap rather than following an unbounded `stable` channel. Flutter 3.47 is the August 2026 stable line and the upstream `3.47.3` tag is available. The repository should record the chosen SDK version in a small machine-readable file so local development and CI use the same version.

The Flutter setup GitHub Action is pinned to commit `1a449444c387b1966244ae4d4f8c696479add0b2` (the current `subosito/flutter-action` v2 ref at bootstrap time) instead of referencing a mutable major tag in committed CI.

## Application architecture

Use feature-first modules with one-way boundaries:

```text
apps/mobile/lib/
├── app/
│   ├── app.dart
│   ├── router.dart
│   └── bootstrap.dart
├── core/
│   ├── config/
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

Phase 3 child issues may add only the directories they need. Empty architectural folders are not committed merely to mirror the diagram.

### Dependency direction

- `app` composes feature/core providers and routing.
- `features` may depend on `core` and `shared` contracts.
- `core` must not depend on feature presentation code.
- widgets do not call SQLite or raw HTTP clients directly.
- mobile code does not import server/database implementation details.
- deterministic formulas remain in approved engines/API contracts unless a separate parity-tested Dart implementation is accepted.

## Library decisions

Use a deliberately small dependency set in the bootstrap:

- `flutter_riverpod` `3.4.3` — application state, dependency injection and test overrides.
- `go_router` `18.0.1` — declarative navigation/deep links.
- `http` `1.6.0` — small public-API transport boundary; #41 owns request/DTO logic.
- Flutter SDK localization (`flutter_localizations` + `gen-l10n`) — Vietnamese primary, English secondary.

Do not add Freezed/json_serializable/build_runner in #40. Bootstrap configuration and route models are small enough for explicit Dart types. #41 may introduce serialization code generation only if the real Phase 2 DTO surface demonstrates enough value to justify the generated-code/tooling cost.

Do not add Drift in #40; #42 owns local database selection/configuration and migration tests.

## Configuration

Use compile-time `--dart-define=CONNUOC_API_BASE_URL=...` through a typed `AppConfig` boundary.

Rules:
- development/test may default to a documented local API URL;
- production builds must not embed credentials;
- API URL is configuration, not a secret;
- admin endpoints/tokens are not represented in mobile configuration.

## Localization

Use Flutter ARB/gen-l10n from bootstrap:
- `vi` is the primary supported locale;
- `en` is the secondary baseline;
- reusable widgets must not require hard-coded English strings.

Feature-specific strings remain with the mobile app localization catalogue rather than domain-engine packages.

## Testing strategy

Bootstrap gates:
- `flutter pub get` from committed `pubspec.lock`;
- `dart format --output=none --set-exit-if-changed .` for committed Dart source;
- `flutter analyze`;
- `flutter test`;
- Android debug APK build on Linux;
- iOS no-codesign build on macOS.

The bootstrap smoke widget test must prove:
- app starts under `ProviderScope`;
- Vietnamese is the default/primary locale;
- router opens a deterministic bootstrap/home placeholder route;
- configuration can be overridden in tests without global mutable state.

Later Phase 3 issues add large-text, semantics, offline and journey gates rather than weakening these bootstrap gates.

## CI boundary

Mobile CI is a dedicated workflow. Existing Node/pnpm backend/core workflows remain unchanged and Flutter remains outside `pnpm-workspace.yaml`.

Use path-aware triggers where practical but also allow `workflow_dispatch`. Pull requests touching shared contracts/docs may still run normal Node CI independently.

## Rejected alternatives

### Follow Flutter `stable` without a version pin
Rejected because clean-checkout CI could change underneath an unchanged commit.

### Add a large generated architecture/codegen stack immediately
Rejected because #40 contains no production DTO/database surface yet. YAGNI; add generators only when child issues demonstrate a concrete need.

### Put Flutter in the pnpm workspace
Rejected by ADR-0001 and because it couples unrelated package managers/runtimes.

### Let widgets call HTTP directly
Rejected because #41/#42 need replaceable remote/local repositories and deterministic widget tests.

## Consequences

Positive:
- small dependency graph;
- reproducible mobile CI;
- clear parallelization point for #41 and #43;
- easy fake/provider overrides in tests;
- no premature persistence/codegen commitment.

Costs:
- Riverpod/go_router APIs become Phase 3 app-level dependencies;
- macOS CI is required to prove iOS compilation;
- explicit mapping code may grow in #41 and can be revisited there.

## Revisit when

- #41 demonstrates enough DTO boilerplate to justify serialization codegen;
- #42 selects/configures Drift and migration tooling;
- a platform-specific limitation requires a different router/state strategy;
- Flutter stable line changes during a deliberate dependency-upgrade issue, never implicitly during unrelated feature work.
