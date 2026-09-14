# Weather / Hydrology Worker

Background worker for approved weather, rainfall and hydrology source ingestion.

## Responsibilities
- Fetch approved sources.
- Archive/checksum raw payload metadata.
- Normalize observations/forecasts.
- Apply units/timezone/datum metadata.
- Apply quality/freshness flags.
- Store observations and forecast runs.
- Emit freshness/error metrics.

This worker does not make drainage decisions; it only supplies normalized inputs.
