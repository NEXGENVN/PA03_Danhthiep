// Browser-native API adapter. Demo state is synthetic and never calls a provider.
import { demoShareApi, DEMO_SHARE_KEY } from './phone-share-demo.js';
const DEMO_KEY = 'pa03.ui.demo.v1';
const SESSION_KEY = 'pa03.ui.live-session.v1';
const MODE_KEY = 'pa03.ui.mode.v1';
const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const ago = hours => new Date(Date.now() - hours * 3600000).toISOString();
const future = hours => new Date(Date.now() + hours * 3600000).toISOString();

function userAliases(user) {
  if (!user) return null;
  const userName = user.userName ?? user.username ?? 'Người dùng';
  const totalMoney = Number(user.totalMoney ?? user.balance ?? 0);
  const userRole = user.userRole ?? user.role ?? 2;
  return { ...user, userName, username: userName, totalMoney, balance: totalMoney, userRole, role: userRole, fullname: user.fullname ?? userName };
}

export function seedDemo() {
  const accounts = ['CSKH · Miền Bắc', 'Tư vấn · Miền Trung', 'CSKH · Miền Nam', 'Chăm sóc đối tác', 'Nhóm sự kiện'].map((displayName, index) => ({
    UID: `demo-zalo-${index + 1}`, displayName, phoneNumber: `000000100${index + 1}`,
    Avatar: '', accStatus: index === 3 ? 'Hết phiên đăng nhập' : 'Đang hoạt động', ImportTime: ago(24 * (index + 1)),
    isSystemAccount: index === 0, userID: 1,
  }));
  const products = [
    { productID: 1, productName: 'Bộ công cụ kết nối', productDesc: 'Bản quyền mẫu cho quy trình gửi và kiểm tra trạng thái.', productOnePrice: 49000, productFivePrice: 199000, productTenPrice: 349000 },
    { productID: 2, productName: 'Không gian liên kết', productDesc: 'Quản lý chiến dịch, tên miền và mẫu nội dung.', productOnePrice: 79000, productFivePrice: 299000, productTenPrice: 499000 },
    { productID: 3, productName: 'Bộ công cụ doanh nghiệp', productDesc: 'Bộ tính năng mở rộng dành cho nhóm vận hành.', productOnePrice: 99000, productFivePrice: 399000, productTenPrice: 699000 },
  ].map(product => ({ ...product, productImage: '', isActive: 1, createdAt: ago(720) }));
  const requests = Array.from({ length: 8 }, (_, index) => ({
    reqID: 108 - index, id: 108 - index, phoneNumber: `000000200${index + 1}`, UID: `demo-target-${index + 1}`,
    displayName: ['Khách hàng mẫu A', 'Khách hàng mẫu B', 'Đối tác mẫu C', 'Khách hàng mẫu D'][index % 4],
    Avatar: '', imageUrl: 'https://example.test/assets/demo-card.png', sendResult: index === 3 ? 'FAILED' : 'SUCCESS',
    Detail: index === 3 ? 'Demo · Phiên đăng nhập cần được làm mới' : index === 5 ? 'Demo · Hoạt động lần cuối cách đây 15 phút' : 'Demo · Đã mô phỏng gửi ảnh thành công',
    created_at: ago(index * 2 + 0.25), createdAt: ago(index * 2 + 0.25), fee_charged: index === 3 ? 0 : 20000,
    use_system_account: index % 2, sender_zalo_uid: accounts[index % accounts.length].UID, userID: 1, userName: 'dieuphoi_demo', type: index === 5 ? 'check-status' : index % 2 ? 'card' : 'phone',
  }));
  const licenses = products.map((product, index) => ({
    id: index + 1, licenseKey: `DEMO-${['CONNECT', 'LINKS', 'BUSINESS'][index]}-000${index + 1}`, productID: product.productID,
    productName: product.productName, countDown: [5, 10, 1][index], licenseStatus: index === 2 ? 1 : 0, status: index === 2 ? 1 : 0,
    licenseTypeName: `${[5, 10, 1][index]} lần`, pricePaid: [199000, 499000, 99000][index], purchaseTime: ago(48 + index * 24),
    activeTime: index === 2 ? ago(24) : null, createdAt: ago(48 + index * 24), updatedAt: ago(12), userID: 1, userName: 'dieuphoi_demo', expiresAt: future(24 * 180),
  }));
  const users = [
    { userID: 1, userName: 'dieuphoi_demo', fullname: 'Điều phối demo', email: 'dieuphoi@example.test', userRole: 1, totalMoney: 1850000 },
    { userID: 2, userName: 'cskh_demo', fullname: 'Chăm sóc khách hàng', email: 'cskh@example.test', userRole: 3, totalMoney: 650000 },
    { userID: 3, userName: 'doitac_demo', fullname: 'Đối tác demo', email: 'doitac@example.test', userRole: 2, totalMoney: 120000 },
    { userID: 4, userName: 'sukien_demo', fullname: 'Nhóm sự kiện', email: 'sukien@example.test', userRole: 3, totalMoney: 420000 },
    { userID: 5, userName: 'tamngung_demo', fullname: 'Tài khoản tạm ngưng', email: 'tamngung@example.test', userRole: 2, totalMoney: 0 },
  ].map((user, index) => ({ ...user, isActive: index === 4 ? 0 : 1, createdAt: ago(720 + index * 24), lastLogin: ago(index * 3 + 1) }));
  return {
    version: 1, currentUserID: 1, accounts, requests, products, licenses, users,
    schedules: [0, 1, 2].map(index => ({ id: index + 1, jobID: `DEMO-JOB-00${index + 1}`, phoneNumber: `000000300${index + 1}`, targetName: ['Nhắc lịch tư vấn', 'Thông báo sự kiện', 'Chăm sóc đối tác'][index], displayName: ['Nhắc lịch tư vấn', 'Thông báo sự kiện', 'Chăm sóc đối tác'][index], type: index === 1 ? 'card' : 'v2', status: index === 2 ? 3 : 0, runTime: index === 2 ? ago(2) : future(index + 1), scheduled_at: index === 2 ? ago(2) : future(index + 1), created_at: ago(8), zaloUID: accounts[0].UID, userID: 1 })),
    oaTemplates: [
      { id: 1, template_id: 'DEMO-1001', template_name: 'Xác nhận đơn hàng', detail: 'Đơn hàng <order_code> đã được ghi nhận. Cảm ơn <customer_name>.', params: 'customer_name,order_code,price,date', status: 'approved' },
      { id: 2, template_id: 'DEMO-1002', template_name: 'Nhắc lịch hẹn', detail: 'Xin chào <customer_name>, lịch hẹn của bạn vào <date>.', params: 'customer_name,date,status', status: 'approved' },
      { id: 3, template_id: 'DEMO-1003', template_name: 'Thông báo giao hàng', detail: 'Đơn <order_code> đang được giao.', params: 'order_code,status', status: 'approved' },
    ],
    oaResults: [0, 1, 2].map(index => ({ id: index + 1, order_code: `DEMO-BC00000${index + 1}`, phone_number: `000000400${index + 1}`, template_id: `DEMO-100${index + 1}`, msg_id: `demo-msg-${index + 1}`, result: index === 2 ? 'error' : 'success', detail: index === 2 ? 'Demo · Người nhận chưa quan tâm OA' : 'Demo · Mô phỏng gửi thành công', msg_status: index === 0 ? 'Đã nhận (demo)' : 'Đang xử lý (demo)', created_at: ago(index + 1) })),
    oaToken: { id: 1, access_token: 'DEMO_ACCESS_TOKEN_KHONG_CO_GIA_TRI', refresh_token: 'DEMO_REFRESH_TOKEN_KHONG_CO_GIA_TRI', expires_at: future(24), updated_at: ago(1) },
    linkTemplates: [
      { id: 1, name: 'Giới thiệu sự kiện', link: 'https://example.test/events/connect', title: 'Hẹn gặp tại ngày hội kết nối', description: 'Nội dung minh họa cho chiến dịch tháng 11.', image: 'https://example.test/assets/event.png', thumbnail: 'https://example.test/assets/event.png', content: 'Nội dung mẫu sự kiện', html: '<p>Nội dung mẫu sự kiện</p>', created_at: ago(48) },
      { id: 2, name: 'Thông tin sản phẩm', link: 'https://example.test/products/business', title: 'Khám phá bộ công cụ mới', description: 'Một trang giới thiệu ngắn dành cho đối tác.', image: 'https://example.test/assets/product.png', thumbnail: 'https://example.test/assets/product.png', content: 'Nội dung mẫu sản phẩm', html: '<p>Nội dung mẫu sản phẩm</p>', created_at: ago(24) },
    ],
    domains: [{ id: 1, domain: 'campaign.example.test', name: 'campaign.example.test', status: 'active', is_active: 1, created_at: ago(240) }, { id: 2, domain: 'go.example.test', name: 'go.example.test', status: 'active', is_active: 1, created_at: ago(120) }],
    links: [
      { id: 1, name: 'Ngày hội kết nối', title: 'Ngày hội kết nối', slug: 'ngay-hoi', link: 'https://example.test/events/connect', target_url: 'https://example.test/events/connect', original_url: 'https://example.test/events/connect', short_url: 'https://campaign.example.test/ngay-hoi', url: 'https://campaign.example.test/ngay-hoi', template_id: 1, domain_id: 1, location_type: 0, clicks: 128, total_clicks: 128, status: 'active', created_at: ago(20) },
      { id: 2, name: 'Bộ công cụ doanh nghiệp', title: 'Bộ công cụ doanh nghiệp', slug: 'bo-cong-cu', link: 'https://example.test/products/business', target_url: 'https://example.test/products/business', original_url: 'https://example.test/products/business', short_url: 'https://go.example.test/bo-cong-cu', url: 'https://go.example.test/bo-cong-cu', template_id: 2, domain_id: 2, location_type: 1, clicks: 64, total_clicks: 64, status: 'active', created_at: ago(12) },
    ],
    linkResults: [0, 1, 2].map(index => ({ id: index + 1, link_id: index % 2 + 1, link_name: index % 2 ? 'Bộ công cụ doanh nghiệp' : 'Ngày hội kết nối', result: { ip: `192.0.2.${index + 10}`, device: index % 2 ? 'Mobile' : 'Desktop', city: 'Hà Nội (demo)' }, title: 'Lượt truy cập minh họa', ip: `192.0.2.${index + 10}`, ip_address: `192.0.2.${index + 10}`, user_agent: index % 2 ? 'Demo / Mobile' : 'Demo / Desktop', browser: 'Trình duyệt mẫu', device: index % 2 ? 'Mobile' : 'Desktop', country: 'VN (demo)', city: 'Hà Nội (demo)', created_at: ago(index + 1) })),
    thumbnailResults: [{ id: 1, link_id: 1, link_name: 'Ngày hội kết nối', result: { ip: '192.0.2.20', user_agent: 'Demo / Desktop', thumbnail: 'https://example.test/assets/event.png' }, ip: '192.0.2.20', ip_address: '192.0.2.20', title: 'Ảnh sự kiện (demo)', thumbnail: 'https://example.test/assets/event.png', user_agent: 'Demo / Desktop', created_at: ago(2) }],
    leaks: [{ id: 1, type: 'email', searchType: 'email', searchValue: 'khachhang@example.test', value: 'khachhang@example.test', query: 'khachhang@example.test', result_count: 2, resultsCount: 2, resultsData: [{ name: 'Khách hàng mẫu A', email: 'khachhang@example.test', source: 'Nguồn minh họa' }, { name: 'Khách hàng mẫu B', email: 'doitac@example.test', source: 'Ví dụ đào tạo' }], results: 2, fee: 5000, fee_charged: 5000, userID: 1, userName: 'dieuphoi_demo', created_at: ago(5), status: 'completed' }, { id: 2, type: 'phone', searchType: 'phone', searchValue: '0000005001', value: '0000005001', query: '0000005001', result_count: 1, resultsCount: 1, resultsData: [{ name: 'Khách hàng mẫu C', phone: '0000005001', source: 'Nguồn minh họa' }], results: 1, fee: 5000, fee_charged: 5000, userID: 2, userName: 'cskh_demo', created_at: ago(8), status: 'completed' }],
    deposits: [
      { id: 1, addInfo: 'DEMO-NAP-001', orderCode: 'DEMO-NAP-001', amount: 1000000, status: 'PAID', created_at: ago(72), createdAt: ago(72), paid_at: ago(71), description: 'Demo · Nạp ví đã hoàn tất' },
      { id: 2, addInfo: 'DEMO-NAP-002', orderCode: 'DEMO-NAP-002', amount: 300000, status: 'PENDING', created_at: ago(1), createdAt: ago(1), description: 'Demo · Đang chờ thanh toán', checkoutUrl: 'https://example.test/demo-payment/002' },
      { id: 3, addInfo: 'DEMO-NAP-003', orderCode: 'DEMO-NAP-003', amount: 200000, status: 'CANCELLED', created_at: ago(24), createdAt: ago(24), description: 'Demo · Đã hủy' },
    ],
    ipBlocks: [{ id: 1, ipAddress: '192.0.2.40', ip: '192.0.2.40', reason: 'Demo · Vượt số lần đăng nhập', blockedAt: ago(2), blocked_at: ago(2), expiresAt: future(2), blockType: 'manual', isActive: 1 }, { id: 2, ipAddress: '192.0.2.41', ip: '192.0.2.41', reason: 'Demo · Kiểm tra giới hạn truy cập', blockedAt: ago(1), blocked_at: ago(1), expiresAt: future(1), blockType: 'manual', isActive: 1 }],
    logs: [
      { id: 1, userID: 1, userName: 'dieuphoi_demo', action: 'LOGIN', method: 'POST', endpoint: '/api/auth/login', path: '/api/auth/login', status: 'success', statusCode: 200, ip: '192.0.2.10', ipAddress: '192.0.2.10', message: 'Demo · Đăng nhập không gian làm việc', created_at: ago(1), createdAt: ago(1) },
      { id: 2, userID: 1, userName: 'dieuphoi_demo', action: 'SEND_IMAGE', method: 'POST', endpoint: '/api/send-image-v2/send', path: '/api/send-image-v2/send', status: 'success', statusCode: 200, ip: '192.0.2.10', ipAddress: '192.0.2.10', message: 'Demo · Mô phỏng gửi ảnh thành công', created_at: ago(2), createdAt: ago(2) },
      { id: 3, userID: 2, userName: 'cskh_demo', action: 'RATE_LIMIT', method: 'GET', endpoint: '/api/logs', path: '/api/logs', status: 'warning', statusCode: 429, ip: '192.0.2.40', ipAddress: '192.0.2.40', message: 'Demo · Yêu cầu vượt giới hạn', created_at: ago(3), createdAt: ago(3) },
    ].map((entry, index) => ({ ...entry, event_type: entry.action, response_status: entry.statusCode, response_time_ms: 32 + index * 14, ip_address: entry.ipAddress })),
    toolSetup: { STT: 1, uid_zalo_system: accounts[0].UID, zalo_system_money: 30000, zalo_custom_money: 20000, check_phone_system_money: 10000, check_phone_custom_money: 5000, check_card_money: 5000, check_data_leak_money: 5000 },
  };
}

function browserStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

function apiPath(value) {
  const text = String(value);
  if (!/^\/(?!\/)/.test(text) || text.includes('\\') || text.includes('#') || text.includes('..')) throw new Error('Chỉ chấp nhận đường dẫn API same-origin.');
  return text.startsWith('/api/') || text === '/api' ? text : `/api${text}`;
}

function safeBody(body) {
  const raw = typeof FormData !== 'undefined' && body instanceof FormData ? Object.fromEntries(body.entries()) : typeof body === 'string' ? JSON.parse(body) : body || {};
  const safe = { ...raw };
  for (const key of ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'IMEI', 'ENCRYPTION_KEY', 'COOKIE_ZPW_SEK', 'cookie', 'accessToken']) delete safe[key];
  return safe;
}

function rejectedCsrf(error) {
  if (error.status !== 403) return false;
  const response = error.response || {};
  const reason = [response.code, response.error_code, response.errorCode, response.message]
    .filter(value => typeof value === 'string').join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /csrf/.test(reason) && /invalid|missing|expired|mismatch|badcsrf|not[_\s-]*found|khong hop le|khong khop|het han|thieu/.test(reason);
}

export function createClient({ mode, storage = browserStorage(), fetchImpl = globalThis.fetch?.bind(globalThis) } = {}) {
  const getSaved = (key, fallback) => { try { const value = storage?.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
  const putSaved = (key, value) => { try { storage?.setItem(key, JSON.stringify(value)); } catch { /* In-memory demo remains usable when storage is full/disabled. */ } };
  const removeSaved = key => { try { storage?.removeItem(key); } catch { /* Storage may be disabled. */ } };
  let currentMode = mode || getSaved(MODE_KEY, 'demo');
  if (!['demo', 'live'].includes(currentMode)) currentMode = 'demo';
  let state = getSaved(DEMO_KEY, null);
  if (!state || state.version !== 1 || !Array.isArray(state.users) || !Array.isArray(state.accounts)) state = seedDemo();
  let session = getSaved(SESSION_KEY, null);
  const profile = () => state.users.find(user => String(user.userID) === String(state.currentUserID)) || state.users[0];
  const persist = () => putSaved(DEMO_KEY, state);
  const ok = (data, message = 'Dữ liệu minh họa', extra = {}) => clone({ success: true, demo: true, message: `Demo · ${message}`, data, ...extra });
  const fail = (message, data) => { const error = new Error(`Demo · ${message}`); error.data = data; throw error; };
  const charge = amount => {
    const fee = Number(amount);
    if (!Number.isFinite(fee) || fee < 0) fail('Mức phí không hợp lệ.');
    const user = profile();
    if (Number(user.totalMoney) < fee) fail('Số dư không đủ để thực hiện yêu cầu này.', { currentBalance: user.totalMoney, requiredAmount: fee, shortage: fee - user.totalMoney });
    user.totalMoney = Number(user.totalMoney) - fee;
    return user.totalMoney;
  };
  const nextID = list => Math.max(0, ...list.map(row => Number(row.id ?? row.reqID ?? row.productID ?? row.userID) || 0)) + 1;
  const list = (items, params, message) => {
    let values = items;
    const query = (params.get('search') || params.get('q') || params.get('keyword') || '').toLocaleLowerCase('vi');
    if (query) values = values.filter(item => JSON.stringify(item).toLocaleLowerCase('vi').includes(query));
    for (const key of ['sendResult', 'status', 'userRole', 'type', 'userID', 'productID', 'userName']) {
      const value = params.get(key);
      if (value && value !== 'all') values = values.filter(item => String(item[key] ?? item.licenseStatus ?? item.result) === value);
    }
    const limit = Math.min(100, Math.max(1, Number(params.get('limit')) || 50));
    const page = Math.max(1, Number(params.get('page')) || 1);
    return ok(values.slice((page - 1) * limit, page * limit), message, { pagination: { page, limit, total: values.length, totalPages: Math.ceil(values.length / limit) }, total: values.length });
  };
  function eventLog(path, method) {
    const user = profile();
    state.logs.unshift({ id: nextID(state.logs), userID: user.userID, userName: user.userName, action: 'DEMO_ACTION', event_type: 'DEMO_ACTION', method, endpoint: path, path, status: 'success', statusCode: 200, response_status: 200, response_time_ms: 1, ip: '192.0.2.10', ipAddress: '192.0.2.10', ip_address: '192.0.2.10', message: `Demo · ${method} ${path}`, created_at: now(), createdAt: now() });
  }
  function crud(collection, idKey, segments, method, body, params) {
    const items = state[collection];
    const identifier = segments[0];
    const index = items.findIndex(item => String(item[idKey]) === identifier || String(item.id) === identifier);
    if (method === 'GET') {
      if (!identifier) return list(items, params);
      if (index < 0) fail('Không tìm thấy bản ghi.');
      return ok(items[index]);
    }
    if (method === 'POST' && !identifier) {
      const id = nextID(items);
      const value = { id, created_at: now(), createdAt: now(), ...body };
      value[idKey] ??= idKey === 'UID' ? `demo-zalo-${id}` : idKey === 'licenseKey' ? `DEMO-KEY-${id}` : idKey === 'ipAddress' ? body.ip || body.ip_address : id;
      if (items.some(item => String(item[idKey]) === String(value[idKey]))) fail('Mã bản ghi đã tồn tại.');
      if (collection === 'accounts') Object.assign(value, { accStatus: body.accStatus || 'Đang hoạt động', ImportTime: now(), Avatar: body.Avatar || '', userID: profile().userID });
      if (collection === 'users') Object.assign(value, { userName: body.userName || body.username || `demo_user_${id}`, totalMoney: Number(body.totalMoney ?? body.balance ?? 0), userRole: body.userRole || body.role || 2, isActive: Number(body.isActive ?? 1) });
      if (collection === 'products') Object.assign(value, { isActive: Number(body.isActive ?? 1), productOnePrice: Number(body.productOnePrice || 0), productFivePrice: Number(body.productFivePrice || 0), productTenPrice: Number(body.productTenPrice || 0) });
      if (collection === 'ipBlocks') Object.assign(value, { ip: value.ipAddress, blockedAt: now(), blocked_at: now(), expiresAt: future(Number(body.duration || body.durationHours || 24)), isActive: 1 });
      if (collection === 'links') {
        const domain = state.domains.find(item => String(item.id) === String(body.domain_id))?.domain || 'go.example.test';
        Object.assign(value, { clicks: 0, status: 'active', short_url: `https://${domain}/${body.slug || `demo-${id}`}`, url: `https://${domain}/${body.slug || `demo-${id}`}` });
      }
      items.unshift(value); persist(); return ok(value, 'Đã thêm bản ghi minh họa');
    }
    if (index < 0) fail('Không tìm thấy bản ghi.');
    if (['PUT', 'PATCH'].includes(method)) {
      Object.assign(items[index], body, { [idKey]: items[index][idKey], updatedAt: now() });
      if (collection === 'users' && ('totalMoney' in body || 'balance' in body)) items[index].totalMoney = Number(body.totalMoney ?? body.balance);
      persist(); return ok(items[index], 'Đã cập nhật bản ghi minh họa');
    }
    if (method === 'DELETE') {
      if (collection === 'users' && String(items[index].userID) === String(state.currentUserID)) fail('Không thể xóa tài khoản demo đang sử dụng.');
      const [removed] = items.splice(index, 1); persist(); return ok(removed, 'Đã xóa bản ghi minh họa');
    }
    fail('Thao tác này chưa được hỗ trợ trong demo.');
  }
  function demoApi(path, method, rawBody) {
    const url = new URL(path, 'http://demo.invalid');
    const route = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
    const params = url.searchParams;
    const body = safeBody(rawBody);
    const pieces = route.split('/').filter(Boolean).map(decodeURIComponent);
    const user = profile();
    const setup = state.toolSetup;
    const isSystem = !body.zaloUID || body.zaloUID === 'SYSTEM' || String(body.zaloUID) === String(setup.uid_zalo_system);
    const perRequestFee = Number(route.includes('send-image-by-card') || !isSystem ? setup.zalo_custom_money : setup.zalo_system_money) + (body.imageType === 'custom' ? 5000 : 0);
    const ipTypes = body.ipType === 'both' ? ['ipv4', 'ipv6'] : [body.ipType || 'ipv4'];
    const phoneFee = perRequestFee * ipTypes.length;
    const statusFee = Number(body.type === 'card' ? setup.check_card_money : isSystem ? setup.check_phone_system_money : setup.check_phone_custom_money);
    const targetProfile = { uid: body.userUID || body.targetUID || body.targetUserId || 'demo-target-preview', userId: body.userUID || body.targetUID || body.targetUserId || 'demo-target-preview', displayName: body.displayName || body.targetName || 'Khách hàng minh họa', zaloName: 'Khách hàng minh họa', avatar: '', phoneNumber: body.phoneNumber || body.phone_number || '0000002001' };
    if (route === '/auth/profile' && method === 'GET') return ok(userAliases(user));
    if (route === '/auth/change-password') {
      const values = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody || {};
      if (!values.currentPassword || String(values.newPassword || '').length < 6) fail('Nhập mật khẩu hiện tại và mật khẩu mới ít nhất 6 ký tự.');
      return ok(null, 'Đã mô phỏng đổi mật khẩu; không lưu mật khẩu');
    }
    if (route === '/auth/profile' && ['PUT', 'PATCH'].includes(method)) { Object.assign(user, body); persist(); return ok(userAliases(user), 'Đã cập nhật hồ sơ minh họa'); }
    if (['/csrf-token', '/auth/csrf-token'].includes(route)) return ok(null, 'Token demo', { token: 'DEMO-CSRF-NOT-VALID' });
    if (route === '/admin/tool-setup') {
      if (['PUT', 'PATCH'].includes(method)) {
        for (const [key, value] of Object.entries(body)) { if (key.endsWith('_money') && (!Number.isFinite(Number(value)) || Number(value) < 0)) fail('Mức phí phải là số không âm.'); }
        Object.assign(setup, body); persist();
      }
      return ok({ ...setup, systemAccount: state.accounts.find(account => account.UID === setup.uid_zalo_system) || null }, method === 'GET' ? 'Cấu hình mẫu' : 'Đã lưu cấu hình minh họa');
    }
    if (route === '/admin/stats') return ok({ totalUsers: state.users.length, totalZaloAccounts: state.accounts.length, totalAccounts: state.accounts.length, totalRequests: state.requests.length, totalRevenue: state.requests.reduce((sum, item) => sum + Number(item.fee_charged || 0), 0), activeUsers: state.users.filter(item => item.isActive).length, totalBalance: state.users.reduce((sum, item) => sum + Number(item.totalMoney), 0) });
    if (route === '/send-image/stats') return ok({ total: state.requests.length, totalRequests: state.requests.length, success: state.requests.filter(item => item.sendResult === 'SUCCESS').length, successCount: state.requests.filter(item => item.sendResult === 'SUCCESS').length, failed: state.requests.filter(item => item.sendResult !== 'SUCCESS').length, totalFees: state.requests.reduce((sum, item) => sum + Number(item.fee_charged), 0) });
    if (['/send-image/history', '/admin/requests'].includes(route)) return list(state.requests, params);
    if (['/zalo-timer/history', '/send-image-v2-timer/history', '/send-image-by-card-timer/history'].includes(route)) return list(state.schedules, params);
    if (['/send-image-v2/zalo-accounts', '/send-image-by-card/personal-accounts', '/admin/zalo-accounts'].includes(route)) return list(state.accounts, params);
    if (route === '/zalo-accounts/check-all-status') {
      state.accounts.forEach(account => { account.accStatus = 'Đang hoạt động'; }); persist();
      return ok(state.accounts, 'Đã mô phỏng kiểm tra tất cả tài khoản', { total: state.accounts.length, active: state.accounts.length });
    }
    if (pieces[0] === 'zalo-accounts' && pieces[2] === 'check-status') {
      const account = state.accounts.find(item => item.UID === pieces[1]);
      if (!account) fail('Không tìm thấy tài khoản.');
      account.accStatus = 'Đang hoạt động'; persist(); return ok(account, 'Đã mô phỏng kiểm tra phiên đăng nhập', { status: account.accStatus });
    }
    if (route === '/zalo-accounts/auto-fetch') {
      const value = { UID: body.UID || `demo-zalo-${nextID(state.accounts) + 10}`, displayName: body.displayName || 'Tài khoản nhập tự động (demo)', phoneNumber: '0000001099' };
      return crud('accounts', 'UID', [], 'POST', value, params);
    }
    if (route === '/send-image-v2/search') return ok(targetProfile, 'Đã mô phỏng tìm người nhận', { feeInfo: { feeAmount: phoneFee, currentBalance: user.totalMoney, balanceAfterFee: user.totalMoney - phoneFee, isSystemAccount: isSystem } });
    if (route === '/send-image-by-card/decode-fid') return ok({ ...targetProfile, fee: phoneFee, currentBalance: user.totalMoney }, 'Đã mô phỏng giải mã danh thiếp');
    if (route === '/check-status/pre-check') return ok({ profile: targetProfile, fee: statusFee, isSystemAccount: isSystem, currentBalance: user.totalMoney, totalMoney: user.totalMoney }, 'Xem trước trạng thái và phí minh họa');
    if (route === '/check-status/confirm') {
      const balance = charge(statusFee);
      const result = { ...targetProfile, lastOnline: Date.now() - 900000, lastOnlineText: '15 phút trước (demo)' };
      state.requests.unshift({ reqID: nextID(state.requests), id: nextID(state.requests), ...targetProfile, UID: targetProfile.userId, sendResult: 'SUCCESS', Detail: 'Demo · Hoạt động lần cuối cách đây 15 phút', fee_charged: statusFee, created_at: now(), use_system_account: isSystem ? 1 : 0, userID: user.userID, type: 'check-status' });
      persist(); return ok(result, 'Đã mô phỏng kiểm tra trạng thái', { newBalance: balance });
    }
    if (['/send-image', '/send-image-v2/send', '/send-image-by-card/send'].includes(route)) {
      if (!body.phoneNumber && !body.targetUID && !body.userUID) fail('Nhập số điện thoại hoặc người nhận để mô phỏng.');
      const balance = charge(phoneFee);
      const reqID = nextID(state.requests);
      const records = ipTypes.map((ipType, index) => ({ reqID: reqID + index, id: reqID + index, ...targetProfile, UID: targetProfile.userId, sendResult: 'SUCCESS', Detail: 'Demo · Đã mô phỏng gửi ảnh; không có tin nhắn thật được gửi', fee_charged: perRequestFee, created_at: now(), sender_zalo_uid: body.zaloUID || setup.uid_zalo_system, use_system_account: isSystem ? 1 : 0, userID: user.userID, type: route.includes('card') ? 'card' : 'phone', ipType }));
      state.requests.unshift(...records); persist();
      return ok({ ...records[0], requestId: reqID, profile: targetProfile, fee: phoneFee, feeCharged: phoneFee, newBalance: balance, results: records.map(row => ({ reqID: row.reqID, type: row.ipType, success: true, result: 'SUCCESS', detail: row.Detail })) }, 'Đã mô phỏng gửi ảnh', { newBalance: balance });
    }
    if (['/send-image-v2-timer/send', '/send-image-by-card-timer/send', '/zalo-timer/send'].includes(route)) {
      if (!body.runTime || !Number.isFinite(Date.parse(body.runTime)) || Date.parse(body.runTime) <= Date.now()) fail('Chọn thời gian hẹn trong tương lai.');
      const id = nextID(state.schedules);
      const row = { ...body, id, jobID: `DEMO-JOB-${id}`, type: route.includes('card') ? 'card' : 'v2', status: 0, scheduled_at: body.runTime, created_at: now(), displayName: targetProfile.displayName, userID: user.userID };
      state.schedules.unshift(row); persist(); return ok(row, 'Đã lưu lịch mô phỏng; tác vụ không gửi tin nhắn thật');
    }
    if (route === '/zalo/upload-custom-image' || route === '/link/upload-thumbnail') {
      const imageUrl = 'https://example.test/assets/demo-upload.png';
      return ok({ url: imageUrl, imageUrl, thumbnail: imageUrl, filename: 'demo-upload.png' }, 'Đã mô phỏng tải ảnh', { url: imageUrl, imageUrl, thumbnail: imageUrl });
    }
    if (route === '/zalo-oa/token') return ok(state.oaToken);
    if (route === '/zalo-oa/token/refresh') { state.oaToken.expires_at = future(24); state.oaToken.updated_at = now(); persist(); return ok(state.oaToken, 'Đã mô phỏng làm mới token OA'); }
    if (route === '/zalo-oa/preview-data') return ok({ date: new Date().toLocaleDateString('vi-VN'), order_code: `DEMO-BC${nextID(state.oaResults)}`, customer_name: 'Khách hàng mẫu', price: 250000, status: 'Đang xử lý (demo)' });
    if (route === '/zalo-oa/fetch-new-templates') return ok([{ template_id: 'DEMO-1004', template_name: 'Cảm ơn khách hàng', params: 'customer_name,date', detail: 'Cảm ơn bạn đã đồng hành (demo).' }].filter(candidate => !state.oaTemplates.some(saved => String(saved.template_id) === String(candidate.template_id))), 'Đã tải danh sách mẫu đề xuất (mô phỏng)');
    if (route === '/zalo-oa/results') return list(state.oaResults, params);
    if (route === '/zalo-oa/message-status') {
      const record = state.oaResults.find(item => String(item.id) === params.get('id'));
      if (record) record.msg_status = 'Đã nhận (demo)';
      persist(); return ok('Đã nhận (demo)', 'Đã mô phỏng kiểm tra trạng thái tin OA');
    }
    if (['/zalo-oa/send-template', '/zalo-oa/send-template-uid'].includes(route)) {
      if (!(body.phone_number || body.user_id) || !body.template_id) fail('Nhập người nhận và chọn mẫu OA.');
      const id = nextID(state.oaResults);
      const row = { id, order_code: `DEMO-BC${id}`, phone_number: body.phone_number || body.user_id, template_id: Array.isArray(body.template_id) ? body.template_id.join(', ') : body.template_id, msg_id: `demo-msg-${id}`, result: 'success', detail: 'Demo · Đã mô phỏng gửi mẫu OA', msg_status: 'Đã nhận (demo)', created_at: now() };
      state.oaResults.unshift(row); persist();
      const result = { error: 0, message: 'Demo · Thành công mô phỏng', data: { msg_id: row.msg_id } };
      return ok(row, 'Đã mô phỏng gửi mẫu OA', { result, results: [result], payload_sent: { phone: body.phone_number, user_id: body.user_id, template_ids: Array.isArray(body.template_id) ? body.template_id : [body.template_id], template_data: body.custom_params || {} } });
    }
    if (route === '/check-ip/location') {
      const ip = body.ip || body.ipAddress || body.ip_address || '192.0.2.10';
      return ok({ ip, ipAddress: ip, country: 'Việt Nam (demo)', country_name: 'Việt Nam (demo)', countryCode: 'VN', region: 'Hà Nội (demo)', regionName: 'Hà Nội (demo)', city: 'Hà Nội (demo)', isp: 'Mạng minh họa Example', org: 'Example Demo Network', timezone: 'Asia/Ho_Chi_Minh', lat: 21.0285, lon: 105.8542, latitude: 21.0285, longitude: 105.8542, query: ip, status: 'success' }, 'Kết quả vị trí hoàn toàn minh họa');
    }
    if (route === '/facebook/find-uid') return ok({ id: 'demo-facebook-1001', uid: 'demo-facebook-1001', link: body.link }, 'Đã mô phỏng đọc UID Facebook, không truy cập mạng');
    if (route === '/leak-lookup/pre-check') return ok({ fee: Number(setup.check_data_leak_money), currentBalance: user.totalMoney, totalMoney: user.totalMoney }, 'Xem trước phí tra cứu mẫu');
    if (['/leak-lookup/confirm', '/leak-lookup/phone', '/leak-lookup/email', '/leak-lookup/facebook'].includes(route)) {
      if (!body.value) fail('Nhập giá trị tra cứu mẫu.');
      const fee = Number(setup.check_data_leak_money);
      const balance = charge(fee);
      const type = body.type || pieces[1];
      const results = [{ name: 'Bản ghi minh họa A', full_name: 'Khách hàng mẫu A', email: 'khachhang@example.test', phone: '0000005001', source: 'Bộ dữ liệu tổng hợp demo', breach: 'Example Demo 2026', found_at: ago(120), note: 'Dữ liệu tổng hợp hư cấu, không phải kết quả tra cứu thật' }, { name: 'Bản ghi minh họa B', full_name: 'Khách hàng mẫu B', email: 'doitac@example.test', phone: '0000005002', source: 'Ví dụ đào tạo', breach: 'Example Training', note: 'Bản ghi tổng hợp minh họa' }];
      state.leaks.unshift({ id: nextID(state.leaks), type, searchType: type, searchValue: body.value, value: body.value, query: body.value, result_count: results.length, resultsCount: results.length, resultsData: results, results: results.length, fee, fee_charged: fee, userID: user.userID, userName: user.userName, status: 'completed', created_at: now() });
      persist(); return ok(results, 'Đã mô phỏng tra cứu bằng dữ liệu hư cấu', { results, charged: fee, fee, newBalance: balance, total: results.length });
    }
    if (['/leak-lookup/history', '/admin/leak-history'].includes(route)) return list(state.leaks, params);
    if (route === '/link/fetch-meta') return ok({ title: 'Trang giới thiệu minh họa', description: 'Nội dung xem trước được tạo trong demo, không truy cập URL bên ngoài.', image: 'https://example.test/assets/preview.png', thumbnail: 'https://example.test/assets/preview.png', url: body.link || body.url }, 'Đã tạo xem trước minh họa');
    if (route === '/link/results') return list(state.linkResults, params);
    if (route === '/link/results-thumbnail') return list(state.thumbnailResults, params);
    if (['/licenses/products', '/licenses'].includes(route)) return list(state.products.filter(product => product.isActive), params);
    if (route === '/licenses/my-licenses') return list(state.licenses.filter(item => String(item.userID) === String(user.userID)), params);
    if (route === '/licenses/purchase') {
      const licenseType = Number(body.licenseType);
      if (![1, 2, 3].includes(licenseType)) fail('licenseType chỉ chấp nhận 1, 2 hoặc 3.');
      const product = state.products.find(item => String(item.productID) === String(body.productID) && item.isActive);
      if (!product) fail('Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa.');
      const countDown = [1, 5, 10][licenseType - 1];
      const pricePaid = Number(product[['productOnePrice', 'productFivePrice', 'productTenPrice'][licenseType - 1]]);
      const newBalance = charge(pricePaid);
      const id = nextID(state.licenses);
      const license = { id, licenseKey: `DEMO-${product.productID}-${Date.now().toString(36).toUpperCase()}-${id}`, productID: product.productID, productName: product.productName, countDown, licenseStatus: 0, status: 0, licenseTypeName: `${countDown} lần`, pricePaid, purchaseTime: now(), createdAt: now(), userID: user.userID, userName: user.userName, expiresAt: future(24 * 180) };
      state.licenses.unshift(license); persist(); return ok({ license, pricePaid, newBalance }, 'Đã mua bản quyền minh họa', { newBalance });
    }
    if (route === '/payos/history') return list(state.deposits, params);
    if (route === '/payos/create') {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 10000) fail('Số tiền nạp mẫu tối thiểu là 10.000 ₫.');
      const id = nextID(state.deposits);
      const row = { id, addInfo: `DEMO-NAP-${id}`, orderCode: `DEMO-NAP-${id}`, amount, status: 'PENDING', created_at: now(), createdAt: now(), description: 'Demo · Yêu cầu nạp mẫu, không thu tiền', checkoutUrl: `https://example.test/demo-payment/${id}`, cashLink: `https://example.test/demo-payment/${id}` };
      state.deposits.unshift(row); persist(); return ok(row, 'Đã tạo yêu cầu nạp minh họa, ví chưa được cộng tiền', { ...row });
    }
    if (route === '/payos/cancel') {
      const row = state.deposits.find(item => item.addInfo === body.addInfo || String(item.orderCode) === String(body.orderCode));
      if (!row) fail('Không tìm thấy giao dịch.');
      if (row.status !== 'PENDING') fail('Chỉ hủy được giao dịch đang chờ.');
      row.status = 'CANCELLED'; persist(); return ok(row, 'Đã hủy giao dịch minh họa');
    }
    if (route === '/admin/products/stats') return ok({ totalProducts: state.products.length, activeProducts: state.products.filter(item => item.isActive).length, totalSales: state.licenses.length, totalRevenue: state.licenses.reduce((sum, item) => sum + item.pricePaid, 0) });
    if (route === '/admin/licenses/stats') return ok({ totalLicenses: state.licenses.length, activeLicenses: state.licenses.filter(item => item.status === 1).length, unusedLicenses: state.licenses.filter(item => item.status === 0).length, totalRevenue: state.licenses.reduce((sum, item) => sum + item.pricePaid, 0) });
    if (pieces[0] === 'admin' && pieces[1] === 'licenses' && ['revoke', 'extend'].includes(pieces[3])) {
      const license = state.licenses.find(item => item.licenseKey === pieces[2]);
      if (!license) fail('Không tìm thấy bản quyền.');
      if (pieces[3] === 'revoke') { license.status = 2; license.licenseStatus = 2; }
      else { const count = Number(body.count); if (!Number.isInteger(count) || count < 1) fail('Số lượt tăng không hợp lệ.'); license.countDown = Number(license.countDown) + count; }
      persist(); return ok({ ...license, newCountDown: license.countDown }, pieces[3] === 'revoke' ? 'Đã thu hồi bản quyền minh họa' : 'Đã tăng lượt dùng bản quyền minh họa');
    }
    if (route.startsWith('/logs') && route.endsWith('stats')) {
      const totalSuccess = state.logs.filter(item => item.statusCode < 400).length;
      const totalErrors = state.logs.length - totalSuccess;
      return ok({ totalLogs: state.logs.length, totalRequests: state.logs.length, successfulRequests: totalSuccess, failedRequests: totalErrors, uniqueIPs: 2, period: '7 ngày (demo)', summary: { totalRequests: state.logs.length, totalSuccess, totalErrors, avgResponseTime: 32, totalRateLimits: state.logs.filter(item => item.statusCode === 429).length, uniqueUsers: 2, uniqueIPs: 2 }, eventTypes: [{ event_type: 'LOGIN', count: 1 }, { event_type: 'SEND_IMAGE', count: 1 }], errorStats: [{ status: 429, count: 1 }], topUsers: [{ userName: user.userName, totalRequests: 2 }], topIPs: [{ ip: '192.0.2.10', count: 2 }] });
    }
    if (route === '/logs/admin/cleanup') { const deleted = Math.max(0, state.logs.length - 3); state.logs = state.logs.slice(0, 3); persist(); return ok({ deleted }, `Đã dọn ${deleted} nhật ký minh họa`); }
    if (route.startsWith('/logs')) return list(route.endsWith('security') ? state.logs.filter(item => item.statusCode >= 400) : state.logs, params);
    const resources = [
      ['/zalo-accounts', 'accounts', 'UID'], ['/zalo-oa/templates', 'oaTemplates', 'id'],
      ['/link/templates', 'linkTemplates', 'id'], ['/link/domains', 'domains', 'id'], ['/link/links', 'links', 'id'],
      ['/admin/users', 'users', 'userID'], ['/admin/ip-blocks', 'ipBlocks', 'ipAddress'], ['/admin/products', 'products', 'productID'], ['/admin/licenses', 'licenses', 'licenseKey'],
    ];
    const resource = resources.find(([prefix]) => route === prefix || route.startsWith(`${prefix}/`));
    if (resource) { const [prefix, collection, key] = resource; return crud(collection, key, route.slice(prefix.length).split('/').filter(Boolean).map(decodeURIComponent), method, body, params); }
    fail(`Chưa có thao tác demo cho ${method} ${route}.`);
  }
  async function request(path, options = {}) {
    if (!fetchImpl) throw new Error('Không thể kết nối máy chủ cục bộ.');
    let response;
    try { response = await fetchImpl(path, { credentials: 'same-origin', ...options }); }
    catch { throw new Error('Không thể kết nối máy chủ cục bộ. Kiểm tra dịch vụ đang chạy.'); }
    let result;
    try { result = await response.json(); }
    catch { throw new Error(`Dịch vụ chưa khả dụng (HTTP ${response.status || 'lỗi'}).`); }
    if (response.ok === false || result?.success === false) {
      const error = new Error(result?.message || `Dịch vụ chưa khả dụng (HTTP ${response.status || 'lỗi'}).`);
      error.status = response.status; error.data = result?.data; error.response = result; throw error;
    }
    const rotatedToken = response.headers?.get?.('X-New-CSRF-Token');
    if (rotatedToken && session) { session.csrfToken = rotatedToken; putSaved(SESSION_KEY, session); }
    return result;
  }
  async function liveApi(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    if (session?.token) headers.Authorization = `Bearer ${session.token}`;
    const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const publicAuth = ['/api/auth/login', '/api/auth/register', '/api/admin/login'].includes(path.split('?')[0]);
    const needsCsrf = mutating && !publicAuth;
    const refreshCsrf = async () => {
      session.csrfToken = null;
      putSaved(SESSION_KEY, session);
      const csrf = await request('/api/csrf-token', { headers: { Accept: 'application/json', Authorization: headers.Authorization } });
      session.csrfToken = csrf.token || csrf.data?.token;
      if (!session.csrfToken) throw new Error('Backend chưa cung cấp CSRF token.');
      headers['X-CSRF-Token'] = session.csrfToken;
      putSaved(SESSION_KEY, session);
    };
    if (needsCsrf) {
      if (!session?.token) throw new Error('Đăng nhập backend để thực hiện thao tác này.');
      if (!session.csrfToken) await refreshCsrf();
      headers['X-CSRF-Token'] = session.csrfToken;
    }
    const formData = typeof FormData !== 'undefined' && body instanceof FormData;
    if (body !== undefined && !formData) headers['Content-Type'] = 'application/json';
    const requestOptions = { method, headers, ...(body !== undefined ? { body: formData ? body : typeof body === 'string' ? body : JSON.stringify(body) } : {}) };
    let response;
    try { response = await request(path, requestOptions); }
    catch (error) {
      // MAIN rejects invalid CSRF before the action executes; other failures are never retried.
      if (!needsCsrf || !rejectedCsrf(error)) throw error;
      await refreshCsrf();
      response = await request(path, requestOptions);
    }
    // Preserve backend action metadata and nested list pagination; UI rows() unwraps collections.
    const result = response;
    if (path.split('?')[0] === '/api/auth/profile' && result.data && session) { session.user = userAliases(result.data); putSaved(SESSION_KEY, session); }
    const balance = result.newBalance ?? result.data?.newBalance;
    if (Number.isFinite(Number(balance)) && balance !== undefined && session?.user) { session.user.totalMoney = Number(balance); session.user.balance = Number(balance); putSaved(SESSION_KEY, session); }
    return result;
  }
  async function authenticate(endpoint, values) {
    if (currentMode === 'demo') return ok({ user: userAliases(profile()), token: 'DEMO-TOKEN-NOT-VALID' }, 'Đang sử dụng tài khoản minh họa');
    const body = { ...values, userName: values.userName || values.username };
    const result = await liveApi(endpoint, { method: 'POST', body });
    const data = result.data || result;
    if (data.token || data.accessToken) {
      session = { token: data.token || data.accessToken, csrfToken: null, user: userAliases(data.user || data.profile || data) };
      putSaved(SESSION_KEY, session);
    }
    return result;
  }
  return {
    get mode() { return currentMode; },
    get user() { return clone(currentMode === 'demo' ? userAliases(profile()) : userAliases(session?.user)); },
    async api(path, options = {}) {
      const endpoint = apiPath(path);
      const method = String(options.method || 'GET').toUpperCase();
      if (currentMode === 'live') return liveApi(endpoint, { ...options, method });
      if (endpoint.startsWith('/api/phone-share/')) return demoShareApi(storage, profile(), endpoint.slice(4).split('?')[0], method, options.body);
      const result = demoApi(endpoint, method, options.body);
      if (!['GET', 'HEAD'].includes(method)) { eventLog(endpoint.split('?')[0], method); persist(); }
      return result;
    },
    login(values) { return authenticate('/api/auth/login', values); },
    register(values) { return authenticate('/api/auth/register', values); },
    logout() { session = null; removeSaved(SESSION_KEY); },
    setMode(value) { if (!['demo', 'live'].includes(value)) throw new Error('Chế độ không hợp lệ.'); currentMode = value; putSaved(MODE_KEY, value); },
    resetDemo() { storage?.removeItem(DEMO_SHARE_KEY); state = seedDemo(); persist(); },
    health() { return request('/ui/status'); },
  };
}
