# Weather / Hydrology Worker

Background worker foundation for approved weather, rainfall and hydrology source ingestion.

## Phase 5A boundary

The current package defines vendor-neutral provider adapter contracts, exact capability matching and a deterministic fixture provider used by orchestration tests. It does **not** fetch live weather, rainfall or hydrology values yet.

Provider credentials remain opaque `secretRef` values. Health/probe results must never echo secret references or raw credentials.

## Responsibilities
- Host provider adapter contracts behind normalized capability names.
- Support deterministic provider health/probe behavior for orchestration.
- Fetch approved sources in later Phase 5 workstreams.
- Archive/checksum raw payload metadata where source terms permit.
- Normalize observations/forecasts.
- Apply units/timezone/datum metadata.
- Apply quality/freshness flags.
- Store observations and forecast runs.
- Emit freshness/error metrics.

This worker does not make drainage decisions, invent stage from discharge, or calculate flood probability; it only supplies normalized inputs to later calibrated layers.
