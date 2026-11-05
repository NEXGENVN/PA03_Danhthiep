# Tham chiếu API gateway PA03

110 tổ hợp method/path được mount bởi MAIN_SERVER. Danh sách dựa trên code; endpoint proxy vẫn tồn tại khi upstream bị thiếu nhưng không thực hiện được nghiệp vụ. Base URL local: `http://127.0.0.1:13100`. Auth dùng Bearer JWT; CSRF dùng header `x-csrf-token`.

| Method | Path | Quyền hiện tại trong mã | CSRF | Nơi thực thi | Vị trí khai báo |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | Công khai | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/authRoutes.js:14` |
| POST | `/api/auth/login` | Công khai | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/authRoutes.js:15` |
| GET | `/api/auth/profile` | User đang hoạt động đã đăng nhập | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/authRoutes.js:18` |
| POST | `/api/auth/change-password` | User đang hoạt động đã đăng nhập | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/authRoutes.js:19` |
| GET | `/api/auth/csrf-token` | User đang hoạt động đã đăng nhập | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/authRoutes.js:22` |
| GET | `/api/captcha/generate` | Công khai | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/captchaRoutes.js:36` |
| GET | `/api/captcha/check-required` | Công khai | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/captchaRoutes.js:44` |
| GET | `/api/admin/users` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:26` |
| GET | `/api/admin/users/:userID` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:32` |
| POST | `/api/admin/users` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:38` |
| PUT | `/api/admin/users/:userID` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:44` |
| DELETE | `/api/admin/users/:userID` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:50` |
| GET | `/api/admin/stats` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:56` |
| GET | `/api/admin/tool-setup` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:62` |
| PUT | `/api/admin/tool-setup` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:68` |
| GET | `/api/admin/zalo-accounts` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:78` |
| GET | `/api/admin/ip-blocks` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:88` |
| POST | `/api/admin/ip-blocks` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:95` |
| DELETE | `/api/admin/ip-blocks/:ipAddress` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:101` |
| GET | `/api/admin/requests` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:111` |
| GET | `/api/admin/leak-history` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminRoutes.js:121` |
| GET | `/api/admin/products` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:15` |
| GET | `/api/admin/products/stats` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:18` |
| GET | `/api/admin/products/:productID` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:21` |
| POST | `/api/admin/products` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:24` |
| PUT | `/api/admin/products/:productID` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:27` |
| DELETE | `/api/admin/products/:productID` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:30` |
| GET | `/api/admin/licenses` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:37` |
| GET | `/api/admin/licenses/stats` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:40` |
| GET | `/api/admin/licenses/:licenseKey` | Admin (1) | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:43` |
| POST | `/api/admin/licenses/:licenseKey/revoke` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:46` |
| POST | `/api/admin/licenses/:licenseKey/extend` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:49` |
| DELETE | `/api/admin/licenses/:licenseKey` | Admin (1) | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/adminProductRoutes.js:52` |
| GET | `/api/logs` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:15` |
| GET | `/api/logs/stats` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:18` |
| GET | `/api/logs/admin/all` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:25` |
| GET | `/api/logs/admin/user/:userID` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:28` |
| GET | `/api/logs/admin/security` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:31` |
| GET | `/api/logs/admin/system-stats` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:34` |
| GET | `/api/logs/admin/search` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Không | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:37` |
| POST | `/api/logs/admin/cleanup` | User đã đăng nhập; nhánh admin thiếu kiểm quyền | Có | MAIN nội bộ | `recovered/MAIN_SERVER/routes/logsRoutes.js:40` |
| GET | `/api/zalo-accounts` | User đang hoạt động đã đăng nhập | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:60` |
| GET | `/api/zalo-accounts/:uid` | User đang hoạt động đã đăng nhập | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:61` |
| POST | `/api/zalo-accounts` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:62` |
| POST | `/api/zalo-accounts/auto-fetch` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:63` |
| PUT | `/api/zalo-accounts/:uid` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:64` |
| DELETE | `/api/zalo-accounts/:uid` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:65` |
| POST | `/api/zalo-accounts/:uid/check-status` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:66` |
| POST | `/api/zalo-accounts/check-all-status` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloAccountProxyRoutes.js:67` |
| GET | `/api/zalo-oa/token` | Admin (1) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:29` |
| POST | `/api/zalo-oa/token/refresh` | Admin (1) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:30` |
| GET | `/api/zalo-oa/templates` | Admin (1) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:33` |
| POST | `/api/zalo-oa/templates` | Admin (1) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:34` |
| PUT | `/api/zalo-oa/templates/:id` | Admin (1) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:35` |
| DELETE | `/api/zalo-oa/templates/:id` | Admin (1) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:36` |
| POST | `/api/zalo-oa/send-template` | Admin (1) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:39` |
| POST | `/api/zalo-oa/send-template-uid` | Admin (1) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:40` |
| GET | `/api/zalo-oa/results` | Admin (1) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:41` |
| GET | `/api/zalo-oa/preview-data` | Admin (1) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:42` |
| GET | `/api/zalo-oa/message-status` | Admin (1) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:43` |
| GET | `/api/zalo-oa/fetch-new-templates` | Admin (1) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/zaloOaProxyRoutes.js:44` |
| POST | `/api/send-image` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageProxyRoutes.js:29` |
| GET | `/api/send-image/history` | User đang hoạt động đã đăng nhập | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageProxyRoutes.js:30` |
| GET | `/api/send-image/stats` | User đang hoạt động đã đăng nhập | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageProxyRoutes.js:31` |
| POST | `/api/send-image-v2/send` | Admin (1) hoặc VIP (3) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageV2ProxyRoutes.js:29` |
| POST | `/api/send-image-v2/search` | Admin (1) hoặc VIP (3) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageV2ProxyRoutes.js:30` |
| GET | `/api/send-image-v2/zalo-accounts` | Admin (1) hoặc VIP (3) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageV2ProxyRoutes.js:31` |
| POST | `/api/send-image-by-card/send` | Admin (1) hoặc VIP (3) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageByCardProxyRoutes.js:29` |
| GET | `/api/send-image-by-card/personal-accounts` | Admin (1) hoặc VIP (3) | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageByCardProxyRoutes.js:30` |
| POST | `/api/send-image-by-card/decode-fid` | Admin (1) hoặc VIP (3) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/sendImageByCardProxyRoutes.js:31` |
| GET | `/api/send-image-v2-timer/history` | Admin (1) hoặc VIP (3) | Không | ZL_TIMER_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/zaloTimerProxyRoutes.js:37` |
| GET | `/api/send-image-by-card-timer/history` | Admin (1) hoặc VIP (3) | Không | ZL_TIMER_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/zaloTimerProxyRoutes.js:37` |
| GET | `/api/zalo-timer/history` | User đang hoạt động đã đăng nhập | Không | ZL_TIMER_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/zaloTimerProxyRoutes.js:37` |
| POST | `/api/send-image-v2-timer/send` | Admin (1) hoặc VIP (3) | Có | ZL_TIMER_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/zaloTimerProxyRoutes.js:60` |
| POST | `/api/send-image-by-card-timer/send` | Admin (1) hoặc VIP (3) | Có | ZL_TIMER_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/zaloTimerProxyRoutes.js:60` |
| POST | `/api/zalo-timer/send` | User đang hoạt động đã đăng nhập | Có | ZL_TIMER_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/zaloTimerProxyRoutes.js:60` |
| POST | `/api/zalo/upload-custom-image` | User đang hoạt động đã đăng nhập | Có | FILES_SERVER | `recovered/MAIN_SERVER/routes/uploadProxyRoutes.js:31` |
| POST | `/api/check-status/pre-check` | Admin (1) hoặc VIP (3) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/checkStatusProxyRoutes.js:29` |
| POST | `/api/check-status/confirm` | Admin (1) hoặc VIP (3) | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/checkStatusProxyRoutes.js:30` |
| GET | `/api/licenses` | User đang hoạt động đã đăng nhập | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/licenseProxyRoutes.js:29` |
| GET | `/api/licenses/my-licenses` | User đang hoạt động đã đăng nhập | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/licenseProxyRoutes.js:30` |
| GET | `/api/licenses/products` | User đang hoạt động đã đăng nhập | Không | ZL_SERVER | `recovered/MAIN_SERVER/routes/licenseProxyRoutes.js:31` |
| POST | `/api/licenses/purchase` | User đang hoạt động đã đăng nhập | Có | ZL_SERVER | `recovered/MAIN_SERVER/routes/licenseProxyRoutes.js:32` |
| POST | `/api/check-ip/location` | User đang hoạt động đã đăng nhập | Có | MINI_SERVICE_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/checkIpProxyRoutes.js:29` |
| POST | `/api/leak-lookup/phone` | Admin (1) | Có | DATA_FIND_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/dataFindProxyRoutes.js:45` |
| POST | `/api/leak-lookup/email` | Admin (1) | Có | DATA_FIND_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/dataFindProxyRoutes.js:48` |
| POST | `/api/leak-lookup/pre-check` | Admin (1) | Có | DATA_FIND_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/dataFindProxyRoutes.js:51` |
| POST | `/api/leak-lookup/confirm` | Admin (1) | Có | DATA_FIND_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/dataFindProxyRoutes.js:71` |
| GET | `/api/leak-lookup/history` | Admin (1) | Không | DATA_FIND_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/dataFindProxyRoutes.js:101` |
| POST | `/api/link/fetch-meta` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:48` |
| GET | `/api/link/templates` | Admin (1) | Không | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:51` |
| POST | `/api/link/templates` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:52` |
| PUT | `/api/link/templates/:id` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:53` |
| DELETE | `/api/link/templates/:id` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:54` |
| GET | `/api/link/domains` | Admin (1) | Không | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:57` |
| POST | `/api/link/domains` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:58` |
| PUT | `/api/link/domains/:id` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:59` |
| DELETE | `/api/link/domains/:id` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:60` |
| GET | `/api/link/links` | Admin (1) | Không | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:63` |
| POST | `/api/link/links` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:64` |
| PUT | `/api/link/links/:id` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:65` |
| POST | `/api/link/upload-thumbnail` | Admin (1) | Có | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:72` |
| GET | `/api/link/results` | Admin (1) | Không | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:106` |
| GET | `/api/link/results-thumbnail` | Admin (1) | Không | LINK_SERVER — THIẾU | `recovered/MAIN_SERVER/routes/linkProxyRoutes.js:107` |
| POST | `/api/payos/create` | User đang hoạt động đã đăng nhập | Có | CASH_PAYOS — THIẾU | `recovered/MAIN_SERVER/routes/payosProxyRoutes.js:14` |
| GET | `/api/payos/history` | User đang hoạt động đã đăng nhập | Không | CASH_PAYOS — THIẾU | `recovered/MAIN_SERVER/routes/payosProxyRoutes.js:47` |
| POST | `/api/payos/cancel` | User đang hoạt động đã đăng nhập | Có | CASH_PAYOS — THIẾU | `recovered/MAIN_SERVER/routes/payosProxyRoutes.js:68` |
| GET | `/health` | Công khai | Không | MAIN nội bộ | `recovered/MAIN_SERVER/main_server.js:108` |
| GET | `/api/csrf-token` | User đang hoạt động đã đăng nhập | Không | MAIN nội bộ | `recovered/MAIN_SERVER/main_server.js:122` |
| POST | `/api/admin/login` | Công khai, xác minh thông tin Admin | Không | MAIN nội bộ | `recovered/MAIN_SERVER/main_server.js:150` |

Các endpoint /api/logs/admin được đánh dấu theo quyền thực tế trong mã, không theo tên đường dẫn. /api/zalo-timer/send còn có nguy cơ bỏ cổng VIP; xem MAIN-029. Facebook router trong ZL không được mount; /api/facebook/find-uid được frontend gọi nhưng không có API gateway tương ứng.

## Worker đang mount

### /health

- `GET`

Nguồn: `recovered/ZL_SERVER/zl_server.js:41`.

### /zalo/zalo-accounts

- `GET /`
- `POST /`
- `POST /auto-fetch`
- `POST /check-all-status`
- `GET /:uid`
- `PUT /:uid`
- `DELETE /:uid`
- `POST /:uid/check-status`

Nguồn: `recovered/ZL_SERVER/routes/zaloAccountRoutes.js:16`.

### /zalo/send-image

- `POST /`
- `GET /history`
- `GET /stats`

Nguồn: `recovered/ZL_SERVER/routes/sendImageRoutes.js:14`.

### /zalo/send-image-v2

- `GET /zalo-accounts`
- `POST /search`
- `POST /send`

Nguồn: `recovered/ZL_SERVER/routes/sendImageV2Routes.js:20`.

### /zalo/send-image-by-card

- `GET /personal-accounts`
- `POST /decode-fid`
- `POST /send`

Nguồn: `recovered/ZL_SERVER/routes/sendImageByCardRoutes.js:22`.

### /zalo/check-status

- `POST /pre-check`
- `POST /confirm`

Nguồn: `recovered/ZL_SERVER/routes/checkStatusRoutes.js:15`.

### /zalo/licenses

- `GET /`
- `GET /products`
- `POST /purchase`
- `GET /my-licenses`

Nguồn: `recovered/ZL_SERVER/routes/licenseRoutes.js:16`.

### /zalo/check-ip

- `POST /location`

Nguồn: `recovered/ZL_SERVER/routes/checkIpRoutes.js:39`.

### /zalo/zalo-oa

- `GET /token`
- `POST /token/refresh`
- `GET /templates`
- `POST /templates`
- `PUT /templates/:id`
- `DELETE /templates/:id`
- `POST /send-template`
- `POST /send-template-uid`
- `GET /results`
- `GET /preview-data`
- `GET /message-status`
- `GET /fetch-new-templates`

Nguồn: `recovered/ZL_SERVER/routes/zaloOaRoutes.js:6`.

### FILES_SERVER

- `POST /api/upload`
- `POST /api/upload-thumbnail`
- `POST /remote-server`
- `GET /*`

Nguồn: `recovered/FILES_SERVER/files_server.js:384`.

ZL health cũng cần khóa nội bộ; các nhóm /zalo/* yêu cầu userID từ MAIN. FILES không có xác thực trong mã. Có router auth/admin/logs/Facebook dự phòng trong ZL nhưng entrypoint không mount; không coi chúng là API đang phục vụ.
