# Mobile database tests

Issue #42 follows test-first development. The migration contract test is intentionally committed before `AppDatabase` exists so draft-PR CI records the RED state before implementation.

Production implementation must make the same test pass without weakening or deleting the migration assertions.
