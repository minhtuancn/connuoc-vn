# Phase 5C — Rainfall Intelligence

Status: implementation gate for issue #55.

Phase 5C makes rainfall a first-class hydrometeorological signal while preserving product type, valid-time semantics, spatial resolution, source provenance and licence policy. It intentionally stops before river-stage or flood-probability modelling.

## Scope

Phase 5C provides:

- normalized gauge, radar, satellite, reanalysis, deterministic forecast, ensemble forecast and blended/derived rainfall product kinds;
- deterministic accumulation windows for 1h, 3h, 6h, 12h, 24h, 72h and 7d;
- PostGIS-backed normalized rainfall runs, records and derived accumulations;
- idempotent persistence and bounded nearest last-known-good fallback;
- fixture, Open-Meteo rainfall and IMERG normalization boundaries;
- public summary, history and forecast APIs;
- object-reference metadata for large gridded products instead of storing giant payloads in transactional JSON;
- explicit source/freshness/product-kind presentation suitable for later calibrated hydrology features.

## Non-goals and safety boundary

Phase 5C does not produce river stage or water-level forecasts, rating-curve output, river-rise predictions, flood probability, flood-risk scores or evacuation advice.

Rainfall is an input signal for later phases, not evidence that those later outputs are already scientifically valid.

Satellite, radar and model values must never be relabelled as gauge observations. Public responses retain their exact normalized productKind.

## Normalized product taxonomy

Supported product kinds are:

| Product kind | Meaning |
| --- | --- |
| GAUGE_OBSERVATION | Direct gauge observation. |
| RADAR_ESTIMATE | Radar-derived precipitation estimate. |
| SATELLITE_ESTIMATE | Satellite-derived precipitation estimate such as an IMERG-normalized record. |
| REANALYSIS | Historical model/reanalysis rainfall product. |
| DETERMINISTIC_FORECAST | Deterministic model forecast rainfall. |
| ENSEMBLE_FORECAST | Ensemble forecast rainfall. |
| BLENDED_DERIVED | Explicitly derived/blended rainfall result. |

Every normalized record carries validStart/validEnd, accumulationSeconds, amountMm, spatial representation and WGS84 coordinate, native/declared resolution, quality state/flags, and exact source/product/model/fetch attribution.

## Persistence model

Migration 0006_rainfall.sql creates:

- rainfall_runs — one normalized provider/product/spatial run with provenance, freshness and optional object references;
- rainfall_records — interval rainfall values linked to a run;
- rainfall_accumulations — deterministic derived windows with input-record lineage and derivation version.

Persistence is idempotent on provider capability plus normalized bundle checksum. Re-ingestion does not create duplicate records for the same normalized run.

Exact request coordinates are not stored as user location history. Stored coordinates represent the normalized provider/gauge/grid footprint.

## Large gridded payload boundary

IMERG and future radar/satellite grids can be much larger than transactional API rows. Phase 5C therefore stores only bounded normalized records plus optional object URI/reference, checksum, media type and product/run provenance.

The raw gridded object belongs in approved object storage when source policy permits retention. The API database must not become a giant raw-grid JSON archive.

The current IMERG implementation is a normalization path. It does not invent a public live HTTP endpoint for NASA Earthdata. Production live ingestion requires an approved Earthdata/object-storage fetch path and source-policy review.

## Accumulation semantics

Supported windows are exactly 3,600; 10,800; 21,600; 43,200; 86,400; 259,200; and 604,800 seconds (1h, 3h, 6h, 12h, 24h, 72h and 7d).

Derived accumulation:

- uses only one compatible normalized series at a time;
- rejects overlapping intervals inside that series;
- sums only records fully contained in the target window;
- reports coverageRatio;
- reports complete=true only at full temporal coverage;
- returns amountMm=null when a contributing record is explicitly MISSING;
- retains sorted inputRecordIds, sourceIds, product kinds and derivationVersion.

The public summary exposes a window only when temporal coverage is at least 50%. This prevents a tiny fragment of a long 72h/7d interval from being presented as a meaningful long-window accumulation while still allowing an explicitly marked partial 1h result.

The derivation version for this phase is rainfall-accum-v1.

## Provider selection and fallback

Rainfall provider selection reuses the Phase 5A provider policy.

Runtime capabilities are rainfall.observed, rainfall.satellite, rainfall.radar and rainfall.forecast.

Selection remains fail-closed for deployment/licence policy. A higher-priority provider that is disallowed for the current deployment cannot be silently used.

Live provider failure can move to the next eligible provider. If no live provider succeeds, the orchestrator may use persisted last-known-good data only when capability matches, distance is within 25 km, the run is within stale grace and normalized records exist.

The API marks LKG forecast data as STALE with fallbackUsed=true and lastKnownGoodUsed=true; it does not relabel it as fresh. Current Phase 5C stale grace is 6 hours.

## Public APIs

All endpoints use the global /v1 prefix.

### Summary

GET /v1/rainfall/summary?lat=&lon=&at=

Returns available accumulation windows with amount, coverage/completeness, input record ids, product kinds, source ids and derivation version.

### History

GET /v1/rainfall/history?lat=&lon=&start=&end=&limit=

Returns persisted non-forecast rainfall history near the requested coordinate. Observations and estimates keep their original product kind and provenance.

Validation: latitude -90..90, longitude -180..180, start earlier than end, public limit 1..500.

### Forecast

GET /v1/rainfall/forecast?lat=&lon=&hours=

Returns forecast-only rainfall records plus freshness/fallback state. Hours are bounded to 1..168.

Successful live forecast bundles are persisted before they are returned. If no eligible live provider or compatible LKG exists, the API returns HTTP 503 with code RAINFALL_UNAVAILABLE and the bounded message Rainfall data is temporarily unavailable.

## Public-data redaction

Public rainfall JSON must not expose providerConfigId, provider keys, secret references or endpoint configuration. Source/product attribution needed to interpret a rainfall value remains public.

## Source policy

### Open-Meteo

Rainfall forecast use follows the same three deployment interpretations as Phase 5B:

- free hosted: non-commercial only under the reviewed terms;
- paid hosted: commercial entitlement via customer API;
- self-hosted: server deployment still requires upstream data/model attribution and licence review.

Free hosted access must never become an implicit commercial fallback.

### NASA GPM IMERG

IMERG remains explicit SATELLITE_ESTIMATE, never GAUGE_OBSERVATION.

Normalization retains Early/Late/Final run where known, product/version, native observation interval, grid resolution, capture/fetch timestamp, attribution and object reference/checksum when permitted.

The registry remains fail-closed for commercial use until the exact product/version terms are reviewed for the intended deployment.

## Operational verification

Dedicated workflow: .github/workflows/phase5c-rainfall.yml.

The gate proves on a fresh PostGIS database:

1. migrations and schema smoke;
2. shared rainfall contracts;
3. weather-worker rainfall adapters/accumulation build and tests;
4. API typecheck and unit tests;
5. focused Phase 5C end-to-end scenario;
6. full API integration regression suite;
7. API build.

The focused scenario verifies that satellite estimates stay explicitly labelled, accumulation lineage/coverage is exposed, a licence-blocked preferred provider is skipped, an allowed fallback serves/persists forecast, disabled live service uses bounded nearest LKG, out-of-coverage requests fail closed, and no provider secret/config or flood/stage claim appears in public output.

## Handoff to later phases

Phase 5D may consume rainfall provenance alongside discharge inputs.

Phase 5E may use rainfall only as one calibrated feature; exact river stage still requires provider-native stage or validated local calibration/rating curves.

Phase 5F may consume rainfall accumulations as antecedent-rainfall features, but numerical flood probability remains prohibited until an explicitly calibrated probability model and validation evidence exist.
