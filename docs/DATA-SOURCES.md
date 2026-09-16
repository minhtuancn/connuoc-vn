# Data Sources & Provenance

## Principles

Con Nước Việt phải phân biệt rõ:
- **Observed**: số liệu quan trắc thực tế.
- **Forecast**: số liệu dự báo từ nguồn bên ngoài.
- **Predicted**: số liệu do tide engine nội bộ tính.
- **Interpolated/Derived**: số liệu suy diễn từ trạm hoặc mô hình khác.
- **Manual**: số liệu người dùng nhập.
- **Community**: số liệu cộng đồng đóng góp.

Không được hiển thị các loại này như nhau.

## Machine-readable source registry

Nguồn đã review nằm tại [`data/sources/registry.json`](../data/sources/registry.json), được kiểm tra cấu trúc bằng [`data/sources/registry.schema.json`](../data/sources/registry.schema.json). Registry là allowlist về mặt **đánh giá nguồn**, không tự động cấp quyền ingest/redistribute mọi endpoint của nhà cung cấp.

Từ Phase 5, mỗi source có policy machine-checkable riêng cho:

```text
policyVersion
termsReviewedAt
termsReference
licenseStatus
commercialUseStatus
redistribution
rawPayloadRetention
attribution
```

`UNKNOWN` và `APPROVAL_REQUIRED` là trạng thái chặn, không phải giá trị tạm thời được phép bỏ qua trong production.

## Phase 1 approved source strategy

### 1. NCHMF / Trung tâm Dự báo KTTV Quốc gia — authoritative Vietnam validation

**Registry id:** `vn-nchmf-tide-bulletins`

NCHMF là nguồn chính thức Việt Nam để đối chiếu các bản tin thủy triều/hải văn.

Policy Phase 1:

- authority: `authoritative`;
- use: **validation-only**;
- không đóng gói/mirror bảng bulletin thô vào repository/app khi chưa có điều khoản/permission phân phối lại rõ ràng;
- fixture/PR có thể lưu citation + expected factual assertion tối thiểu cần cho test, nhưng không copy nguyên bảng/nội dung trang;
- datum/unit/time semantics phải xác minh ở cấp product trước khi so sánh numerical level;
- nếu không xác minh được datum thì chỉ dùng để kiểm tra xu hướng/event-time ở mức phù hợp, không so absolute level như cùng datum.

Lý do policy bảo thủ: việc trang công khai truy cập được không được coi là quyền ingest/redistribute/commercial-use. Đến review 2026-09-17, automated machine use vẫn phải ở trạng thái approval-gated nếu chưa có permission/terms cụ thể.

### 2. NOAA CO-OPS — open harmonic/datum reference for engine validation

**Registry id:** `us-noaa-coops-harmonics`

CO-OPS Metadata API công bố harmonic constituents và datum metadata; constituent record có amplitude, phase GMT/local và speed (degrees/hour). NOAA/NOS nêu phần lớn thông tin NOAA là public domain trừ khi có ghi chú khác và yêu cầu ghi nguồn.

Policy Phase 1:

- source generally suitable for redistributable reference fixtures **sau khi kiểm tra item/product-specific restriction**;
- luôn ghi attribution NOAA;
- không suy diễn rằng `phase_GMT` có thể đưa trực tiếp vào engine v1 chỉ vì cùng tên field `phase`;
- source adapter phải ghi phase convention, epoch, astronomy/nodal treatment và datum normalization;
- official NOAA prediction comparison chỉ được promotion thành golden test khi internal model semantics tương đương đã được chứng minh/documented;
- raw/preliminary observation disclaimers phải được giữ nguyên khi về sau ingest observation.

### 3. Synthetic mathematical fixtures — exact implementation tests

**Registry id:** `synthetic-math-fixtures`

Các đường cosine/parabola/plateau do project tự tạo được phép version trực tiếp trong repo và dùng để kiểm tra chính xác thuật toán. Đây là bằng chứng implementation, **không** phải bằng chứng model khớp trạm thực địa.

### 4. Vietnamese lunar-calendar factual fixtures

**Registry id:** `lunar-independent-reference-set`

Golden fixture lịch âm phải lưu factual mapping nhỏ, independently verified; không copy nguyên bảng lịch từ website/app khác. Mỗi nhóm fixture phải ghi:

- source/reference URLs hoặc tài liệu;
- ngày review;
- convention UTC+07 / Asia/Ho_Chi_Minh;
- loại assertion;
- nếu là case khó, ưu tiên nhiều nguồn độc lập hoặc nguồn thiên văn/official có phương pháp rõ.

## Phase 5 weather/hydrology provider policy — reviewed 2026-09-17

### Open-Meteo

Ba deployment interpretation được tách thành ba registry record, không gộp làm một source:

- `open-meteo-free-hosted`: hosted free API chỉ dùng cho non-commercial deployment theo terms hiện hành; dữ liệu yêu cầu attribution.
- `open-meteo-paid-hosted`: customer API có commercial-use entitlement; API key chỉ tồn tại trong secret infrastructure.
- `open-meteo-self-hosted`: server có thể self-host nhưng vẫn phải tuân thủ license server và attribution/terms của dữ liệu/model upstream thực sự bật.

Không được dùng free hosted endpoint như fallback âm thầm cho production thương mại.

### GEOGLOWS ECMWF Streamflow Service

**Registry id:** `geoglows-ecmwf-streamflow`

GEOGLOWS công bố streamflow-service data theo CC BY 4.0. Adapter phải giữ attribution, model/run metadata và phân biệt rõ retrospective simulation với observation.

Quan trọng: GEOGLOWS trả **discharge/streamflow**, không phải mực nước trạm đã hiệu chỉnh. Không chuyển discharge thành stage/mực nước chính xác nếu chưa có gauge datum + rating curve/calibrated model được validation.

### NASA GPM IMERG

**Registry id:** `nasa-gpm-imerg`

GPM công bố mission data là freely available và yêu cầu citation theo dataset/version. Registry vẫn giữ `commercialUseStatus: UNKNOWN` cho IMERG cho tới khi review thương mại ở cấp product/version được ghi nhận riêng; public availability không được dùng như bằng chứng commercial-use entitlement.

Adapter phải giữ run (`Early`/`Late`/`Final`), version, observation interval, archive/capture timestamp và attribution của exact product dùng.

### NCHMF weather/hydrology candidate

**Registry id:** `vn-nchmf-weather-hydrology-candidate`

Nguồn official Việt Nam được ưu tiên về authoritative warnings, nhưng production ingestion chỉ được enable khi có machine feed/partner API hoặc permission đủ rõ để xác định:

- quyền ingest tự động;
- commercial-use;
- redistribution;
- raw payload retention;
- attribution;
- datum/time semantics của từng product/station.

Không dùng unlicensed scraping làm production adapter. Official warning phải được giữ tách biệt với internally-derived flood risk và có precedence cao hơn internal risk messaging khi cùng phạm vi/thời gian.

## Source promotion states

```text
candidate
reviewed_validation_only
reviewed_redistributable
approved_for_fixtures
approved_for_ingestion
blocked
```

Promotion từ source công khai sang `approved_for_fixtures` yêu cầu review cả **rights** và **scientific semantics**. `approved_for_ingestion` là review riêng vì còn liên quan rate limit, SLA, parser, retention, monitoring và commercial deployment mode.

## Machine policy behavior

`services/weather-worker/src/source-policy.ts` áp dụng fail-closed policy:

- `COMMERCIAL` deployment chỉ nhận source có `commercialUseStatus=ALLOWED`;
- raw republishing chỉ được phép khi redistribution là `ALLOWED` hoặc `ATTRIBUTION_REQUIRED` **và** raw retention là `ALLOWED` hoặc `ALLOWED_WITH_ATTRIBUTION`;
- `RESTRICTED`, `UNKNOWN`, `REFERENCE_ONLY`, `APPROVAL_REQUIRED` không được tự động nâng quyền;
- attribution requirement phải được xử lý ở presentation/export path, không chỉ ghi trong docs.

Provider selector dùng cùng commercial-use policy để tránh implementation drift giữa registry policy và runtime selection.

## Record-level provenance

Mỗi observation/forecast/derived result phải truy ngược được về:
- source id,
- source timestamp,
- received/imported timestamp,
- parser version,
- raw payload checksum/reference khi retention được phép,
- quality flags,
- datum/unit,
- forecast/model version.

## Data quality flags

Recommended baseline:

```text
VALID
ESTIMATED
SUSPECT
STALE
MISSING
OUT_OF_RANGE
DATUM_UNKNOWN
TIME_UNCERTAIN
SOURCE_ERROR
MANUAL_UNVERIFIED
COMMUNITY_UNVERIFIED
```

## Freshness policy

Mỗi source/metric có `freshnessThreshold`. UI phải hiển thị stale state khi quá ngưỡng thay vì tiếp tục dùng dữ liệu cũ như dữ liệu hiện tại.

Drainage/flood-risk engine phải có policy riêng, nghiêm ngặt hơn UI thông thường. Dữ liệu stale/không rõ datum có thể vẫn được hiển thị lịch sử, nhưng phải có khả năng khiến engine trả `INSUFFICIENT_DATA` thay vì recommendation.

## Datum policy

Không so sánh trực tiếp hai mực nước nếu datum khác nhau hoặc không rõ tương thích.

Cần lưu:
- datum name/id,
- vertical reference notes,
- conversion/offset only when documented and versioned,
- source of conversion,
- uncertainty if conversion is approximate.

`cm`/`m` chỉ là đơn vị. Hai mực nước cùng đơn vị **không đồng nghĩa** cùng datum.

## Raw payload retention

Phase 5 machine values:

- `ALLOWED`: có thể lưu raw payload theo source policy.
- `ALLOWED_WITH_ATTRIBUTION`: có thể lưu/redistribute khi attribution obligations được giữ.
- `REFERENCE_ONLY`: chỉ lưu checksum/reference/citation và assertion tối thiểu; không mirror raw payload.
- `APPROVAL_REQUIRED`: không lưu raw payload cho tới khi approval được ghi nhận.
- `UNKNOWN`: fail closed; không package/republish raw payload.

## Coverage transparency

Ứng dụng phải có coverage metadata để người dùng biết:
- khu vực có quan trắc trực tiếp,
- khu vực chỉ có model/forecast,
- khu vực suy diễn từ trạm/model gần nhất,
- khu vực chưa đủ dữ liệu.

## Source onboarding checklist

- [ ] Owner/operator xác định.
- [ ] Terms/license reviewed và `termsReviewedAt` được cập nhật.
- [ ] Commercial-use status reviewed.
- [ ] Redistribution rights reviewed.
- [ ] Raw payload retention reviewed.
- [ ] Attribution requirement documented.
- [ ] Datum documented.
- [ ] Timezone/timestamp semantics documented.
- [ ] Units documented.
- [ ] Sample payload archived as test fixture **chỉ khi permitted**.
- [ ] Parser tests.
- [ ] Failure/staleness behavior defined.
- [ ] Monitoring added.

## Fixture PR checklist

- [ ] Registry source ID included.
- [ ] Source/license status reviewed on PR date.
- [ ] No copied table/page content beyond what is necessary/permitted.
- [ ] Datum/unit/time convention explicit.
- [ ] Expected values independently derived/verified where possible.
- [ ] Synthetic vs real-world accuracy claim clearly separated.
- [ ] Citation/reference preserved.

## Never do

- Scrape nguồn không rõ quyền sử dụng rồi coi như dữ liệu chính thức.
- Coi public URL là implicit redistribution/commercial-use license.
- Bỏ mất datum/timezone/model run/version.
- Overwrite dữ liệu nguồn bằng community data.
- Dùng số liệu stale để đưa recommendation mà không cảnh báo.
- Để AI tự suy ra số liệu còn thiếu rồi ghi như observation.
- Dùng golden output do chính implementation sinh ra làm independent validation.
- Hạ `UNKNOWN` thành `ALLOWED` chỉ để provider được selector chọn.

## Review references — 2026-09-17

Machine-readable URLs được giữ trong `data/sources/registry.json`. Review 2026-09-17 bao gồm:

- Open-Meteo Terms và Pricing: phân biệt Free Hosted non-commercial, Paid Hosted commercial, data attribution và self-hosted server.
- GEOGLOWS ECMWF Streamflow Service License/Documentation: CC BY 4.0 data, streamflow forecast/retrospective semantics.
- NASA GPM Data Usage Policy/Data Directory: mission data availability và dataset citation requirements; commercial-use vẫn fail-closed ở registry cho tới product-level review.
- NCHMF public weather/hydrology pages: authoritative reference nhưng không suy diễn machine-use/redistribution rights khi chưa có terms/permission cụ thể.
- NOAA CO-OPS metadata/disclaimer references cho Phase 1 tide validation.

Source terms phải được re-review trước production onboarding vì external policies có thể thay đổi.
