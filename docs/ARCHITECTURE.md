# Architecture — Con Nước Việt

## 1. Architecture goals

Kiến trúc phải đáp ứng đồng thời 6 yêu cầu:

1. Mobile Android/iOS hoạt động tốt cả online và offline.
2. Dữ liệu thủy triều/thủy văn có provenance, version và confidence rõ ràng.
3. Engine tính toán quan trọng phải deterministic, testable và tách khỏi UI.
4. Hỗ trợ mở rộng từ tide app sang river/drainage/IoT mà không phá vỡ core.
5. Hệ thống triển khai được trên hạ tầng self-hosted phổ biến nhưng vẫn có thể chuyển cloud.
6. Monorepo đủ rõ để nhiều agent/developer làm song song với phạm vi nhỏ.

## 2. Recommended stack

### Client
- `apps/mobile`: Flutter + Dart.
- `apps/web`: Next.js + TypeScript.
- `apps/admin`: Next.js + TypeScript.

### Backend
- `services/api`: NestJS + TypeScript.
- PostgreSQL + PostGIS.
- Redis for cache, locks, queue coordination and short-lived state.
- Queue abstraction: BullMQ initially; keep boundary replaceable.

### Workers
- `services/tide-worker`: source ingestion, harmonic prediction, station forecast generation.
- `services/weather-worker`: rain/weather/hydrology ingestion and normalization.
- `services/notification-worker`: alerts, scheduled notification evaluation and delivery.

### Shared domain packages
- `packages/tide-engine`
- `packages/lunar-calendar`
- `packages/drainage-engine`
- `packages/geo`
- `packages/shared-types`
- `packages/design-tokens`

## 3. Logical architecture

```text
                  ┌──────────────────────┐
                  │     Mobile Flutter   │
                  │ Android / iOS        │
                  └──────────┬───────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
┌──────────▼─────────┐ ┌─────▼──────┐ ┌───────▼───────┐
│ Public Web / PWA   │ │ Admin Web  │ │ PDF/Share UI  │
└──────────┬─────────┘ └─────┬──────┘ └───────┬───────┘
           └─────────────────┼──────────────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │   NestJS API    │
                    │ REST / BFF      │
                    └────────┬────────┘
                             │
       ┌─────────────────────┼───────────────────────┐
       │                     │                       │
┌──────▼──────┐      ┌───────▼────────┐      ┌──────▼───────┐
│ PostgreSQL  │      │      Redis      │      │ Object Store │
│ + PostGIS   │      │ cache / queue   │      │ raw/imports  │
└──────┬──────┘      └───────┬────────┘      └──────────────┘
       │                     │
       └───────────┬─────────┘
                   │
    ┌──────────────┼───────────────────────────┐
    │              │                           │
┌───▼────────┐ ┌───▼───────────┐       ┌──────▼────────────┐
│ Tide Worker│ │ Weather/Hydro │       │ Notification      │
│            │ │ Worker        │       │ Worker            │
└───┬────────┘ └────┬──────────┘       └───────────────────┘
    │               │
    └───────┬───────┘
            │
  Official/Public/Partner Sources
```

## 4. Domain boundaries

### 4.1 Tide domain
Owns:
- harmonic constituents,
- astronomical tide predictions,
- high/low extrema,
- rising/falling state,
- prediction versioning,
- datum awareness.

Must not own:
- river flood forecast,
- gate control,
- arbitrary AI reasoning.

### 4.2 Hydrology domain
Owns:
- observed water levels,
- forecast river levels,
- river discharge when available,
- rainfall aggregation,
- quality flags,
- source normalization.

### 4.3 Drainage domain
Owns:
- upstream/downstream station pairing,
- gate geometry,
- ΔH calculations,
- drainage windows,
- confidence and missing-input rules,
- local lag/calibration parameters.

### 4.4 Calendar domain
Owns:
- Gregorian date,
- Vietnamese lunar date,
- Can Chi,
- solar terms,
- moon phase interface.

### 4.5 Geo domain
Owns:
- stations,
- rivers,
- basins,
- estuaries,
- sluices,
- spatial queries,
- nearest-station and area relationships.

## 5. Data architecture

### 5.1 Core entities

```text
Station
River
Basin
Estuary
SluiceGate
DataSource
Observation
ForecastRun
ForecastPoint
HarmonicConstituent
DrainageConfiguration
DrainageWindow
UserFavorite
OfflineRegionManifest
CommunityObservation
SensorDevice (future)
```

### 5.2 Time-series strategy

MVP may use partitioned PostgreSQL tables. Avoid introducing a dedicated time-series database until query/load evidence requires it.

Recommended partition keys:
- observation: monthly by timestamp.
- forecast_point: by forecast run or monthly target time depending volume.

Indexes:
- `(station_id, observed_at desc)`.
- `(station_id, forecast_for)`.
- spatial GIST on station/entity geometry.

### 5.3 Datum safety

Never compare levels from two stations unless datum compatibility is known or an explicit conversion exists.

Every level record must carry:
- unit,
- datum identifier where known,
- source,
- quality state.

The drainage engine must reject or downgrade confidence when datum compatibility is unknown.

## 6. API boundaries

Version API from day one:

```text
/api/v1/locations/search
/api/v1/stations/:id
/api/v1/stations/:id/tide
/api/v1/stations/:id/water-level
/api/v1/calendar
/api/v1/drainage/sites/:id/status
/api/v1/drainage/sites/:id/windows
/api/v1/offline/regions/:id/manifest
/api/v1/pdf/jobs
```

Admin namespace:

```text
/api/v1/admin/sources
/api/v1/admin/stations
/api/v1/admin/imports
/api/v1/admin/forecast-runs
/api/v1/admin/audit
```

Use OpenAPI generation and contract tests.

## 7. Offline architecture

Mobile local storage:
- SQLite via Drift or equivalent.
- Separate tables for station metadata, tide predictions, calendar cache, favorites, offline manifests.
- Every cached dataset has `version`, `generatedAt`, `expiresAt`, `sourceSummary`.

Sync principles:
- stale-while-revalidate,
- last-known-good fallback,
- no destructive sync if new payload validation fails,
- region pack is versioned and atomic.

## 8. Data ingestion

Pipeline:

```text
Fetch → Raw archive → Parse → Normalize → Validate → Quality rules
      → Store → Forecast/derive → Publish cache → Notify clients
```

Requirements:
- idempotency key per source payload/run,
- preserve raw payload or checksum/reference,
- parser version recorded,
- source-specific retry/backoff,
- dead-letter handling,
- schema validation before write.

## 9. Tide prediction architecture

`packages/tide-engine` must be a pure library as much as possible.

Input:
- station coordinates/timezone,
- datum metadata,
- harmonic constituents,
- requested time range.

Output:
- water-level series,
- extrema,
- rising/falling state,
- metadata explaining model/version.

No network dependency inside core calculation.

## 10. Drainage decision architecture

`packages/drainage-engine` receives normalized domain inputs; it must not fetch APIs itself.

Input example:

```ts
{
  insideLevel,
  outsideLevel,
  insideTrend,
  outsideTrend,
  datumCompatibility,
  gateGeometry,
  freshness,
  forecastSeries,
  lagEstimate,
  rainfallContext
}
```

Output example:

```ts
{
  status: 'GOOD' | 'POSSIBLE' | 'NOT_RECOMMENDED' | 'INSUFFICIENT_DATA',
  windowStart,
  bestAt,
  windowEnd,
  deltaLevel,
  score,
  confidence,
  reasons,
  warnings,
  inputSnapshotId
}
```

This result is decision support only; no actuator integration in initial phases.

## 11. Authentication and authorization

Anonymous:
- public station/tide/calendar/map data,
- basic PDF generation with limits if needed.

Optional account:
- favorites sync,
- private drainage sites,
- notifications,
- community submissions,
- device/sensor ownership.

Admin roles:
- `viewer`
- `data_editor`
- `data_reviewer`
- `operator`
- `admin`

Admin mutations require audit events.

## 12. Observability

Minimum:
- structured JSON logs,
- request correlation ID,
- worker job ID,
- metrics for source freshness,
- import success/failure,
- forecast generation duration,
- queue depth,
- API latency,
- notification failures,
- mobile crash/error reporting.

Recommended stack:
- OpenTelemetry,
- Prometheus,
- Grafana,
- Sentry-compatible error tracking.

## 13. Security architecture

- Secrets only via runtime secret store/env, never committed.
- Separate public API and admin authorization policies.
- Rate limiting and abuse control.
- Strict input validation.
- SSRF protections for configurable source ingestion.
- Signed/validated file export jobs.
- Dependency scanning and secret scanning in CI where available.
- Audit logs append-only from application perspective.

## 14. Testing architecture

Testing pyramid:

```text
Pure engine unit tests
↓
Domain integration tests
↓
Database/API contract tests
↓
Worker/source fixture tests
↓
Mobile/web component tests
↓
E2E critical journeys
```

Golden/reference datasets are mandatory for tide/calendar/drainage computations.

## 15. Monorepo rules for parallel agents

- Each task should touch one bounded context where possible.
- Avoid cross-package changes unless an ADR/API contract requires it.
- Shared types are schema-first, not dumping ground.
- Engine packages must not import app/service code.
- UI cannot directly depend on database schema.
- Workers use domain services/contracts rather than bypassing validation.
- Every public contract change updates docs and tests.

## 16. Deployment topology

Initial production topology:

```text
Reverse proxy
├── web
├── admin
└── api

PostgreSQL/PostGIS
Redis
Object storage
Workers
Observability
```

All services containerized. Mobile releases are separate store pipelines.

## 17. Evolution path

### Stage 1
Single API service + three workers + Postgres/Redis.

### Stage 2
Scale workers independently, introduce read replicas/cache layers if needed.

### Stage 3
Partition high-volume observations, add sensor ingest gateway, streaming if justified.

Avoid premature microservices. Bounded modules and workers provide enough separation for early product stages.

## 18. Architecture decision records

Significant choices must be added to `docs/ADR/` including:
- stack/monorepo,
- tide computation strategy,
- datum handling,
- offline synchronization,
- source provenance,
- drainage confidence model,
- public API policy.
