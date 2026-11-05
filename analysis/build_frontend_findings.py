"""Static frontend inventory only. Does not import or execute recovered JavaScript."""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'recovered' / 'FRONTEND'
FILES = {p.name: p.read_text(encoding='utf-8') for p in sorted(FRONTEND.glob('*.js'))}

def ref(file, anchor):
    text = FILES[file]
    pos = text.find(anchor)
    if pos < 0:
        raise ValueError((file, anchor))
    return {'file': f'recovered/FRONTEND/{file}', 'line': text[:pos].count('\n') + 1}

features = []
def feature(id, screen, file, anchor, roles, actions, fields, endpoints, notes=None):
    features.append(dict(id=id, screen=screen, source=ref(file, anchor), roles=roles,
                         actions=actions, inputs=fields, endpoints=endpoints, notes=notes or []))

feature('user_shell', 'Dashboard và điều hướng hub', 'dashboard.js', 'async function init()',
        ['người dùng đã đăng nhập'],
        ['Đọc token/user từ localStorage; chuyển index.html khi chưa có token',
         'Lấy CSRF token, làm mới profile, chuyển nội dung Zalo/công cụ sang các tab',
         'Điều hướng Trang chủ, Zalo, Công cụ khác, Nạp tiền, Profile và ba hub admin', 'Đăng xuất'],
        [], ['GET /api/auth/csrf-token', 'GET /api/auth/profile'],
        ['Giao diện dùng hàm global và inline onclick; không có framework hoặc bundler trong 8 tệp.',
         'Role 1 = Admin, role 3 = VIP; còn lại hiển thị User. Hub OA, Link, Leak có kiểm tra role 1 trong showPage.'])
feature('profile', 'Thông tin cá nhân / đổi mật khẩu', 'dashboard.js', 'async function loadProfile()',
        ['người dùng đã đăng nhập'], ['Xem username/email/vai trò/số dư/lần đăng nhập cuối', 'Đổi mật khẩu và kiểm tra xác nhận khớp'],
        ['currentPassword', 'newPassword', 'confirmPassword'],
        ['GET /api/auth/profile', 'POST /api/auth/change-password'])
feature('zalo_accounts', 'Tài khoản Zalo của người dùng', 'dashboard.js', 'async function loadZaloAccounts()',
        ['người dùng đã đăng nhập'], ['Liệt kê avatar, UID, tên, điện thoại, trạng thái', 'Thêm tự động từ IMEI và cookie zpw_sek',
         'Có handler thêm thủ công', 'Xóa tài khoản', 'Kiểm tra một hoặc tất cả trạng thái'],
        ['IMEI', 'COOKIE_ZPW_SEK', 'UID/displayName/phoneNumber/Avatar/ENCRYPTION_KEY (handler thủ công)'],
        ['GET /api/zalo-accounts', 'POST /api/zalo-accounts', 'POST /api/zalo-accounts/auto-fetch',
         'DELETE /api/zalo-accounts/{uid}', 'POST /api/zalo-accounts/{uid}/check-status', 'POST /api/zalo-accounts/check-all-status'],
        ['Form do showAddZaloForm tạo chỉ nối handler tự động; handler thủ công cần HTML khác chưa được cung cấp.'])
feature('zalo_phone_image', 'Zalo: gửi ảnh theo số điện thoại / yêu cầu lấy IP', 'dashboard.js', 'async function searchPhoneNumber()',
        ['Admin (1)', 'VIP (3) theo ẩn tab lúc init'],
        ['Bước 1 chọn tài khoản hoạt động và tìm người nhận', 'Bước 2 xem người nhận/tài khoản gửi/phí/số dư rồi xác nhận',
         'Bước 3 hiển thị kết quả/phí; tải lại thống kê và lịch sử', 'Chọn ảnh mặc định hoặc PNG tự tải; chọn IPv4/IPv6/cả hai và autoDelete',
         'Hẹn giờ ít nhất khoảng 5 phút trong tương lai'],
        ['zaloUID', 'phoneNumber', 'imageType', 'ipType', 'autoDelete', 'isTimer', 'runTime', 'PNG tối đa 3 MB'],
        ['GET /api/send-image-v2/zalo-accounts', 'POST /api/zalo/upload-custom-image', 'POST /api/send-image-v2/search',
         'POST /api/send-image-v2/send', 'POST /api/send-image-v2-timer/send'],
        ['Tài khoản hệ thống hoặc tài khoản cá nhân có thể xuất hiện từ API.', 'Chỉ mô tả tĩnh; không gửi tin hoặc truy cập tài khoản thực.'])
feature('zalo_card_image', 'Zalo: gửi ảnh qua danh thiếp/PARAMS', 'dashboard.js', 'async function decodeFidAndSearch()',
        ['Admin (1)', 'VIP (3) theo ẩn tab lúc init'],
        ['Chọn tài khoản cá nhân hoạt động, giải mã FID/PARAMS và tìm người nhận', 'Xem phí/người nhận rồi xác nhận gửi hoặc hẹn giờ',
         'Ảnh custom, loại IP, autoDelete và kết quả tương tự luồng số điện thoại'],
        ['encryptedFid', 'zaloUID', 'imageType', 'ipType', 'autoDelete', 'isTimer', 'runTime'],
        ['GET /api/send-image-by-card/personal-accounts', 'POST /api/zalo/upload-custom-image',
         'POST /api/send-image-by-card/decode-fid', 'POST /api/send-image-by-card/send', 'POST /api/send-image-by-card-timer/send'])
feature('zalo_send_history', 'Zalo: thống kê và lịch sử gửi', 'dashboard.js', 'async function loadHistory(',
        ['người dùng đã đăng nhập'], ['Tổng gửi/thành công/thất bại/lỗi', 'Danh sách ngày, điện thoại, tên, phí, loại tài khoản, kết quả, chi tiết',
         'Phân trang 30 bản ghi'], [], ['GET /api/send-image/stats', 'GET /api/send-image/history?page={page}&limit=30'])
feature('zalo_timer_history', 'Zalo: lịch sử hẹn giờ', 'dashboard.js', 'async function loadZaloTimerHistory(',
        ['người dùng đã đăng nhập'], ['Xem thời gian tạo/chạy, mục tiêu, kết quả, trạng thái chờ/xử lý/thất bại/thành công', 'Phân trang 30 bản ghi'],
        [], ['GET /api/zalo-timer/history?page={page}&limit=30'], ['Không thấy chức năng hủy/sửa lịch ở frontend.'])
feature('zalo_status_phone', 'Zalo: tra last-online theo điện thoại', 'dashboard.js', 'async function checkZaloStatusPhoneStep1()',
        ['người dùng đã đăng nhập; không có role guard riêng trong handler'],
        ['Chọn tài khoản cá nhân hoặc SYSTEM', 'Pre-check xem profile, phí và số dư', 'Xác nhận trả phí, xem avatar/UID/last-online và cập nhật số dư'],
        ['phoneNumber', 'zaloUID', 'type=phone'], ['GET /api/send-image-v2/zalo-accounts', 'POST /api/check-status/pre-check', 'POST /api/check-status/confirm'])
feature('zalo_status_card', 'Zalo: tra last-online theo danh thiếp', 'dashboard.js', 'async function checkZaloStatusCardStep1()',
        ['người dùng đã đăng nhập; không có role guard riêng trong handler'],
        ['Chọn tài khoản cá nhân, nhập PARAMS', 'Pre-check giải mã và xem profile/phí', 'Xác nhận trả phí và xem last-online'],
        ['encryptedFid', 'zaloUID', 'type=card'], ['GET /api/send-image-v2/zalo-accounts', 'POST /api/check-status/pre-check', 'POST /api/check-status/confirm'])
feature('ip_lookup', 'Công cụ khác: vị trí IP', 'dashboard.js', 'async function handleCheckIp(',
        ['người dùng đã đăng nhập'], ['Kiểm tra định dạng IP', 'Xem kết quả từ nhiều nguồn, vùng/thành phố/quốc gia/ISP/tọa độ', 'Nhúng mapUrl bằng iframe'],
        ['ip (IPv4 hoặc IPv6)'], ['POST /api/check-ip/location'])
feature('license_store', 'Zalo: cửa hàng license', 'dashboard.js', 'async function loadProducts()',
        ['người dùng đã đăng nhập'], ['Xem sản phẩm và giá gói 1/5/10 lượt', 'Làm mới số dư, xác nhận mua, hiển thị modal key và copy',
         'Xem license đã mua, lượt còn lại, giá/ngày mua/kích hoạt/trạng thái'],
        ['productID', 'licenseType=1/2/3 (tương ứng 1/5/10 lượt)'],
        ['GET /api/licenses/products', 'POST /api/licenses/purchase', 'GET /api/licenses/my-licenses', 'GET /api/auth/profile'],
        ['Không thấy thao tác kích hoạt license từ dashboard; chỉ mua/xem/copy.'])
feature('payos_deposit', 'Nạp tiền PayOS: tạo và lịch sử', 'dashboard.js', 'async function createPayOSDepositRequest()',
        ['người dùng đã đăng nhập'], ['Tạo yêu cầu nạp từ 10.000 VND và hiển thị checkoutUrl', 'Xem lịch sử chờ/thành công/hủy',
         'Tiếp tục thanh toán bằng cashLink hoặc hủy giao dịch chờ'], ['amount', 'addInfo (hủy)'],
        ['POST /api/payos/create', 'GET /api/payos/history', 'POST /api/payos/cancel'],
        ['Không có SDK PayOS phía trình duyệt hoặc polling tự cập nhật; nút mở link thanh toán do server cấp.'])
feature('leak_phone', 'Tra cứu dữ liệu rò rỉ: điện thoại', 'dashboard_datafind.js', 'async function handlePreCheckLeak(',
        ['Admin (1) ở hub'], ['Chuẩn hóa số 0xxxxxxxxx sang 84xxxxxxxxx', 'Xem phí/số dư, chặn confirm nếu không đủ tiền',
         'Xác nhận, cập nhật số dư nếu charged, hiển thị bản ghi theo nguồn và trường dữ liệu'], ['type=phone', 'value'],
        ['POST /api/leak-lookup/pre-check', 'POST /api/leak-lookup/confirm'], ['Thông điệp UI nói chỉ tính phí khi tìm thấy dữ liệu.'])
feature('leak_email', 'Tra cứu dữ liệu rò rỉ: email', 'dashboard_datafind.js', 'async function handlePreCheckLeak(',
        ['Admin (1) ở hub'], ['Luồng ba bước nhập → phí/xác nhận → kết quả'], ['type=email', 'value'],
        ['POST /api/leak-lookup/pre-check', 'POST /api/leak-lookup/confirm'])
feature('leak_facebook', 'Tra cứu dữ liệu rò rỉ: Facebook', 'dashboard_datafind.js', "if (tab === 'facebook')",
        ['Admin (1) ở hub'], ['Nhận điện thoại, UID số hoặc URL', 'URL được giải UID qua API; số 84xxxxxxxxx chuyển thành 0xxxxxxxxx',
         'Sau đó dùng luồng phí/xác nhận/kết quả chung'], ['type=facebook', 'value', 'link (giải UID)'],
        ['POST /api/facebook/find-uid', 'POST /api/leak-lookup/pre-check', 'POST /api/leak-lookup/confirm'])
feature('leak_history', 'Tra cứu dữ liệu rò rỉ: lịch sử', 'dashboard_datafind.js', 'async function loadLeakHistory(',
        ['Admin (1) ở hub'], ['Xem loại/từ khóa/số kết quả/phí/ngày', 'Phân trang 30 bản ghi', 'Xem lại resultsData trong modal'],
        ['page'], ['GET /api/leak-lookup/history?page={page}&limit=30'])
feature('link_templates', 'Link: trang mẫu', 'dashboard_link.js', 'async function loadLinkTemplates()',
        ['Admin (1) ở hub'], ['Liệt kê/tạo/sửa/xóa mẫu', 'Lấy metadata tiêu đề/thumbnail từ URL', 'Upload thumbnail và preview'],
        ['name', 'link', 'title', 'thumbnail', 'template_id', 'file thumbnail'],
        ['GET /api/link/templates', 'POST /api/link/templates', 'PUT /api/link/templates/{id}', 'DELETE /api/link/templates/{id}',
         'POST /api/link/fetch-meta', 'POST /api/link/upload-thumbnail'], ['Thông báo xóa mẫu cho biết xóa cả các link liên quan.'])
feature('links', 'Link: danh sách/tạo/sửa', 'dashboard_link.js', 'async function loadLinkList()',
        ['Admin (1) ở hub'], ['Tạo từ mẫu và domain, gợi ý domain theo facebook/tiktok/baomoi', 'Xem/copy URL đầy đủ và rút gọn',
         'Sửa tên và chế độ vị trí'], ['name', 'template_id', 'domain_id', 'location_type'],
        ['GET /api/link/links', 'POST /api/link/links', 'PUT /api/link/links/{id}', 'GET /api/link/templates', 'GET /api/link/domains'],
        ['location_type: 0 không lấy vị trí, 1 chỉ lấy vị trí, 2 kèm giải thích, 3 phải cấp quyền mới tải nội dung.',
         'Không có nút xóa link riêng; comment cũ nói không sửa nhưng mã hiện có sửa.'])
feature('link_domains', 'Link: quản lý domain', 'dashboard_link.js', 'async function loadLinkDomains()',
        ['Admin (1) ở hub'], ['Xem/tạo/sửa/xóa domain và chi tiết'], ['domain', 'detail'],
        ['GET /api/link/domains', 'POST /api/link/domains', 'PUT /api/link/domains/{id}', 'DELETE /api/link/domains/{id}'])
feature('link_results', 'Link: kết quả và kết quả thumbnail', 'dashboard_link.js', 'async function loadLinkResults()',
        ['Admin (1) ở hub'], ['Hai tab kết quả riêng', 'Lọc tại client theo ID/tên link', 'Xem kết quả dạng text và ngày tạo'],
        ['từ khóa lọc'], ['GET /api/link/results', 'GET /api/link/results-thumbnail'])
feature('oa_token', 'Zalo OA: token', 'dashboard_zalo_oa.js', 'async function loadOaToken()',
        ['Admin (1) ở hub'], ['Xem hạn token và một phần refresh token', 'Nhập refresh token hoặc để trống để dùng token DB',
         'Tự refresh khi chuyển tab nếu token hết hạn hoặc còn dưới 60 giây'], ['refresh_token'],
        ['GET /api/zalo-oa/token', 'POST /api/zalo-oa/token/refresh'])
feature('oa_templates', 'Zalo OA: mẫu tin', 'dashboard_zalo_oa.js', 'async function loadOaTemplates()',
        ['Admin (1) ở hub'], ['Tạo/sửa/xóa template', 'Tự lấy template mới, chọn nhiều dòng, nhập chi tiết và lưu từng template'],
        ['template_id', 'detail', 'params (CSV)'], ['GET /api/zalo-oa/templates', 'POST /api/zalo-oa/templates',
         'PUT /api/zalo-oa/templates/{id}', 'DELETE /api/zalo-oa/templates/{id}', 'GET /api/zalo-oa/fetch-new-templates'])
feature('oa_send_phone', 'Zalo OA: gửi theo điện thoại', 'dashboard_zalo_oa.js', 'async function sendOaMessage()',
        ['Admin (1) ở hub'], ['Chọn IPv4/IPv6/cả hai; lọc template theo chuỗi v4/v6 trong detail',
         'Tạo form động từ params, lấy preview cho date/order_code/price/phone_number', 'Nhập trường custom, xác nhận gửi, xem kết quả'],
        ['phone_number', 'template_id (chuỗi hoặc mảng)', 'custom_params'],
        ['GET /api/zalo-oa/templates', 'GET /api/zalo-oa/preview-data', 'POST /api/zalo-oa/send-template'])
feature('oa_send_uid', 'Zalo OA: gửi theo UID', 'dashboard_zalo_oa.js', 'async function sendOaMessageUid()',
        ['Admin (1) ở hub'], ['Luồng tương tự điện thoại; phone_number trong params phải tự nhập nếu cần'],
        ['user_id', 'template_id (chuỗi hoặc mảng)', 'custom_params'],
        ['GET /api/zalo-oa/templates', 'GET /api/zalo-oa/preview-data', 'POST /api/zalo-oa/send-template-uid'])
feature('oa_results', 'Zalo OA: kết quả gửi / trạng thái', 'dashboard_zalo_oa.js', 'async function loadOaResults()',
        ['Admin (1) ở hub'], ['Xem order_code, điện thoại hoặc UID, template, message status, kết quả và chi tiết', 'Cập nhật status từng message'],
        ['message_id', 'phone', 'id'], ['GET /api/zalo-oa/results', 'GET /api/zalo-oa/message-status?message_id={msgId}&phone={phone}&id={id}'])
feature('admin_users', 'Admin: người dùng và thống kê', 'admin-dashboard.js', 'async function loadUsers()',
        ['admin_token/admin_user được đọc; không kiểm role 1 ngay trong checkAuth'],
        ['Thống kê tổng/active/admin', 'Tìm theo tên/email/ID', 'Tạo/sửa/xóa người dùng', 'Ẩn nút tự xóa'],
        ['userName', 'email', 'password', 'totalMoney', 'userRole', 'isActive'],
        ['GET /api/admin/stats', 'GET /api/admin/users', 'POST /api/admin/users', 'PUT /api/admin/users/{id}', 'DELETE /api/admin/users/{id}'])
feature('admin_ip_blocks', 'Admin: chặn IP', 'admin-dashboard.js', 'async function loadIPBlocks()',
        ['admin session'], ['Xem/lọc IP block và số login/api/both', 'Chặn IP theo loại, lý do, thời lượng', 'Gỡ chặn'],
        ['ipAddress', 'blockType=login/api/both', 'reason', 'blockMinutes'],
        ['GET /api/admin/ip-blocks', 'POST /api/admin/ip-blocks', 'DELETE /api/admin/ip-blocks/{ip}'])
feature('admin_zalo', 'Admin: Zalo hệ thống và phí', 'admin-zalo.js', 'async function loadZaloAccounts()',
        ['admin_token/admin_user được đọc; không kiểm role 1 ngay trong checkAuth'],
        ['Xem toàn bộ tài khoản Zalo hệ thống', 'Chọn UID hệ thống và sửa năm mức phí gửi/check status',
         'Xem/lọc auto requests; đếm thành công/thất bại và doanh thu'],
        ['uid_zalo_system', 'zalo_system_money', 'zalo_custom_money', 'check_phone_system_money', 'check_phone_custom_money', 'check_card_money'],
        ['GET /api/admin/zalo-accounts', 'GET /api/admin/tool-setup', 'PUT /api/admin/tool-setup', 'GET /api/admin/requests'])
feature('admin_products', 'Admin: sản phẩm', 'admin-products.js', 'async function loadProducts()',
        ['Admin (1) theo init'], ['Liệt kê/tạo/sửa/xóa sản phẩm và giá 1/5/10 lượt; bật/tắt sản phẩm'],
        ['productName', 'productDesc', 'productOnePrice', 'productFivePrice', 'productTenPrice', 'productImage', 'isActive'],
        ['GET /api/admin/products', 'GET /api/admin/products/{id}', 'POST /api/admin/products', 'PUT /api/admin/products/{id}', 'DELETE /api/admin/products/{id}'],
        ['Thông báo UI cho biết xóa sản phẩm đã có license mua chỉ vô hiệu hóa.'])
feature('admin_licenses', 'Admin: license', 'admin-products.js', 'async function loadLicenses(',
        ['Admin (1) theo init'], ['Lọc theo sản phẩm, trạng thái, username; phân trang 20', 'Xem/copy key và chi tiết',
         'Tăng lượt dùng', 'Vô hiệu hóa với lý do'], ['productID', 'status', 'userName', 'count', 'reason'],
        ['GET /api/admin/licenses?page={page}&limit=20&productID={id}&status={status}&userName={name}',
         'GET /api/admin/licenses/{key}', 'POST /api/admin/licenses/{key}/extend', 'POST /api/admin/licenses/{key}/revoke'])
feature('admin_leak', 'Admin: cấu hình phí và lịch sử tra cứu rò rỉ', 'admin-dataleak.js', 'async function loadHistory(',
        ['có admin_token; không có role check phía client'],
        ['Sửa phí tra cứu', 'Xem lịch sử toàn hệ thống, phân trang 20', 'Xem resultsData JSON trong modal',
         'Tổng lượt, doanh thu server trả, số kết quả trung bình trên trang hiện tại'],
        ['check_data_leak_money', 'page'], ['GET /api/admin/tool-setup', 'PUT /api/admin/tool-setup', 'GET /api/admin/leak-history?page={page}&limit=20'])

bugs = []
def bug(id, severity, title, file, anchor, impact, confidence='high', related=None):
    bugs.append(dict(id=id, severity=severity, title=title, source=ref(file, anchor), impact=impact,
                     confidence=confidence, related=related or [], verification='static source inspection; not browser-tested'))

bug('FE-01', 'P2', 'Biến select ngoài phạm vi khi không có Zalo cá nhân hoạt động', 'dashboard.js', 'select.innerHTML =\n          \'<option value="">Không có tài khoản Zalo đang hoạt động</option>\';\n        showSendCardAlert',
    'loadSendCardZaloAccounts chỉ khai báo const select trong nhánh activeAccounts.length > 0; nhánh else ném ReferenceError, bị catch và chỉ log; dropdown/cảnh báo không được cập nhật.',
    related=[ref('dashboard.js', 'const select = document.getElementById("send-card-zalo-account");')])
bug('FE-02', 'P2', 'Hủy nạp tiền gọi sai chữ ký showAlert', 'dashboard.js', 'showAlert("Đã hủy giao dịch nạp tiền", "success")',
    'showAlert yêu cầu (elementId,message,type). Ba lệnh trong cancelPayOSDeposit truyền (message,type), nên tìm element bằng chính nội dung thông báo và return; người dùng không thấy success/error.',
    related=[ref('dashboard.js', 'function showAlert(elementId, message'), ref('dashboard.js', 'showAlert("Lỗi khi hủy giao dịch", "error")')])
bug('FE-03', 'P2', 'Đọc body response hai lần với 403 không phải CSRF', 'dashboard.js', 'if (response.status === 403)',
    'apiCall đã response.json() khi status 403; nếu thông điệp không có CSRF thì rơi xuống response.json() lần hai. Kết quả là lỗi body already consumed thay vì thông báo permission gốc.',
    related=[ref('admin-products.js', 'if (response.status === 403)'), ref('admin-dataleak.js', 'if (response.status === 403)')])
bug('FE-04', 'P2', 'Lần đầu mở OA gửi UID tải dropdown của tab điện thoại', 'dashboard_zalo_oa.js', 'if (oaTemplateList.length === 0)',
    'loadOaTemplatesForSendUid gọi loadOaTemplatesForSend khi cache rỗng. Hàm đó chỉ gọi onOaIpTypeChange (controls điện thoại), không gọi onOaIpTypeChangeUid. Dropdown UID thiếu dữ liệu ở lần vào đầu tiên.',
    related=[ref('dashboard_zalo_oa.js', 'async function loadOaTemplatesForSend()')])
bug('FE-05', 'P1', 'Dữ liệu tra cứu được chèn vào innerHTML chưa escape', 'dashboard_datafind.js', '${val}</span>',
    'renderLeakResults chèn source/key/value trực tiếp vào HTML; searchValue trong lịch sử và value ở confirm cũng chưa escape. Nếu API/kho dữ liệu chứa HTML, có thể thực thi markup/script event trong phiên người dùng. Cần đối chiếu ràng buộc/sanitize server.',
    related=[ref('dashboard_datafind.js', 'Nguồn: ${source}'), ref('dashboard_datafind.js', '${item.searchValue}</span>')])
bug('FE-06', 'P1', 'Nhiều bảng/template/modal khác nội suy API vào HTML và thuộc tính', 'dashboard_link.js', '${item.name}</td>',
    'Link templates/links/results, OA template/result/param, Zalo account/history, admin products và IP blocks có trường API chưa escape trong innerHTML/thuộc tính/inline handler. escapeHtml có tồn tại nhưng áp dụng không nhất quán. Khả năng khai thác phụ thuộc dữ liệu đầu vào server.',
    related=[ref('dashboard_link.js', 'href="${item.link}"'), ref('dashboard_zalo_oa.js', '${item.detail}</td>'),
             ref('dashboard.js', '${account.displayName}</h3>'), ref('admin-products.js', '${product.productName}</strong>'),
             ref('admin-dashboard.js', '${block.reason || \'N/A\'}')])
bug('FE-07', 'P2', 'Log cookie xác thực Zalo vào console', 'dashboard.js', 'console.log("COOKIE_ZPW_SEK: ", cookieZpwSek)',
    'handleAddZaloAccountAuto log cookie zpw_sek hai lần và IMEI; console/log collection có thể lộ dữ liệu phiên. Không đưa giá trị thực vào báo cáo.')
bug('FE-08', 'P2', 'Cập nhật sai thuộc tính số dư sau gửi ảnh danh thiếp', 'dashboard.js', 'currentUser.balance = response.data.newBalance',
    'Các luồng profile/license/check-status dùng currentUser.totalMoney. Ghi balance để totalMoney trong localStorage cũ; số dư client không đồng bộ sau tính phí.')
bug('FE-09', 'P2', 'Gửi ảnh theo điện thoại không đồng bộ currentUser.totalMoney', 'dashboard.js', '// Reload history và stats',
    'Luồng gửi thường hiển thị newBalance nhưng chỉ reload history/stats, không cập nhật local user hoặc profile. Số dư đã cache tiếp tục cũ cho đến refreshCurrentUser/load lại.')
bug('FE-10', 'P2', 'Phụ thuộc biến event global trong handler async', 'dashboard_link.js', 'const btn = event.target;',
    'fetchWebMetaForModal/saveEditLink/submitCreateLink và OA autoFetch/saveAutoFetchedTemplates không nhận event tham số, dùng Window.event đã cũ/không đáng tin. Gọi bằng mã hoặc môi trường không hỗ trợ sẽ lỗi; click vào phần tử con có thể disable sai node.',
    related=[ref('dashboard_link.js', 'async function saveEditLink()'), ref('dashboard_link.js', 'async function submitCreateLink()'),
             ref('dashboard_zalo_oa.js', 'async function autoFetchOaTemplates()'), ref('dashboard_zalo_oa.js', 'const saveBtn = event.target')])
bug('FE-11', 'P2', 'Parse thời gian hẹn giờ chưa xử lý chuỗi sai', 'dashboard.js', 'const [day, month, year] = date.split("/")',
    'validateAndGetTimer split thủ công ngoài try; chuỗi thiếu ngày có thể ném TypeError, ngày không hợp lệ có thể đến toISOString ném RangeError. Flatpickr chưa được cung cấp và giá trị input có thể không đúng định dạng.')
bug('FE-12', 'P2', 'Giá trị phí bằng 0 bị thay thành giá mặc định', 'admin-dataleak.js', 'data.data.check_data_leak_money || 50000',
    'loadToolSetup dùng || nên phí cấu hình 0 hiển thị 50.000; admin-zalo openToolSetupModal cũng thay năm giá 0 bằng 30.000/20.000/10.000/5.000. Mở/lưu form có thể đổi mức miễn phí ngoài ý muốn.',
    related=[ref('admin-zalo.js', 'toolSetupConfig.zalo_system_money || 30000')])
bug('FE-13', 'P2', 'Kiểm tra số tiền chấp nhận giá âm/NaN ở một số form', 'admin-products.js', 'if (formData.productOnePrice === 0',
    'Form sản phẩm chỉ loại tất cả giá bằng 0, cho qua giá âm. Admin Zalo chỉ isNaN và không loại âm; admin leak so sánh chuỗi <0 nhưng thiếu Number.isFinite. Server phải xác thực; đây là thiếu sót validation phía client.',
    related=[ref('admin-zalo.js', 'if (isNaN(zalo_system_money)'), ref('admin-dataleak.js', 'if (!feeValue || feeValue < 0)')])
bug('FE-14', 'P2', 'Không thoát bootstrap admin sau redirect khi thiếu session', 'admin-dashboard.js', 'await checkAuth();',
    'checkAuth return sau gán location, callback DOMContentLoaded vẫn gọi API tải users/stats/IP. Tương tự admin-zalo. Thường trình duyệt chuyển trang sớm nhưng vẫn có request không hợp lệ/UI lỗi trong quá trình chuyển.',
    related=[ref('admin-zalo.js', 'await checkAuth();')])
bug('FE-15', 'P2', 'Dashboard có token nhưng thiếu/hỏng user làm init lỗi', 'dashboard.js', 'currentUser = JSON.parse(localStorage.getItem("user"))',
    'Không try/catch JSON hoặc kiểm null trước đọc currentUser.userName. Trạng thái localStorage không nhất quán làm dashboard dừng trước profile refresh.')
bug('FE-16', 'P2', 'Kiểm tra trạng thái và tải dropdown chạy đồng thời', 'dashboard.js', 'checkAllAccountsStatusSilent();\n    loadSendZaloAccounts();',
    'showZaloTab không await check-all trước load danh sách và lọc tài khoản active. Dropdown có thể dựa trên trạng thái cũ; sau check xong không refresh dropdown.',
    related=[ref('dashboard.js', 'checkAllAccountsStatusCardSilent();\n    loadSendCardZaloAccounts();')])
bug('FE-17', 'P2', 'UID và số điện thoại OA dùng chung nút update status nhưng chỉ truyền phone_number', 'dashboard_zalo_oa.js', "updateOaMessageStatus('${item.msg_id}', '${item.phone_number}'",
    'Bảng hiển thị user_id khi phone_number trống, nhưng nút truyền phone_number trực tiếp (có thể thành chuỗi undefined). Có thể không kiểm tra được tin gửi UID; cần đối chiếu hợp đồng endpoint message-status.', 'medium')
bug('FE-18', 'P2', 'So sánh template_id chặt với giá trị select dạng chuỗi', 'dashboard_zalo_oa.js', 'oaTemplateList.find(t => t.template_id === tid)',
    'Nếu API trả template_id dạng số, select.value là chuỗi nên find không ra template và params động rỗng; ảnh hưởng cả phone và UID. Cần chuẩn hóa kiểu hoặc xác nhận schema API.', 'medium')
bug('FE-19', 'P3', 'Số lượt license còn lại bằng 0 bị hiển thị dấu gạch', 'dashboard.js', '${license.countDown ? license.countDown : "-"}',
    'Truthiness bỏ mất số 0 thay vì hiển thị đã hết lượt.')
bug('FE-20', 'P3', 'Regex IPv4 không kiểm tra dải octet', 'dashboard.js', 'const ipv4Regex = /^(\\d{1,3}\\.){3}\\d{1,3}$/',
    'Chuỗi như 999.999.999.999 vượt qua kiểm tra browser và vẫn gửi API. Đây là thiếu validation client, chưa kết luận server chấp nhận IP sai.')

modules=[]
api_prefix = {'admin-dashboard.js':'/api/admin', 'admin-zalo.js':'/api/admin', 'admin-dataleak.js':'/api/admin'}
for name, text in FILES.items():
    lines = text.splitlines()
    funcs=[{'name':m.group(1),'line':text[:m.start()].count('\n')+1}
           for m in re.finditer(r'^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(',text,re.M)]
    dom=[]
    for m in re.finditer(r'getElementById\(\s*([\'"`])([^\n]*?)\1\s*\)',text):
        dom.append({'id_or_template':m.group(2),'line':text[:m.start()].count('\n')+1})
    seen=set(); dom=[d for d in dom if not (d['id_or_template'] in seen or seen.add(d['id_or_template']))]
    api=[]
    for m in re.finditer(r'\b(apiCall|fetch)\(\s*([\'"`])([^\n]*?)\2',text):
        api.append({'callee':m.group(1),'endpoint_expression':m.group(3),'line':text[:m.start()].count('\n')+1})
    modules.append({'file':f'recovered/FRONTEND/{name}', 'line_count':len(lines), 'bytes':(FRONTEND/name).stat().st_size,
                    'sha256':hashlib.sha256((FRONTEND/name).read_bytes()).hexdigest(),
                    'api_prefix':api_prefix.get(name,'/api'), 'functions':funcs, 'dom_contract':dom, 'literal_api_calls':api,
                    'script_dependencies':(['dashboard.js'] if name.startswith('dashboard_') else []),
                    'external_js':(['flatpickr with Vietnamese locale'] if name=='dashboard.js' else ['SweetAlert2 global Swal'] if name=='dashboard_datafind.js' else []),
                    'initialization':('DOMContentLoaded; several admin forms/modals are bound immediately at script evaluation, so DOM must already exist' if name.startswith('admin-') else 'DOMContentLoaded; module globals must share the main dashboard browsing context')})

report={
    'scope': {'method':'static inspection only; no recovered JS executed; no browser, API calls, real accounts or messages',
              'files_reviewed':len(modules), 'total_lines':sum(m['line_count'] for m in modules),
              'line_number_basis':'current recovered files after parent stripped exactly one File: metadata header',
              'language':'vi-VN', 'source_changes_made_by_this_agent':False},
    'architecture': {'style':'Vanilla JavaScript, same-origin /api, global functions and inline onclick/onsubmit, dynamic innerHTML',
        'user_auth':'localStorage token/user, Bearer header; GET /auth/profile refresh; CSRF header for mutations; retry once on CSRF 403',
        'admin_auth':'separate localStorage admin_token/admin_user; admin-products explicitly checks role 1; other admin pages depend on token presence and server authorization',
        'role_model':{'1':'Admin','3':'VIP','other':'User'},
        'load_order':'Dashboard HTML must load dashboard.js and its OA/Link/DataFind modules as browser classic scripts sharing globals; do not load admin scripts into the same document because const API_URL and helper names collide.',
        'role_limit':'Client role gates are display/navigation controls. Actual API authorization requires backend verification; frontend alone cannot establish it.'},
    'feature_matrix': features,
    'missing_artifacts': [
        {'artifact':'HTML entry pages and dashboard DOM', 'status':'absent from recovered source tree at inspection',
         'detail':'Không có .html. Cần ít nhất index.html và admin.html được redirect tới, dashboard host và các trang admin ứng với 4 script. Tên HTML host còn lại chưa thể suy ra chắc chắn.',
         'requirements':['Mọi ID literal/dynamic trong modules[].dom_contract', '.page-section/.menu-item/.sub-menu-item',
                         '.zalo-tab/.other-tab/.deposit-tab/.leak-tab/.link-tab/.zalo-oa-tab',
                         'forms, tables, step indicators, hub cards and modal shells referenced by JS',
                         'dashboard modules must be included, with inline event wiring; no static HTML can be faithfully reconstructed from logic alone']},
        {'artifact':'CSS/theme/responsive styles', 'status':'absent',
         'detail':'Script có style inline cho một số nội dung động nhưng không định nghĩa đầy đủ sidebar/page tabs/active/completed/modals/cards/tables/badges/spinner; không thể thấy UI hoàn chỉnh.'},
        {'artifact':'Flatpickr JS, CSS, Vietnamese locale', 'status':'not bundled in recovered frontend',
         'detail':'dashboard.js gọi global flatpickr với locale vn cho send-image-run-time và send-card-run-time; khi các input tồn tại mà thư viện thiếu sẽ ReferenceError.'},
        {'artifact':'SweetAlert2 JS (global Swal)', 'status':'not bundled',
         'detail':'dashboard_datafind.js gọi Swal.fire cho lỗi/validation; thiếu thư viện sẽ làm luồng lỗi không hiển thị đúng.'},
        {'artifact':'Font Awesome CSS/font assets', 'status':'not bundled',
         'detail':'Có markup fas fa-chevron-left/right và fa-database; cần stylesheet/fonts để hiện icon.'},
        {'artifact':'Login/register/admin-login browser code and views', 'status':'not present among 8 JS files',
         'detail':'Các script chỉ đọc token đã có; không có handler đăng nhập/đăng ký để tạo localStorage session.'},
        {'artifact':'Images/static public assets', 'status':'no image files in recovered tree',
         'detail':'Avatar/product/template images dựa trên dữ liệu API hoặc dịch vụ placeholder bên ngoài. Map iframe cần URL từ API và mạng.'},
        {'artifact':'Direct UI build configuration', 'status':'no package/build manifest in FRONTEND',
         'detail':'Có thể phục vụ classic scripts trực tiếp sau khi có host HTML/CSS; chưa có bằng chứng ứng dụng React/Vue hoặc yêu cầu npm frontend.'}
    ],
    'findings':bugs,
    'modules':modules,
    'boundaries':['Chưa test trình duyệt vì HTML/CSS và các thư viện host thiếu.',
                  'Endpoints được suy từ frontend; không khẳng định backend triển khai đầy đủ.',
                  'P1 injection findings là sink chưa encode trong frontend; cần đối chiếu server sanitize để đánh giá khai thác thực tế.',
                  'Không suy diễn tên trang HTML chưa có trong source.']
}

out=ROOT/'analysis'/'frontend-findings.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'output':str(out),'modules':len(modules),'lines':report['scope']['total_lines'],'features':len(features),'findings':len(bugs)},ensure_ascii=False))
