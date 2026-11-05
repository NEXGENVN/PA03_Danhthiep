# PA03 Khôi phục và chạy mã nguồn

Đã khôi phục 73 tệp JavaScript từ MANGUON.rar và bổ sung giao diện tiếng Việt với 25 trang: 31 nhóm chức năng từ mã gốc và luồng yêu cầu chia sẻ số điện thoại tự nguyện. Giao diện có dữ liệu mẫu để xem ngay và chế độ kết nối ba backend cục bộ.

**Mở giao diện: http://127.0.0.1:13103/#overview**

- [Hướng dẫn xem và dùng giao diện](docs/UI.vi.md)
- [Yêu cầu chia sẻ số điện thoại](docs/PHONE-SHARE.vi.md) — tạo liên kết, người nhận tự nhập số và đồng ý; không tự gửi tin Zalo.

- [Phân tích đầy đủ bằng tiếng Việt](docs/ANALYSIS.vi.md)
- [31 nhóm chức năng giao diện](docs/FEATURE-MATRIX.vi.md)
- [110 endpoint tại gateway](docs/API-REFERENCE.md)
- [Các vấn đề kỹ thuật](docs/ISSUES.vi.md)

## Chạy trên máy này

Mở `START.cmd` để bật database, ba backend và máy chủ giao diện. Mở `STOP.cmd` để tắt và giữ dữ liệu thử.

Hoặc dùng PowerShell trong thư mục dự án:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\tools\start-local.ps1
```

Giao diện mới: http://127.0.0.1:13103. Mặc định là **Xem mẫu**, có thể thêm/sửa/xóa và thử các quy trình bằng dữ liệu tổng hợp. Chọn **Kết nối backend** để đăng nhập bằng tài khoản thử. Không có thao tác gửi tin hoặc thanh toán thật ở chế độ mẫu.

Backend chính: http://127.0.0.1:13100/health — đây là API JSON.

Tài khoản quản trị thử được tạo ngẫu nhiên, lưu trong `.runtime/LOCAL-ACCESS.txt`. Cấu hình riêng ở `recovered/.env`. Hai tệp này được bỏ qua bởi Git.

```powershell
node tools/audit-source.cjs
node tools/smoke-local.cjs
npm.cmd run test:ui
```

Nếu chỉ cần xem giao diện mẫu khi các backend đã tắt: chạy `npm.cmd run start:ui` rồi mở cổng 13103. Phần mẫu không cần database.

Yêu cầu: Node.js 24 và Docker Desktop ở chế độ Linux containers. Đã kiểm chứng bằng Node.js 24.22.1, Docker Engine 29.9.2 và MariaDB 11.4. Thư viện khóa trong `package-lock.json`; cài lại bằng `npm.cmd ci`.

Database chỉ phục vụ thử nghiệm ở `127.0.0.1:13307`, tên `pa03_local`. Các bảng và view được suy ra từ mã, chưa thay thế được schema triển khai gốc. Không nhập các SQL này vào database đang vận hành.

## Cấu trúc

```text
recovered/              73 tệp JavaScript khôi phục, dùng để chạy
source-documents/       73 tệp Word gốc đã giải nén
analysis/               Kết quả phân tích và bằng chứng kiểm tra
analysis/readable/      Bản sao đọc được của ZL/FILES để phân tích
database/               Schema bổ sung được suy ra cho thử nghiệm
tools/                  Trích xuất, kiểm tra, cấu hình, bật/tắt
docs/                   Báo cáo chức năng và API
web/                    Giao diện tiếng Việt và dữ liệu mẫu tách biệt
ui/                     Máy chủ giao diện và proxy API cùng origin
tests/                  Kiểm tra dữ liệu mẫu, API adapter và UI server
.runtime/               Mật khẩu thử, PID và log cục bộ
```

Các lỗi nghiệp vụ/phân quyền của backend gốc được ghi nhận trong báo cáo. Các dịch vụ Timer/IP/DataFind/PayOS/Link còn thiếu vẫn cần bổ sung để vận hành thật; giao diện mẫu không thay thế các dịch vụ đó.
# PA03_Danhthiep
