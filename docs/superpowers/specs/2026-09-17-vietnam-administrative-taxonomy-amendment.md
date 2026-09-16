# Vietnam Administrative Taxonomy Amendment

Status: corrective amendment to the approved `2026-09-17-weather-hydrology-intelligence-design.md`.

## Reason

Vietnam's current local-government model has operated on two tiers since 2025-07-01: provincial level and commune level. Current product/domain design must therefore not model district as an active administrative-government tier.

Official Government sources record 34 provincial-level units (28 provinces and 6 centrally governed cities) and 3,321 commune-level units. Commune-level units include communes, wards and special zones. The Government also states that district-level administrations were dissolved when the two-tier model took effect.

Reference basis:
- Government of Viet Nam, provincial reorganization resolution effective in 2025 and operation from 2025-07-01.
- Decision No. 19/2025/QD-TTg catalogue of codes for 34 provincial-level and 3,321 commune-level units.

## Amendment

Where the parent design says `country/province/district/commune` or `province/city/district/commune`, interpret the active hierarchy as:

```text
Vietnam
  -> province | centrally-run city
       -> commune | ward | special zone
```

`AdministrativeArea` must be versioned and support:

- stable official/current administrative codes;
- `effectiveFrom` and nullable `effectiveTo` dates;
- current active area types: `PROVINCE`, `CENTRAL_CITY`, `COMMUNE`, `WARD`, `SPECIAL_ZONE`;
- historical entities and aliases, including former districts, for historical records, migration and Vietnamese search;
- explicit `isCurrent`/effective-date semantics so a historical district can never be returned as an active current tier;
- predecessor/successor relationships when a unit was merged, split, renamed or reorganized;
- geometry version/provenance rather than silently overwriting old boundaries.

## API behavior

`GET /v1/locations/search` may match a historical district/place name, but the response must identify it as historical/legacy and, when a verified mapping exists, return its current successor areas.

`GET /v1/locations/resolve?lat=&lon=` resolves against the active boundary dataset for the requested/effective date (default: current date). Current responses contain provincial-level and commune-level administrative context; district is absent from the active chain.

Historical weather/hydrology observations keep the administrative identity/boundary version that was valid for their record context where available. They must not be silently rewritten to imply that old boundaries existed at the present date.

## Implementation consequence

Phase 5A issue #53 and its implementation plan use this amendment as normative for Vietnam administrative levels. Later mobile/web location selectors must display the current two-tier hierarchy while still accepting legacy names as search aliases.
