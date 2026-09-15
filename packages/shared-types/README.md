# `@connuoc/shared-types`

Schema-first, runtime-validated domain contracts shared by deterministic engines and later API/storage adapters.

## Public modules

The package root exports:

- `ids` — branded `StationId`, `RiverId`, `BasinId`, `EstuaryId`, `DatumId`, `DataSourceId`, `ForecastRunId` schemas/types.
- `common` — ISO instant, IANA timezone, coordinate and water-level-unit contracts.
- `source` — `DataSource`, redistribution/authority metadata, `Datum`, and `DataQuality`.
- `geography` — `Station`, `River`, `Basin`, `Estuary` schemas.
- `water-level` — observed/manual/community readings, versioned forecast runs/points and a minimal deterministic `WaterLevelPoint`.

## Contract rules

1. Time-bearing data uses ISO-8601 timestamps with an explicit offset/UTC designator.
2. Station timezone is explicit and must be a valid IANA timezone; engines must not guess it.
3. Water-level values always carry an explicit unit and datum identifier.
4. Sharing a unit does **not** make two datums compatible. Datum conversion is a separate explicit policy/engine concern.
5. Source/provenance metadata is a first-class contract; `unknown` states are represented rather than silently inferred.
6. Schemas validate domain/API boundaries; no ORM, NestJS, database or network dependency is allowed here.
7. Canonical display names are preserved; search normalization belongs to `@connuoc/geo`.

## Example

```ts
import { StationSchema } from '@connuoc/shared-types';

const station = StationSchema.parse({
  id: 'station:example',
  name: 'Trạm ví dụ',
  type: 'tide',
  coordinate: { latitude: 20.1, longitude: 106.2 },
  timeZone: 'Asia/Ho_Chi_Minh',
  datumId: 'datum:example',
});
```

## Phase 1 ownership

Initial contract implementation is tracked by GitHub issue #4. Database entities, ingestion payloads, drainage-site contracts and offline manifests are intentionally deferred to later issues/phases unless a core engine requires a minimal contract sooner.
