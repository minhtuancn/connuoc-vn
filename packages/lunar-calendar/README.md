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

Phase 1 solar/lunar conversion explicitly supports years **1900–2100**. Inputs outside that range fail instead of silently producing unvalidated output. Gregorian dates near the beginning of 1900 may legitimately map to lunar year 1899; reverse conversion of such an out-of-range lunar year is intentionally rejected.

## Can Chi

The package exposes stable Vietnamese stems/branches and returns Can Chi for lunar year/month and Gregorian day. Leap lunar months repeat the same month Can Chi as the regular month with the same number.

Reference regression for 15/09/2026:

```text
Năm Bính Ngọ
Tháng Đinh Dậu
Ngày Nhâm Thìn
```

The project canonical spelling for the Snake earthly branch is `Tỵ`; some Vietnamese references print the orthographic variant `Tị`. This is a spelling convention, not a different branch.

Cultural interpretation such as ngày tốt/xấu, hoàng đạo/hắc đạo, sao/trực is intentionally **out of scope** for this scientific/calendar core.

## Solar terms

`getSolarTermAt()` maps approximate solar ecliptic longitude into the standard 24 sectors (15° each). It returns the raw longitude and method label so UI does not present the result as higher precision than the algorithm provides.

## Moon phase

`getMoonPhaseAt()` estimates phase/illumination from adjacent Meeus-style calculated new moons. It is intended for calendar UI and education, not precision astronomical navigation.

## Validation

Phase 1 has two deliberately separate validation layers:

- **Factual golden fixtures**: independently published Vietnamese calendar facts stored in `test/fixtures/vietnamese-lunar-golden.json`. They cover Tết 1900, 1950, 2000, 2024, 2025, 2026, the 2025 leap-sixth-month boundary, and 15/09/2026. The fixture records exact reference URLs and selected independently published Can Chi/solar-term facts.
- **Generated round-trip coverage**: representative solar dates across the supported range are converted solar → lunar → solar. This catches internal consistency regressions but is never described as independent golden truth.

Golden tests run offline in CI; no web lookup occurs during package calculation or testing.
