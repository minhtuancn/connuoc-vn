# `drainage-engine`

Decision-support package for drainage windows.

## Owns
- ΔH and trend evaluation.
- Datum/freshness gates.
- Drainage status.
- Window scoring/confidence.
- Human-readable reason codes.

## Does not own
- Source fetching.
- Gate actuation.
- UI rendering.
- AI inference.

Fail closed to `INSUFFICIENT_DATA` when mandatory inputs are unsafe or incompatible.

See `docs/DRAINAGE-ENGINE.md`.
