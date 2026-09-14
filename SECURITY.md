# Security Policy

Con Nước Việt đang ở giai đoạn foundation/pre-production.

## Reporting

Không đăng công khai secret, credential, dữ liệu riêng tư hoặc chi tiết khai thác đang hoạt động trong issue công khai. Khi kênh security advisory/contact riêng của repository được cấu hình, hãy dùng kênh đó cho báo cáo lỗ hổng.

## Supported versions

Chưa có bản production được hỗ trợ. Chính sách version support sẽ được công bố trước public release.

## Scope priorities

Các khu vực được xem là security-sensitive:
- admin authentication/RBAC,
- data-source ingestion,
- account/location data,
- IoT device identity,
- notification credentials,
- store/release signing,
- drainage data integrity.

Xem thêm `docs/SECURITY-PRIVACY.md`.
