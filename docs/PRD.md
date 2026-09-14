# PRD — Con Nước Việt

## 1. Product summary

Con Nước Việt là ứng dụng miễn phí, ưu tiên thị trường Việt Nam, cung cấp lịch con nước, thủy triều, lịch âm/dương Việt Nam, biểu đồ mực nước, bản đồ trạm/sông/cửa biển/cống và công cụ hỗ trợ đánh giá khả năng tiêu thoát nước.

Sản phẩm phải phục vụ tốt cả người dùng phổ thông lẫn người làm nông nghiệp, thủy lợi, nuôi trồng thủy sản, tàu thuyền, đánh bắt và quản lý địa phương.

## 2. Problems to solve

### 2.1 Người dùng phổ thông
- Khó biết lúc nào nước đang lên/xuống.
- Khó đọc bảng thủy triều kỹ thuật.
- Muốn xem cùng lúc lịch âm, lịch dương và con nước.
- Muốn biết ngày/giờ thuận lợi cho công việc sông nước.

### 2.2 Người cần tiêu thoát nước
- Không chỉ cần biết giờ nước ròng ngoài biển mà cần biết chênh mực nước trong/ngoài và độ trễ truyền triều.
- Cần câu trả lời dễ hiểu: có thể mở cống không, mở khi nào, đóng khi nào, confidence bao nhiêu.
- Cần lưu cấu hình cống, trạm tham chiếu, quan sát thực tế và hiệu chỉnh theo địa phương.

### 2.3 Người làm chuyên môn/thực địa
- Cần biết nguồn dữ liệu, datum, thời gian cập nhật.
- Cần biểu đồ và dữ liệu lịch sử.
- Cần xuất PDF/CSV để in hoặc chia sẻ.
- Cần hoạt động khi mạng yếu hoặc không có mạng.

## 3. Product principles

1. Việt Nam-first.
2. Offline-first cho dữ liệu có thể tiền tính toán.
3. Deterministic engines cho tính toán quan trọng.
4. Dữ liệu phải có provenance và confidence.
5. Không trộn lẫn dự báo thủy triều thiên văn với quan trắc mực nước thực tế.
6. Accessibility là yêu cầu nền tảng.
7. Privacy-by-default; tài khoản là tùy chọn cho core usage.
8. Miễn phí cho người dùng cuối trong định hướng hiện tại.

## 4. Target personas

### P1 — Người dân ven sông/ven biển
Mục tiêu: xem nhanh con nước, lịch âm/dương, cảnh báo.

### P2 — Người vận hành tiêu thoát nước/cống
Mục tiêu: biết khi nào ngoài thấp hơn trong, cửa sổ tiêu tốt nhất, thời điểm đóng.

### P3 — Nông dân/nuôi trồng thủy sản
Mục tiêu: theo dõi triều, mưa, lịch thao tác ao/đầm, lịch sản xuất.

### P4 — Ngư dân/tàu thuyền
Mục tiêu: triều, bình minh/hoàng hôn, gió/sóng ở phase phù hợp.

### P5 — Cán bộ/kỹ thuật viên
Mục tiêu: dữ liệu có nguồn, biểu đồ, PDF/CSV, cấu hình trạm/cống.

### P6 — Người lớn tuổi
Mục tiêu: chữ lớn, giao diện đơn giản, tương phản tốt, thao tác ít bước.

## 5. Core user journeys

### J1 — Xem trạng thái nước hiện tại
Mở app → tự chọn hoặc dùng vị trí → thấy `Đang lên/Đang xuống`, mực dự báo/quan trắc, mốc lớn/ròng tiếp theo, nguồn và confidence.

### J2 — Xem lịch tháng
Chọn tháng → lịch dương + âm → mỗi ngày có chỉ báo con nước → chạm ngày để mở biểu đồ 24h.

### J3 — Đánh giá tiêu nước
Chọn cống → engine lấy upstream/downstream level hoặc yêu cầu nhập tay → tính ΔH → hiển thị cửa sổ `Tốt/Có thể/Không nên/Chưa đủ dữ liệu` cùng lý do.

### J4 — In lịch
Chọn trạm/khu vực → chọn A4/A3, ngày/tuần/tháng/năm, portrait/landscape, màu/đen trắng → preview → PDF có nguồn, thời gian tạo và QR.

### J5 — Offline
Tải khu vực → lưu station metadata + constituents + lịch âm + dự báo tiền tính toán → xem khi mất mạng → đồng bộ lại khi có mạng.

## 6. MVP scope

### Must have
- Android + iOS Flutter app.
- Web public viewer.
- Tiếng Việt là ngôn ngữ mặc định.
- Chọn địa điểm/trạm thủ công; GPS là tùy chọn.
- Lịch dương + lịch âm Việt Nam.
- Hiển thị rising/falling, high/low tide.
- Tide chart 24h và 7 ngày.
- Favorites.
- Offline cache cho khu vực yêu thích.
- Data source/provenance visible.
- Accessibility cơ bản: Dynamic Type/scaled text, TalkBack/VoiceOver labels, high contrast.
- Admin quản lý station/source/import jobs.

### Should have
- MapLibre map.
- PDF A4/A3.
- Push notification trước nước lớn/ròng.
- Weather/rain overlay.
- Drainage engine v1 bằng dữ liệu nhập tay hoặc station pairs.

### Could have
- Community observation.
- IoT sensor integration.
- Tide-lag self-calibration.
- Public API.
- Voice search.
- AI explanation.

### Won't have in MVP
- AI tự đưa quyết định thủy văn.
- Điều khiển cống tự động.
- Cam kết thay thế bản tin/cảnh báo của cơ quan chức năng.
- Billing/subscription.

## 7. Feature requirements

### 7.1 Home dashboard
- Location selector.
- Current water state.
- Current/forecast level with clear data type.
- Next high/low time.
- Countdown.
- Confidence.
- Shortcut to chart, calendar, map, drainage.

### 7.2 Tide chart
- 24h/3d/7d/month modes.
- Pinch zoom and horizontal pan.
- Crosshair + tooltip.
- High/low markers.
- Observed vs forecast lines clearly distinguished.
- Confidence interval when available.
- Accessible textual summary.

### 7.3 Calendar
- Gregorian + Vietnamese lunar calendar.
- Can Chi, solar terms and moon phase where implemented.
- Daily tide indicators.
- Jump to date.
- Printable month view.

### 7.4 Map
- Stations, rivers, estuaries, sluices, reservoirs.
- Filters by layer/type.
- Search Vietnamese names without accents.
- Click/tap entity for current status.

### 7.5 Drainage
- Upstream/downstream water level.
- ΔH = H_in - H_out.
- Trend of outside water.
- Configurable gate geometry.
- Estimated lag.
- Drainage status and confidence.
- Explain inputs used in result.
- Never hide missing-data conditions.

### 7.6 PDF
- A4/A3.
- Day/week/month/year.
- Portrait/landscape.
- Color/monochrome.
- Large-print template.
- QR/deep link.
- Source, datum, generation time.

## 8. Data requirements

Every observation/forecast must support, when applicable:

```text
source
sourceUrl
stationId
observedAt
forecastFor
issuedAt
receivedAt
datum
unit
qualityFlag
confidence
license
rawPayloadRef
```

Station metadata:

```text
id
name
aliases
lat/lon
type
riverId
basinId
province
commune
timezone
datum
source
active
```

## 9. Non-functional requirements

### Performance
- App cold start target < 3s on mainstream Android devices after optimization.
- Cached home data target < 500ms after local DB load.
- Core chart interactions 60fps where practical.

### Reliability
- Source ingestion idempotent.
- Jobs retry with bounded exponential backoff.
- Forecast versioning.
- Graceful stale-data UI.

### Security
- Least privilege.
- No secret in mobile bundle beyond public client identifiers.
- Signed server-side admin actions.
- Audit log for data/source/admin changes.

### Accessibility
- Support platform text scaling.
- Do not encode state by color alone.
- Minimum touch target compatible with platform guidance.
- Screen-reader semantics for charts via summaries/data table alternatives.

### Privacy
- GPS optional.
- Anonymous core use.
- Minimize personal data.
- Account deletion flow before store release if accounts are enabled.

## 10. Success metrics

MVP:
- Tide calculations pass reference datasets.
- Lunar calendar passes known-date fixtures.
- Crash-free sessions >= 99.5% target after production stabilization.
- Core screens usable offline for downloaded region.
- Accessibility audit passes defined baseline.
- User can reach answer `nước đang lên/xuống` within one screen.

Drainage phase:
- Every drainage recommendation lists inputs + confidence.
- Calibration accuracy tracked per site.
- No recommendation emitted when mandatory inputs fail freshness/quality rules.

## 11. Safety and disclaimer

Con Nước Việt provides informational forecasts and decision support, not authoritative navigation, flood emergency, maritime safety or automatic infrastructure control. Critical operations must follow official observations, local operating procedures and competent authorities.

## 12. Open product decisions

- Final source-code license.
- Authoritative data/API agreements and licensing.
- Exact set of public nationwide stations in MVP.
- Whether public community observations require account verification.
- Public API rate limits and acceptable-use policy.
