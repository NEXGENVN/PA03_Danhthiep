// Formats the static analysis JSON; does not import or execute recovered source.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'analysis', name)));
const frontend = read('frontend-findings.json'), main = read('main-findings.json'), zalo = read('zalo-findings.json');
const output = (name, text) => fs.writeFileSync(path.join(root, 'docs', name), text.trim() + '\n');
const cell = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
let text = '# Ma trận toàn bộ chức năng frontend PA03\n\n';
text += 'Phân tích tĩnh đủ 8 module browser JavaScript; không có HTML/CSS để kiểm chứng giao diện. Vai trò dưới đây mô tả frontend; quyền thực thi phải đối chiếu gateway trong API-REFERENCE.md. Có 31 nhóm thao tác được khai báo, không đồng nghĩa tất cả chạy được.\n\n';
for (const [i, item] of frontend.feature_matrix.entries()) {
  text += `## ${i + 1}. ${item.screen}\n\n`;
  text += `Nguồn: \`${item.source.file}:${item.source.line}\`. Quyền/UI: ${item.roles.join('; ')}.\n\n`;
  text += item.actions.map(a => '- ' + a).join('\n') + '\n\n';
  if (item.inputs.length) text += `Đầu vào: ${item.inputs.map(a => '`' + a + '`').join(', ')}.\n\n`;
  text += 'API liên quan:\n\n' + item.endpoints.map(a => '- `' + a + '`').join('\n') + '\n\n';
  if (item.notes.length) text += item.notes.map(a => '- ' + a).join('\n') + '\n\n';
}
text += '## Điều kiện hiển thị còn thiếu\n\nCần tài liệu HTML có đúng DOM ID/container, CSS, các trang đăng nhập và assets. Dashboard dùng các module classic script chung globals; không ghép tất cả admin scripts lên cùng một trang vì trùng tên biến/hàm. Flatpickr/SweetAlert2 và tài nguyên giao diện chưa được cung cấp. Danh sách DOM ID, hàm và endpoint theo từng tệp nằm trong analysis/frontend-findings.json.\n';
output('FEATURE-MATRIX.vi.md', text);

const roles = {
  'public': 'Công khai',
  'any active authenticated user': 'User đang hoạt động đã đăng nhập',
  'admin (1)': 'Admin (1)',
  'admin (1) or VIP (3)': 'Admin (1) hoặc VIP (3)',
  'any active authenticated user; admin paths lack role check': 'User đã đăng nhập; nhánh admin thiếu kiểm quyền',
  'public (admin credentials required)': 'Công khai, xác minh thông tin Admin'
};
const missing = new Set(['ZL_TIMER_SERVER','MINI_SERVICE_SERVER','DATA_FIND_SERVER','LINK_SERVER','CASH_PAYOS']);
text = '# Tham chiếu API gateway PA03\n\n';
text += '110 tổ hợp method/path được mount bởi MAIN_SERVER. Danh sách dựa trên code; endpoint proxy vẫn tồn tại khi upstream bị thiếu nhưng không thực hiện được nghiệp vụ. Base URL local: `http://127.0.0.1:13100`. Auth dùng Bearer JWT; CSRF dùng header `x-csrf-token`.\n\n';
text += '| Method | Path | Quyền hiện tại trong mã | CSRF | Nơi thực thi | Vị trí khai báo |\n|---|---|---|---|---|---|\n';
for (const e of main.endpoints) {
  const target = e.implementation === 'local' ? 'MAIN nội bộ' : e.implementation + (missing.has(e.implementation) ? ' — THIẾU' : '');
  text += `| ${e.method} | \`${cell(e.path)}\` | ${cell(roles[e.authorization] || e.authorization)} | ${e.csrf_required ? 'Có' : 'Không'} | ${cell(target)} | \`${e.file}:${e.line}\` |\n`;
}
text += '\nCác endpoint /api/logs/admin được đánh dấu theo quyền thực tế trong mã, không theo tên đường dẫn. /api/zalo-timer/send còn có nguy cơ bỏ cổng VIP; xem MAIN-029. Facebook router trong ZL không được mount; /api/facebook/find-uid được frontend gọi nhưng không có API gateway tương ứng.\n\n';
text += '## Worker đang mount\n\n';
for (const group of zalo.active_routes) text += `### ${group.prefix}\n\n${group.routes.map(r => '- `' + r + '`').join('\n')}\n\nNguồn: \`${group.ref}\`.\n\n`;
text += 'ZL health cũng cần khóa nội bộ; các nhóm /zalo/* yêu cầu userID từ MAIN. FILES không có xác thực trong mã. Có router auth/admin/logs/Facebook dự phòng trong ZL nhưng entrypoint không mount; không coi chúng là API đang phục vụ.\n';
output('API-REFERENCE.md', text);

const mainTitles = [
  'Nhánh nhật ký quản trị không kiểm tra quyền Admin',
  'Hàm nhật ký hiểu sai kiểu trả về db.query; cleanup có thể xóa xong mới lỗi',
  'CAPTCHA lộ ký tự đáp án trong SVG có thể đọc bằng chương trình',
  'Tin header IP do client gửi mà chưa xác minh reverse proxy',
  'Đổi mật khẩu ghi cả mật khẩu hiện tại và mới ra log',
  'CSRF sai độ dài gây HTTP 500',
  'CSRF RAM một token mỗi user/IP gây xung đột nhiều tab hoặc nhiều instance',
  'Các trường kết quả CSRF và session trong audit không được ghi đúng',
  'Audit bỏ sót nhiều lần xác thực hoặc rate-limit bị từ chối',
  'Audit làm mất prefix API trong đường dẫn request',
  'CAPTCHA chưa ràng buộc IP và chưa tiêu thụ một lần nguyên tử',
  'Log CAPTCHA in đáp án và dữ liệu xác minh trong mọi môi trường',
  'Đọc biến môi trường bắt buộc trước khi xác thực cấu hình',
  'Thiếu readiness phụ thuộc và khởi tạo schema cốt lõi',
  'Kiểm tra tự cập nhật Admin sai khi khác kiểu hoặc bỏ trường',
  'Tăng lượt license có thể nối chuỗi và mất cập nhật đồng thời',
  'Thống kê sản phẩm dùng các cột license không nhất quán',
  'Thao tác xóa nhiều bước không dùng transaction',
  'Rate limit toàn cục bỏ qua toàn bộ auth/admin',
  'Đổi mật khẩu không thu hồi JWT đang tồn tại',
  'Xác thực đầu vào tài khoản và thông tin đăng nhập chưa đầy đủ',
  'Lịch sử leak gửi mảng vào một placeholder prepared statement',
  'Proxy PayOS không đặt timeout',
  'Thumbnail proxy nạp file vào RAM mà không giới hạn dung lượng',
  'Upload proxy không chuyển khóa xác thực nội bộ',
  'Phân trang và thời hạn giữ log chưa giới hạn hợp lý',
  'Khởi tạo cấu hình thay giá 0 bằng mặc định',
  'Kiểm CAPTCHA và chặn IP có nhánh cho qua khi database lỗi',
  'Đường timer tổng quát có thể bỏ cổng VIP cho lịch danh thiếp'
];
const zlTitles = {
  'ZL-01': 'Khóa nội bộ để trống có thể khiến middleware cho qua',
  'FILES-01': 'Đường dẫn nhận từ request có thể đọc ra ngoài thư mục files',
  'FILES-02': 'Upload chưa xác thực, tên tệp do client điều khiển có thể ghi vượt thư mục',
  'ZL-02': 'Hàm che log không che đúng IMEI, khóa mã hóa và cookie Zalo',
  'ZL-03': 'Token, template và kết quả OA toàn cục; worker không chia quyền theo user',
  'ZL-04': 'licenseType dạng chuỗi có thể bị tính tiền nhưng tạo 0 lượt',
  'ZL-05': 'Phụ phí ảnh tùy chọn có thể nối chuỗi DECIMAL thay vì cộng số',
  'ZL-06': 'Gửi tin và tải ảnh có thể chạy trước khi transaction tracking commit',
  'FILES-03': 'Thuộc tính tracking có thể giả mạo và được lưu thành HTML chưa escape',
  'FILES-04': 'Nhiều lượt tải đồng thời có thể ghi đè nhau; thiếu hạn chế thông báo/log',
  'ZL-07': 'Lấy DB connection ngoài try khiến async error không được xử lý đúng',
  'ZL-08': 'API gửi cũ bỏ luồng thu phí V2 và dùng trạng thái khác query thống kê',
  'ZL-09': 'Mã đơn OA và thay token chưa nguyên tử',
  'ZL-10': 'Pre-check trả dữ liệu trước thu phí, confirm thiếu ràng buộc và chống lặp',
  'ZL-11': 'Một số rate-limit/CSRF mô tả trong comment không được gắn vào worker',
  'ZL-12': 'Kiểm tra đầu vào, IP, phân trang và cấu hình ảnh chưa đầy đủ',
  'FILES-05': 'Thiếu env hoặc lỗi read-stream có thể làm FILES dừng',
  'ZL-DORMANT-01': 'Module logs dự phòng cũng sai kiểu kết quả db.query',
  'ZL-DORMANT-02': 'Thống kê license dự phòng dùng cột không nhất quán',
  'ZL-DORMANT-03': 'CAPTCHA dự phòng in đáp án rõ trong log'
};
text = '# Danh mục vấn đề kỹ thuật PA03\n\n';
text += 'Đây là kết quả review mã gốc, không phải danh sách đã sửa. Các nhóm có thể trùng nguyên nhân. high/P1 là ưu tiên cao theo reviewer, medium/P2 là lỗi quan trọng, low/P3 là mức thấp; blocker chỉ thành phần ngăn khởi động khi chưa cấu hình. Các rủi ro khai thác phụ thuộc cấu hình và đường hiển thị thực tế. Các đánh giá tĩnh không đồng nghĩa đã thực hiện khai thác.\n\n';
text += 'Bằng chứng runtime: token CSRF ngắn trả 500 và role 2 gọi tìm kiếm log admin trả 200. Không chạy thử đọc/ghi vượt thư mục hoặc xóa log. Xem analysis/runtime-verification.json.\n\n';
function section(name, findings, title, refs) {
  text += `## ${name}\n\n| Mã | Mức | Vấn đề | Vị trí nguồn |\n|---|---|---|---|\n`;
  for (const [i, f] of findings.entries()) text += `| ${f.id} | ${f.severity} | ${cell(title(f,i))} | ${cell(refs(f))} |\n`;
  text += '\n';
}
section('MAIN_SERVER — 29 ghi nhận', main.findings, (f,i) => mainTitles[i] || f.title, f => f.evidence.map(e => `${e.file}:${e.line}`).join('; '));
section('Frontend — 20 ghi nhận', frontend.findings, f => f.title, f => [`${f.source.file}:${f.source.line}`, ...(f.related || []).map(e => `${e.file}:${e.line}`)].join('; '));
section('ZL_SERVER và FILES_SERVER — 20 ghi nhận', zalo.findings, f => zlTitles[f.id] || f.title, f => f.refs.join('; '));
text += '## Cách đọc bằng chứng\n\nNguồn ZL bị làm rối nằm một dòng dài; vị trí analysis/readable/... là bản sao giải mã tĩnh để đọc. Nguồn runtime vẫn ở recovered/. Các mục ZL-DORMANT chỉ module không mount, không phải lỗ hổng API hoạt động hiện tại. MAIN có thể đã chặn quyền một route mà worker không chặn; vì vậy vấn đề OA được mô tả ở ranh giới worker, không kết luận user thường đã qua được gateway OA.\n\n';
text += 'Chi tiết điều kiện, tác động, mức chắc chắn và hướng sửa: analysis/main-findings.json, analysis/frontend-findings.json, analysis/zalo-findings.json. Schema suy ra có thể làm phép tính chuỗi DECIMAL xuất hiện đúng như cảnh báo; các phép tính phí thật chưa nằm trong smoke đọc dữ liệu trống.\n';
output('ISSUES.vi.md', text);
console.log(`Built feature matrix (${frontend.feature_matrix.length}), gateway API reference (${main.endpoints.length}) and issue index (${main.findings.length + frontend.findings.length + zalo.findings.length} component findings).`);
