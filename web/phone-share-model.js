// Pure consent-flow rules, shared by the local server and browser-only demo.
export const CONSENT_VERSION = 'phone-share-2026-11-03-v1';
export class ShareError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const reject = (status, message) => { throw new ShareError(status, message); };
const text = (value, max, label) => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) reject(400, `${label} không hợp lệ.`);
  return value.trim();
};
export function normalizeSharedPhone(value) {
  const raw = text(value, 40, 'Số điện thoại');
  if (!/^[+\d\s().-]+$/.test(raw)) reject(400, 'Nhập số điện thoại hợp lệ, không kèm số máy lẻ.');
  let phone = raw.replace(/[\s().-]/g, '');
  if (/^0\d{9,10}$/.test(phone)) phone = '+84' + phone.slice(1);
  else if (/^[1-9]\d{7,14}$/.test(phone)) phone = '+' + phone;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) reject(400, 'Nhập số Việt Nam dạng 0… hoặc số quốc tế có mã quốc gia.');
  return phone;
}
export function newShareRequest(input, owner, now = Date.now()) {
  const purpose = text(input.purpose, 300, 'Mục đích');
  if (purpose.length < 5) reject(400, 'Nhập mục đích chia sẻ từ 5 đến 300 ký tự.');
  const recipientName = text(input.recipientName, 100, 'Tên người nhận');
  const targetUID = text(input.targetUID, 40, 'UID');
  if (targetUID && !/^[a-zA-Z0-9_-]{1,40}$/.test(targetUID)) reject(400, 'UID chỉ chứa chữ, số, dấu gạch ngang hoặc gạch dưới.');
  const ttlHours = input.ttlHours === undefined ? 72 : Number(input.ttlHours);
  if (![24, 72, 168].includes(ttlHours)) reject(400, 'Hạn liên kết phải là 24, 72 hoặc 168 giờ.');
  const bytes = new Uint8Array(32); globalThis.crypto.getRandomValues(bytes);
  return { id: globalThis.crypto.randomUUID(), token: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(''), ownerID: String(owner.userID), requesterName: String(owner.userName), recipientName, targetUID, purpose, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + ttlHours * 3600000).toISOString(), status: 'pending', verification: 'self_reported' };
}
export function shareStatus(record, now = Date.now()) {
  return record.status === 'pending' && Date.parse(record.expiresAt) <= now ? 'expired' : record.status;
}
export function publicShareRecord(record, now = Date.now()) {
  return { requesterName: record.requesterName, recipientName: record.recipientName, purpose: record.purpose, expiresAt: record.expiresAt, status: shareStatus(record, now) };
}
export function ownerShareRecord(record, baseURL, demo = false, now = Date.now()) {
  return { ...record, status: shareStatus(record, now), shareURL: `${baseURL}/share-phone#${demo ? 'demo.' : ''}${record.token}`, localOnly: ['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname) };
}
export function respondToShare(record, input, now = Date.now()) {
  const status = shareStatus(record, now);
  if (status === 'expired') reject(410, 'Liên kết đã hết hạn. Vui lòng liên hệ người tạo yêu cầu.');
  if (status !== 'pending') reject(409, 'Yêu cầu đã được phản hồi hoặc hủy; không thể gửi thêm.');
  if (!['share', 'decline'].includes(input.action)) reject(400, 'Thao tác phản hồi không hợp lệ.');
  const result = { ...record, status: input.action === 'share' ? 'shared' : 'declined', respondedAt: new Date(now).toISOString() };
  if (input.action === 'share') {
    if (input.consent !== true) reject(400, 'Bạn cần tự chọn đồng ý chia sẻ số điện thoại.');
    result.phoneNumber = normalizeSharedPhone(input.phoneNumber);
    result.consentAt = result.respondedAt;
    result.consentVersion = CONSENT_VERSION;
  }
  return result;
}
export function revokeShare(record, now = Date.now()) {
  if (shareStatus(record, now) !== 'pending') reject(409, 'Chỉ có thể hủy yêu cầu đang chờ. Bạn có thể xóa yêu cầu và dữ liệu đã nhận.');
  return { ...record, status: 'revoked', revokedAt: new Date(now).toISOString() };
}
