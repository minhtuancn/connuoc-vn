# `shared-types`

Schema-first shared contracts for API/domain boundaries.

## Candidate contracts
- Station / River / Basin / Estuary.
- WaterLevelObservation.
- ForecastRun / ForecastPoint.
- DataSource / DataQuality / Datum.
- DrainageSite / DrainageWindow.
- OfflineRegionManifest.

Rules:
- Keep schemas explicit and versionable.
- Do not expose database ORM entities directly.
- Prefer runtime validation plus generated/static types where practical.
- Breaking contract changes require migration notes/tests.
