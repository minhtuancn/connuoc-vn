# Source registry

`registry.json` is the reviewed Phase 1 source inventory. It is policy/configuration metadata, not an ingestion manifest.

## Redistribution values

- `redistributable`: project may version the permitted factual/data payload under the documented conditions.
- `redistributable_after_item_level_restriction_check`: the operator generally permits reuse, but every product/item still needs its own notice checked.
- `validation_only`: use the source to compare/verify results and cite it, but do not package/mirror raw source content.
- `restricted`: do not ingest or redistribute without explicit permission/agreement.
- `unknown`: blocks fixture promotion until reviewed.

## Rule

A source becoming technically accessible does **not** make it legally or scientifically usable. An adapter/fixture PR must identify registry source ID, datum/time convention and redistribution status before data is committed.
