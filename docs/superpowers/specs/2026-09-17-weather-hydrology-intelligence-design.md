# Weather, Rainfall, River Rise & Flood-Risk Intelligence — Design

Status: approved in product/design discussion on 2026-09-17; implementation plan pending spec review.

## 1. Goal

Extend Con Nước Việt from a tide/water-level application into a provenance-first weather and hydrology decision-support platform for Vietnam.

The subsystem must let users:

- choose a province/city/district/commune or a map point;
- optionally use device location for a forecast point;
- view current weather and hourly/daily forecasts;
- view observed, estimated, historical and forecast rainfall;
- inspect nearby rivers/reaches/gauges and river-flow forecasts;
- receive a calibrated river-rise estimate only where the project has enough local evidence;
- see flood-risk assessments with uncertainty, confidence, reasons and data freshness;
- inspect the source/model behind every material value.

The platform must also let administrators configure multiple free and paid providers, credentials, priority, coverage, health, fallback and commercial/licence constraints without changing mobile/web contracts.

## 2. Non-goals for the first implementation

The first implementation does not:

- claim an exact future water level at a gauge without a validated stage-discharge/rating relationship or a locally calibrated model;
- claim parcel/street-scale inundation solely from global 5–10 km hydrology or rainfall products;
- replace official Vietnamese disaster warnings;
- automate operation of gates, sluices, reservoirs or pumps;
- expose provider credentials to mobile/public web clients;
- train a nationwide deep-learning model before deterministic baselines and calibration datasets exist;
- make a single provider the product contract.

## 3. Architectural decision

Use a multi-provider backend architecture with normalized domain contracts and a calibrated hydrology/flood-risk layer.

The public/mobile applications depend only on Con Nước Việt normalized APIs. Provider-specific payloads remain behind adapters and are archived with provenance/checksums where source terms permit.

Logical flow:

```text
Device location / selected place
          |
          v
Location & catchment resolver
          |
          +----------------------+-------------------------+
          |                      |                         |
          v                      v                         v
Weather providers        Rainfall providers       Hydrology providers
          |                      |                         |
          +---------- normalize + provenance -------------+
                                 |
                                 v
                       Observation/forecast store
                                 |
                  +--------------+---------------+
                  |                              |
                  v                              v
          Ensemble/consensus               River calibration
                  |                              |
                  +--------------+---------------+
                                 |
                                 v
                         Flood-risk engine
                                 |
                                 v
                       Public normalized APIs
                                 |
                    Mobile / Web / Admin / PDF
```

This architecture is preferred over a single-vendor implementation because it keeps provider switching, fallback, ensemble comparison, licensing and regional expansion independent from UI code.

## 4. Domain boundaries

### 4.1 Location & coverage

Core entities:

- `AdministrativeArea`: country/province/district/commune hierarchy, stable internal IDs, names and aliases.
- `ForecastLocation`: point used for a weather forecast, including latitude/longitude, timezone and optional administrative-area references.
- `RiverBasin`: hydrologic basin/catchment.
- `RiverReach`: normalized river segment/reach.
- `HydrologyStation`: observed gauge/station metadata.
- `CoverageCell` or `CoverageAssessment`: says what data types are available for an area and at what confidence/resolution.

The system must not pretend province-level values are point-level measurements. Every response carries spatial representation metadata such as point, gauge, reach, grid cell, basin aggregate or administrative aggregate.

### 4.2 Weather

Normalized weather records must support:

- temperature and apparent temperature;
- relative humidity;
- pressure;
- wind speed/gust/direction;
- cloud cover;
- weather code/condition;
- visibility where supplied;
- UV where supplied;
- precipitation probability where supplied;
- precipitation/rain/snow accumulation with explicit period and unit;
- provider model/model-run metadata.

Weather observations and forecasts are distinct record types. A forecast may never be relabeled as an observation.

### 4.3 Rainfall

Rainfall is stored as a first-class hydrometeorological signal, not merely a weather-screen field.

Normalized rainfall records distinguish:

- gauge observation;
- radar estimate;
- satellite estimate;
- reanalysis;
- deterministic forecast;
- ensemble forecast;
- blended/derived product.

Required metadata:

- source/provider;
- product/model name/version;
- observation/model-run time;
- valid start/end time;
- accumulation period;
- unit;
- spatial footprint/resolution;
- quality flags;
- fetched/ingested time;
- licence/redistribution class.

Derived rainfall windows should initially cover 1h, 3h, 6h, 12h, 24h, 72h and 7d where source resolution supports them.

### 4.4 River hydrology

Hydrology records separate:

- observed stage/water level;
- observed discharge;
- forecast discharge;
- forecast stage/water level;
- simulated historical/retrospective discharge;
- return-period/reference-flow statistics.

A `RiverForecast` must explicitly indicate whether it is:

- provider-native discharge;
- provider-native stage;
- locally converted discharge→stage;
- locally calibrated stage forecast;
- ensemble-derived statistic.

Datum and unit are mandatory for all stage values. Unknown or incompatible datum values cannot be compared as if equivalent.

## 5. Water-level forecast safety rule

Global systems such as GloFAS/GEOGLOWS primarily provide river discharge/streamflow products. Con Nước Việt must never silently convert discharge into a precise water-level value.

A future water-level value is allowed only if one of the following is true:

1. the upstream provider directly supplies stage with documented datum and station semantics; or
2. Con Nước Việt has a validated rating curve for that station/reach and the requested discharge is inside the validated domain of that curve; or
3. Con Nước Việt has a locally calibrated forecast model with documented validation metrics and accepted error bounds.

Otherwise the UI/API may expose discharge, direction/trend, relative anomaly, return-period context and a qualitative/quantitative river-rise risk, but not a fabricated stage value.

Every derived stage response includes:

- derivation method;
- calibration/version ID;
- validation period;
- MAE/RMSE or other accepted metrics;
- confidence/uncertainty interval;
- extrapolation flag if applicable.

Production should normally reject or downgrade extrapolated rating-curve predictions beyond the calibrated domain.

## 6. Provider framework

### 6.1 Provider capability model

A provider is configured by capability rather than by UI feature name.

Example capabilities:

- `weather.current`
- `weather.hourlyForecast`
- `weather.dailyForecast`
- `weather.historical`
- `weather.ensemble`
- `rainfall.observed`
- `rainfall.satellite`
- `rainfall.radar`
- `rainfall.forecast`
- `hydrology.dischargeForecast`
- `hydrology.dischargeEnsemble`
- `hydrology.retrospective`
- `hydrology.returnPeriods`
- `hydrology.stageObservation`
- `hydrology.officialBulletin`
- `hazard.floodBaseline`
- `alert.official`

Provider selection is performed server-side using capability, geography, priority, freshness, health, cost/quota and licence policy.

### 6.2 Provider configuration

Admin configuration should include at least:

```text
id
providerType
enabled
priority
weight
capabilities
coverage geometry/region restrictions
endpoint/configuration
credential reference
commercial-use status
redistribution status
attribution text/link
rate-limit/quota policy
monthly budget limit
timeout/retry policy
health state
last success/failure
observed latency
freshness thresholds
model/product allow-list
fallback group
```

Credentials are stored encrypted or in a secret manager and referenced by ID. API responses, logs and audit events must redact secret values.

### 6.3 Initial provider candidates

The design intentionally separates candidates from contractual commitments. Each adapter requires a licence/terms review before production enablement.

#### Open-Meteo

Candidate uses:

- general weather forecast;
- historical/reanalysis/forecast history where the subscribed plan permits;
- model comparison/ensemble use where appropriate;
- Flood API/GloFAS convenience adapter.

Current Open-Meteo documentation states that its free hosted API is for non-commercial use with request limits; commercial hosted use requires a paid plan. Data served by the API is CC BY 4.0 with attribution. Self-hosting is possible under the server software licence and the underlying source-data terms must still be respected.

#### GEOGLOWS ECMWF Streamflow Service

Candidate uses:

- reach ID lookup by coordinate;
- average streamflow forecast;
- forecast statistics;
- forecast ensemble;
- rolling forecast records;
- retrospective hourly/daily/monthly simulations;
- return periods.

This is a discharge/streamflow source, not an automatic gauge-stage source.

#### NASA GPM IMERG

Candidate uses:

- satellite precipitation estimate;
- near-real-time rainfall context;
- historical rainfall features and validation/training inputs.

NASA documents IMERG at 0.1° (~10 km) grid spacing with half-hourly products; Early Run is the low-latency product, while Final Run is appropriate for research/historical quality use. IMERG archives extend into the TRMM era, currently back to 1998 for V07B products.

#### Vietnamese official/partner sources

Use a dedicated `OfficialVietnamProvider`/partner adapter family for licensed machine-readable feeds, bulletins or manually curated official warning metadata.

The National Center for Hydro-Meteorological Forecasting (NCHMF) has the official function of organizing meteorological, climate, hydrological, water-resource and marine forecasts/warnings and publishes hydrology/flood warning bulletins. Production ingestion must follow the source's explicit access/licence terms; scraping is not assumed to be permitted simply because a bulletin is publicly viewable.

## 7. Provider selection, fallback and ensemble

Provider orchestration has two distinct modes.

### 7.1 Fallback

For a capability and location, providers are ordered by admin policy and runtime health. A fallback is used if the preferred provider is unavailable, outside coverage, stale, quota-blocked or disallowed by licence policy.

Fallback does not silently erase provenance. The chosen provider/model is returned in result metadata.

### 7.2 Ensemble/consensus

For weather/rainfall variables where multiple comparable model outputs exist, the system may retain all members and calculate a consensus product.

An initial deterministic consensus may expose:

- median;
- min/max or quantile interval;
- model spread;
- number of contributing providers/models;
- consensus confidence derived from spread and historical calibration.

The original member values remain queryable for audit/admin use.

Provider disagreement must reduce confidence rather than be hidden by averaging.

## 8. Historical data and calibration

The system needs a hydrometeorological feature store rather than querying third-party APIs for every prediction request.

Persist, subject to source terms:

- normalized observations;
- normalized forecasts/model runs;
- rainfall accumulations;
- gauge stage/discharge history;
- retrospective simulations;
- tide predictions/observations already present in Con Nước Việt;
- calibration metadata;
- flood/event labels when legally and scientifically supportable.

Calibration is versioned and reproducible. A calibration run records:

- data sources and exact periods;
- source/model versions;
- feature version;
- train/validation/test split strategy;
- metrics by station/basin/season/lead time;
- generated artifact checksum;
- deployment/rollback state.

## 9. River-rise forecasting strategy

Use a staged maturity model.

### Level 0 — provider streamflow only

Expose provider forecast discharge, forecast ensemble, return-period context and trend. No derived local stage.

### Level 1 — deterministic station calibration

Where observed stage/discharge pairs exist, implement a validated rating curve or equivalent physically interpretable transform. Output stage only inside a documented valid domain.

### Level 2 — rainfall + upstream + tide regression

For rivers with sufficient local history, add calibrated models using features such as:

- recent gauge stage/discharge;
- upstream discharge/forecast;
- rainfall accumulations and forecast rainfall;
- antecedent rainfall index;
- downstream tide where hydrologically relevant;
- season/time-of-year;
- soil-moisture proxy if available;
- reservoir/gate operation data if licensed and available.

Begin with interpretable baselines such as persistence, linear/regularized regression, gradient-boosted trees or a simple time-series model. More complex ML is justified only when it beats the baselines on held-out flood events and remains operationally explainable.

### Level 3 — advanced basin models

Hydrodynamic/hydrologic models and learned sequence models are future work for basins with adequate geometry, forcing, boundary-condition and validation data.

## 10. Flood-risk engine

Flood risk is a decision-support assessment, not a binary prophecy.

Normalized output:

```text
FloodRiskAssessment
  location/basin/reach
  validFrom/validTo
  riskLevel: LOW | MODERATE | HIGH | VERY_HIGH | EXTREME | INSUFFICIENT_DATA
  probabilityRange?       // only when calibrated
  confidence: LOW | MEDIUM | HIGH
  reasons[]
  drivers[]
  sourceSummary[]
  model/calibrationVersion
  generatedAt
  freshness
  limitations[]
```

Potential drivers:

- forecast rainfall intensity and accumulation;
- antecedent rainfall/saturation proxy;
- observed/forecast discharge anomaly;
- rapid river rise;
- return-period exceedance probability;
- downstream tide/surge interaction for relevant basins;
- elevation/topographic susceptibility;
- historical flood occurrence;
- official warning signals.

### 10.1 Calibration rule

A numerical probability such as `72% flood probability` may be displayed only when the probability model has been calibrated against an explicit event definition and validation set. Before that maturity level, use risk bands/confidence/reasons rather than fake probability precision.

### 10.2 Hazard vs impact

The engine separates:

- hydrologic hazard: unusual flow/stage/rainfall;
- inundation susceptibility: terrain/flood-hazard baseline;
- local impact: people/assets/roads/agriculture, only when an appropriate exposure dataset exists.

A global flood-hazard layer is a baseline, not an official street-level inundation map.

## 11. Official warnings

Official warnings are stored/displayed as their own class of information and must never be merged into a model output in a way that obscures the official source.

A UI may say, for example:

```text
Official warning: active
Model assessment: HIGH
```

rather than transforming the official warning into an internally invented probability.

The official-warning record includes issuer, bulletin ID/URL if allowed, issued time, validity period, affected areas, severity/type, source snapshot metadata and ingestion method.

## 12. Location and automatic positioning

Mobile supports two paths:

1. manual place selection/search;
2. device location permission initiated by the user.

The mobile app sends the minimum coordinate precision required for the feature to the backend. The app must explain why location is requested and continue to work with manual selection if permission is denied.

Location is resolved to:

- forecast point;
- administrative area;
- candidate river basin/reach;
- nearby hydrology stations;
- provider coverage.

Precise device location is not automatically retained as account history. Any future persistent location history requires a separate privacy design.

## 13. Storage model

Recommended backend additions include conceptually:

- `admin_areas`
- `forecast_locations` (for reusable named/public points; not necessarily user-history records)
- `river_basins`
- `river_reaches`
- `hydrology_stations`
- `provider_configs`
- `provider_capabilities`
- `provider_health_events`
- `weather_observations`
- `weather_forecasts`
- `rainfall_records`
- `hydrology_observations`
- `hydrology_forecast_runs`
- `hydrology_forecast_points`
- `rating_curves`
- `calibration_runs`
- `flood_risk_runs`
- `flood_risk_assessments`
- `official_alerts`

Raw payload storage follows the existing Phase 2 provenance/checksum ingestion pattern when source terms permit raw retention.

Large raster/gridded products such as IMERG should normally live in object storage or a purpose-built geospatial store with indexed metadata in PostgreSQL/PostGIS, not as giant JSON blobs in transactional tables.

## 14. API contracts

Initial normalized public API surface:

```text
GET /v1/locations/search
GET /v1/locations/resolve?lat=&lon=

GET /v1/weather/current
GET /v1/weather/hourly
GET /v1/weather/daily

GET /v1/rainfall/summary
GET /v1/rainfall/history
GET /v1/rainfall/forecast

GET /v1/rivers/nearby
GET /v1/rivers/:riverId
GET /v1/rivers/:riverId/forecast

GET /v1/hydrology/stations/:stationId
GET /v1/hydrology/stations/:stationId/observations
GET /v1/hydrology/stations/:stationId/forecast

GET /v1/flood-risk
GET /v1/alerts
```

Responses carry:

- `generatedAt` and `fetchedAt`;
- valid period;
- spatial representation/resolution;
- source/provider;
- model/product/model-run;
- observed vs forecast vs derived type;
- quality flags;
- confidence/uncertainty where available;
- licence/attribution metadata needed by clients;
- stale/cache semantics compatible with existing repository contracts.

## 15. Admin UX and operations

Admin needs four related surfaces.

### 15.1 Providers

Create/edit/enable/disable providers, credentials, capabilities, priorities, model allow-list, regional coverage, fallback groups, licence state and cost/quota policy.

### 15.2 Health & usage

Show:

- request/success/failure counts;
- latency;
- freshness lag;
- quota/budget consumption;
- last successful model run;
- parse/schema errors;
- circuit-breaker state;
- fallback frequency.

### 15.3 Calibration

Inspect station/basin calibration versions, validation metrics, accepted lead-time range and active/rollback version.

### 15.4 Audit

Provider configuration, secret-reference changes, model activation, manual data correction and calibration deployment are audited with actor/time/before-after metadata. Secret values themselves are never written to audit payloads.

## 16. Background jobs

Use the existing worker/queue architecture for scheduled ingestion and computation.

Representative jobs:

- weather forecast refresh;
- rainfall satellite/grid ingestion;
- hydrology forecast refresh;
- official alert ingestion;
- provider health probe;
- derived accumulation computation;
- river-rise model run;
- flood-risk assessment;
- calibration backfill/evaluation.

Jobs are idempotent by provider + product/model-run + spatial key + valid time. Retries must not create duplicate normalized records.

## 17. Caching and offline behavior

Mobile Phase 3 persistence establishes the pattern reused here:

- cached values preserve original provenance/freshness;
- stale values are labeled stale;
- last-known-good remains available when refresh fails;
- no stale mandatory input may silently produce a `live` flood-risk result.

Future offline region/station packs may include bounded weather/hydrology summaries if provider redistribution terms permit it. Pack manifests include source/licence summary and expiry.

## 18. Validation and quality gates

### Provider adapters

- fixture/golden parsing tests;
- schema-drift tests;
- unit/timezone conversions;
- rate-limit/retry behavior;
- source provenance preservation;
- licence/attribution metadata tests.

### Hydrology

- station/reach spatial matching tests;
- datum/unit compatibility tests;
- retrospective forecast evaluation;
- persistence/climatology baseline comparison;
- rating-curve domain tests;
- flood-event holdout testing;
- uncertainty coverage tests where intervals are published.

### Flood-risk

- no numerical probability without calibration evidence;
- `INSUFFICIENT_DATA` when required inputs are absent/stale/incompatible;
- official alerts remain separately attributed;
- extreme provider disagreement lowers confidence;
- stale inputs cannot be presented as fresh/live.

## 19. Observability

Minimum metrics:

- provider request count/error/latency;
- source freshness lag;
- model-run age;
- ingestion volume;
- parse failures/schema drift;
- fallback rate;
- provider disagreement/spread;
- forecast MAE/RMSE by station/lead time where truth data exists;
- flood-risk calibration metrics;
- queue lag/dead letters.

Expose operational health only to admin/observability systems. Public clients receive a safe source/freshness status, not internal secrets or infrastructure details.

## 20. Security, privacy and licensing

- Secrets remain server-side, encrypted or secret-manager backed.
- Provider endpoints and configurable templates are validated to prevent SSRF/private-network abuse.
- Admin source configuration is RBAC/audit protected.
- Raw provider payload retention is conditional on terms.
- Required attribution is stored with normalized source metadata and rendered by clients where required.
- Commercial/non-commercial restrictions are machine-readable in provider policy so an invalid provider cannot be enabled for a commercial production profile without an explicit reviewed override.
- Device geolocation permission is optional and purpose-limited.

## 21. Rollout sequence

### Phase 5A — Location + provider platform

- Vietnam administrative taxonomy foundation;
- provider registry/configuration/secret references;
- weather normalized contracts;
- Open-Meteo evaluation adapter;
- admin provider health/config surfaces;
- public weather APIs.

### Phase 5B — Rainfall intelligence

- rainfall normalized schema;
- forecast rainfall adapter(s);
- IMERG historical/NRT pipeline;
- accumulation windows;
- rainfall source comparison and quality metadata.

### Phase 5C — River network & streamflow

- basin/reach/station model;
- GEOGLOWS adapter;
- reach lookup and discharge forecast/ensemble/retrospective;
- return-period context;
- hydrology public APIs.

### Phase 5D — Local river-rise calibration

- rating-curve/calibration schema;
- baseline forecasting;
- station-level validation metrics;
- tide/rainfall/upstream features where relevant;
- derived stage only at validated sites.

### Phase 5E — Flood-risk v1

- deterministic risk features and rules;
- calibrated risk bands;
- official warnings as separate signal;
- confidence/reasons/limitations;
- pilot basin verification.

### Phase 5F — Product UX

- mobile/web weather and rainfall views;
- nearby river status;
- river-rise/flood-risk presentation;
- location permission/manual selection;
- accessible charts, source/freshness and warning surfaces.

## 22. Pilot strategy

Do not start with a claim of nationwide river-stage accuracy. Roll out coverage progressively.

Recommended sequence remains consistent with the project roadmap:

1. one pilot area with accessible gauges/history and meaningful tide-river interaction if possible;
2. northern delta/estuaries;
3. central coastal basins;
4. Mekong/southern delta/coast;
5. nationwide coverage catalogue.

Each coverage area has an explicit capability matrix:

```text
weather forecast        yes/no + provider/resolution
rainfall observation    gauge/satellite/radar/none
river discharge         observed/forecast/simulated/none
river stage             observed/derived/none
stage forecast          calibrated/provider-native/none
flood risk              band/probability/none
official alerts         yes/no
```

## 23. Success criteria

The subsystem is production-ready for a pilot only when:

- weather/rainfall APIs can fail over without changing public contracts;
- admin can safely configure at least one free/evaluation and one credentialed provider path;
- every displayed value is traceable to source/model/run/freshness;
- rainfall history/forecast can be aggregated reproducibly;
- a river reach can be resolved and GEOGLOWS discharge forecast/retrospective data can be ingested and validated;
- derived water-level forecasts are limited to validated sites and publish error/uncertainty metadata;
- flood-risk outputs expose reasons/confidence and degrade to `INSUFFICIENT_DATA` rather than invent certainty;
- official alerts remain visibly official and separately attributed;
- provider licensing/attribution requirements are represented in configuration and product output;
- automated regression/validation gates pass on a pilot dataset.

## 24. Data-source research references

These references inform the design; exact licence/contract review is still required before enabling a production adapter.

- Open-Meteo Flood API: https://open-meteo.com/en/docs/flood-api
- Open-Meteo terms: https://open-meteo.com/en/terms
- Open-Meteo pricing/commercial licence: https://open-meteo.com/en/pricing
- GEOGLOWS ECMWF Streamflow Service: https://geoglows.ecmwf.int/documentation
- NASA GPM IMERG: https://gpm.nasa.gov/data/imerg
- NASA precipitation data directory: https://gpm.nasa.gov/data/directory
- National Center for Hydro-Meteorological Forecasting (Vietnam): https://nchmf.gov.vn/kttvsite/

## 25. Key decisions locked by this spec

1. Multi-provider orchestration lives on the backend; mobile/web never bind directly to vendor response formats.
2. Observed, forecast, simulated and derived values are separate data classes with explicit provenance.
3. Discharge is not silently converted to stage.
4. Numerical flood probability requires calibration evidence; otherwise use risk bands/confidence/reasons.
5. Official warnings remain separately sourced and attributed.
6. Provider credentials are server-side only.
7. Licensing/commercial-use state is part of provider configuration and deployment safety.
8. Start with an evidence-rich pilot and publish coverage limitations instead of implying nationwide equal accuracy.
