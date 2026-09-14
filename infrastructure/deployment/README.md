# Deployment

Environment deployment manifests/templates belong here after the target runtime is chosen.

Initial topology should support:
- web,
- admin,
- API,
- independent workers,
- PostgreSQL/PostGIS,
- Redis,
- object storage,
- observability.

Keep deployment portable enough for self-hosted container platforms while preserving a path to cloud-managed services.

See `docs/DEPLOYMENT.md`.
