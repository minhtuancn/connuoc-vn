# Deployment & Release Architecture

## Environments

Recommended:

```text
local
preview/dev
staging
production
```

Use separate databases/secrets per environment. Never share production credentials with preview CI.

## Backend topology

Initial deployment:

```text
Reverse Proxy / TLS
├── public web
├── admin web
└── API

PostgreSQL + PostGIS
Redis
Object Storage
Tide Worker
Weather/Hydrology Worker
Notification Worker
Prometheus / Grafana
Error tracking / OpenTelemetry collector
```

All server workloads should be containerized.

## Configuration

Use environment variables / secret stores for:
- database URL,
- Redis URL,
- object-storage credentials,
- external source credentials,
- push credentials,
- auth signing keys,
- telemetry endpoints.

`.env.example` contains names only, never secrets.

## Database

Production requirements before launch:
- automated backups,
- retention policy,
- tested restore procedure,
- migration strategy,
- PostGIS extension provisioned,
- connection pooling appropriate to deployment.

Migration rules:
- forward migrations reviewed,
- destructive changes require explicit migration plan,
- large data migrations separated from app boot.

## Redis/queues

Workers must support:
- retry with bounded backoff,
- idempotency,
- dead-letter/failed-job visibility,
- graceful shutdown,
- metrics.

## Object storage

Use for suitable raw payload archives/import artifacts/generated exports where policy permits.
Do not make raw source payloads public by default.

## CI/CD

Pull request:
- lint/format,
- typecheck/analyze,
- unit tests,
- schema/contract tests,
- build smoke tests.

Main:
- reproducible build,
- migration check,
- image build,
- vulnerability/security checks where available,
- staging deployment.

Production:
- tagged/versioned release,
- explicit approval until automation maturity is proven,
- rollback strategy,
- migration compatibility check.

## Container images

- minimal runtime image,
- non-root user where practical,
- fixed runtime versions,
- no dev dependencies in production runtime,
- OCI labels/version metadata,
- immutable release tag/digest.

## Mobile Android

Release pipeline eventually includes:
- application ID,
- signing setup,
- build flavors,
- internal/closed testing,
- Play Store metadata,
- Data Safety declaration,
- crash monitoring mapping/symbols.

## Mobile iOS

Release pipeline eventually includes:
- bundle ID,
- signing/provisioning,
- staging/production configuration,
- TestFlight,
- App Store metadata/privacy,
- dSYM upload where required for crash symbolication.

## Versioning

Use semantic versioning for app/API/domain packages where practical, with release notes.

Data/model versions are independent of app version:

```text
appVersion
apiVersion
tideModelVersion
drainageModelVersion
dataPackVersion
parserVersion
```

## Observability

Dashboards/alerts should include:
- API availability/latency,
- source freshness,
- failed imports,
- forecast generation failures,
- queue depth,
- notification failure rate,
- database capacity,
- mobile crash-free sessions.

## Rollback

Must support:
- application rollback,
- disabling bad source adapters,
- invalidating a forecast run/data pack,
- rolling back configuration,
- restoring DB from backup for disaster cases.

Prefer backward-compatible migrations to simplify rollback.

## Store readiness checklist

Before first public release:
- Privacy Policy.
- Terms/disclaimer.
- Permission rationale.
- Location optional path works.
- Account deletion implemented if account exists.
- Accessibility smoke tests.
- Offline behavior tested.
- Source attribution verified.
- App icons/screenshots/store copy.
- Crash/error monitoring enabled.
- Backend status/freshness monitoring enabled.
