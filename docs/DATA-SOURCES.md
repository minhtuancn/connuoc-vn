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

Nguồn đã review trong Phase 1 nằm tại [`data/sources/registry.json`](../data/sources/registry.json). Registry là allowlist về mặt **đánh giá nguồn**, không tự động cấp quyền ingest/redistribute mọi endpoint của nhà cung cấp.

Mỗi nguồn phải có tối thiểu:

```text
id
name/operator
jurisdiction/authority
coverage/kind
access method
license status
redistribution status
raw-payload retention policy
attribution
vertical datum status
time semantics
quality/scientific notes
review date
```

## Phase 1 approved source strategy

### 1. NCHMF / Trung tâm Dự báo KTTV Quốc gia — authoritative Vietnam validation

**Registry id:** `vn-nchmf-tide-bulletins`

NCHMF là nguồn chính thức Việt Nam để đối chiếu các bản tin thủy triều/hải văn. Ví dụ bản tin ngày 15/09/2026 công bố dự báo 10 ngày cho Hòn Dấu, Quy Nhơn và Vũng Tàu cùng thời gian nước lớn/nước ròng.

Policy Phase 1:

- authority: `authoritative`;
- use: **validation-only**;
- không đóng gói/mirror bảng bulletin thô vào repository/app khi chưa có điều khoản/permission phân phối lại rõ ràng;
- fixture/PR có thể lưu citation + expected factual assertion tối thiểu cần cho test, nhưng không copy nguyên bảng/nội dung trang;
- datum/unit/time semantics phải xác minh ở cấp product trước khi so sánh numerical level;
- nếu không xác minh được datum thì chỉ dùng để kiểm tra xu hướng/event-time ở mức phù hợp, không so absolute level như cùng datum.

Lý do policy bảo thủ: trong đợt review Phase 1 không tìm thấy license dữ liệu tái sử dụng rõ ràng ngay trên các trang bulletin đã kiểm tra. Việc trang công khai truy cập được không được coi là quyền redistributable.

### 2. NOAA CO-OPS — open harmonic/datum reference for engine validation

**Registry id:** `us-noaa-coops-harmonics`

CO-OPS Metadata API công bố harmonic constituents và datum metadata; constituent record có amplitude, phase GMT/local và speed (degrees/hour). NOAA/NOS nêu phần lớn thông tin NOAA là public domain trừ khi có ghi chú khác và yêu cầu ghi nguồn; NOAA cũng có các tài liệu data-management phát hành CC0/public-domain.

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
- loại assertion (Tết, tháng nhuận, boundary, Can Chi, tiết khí...);
- nếu là case khó (tháng nhuận/boundary), ưu tiên ≥2 nguồn độc lập hoặc một nguồn thiên văn/official có phương pháp rõ.

## Source promotion states

```text
candidate
reviewed_validation_only
reviewed_redistributable
approved_for_fixtures
approved_for_ingestion
blocked
```

Promotion từ source công khai sang `approved_for_fixtures` yêu cầu review cả **rights** và **scientific semantics**. `approved_for_ingestion` là review riêng trong Phase 2 vì còn liên quan rate limit, SLA, parser, retention và monitoring.

## Record-level provenance

Mỗi observation/forecast/derived result phải truy ngược được về:
- source id,
- source timestamp,
- received/imported timestamp,
- parser version,
- raw payload checksum/reference (khi retention được phép),
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

Drainage engine phải có policy riêng, nghiêm ngặt hơn UI thông thường. Dữ liệu stale/không rõ datum có thể vẫn được hiển thị lịch sử, nhưng phải có khả năng khiến drainage engine trả `INSUFFICIENT_DATA` thay vì recommendation.

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

- `redistributable`: có thể lưu raw fixture/payload theo license và retention policy.
- `validation_only`: mặc định chỉ lưu checksum/reference/citation và assertion tối thiểu; không mirror raw content.
- `restricted/unknown`: không lưu raw payload trong repo/app nếu chưa có permission.

## Coverage transparency

Ứng dụng phải có coverage metadata để người dùng biết:
- khu vực có quan trắc trực tiếp,
- khu vực chỉ có tide prediction,
- khu vực suy diễn từ trạm gần nhất,
- khu vực chưa đủ dữ liệu.

## Source onboarding checklist

- [ ] Owner/operator xác định.
- [ ] Terms/license reviewed.
- [ ] Redistribution rights reviewed.
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
- Coi public URL là implicit redistribution license.
- Bỏ mất datum/timezone.
- Overwrite dữ liệu nguồn bằng community data.
- Dùng số liệu stale để đưa recommendation mà không cảnh báo.
- Để AI tự suy ra số liệu còn thiếu rồi ghi như observation.
- Dùng golden output do chính implementation sinh ra làm "independent validation".

## Review references — 2026-09-15

- NCHMF current tide bulletins and NCHMF center information.
- NOAA CO-OPS Metadata API: harmonic constituent/datum definitions.
- NOAA/National Ocean Service public-domain/copyright guidance and CO-OPS disclaimers.
- NOAA Data Access/Data Citation directives (CC0/public-domain documents).

URLs and machine-readable policy are retained in the source registry. Source terms must be re-reviewed before production ingestion because external policies can change.
