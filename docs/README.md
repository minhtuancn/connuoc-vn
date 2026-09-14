# Documentation Index

## Product
- [PRD](PRD.md)
- [Roadmap](ROADMAP.md)
- [TODO](TODO.md)
- [Domain glossary](DOMAIN-GLOSSARY.md)

## Architecture
- [System architecture](ARCHITECTURE.md)
- [Repository structure & dependency rules](REPOSITORY-STRUCTURE.md)
- [Data sources & provenance](DATA-SOURCES.md)
- [Tide engine](TIDE-ENGINE.md)
- [Drainage engine](DRAINAGE-ENGINE.md)
- [Vietnamese lunar calendar](LUNAR-CALENDAR.md)
- [Offline strategy](OFFLINE.md)

## Experience
- [UI/UX](UI-UX.md)
- [Accessibility](ACCESSIBILITY.md)
- [PDF/print export](PDF-EXPORT.md)

## Engineering / operations
- [Security & privacy](SECURITY-PRIVACY.md)
- [Testing strategy](TESTING.md)
- [Deployment](DEPLOYMENT.md)
- [App-store readiness](APP-STORES.md)

## Architecture decisions
- [ADR-0001: Monorepo and stack](ADR/0001-monorepo-and-stack.md)

## Documentation rules

- Architectural changes require an ADR when they alter long-lived boundaries/contracts.
- Data-source docs must include provenance/license/datum/time semantics.
- Domain engine changes must update corresponding spec if behavior/contracts change.
- Keep product roadmap distinct from implementation TODO/issue state.
