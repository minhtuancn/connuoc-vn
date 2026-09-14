# Repository Structure

## Physical foundation tree

```text
connuoc-vn/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── workflows/
│   │   └── ci.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── apps/
│   ├── mobile/
│   │   └── README.md
│   ├── web/
│   │   └── README.md
│   └── admin/
│       └── README.md
├── services/
│   ├── api/
│   │   └── README.md
│   ├── tide-worker/
│   │   └── README.md
│   ├── weather-worker/
│   │   └── README.md
│   └── notification-worker/
│       └── README.md
├── packages/
│   ├── tide-engine/
│   │   └── README.md
│   ├── lunar-calendar/
│   │   └── README.md
│   ├── drainage-engine/
│   │   └── README.md
│   ├── geo/
│   │   └── README.md
│   ├── shared-types/
│   │   └── README.md
│   └── design-tokens/
│       └── README.md
├── data/
│   ├── stations/
│   ├── rivers/
│   ├── fixtures/
│   └── README.md
├── infrastructure/
│   ├── docker/
│   ├── database/
│   ├── monitoring/
│   ├── deployment/
│   └── README.md
├── scripts/
│   └── check-foundation.mjs
├── docs/
│   ├── ADR/
│   │   └── 0001-monorepo-and-stack.md
│   ├── README.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── REPOSITORY-STRUCTURE.md
│   ├── ROADMAP.md
│   ├── TODO.md
│   ├── DOMAIN-GLOSSARY.md
│   ├── DATA-SOURCES.md
│   ├── TIDE-ENGINE.md
│   ├── DRAINAGE-ENGINE.md
│   ├── LUNAR-CALENDAR.md
│   ├── UI-UX.md
│   ├── ACCESSIBILITY.md
│   ├── OFFLINE.md
│   ├── PDF-EXPORT.md
│   ├── SECURITY-PRIVACY.md
│   ├── TESTING.md
│   ├── DEPLOYMENT.md
│   └── APP-STORES.md
├── .editorconfig
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── SECURITY.md
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Implementation target tree

After bootstrap issues are completed, the major directories should evolve approximately as follows.

### `apps/mobile`

```text
apps/mobile/
├── android/
├── ios/
├── lib/
│   ├── app/
│   ├── core/
│   │   ├── accessibility/
│   │   ├── database/
│   │   ├── design/
│   │   ├── localization/
│   │   └── network/
│   ├── features/
│   │   ├── home/
│   │   ├── tide/
│   │   ├── calendar/
│   │   ├── map/
│   │   ├── drainage/
│   │   ├── offline/
│   │   ├── notifications/
│   │   └── settings/
│   └── shared/
├── test/
└── integration_test/
```

### `apps/web` / `apps/admin`

```text
src/
├── app/
├── features/
├── components/
├── lib/
└── styles/
```

Use feature/domain boundaries rather than a large global components/services bucket.

### `services/api`

```text
services/api/
├── src/
│   ├── common/
│   ├── modules/
│   │   ├── health/
│   │   ├── locations/
│   │   ├── stations/
│   │   ├── tide/
│   │   ├── hydrology/
│   │   ├── calendar/
│   │   ├── drainage/
│   │   ├── offline/
│   │   ├── exports/
│   │   ├── auth/
│   │   └── admin/
│   └── main.ts
├── test/
└── migrations-or-db-client/
```

### Worker pattern

```text
services/<worker>/
├── src/
│   ├── jobs/
│   ├── adapters/
│   ├── parsers/
│   ├── metrics/
│   └── main.ts
└── test/
```

### Domain package pattern

```text
packages/<domain>/
├── src/
│   ├── index.ts
│   ├── domain/
│   └── errors/
├── test/
└── README.md
```

The exact language/layout may differ for a package if justified by an ADR, but dependency direction must remain stable.

## Dependency rules

```text
apps ───────────────► API/contracts/design
services ───────────► domain packages/shared types
workers ────────────► domain packages/shared types + repositories
pure domain packages► other pure utility/contracts only
infrastructure ─────► deploy/runtime configuration
```

Forbidden dependency directions:

```text
tide-engine      -X-> API / UI / database implementation
drainage-engine  -X-> source adapters / UI / actuator
lunar-calendar   -X-> network / database / UI
web/mobile       -X-> production database directly
shared-types     -X-> app-specific code
```

## Ownership boundaries for agents

Typical agent task scopes should be one of:
- `mobile:<feature>`
- `web:<feature>`
- `admin:<feature>`
- `api:<module>`
- `worker:<source-or-job>`
- `engine:tide`
- `engine:drainage`
- `engine:calendar`
- `data:<source-or-region>`
- `infra:<area>`

An orchestrator should load the relevant package/module plus shared contracts/docs, not the entire monorepo unless doing architecture-wide work.

## Cross-cutting changes

Changes touching 3+ bounded contexts should normally start with:
1. contract/ADR change,
2. isolated engine/shared change,
3. API adapter change,
4. client adoption,
5. migration/removal of old contract.

This keeps large multi-agent tasks reviewable and reduces token/context cost.
