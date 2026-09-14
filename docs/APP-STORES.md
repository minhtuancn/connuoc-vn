# Android / iOS Store Readiness

## Goal

Thiết kế repository và product từ đầu để có thể phát hành chính thức trên Google Play và Apple App Store mà không phải sửa lớn về privacy, permissions hoặc account flows.

## Identifiers

To decide before mobile bootstrap:
- Android application ID.
- iOS bundle ID.
- App display name: `Con Nước Việt` (working name).
- URL/deep-link domain.

Identifiers should be stable before production signing.

## Permissions

### Location
- Optional.
- Manual location/station selection must always work.
- Request only when the user invokes a feature that benefits from location.
- Explain why location is needed.

### Notifications
- Ask after value is demonstrated or when user explicitly enables alerts.
- Provide granular tide/drainage/weather settings.

### Photos/camera
Only request if/when community gauge-photo features ship, using scoped platform APIs where possible.

## Privacy requirements

Before public release:
- Hosted Privacy Policy.
- Accurate Google Play Data Safety declaration.
- Accurate App Store privacy disclosures.
- Clear analytics/crash-reporting behavior.
- Account deletion flow if account creation is enabled.
- Data retention documented.
- Optional location behavior verified.

## Safety/product copy

Store listing and in-app copy must not claim:
- official government authority,
- guaranteed flood/navigation safety,
- automated gate-operation authority,
- perfect real-time coverage when data is forecast/derived/stale.

Use clear informational/decision-support language.

## Android release checklist

- [ ] Application ID finalized.
- [ ] Signing key securely generated/backed up.
- [ ] Latest required target SDK verified at release time.
- [ ] Runtime permissions reviewed.
- [ ] Adaptive icon/splash.
- [ ] Release build minification/symbol handling verified.
- [ ] Internal testing.
- [ ] Closed/open testing if needed.
- [ ] Store screenshots/tablet assets.
- [ ] Vietnamese store description.
- [ ] Data Safety.
- [ ] Content rating.
- [ ] Crash monitoring.

## iOS release checklist

- [ ] Bundle ID finalized.
- [ ] Signing/provisioning configured securely.
- [ ] Minimum supported iOS version documented.
- [ ] Permission usage descriptions.
- [ ] App Privacy details.
- [ ] TestFlight.
- [ ] iPhone/iPad screenshots as supported.
- [ ] VoiceOver/Dynamic Type checks.
- [ ] Crash symbol upload.
- [ ] Review notes explaining data sources/location behavior if useful.

## Accessibility before store submission

Test at minimum:
- large text,
- screen reader,
- dark mode,
- high contrast,
- landscape/tablet where supported,
- no color-only drainage status.

## Release tracks

Recommended:

```text
dev → internal → beta/TestFlight → production
```

Backend/API compatibility must be maintained during staged mobile rollout because old app versions can remain installed.

## Version compatibility

Mobile should send app/schema version headers where useful. API should define a compatibility window instead of requiring synchronized server/client deployment.

## Free-product principle

Current product direction is free for end users. Do not add ads, subscriptions or billing SDKs without an explicit future product decision/ADR and privacy review.
