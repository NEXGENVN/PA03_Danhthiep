# Yêu cầu chia sẻ số điện thoại

Mở http://127.0.0.1:13103/#phone-share hoặc chọn **Công cụ Zalo → Xin chia sẻ số điện thoại**.

1. Nhập tên người nhận/UID nếu cần ghi chú, mục đích xin số và hạn 24 giờ, 3 ngày hoặc 7 ngày.
2. Chọn **Tạo liên kết**, sao chép rồi tự gửi cho người nhận. Ứng dụng không tự gửi tin Zalo.
3. Người nhận mở trang riêng, đọc người yêu cầu và mục đích, tự nhập số rồi chọn ô đồng ý. Có thể từ chối mà không nhập số.
4. Người tạo chọn **Làm mới** để xem số đã được chia sẻ. Có tìm kiếm, lọc trạng thái, hủy yêu cầu đang chờ và xóa yêu cầu/kết quả.

Trong bước xem người nhận của **Gửi qua danh thiếp**, nút **Yêu cầu chia sẻ số điện thoại** chuyển tên và UID sang biểu mẫu này dưới dạng ghi chú. Không cần gửi ảnh để tạo yêu cầu.

## Phạm vi sử dụng

- **Xem mẫu:** mọi phản hồi lưu trong cùng trình duyệt. Chỉ dùng số giả. Khôi phục dữ liệu mẫu sẽ xóa cả yêu cầu này. Người nhận dùng máy/trình duyệt khác không mở được dữ liệu mẫu.
- **Backend:** đăng nhập bằng tài khoản PA03. Yêu cầu và phản hồi lưu tại `.runtime/phone-share.json`; chỉ tài khoản tạo yêu cầu xem được số, kể cả tài khoản quản trị khác cũng không xem được qua API này. Tệp này bị loại khỏi gói mã nguồn.
- Liên kết trên máy hiện tại là **localhost**, chỉ thử được trên máy này. Để người nhận bên ngoài mở, cần triển khai trang qua HTTPS và đặt `PHONE_SHARE_BASE_URL=https://ten-mien-cua-ban`. Thiết lập này chỉ đổi địa chỉ liên kết; không tự công khai máy chủ, mở cổng, tạo tunnel hoặc triển khai hosting.
- Máy chủ hiện vẫn chỉ lắng nghe `127.0.0.1`. Bản này phù hợp chạy cục bộ một tiến trình; triển khai nhiều tiến trình cần kho dữ liệu có cơ chế giao dịch.

## Ý nghĩa của kết quả

Số điện thoại do người phản hồi **tự khai, chưa xác minh OTP**. UID chỉ là ghi chú do người tạo nhập; chức năng không chứng minh số thuộc UID đó. Người có liên kết có thể chuyển tiếp hoặc phản hồi thay, nên chỉ gửi riêng cho người nhận. Không tự suy ra số điện thoại ẩn từ PARAMS/UID, không tự cập nhật danh bạ và không trừ ví.

Liên kết ngẫu nhiên dùng một lần; hạn mặc định 72 giờ. Sau khi chia sẻ/từ chối/hủy/hết hạn không nhận thêm phản hồi. Trang người nhận không hiển thị lại số đã gửi. Xóa yêu cầu sẽ xóa số và dữ liệu đồng ý gắn với yêu cầu đó; người nhận có thể liên hệ người tạo để đề nghị xóa.

## API bổ sung ở dịch vụ UI

| Phương thức | Đường dẫn | Quyền |
|---|---|---|
| GET | `/api/phone-share/requests` | Bearer, chỉ dữ liệu của người đăng nhập |
| POST | `/api/phone-share/requests` | Bearer, tạo yêu cầu từ mục đích và ghi chú |
| POST | `/api/phone-share/requests/:id/revoke` | Bearer, chủ yêu cầu đang chờ |
| DELETE | `/api/phone-share/requests/:id` | Bearer, chủ yêu cầu |
| POST | `/ui/phone-share/read` | Token liên kết trong JSON |
| POST | `/ui/phone-share/respond` | Token, `action=share` + `consent=true` + `phoneNumber`, hoặc `action=decline` |

Token nằm trong fragment `#…` của liên kết, không đặt trong query/path HTTP. API công khai chỉ trả thông tin tối thiểu về yêu cầu, không trả số điện thoại, UID, ID chủ tài khoản hay token. API có giới hạn tốc độ, độ dài và tối đa 200 yêu cầu mỗi chủ tài khoản. Các API mới ở dịch vụ UI; 110 route gateway gốc không thay đổi.

## Kiểm tra

`npm.cmd run test:ui` kiểm tra quyền, đồng ý, hết hạn, dùng một lần, lưu trữ, dữ liệu mẫu và giao diện trạng thái. `node tools/smoke-phone-share.cjs` chạy vòng đầy đủ trên backend cục bộ bằng số giả và xóa bản ghi thử. Không gọi dịch vụ Zalo hoặc gửi tin cho người thật.
