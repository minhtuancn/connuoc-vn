# PDF / Print Export

## Goal

Con Nước Việt phải xuất được lịch chuyên dụng để in và sử dụng thực địa, không chỉ chụp màn hình ứng dụng.

## Paper sizes

- A4.
- A3.
- Portrait.
- Landscape.
- Color.
- Monochrome/print-safe.
- Large-print mode.

## Templates

### Daily
- Gregorian + lunar date.
- Tide chart 24h.
- High/low events.
- Current/source notes.

### Weekly
- 7-day extrema summary.
- Daily mini charts.
- Weather/rain context when available.

### Monthly
- Vietnamese calendar grid.
- Lunar day.
- Tide indicators.
- Legend/source footer.

### Annual wall calendar
- 12 months.
- Compact tide/con-water indicators.
- Printable hanging-calendar layout exploration.

### Drainage operation sheet
- Site/cống name.
- Inside/outside references.
- Recommended windows.
- Confidence/reasons.
- Operator notes area.

### Industry-specific
- Aquaculture.
- Fishing/navigation planning.
- Agricultural drainage.

## Required footer metadata

Every data-driven PDF must include:

```text
location/station/site
source summary
datum where applicable
forecast/model version
generatedAt
timezone
QR/deep link
informational-use disclaimer
```

## Rendering architecture

Two supported paths should be evaluated:

1. Client-side Flutter PDF for offline/simple templates.
2. Backend renderer for complex/report-quality templates and shared reproducibility.

Avoid two independent business-logic implementations: both renderers must consume the same normalized DTO/schema.

## Typography

Use fonts with full Vietnamese glyph coverage and verified redistribution/embedding rights. Do not commit unlicensed font binaries.

## Accessibility/print readability

- Large-print preset.
- Strong contrast.
- No information dependent on color.
- Clear units and timestamps.
- Avoid tiny legends.

## QR

QR should encode a stable HTTPS deep link rather than raw internal JSON. Opening the link should show the latest data while the printed PDF remains timestamped historical output.

## Test matrix

- A4 portrait/landscape.
- A3 portrait/landscape.
- color/monochrome.
- Vietnamese diacritics.
- 1-page and multi-page ranges.
- very large text.
- long station/site names.
- missing data.
- stale data.
- offline generation where supported.

## File naming

Recommended:

```text
con-nuoc-viet_<location>_<yyyy-mm>_<template>.pdf
```

Normalize unsafe filename characters.
