# Tide Engine Benchmark Baseline — Phase 1

This document records an observed performance baseline for the deterministic fixed-frequency tide engine. It is **not** a machine-independent SLA and CI does not fail merely because timing moves between hosted runners.

## Environment

- Captured: 2026-09-15
- GitHub Actions run: `34966535206`
- Job: `Core package checks`
- Runner OS: Ubuntu 24.04.5 (`ubuntu-24.04` image `20260907.300.1`)
- Node.js: `v24.20.0`
- Platform: `linux-x64`
- pnpm: `12.4.1`
- Benchmark method: one warm-up followed by median of 9 measured runs
- Model: deterministic synthetic benchmark station, 12 fixed-frequency constituents
- Sampling interval: 600 seconds (10 minutes)

## Observed Results

| Workload | Points | Median | Points/sec | Deterministic checksum |
| --- | ---: | ---: | ---: | ---: |
| 24h @ 10 min | 145 | 0.308 ms | 470,983 | 167.045961280 |
| 7d @ 10 min | 1,009 | 1.404 ms | 718,733 | 1151.831972775 |
| 30d @ 10 min | 4,321 | 5.053 ms | 855,098 | 5034.840804749 |

## Interpretation

The benchmark demonstrates that the Phase 1 fixed-frequency engine is inexpensive enough for local/offline calendar-scale generation on a server-class CI runner. These numbers must not be extrapolated directly to every phone or browser.

The benchmark primarily guards three properties:

1. representative 24h/7d/30d workloads execute successfully,
2. output point counts remain stable,
3. repeated runs produce identical deterministic checksums.

Performance regressions should be investigated using multiple comparable runs before setting any hard threshold.

## Scientific Scope

This benchmark measures the Phase 1 fixed-frequency reconstruction only. It does not include future astronomical argument or nodal-correction calculations tracked by issue #23, nor weather/surge/river hydrodynamics.
