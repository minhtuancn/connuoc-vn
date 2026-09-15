# `@connuoc/lunar-calendar`

Deterministic Vietnamese lunar-calendar and calendar-astronomy helpers for offline use.

## API

```ts
solarToLunar({ year, month, day }): LunarDate
lunarToSolar({ year, month, day, isLeapMonth }): SolarDate
getCalendarCanChi(solarDate): { year, month, day }
getSolarTermAt(isoInstant): SolarTermInfo
getMoonPhaseAt(isoInstant): MoonPhaseInfo
```

The Vietnamese lunar calculation uses the conventional UTC+07 astronomical boundary and exposes `Asia/Ho_Chi_Minh` as the product timezone identifier. Calculation is independent of OS locale and requires no network/database.

## Supported range

Phase 1 solar/lunar conversion explicitly supports years **1900–2100**. Inputs outside that range fail instead of silently producing unvalidated output.

## Can Chi

The package exposes stable Vietnamese stems/branches and returns Can Chi for lunar year/month and Gregorian day. Leap lunar months repeat the same month Can Chi as the regular month with the same number.

Reference regression for 15/09/2026:

```text
Năm Bính Ngọ
Tháng Đinh Dậu
Ngày Nhâm Thìn
```

Cultural interpretation such as ngày tốt/xấu, hoàng đạo/hắc đạo, sao/trực is intentionally **out of scope** for this scientific/calendar core.

## Solar terms

`getSolarTermAt()` maps approximate solar ecliptic longitude into the standard 24 sectors (15° each). It returns the raw longitude and method label so UI does not present the result as higher precision than the algorithm provides.

## Moon phase

`getMoonPhaseAt()` estimates phase/illumination from adjacent Meeus-style calculated new moons. It is intended for calendar UI and education, not precision astronomical navigation.

## Validation

Current regression cases cover Tết dates, the 2025 leap-sixth month, 15/09/2026 Can Chi/Bạch lộ, and September 2026 lunar phases. The larger cross-decade independent fixture/provenance suite remains issue #10/#12.
