# `@connuoc/geo`

Framework-independent geography and Vietnam-friendly search helpers.

## Responsibilities

- Preserve canonical Vietnamese place/station names.
- Generate derived diacritic-insensitive search keys (`Nghĩa Phong` → `nghia phong`).
- Normalize Vietnamese `Đ/đ` consistently for search.
- Build canonical-name + alias search documents without mutating source data.
- Provide lightweight great-circle distance for nearby-station ranking.

## Non-responsibilities

- No PostGIS or MapLibre dependency.
- No administrative-boundary database.
- No geocoding/network requests.
- No canonical-name rewriting from normalized search keys.

Spatial validation schemas such as latitude/longitude bounds are defined in `@connuoc/shared-types`; this package provides calculation/search helpers that remain usable offline.

## Example

```ts
import { createVietnameseSearchDocument, matchesVietnameseSearch } from '@connuoc/geo';

const location = createVietnameseSearchDocument('Nghĩa Phong', ['Nghia Phong']);
matchesVietnameseSearch(location, 'nghia phong'); // true
```
