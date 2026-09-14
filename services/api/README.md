# API Service

Target: NestJS REST/BFF API.

## Responsibilities
- Public station/location/tide/calendar endpoints.
- Authenticated user preferences/favorites in later phases.
- Drainage-site and decision-support endpoints.
- Admin APIs with RBAC.
- OpenAPI contract.
- Validation, rate limiting, cache semantics and audit hooks.

## Proposed modules

```text
src/
├── common/
├── modules/
│   ├── health/
│   ├── locations/
│   ├── stations/
│   ├── tide/
│   ├── hydrology/
│   ├── calendar/
│   ├── drainage/
│   ├── offline/
│   ├── exports/
│   ├── auth/
│   └── admin/
└── main.ts
```

The API coordinates domain packages/repositories; it must not duplicate domain formulas.
