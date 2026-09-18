# Roadmap — Con Nước Việt

Roadmap ưu tiên tính đúng dữ liệu và khả năng sử dụng thực tế trước khi mở rộng feature.

Trạng thái triển khai ngắn gọn được cập nhật tại [`docs/PROJECT-STATUS.md`](PROJECT-STATUS.md). Roadmap này mô tả hướng dài hạn; GitHub issues/PRs là nguồn thực thi chi tiết.

## Phase 0 — Foundation

### Goal
Có một repository đủ rõ để nhiều developer/agent triển khai song song mà không làm sai domain.

### Deliverables
- [x] Product vision / README.
- [x] PRD.
- [x] System architecture.
- [x] Roadmap + TODO.
- [ ] Architecture Decision Records nền tảng.
- [ ] Data-source inventory và license review.
- [ ] Tide reference datasets.
- [ ] Vietnamese lunar calendar reference datasets.
- [ ] Drainage terminology/data dictionary.
- [ ] Initial design system and Figma/wireframes.
- [ ] CI baseline.

### Exit criteria
- Domain boundaries được review.
- Có ít nhất một nguồn/fixture có thể kiểm chứng tide engine.
- Có test strategy cho lịch âm và tide engine.
- Các data model chính không còn blocking ambiguity.

---

## Phase 1 — Core Engines

### Goal
Xây dựng core deterministic libraries trước UI production.

### Tide engine
- Harmonic constituent model.
- Timezone-safe prediction.
- High/low extrema detection.
- Rising/falling detection.
- Datum metadata.
- Golden tests/reference fixtures.
- Benchmark.

### Lunar calendar
- Gregorian ↔ Vietnamese lunar conversion.
- Leap month handling.
- Can Chi.
- Solar terms.
- Moon phase interface.
- Known-date fixtures across decades.

### Geo/shared
- Station/river/basin identifiers.
- Vietnamese text normalization/search.
- Spatial DTOs.
- Validation schemas.

### Exit criteria
- Engines run without network.
- Unit/golden tests green.
- Public package interfaces documented.

---

## Phase 2 — Backend & Data Platform

### Goal
Tạo nền dữ liệu có provenance và API ổn định.

### Backend
- NestJS API skeleton.
- PostgreSQL + PostGIS migrations.
- Redis/BullMQ.
- Station/source/observation/forecast schemas.
- OpenAPI.
- Admin auth/RBAC.
- Audit log.

### Data ingestion
- Source adapter interface.
- Raw payload archive/checksum.
- Parser/normalizer pipeline.
- Quality flags.
- Retry/dead-letter rules.
- Freshness metrics.

### Exit criteria
- Import một source fixture end-to-end.
- API trả station/tide data có provenance.
- Re-import cùng payload không tạo duplicate.

---

## Phase 3 — Mobile MVP

### Goal
Android/iOS app có thể dùng thực tế cho lịch con nước cơ bản.

### Screens
- Onboarding.
- Home water status.
- Location/station search.
- Tide chart.
- Calendar month/day.
- Station details.
- Favorites.
- Settings.
- Offline downloads.
- About/source/disclaimer.

### Accessibility
- Dynamic text scaling.
- Large/extra-large mode.
- Screen-reader semantics.
- High contrast.
- State not color-only.

### Offline
- SQLite/Drift.
- Region manifest.
- Atomic sync.
- Stale state indication.

### Exit criteria
- Critical journeys work on Android + iOS.
- Downloaded station data remains usable offline.
- Core app usable with 200% text scale target where platform layout permits.

Current execution status is tracked by Epic #39: #40 and #41 are merged; #42 is active in draft PR #50; #43–#47 remain open.

---

## Phase 4 — Public Web & Admin

### Public web
- Landing/product explanation.
- Search/map.
- Station details/chart/calendar.
- Shareable deep links.
- SEO-friendly location pages where appropriate.

### Admin
- Station CRUD/review.
- Source configuration metadata.
- Import monitoring.
- Forecast runs.
- Quality flags.
- Data corrections with audit log.

### Exit criteria
- Public read experience consistent with mobile.
- Admin can trace a displayed value back to source/import run.

---

## Phase 5 — Vietnam Coverage & Weather/Hydrology Intelligence

### Goal
Mở rộng theo vùng/lưu vực Việt Nam và bổ sung thời tiết, lượng mưa, dự báo dòng chảy, dự báo nước dâng đã hiệu chỉnh và đánh giá nguy cơ ngập có provenance, uncertainty và giới hạn sử dụng rõ ràng.

Epic: #52 — Weather & Hydrology Intelligence.

Design: `docs/superpowers/specs/2026-09-17-weather-hydrology-intelligence-design.md`.

Vietnam taxonomy amendment: `docs/superpowers/specs/2026-09-17-vietnam-administrative-taxonomy-amendment.md`.

### Administrative baseline

Từ 01/07/2025, mô hình chính quyền địa phương hiện hành của Việt Nam là 2 cấp: cấp tỉnh và cấp xã. Phase 5 sử dụng 34 đơn vị cấp tỉnh cùng các xã/phường/đặc khu hiện hành theo mã chính thức. Cấp huyện cũ chỉ được giữ dưới dạng historical/legacy aliases hoặc boundary history để tra cứu dữ liệu cũ; không được trình bày như cấp hành chính hiện hành.

### Workstreams / dependency order

- [x] #53 Phase 5A — Vietnam location taxonomy + provider platform foundation — **completed and merged**.
- [x] #54 Phase 5B — Multi-provider weather forecasts + normalized public APIs — **completed and merged via PR #102**.
- [x] #55 Phase 5C — Rainfall observations/history/forecast + accumulation features — **completed and regression-gated in PR #109**.
- [ ] #56 Phase 5D — River network enrichment + GEOGLOWS/GloFAS discharge forecasts.
- [ ] #57 Phase 5E — Gauge calibration, rating curves + river-rise forecasts.
- [ ] #58 Phase 5F — Flood-risk engine + hazard/susceptibility baselines.
- [ ] #59 Phase 5G — Vietnamese official alerts + partner-feed framework.
- [ ] #60 Phase 5H — Admin provider configuration, health, quota + usage operations.
- [ ] #61 Phase 5I — Mobile/web weather, river + flood-risk journeys with location UX.
- [ ] #62 Phase 5J — Pilot calibration, backtesting + Phase 5 exit gate.

Phase 5 snapshot 2026-09-18: **3 workstreams completed, 7 remaining**. The subsystem now has location/provider, normalized weather and normalized rainfall foundations, but is not yet close to the Phase 5 exit gate because river discharge, river calibration, flood risk and pilot validation remain.

Dependency graph:

`#53 → (#54 || #55 || #56 || #59 || #60)`

`#54 + #55 + #56 → #57`

`#55 + #56 + #57 → #58`

`#53 + #54 + #55 + #56 + #58 + #59 → #61`

`#53..#61 → #62`

### Core data/coverage work
- Current province/city → commune/ward/special-zone taxonomy with effective dates and historical aliases.
- Estuaries, basins, river reaches and major river networks.
- Station aliases and historical names.
- Tide-to-river lag/calibration metadata where evidence supports it.
- Weather/rain integration.
- Regional source adapters.
- Coverage/confidence map.
- Multi-provider source policy with free/paid provider configuration in Admin.
- Provider health, quota/budget, licence/commercial and attribution controls.

### Scientific/safety gates
- Observed, estimated, forecast, simulated, derived and stale values remain explicitly distinct.
- Never fabricate stage/water level from discharge.
- A precise future stage requires provider-native stage with known datum, a validated rating curve, or a locally calibrated model with documented metrics.
- Numerical flood probability requires an explicitly calibrated probability model and validation set; otherwise expose risk band/confidence/reasons.
- Official Vietnamese warnings remain separately attributed and are never transformed into an invented internal probability.
- Coarse/global flood products are hazard/susceptibility baselines, not official street-level inundation maps.
- Provider credentials stay server-side; public/mobile contracts remain vendor-neutral.

### Rollout strategy
1. Phase 5A provider/location foundation and source/licence review.
2. Phase 5B normalized weather provider/API foundation.
3. Phase 5C normalized rainfall observations/history/forecast, accumulation and bounded LKG foundation.
4. Add river discharge and build an evidence-rich pilot with weather/rain/discharge data.
5. Calibrate/backtest station/river-rise/flood-risk only where local observations support it.
6. Northern delta/estuaries.
7. Central coast.
8. Southern delta/coast.
9. Expand to nationwide coverage while preserving explicit availability/confidence labels.

### Exit criteria
- Coverage page clearly says where data is observed, predicted, derived/interpolated or unavailable.
- Multi-provider pipeline has traceable provenance/freshness/licence state.
- At least one pilot area has reproducible held-out backtesting and documented error bounds.
- Provider fallback/quota/licence/health failure matrix is verified.
- No nationwide accuracy claim exceeds validated coverage.

---

## Phase 6 — Drainage Intelligence v1

### Goal
Trả lời có trách nhiệm câu hỏi: `Có thể tiêu/rút nước không?`

### Features
- Drainage site/cống model.
- Inside/outside water levels.
- Datum compatibility validation.
- ΔH and trend.
- Gate geometry.
- Manual level entry.
- Forecast window calculation.
- Status: GOOD / POSSIBLE / NOT_RECOMMENDED / INSUFFICIENT_DATA.
- Confidence and reasons.
- Recommended open/best/close window for decision support.
- Observation notes.

### Safety gates
- Never issue GOOD with stale mandatory data.
- Never compare unknown/incompatible datum as if equivalent.
- Always show whether level is observed, forecast or manual.
- No automated gate actuation.

### Exit criteria
- Field test at pilot sites.
- Predictions compared with recorded local observations.
- Error/uncertainty documented.

---

## Phase 7 — PDF & Professional Tools

### PDF templates
- Daily tide sheet.
- Weekly planner.
- Monthly lunar+tide calendar.
- Annual wall calendar.
- Drainage operation sheet.
- Aquaculture template.
- Navigation/fishing planning template.

### Options
- A4/A3.
- Portrait/landscape.
- Color/monochrome.
- Large-print.
- QR/deep link.
- Source/datum/generated timestamp.

### Export
- PDF.
- CSV.
- JSON for own data where applicable.
- Calendar/ICS events for selected alerts if useful.

---

## Phase 8 — Notifications & Widgets

- High/low tide alerts.
- Drainage window alerts.
- Stale-data warnings.
- Heavy-rain context notifications.
- Android home widget.
- iOS home/lock-screen widgets.
- Live Activity exploration.

---

## Phase 9 — Community Calibration

### Community observations
- Water starts flowing out/in.
- Water stand time.
- Manual gauge reading.
- Photo/notes with moderation.

### Calibration
- Site lag estimation.
- Damping estimation.
- Seasonal models.
- Confidence improvement based on validated history.

### Anti-abuse
- Reputation/verification.
- Outlier detection.
- Never silently overwrite official observations.

---

## Phase 10 — IoT

- Sensor device model.
- MQTT ingest.
- LoRaWAN integration pattern.
- Ultrasonic/pressure sensor reference integrations.
- Device health/battery/connectivity.
- Calibration records.
- Time synchronization.
- Sensor quality flags.

No remote actuator control until a separate safety/security architecture is approved.

---

## Phase 11 — Production & Stores

### Android
- Signing.
- Play listing.
- Data Safety.
- Permission review.
- Closed/open testing.
- Crash monitoring.

### iOS
- Certificates/profiles.
- Privacy manifest/review.
- App Store metadata.
- TestFlight.
- VoiceOver/accessibility check.

### Backend
- Production observability.
- Backup/restore drill.
- Disaster recovery notes.
- Rate limiting.
- Security review.
- Status page/source freshness indicators.

---

## Phase 12 — Public Platform

Possible later work:
- Public read API.
- Open-data portal for redistributable datasets.
- Partner integrations.
- Research datasets.
- Advanced hydrodynamic models where data supports them.
- AI explanation layer grounded only in deterministic result + cited source metadata.

## Priority rule

When roadmap items compete, use this order:

1. Correctness / safety.
2. Data provenance / freshness.
3. Core usability.
4. Offline/accessibility.
5. Coverage.
6. Convenience features.
7. AI/experimental features.
