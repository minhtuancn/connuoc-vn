# Drainage Engine

## Goal

`packages/drainage-engine` hỗ trợ đánh giá **có thể tiêu/rút nước hay không** dựa trên dữ liệu đã chuẩn hóa. Engine không trực tiếp điều khiển cống và không tự fetch dữ liệu.

## Core concept

```text
ΔH = H_inside - H_outside
```

Về nguyên tắc, ΔH dương tạo điều kiện tiêu tự chảy, nhưng quyết định phải xét thêm xu hướng, datum, freshness, hình học cống, độ trễ, mưa và chất lượng dữ liệu.

## Required inputs v1

```text
insideLevel
outsideLevel
insideLevelType
outsideLevelType
insideTimestamp
outsideTimestamp
insideDatum
outsideDatum
insideTrend
outsideTrend
```

Optional:

```text
gateGeometry
forecastInsideSeries
forecastOutsideSeries
lagEstimate
rainfallContext
manualOperatorConstraints
```

## Hard safety gates

Return `INSUFFICIENT_DATA` when any mandatory condition fails, including:
- missing level,
- stale mandatory level beyond configured threshold,
- incompatible/unknown datum when comparison would be unsafe,
- invalid units,
- timestamp uncertainty beyond policy,
- impossible/out-of-range values not resolved by quality rules.

## Status model

```text
GOOD
POSSIBLE
NOT_RECOMMENDED
INSUFFICIENT_DATA
```

Every result must include:
- reasons,
- warnings,
- input snapshot reference/version,
- confidence,
- calculation/model version.

## Window calculation

Given forecast series, find contiguous intervals where policy constraints pass.

Output:

```text
windowStart
bestAt
windowEnd
maxDeltaLevel
minimumExpectedDelta
score
confidence
```

`bestAt` is the point/period with strongest safe drainage potential according to the approved scoring model, not necessarily the exact astronomical low tide.

## Score v1 concept

A future ADR must define coefficients. Inputs may include:
- positive ΔH,
- duration of positive ΔH,
- outside trend still falling vs already rising,
- forecast uncertainty,
- freshness,
- gate capacity/geometry,
- rainfall context.

Do not implement undocumented magic weights.

## Gate geometry

Potential model fields:

```text
sillElevation
openingWidth
openingHeight
gateCount
maxOpening
flowCoefficient
operationalMinLevel
operationalMaxLevel
```

Hydraulic discharge estimation must be a separately validated module; MVP may provide qualitative windows before quantitative flow estimates.

## Lag model

For locations away from the estuary, store/version:
- reference station,
- delay minutes,
- damping factor,
- calibration season/range,
- observation count,
- error metrics.

Never imply that fixed lag is universally valid. River conditions, discharge and weather can alter propagation.

## Manual measurements

Manual input must capture:
- timestamp,
- unit,
- datum/reference if known,
- operator note,
- verification state.

UI should clearly label manual values.

## Confidence

Confidence should be explainable. Candidate factors:
- observed vs forecast vs derived input,
- data freshness,
- datum certainty,
- local calibration quality,
- forecast horizon,
- missing optional context,
- source quality.

Suggested labels:

```text
HIGH
MEDIUM
LOW
UNAVAILABLE
```

The numeric score and human label must be versioned.

## Explainability example

```text
TIÊU TỐT
18:10–21:05
Tốt nhất khoảng 19:35

Vì:
- Mực trong cao hơn mực ngoài 0,42 m.
- Mực ngoài còn xu hướng giảm trong 55 phút.
- Hai mực nước cùng hệ cao độ đã xác nhận.

Độ tin cậy: Trung bình
- Mực ngoài là dự báo, cập nhật 35 phút trước.
```

## Prohibited behavior

- No automatic physical gate control in the initial architecture.
- No recommendation from AI-generated missing values.
- No hidden datum conversion.
- No `GOOD` status based solely on tide-table time.
- No recommendation without source/freshness traceability.

## Validation plan

For each pilot site capture:
- predicted start/end/best time,
- actual flow direction change,
- manual/observed levels,
- weather/river context,
- error minutes,
- false-positive/false-negative recommendations.

Calibration must be site-specific and versioned.
