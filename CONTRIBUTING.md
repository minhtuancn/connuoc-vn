# Contributing to Con Nước Việt

## Workflow

1. Open/choose an issue with clear scope.
2. Create a focused branch.
3. Keep changes inside one bounded context where practical.
4. Add/update tests for domain logic.
5. Update docs/ADR for architectural or contract changes.
6. Open a PR using the repository template.

## Branch naming

Recommended:

```text
feat/<scope>-<short-name>
fix/<scope>-<short-name>
docs/<short-name>
chore/<short-name>
research/<short-name>
```

## Commit style

Use Conventional Commit-style messages where practical:

```text
feat(tide): add extrema detector
fix(calendar): correct leap-month boundary
docs: document datum policy
```

## Domain safety rules

Changes to tide, lunar, hydrology or drainage logic require:
- explicit units/timezone/datum assumptions,
- tests,
- reference fixtures when externally verifiable,
- no hidden network dependency in pure engines,
- documented numerical tolerances,
- migration/version note for breaking changes.

## Data-source changes

Any new source must document:
- operator/owner,
- URL,
- license/terms,
- redistribution/attribution rules,
- update frequency,
- timezone/unit/datum semantics,
- sample fixture where permitted,
- parser tests,
- freshness/error behavior.

## PR size

Prefer small reviewable PRs. Large generated foundation changes are acceptable only when establishing a new subsystem and should still be logically grouped.

## Formatting and generated files

Do not commit:
- secrets,
- local `.env`,
- build output,
- IDE user settings,
- unlicensed font binaries,
- raw datasets that cannot legally be redistributed.

## Definition of Done

A task is done when relevant code/tests/docs pass and the user-facing/source-data behavior is traceable and understandable.
