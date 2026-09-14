# Vietnamese Lunar Calendar

## Goal

Cung cấp lịch âm Việt Nam chính xác, offline-capable và testable cho Android/iOS/Web/PDF.

## Scope

- Gregorian → lunar.
- Lunar → Gregorian.
- Leap lunar month.
- Lunar day/month/year.
- Can Chi for year/month/day where rules are documented.
- 24 solar terms.
- Moon phase interface.
- Vietnamese date labels.

## Timezone

Vietnamese lunar calculations must explicitly use the approved Vietnam timezone convention (`Asia/Ho_Chi_Minh`) and documented astronomical algorithm assumptions.

Do not inherit device timezone silently for calendar conversion when rendering Vietnamese lunar dates.

## Supported range

Initial target: a documented range broad enough for normal modern use (candidate 1900–2100). Final supported range must be validated before release.

Outside supported range:
- fail explicitly or mark unsupported,
- never silently return unvalidated results.

## API sketch

```ts
solarToLunar(date, timezone): LunarDate
lunarToSolar(lunarDate, timezone): SolarDate
getCanChi(date): CanChiResult
getSolarTerm(dateTime): SolarTerm
getMoonPhase(dateTime): MoonPhase
```

## Display requirements

Calendar cells should support:

```text
14          <- Gregorian day
04/08       <- lunar day/month
↓ 20:18     <- optional tide indicator
```

Day details may include:
- Gregorian date,
- lunar date,
- Can Chi,
- solar term,
- moon phase,
- public holiday/festival metadata where separately maintained.

## Validation

Tests must cover:
- Tết dates,
- known full-moon/new-moon dates,
- leap lunar months,
- year boundaries,
- timezone boundary around midnight,
- supported-range edges,
- round-trip conversion.

Reference fixtures must cite their trusted source in fixture metadata/docs.

## Separation of concerns

The lunar calendar package must not contain tide folklore rules. A future cultural/knowledge module may explain traditional `con nước` memory rules separately from astronomical calculations.

## Localization

Default: `vi-VN`.

Architecture should keep labels/localization external enough to add English later without changing calendar algorithms.
