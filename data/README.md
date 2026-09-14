# Data Workspace

Repository data area is for **redistributable metadata, test fixtures and import definitions only**.

Planned layout:

```text
data/
├── stations/
├── rivers/
├── basins/
├── fixtures/
└── schemas/
```

## Rules

- Do not commit private, credentialed or license-restricted datasets.
- Every dataset/fixture should document source, license/permission, generated/retrieved date and transformation.
- Reference fixtures used in tests should be as small as practical.
- Large production data belongs in database/object storage, not Git.
- Raw external payloads may only be committed when redistribution permits it.

See `docs/DATA-SOURCES.md`.
