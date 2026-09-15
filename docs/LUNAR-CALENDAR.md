# Vietnamese Lunar Calendar

## Scope

The `@connuoc/lunar-calendar` package owns deterministic Vietnamese lunar-calendar calculations used by mobile/web/PDF/offline features.

Phase 1 conversion API includes:

- Gregorian/solar → Vietnamese lunar date.
- Vietnamese lunar → Gregorian/solar date.
- Explicit leap-month representation.
- Supported-range validation.

Can Chi, 24 solar terms and moon-phase presentation metadata remain issue #9. Expanded fixtures/golden validation remain #10/#12.

## Calculation convention

- Product timezone identifier: `Asia/Ho_Chi_Minh`.
- Astronomical lunar-day/month boundary convention: UTC+07.
- Calculation is independent of OS locale.
- Supported range is explicitly 1900–2100 for Phase 1.

The implementation uses Julian-day conversion, new-moon approximation and solar-longitude sectors to identify lunar month boundaries, month 11 and leap-month placement. It does not ship a hard-coded annual table.

## Leap months

Leap status is represented explicitly:

```ts
interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}
```

Reverse conversion verifies the result with a solar→lunar round trip so an impossible leap-month/day combination fails closed.

## Initial reference checks

The Phase 1 implementation checks known Tết dates (2024, 2025, 2026) and the 2025 leap-sixth-month transition. These are regression checks, not yet the full authoritative fixture set.

Production readiness still requires issue #10/#12 to document fixture provenance, compare more decades and cover edge cases around astronomical boundaries.
