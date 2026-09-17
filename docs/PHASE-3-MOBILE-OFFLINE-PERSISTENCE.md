# Phase 3 Mobile Offline Persistence

Issue: #42  
Parent: #39  
Status: implementation in progress

## Scope

This work adds Drift-backed local persistence behind the existing `PublicDataRepository` boundary without changing public API transport contracts.

The implementation follows:

- `docs/superpowers/specs/2026-09-16-mobile-offline-persistence-design.md`
- `docs/superpowers/plans/2026-09-16-mobile-offline-persistence.md`

## TDD tracker

- [x] Design approved.
- [x] Implementation plan committed.
- [x] Task 1 migration contract test committed before database implementation.
- [ ] Drift schema and v1 -> v2 migration.
- [ ] Typed cache round-trip.
- [ ] Favorites/preferences persistence.
- [ ] Stale-while-revalidate and last-known-good repository.
- [ ] Atomic offline-pack persistence.
- [ ] Riverpod composition and generated-code CI gate.
- [ ] Fresh merge-ref Android/iOS/backend regression verification.

No production UI, map tiles, cloud accounts, admin credentials, or duplicated tide/lunar/drainage formulas belong in #42.
