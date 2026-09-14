# Admin Console

Target: Next.js administration console for trusted operators/data maintainers.

## Responsibilities
- Station/river/estuary/sluice metadata review.
- Data-source registry.
- Import job monitoring.
- Raw/normalized provenance trace.
- Data-quality flags and corrections.
- Forecast-run inspection.
- Drainage-site configuration review.
- User/community moderation in later phases.
- Audit-log viewer.

## Access
Admin is never public/anonymous. Use strong authentication and RBAC roles defined in architecture docs.

## Proposed source layout

```text
src/
├── app/
├── features/
│   ├── stations/
│   ├── sources/
│   ├── imports/
│   ├── forecasts/
│   ├── drainage-sites/
│   ├── quality/
│   └── audit/
├── components/
└── lib/
```

Admin mutations must go through API authorization/business rules and produce audit events.
