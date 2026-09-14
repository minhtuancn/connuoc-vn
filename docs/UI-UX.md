# UI/UX Specification

## Design direction

Con Nước Việt phải có cảm giác **rõ ràng, tin cậy, hiện đại, dùng ngoài thực địa tốt**, tránh dashboard quá nhiều chữ hoặc kỹ thuật.

Visual direction:
- large typography,
- strong hierarchy,
- calm water-inspired palette,
- light/dark mode,
- restrained elevation/glass effects,
- large touch targets,
- charts optimized for sunlight/readability,
- no critical state encoded by color alone.

## Information hierarchy

Trang Home ưu tiên đúng 5 câu hỏi:

1. Tôi đang xem ở đâu?
2. Nước đang lên hay xuống?
3. Mực nước hiện tại/dự báo là bao nhiêu?
4. Khi nào đến mốc lớn/ròng tiếp theo?
5. Có thể tiêu nước không? (nếu site hỗ trợ)

Everything else is secondary.

## Home concept

```text
Nghĩa Phong, Ninh Bình
Hôm nay · 04/08 âm lịch

↓ NƯỚC ĐANG XUỐNG
1.42 m

Ròng tiếp theo 20:18
Còn 1 giờ 26 phút

[ TIÊU NƯỚC: TỐT ]
18:10 — 21:05

[Biểu đồ 24h]
```

Observed/predicted/forecast data must have visible labels.

## Navigation

Recommended bottom navigation:
- Hôm nay
- Lịch
- Bản đồ
- Tiêu nước
- Khác

On tablet/web, adapt to navigation rail/sidebar.

## Main screens

### Home
Status card, next extrema, mini chart, weather/rain context, shortcuts.

### Calendar
Month/week/day, Gregorian + lunar, tide markers, date jump.

### Chart
24h/3d/7d/month, pinch zoom, pan, crosshair, accessible table/summary.

### Map
Station/river/estuary/sluice layers, search, filters, entity sheet.

### Drainage
Site status, inside/outside level, timeline, confidence, reasons, manual input.

### Settings
Language, theme, text size, contrast, units, notifications, offline packs, privacy.

## Tide chart UX

Required:
- smooth pan/zoom,
- visible high/low markers,
- `Now` line,
- tooltip with local time + level + data type,
- observed and forecast visually distinguishable,
- uncertainty band when available,
- optional grid,
- reset zoom,
- text/table alternative.

Do not overcrowd mobile chart with labels.

## Drainage status semantics

Use icon + text + optional color:

```text
✓ TỐT
~ CÓ THỂ
! KHÔNG NÊN
? CHƯA ĐỦ DỮ LIỆU
```

The user must always be able to open `Vì sao?` to inspect reasons and data timestamps.

## Typography

Use platform-friendly, Vietnamese-complete fonts.

Typography tokens should include:
- display,
- headline,
- title,
- body,
- label,
- data/tabular number.

Numeric tide values should favor tabular figures if font supports them.

## Text scaling

Provide app presets in addition to OS scaling:
- Mặc định,
- Lớn,
- Rất lớn,
- Cực lớn.

Layouts must reflow rather than simply clip/ellipsis critical values.

## Color and status

Do not rely on green/yellow/red alone. Pair with:
- icon,
- status text,
- shape/border where helpful.

Charts should be readable in light/dark and high-contrast themes.

## Outdoor mode

Future-friendly mode:
- higher contrast,
- larger numbers,
- reduced decorative surfaces,
- optional screen-awake during active field view.

## Search UX

Search supports:
- Vietnamese with/without accents,
- station aliases,
- commune/district/province historical aliases if data model supports them,
- river/estuary names.

Result must explain what entity type it is and where it belongs.

## Empty/error/stale states

Examples:

```text
Không có dữ liệu mới
Dữ liệu gần nhất: 18:20, 42 phút trước
[ Xem dữ liệu cũ ]
```

Never substitute zero for missing water level.

## First-run onboarding

Keep short:
1. Explain product.
2. Choose location manually or optionally enable location.
3. Choose text size preview.
4. Optional notifications.

No mandatory account.

## Print UX

PDF flow:
- location/site,
- date range,
- template,
- paper size,
- orientation,
- color/monochrome,
- text size,
- preview,
- export/share.

## Design system

Create tokens for:
- typography,
- spacing,
- radius,
- elevation,
- semantic colors,
- chart states,
- water states,
- confidence states,
- breakpoints.

Keep platform-specific native behavior where it improves accessibility/usability.

## UX quality bar

Before release, critical screens must pass:
- small Android phone,
- common 6–7 inch phone,
- tablet,
- iPhone Dynamic Type large sizes,
- dark mode,
- high contrast,
- screen reader smoke test,
- offline/stale-data states.
