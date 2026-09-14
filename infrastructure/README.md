# Infrastructure

Planned infrastructure layout:

```text
infrastructure/
├── docker/
├── database/
├── monitoring/
├── deployment/
└── scripts/
```

## Responsibilities

### docker
Local-development containers and service images.

### database
PostgreSQL/PostGIS initialization, migrations support scripts and backup/restore tooling references.

### monitoring
Prometheus/Grafana/OpenTelemetry dashboards/configuration.

### deployment
Environment manifests/templates for self-hosted or cloud deployment.

## Principles
- Infrastructure config must not contain secrets.
- Production image/runtime versions must be pinned and reviewed.
- Local-dev convenience must not weaken production defaults.
- Backup/restore must be tested before public production release.
- Deployment should keep workers independently scalable while avoiding premature microservices.

See `docs/DEPLOYMENT.md`.
