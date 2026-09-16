# Phase 3 Mobile Bootstrap

Issue: #40  
Parent: #39

## Purpose

This note records the concrete Phase 3 mobile bootstrap boundary and the evidence expected before feature work begins.

## Pinned toolchain

- Flutter: `3.47.3`
- Riverpod: `3.4.3`
- go_router: `18.0.1`
- http: `1.6.0`
- intl: `0.20.3` as required by Flutter 3.47.3 localizations
- flutter_lints: `6.0.0`

Flutter remains outside the pnpm workspace.

## Bootstrap contracts

- `AppConfig` is the only bootstrap configuration object and carries a public API base URL only.
- `appConfigProvider` is overrideable in widget tests and later data-layer providers.
- `createAppRouter()` owns the deterministic bootstrap route and can be extended by #43.
- `ConNuocApp` is Vietnamese-first with English localization available.
- No network request, database, auth or deterministic tide/lunar/drainage formula is implemented by #40.

## TDD evidence

The initial bootstrap contract tests were committed before production implementation. CI run `35052766799` first generated Android/iOS platform projects and `pubspec.lock`, then failed exactly because `AppConfig`, `appConfigProvider` and `ConNuocApp` did not exist. The same contract tests later passed after the minimal implementation was added.

## CI gates

`Mobile CI` must pass on the pull-request merge ref:

### Linux

- locked dependency resolution;
- l10n generation;
- Dart formatting;
- `flutter analyze`;
- `flutter test`;
- Android debug APK build.

### macOS

- locked dependency resolution;
- l10n generation;
- iOS debug build with `--no-codesign`.

Existing Node/core/backend CI remains independent and must also stay green.

## Handoff after merge

- #41 may add typed public API DTOs and transport/repository interfaces on top of `AppConfig`.
- #43 may extend routing/theme/localization/accessibility shell on top of `ConNuocApp`.
- #42 remains the owner of Drift/local persistence.

Any change that introduces admin credentials, direct widget HTTP/SQL access, or duplicated tide/lunar/drainage math violates this bootstrap boundary.
