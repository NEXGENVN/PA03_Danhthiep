const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { rateLimit } = require('express-rate-limit');
const { ShareError, newShareRequest, publicShareRecord, ownerShareRecord, respondToShare, revokeShare } = require('../web/phone-share-model.js');

function validBaseURL(value) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('PHONE_SHARE_BASE_URL must be an HTTPS origin or local HTTP origin.');
  return url.origin;
}
function createPhoneShareRouter({ upstream, storeFile, baseURL, clock = Date.now }) {
  const base = validBaseURL(baseURL);
  const router = express.Router();
  const managed = '/api/phone-share/requests';
  const publicPath = '/ui/phone-share';
  function read() {
    if (!fs.existsSync(storeFile)) return [];
    const data = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    if (data.version !== 1 || !Array.isArray(data.requests) || data.requests.some(r => !r.id || !r.ownerID || !/^[a-f0-9]{64}$/.test(r.token) || !Number.isFinite(Date.parse(r.expiresAt)))) throw new Error('Invalid phone-share storage');
    return data.requests;
  }
  function save(records) {
    fs.mkdirSync(path.dirname(storeFile), { recursive: true, mode: 0o700 });
    const temp = `${storeFile}.tmp`;
    fs.writeFileSync(temp, JSON.stringify({ version: 1, requests: records }), { mode: 0o600 });
    fs.renameSync(temp, storeFile);
  }
  const action = fn => (req, res, next) => { Promise.resolve().then(() => fn(req, res, next)).catch(next); };
  router.use([managed, publicPath], (req, res, next) => {
    res.setHeader('Referrer-Policy', 'no-referrer');
    const origin = req.get('origin');
    const sameOrigin = `${req.protocol}://${req.get('host')}`;
    if (origin && origin !== sameOrigin && origin !== base) return res.status(403).json({ success: false, message: 'Yêu cầu phải xuất phát từ trang chia sẻ.' });
    if (!['GET', 'HEAD'].includes(req.method) && req.method !== 'DELETE' && !req.is('application/json')) return res.status(415).json({ success: false, message: 'Yêu cầu phải dùng JSON.' });
    next();
  }, express.json({ limit: '8kb' }));
  const limit = (max, windowMs) => rateLimit({ windowMs, limit: max, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' } });
  router.use(publicPath, limit(120, 15 * 60000));
  router.use(managed, action(async (req, res, next) => {
    const authorization = req.get('authorization');
    if (!/^Bearer \S+$/.test(authorization || '')) throw new ShareError(401, 'Đăng nhập để quản lý yêu cầu chia sẻ.');
    let response;
    try { response = await fetch(`${upstream}/api/auth/profile`, { headers: { Authorization: authorization }, signal: AbortSignal.timeout(5000), redirect: 'error' }); }
    catch { throw new ShareError(503, 'Không thể xác thực với backend. Vui lòng thử lại sau.'); }
    if (response.status === 401 || response.status === 403) throw new ShareError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    if (!response.ok) throw new ShareError(503, 'Backend chưa sẵn sàng để xác thực.');
    let profile;
    try { const data = await response.json(); if (data.success) profile = data.data; } catch { /* Fail closed below. */ }
    if (!profile || !/^[1-9]\d*$/.test(String(profile.userID)) || !profile.userName) throw new ShareError(401, 'Không xác thực được tài khoản.');
    if (profile.isActive !== undefined && ![1, '1', true].includes(profile.isActive)) throw new ShareError(403, 'Tài khoản đã ngừng hoạt động.');
    req.shareOwner = profile;
    next();
  }));
  const ownerRow = (records, req) => {
    const index = records.findIndex(r => r.id === req.params.id && r.ownerID === String(req.shareOwner.userID));
    if (index < 0) throw new ShareError(404, 'Không tìm thấy yêu cầu.');
    return index;
  };
  const tokenRow = (records, input) => {
    if (typeof input?.token !== 'string' || !/^[a-f0-9]{64}$/.test(input.token)) throw new ShareError(404, 'Liên kết không tồn tại hoặc đã bị xóa.');
    const index = records.findIndex(r => r.token === input.token);
    if (index < 0) throw new ShareError(404, 'Liên kết không tồn tại hoặc đã bị xóa.');
    return index;
  };
  router.get(managed, action((req, res) => res.json({ success: true, data: read().filter(r => r.ownerID === String(req.shareOwner.userID)).reverse().map(r => ownerShareRecord(r, base, false, clock())) })));
  router.post(managed, limit(30, 3600000), action((req, res) => {
    const record = newShareRequest(req.body || {}, req.shareOwner, clock());
    const records = read();
    if (records.length >= 10000 || records.filter(r => r.ownerID === record.ownerID).length >= 200) throw new ShareError(409, 'Đã đạt giới hạn 200 yêu cầu. Xóa yêu cầu cũ trước khi tạo thêm.');
    records.push(record); save(records);
    res.status(201).json({ success: true, data: ownerShareRecord(record, base, false, clock()) });
  }));
  router.post(`${managed}/:id/revoke`, action((req, res) => {
    const records = read(), index = ownerRow(records, req);
    records[index] = revokeShare(records[index], clock()); save(records);
    res.json({ success: true, data: ownerShareRecord(records[index], base, false, clock()) });
  }));
  router.delete(`${managed}/:id`, action((req, res) => {
    const records = read(), index = ownerRow(records, req);
    records.splice(index, 1); save(records); res.json({ success: true });
  }));
  router.post(`${publicPath}/read`, action((req, res) => {
    const records = read(); res.json({ success: true, data: publicShareRecord(records[tokenRow(records, req.body)], clock()) });
  }));
  router.post(`${publicPath}/respond`, action((req, res) => {
    const records = read(), index = tokenRow(records, req.body);
    records[index] = respondToShare(records[index], req.body, clock()); save(records);
    res.json({ success: true, data: publicShareRecord(records[index], clock()) });
  }));
  router.use((error, req, res, next) => {
    if (!req.path.startsWith(managed) && !req.path.startsWith(publicPath)) return next(error);
    const status = error instanceof ShareError ? error.status : error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError && error.status === 400 ? 400 : 503;
    res.status(status).json({ success: false, message: error instanceof ShareError ? error.message : status === 413 ? 'Dữ liệu quá dài.' : status === 400 ? 'JSON không hợp lệ.' : 'Không lưu hoặc đọc được yêu cầu. Vui lòng thử lại sau.' });
  });
  return router;
}
module.exports = { createPhoneShareRouter };
