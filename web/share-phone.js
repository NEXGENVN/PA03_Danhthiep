import { h, icon, field, notice, date } from './ui.js';
import { demoPublicRead, demoPublicRespond } from './phone-share-demo.js';
import { recipientFrame, terminalText } from './phone-share-view.js';
const root = document.querySelector('#share-content');
let request, demo, token, loadVersion = 0;
const header = () => recipientFrame('', { demo, hostname: location.hostname });
const message = text => { root.innerHTML = `${header()}<section class="card share-recipient"><h1>Yêu cầu không khả dụng</h1>${notice(text, 'warning')}<p class="share-note">Bạn không cần gửi thêm thông tin. Liên hệ người tạo yêu cầu nếu cần hỗ trợ.</p></section>`; };
async function call(action, body = {}, linkToken = token, isDemo = demo) {
  if (isDemo) return action === 'read' ? demoPublicRead(localStorage, linkToken) : demoPublicRespond(localStorage, linkToken, body);
  const response = await fetch(`/ui/phone-share/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...body, token: linkToken }), credentials: 'omit', referrerPolicy: 'no-referrer' });
  let result; try { result = await response.json(); } catch { throw new Error('Máy chủ chưa sẵn sàng. Vui lòng thử lại sau.'); }
  if (!response.ok || result.success !== true) throw new Error(result.message || 'Không thể xử lý yêu cầu.');
  return result;
}
function render() {
  const demoNote = demo ? notice('Đây là trang mẫu. Chỉ dùng số giả để thử; phản hồi lưu trong trình duyệt này.', 'warning') : '';
  if (request.status !== 'pending') {
    const [title, description] = terminalText(request.status);
    root.innerHTML = `${header()}<section class="card share-recipient">${icon(request.status === 'shared' ? 'check' : 'info', 30)}<h1>${h(title)}</h1>${demoNote}<p>${h(description)}</p><p class="share-note">Trạng thái của liên kết không xác nhận danh tính người đã phản hồi.</p></section>`; return;
  }
  root.innerHTML = `${header()}<section class="card share-recipient"><div class="share-symbol">${icon('card', 28)}</div><h1>Chia sẻ số điện thoại</h1><p><strong>${h(request.requesterName)}</strong> muốn bạn tự nguyện cung cấp số điện thoại.</p>${demoNote}<div class="share-purpose-box"><span class="eyebrow">Mục đích được người tạo cung cấp</span><p>${h(request.purpose)}</p>${request.recipientName ? `<p class="share-note">Ghi chú người nhận: ${h(request.recipientName)}</p>` : ''}</div><p class="share-note">Hạn phản hồi: ${date(request.expiresAt)} · Liên kết dùng một lần.</p><form data-recipient-form>${field('Số điện thoại của bạn', 'phoneNumber', { type: 'tel', required: true, autocomplete: 'tel', placeholder: '0… hoặc +84…', help: 'Chỉ nhập số bạn muốn chia sẻ; không yêu cầu OTP, mật khẩu hay đăng nhập Zalo.' })}<label class="checkbox-field share-consent"><input type="checkbox" name="consent" required><span>Tôi đồng ý chia sẻ số điện thoại vừa nhập cho <strong>${h(request.requesterName)}</strong> để ${h(request.purpose)}.</span></label><p class="share-note">Số bạn gửi sẽ được lưu cho tài khoản tạo yêu cầu; liên hệ người đó nếu muốn xóa. Thông tin do bạn tự khai, chưa xác minh OTP và không xác nhận số thuộc một UID Zalo.</p><div data-share-error role="alert"></div><div class="form-actions"><button type="submit" class="btn primary">${icon('check', 15)} Đồng ý và chia sẻ${demo ? ' mẫu' : ''}</button><button type="button" class="btn secondary" data-decline>Từ chối chia sẻ</button></div><div data-decline-confirm hidden>${notice('Bạn muốn từ chối yêu cầu này? Liên kết sẽ đóng và không gửi số điện thoại.', 'info')}<div class="form-actions"><button type="button" class="btn secondary" data-decline-yes>Xác nhận từ chối</button><button type="button" class="btn ghost" data-decline-back>Quay lại</button></div></div></form></section><p class="share-footer">Chỉ tiếp tục nếu bạn nhận biết người yêu cầu và đồng ý với mục đích trên. Ai có liên kết cũng có thể phản hồi; không chuyển tiếp liên kết.</p>`;
  const form = root.querySelector('form'), slot = root.querySelector('[data-share-error]');
  async function respond(action) {
    if (action === 'share' && !form.reportValidity()) return;
    const controls = form.querySelectorAll('button'); controls.forEach(b => { b.disabled = true; }); slot.innerHTML = '';
    const version = loadVersion;
    try {
      // Do not include the entered phone in a decline request.
      const body = action === 'share' ? { action, phoneNumber: form.elements.phoneNumber.value, consent: form.elements.consent.checked } : { action };
      const result = await call('respond', body); if (version !== loadVersion) return;
      request = result.data; form.reset(); render();
    } catch (error) { if (version !== loadVersion) return; slot.innerHTML = notice(error.message, 'danger'); controls.forEach(b => { b.disabled = false; }); }
  }
  form.addEventListener('submit', event => { event.preventDefault(); void respond('share'); });
  form.querySelector('[data-decline]').addEventListener('click', () => { form.querySelector('[data-decline-confirm]').hidden = false; });
  form.querySelector('[data-decline-back]').addEventListener('click', () => { form.querySelector('[data-decline-confirm]').hidden = true; });
  form.querySelector('[data-decline-yes]').addEventListener('click', () => { void respond('decline'); });
}
async function load() {
  const version = ++loadVersion, fragment = location.hash.slice(1);
  demo = fragment.startsWith('demo.'); token = demo ? fragment.slice(5) : fragment;
  root.innerHTML = '<p>Đang mở yêu cầu chia sẻ…</p>';
  try {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('Liên kết không hợp lệ. Vui lòng mở đầy đủ liên kết được gửi cho bạn.');
    const result = await call('read'); if (version !== loadVersion) return;
    request = result.data; render();
  } catch (error) { if (version === loadVersion) message(error.message || 'Không thể mở yêu cầu. Vui lòng thử lại sau.'); }
}
window.addEventListener('hashchange', () => { void load(); });
await load();
