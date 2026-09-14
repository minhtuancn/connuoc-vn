# Tide Worker

Background worker for tide data ingestion and prediction generation.

## Responsibilities
- Import approved harmonic/station datasets.
- Validate constituent metadata/datum/time conventions.
- Generate versioned tide predictions.
- Detect extrema.
- Persist forecast runs/points.
- Publish cache invalidation/update events.
- Emit source freshness/quality metrics.

Jobs must be idempotent and traceable to source/model/parser versions.
