# Danh mục vấn đề kỹ thuật PA03

Đây là kết quả review mã gốc, không phải danh sách đã sửa. Các nhóm có thể trùng nguyên nhân. high/P1 là ưu tiên cao theo reviewer, medium/P2 là lỗi quan trọng, low/P3 là mức thấp; blocker chỉ thành phần ngăn khởi động khi chưa cấu hình. Các rủi ro khai thác phụ thuộc cấu hình và đường hiển thị thực tế. Các đánh giá tĩnh không đồng nghĩa đã thực hiện khai thác.

Bằng chứng runtime: token CSRF ngắn trả 500 và role 2 gọi tìm kiếm log admin trả 200. Không chạy thử đọc/ghi vượt thư mục hoặc xóa log. Xem analysis/runtime-verification.json.

## MAIN_SERVER — 29 ghi nhận

| Mã | Mức | Vấn đề | Vị trí nguồn |
|---|---|---|---|
| MAIN-001 | high | Nhánh nhật ký quản trị không kiểm tra quyền Admin | recovered/MAIN_SERVER/main_server.js:157; recovered/MAIN_SERVER/routes/logsRoutes.js:37; recovered/MAIN_SERVER/routes/logsRoutes.js:40; recovered/MAIN_SERVER/controllers/logsController.js:392 |
| MAIN-002 | high | Hàm nhật ký hiểu sai kiểu trả về db.query; cleanup có thể xóa xong mới lỗi | recovered/MAIN_SERVER/config/database.js:45; recovered/MAIN_SERVER/middleware/apiLogger.js:368; recovered/MAIN_SERVER/middleware/apiLogger.js:450; recovered/MAIN_SERVER/middleware/apiLogger.js:468; recovered/MAIN_SERVER/controllers/logsController.js:97; recovered/MAIN_SERVER/controllers/logsController.js:357 |
| MAIN-003 | high | CAPTCHA lộ ký tự đáp án trong SVG có thể đọc bằng chương trình | recovered/MAIN_SERVER/controllers/captchaController.js:234; recovered/MAIN_SERVER/controllers/captchaController.js:265; recovered/MAIN_SERVER/controllers/captchaController.js:407 |
| MAIN-004 | high | Tin header IP do client gửi mà chưa xác minh reverse proxy | recovered/MAIN_SERVER/controllers/captchaController.js:342; recovered/MAIN_SERVER/middleware/csrf.js:21; recovered/MAIN_SERVER/middleware/apiLogger.js:14; recovered/MAIN_SERVER/main_server.js:50 |
| MAIN-005 | high | Đổi mật khẩu ghi cả mật khẩu hiện tại và mới ra log | recovered/MAIN_SERVER/controllers/authController.js:376; recovered/MAIN_SERVER/utils/sanitize.js:168; recovered/MAIN_SERVER/middleware/apiLogger.js:45 |
| MAIN-006 | medium | CSRF sai độ dài gây HTTP 500 | recovered/MAIN_SERVER/middleware/csrf.js:136; recovered/MAIN_SERVER/main_server.js:191 |
| MAIN-007 | medium | CSRF RAM một token mỗi user/IP gây xung đột nhiều tab hoặc nhiều instance | recovered/MAIN_SERVER/middleware/csrf.js:10; recovered/MAIN_SERVER/middleware/csrf.js:47; recovered/MAIN_SERVER/middleware/csrf.js:164 |
| MAIN-008 | medium | Các trường kết quả CSRF và session trong audit không được ghi đúng | recovered/MAIN_SERVER/main_server.js:126; recovered/MAIN_SERVER/middleware/apiLogger.js:229; recovered/MAIN_SERVER/middleware/apiLogger.js:220; recovered/MAIN_SERVER/middleware/auth.js:49 |
| MAIN-009 | medium | Audit bỏ sót nhiều lần xác thực hoặc rate-limit bị từ chối | recovered/MAIN_SERVER/main_server.js:118; recovered/MAIN_SERVER/main_server.js:150; recovered/MAIN_SERVER/main_server.js:127; recovered/MAIN_SERVER/main_server.js:95 |
| MAIN-010 | medium | Audit làm mất prefix API trong đường dẫn request | recovered/MAIN_SERVER/middleware/apiLogger.js:212; recovered/MAIN_SERVER/middleware/apiLogger.js:75; recovered/MAIN_SERVER/main_server.js:153 |
| MAIN-011 | medium | CAPTCHA chưa ràng buộc IP và chưa tiêu thụ một lần nguyên tử | recovered/MAIN_SERVER/controllers/captchaController.js:473; recovered/MAIN_SERVER/controllers/captchaController.js:489; recovered/MAIN_SERVER/controllers/captchaController.js:534 |
| MAIN-012 | medium | Log CAPTCHA in đáp án và dữ liệu xác minh trong mọi môi trường | recovered/MAIN_SERVER/controllers/captchaController.js:376; recovered/MAIN_SERVER/controllers/captchaController.js:477 |
| MAIN-013 | blocker | Đọc biến môi trường bắt buộc trước khi xác thực cấu hình | recovered/MAIN_SERVER/main_server.js:37; recovered/MAIN_SERVER/config/database.js:12; recovered/MAIN_SERVER/middleware/rateLimiter.js:13 |
| MAIN-014 | medium | Thiếu readiness phụ thuộc và khởi tạo schema cốt lõi | recovered/MAIN_SERVER/main_server.js:108; recovered/MAIN_SERVER/main_server.js:210; recovered/MAIN_SERVER/config/database.js:56; recovered/MAIN_SERVER/config/database.js:116 |
| MAIN-015 | medium | Kiểm tra tự cập nhật Admin sai khi khác kiểu hoặc bỏ trường | recovered/MAIN_SERVER/controllers/adminController.js:354; recovered/MAIN_SERVER/controllers/adminController.js:362; recovered/MAIN_SERVER/controllers/adminController.js:421 |
| MAIN-016 | medium | Tăng lượt license có thể nối chuỗi và mất cập nhật đồng thời | recovered/MAIN_SERVER/controllers/adminProductController.js:641; recovered/MAIN_SERVER/controllers/adminProductController.js:665; recovered/MAIN_SERVER/controllers/adminProductController.js:670 |
| MAIN-017 | medium | Thống kê sản phẩm dùng các cột license không nhất quán | recovered/MAIN_SERVER/controllers/adminProductController.js:405; recovered/MAIN_SERVER/controllers/adminProductController.js:406; recovered/MAIN_SERVER/controllers/adminProductController.js:407; recovered/MAIN_SERVER/controllers/adminProductController.js:752 |
| MAIN-018 | medium | Thao tác xóa nhiều bước không dùng transaction | recovered/MAIN_SERVER/controllers/adminProductController.js:716; recovered/MAIN_SERVER/controllers/adminProductController.js:719; recovered/MAIN_SERVER/controllers/adminProductController.js:355; recovered/MAIN_SERVER/config/database.js:73 |
| MAIN-019 | medium | Rate limit toàn cục bỏ qua toàn bộ auth/admin | recovered/MAIN_SERVER/middleware/rateLimiter.js:20; recovered/MAIN_SERVER/routes/authRoutes.js:14; recovered/MAIN_SERVER/routes/authRoutes.js:19; recovered/MAIN_SERVER/routes/captchaRoutes.js:17 |
| MAIN-020 | medium | Đổi mật khẩu không thu hồi JWT đang tồn tại | recovered/MAIN_SERVER/middleware/auth.js:26; recovered/MAIN_SERVER/middleware/auth.js:30; recovered/MAIN_SERVER/controllers/authController.js:423; recovered/MAIN_SERVER/controllers/adminController.js:205 |
| MAIN-021 | medium | Xác thực đầu vào tài khoản và thông tin đăng nhập chưa đầy đủ | recovered/MAIN_SERVER/controllers/authController.js:51; recovered/MAIN_SERVER/controllers/authController.js:387; recovered/MAIN_SERVER/controllers/adminController.js:573 |
| MAIN-022 | medium | Lịch sử leak gửi mảng vào một placeholder prepared statement | recovered/MAIN_SERVER/controllers/adminController.js:1134; recovered/MAIN_SERVER/config/database.js:44 |
| MAIN-023 | medium | Proxy PayOS không đặt timeout | recovered/MAIN_SERVER/routes/payosProxyRoutes.js:20; recovered/MAIN_SERVER/routes/payosProxyRoutes.js:24; recovered/MAIN_SERVER/routes/payosProxyRoutes.js:51 |
| MAIN-024 | medium | Thumbnail proxy nạp file vào RAM mà không giới hạn dung lượng | recovered/MAIN_SERVER/routes/linkProxyRoutes.js:68; recovered/MAIN_SERVER/routes/uploadProxyRoutes.js:23 |
| MAIN-025 | medium | Upload proxy không chuyển khóa xác thực nội bộ | recovered/MAIN_SERVER/routes/uploadProxyRoutes.js:55; recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:33 |
| MAIN-026 | medium | Phân trang và thời hạn giữ log chưa giới hạn hợp lý | recovered/MAIN_SERVER/controllers/logsController.js:394; recovered/MAIN_SERVER/middleware/apiLogger.js:465; recovered/MAIN_SERVER/controllers/adminProductController.js:465 |
| MAIN-027 | low | Khởi tạo cấu hình thay giá 0 bằng mặc định | recovered/MAIN_SERVER/controllers/adminController.js:796; recovered/MAIN_SERVER/controllers/adminController.js:801 |
| MAIN-028 | medium | Kiểm CAPTCHA và chặn IP có nhánh cho qua khi database lỗi | recovered/MAIN_SERVER/controllers/captchaController.js:457; recovered/MAIN_SERVER/controllers/captchaController.js:672; recovered/MAIN_SERVER/controllers/captchaController.js:565 |
| MAIN-029 | high | Đường timer tổng quát có thể bỏ cổng VIP cho lịch danh thiếp | recovered/MAIN_SERVER/main_server.js:137; recovered/MAIN_SERVER/main_server.js:138; recovered/MAIN_SERVER/routes/zaloTimerProxyRoutes.js:61 |

## Frontend — 20 ghi nhận

| Mã | Mức | Vấn đề | Vị trí nguồn |
|---|---|---|---|
| FE-01 | P2 | Biến select ngoài phạm vi khi không có Zalo cá nhân hoạt động | recovered/FRONTEND/dashboard.js:2033; recovered/FRONTEND/dashboard.js:2016 |
| FE-02 | P2 | Hủy nạp tiền gọi sai chữ ký showAlert | recovered/FRONTEND/dashboard.js:2962; recovered/FRONTEND/dashboard.js:348; recovered/FRONTEND/dashboard.js:2969 |
| FE-03 | P2 | Đọc body response hai lần với 403 không phải CSRF | recovered/FRONTEND/dashboard.js:735; recovered/FRONTEND/admin-products.js:135; recovered/FRONTEND/admin-dataleak.js:78 |
| FE-04 | P2 | Lần đầu mở OA gửi UID tải dropdown của tab điện thoại | recovered/FRONTEND/dashboard_zalo_oa.js:754; recovered/FRONTEND/dashboard_zalo_oa.js:396 |
| FE-05 | P1 | Dữ liệu tra cứu được chèn vào innerHTML chưa escape | recovered/FRONTEND/dashboard_datafind.js:283; recovered/FRONTEND/dashboard_datafind.js:295; recovered/FRONTEND/dashboard_datafind.js:345 |
| FE-06 | P1 | Nhiều bảng/template/modal khác nội suy API vào HTML và thuộc tính | recovered/FRONTEND/dashboard_link.js:85; recovered/FRONTEND/dashboard_link.js:87; recovered/FRONTEND/dashboard_zalo_oa.js:182; recovered/FRONTEND/dashboard.js:999; recovered/FRONTEND/admin-products.js:207; recovered/FRONTEND/admin-dashboard.js:462 |
| FE-07 | P2 | Log cookie xác thực Zalo vào console | recovered/FRONTEND/dashboard.js:1107 |
| FE-08 | P2 | Cập nhật sai thuộc tính số dư sau gửi ảnh danh thiếp | recovered/FRONTEND/dashboard.js:2282 |
| FE-09 | P2 | Gửi ảnh theo điện thoại không đồng bộ currentUser.totalMoney | recovered/FRONTEND/dashboard.js:1943 |
| FE-10 | P2 | Phụ thuộc biến event global trong handler async | recovered/FRONTEND/dashboard_link.js:129; recovered/FRONTEND/dashboard_link.js:318; recovered/FRONTEND/dashboard_link.js:464; recovered/FRONTEND/dashboard_zalo_oa.js:613; recovered/FRONTEND/dashboard_zalo_oa.js:688 |
| FE-11 | P2 | Parse thời gian hẹn giờ chưa xử lý chuỗi sai | recovered/FRONTEND/dashboard.js:158 |
| FE-12 | P2 | Giá trị phí bằng 0 bị thay thành giá mặc định | recovered/FRONTEND/admin-dataleak.js:103; recovered/FRONTEND/admin-zalo.js:244 |
| FE-13 | P2 | Kiểm tra số tiền chấp nhận giá âm/NaN ở một số form | recovered/FRONTEND/admin-products.js:292; recovered/FRONTEND/admin-zalo.js:294; recovered/FRONTEND/admin-dataleak.js:113 |
| FE-14 | P2 | Không thoát bootstrap admin sau redirect khi thiếu session | recovered/FRONTEND/admin-dashboard.js:42; recovered/FRONTEND/admin-zalo.js:41 |
| FE-15 | P2 | Dashboard có token nhưng thiếu/hỏng user làm init lỗi | recovered/FRONTEND/dashboard.js:48 |
| FE-16 | P2 | Kiểm tra trạng thái và tải dropdown chạy đồng thời | recovered/FRONTEND/dashboard.js:238; recovered/FRONTEND/dashboard.js:242 |
| FE-17 | P2 | UID và số điện thoại OA dùng chung nút update status nhưng chỉ truyền phone_number | recovered/FRONTEND/dashboard_zalo_oa.js:323 |
| FE-18 | P2 | So sánh template_id chặt với giá trị select dạng chuỗi | recovered/FRONTEND/dashboard_zalo_oa.js:460 |
| FE-19 | P3 | Số lượt license còn lại bằng 0 bị hiển thị dấu gạch | recovered/FRONTEND/dashboard.js:2829 |
| FE-20 | P3 | Regex IPv4 không kiểm tra dải octet | recovered/FRONTEND/dashboard.js:2406 |

## ZL_SERVER và FILES_SERVER — 20 ghi nhận

| Mã | Mức | Vấn đề | Vị trí nguồn |
|---|---|---|---|
| ZL-01 | high | Khóa nội bộ để trống có thể khiến middleware cho qua | recovered/ZL_SERVER/middleware/ipWhitelist.js:22; recovered/ZL_SERVER/zl_server.js:29; recovered/ZL_SERVER/middleware/trustMiddleware.js:8 |
| FILES-01 | high | Đường dẫn nhận từ request có thể đọc ra ngoài thư mục files | recovered/FILES_SERVER/files_server.js:334; recovered/FILES_SERVER/files_server.js:451; recovered/FILES_SERVER/files_server.js:37 |
| FILES-02 | high | Upload chưa xác thực, tên tệp do client điều khiển có thể ghi vượt thư mục | recovered/FILES_SERVER/files_server.js:55; recovered/FILES_SERVER/files_server.js:90; recovered/FILES_SERVER/files_server.js:67; recovered/FILES_SERVER/files_server.js:103 |
| ZL-02 | high | Hàm che log không che đúng IMEI, khóa mã hóa và cookie Zalo | recovered/ZL_SERVER/utils/sanitize.js:164; analysis/readable/ZL_SERVER/controllers/zaloAccountController.js:99; analysis/readable/ZL_SERVER/controllers/zaloAccountController.js:153 |
| ZL-03 | high | Token, template và kết quả OA toàn cục; worker không chia quyền theo user | analysis/readable/ZL_SERVER/controllers/zaloOaController.js:4; analysis/readable/ZL_SERVER/controllers/zaloOaController.js:58; analysis/readable/ZL_SERVER/controllers/zaloOaController.js:149; recovered/ZL_SERVER/routes/zaloOaRoutes.js:6 |
| ZL-04 | high | licenseType dạng chuỗi có thể bị tính tiền nhưng tạo 0 lượt | analysis/readable/ZL_SERVER/controllers/licenseController.js:62; analysis/readable/ZL_SERVER/controllers/licenseController.js:79; analysis/readable/ZL_SERVER/controllers/licenseController.js:124; analysis/readable/ZL_SERVER/controllers/licenseController.js:148 |
| ZL-05 | medium | Phụ phí ảnh tùy chọn có thể nối chuỗi DECIMAL thay vì cộng số | analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:292; analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:387; analysis/readable/ZL_SERVER/controllers/sendImageByCardController.js:278; recovered/ZL_SERVER/config/database.js:12 |
| ZL-06 | medium | Gửi tin và tải ảnh có thể chạy trước khi transaction tracking commit | analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:379; analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:441; analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:457; analysis/readable/ZL_SERVER/controllers/sendImageByCardController.js:412; recovered/FILES_SERVER/files_server.js:280 |
| FILES-03 | medium | Thuộc tính tracking có thể giả mạo và được lưu thành HTML chưa escape | recovered/FILES_SERVER/files_server.js:247; recovered/FILES_SERVER/files_server.js:283; recovered/FILES_SERVER/files_server.js:451; recovered/FILES_SERVER/files_server.js:500 |
| FILES-04 | medium | Nhiều lượt tải đồng thời có thể ghi đè nhau; thiếu hạn chế thông báo/log | recovered/FILES_SERVER/files_server.js:198; recovered/FILES_SERVER/files_server.js:208; recovered/FILES_SERVER/files_server.js:239; recovered/FILES_SERVER/files_server.js:259; recovered/FILES_SERVER/files_server.js:523 |
| ZL-07 | medium | Lấy DB connection ngoài try khiến async error không được xử lý đúng | analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:355; analysis/readable/ZL_SERVER/controllers/sendImageByCardController.js:342 |
| ZL-08 | medium | API gửi cũ bỏ luồng thu phí V2 và dùng trạng thái khác query thống kê | analysis/readable/ZL_SERVER/controllers/sendImageController.js:170; analysis/readable/ZL_SERVER/controllers/sendImageController.js:234; analysis/readable/ZL_SERVER/controllers/sendImageController.js:271; analysis/readable/ZL_SERVER/controllers/sendImageController.js:349 |
| ZL-09 | medium | Mã đơn OA và thay token chưa nguyên tử | analysis/readable/ZL_SERVER/controllers/zaloOaController.js:174; analysis/readable/ZL_SERVER/controllers/zaloOaController.js:285; analysis/readable/ZL_SERVER/controllers/zaloOaController.js:58 |
| ZL-10 | medium | Pre-check trả dữ liệu trước thu phí, confirm thiếu ràng buộc và chống lặp | analysis/readable/ZL_SERVER/controllers/checkStatusController.js:219; analysis/readable/ZL_SERVER/controllers/checkStatusController.js:260; analysis/readable/ZL_SERVER/controllers/checkStatusController.js:280; analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:329; analysis/readable/ZL_SERVER/controllers/sendImageByCardController.js:326 |
| ZL-11 | low | Một số rate-limit/CSRF mô tả trong comment không được gắn vào worker | recovered/ZL_SERVER/routes/sendImageV2Routes.js:24; recovered/ZL_SERVER/routes/sendImageByCardRoutes.js:24; recovered/ZL_SERVER/routes/checkIpRoutes.js:6 |
| ZL-12 | low | Kiểm tra đầu vào, IP, phân trang và cấu hình ảnh chưa đầy đủ | recovered/ZL_SERVER/middleware/trustMiddleware.js:21; analysis/readable/ZL_SERVER/controllers/sendImageController.js:309; analysis/readable/ZL_SERVER/controllers/checkIpController.js:13; analysis/readable/ZL_SERVER/controllers/sendImageV2Controller.js:439; recovered/ZL_SERVER/zl_server.js:103 |
| FILES-05 | medium | Thiếu env hoặc lỗi read-stream có thể làm FILES dừng | recovered/FILES_SERVER/files_server.js:28; recovered/FILES_SERVER/files_server.js:552; recovered/FILES_SERVER/files_server.js:371 |
| ZL-DORMANT-01 | medium | Module logs dự phòng cũng sai kiểu kết quả db.query | analysis/readable/ZL_SERVER/controllers/logsController.js:62; analysis/readable/ZL_SERVER/controllers/logsController.js:63; analysis/readable/ZL_SERVER/controllers/logsController.js:132; recovered/ZL_SERVER/config/database.js:45 |
| ZL-DORMANT-02 | low | Thống kê license dự phòng dùng cột không nhất quán | analysis/readable/ZL_SERVER/controllers/adminProductController.js:205; analysis/readable/ZL_SERVER/controllers/licenseController.js:128; analysis/readable/ZL_SERVER/controllers/licenseController.js:148 |
| ZL-DORMANT-03 | low | CAPTCHA dự phòng in đáp án rõ trong log | analysis/readable/ZL_SERVER/controllers/captchaController.js:30; analysis/readable/ZL_SERVER/controllers/captchaController.js:190 |

## Cách đọc bằng chứng

Nguồn ZL bị làm rối nằm một dòng dài; vị trí analysis/readable/... là bản sao giải mã tĩnh để đọc. Nguồn runtime vẫn ở recovered/. Các mục ZL-DORMANT chỉ module không mount, không phải lỗ hổng API hoạt động hiện tại. MAIN có thể đã chặn quyền một route mà worker không chặn; vì vậy vấn đề OA được mô tả ở ranh giới worker, không kết luận user thường đã qua được gateway OA.

Chi tiết điều kiện, tác động, mức chắc chắn và hướng sửa: analysis/main-findings.json, analysis/frontend-findings.json, analysis/zalo-findings.json. Schema suy ra có thể làm phép tính chuỗi DECIMAL xuất hiện đúng như cảnh báo; các phép tính phí thật chưa nằm trong smoke đọc dữ liệu trống.
