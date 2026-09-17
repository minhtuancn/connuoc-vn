# Con Nước Việt

**Con Nước Việt** là ứng dụng miễn phí, ưu tiên Việt Nam, giúp người dùng theo dõi **nước lên – nước xuống, thủy triều, lịch âm/dương, cửa sổ tiêu thoát nước, thời tiết liên quan đến thủy văn và lịch nghề sông nước** trên Android, iOS và Web.

> Mục tiêu: biến dữ liệu thủy triều/thủy văn thành thông tin dễ hiểu và có thể hành động: **nước đang lên hay xuống, khi nào ròng/lớn, có thể tiêu nước không, thời gian thuận lợi nhất là khi nào, dữ liệu đến từ đâu và độ tin cậy ra sao**.

## Tầm nhìn

Con Nước Việt hướng tới một nền tảng công ích miễn phí cho người dân, nông nghiệp, thủy lợi, nuôi trồng thủy sản, tàu thuyền, đánh bắt, du lịch ven sông/biển và cộng đồng địa phương.

Ứng dụng không chỉ là lịch thủy triều. Hệ thống được thiết kế để hỗ trợ:

- Thủy triều thiên văn tại trạm/cửa biển.
- Dự báo nước lên – xuống tại sông/cửa sông có xét độ trễ và suy giảm biên độ.
- Đánh giá cửa sổ tiêu thoát nước theo chênh mực nước trong/ngoài.
- Lịch âm Việt Nam, lịch dương, Can Chi, tiết khí, pha Trăng.
- Biểu đồ 24 giờ, 3 ngày, 7 ngày, tháng.
- Bản đồ trạm, sông, cửa biển, cống, hồ/đập.
- Chế độ offline-first.
- Xuất lịch PDF A4/A3 cho ngày/tuần/tháng/năm và các mẫu nghề nghiệp.
- Accessibility: phóng chữ, cỡ chữ lớn, tương phản cao, TalkBack/VoiceOver.
- Cảnh báo nước lớn, nước ròng, cửa sổ tiêu, mưa lớn và điều kiện bất lợi.
- Dữ liệu cộng đồng và IoT trong các phase sau.

## Nguyên tắc sản phẩm

1. **Dễ hiểu trước, chi tiết sau**: trang chủ trả lời nhanh trạng thái nước và mốc tiếp theo.
2. **Có nguồn và độ tin cậy**: mọi dự báo quan trọng phải biết nguồn, thời gian phát hành, datum và confidence.
3. **Không dùng AI thay thế engine thủy văn**: AI chỉ giải thích kết quả đã được tính toán bằng mô hình/engine có thể kiểm chứng.
4. **Offline-first**: lịch âm và thủy triều thiên văn đã tải phải dùng được khi mất mạng.
5. **Việt Nam-first**: tiếng Việt, địa danh Việt Nam, lịch Việt Nam, sông ngòi/cửa biển/cống Việt Nam.
6. **Privacy by default**: không bắt buộc tài khoản cho các chức năng cốt lõi.
7. **Accessible by default**: phù hợp cả người lớn tuổi và người dùng ngoài hiện trường.

## Kiến trúc tổng quan

```text
Mobile (Flutter)       Web / Admin (Next.js)
       │                       │
       └──────────┬────────────┘
                  │
             API Gateway
              (NestJS)
                  │
     ┌────────────┼──────────────┐
     │            │              │
 Tide Service  Hydro/Drainage  Calendar
     │            │              │
     └────────────┼──────────────┘
                  │
         PostgreSQL + PostGIS
                  │
       Redis / Queue / Cache
                  │
  Workers: tide / weather / notification
                  │
 Official sources / forecast feeds / observations
```

Chi tiết: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Cấu trúc repository

```text
connuoc-vn/
├── apps/
│   ├── mobile/                  # Flutter Android/iOS
│   ├── web/                     # Next.js public web/PWA
│   └── admin/                   # Next.js administration
├── services/
│   ├── api/                     # NestJS API/BFF
│   ├── tide-worker/             # tide ingestion & prediction jobs
│   ├── weather-worker/          # weather/hydrology ingestion
│   └── notification-worker/     # scheduled alerts and push jobs
├── packages/
│   ├── tide-engine/             # deterministic tide computation
│   ├── lunar-calendar/          # Vietnamese lunar calendar
│   ├── drainage-engine/         # drainage-window decision engine
│   ├── geo/                     # geospatial/domain utilities
│   ├── shared-types/            # schemas/contracts/types
│   └── design-tokens/           # design primitives shared by web/admin
├── data/
│   ├── stations/                # station metadata fixtures/imports
│   ├── rivers/                  # river/basin metadata
│   └── fixtures/                # test/reference datasets
├── infrastructure/
│   ├── docker/
│   ├── database/
│   ├── monitoring/
│   └── deployment/
├── docs/
├── .github/
└── README.md
```

> Git không lưu thư mục rỗng; mỗi khu vực kiến trúc sẽ có README/placeholder khi skeleton được triển khai.

## Tài liệu

- [Project status](docs/PROJECT-STATUS.md)
- [PRD](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [TODO](docs/TODO.md)
- [Data & provenance](docs/DATA-SOURCES.md)
- [Tide engine](docs/TIDE-ENGINE.md)
- [Drainage engine](docs/DRAINAGE-ENGINE.md)
- [Vietnamese lunar calendar](docs/LUNAR-CALENDAR.md)
- [UI/UX](docs/UI-UX.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Offline strategy](docs/OFFLINE.md)
- [PDF export](docs/PDF-EXPORT.md)
- [Security & privacy](docs/SECURITY-PRIVACY.md)
- [Testing](docs/TESTING.md)
- [Deployment & release](docs/DEPLOYMENT.md)

## Product stages

- **Foundation** — specification, data contracts, architecture, design system.
- **MVP** — mobile + web, station search, tide chart, lunar calendar, favorites, offline.
- **Vietnam Coverage** — regional data, rivers/canals, weather/hydrology integrations.
- **Drainage Intelligence** — cống, upstream/downstream levels, lag model, drainage windows.
- **Print & Professional Use** — PDF A4/A3 and occupation-specific templates.
- **Community & IoT** — local observations, calibration, sensors, MQTT/LoRaWAN.
- **Production** — store hardening, observability, public API, data governance.

## Trạng thái

Repository đã vượt giai đoạn Foundation/pre-MVP: **Phase 2 Backend & Data Platform đã có exit gate**, Mobile MVP đang triển khai theo Phase 3, và **Phase 5A Location + Provider Platform cùng Phase 5B Weather Forecasts đã hoàn tất và merge vào `main`**.

Toàn sản phẩm **chưa gần hoàn thiện production**: rainfall intelligence, river discharge, calibrated river-rise, flood risk, official alerts, phần lớn mobile/web journeys, pilot/backtesting và store-production vẫn còn. Xem trạng thái chi tiết, dependency và critical path tại [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md).

Chưa có tuyên bố nào trong tài liệu này nên được hiểu là dữ liệu thủy văn vận hành hoặc khuyến cáo an toàn chính thức.

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md). Mọi thay đổi liên quan đến thuật toán thủy triều, drainage score, datum hoặc nguồn dữ liệu phải có test, dataset tham chiếu và mô tả provenance.

## License

Sản phẩm dự kiến miễn phí cho người dùng. Giấy phép mã nguồn sẽ được chốt trước khi mở đóng góp rộng rãi; việc repository công khai không tự động cấp quyền sử dụng lại mã nguồn ngoài các quyền GitHub mặc định.
