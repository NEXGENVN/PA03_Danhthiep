import { shareStatus } from '../phone-share-model.js';
const labels = { pending: ['Chờ phản hồi', 'warning'], shared: ['Đã chia sẻ', 'success'], declined: ['Đã từ chối', 'neutral'], expired: ['Hết hạn', 'neutral'], revoked: ['Đã hủy', 'danger'] };

export async function renderPhoneShare(route, app) {
  if (route !== 'phone-share') return null;
  const u = app.ui, demo = app.client.mode === 'demo';
  let records = (await app.client.api('/phone-share/requests')).data || [];
  const draft = app.phoneShareDraft || {}; delete app.phoneShareDraft;
  const button = (label, action, id = '', kind = 'ghost small') => `<button type="button" class="btn ${kind}" data-share-action="${action}" data-id="${u.h(id)}">${label}</button>`;
  const html = u.pageHead('Yêu cầu chia sẻ số điện thoại', 'Người nhận tự cung cấp số và đồng ý chia sẻ cho bạn.', button(`${u.icon('refresh', 14)} Làm mới`, 'refresh', '', 'secondary'), 'Liên hệ tự nguyện')
    + u.notice(demo ? 'Dữ liệu mẫu · Chỉ thử trong cùng trình duyệt. Không gửi yêu cầu hoặc số điện thoại tới Zalo.' : 'Tạo liên kết rồi tự gửi cho người nhận. Hệ thống không tự gửi tin Zalo và không thu phí cho chức năng này.', 'info')
    + `<div class="grid-2 share-create-grid">${u.card('Tạo yêu cầu', `<form data-share-create><div class="form-grid">${u.field('Tên người nhận (ghi chú)', 'recipientName', { value: draft.recipientName, placeholder: 'Ví dụ: Khách hàng đặt lịch' })}${u.field('UID Zalo (ghi chú, tùy chọn)', 'targetUID', { value: draft.targetUID, placeholder: 'UID đã có từ danh thiếp' })}${u.field('Mục đích xin số điện thoại', 'purpose', { type: 'textarea', required: true, full: true, rows: 3, placeholder: 'Ví dụ: Gọi xác nhận lịch tư vấn mà bạn đã đăng ký.' })}${u.field('Liên kết có hiệu lực', 'ttlHours', { type: 'select', value: 72, options: [{ value: 24, label: '24 giờ' }, { value: 72, label: '3 ngày' }, { value: 168, label: '7 ngày' }], full: true })}</div><div data-create-error role="alert"></div><div class="form-actions"><button class="btn primary" type="submit">${u.icon('plus', 15)} Tạo liên kết${demo ? ' mẫu' : ''}</button></div></form><div data-new-link></div>`, 'Liên kết dùng một lần; bạn có thể hủy khi người nhận chưa phản hồi.')}${u.card('Cách sử dụng', `<ol class="steps"><li>Tạo yêu cầu, ghi rõ mục đích.</li><li>Sao chép và tự gửi liên kết cho người nhận.</li><li>Người nhận nhập số và chọn đồng ý, hoặc từ chối.</li><li>Làm mới danh sách để xem phản hồi.</li></ol>${u.notice('Số điện thoại do người nhận tự khai, chưa xác minh OTP. UID chỉ là ghi chú; phản hồi không chứng minh số thuộc UID này.', 'warning')}<p class="share-note">Ai có liên kết đều có thể mở và phản hồi. Chỉ gửi riêng cho người bạn muốn liên hệ.</p><p class="share-note">${demo ? 'Liên kết mẫu chỉ hoạt động trong trình duyệt đang tạo yêu cầu. Dùng số giả khi thử.' : 'Liên kết localhost chỉ mở được trên máy này. Người ngoài cần trang được triển khai qua HTTPS và cấu hình địa chỉ công khai.'}</p>`)}</div>`
    + u.card('Yêu cầu và phản hồi', `<div class="filter-bar"><input type="search" data-share-search aria-label="Tìm yêu cầu chia sẻ" placeholder="Tìm tên, UID hoặc số điện thoại…"><select data-share-filter aria-label="Lọc trạng thái chia sẻ"><option value="">Tất cả trạng thái</option>${Object.entries(labels).map(([key, [label]]) => `<option value="${key}">${label}</option>`).join('')}</select></div><div data-share-list></div>`, 'Chỉ tài khoản tạo yêu cầu xem được số điện thoại đã nhận.');
  return { html, bind(container) {
    let page = 1;
    const form = container.querySelector('[data-share-create]');
    const error = (el, err) => { el.innerHTML = u.notice(err.message || String(err), 'danger'); };
    const load = async () => { records = (await app.client.api('/phone-share/requests')).data || []; paint(); };
    function paint() {
      const query = container.querySelector('[data-share-search]').value.trim().toLocaleLowerCase('vi'), filter = container.querySelector('[data-share-filter]').value;
      const filtered = records.filter(r => (!filter || shareStatus(r) === filter) && [r.recipientName, r.targetUID, r.phoneNumber, r.purpose].some(v => String(v || '').toLocaleLowerCase('vi').includes(query)));
      const pages = Math.max(1, Math.ceil(filtered.length / 10)); page = Math.min(page, pages);
      container.querySelector('[data-share-list]').innerHTML = u.table(['Người nhận / UID ghi chú', 'Mục đích', 'Số điện thoại', 'Trạng thái', 'Hạn phản hồi', 'Thao tác'], filtered.slice((page - 1) * 10, page * 10).map(r => {
        const status = shareStatus(r), [label, kind] = labels[status] || ['Chưa rõ', 'neutral'];
        return [`<strong>${u.h(r.recipientName || 'Chưa đặt tên')}</strong><div class="muted">${u.h(r.targetUID || 'Không gắn UID')}</div>`, `<div class="share-purpose">${u.h(r.purpose)}</div>`, r.phoneNumber ? `<strong>${u.h(r.phoneNumber)}</strong><div class="muted">Tự khai · Chưa xác minh OTP</div><div class="muted">Đồng ý: ${u.date(r.consentAt)}</div>` : '—', u.badge(label, kind), u.date(r.expiresAt), `<div class="actions">${status === 'pending' ? button('Liên kết', 'link', r.id) + button('Hủy', 'revoke', r.id) : ''}${button('Xóa', 'delete', r.id, 'danger small')}</div>`];
      }), 'Chưa có yêu cầu phù hợp.') + `<div class="pagination"><span>${filtered.length} yêu cầu · Trang ${page}/${pages}</span><div class="actions">${page > 1 ? button('Trước', 'previous') : ''}${page < pages ? button('Sau', 'next') : ''}</div></div>`;
    }
    function linkPanel(row) {
      return `<div class="share-link-panel">${u.field('Liên kết chia sẻ', 'shareURL', { value: row.shareURL, readonly: true, full: true })}${u.notice(demo ? 'Liên kết mẫu: chỉ mở trong cùng trình duyệt, dùng dữ liệu giả.' : row.localOnly ? 'Liên kết localhost: chỉ thử được trên máy này; người ngoài chưa truy cập được.' : 'Gửi riêng liên kết này cho người nhận. Ai có liên kết cũng có thể phản hồi.', 'warning')}<div class="form-actions">${button(`${u.icon('copy', 14)} Sao chép`, 'copy', row.id, 'secondary')}<a class="btn primary" href="${u.h(row.shareURL)}" target="_blank" rel="noopener noreferrer">Mở trang chia sẻ ${u.icon('external', 14)}</a></div></div>`;
    }
    async function copyLink(row) {
      try { await navigator.clipboard.writeText(row.shareURL); app.toast('Đã sao chép liên kết.'); }
      catch { app.modal({ title: 'Sao chép liên kết', body: u.field('Chọn và sao chép địa chỉ bên dưới', 'copyURL', { type: 'textarea', value: row.shareURL, readonly: true }), submitLabel: 'Đóng' }); }
    }
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (!form.reportValidity()) return;
      const submit = form.querySelector('[type="submit"]'), slot = form.querySelector('[data-create-error]');
      submit.disabled = true; slot.innerHTML = '';
      try {
        const body = Object.fromEntries(new FormData(form)); body.ttlHours = Number(body.ttlHours);
        const result = await app.client.api('/phone-share/requests', { method: 'POST', body });
        container.querySelector('[data-new-link]').innerHTML = `<h3 class="section-title">Đã tạo liên kết${demo ? ' mẫu' : ''}</h3>${linkPanel(result.data)}`;
        await load(); app.toast(demo ? 'Đã tạo yêu cầu mẫu.' : 'Đã tạo yêu cầu. Sao chép liên kết để gửi cho người nhận.');
      } catch (err) { error(slot, err); }
      finally { submit.disabled = false; }
    });
    for (const name of ['data-share-search', 'data-share-filter']) container.querySelector(`[${name}]`).addEventListener(name.includes('search') ? 'input' : 'change', () => { page = 1; paint(); });
    container.addEventListener('click', async event => {
      const element = event.target.closest('[data-share-action]'); if (!element) return;
      const action = element.dataset.shareAction, row = records.find(r => r.id === element.dataset.id);
      if (action === 'previous' || action === 'next') { page += action === 'next' ? 1 : -1; paint(); return; }
      if (action === 'link' && row) {
        const dialog = app.modal({ title: 'Liên kết yêu cầu chia sẻ', body: linkPanel(row), submitLabel: 'Đóng' });
        dialog.querySelector('[data-share-action="copy"]').addEventListener('click', () => { void copyLink(row); }); return;
      }
      if (action === 'copy' && row) {
        await copyLink(row); return;
      }
      if ((action === 'revoke' || action === 'delete') && row) {
        app.confirm({ title: action === 'delete' ? 'Xóa yêu cầu và dữ liệu đã nhận?' : 'Hủy liên kết này?', description: action === 'delete' ? 'Số đã chia sẻ và thông tin yêu cầu sẽ bị xóa. Liên kết không còn dùng được.' : 'Người nhận sẽ không thể phản hồi qua liên kết này.', confirmLabel: action === 'delete' ? 'Xóa dữ liệu' : 'Hủy yêu cầu', onConfirm: async () => {
          await app.client.api(`/phone-share/requests/${row.id}${action === 'revoke' ? '/revoke' : ''}`, { method: action === 'delete' ? 'DELETE' : 'POST', ...(action === 'revoke' ? { body: {} } : {}) });
          container.querySelector('[data-new-link]').innerHTML = ''; await load(); app.toast('Đã cập nhật yêu cầu.');
        } }); return;
      }
      if (action === 'refresh') { element.disabled = true; try { await load(); app.toast('Đã làm mới phản hồi.'); } catch (err) { app.toast(err.message, 'danger'); } finally { element.disabled = false; } }
    });
    paint();
  } };
}
