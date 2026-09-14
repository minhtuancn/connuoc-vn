# `geo`

Shared geospatial domain utilities.

## Responsibilities
- Station/river/basin/estuary/sluice geospatial types.
- Distance/nearest-entity helpers.
- Vietnamese location normalization/search helpers.
- Spatial query contracts shared with backend.

PostGIS-specific repository implementation belongs in backend/infrastructure layers, not this pure domain package.
