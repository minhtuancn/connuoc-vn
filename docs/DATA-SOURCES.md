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

## Source registry

Mỗi nguồn dữ liệu phải có hồ sơ:

```text
id
name
operator
url
jurisdiction
coverage
kind
license
redistributionAllowed
attributionRequired
updateFrequency
authentication
rateLimit
parserVersion
qualityNotes
active
```

## Record-level provenance

Mỗi observation/forecast/derived result phải truy ngược được về:
- source id,
- source timestamp,
- received/imported timestamp,
- parser version,
- raw payload checksum/reference,
- quality flags,
- datum/unit,
- forecast/model version.

## Source categories

### A. Authoritative / official
Ưu tiên cho số liệu quan trắc/cảnh báo và metadata trạm khi có quyền sử dụng phù hợp.

### B. Public/open data
Chỉ tích hợp sau khi xác minh điều khoản sử dụng, attribution và quyền phân phối lại.

### C. Partner data
Cần hợp đồng/permission rõ ràng và phạm vi sử dụng.

### D. Community/manual
Luôn gắn nhãn và không tự động thay thế nguồn chính thức.

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

Drainage engine phải có policy riêng, nghiêm ngặt hơn UI thông thường.

## Datum policy

Không so sánh trực tiếp hai mực nước nếu datum khác nhau hoặc không rõ tương thích.

Cần lưu:
- datum name/id,
- vertical reference notes,
- conversion/offset only when documented and versioned.

## Raw payload retention

MVP có thể giữ:
- checksum bắt buộc,
- raw payload/object reference khi điều khoản cho phép,
- parser version,
- import metadata.

Retention chi tiết phải cân bằng auditability, license và chi phí lưu trữ.

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
- [ ] Sample payload archived as test fixture where permitted.
- [ ] Parser tests.
- [ ] Failure/staleness behavior defined.
- [ ] Monitoring added.

## Never do

- Scrape nguồn không rõ quyền sử dụng rồi coi như dữ liệu chính thức.
- Bỏ mất datum/timezone.
- Overwrite dữ liệu nguồn bằng community data.
- Dùng số liệu stale để đưa recommendation mà không cảnh báo.
- Để AI tự suy ra số liệu còn thiếu rồi ghi như observation.
