# Project Status — Con Nước Việt

Snapshot: **2026-09-18**

This document is the short operational status view for the repository. `docs/ROADMAP.md` remains the long-term product roadmap; GitHub issues/PRs remain the execution source of truth.

## Executive status

The project is **not yet near full production completion**.

The deterministic core, backend/data platform, provider/location foundation, normalized weather forecasts, normalized rainfall intelligence and normalized river-discharge foundation are already substantial. However, the end-to-end product still has major work remaining in mobile UX/offline completion, calibrated river-rise, flood risk, official alerts, pilot backtesting, production hardening and store delivery.

A better description of the current state is:

- **Core/backend platform:** production-shaped and continuously verified.
- **Mobile MVP:** partially implemented; foundation/API client are merged, offline persistence is still in draft PR #50 and main user journeys remain open.
- **Weather/Hydrology Phase 5:** Phase 5A through Phase 5D are complete and regression-gated; Phase 5E–5J remain open.
- **Full public production product:** not complete.

## Current milestone dashboard

| Area | Status | Evidence / next gate |
| --- | --- | --- |
| Foundation / architecture | IN PLACE | PRD, architecture, roadmap, source/provenance policy and CI exist. Some documentation/design-system items remain iterative. |
| Core engines | IN PLACE, NOT SCIENTIFICALLY FINAL | Tide, lunar and geo packages are active in CI. Tide parity/scientific validation work remains separate from implementation correctness. |
| Phase 2 Backend & Data Platform | DONE / REGRESSION-GATED | NestJS API, PostGIS migrations, provenance, ingestion, admin RBAC/audit and Phase 2 exit workflow are in use. |
| Phase 3 Mobile MVP | IN PROGRESS | #40 and #41 merged. #42 is draft PR #50. #43–#47 remain open. |
| Phase 4 Public Web & Admin | PARTIAL | Backend admin foundation exists; complete public web/admin product journeys are not finished. |
| Phase 5A Location + Provider Platform | DONE | #53 closed; implementation merged via PR #51/#63 with dedicated Phase 5A gate. |
| Phase 5B Weather Forecasts | DONE | #54 closed via PR #102. Normalized contracts, Open-Meteo adapter boundary, provider fallback, cache/history, FRESH/STALE/UNAVAILABLE behavior and `/v1/weather/*` APIs are merged with a dedicated Phase 5B gate. |
| Phase 5C Rainfall | DONE / REGRESSION-GATED | #55 implemented in PR #109. Normalized rainfall taxonomy, accumulations, PostGIS persistence, provider fallback/LKG and `/v1/rainfall/*` APIs pass the dedicated Phase 5C gate. |
| Phase 5D River discharge | DONE / REGRESSION-GATED | #56 implemented in PR #110. Normalized reaches/provider mappings, GEOGLOWS/Open-Meteo Flood adapter boundaries, discharge persistence/LKG and `/v1/rivers/*` APIs pass the dedicated Phase 5D gate. GEOGLOWS v2 commercial use remains fail-closed pending product-level licence clarification. |
| Phase 5E Calibrated river-rise | READY / NOT STARTED | #57 open. Weather (#54), rainfall (#55) and discharge (#56) foundations are complete; exact stage still requires provider-native stage or validated local calibration/rating curves. |
| Phase 5F Flood risk | BLOCKED BY CALIBRATION | #58 open. Rainfall and discharge foundations are complete; numerical probability still requires #57 calibration evidence. |
| Phase 5G Official Vietnam alerts | NOT STARTED | #59 open; machine-use/redistribution rights remain approval-gated per source policy. |
| Phase 5H Provider operations | PARTIAL FOUNDATION | #60 open; provider configuration/RBAC/health/licence foundation exists from 5A, full quota/usage operations remain. |
| Phase 5I Mobile/Web weather-hydrology UX | NOT STARTED | #61 open and also depends on presentation foundations. |
| Phase 5J Pilot/backtesting exit gate | NOT STARTED | #62 open; required before broad accuracy claims. |
| Phase 6 Drainage Intelligence | NOT COMPLETE | Depends on reliable hydrology/datum inputs and field validation. |
| Phase 7 PDF / Professional tools | NOT COMPLETE | Planned after core operational data paths. |
| Phase 8 Notifications / Widgets | NOT COMPLETE | Planned. |
| Phase 9 Community calibration | NOT COMPLETE | Planned. |
| Phase 10 IoT | NOT COMPLETE | Planned. |
| Phase 11 Production / Stores | NOT COMPLETE | Signing, store release, production observability/security/DR remain. |
| Phase 12 Public platform | LATER | Public API/open-data/partner/research extensions. |

## Phase 5 progress at a glance

Phase 5 contains ten workstreams (#53–#62):

- **4 completed:** #53 Phase 5A, #54 Phase 5B, #55 Phase 5C and #56 Phase 5D.
- **6 remaining:** #57–#62.

Therefore Phase 5 now has solid platform, weather, rainfall and discharge foundations, but is **not close to its exit gate yet**. The most scientifically difficult remaining work — local stage calibration, flood-risk validation and pilot backtesting — is still ahead.

## Mobile MVP progress at a glance

Phase 3 currently has:

- **2 merged child issues:** #40 bootstrap/CI and #41 typed public API client.
- **1 active draft implementation:** #42 / PR #50 Drift persistence.
- **5 remaining child issues:** #43–#47 covering shell/design/accessibility, critical journeys, calendar/favorites/settings, offline packs and the mobile exit gate.

The app therefore has a real technical foundation, but it is **not yet a complete field-ready Android/iOS MVP**.

## What Phase 5B now provides on main

Merged in PR #102:

- normalized current/hourly/daily weather contracts;
- deterministic fixture provider and Open-Meteo adapter boundary;
- provider licence/commercial-use selection policy;
- PostGIS weather forecast-run/current/hourly/daily persistence;
- idempotent normalized history/cache;
- nearest provider-grid cache fallback bounded to 25 km;
- runtime provider loader and server-side `secretRef` resolution;
- deterministic provider fallback with health evidence;
- explicit `FRESH`, `STALE` and `WEATHER_UNAVAILABLE` behavior;
- public endpoints:
  - `GET /v1/weather/current`
  - `GET /v1/weather/hourly`
  - `GET /v1/weather/daily`
- no provider key/secret/endpoint configuration in public responses;
- source/licence documentation that separates free hosted, paid hosted and self-hosted Open-Meteo usage;
- dedicated Phase 5B workflow with focused end-to-end weather regression coverage.

This does **not** yet mean river level prediction or flood-risk prediction is complete.


## What Phase 5C now provides

Implemented in PR #109 and verified by the dedicated Phase 5C workflow:

- first-class rainfall product kinds for gauge, radar, satellite, reanalysis, deterministic/ensemble forecast and blended/derived values;
- normalized valid interval, accumulation period, spatial footprint/resolution, quality and source lineage;
- PostGIS persistence for rainfall runs, records and derived accumulations with idempotent re-ingestion;
- deterministic 1h/3h/6h/12h/24h/72h/7d accumulation contracts with coverage/completeness and derivation lineage;
- explicit partial-window policy: public summary exposes only windows with at least 50% temporal coverage;
- fixture/Open-Meteo rainfall adapters plus an IMERG normalization/object-reference boundary;
- provider licence/commercial-use filtering and deterministic fallback;
- nearest compatible LKG fallback bounded to 25 km and a 6-hour stale grace;
- public endpoints:
  - `GET /v1/rainfall/summary`
  - `GET /v1/rainfall/history`
  - `GET /v1/rainfall/forecast`
- secret/provider-runtime redaction from public responses;
- a hard non-goal boundary: no river-stage or flood-probability claims are produced by Phase 5C.


## What Phase 5D now provides

Implemented in PR #110 and verified by the dedicated Phase 5D workflow:

- normalized river reaches and provider reach/grid mappings with explicit confidence/effective ranges;
- mapping states that fail closed on provider-specific ambiguity instead of guessing a reach;
- normalized discharge contracts for forecast mean, statistics, ensemble members and retrospective simulations;
- return-period discharge thresholds preserved as reference flow, not flood probability;
- PostGIS persistence for hydrology runs/points/return periods with deterministic idempotency;
- mapping-compatible LKG fallback: cache is rejected when the provider reach mapping is no longer current;
- deterministic fixture adapter plus GEOGLOWS v2 and Open-Meteo Flood/GloFAS adapter boundaries;
- Open-Meteo model-grid association preserves returned grid identity, distance and intentionally low confidence;
- public endpoints:
  - `GET /v1/rivers/nearby`
  - `GET /v1/rivers/:reachId/forecast`
- public discharge trend, freshness, fallback and return-period context in `m3/s`;
- no provider runtime secrets, fabricated stage/water-level or flood probability in public output;
- GEOGLOWS v2 production commercial use remains fail-closed because exact product/distribution licence scope requires clarification.

This completes the discharge foundation only. Exact future stage/river rise still belongs to #57 and requires documented datum/calibration evidence.


## Critical path to a practical MVP

The shortest path to a product that can be seriously field-tested is:

1. Resume and finish Phase 3 #42–#47 so Android/iOS has complete offline-capable user journeys.
2. Implement #57 calibrated river-rise only where gauge/datum/rating-curve evidence exists.
3. Implement #58 flood-risk with calibration gates and #59 official warnings as a separate authoritative channel.
4. Implement #61 mobile/web weather-river-flood UX.
5. Run #62 pilot/backtesting and publish the Phase 5 exit report.
6. Only then move into Phase 11 production/store release hardening for a public launch.

## Definition of “nearly complete”

For this project, “nearly complete” should mean all of the following are true, not merely that the backend compiles:

- mobile critical journeys are complete on Android/iOS;
- weather/rain/river APIs work from production-approved providers;
- exact river-stage claims are calibrated or omitted;
- flood-risk claims have documented validation or remain non-probabilistic bands;
- at least one pilot area has reproducible backtesting and known error bounds;
- offline/stale behavior is tested end-to-end;
- provider secrets and licensing rules pass production review;
- observability, backup/restore, security review and store-release gates are complete.

The project has **not reached this definition yet**.

## Active execution references

- Phase 3 Epic: #39
- Mobile persistence: #42 / PR #50
- Weather & Hydrology Epic: #52
- Phase 5A: #53 — completed
- Phase 5B: #54 / PR #102 — completed
- Phase 5C: #55 / PR #109 — completed and regression-gated
- Phase 5D: #56 / PR #110 — completed and regression-gated
- Phase 5E–5J: #57–#62 — remaining

## Update policy

Update this file when a major workstream is merged, blocked/unblocked, or when an exit gate changes state. Avoid subjective percentages unless a stable weighting model is introduced; use merged workstreams, open dependencies and verified exit gates as the primary progress signal.
