import { ShareError, newShareRequest, ownerShareRecord, publicShareRecord, respondToShare, revokeShare } from './phone-share-model.js';
export const DEMO_SHARE_KEY = 'pa03.ui.phone-share.demo.v1';
const base = () => globalThis.location?.origin || 'http://127.0.0.1:13103';
const ok = data => ({ success: true, demo: true, data });
function read(storage) {
  try {
    const raw = storage?.getItem(DEMO_SHARE_KEY), data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) throw new Error('invalid');
    return data;
  } catch { throw new ShareError(503, 'Không đọc được dữ liệu mẫu. Khôi phục dữ liệu mẫu để thử lại.'); }
}
function save(storage, records) {
  try { if (!storage) throw new Error('storage'); storage.setItem(DEMO_SHARE_KEY, JSON.stringify(records)); }
  catch { throw new ShareError(503, 'Không lưu được yêu cầu mẫu. Cho phép trình duyệt lưu dữ liệu và thử lại.'); }
}
const tokenIndex = (records, token) => {
  const index = typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) ? records.findIndex(r => r.token === token) : -1;
  if (index < 0) throw new ShareError(404, 'Liên kết mẫu không tồn tại hoặc đã bị xóa. Mở bằng cùng trình duyệt tạo yêu cầu.');
  return index;
};
export function demoPublicRead(storage, token) {
  const records = read(storage); return ok(publicShareRecord(records[tokenIndex(records, token)]));
}
export function demoPublicRespond(storage, token, input) {
  const records = read(storage), index = tokenIndex(records, token);
  records[index] = respondToShare(records[index], input); save(storage, records);
  return ok(publicShareRecord(records[index]));
}
export function demoShareApi(storage, owner, route, method, body = {}) {
  const records = read(storage), prefix = '/phone-share/requests';
  if (route === prefix && method === 'GET') return ok(records.filter(r => r.ownerID === String(owner.userID)).reverse().map(r => ownerShareRecord(r, base(), true)));
  if (route === prefix && method === 'POST') {
    const record = newShareRequest(body, owner);
    if (records.length >= 200) throw new ShareError(409, 'Xóa yêu cầu mẫu cũ trước khi tạo thêm (tối đa 200).');
    records.push(record); save(storage, records); return ok(ownerShareRecord(record, base(), true));
  }
  const match = route.match(/^\/phone-share\/requests\/([a-zA-Z0-9-]+)(\/revoke)?$/);
  const index = match ? records.findIndex(r => r.id === match[1] && r.ownerID === String(owner.userID)) : -1;
  if (index < 0) throw new ShareError(404, 'Không tìm thấy yêu cầu mẫu.');
  if (method === 'POST' && match[2]) records[index] = revokeShare(records[index]);
  else if (method === 'DELETE' && !match[2]) records.splice(index, 1);
  else throw new ShareError(405, 'Thao tác không hợp lệ.');
  save(storage, records); return ok(null);
}
