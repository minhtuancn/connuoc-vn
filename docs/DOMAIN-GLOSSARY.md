# Domain Glossary — Thuật ngữ Việt Nam

Tài liệu chuẩn hóa thuật ngữ để UI, API, docs và data model dùng nhất quán.

| Thuật ngữ | Ý nghĩa trong sản phẩm |
|---|---|
| Con nước | Cách gọi dân gian về chu kỳ/trạng thái nước lên xuống liên quan thủy triều; không đồng nhất với một đại lượng khoa học duy nhất. |
| Nước lớn | Mốc/mức thủy triều cao cục bộ. |
| Nước ròng | Mốc/mức thủy triều thấp cục bộ. |
| Nước lên | Mực nước đang tăng theo thời gian. |
| Nước xuống | Mực nước đang giảm theo thời gian. |
| Nước đứng | Khoảng gần điểm đổi chiều, tốc độ thay đổi mực nước nhỏ; threshold phải do engine định nghĩa. |
| Nước cường | Kỳ biên độ triều thường lớn hơn; UI cần tránh biến kinh nghiệm dân gian thành khẳng định tuyệt đối. |
| Nước kém | Kỳ biên độ triều thường nhỏ hơn. |
| Triều thiên văn | Thành phần thủy triều có thể dự báo từ các thành phần điều hòa/thiên văn. |
| Mực nước quan trắc | Giá trị được đo/ghi nhận thực tế tại trạm hoặc cảm biến. |
| Mực nước dự báo | Giá trị do một hệ thống dự báo cung cấp cho tương lai. |
| Mực nước suy diễn | Giá trị được nội suy/mô hình hóa từ nguồn khác, không phải đo trực tiếp tại vị trí. |
| Datum / hệ cao độ | Mốc tham chiếu thẳng đứng của mực nước. Hai giá trị khác datum không được so trực tiếp nếu chưa có chuyển đổi xác nhận. |
| Cửa sông | Khu vực sông giao/thoát ra biển hoặc vùng nước triều. |
| Cống tiêu | Công trình điều tiết/thoát nước; app chỉ hỗ trợ quyết định trong scope ban đầu. |
| Mực trong | Mực nước phía cần tiêu/ở thượng lưu hoặc phía trong công trình theo cấu hình site. |
| Mực ngoài | Mực nước phía nhận nước/phía hạ lưu theo cấu hình site. |
| ΔH | Chênh mực nước `H_inside - H_outside` theo cùng datum/đơn vị hợp lệ. |
| Cửa sổ tiêu | Khoảng thời gian các điều kiện cho tiêu tự chảy đáp ứng policy/model. |
| Độ trễ triều | Thời gian tín hiệu triều truyền từ điểm tham chiếu đến vị trí khác; có thể thay đổi theo điều kiện sông. |
| Suy giảm biên độ | Mức giảm biên độ tín hiệu triều khi truyền vào sông/kênh. |
| Confidence | Mức tin cậy của kết quả dựa trên nguồn, freshness, datum, calibration và model; không đồng nghĩa xác suất tuyệt đối nếu chưa định nghĩa thống kê như vậy. |
| Freshness | Độ mới của dữ liệu so với ngưỡng sử dụng của từng feature. |
| Provenance | Khả năng truy nguồn dữ liệu: source, thời gian, parser/model/version, datum, chất lượng. |

## UI terminology rules

- Dùng từ dân gian dễ hiểu ở headline, thuật ngữ kỹ thuật ở phần chi tiết.
- Luôn phân biệt `quan trắc`, `dự báo`, `tính toán`, `suy diễn`, `nhập tay`.
- Không dùng `thời gian chính xác` cho dự báo nếu không có cơ sở.
- Với drainage, `Tốt` nghĩa là tốt theo model/input hiện tại và phải đi kèm confidence/reasons; không phải lệnh vận hành bắt buộc.
