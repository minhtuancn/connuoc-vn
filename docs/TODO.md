# TODO — Con Nước Việt

Tài liệu này là backlog kỹ thuật cấp repository. Issue GitHub sẽ được tạo theo epic/task sau khi foundation được merge.

## P0 — Foundation blockers

- [ ] Chốt source-code license.
- [ ] Tạo ADR-001: monorepo + stack.
- [ ] Tạo ADR-002: tide engine strategy.
- [ ] Tạo ADR-003: datum and water-level comparison policy.
- [ ] Tạo ADR-004: offline data packaging.
- [ ] Tạo ADR-005: provenance and source licensing.
- [ ] Xây inventory nguồn dữ liệu Việt Nam: authoritative/public/partner/manual.
- [ ] Ghi rõ license/terms/rate limits của từng source.
- [ ] Thu thập tide reference fixtures.
- [ ] Thu thập known-date lunar fixtures.
- [ ] Định nghĩa domain glossary Việt/Anh.
- [ ] Chốt coding standards và branch/PR convention.

## P0 — Repository/tooling

- [ ] Bootstrap Flutter app.
- [ ] Bootstrap Next.js web.
- [ ] Bootstrap Next.js admin.
- [ ] Bootstrap NestJS API.
- [ ] Bootstrap worker packages.
- [ ] Setup pnpm workspace for JS/TS areas.
- [ ] Setup lint/format/typecheck.
- [ ] Setup Flutter analyze/test.
- [ ] Setup unit/integration CI.
- [ ] Setup dependency update policy.
- [ ] Setup secret scanning where available.
- [ ] Setup CODEOWNERS after team ownership is known.

## P0 — Shared contracts

- [ ] `StationSchema`.
- [ ] `RiverSchema`.
- [ ] `BasinSchema`.
- [ ] `EstuarySchema`.
- [ ] `WaterLevelObservationSchema`.
- [ ] `ForecastRunSchema`.
- [ ] `ForecastPointSchema`.
- [ ] `DataSourceSchema`.
- [ ] `DataQualitySchema`.
- [ ] `DatumSchema`.
- [ ] `DrainageSiteSchema`.
- [ ] `DrainageWindowSchema`.

## P1 — Tide engine

- [ ] Harmonic constituent representation.
- [ ] Prediction API independent from network/database.
- [ ] UTC/local-time conversion rules.
- [ ] Extrema detection.
- [ ] Rising/falling determination.
- [ ] Reference datum metadata.
- [ ] Numerical tolerances documented.
- [ ] Golden tests.
- [ ] Benchmark against trusted reference.
- [ ] Explain prediction/model metadata.

## P1 — Vietnamese lunar calendar

- [ ] Solar → lunar conversion.
- [ ] Lunar → solar conversion.
- [ ] Leap month rules.
- [ ] Timezone Asia/Ho_Chi_Minh correctness.
- [ ] Can Chi.
- [ ] Solar terms.
- [ ] Moon-phase interface.
- [ ] Fixture tests across 1900–2100 target range or approved supported range.

## P1 — Database

- [ ] PostgreSQL/PostGIS migrations.
- [ ] Station/entity spatial models.
- [ ] Observation partitioning strategy.
- [ ] Forecast runs + versioning.
- [ ] Raw source import metadata.
- [ ] Audit log.
- [ ] Retention policy.
- [ ] Backup/restore runbook.

## P1 — API

- [ ] `/locations/search`.
- [ ] `/stations/:id`.
- [ ] `/stations/:id/tide`.
- [ ] `/stations/:id/water-level`.
- [ ] `/calendar`.
- [ ] `/offline/regions/:id/manifest`.
- [ ] OpenAPI.
- [ ] Problem-details/error format.
- [ ] Pagination/filter conventions.
- [ ] Rate limiting.
- [ ] Cache headers.

## P1 — Mobile MVP

- [ ] App shell/navigation.
- [ ] Location chooser.
- [ ] Home summary.
- [ ] Tide chart.
- [ ] Calendar.
- [ ] Station detail.
- [ ] Favorites.
- [ ] Settings.
- [ ] Font scaling presets.
- [ ] High-contrast mode.
- [ ] Screen reader semantics.
- [ ] Offline region download.
- [ ] Stale data badge.
- [ ] Source/provenance panel.
- [ ] Deep links.

## P1 — Web

- [ ] Landing.
- [ ] Station/location search.
- [ ] Chart/calendar.
- [ ] Shareable station/date URL.
- [ ] Accessible responsive layout.
- [ ] PWA exploration.

## P1 — Admin

- [ ] RBAC.
- [ ] Station management.
- [ ] Data-source registry.
- [ ] Import run viewer.
- [ ] Quality flags/review.
- [ ] Forecast run viewer.
- [ ] Audit log.

## P2 — Offline

- [ ] SQLite/Drift schema.
- [ ] Region manifest format.
- [ ] Package signing/checksum.
- [ ] Atomic update.
- [ ] Background refresh.
- [ ] Quota/storage management.
- [ ] User-controlled delete downloads.
- [ ] Offline test matrix.

## P2 — Drainage engine

- [ ] Define required vs optional inputs.
- [ ] ΔH calculation.
- [ ] Datum compatibility gate.
- [ ] Freshness gate.
- [ ] Inside/outside trend rules.
- [ ] Forecast window search.
- [ ] Gate geometry model.
- [ ] Score model v1.
- [ ] Confidence model v1.
- [ ] Missing-data handling.
- [ ] `GOOD/POSSIBLE/NOT_RECOMMENDED/INSUFFICIENT_DATA` status.
- [ ] Human-readable reasons.
- [ ] Manual-level entry flow.
- [ ] Pilot-site validation.

## P2 — Maps

- [ ] MapLibre integration.
- [ ] OSM attribution/license compliance.
- [ ] Station layer.
- [ ] River layer.
- [ ] Estuary layer.
- [ ] Sluice layer.
- [ ] Layer filters.
- [ ] Clustering/performance.
- [ ] Offline map policy.

## P2 — PDF/export

- [ ] PDF rendering architecture decision.
- [ ] A4/A3.
- [ ] Portrait/landscape.
- [ ] Day template.
- [ ] Week template.
- [ ] Month template.
- [ ] Year/wall-calendar template.
- [ ] Drainage template.
- [ ] Large-print template.
- [ ] Black-and-white print-safe mode.
- [ ] QR/deep link.
- [ ] Source/datum/generated-at footer.
- [ ] CSV export.

## P2 — Notifications

- [ ] FCM/APNs infrastructure.
- [ ] High/low notification.
- [ ] Drainage window notification.
- [ ] Stale source alert.
- [ ] User lead-time settings.
- [ ] Quiet hours.
- [ ] Deduplication.

## P3 — Community

- [ ] Observation submission.
- [ ] Manual gauge reading.
- [ ] Flow direction/start/stop report.
- [ ] Moderation.
- [ ] Trust/reputation.
- [ ] Outlier detection.
- [ ] Public vs private observation policy.
- [ ] Privacy/location review.

## P3 — Local calibration

- [ ] Lag estimator.
- [ ] Damping estimator.
- [ ] Seasonal calibration.
- [ ] Error metrics.
- [ ] Confidence evolution.
- [ ] Calibration history/versioning.

## P3 — IoT

- [ ] Device identity/provisioning.
- [ ] MQTT topic convention.
- [ ] Sensor payload schema.
- [ ] Timestamp/time-sync requirements.
- [ ] Device health.
- [ ] Calibration records.
- [ ] Ultrasonic reference integration.
- [ ] Pressure sensor reference integration.
- [ ] LoRaWAN gateway pattern.

## P3 — Store/release

- [ ] Android package/application ID.
- [ ] iOS bundle ID.
- [ ] App icons/splash assets.
- [ ] Privacy Policy URL.
- [ ] Terms/Disclaimer.
- [ ] Google Play Data Safety.
- [ ] App Store Privacy.
- [ ] Permission rationale.
- [ ] Account deletion if account feature ships.
- [ ] TestFlight pipeline.
- [ ] Android internal/closed testing pipeline.
- [ ] Versioning/changelog/release notes.

## P3 — Observability/operations

- [ ] Structured logs.
- [ ] OpenTelemetry.
- [ ] Prometheus metrics.
- [ ] Grafana dashboards.
- [ ] Error/crash reporting.
- [ ] Source freshness dashboard.
- [ ] Queue/job dashboard.
- [ ] Backup alerting.
- [ ] Status page strategy.

## Research backlog

- [ ] Compare tide harmonic libraries and licensing.
- [ ] Evaluate trustworthy nationwide station datasets.
- [ ] Research river lag models suitable for sparse observations.
- [ ] Evaluate open-source lunar-calendar implementations only as references; implement/test against trusted astronomical rules.
- [ ] Research official administrative-boundary datasets.
- [ ] Research print/PDF Vietnamese font licensing.
- [ ] Evaluate hydrology/weather source agreements and redistribution rights.
- [ ] Determine if tide-current/surge models belong in core product or later specialist mode.

## Definition of Done for domain logic

A domain-logic task is not done unless:

- [ ] public API documented,
- [ ] unit tests exist,
- [ ] edge cases documented,
- [ ] reference/fixture tests exist when externally verifiable,
- [ ] timezone/unit/datum rules are explicit,
- [ ] errors are typed/structured,
- [ ] no hidden network dependency,
- [ ] changelog/ADR updated for breaking decisions.
