# `@connuoc/lunar-calendar`

Deterministic Vietnamese lunar-calendar conversion for offline use.

## API

```ts
solarToLunar({ year, month, day }): LunarDate
lunarToSolar({ year, month, day, isLeapMonth }): SolarDate
```

The calendar calculation uses the conventional Vietnamese UTC+07 astronomical boundary and exposes `Asia/Ho_Chi_Minh` as the product timezone identifier. Calculation is independent of OS locale and requires no network/database.

## Supported range

Phase 1 explicitly supports Gregorian/lunar years **1900–2100**. Inputs outside that range fail instead of silently producing unvalidated output.

## Algorithm notes

The implementation uses Julian-day conversion, astronomical new-moon approximation and solar-longitude sectors to determine month 11 and leap months. It is formula-based rather than a hard-coded date table.

Initial regression cases include Tết 2024/2025/2026 and the regular + leap sixth months of 2025. The larger cross-decade fixture/provenance suite remains issue #10/#12.

## Important convention

`isLeapMonth` is an explicit boolean. A leap sixth month is not represented by inventing a month number such as 6.5 or 13.
