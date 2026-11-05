# Ma trận toàn bộ chức năng frontend PA03

Phân tích tĩnh đủ 8 module browser JavaScript; không có HTML/CSS để kiểm chứng giao diện. Vai trò dưới đây mô tả frontend; quyền thực thi phải đối chiếu gateway trong API-REFERENCE.md. Có 31 nhóm thao tác được khai báo, không đồng nghĩa tất cả chạy được.

## 1. Dashboard và điều hướng hub

Nguồn: `recovered/FRONTEND/dashboard.js:40`. Quyền/UI: người dùng đã đăng nhập.

- Đọc token/user từ localStorage; chuyển index.html khi chưa có token
- Lấy CSRF token, làm mới profile, chuyển nội dung Zalo/công cụ sang các tab
- Điều hướng Trang chủ, Zalo, Công cụ khác, Nạp tiền, Profile và ba hub admin
- Đăng xuất

API liên quan:

- `GET /api/auth/csrf-token`
- `GET /api/auth/profile`

- Giao diện dùng hàm global và inline onclick; không có framework hoặc bundler trong 8 tệp.
- Role 1 = Admin, role 3 = VIP; còn lại hiển thị User. Hub OA, Link, Leak có kiểm tra role 1 trong showPage.

## 2. Thông tin cá nhân / đổi mật khẩu

Nguồn: `recovered/FRONTEND/dashboard.js:1532`. Quyền/UI: người dùng đã đăng nhập.

- Xem username/email/vai trò/số dư/lần đăng nhập cuối
- Đổi mật khẩu và kiểm tra xác nhận khớp

Đầu vào: `currentPassword`, `newPassword`, `confirmPassword`.

API liên quan:

- `GET /api/auth/profile`
- `POST /api/auth/change-password`

## 3. Tài khoản Zalo của người dùng

Nguồn: `recovered/FRONTEND/dashboard.js:958`. Quyền/UI: người dùng đã đăng nhập.

- Liệt kê avatar, UID, tên, điện thoại, trạng thái
- Thêm tự động từ IMEI và cookie zpw_sek
- Có handler thêm thủ công
- Xóa tài khoản
- Kiểm tra một hoặc tất cả trạng thái

Đầu vào: `IMEI`, `COOKIE_ZPW_SEK`, `UID/displayName/phoneNumber/Avatar/ENCRYPTION_KEY (handler thủ công)`.

API liên quan:

- `GET /api/zalo-accounts`
- `POST /api/zalo-accounts`
- `POST /api/zalo-accounts/auto-fetch`
- `DELETE /api/zalo-accounts/{uid}`
- `POST /api/zalo-accounts/{uid}/check-status`
- `POST /api/zalo-accounts/check-all-status`

- Form do showAddZaloForm tạo chỉ nối handler tự động; handler thủ công cần HTML khác chưa được cung cấp.

## 4. Zalo: gửi ảnh theo số điện thoại / yêu cầu lấy IP

Nguồn: `recovered/FRONTEND/dashboard.js:1744`. Quyền/UI: Admin (1); VIP (3) theo ẩn tab lúc init.

- Bước 1 chọn tài khoản hoạt động và tìm người nhận
- Bước 2 xem người nhận/tài khoản gửi/phí/số dư rồi xác nhận
- Bước 3 hiển thị kết quả/phí; tải lại thống kê và lịch sử
- Chọn ảnh mặc định hoặc PNG tự tải; chọn IPv4/IPv6/cả hai và autoDelete
- Hẹn giờ ít nhất khoảng 5 phút trong tương lai

Đầu vào: `zaloUID`, `phoneNumber`, `imageType`, `ipType`, `autoDelete`, `isTimer`, `runTime`, `PNG tối đa 3 MB`.

API liên quan:

- `GET /api/send-image-v2/zalo-accounts`
- `POST /api/zalo/upload-custom-image`
- `POST /api/send-image-v2/search`
- `POST /api/send-image-v2/send`
- `POST /api/send-image-v2-timer/send`

- Tài khoản hệ thống hoặc tài khoản cá nhân có thể xuất hiện từ API.
- Chỉ mô tả tĩnh; không gửi tin hoặc truy cập tài khoản thực.

## 5. Zalo: gửi ảnh qua danh thiếp/PARAMS

Nguồn: `recovered/FRONTEND/dashboard.js:2076`. Quyền/UI: Admin (1); VIP (3) theo ẩn tab lúc init.

- Chọn tài khoản cá nhân hoạt động, giải mã FID/PARAMS và tìm người nhận
- Xem phí/người nhận rồi xác nhận gửi hoặc hẹn giờ
- Ảnh custom, loại IP, autoDelete và kết quả tương tự luồng số điện thoại

Đầu vào: `encryptedFid`, `zaloUID`, `imageType`, `ipType`, `autoDelete`, `isTimer`, `runTime`.

API liên quan:

- `GET /api/send-image-by-card/personal-accounts`
- `POST /api/zalo/upload-custom-image`
- `POST /api/send-image-by-card/decode-fid`
- `POST /api/send-image-by-card/send`
- `POST /api/send-image-by-card-timer/send`

## 6. Zalo: thống kê và lịch sử gửi

Nguồn: `recovered/FRONTEND/dashboard.js:1378`. Quyền/UI: người dùng đã đăng nhập.

- Tổng gửi/thành công/thất bại/lỗi
- Danh sách ngày, điện thoại, tên, phí, loại tài khoản, kết quả, chi tiết
- Phân trang 30 bản ghi

API liên quan:

- `GET /api/send-image/stats`
- `GET /api/send-image/history?page={page}&limit=30`

## 7. Zalo: lịch sử hẹn giờ

Nguồn: `recovered/FRONTEND/dashboard.js:1429`. Quyền/UI: người dùng đã đăng nhập.

- Xem thời gian tạo/chạy, mục tiêu, kết quả, trạng thái chờ/xử lý/thất bại/thành công
- Phân trang 30 bản ghi

API liên quan:

- `GET /api/zalo-timer/history?page={page}&limit=30`

- Không thấy chức năng hủy/sửa lịch ở frontend.

## 8. Zalo: tra last-online theo điện thoại

Nguồn: `recovered/FRONTEND/dashboard.js:3137`. Quyền/UI: người dùng đã đăng nhập; không có role guard riêng trong handler.

- Chọn tài khoản cá nhân hoặc SYSTEM
- Pre-check xem profile, phí và số dư
- Xác nhận trả phí, xem avatar/UID/last-online và cập nhật số dư

Đầu vào: `phoneNumber`, `zaloUID`, `type=phone`.

API liên quan:

- `GET /api/send-image-v2/zalo-accounts`
- `POST /api/check-status/pre-check`
- `POST /api/check-status/confirm`

## 9. Zalo: tra last-online theo danh thiếp

Nguồn: `recovered/FRONTEND/dashboard.js:3293`. Quyền/UI: người dùng đã đăng nhập; không có role guard riêng trong handler.

- Chọn tài khoản cá nhân, nhập PARAMS
- Pre-check giải mã và xem profile/phí
- Xác nhận trả phí và xem last-online

Đầu vào: `encryptedFid`, `zaloUID`, `type=card`.

API liên quan:

- `GET /api/send-image-v2/zalo-accounts`
- `POST /api/check-status/pre-check`
- `POST /api/check-status/confirm`

## 10. Công cụ khác: vị trí IP

Nguồn: `recovered/FRONTEND/dashboard.js:2397`. Quyền/UI: người dùng đã đăng nhập.

- Kiểm tra định dạng IP
- Xem kết quả từ nhiều nguồn, vùng/thành phố/quốc gia/ISP/tọa độ
- Nhúng mapUrl bằng iframe

Đầu vào: `ip (IPv4 hoặc IPv6)`.

API liên quan:

- `POST /api/check-ip/location`

## 11. Zalo: cửa hàng license

Nguồn: `recovered/FRONTEND/dashboard.js:2580`. Quyền/UI: người dùng đã đăng nhập.

- Xem sản phẩm và giá gói 1/5/10 lượt
- Làm mới số dư, xác nhận mua, hiển thị modal key và copy
- Xem license đã mua, lượt còn lại, giá/ngày mua/kích hoạt/trạng thái

Đầu vào: `productID`, `licenseType=1/2/3 (tương ứng 1/5/10 lượt)`.

API liên quan:

- `GET /api/licenses/products`
- `POST /api/licenses/purchase`
- `GET /api/licenses/my-licenses`
- `GET /api/auth/profile`

- Không thấy thao tác kích hoạt license từ dashboard; chỉ mua/xem/copy.

## 12. Nạp tiền PayOS: tạo và lịch sử

Nguồn: `recovered/FRONTEND/dashboard.js:2905`. Quyền/UI: người dùng đã đăng nhập.

- Tạo yêu cầu nạp từ 10.000 VND và hiển thị checkoutUrl
- Xem lịch sử chờ/thành công/hủy
- Tiếp tục thanh toán bằng cashLink hoặc hủy giao dịch chờ

Đầu vào: `amount`, `addInfo (hủy)`.

API liên quan:

- `POST /api/payos/create`
- `GET /api/payos/history`
- `POST /api/payos/cancel`

- Không có SDK PayOS phía trình duyệt hoặc polling tự cập nhật; nút mở link thanh toán do server cấp.

## 13. Tra cứu dữ liệu rò rỉ: điện thoại

Nguồn: `recovered/FRONTEND/dashboard_datafind.js:82`. Quyền/UI: Admin (1) ở hub.

- Chuẩn hóa số 0xxxxxxxxx sang 84xxxxxxxxx
- Xem phí/số dư, chặn confirm nếu không đủ tiền
- Xác nhận, cập nhật số dư nếu charged, hiển thị bản ghi theo nguồn và trường dữ liệu

Đầu vào: `type=phone`, `value`.

API liên quan:

- `POST /api/leak-lookup/pre-check`
- `POST /api/leak-lookup/confirm`

- Thông điệp UI nói chỉ tính phí khi tìm thấy dữ liệu.

## 14. Tra cứu dữ liệu rò rỉ: email

Nguồn: `recovered/FRONTEND/dashboard_datafind.js:82`. Quyền/UI: Admin (1) ở hub.

- Luồng ba bước nhập → phí/xác nhận → kết quả

Đầu vào: `type=email`, `value`.

API liên quan:

- `POST /api/leak-lookup/pre-check`
- `POST /api/leak-lookup/confirm`

## 15. Tra cứu dữ liệu rò rỉ: Facebook

Nguồn: `recovered/FRONTEND/dashboard_datafind.js:99`. Quyền/UI: Admin (1) ở hub.

- Nhận điện thoại, UID số hoặc URL
- URL được giải UID qua API; số 84xxxxxxxxx chuyển thành 0xxxxxxxxx
- Sau đó dùng luồng phí/xác nhận/kết quả chung

Đầu vào: `type=facebook`, `value`, `link (giải UID)`.

API liên quan:

- `POST /api/facebook/find-uid`
- `POST /api/leak-lookup/pre-check`
- `POST /api/leak-lookup/confirm`

## 16. Tra cứu dữ liệu rò rỉ: lịch sử

Nguồn: `recovered/FRONTEND/dashboard_datafind.js:307`. Quyền/UI: Admin (1) ở hub.

- Xem loại/từ khóa/số kết quả/phí/ngày
- Phân trang 30 bản ghi
- Xem lại resultsData trong modal

Đầu vào: `page`.

API liên quan:

- `GET /api/leak-lookup/history?page={page}&limit=30`

## 17. Link: trang mẫu

Nguồn: `recovered/FRONTEND/dashboard_link.js:61`. Quyền/UI: Admin (1) ở hub.

- Liệt kê/tạo/sửa/xóa mẫu
- Lấy metadata tiêu đề/thumbnail từ URL
- Upload thumbnail và preview

Đầu vào: `name`, `link`, `title`, `thumbnail`, `template_id`, `file thumbnail`.

API liên quan:

- `GET /api/link/templates`
- `POST /api/link/templates`
- `PUT /api/link/templates/{id}`
- `DELETE /api/link/templates/{id}`
- `POST /api/link/fetch-meta`
- `POST /api/link/upload-thumbnail`

- Thông báo xóa mẫu cho biết xóa cả các link liên quan.

## 18. Link: danh sách/tạo/sửa

Nguồn: `recovered/FRONTEND/dashboard_link.js:253`. Quyền/UI: Admin (1) ở hub.

- Tạo từ mẫu và domain, gợi ý domain theo facebook/tiktok/baomoi
- Xem/copy URL đầy đủ và rút gọn
- Sửa tên và chế độ vị trí

Đầu vào: `name`, `template_id`, `domain_id`, `location_type`.

API liên quan:

- `GET /api/link/links`
- `POST /api/link/links`
- `PUT /api/link/links/{id}`
- `GET /api/link/templates`
- `GET /api/link/domains`

- location_type: 0 không lấy vị trí, 1 chỉ lấy vị trí, 2 kèm giải thích, 3 phải cấp quyền mới tải nội dung.
- Không có nút xóa link riêng; comment cũ nói không sửa nhưng mã hiện có sửa.

## 19. Link: quản lý domain

Nguồn: `recovered/FRONTEND/dashboard_link.js:510`. Quyền/UI: Admin (1) ở hub.

- Xem/tạo/sửa/xóa domain và chi tiết

Đầu vào: `domain`, `detail`.

API liên quan:

- `GET /api/link/domains`
- `POST /api/link/domains`
- `PUT /api/link/domains/{id}`
- `DELETE /api/link/domains/{id}`

## 20. Link: kết quả và kết quả thumbnail

Nguồn: `recovered/FRONTEND/dashboard_link.js:649`. Quyền/UI: Admin (1) ở hub.

- Hai tab kết quả riêng
- Lọc tại client theo ID/tên link
- Xem kết quả dạng text và ngày tạo

Đầu vào: `từ khóa lọc`.

API liên quan:

- `GET /api/link/results`
- `GET /api/link/results-thumbnail`

## 21. Zalo OA: token

Nguồn: `recovered/FRONTEND/dashboard_zalo_oa.js:81`. Quyền/UI: Admin (1) ở hub.

- Xem hạn token và một phần refresh token
- Nhập refresh token hoặc để trống để dùng token DB
- Tự refresh khi chuyển tab nếu token hết hạn hoặc còn dưới 60 giây

Đầu vào: `refresh_token`.

API liên quan:

- `GET /api/zalo-oa/token`
- `POST /api/zalo-oa/token/refresh`

## 22. Zalo OA: mẫu tin

Nguồn: `recovered/FRONTEND/dashboard_zalo_oa.js:166`. Quyền/UI: Admin (1) ở hub.

- Tạo/sửa/xóa template
- Tự lấy template mới, chọn nhiều dòng, nhập chi tiết và lưu từng template

Đầu vào: `template_id`, `detail`, `params (CSV)`.

API liên quan:

- `GET /api/zalo-oa/templates`
- `POST /api/zalo-oa/templates`
- `PUT /api/zalo-oa/templates/{id}`
- `DELETE /api/zalo-oa/templates/{id}`
- `GET /api/zalo-oa/fetch-new-templates`

## 23. Zalo OA: gửi theo điện thoại

Nguồn: `recovered/FRONTEND/dashboard_zalo_oa.js:511`. Quyền/UI: Admin (1) ở hub.

- Chọn IPv4/IPv6/cả hai; lọc template theo chuỗi v4/v6 trong detail
- Tạo form động từ params, lấy preview cho date/order_code/price/phone_number
- Nhập trường custom, xác nhận gửi, xem kết quả

Đầu vào: `phone_number`, `template_id (chuỗi hoặc mảng)`, `custom_params`.

API liên quan:

- `GET /api/zalo-oa/templates`
- `GET /api/zalo-oa/preview-data`
- `POST /api/zalo-oa/send-template`

## 24. Zalo OA: gửi theo UID

Nguồn: `recovered/FRONTEND/dashboard_zalo_oa.js:868`. Quyền/UI: Admin (1) ở hub.

- Luồng tương tự điện thoại; phone_number trong params phải tự nhập nếu cần

Đầu vào: `user_id`, `template_id (chuỗi hoặc mảng)`, `custom_params`.

API liên quan:

- `GET /api/zalo-oa/templates`
- `GET /api/zalo-oa/preview-data`
- `POST /api/zalo-oa/send-template-uid`

## 25. Zalo OA: kết quả gửi / trạng thái

Nguồn: `recovered/FRONTEND/dashboard_zalo_oa.js:269`. Quyền/UI: Admin (1) ở hub.

- Xem order_code, điện thoại hoặc UID, template, message status, kết quả và chi tiết
- Cập nhật status từng message

Đầu vào: `message_id`, `phone`, `id`.

API liên quan:

- `GET /api/zalo-oa/results`
- `GET /api/zalo-oa/message-status?message_id={msgId}&phone={phone}&id={id}`

## 26. Admin: người dùng và thống kê

Nguồn: `recovered/FRONTEND/admin-dashboard.js:146`. Quyền/UI: admin_token/admin_user được đọc; không kiểm role 1 ngay trong checkAuth.

- Thống kê tổng/active/admin
- Tìm theo tên/email/ID
- Tạo/sửa/xóa người dùng
- Ẩn nút tự xóa

Đầu vào: `userName`, `email`, `password`, `totalMoney`, `userRole`, `isActive`.

API liên quan:

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/{id}`
- `DELETE /api/admin/users/{id}`

## 27. Admin: chặn IP

Nguồn: `recovered/FRONTEND/admin-dashboard.js:428`. Quyền/UI: admin session.

- Xem/lọc IP block và số login/api/both
- Chặn IP theo loại, lý do, thời lượng
- Gỡ chặn

Đầu vào: `ipAddress`, `blockType=login/api/both`, `reason`, `blockMinutes`.

API liên quan:

- `GET /api/admin/ip-blocks`
- `POST /api/admin/ip-blocks`
- `DELETE /api/admin/ip-blocks/{ip}`

## 28. Admin: Zalo hệ thống và phí

Nguồn: `recovered/FRONTEND/admin-zalo.js:128`. Quyền/UI: admin_token/admin_user được đọc; không kiểm role 1 ngay trong checkAuth.

- Xem toàn bộ tài khoản Zalo hệ thống
- Chọn UID hệ thống và sửa năm mức phí gửi/check status
- Xem/lọc auto requests; đếm thành công/thất bại và doanh thu

Đầu vào: `uid_zalo_system`, `zalo_system_money`, `zalo_custom_money`, `check_phone_system_money`, `check_phone_custom_money`, `check_card_money`.

API liên quan:

- `GET /api/admin/zalo-accounts`
- `GET /api/admin/tool-setup`
- `PUT /api/admin/tool-setup`
- `GET /api/admin/requests`

## 29. Admin: sản phẩm

Nguồn: `recovered/FRONTEND/admin-products.js:168`. Quyền/UI: Admin (1) theo init.

- Liệt kê/tạo/sửa/xóa sản phẩm và giá 1/5/10 lượt; bật/tắt sản phẩm

Đầu vào: `productName`, `productDesc`, `productOnePrice`, `productFivePrice`, `productTenPrice`, `productImage`, `isActive`.

API liên quan:

- `GET /api/admin/products`
- `GET /api/admin/products/{id}`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`

- Thông báo UI cho biết xóa sản phẩm đã có license mua chỉ vô hiệu hóa.

## 30. Admin: license

Nguồn: `recovered/FRONTEND/admin-products.js:352`. Quyền/UI: Admin (1) theo init.

- Lọc theo sản phẩm, trạng thái, username; phân trang 20
- Xem/copy key và chi tiết
- Tăng lượt dùng
- Vô hiệu hóa với lý do

Đầu vào: `productID`, `status`, `userName`, `count`, `reason`.

API liên quan:

- `GET /api/admin/licenses?page={page}&limit=20&productID={id}&status={status}&userName={name}`
- `GET /api/admin/licenses/{key}`
- `POST /api/admin/licenses/{key}/extend`
- `POST /api/admin/licenses/{key}/revoke`

## 31. Admin: cấu hình phí và lịch sử tra cứu rò rỉ

Nguồn: `recovered/FRONTEND/admin-dataleak.js:137`. Quyền/UI: có admin_token; không có role check phía client.

- Sửa phí tra cứu
- Xem lịch sử toàn hệ thống, phân trang 20
- Xem resultsData JSON trong modal
- Tổng lượt, doanh thu server trả, số kết quả trung bình trên trang hiện tại

Đầu vào: `check_data_leak_money`, `page`.

API liên quan:

- `GET /api/admin/tool-setup`
- `PUT /api/admin/tool-setup`
- `GET /api/admin/leak-history?page={page}&limit=20`

## Điều kiện hiển thị còn thiếu

Cần tài liệu HTML có đúng DOM ID/container, CSS, các trang đăng nhập và assets. Dashboard dùng các module classic script chung globals; không ghép tất cả admin scripts lên cùng một trang vì trùng tên biến/hàm. Flatpickr/SweetAlert2 và tài nguyên giao diện chưa được cung cấp. Danh sách DOM ID, hàm và endpoint theo từng tệp nằm trong analysis/frontend-findings.json.
