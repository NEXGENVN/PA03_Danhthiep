const routes = new Set(['accounts', 'send-phone', 'send-card', 'check-status', 'history', 'schedules', 'oa-send', 'oa-templates', 'oa-results', 'oa-token']);

function context(app) {
  const u = app.ui;
  const call = async (path, options) => {
    const result = await app.client.api(path, options);
    if (!result || result.success === false) throw new Error(result?.message || 'Không thể thực hiện yêu cầu. Vui lòng thử lại.');
    return result;
  };
  return { ...u, app, call, demo: app.client.mode === 'demo',
    success: text => app.toast(app.client.mode === 'demo' ? `Mô phỏng · ${text}` : text, 'success') };
}

function button(c, label, action, style = 'secondary', attrs = '') {
  return `<button type="button" class="btn ${style}" data-action="${c.h(action)}" ${attrs}>${label}</button>`;
}

function nav(c, label, route, style = 'secondary') {
  return `<button type="button" class="btn ${style}" data-nav="${c.h(route)}">${c.h(label)}</button>`;
}

function status(c, value) {
  const text = String(value ?? 'Chưa có');
  const type = /^(SUCCESS|success|Đang hoạt động|Đã nhận|Thành công|3)$/i.test(text) ? 'success'
    : /failed|error|thất bại|hết hạn|ngừng|không hoạt động/i.test(text) ? 'danger' : 'warning';
  const labels = { SUCCESS: 'Thành công', FAILED: 'Thất bại', ERROR: 'Lỗi', PENDING: 'Đang chờ', success: 'Thành công', error: 'Lỗi' };
  return c.badge(labels[text] || text, type);
}

function person(c, name, subtitle = '') {
  const initials = String(name || 'ZA').trim().split(/\s+/).slice(-2).map(x => x[0]).join('').toUpperCase();
  return `<div class="profile-mini"><span class="avatar">${c.h(initials)}</span><div><strong>${c.h(name || 'Chưa có tên')}</strong>${subtitle ? `<div class="muted">${c.h(subtitle)}</div>` : ''}</div></div>`;
}

function details(c, entries) {
  return `<dl class="detail-list">${entries.map(([key, val]) => `<div><dt>${c.h(key)}</dt><dd>${val}</dd></div>`).join('')}</dl>`;
}

function check(c, name, label, checked = false, help = '') {
  return `<label class="checkbox-field"><input type="checkbox" name="${c.h(name)}" ${checked ? 'checked' : ''}><span>${c.h(label)}${help ? `<small class="muted">${c.h(help)}</small>` : ''}</span></label>`;
}

function formError(c, target, error) {
  const slot = target?.querySelector('[data-error]');
  if (slot) { slot.innerHTML = c.notice(error.message || String(error), 'danger'); slot.scrollIntoView?.({ block: 'nearest' }); }
  else c.app.toast(error.message || String(error), 'danger');
}

async function busy(c, buttonElement, action, target) {
  if (buttonElement?.disabled) return;
  const text = buttonElement?.textContent;
  if (buttonElement) { buttonElement.disabled = true; buttonElement.textContent = 'Đang xử lý…'; }
  if (target?.querySelector('[data-error]')) target.querySelector('[data-error]').innerHTML = '';
  try { await action(); }
  catch (error) { formError(c, target, error); }
  finally { if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = text; } }
}

function onForm(c, form, action) {
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    void busy(c, form.querySelector('[type="submit"]'), () => action(Object.fromEntries(new FormData(form)), form), form);
  });
}

function listRows(c, response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.history)) return response.data.history;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return c.rows(response);
}

function pager(c, page, totalPages, total) {
  return `<div class="pagination"><span class="muted">${c.number(total)} bản ghi · Trang ${page}/${Math.max(1, totalPages)}</span><div class="actions">${button(c, 'Trước', 'previous', 'ghost small', page <= 1 ? 'disabled' : '')}${button(c, 'Sau', 'next', 'secondary small', page >= totalPages ? 'disabled' : '')}</div></div>`;
}

async function accounts(c) {
  const rows = listRows(c, await c.call('/zalo-accounts'));
  const active = rows.filter(x => x.accStatus === 'Đang hoạt động').length;
  const html = c.pageHead('Tài khoản Zalo', 'Quản lý phiên đăng nhập và tài khoản gửi của bạn.', `${button(c, 'Nhập tự động', 'auto', 'secondary')}${button(c, `${c.icon('plus', 16)} Thêm tài khoản`, 'create', 'primary')}`, 'Kết nối Zalo')
    + `<div class="grid-3"><div class="card metric"><span class="muted">Tổng tài khoản</span><strong class="metric-value">${c.number(rows.length)}</strong></div><div class="card metric"><span class="muted">Đang hoạt động</span><strong class="metric-value">${c.number(active)}</strong></div><div class="card metric"><span class="muted">Cần kiểm tra</span><strong class="metric-value">${c.number(rows.length - active)}</strong></div></div>`
    + c.card('Tài khoản đã kết nối', `<div data-error></div>${c.table(['Tài khoản', 'UID', 'Số điện thoại', 'Trạng thái', 'Ngày nhập', 'Thao tác'], rows.map((row, i) => [person(c, row.displayName), `<code>${c.h(row.UID)}</code>`, c.h(row.phoneNumber || '—'), status(c, row.accStatus), c.date(row.ImportTime), `<div class="actions">${button(c, 'Kiểm tra', 'check', 'ghost small', `data-index="${i}"`)}${button(c, 'Sửa', 'edit', 'ghost small', `data-index="${i}"`)}${button(c, 'Xóa', 'delete', 'danger small', `data-index="${i}"`)}</div>`]), 'Chưa có tài khoản. Thêm thủ công hoặc nhập tự động để bắt đầu.')}`, 'Kiểm tra trạng thái để phát hiện phiên hết hạn.', button(c, 'Kiểm tra tất cả', 'check-all', 'secondary small', rows.length ? '' : 'disabled'));
  function edit(row) {
    const creating = !row;
    const body = `<div class="form-grid">${creating ? c.field('UID Zalo', 'UID', { required: true, placeholder: 'UID của tài khoản' }) : ''}${c.field('Tên hiển thị', 'displayName', { required: true, value: row?.displayName })}${c.field('Số điện thoại', 'phoneNumber', { type: 'tel', value: row?.phoneNumber })}${c.field('URL ảnh đại diện', 'Avatar', { type: 'url', value: row?.Avatar, placeholder: 'https://…' })}${c.field('IMEI / z_uuid', 'IMEI', { required: creating, help: creating ? '' : 'Để trống để giữ giá trị hiện tại.' })}${c.field('Khóa mã hóa', 'ENCRYPTION_KEY', { type: 'password', required: creating, help: creating ? '' : 'Để trống để giữ giá trị hiện tại.' })}${c.field('Cookie zpw_sek', 'COOKIE_ZPW_SEK', { type: 'password', required: creating, full: true, help: 'Dùng cookie của tài khoản bạn quản lý.' })}${!creating ? c.field('Trạng thái', 'accStatus', { type: 'select', value: row.accStatus, options: [...new Set([row.accStatus, 'Đang hoạt động', 'Không hoạt động'].filter(Boolean))] }) : ''}</div>`;
    c.app.modal({ title: creating ? 'Thêm tài khoản Zalo' : 'Cập nhật tài khoản', description: creating ? 'Nhập thông tin phiên đăng nhập của tài khoản.' : `UID ${row.UID} · Chỉ nhập lại thông tin phiên khi cần thay thế.`, body, wide: true, submitLabel: creating ? 'Thêm tài khoản' : 'Lưu thay đổi', onSubmit: async values => {
      const payload = { ...values };
      if (!creating) for (const key of ['IMEI', 'ENCRYPTION_KEY', 'COOKIE_ZPW_SEK']) if (!payload[key]) delete payload[key];
      await c.call(creating ? '/zalo-accounts' : `/zalo-accounts/${encodeURIComponent(row.UID)}`, { method: creating ? 'POST' : 'PUT', body: payload });
      c.success(creating ? 'Đã thêm tài khoản' : 'Đã cập nhật tài khoản'); await c.app.refresh();
    } });
  }
  return { html, bind(container) {
    container.addEventListener('click', event => {
      const el = event.target.closest('[data-action]'); if (!el) return;
      const row = rows[Number(el.dataset.index)];
      if (el.dataset.action === 'create') edit();
      if (el.dataset.action === 'edit' && row) edit(row);
      if (el.dataset.action === 'auto') c.app.modal({ title: 'Nhập tài khoản tự động', description: 'Hệ thống đọc thông tin tài khoản từ IMEI và cookie của phiên Zalo Web.', submitLabel: 'Nhập tài khoản', body: `<div class="stack">${c.field('IMEI / z_uuid', 'IMEI', { required: true, help: 'Giá trị z_uuid trong Local Storage của Zalo Web.' })}${c.field('Cookie zpw_sek', 'COOKIE_ZPW_SEK', { type: 'password', required: true })}</div>`, onSubmit: async values => { await c.call('/zalo-accounts/auto-fetch', { method: 'POST', body: values }); c.success('Đã nhập tài khoản tự động'); await c.app.refresh(); } });
      if (el.dataset.action === 'delete' && row) c.app.confirm({ title: 'Xóa tài khoản Zalo?', description: `Tài khoản ${row.displayName || row.UID} sẽ bị xóa khỏi danh sách.`, confirmLabel: 'Xóa tài khoản', onConfirm: async () => { await c.call(`/zalo-accounts/${encodeURIComponent(row.UID)}`, { method: 'DELETE' }); c.success('Đã xóa tài khoản'); await c.app.refresh(); } });
      if (el.dataset.action === 'check' && row) void busy(c, el, async () => {
        const result = await c.call(`/zalo-accounts/${encodeURIComponent(row.UID)}/check-status`, { method: 'POST', body: {} });
        c.app.toast(`${c.demo ? 'Mô phỏng · ' : ''}${row.displayName}: ${result.data?.accStatus || (result.data?.isActive ? 'Đang hoạt động' : 'Không hoạt động')}`, result.data?.isActive === false ? 'warning' : 'success'); await c.app.refresh();
      }, container);
      if (el.dataset.action === 'check-all') void busy(c, el, async () => { await c.call('/zalo-accounts/check-all-status', { method: 'POST', body: {} }); c.success('Đã kiểm tra toàn bộ tài khoản'); await c.app.refresh(); }, container);
    });
  } };
}

function steps(c, current) {
  return `<ol class="workflow-steps" aria-label="Tiến trình">${['Thông tin yêu cầu', 'Kiểm tra & xác nhận', 'Kết quả'].map((text, i) => `<li class="workflow-step ${current === i + 1 ? 'active' : current > i + 1 ? 'done' : ''}" ${current === i + 1 ? 'aria-current="step"' : ''}><span>${current > i + 1 ? '✓' : i + 1}</span>${text}</li>`).join('')}</ol>`;
}

function localDateInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

async function workflow(c, route) {
  const checking = route === 'check-status';
  const type = checking ? c.app.getTab('check-target', 'phone') : route === 'send-card' ? 'card' : 'phone';
  const card = type === 'card';
  const accountPath = card ? '/send-image-by-card/personal-accounts' : '/send-image-v2/zalo-accounts';
  const accounts = listRows(c, await c.call(accountPath)).filter(x => !x.accStatus || x.accStatus === 'Đang hoạt động');
  const choices = accounts.filter(x => !checking || !x.isSystemAccount).map(x => ({ value: String(x.UID), label: x.isSystemAccount ? 'Tài khoản hệ thống' : `${x.displayName} · ${x.phoneNumber || x.UID}` }));
  if (checking && !card) choices.unshift({ value: 'SYSTEM', label: 'Tài khoản hệ thống' });
  choices.unshift({ value: '', label: 'Chọn tài khoản gửi' });
  const title = checking ? 'Kiểm tra lần hoạt động' : card ? 'Gửi ảnh qua danh thiếp' : 'Gửi ảnh theo số điện thoại';
  const description = checking ? 'Tra cứu lần hoạt động gần nhất qua số điện thoại hoặc PARAMS danh thiếp.' : 'Chuẩn bị yêu cầu, xem người nhận và phí trước khi xác nhận.';
  const targetField = card ? c.field('PARAMS danh thiếp', 'encryptedFid', { type: 'textarea', rows: 4, required: true, placeholder: c.demo ? 'demo-params-example' : 'Dán chuỗi PARAMS đã mã hóa', full: true, help: 'Chọn tài khoản có phiên dùng để lấy PARAMS này.' }) : c.field('Số điện thoại người nhận', 'phoneNumber', { type: 'tel', required: true, placeholder: 'Nhập số điện thoại', help: 'Chấp nhận dạng 0…, 84… hoặc +84…', full: true });
  const form = `<form data-workflow-form><div data-error role="status"></div><div class="form-grid">${c.field('Tài khoản Zalo', 'zaloUID', { type: 'select', required: true, options: choices, full: true })}${targetField}${!checking ? `${c.field('Ảnh gửi đi', 'imageType', { type: 'select', options: [{ value: 'default', label: 'Ảnh mặc định của hệ thống' }, { value: 'custom', label: 'PNG của bạn · phí bổ sung theo báo giá' }] })}${c.field('Loại IP', 'ipType', { type: 'select', options: [{ value: 'ipv4', label: 'IPv4' }, { value: 'ipv6', label: 'IPv6' }, { value: 'both', label: 'IPv4 và IPv6' }] })}<div class="full" data-upload hidden><label class="upload-zone"><span><strong>Chọn ảnh PNG</strong><small>Tối đa 3 MB. Xem trước ảnh trước khi tải lên.</small></span><input type="file" name="custom_image" accept="image/png,.png"></label><div data-image-preview></div></div><div class="full stack">${check(c, 'autoDelete', 'Tự động xóa ảnh phía người gửi', true, 'Chỉ xóa bản sao trong cuộc trò chuyện của người gửi.')}${check(c, 'isTimer', 'Hẹn giờ thực hiện')}<div data-timer hidden>${c.field('Thời gian thực hiện', 'runTime', { type: 'datetime-local', min: localDateInput(new Date(Date.now() + 5 * 60000)), value: localDateInput(new Date(Date.now() + 10 * 60000)), help: 'Ít nhất 5 phút sau hiện tại · theo múi giờ thiết bị.' })}</div></div>` : ''}</div><div class="form-actions"><button class="btn primary" type="submit" ${choices.length <= 1 ? 'disabled' : ''}>${checking ? 'Tìm người dùng & xem phí' : 'Tìm người nhận & xem phí'} ${c.icon('arrow-right', 16)}</button></div></form>`;
  const help = c.card('Trước khi tiếp tục', `<div class="stack">${c.notice(c.demo ? 'Bạn đang dùng dữ liệu mẫu. Toàn bộ tìm kiếm, gửi và phí đều được mô phỏng.' : 'Thông tin và báo giá được lấy từ dịch vụ đang kết nối. Xác nhận ở bước kế tiếp để thực hiện.', 'info')}<div><strong>01 · Chọn tài khoản</strong><p class="muted">${card ? 'Danh thiếp cần tài khoản cá nhân đang hoạt động.' : 'Dùng tài khoản hệ thống hoặc tài khoản cá nhân phù hợp.'}</p></div><div><strong>02 · Xem phí rõ ràng</strong><p class="muted">Báo giá hiển thị phí, số dư và người nhận để bạn kiểm tra.</p></div><div><strong>03 · Theo dõi kết quả</strong><p class="muted">${checking ? 'Kết quả ghi nhận thời gian hoạt động gần nhất mà dịch vụ trả về.' : 'Yêu cầu và lịch hẹn được lưu trong lịch sử để theo dõi.'}</p></div>${nav(c, 'Quản lý tài khoản', 'accounts', 'ghost')}</div>`);
  const html = c.pageHead(title, description, checking ? '' : nav(c, 'Xem lịch sử', 'history'), 'Tác vụ Zalo') + (checking ? c.tabs('check-target', [{ value: 'phone', label: 'Số điện thoại' }, { value: 'card', label: 'Danh thiếp / PARAMS' }], type) : '') + `<div data-steps>${steps(c, 1)}</div><div class="grid-2 workflow-grid"><section class="card"><div data-step="1"><h2>${checking ? 'Tìm thông tin người dùng' : 'Chuẩn bị yêu cầu'}</h2>${choices.length <= 1 ? c.notice('Chưa có tài khoản đang hoạt động. Vào Quản lý tài khoản để thêm hoặc kiểm tra phiên.', 'warning') : ''}${form}</div><div data-step="2" hidden></div><div data-step="3" hidden></div></section>${help}</div>`;
  return { html, bind(container) {
    const form = container.querySelector('[data-workflow-form]');
    let state;
    let previewUrl;
    function show(step) {
      container.querySelector('[data-steps]').innerHTML = steps(c, step);
      container.querySelectorAll('[data-step]').forEach(el => { el.hidden = Number(el.dataset.step) !== step; });
    }
    if (!checking) {
      const imageType = form.elements.imageType;
      const fileInput = form.elements.custom_image;
      imageType.addEventListener('change', () => {
        const custom = imageType.value === 'custom';
        form.querySelector('[data-upload]').hidden = !custom; fileInput.required = custom;
      });
      form.elements.isTimer.addEventListener('change', () => { form.querySelector('[data-timer]').hidden = !form.elements.isTimer.checked; form.elements.runTime.required = form.elements.isTimer.checked; });
      fileInput.addEventListener('change', () => {
        fileInput.setCustomValidity('');
        const file = fileInput.files[0]; const slot = form.querySelector('[data-image-preview]'); slot.replaceChildren();
        if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = undefined; }
        if (!file) return;
        if (file.type !== 'image/png' || file.size > 3 * 1024 * 1024) { fileInput.setCustomValidity('Vui lòng chọn ảnh PNG không quá 3 MB.'); fileInput.reportValidity(); return; }
        previewUrl = URL.createObjectURL(file);
        const image = document.createElement('img'); image.src = previewUrl; image.alt = `Xem trước ${file.name}`; image.className = 'image-preview';
        const label = document.createElement('p'); label.className = 'muted'; label.textContent = `${file.name} · ${Math.ceil(file.size / 1024)} KB`;
        slot.append(image, label);
      });
    }
    onForm(c, form, async values => {
      if (!card && !/^\+?\d[\d\s-]{8,14}$/.test(values.phoneNumber.trim())) throw new Error('Vui lòng nhập số điện thoại hợp lệ (9–15 chữ số).');
      const isTimer = !checking && form.elements.isTimer.checked;
      let runTime = null;
      if (isTimer) {
        const date = new Date(values.runTime);
        if (!Number.isFinite(date.getTime()) || date.getTime() < Date.now() + 4.9 * 60000) throw new Error('Thời gian hẹn phải sau hiện tại ít nhất 5 phút.');
        runTime = date.toISOString();
      }
      if (!checking && values.imageType === 'custom') {
        const file = form.elements.custom_image.files[0];
        if (!file || file.type !== 'image/png' || file.size > 3 * 1024 * 1024) throw new Error('Chọn ảnh PNG không quá 3 MB trước khi tiếp tục.');
        const upload = new FormData(); upload.append('custom_image', file);
        await c.call('/zalo/upload-custom-image', { method: 'POST', body: upload });
      }
      const payload = { zaloUID: values.zaloUID, ...(card ? { encryptedFid: values.encryptedFid.trim() } : { phoneNumber: values.phoneNumber.trim() }), ...(checking ? { type } : { imageType: values.imageType, ipType: values.ipType }) };
      const response = await c.call(checking ? '/check-status/pre-check' : card ? '/send-image-by-card/decode-fid' : '/send-image-v2/search', { method: 'POST', body: payload });
      const profile = response.data?.profile || response.data;
      if (!profile || !(profile.uid || profile.userId || profile.UID)) throw new Error('Dịch vụ không trả về UID người nhận. Vui lòng kiểm tra lại.');
      const fee = response.feeInfo?.feeAmount ?? response.data?.fee;
      const balance = response.feeInfo?.currentBalance ?? response.data?.currentBalance;
      if (!Number.isFinite(Number(fee)) || !Number.isFinite(Number(balance))) throw new Error('Dịch vụ chưa trả về báo giá đầy đủ. Vui lòng thử lại trước khi xác nhận.');
      const sender = choices.find(x => x.value === values.zaloUID)?.label;
      state = { profile, fee: Number(fee), balance: Number(balance), payload, isTimer, runTime, autoDelete: !checking && form.elements.autoDelete.checked };
      const slot = container.querySelector('[data-step="2"]');
      slot.innerHTML = `<h2>Kiểm tra trước khi xác nhận</h2><div data-error role="status"></div>${person(c, profile.displayName || profile.zaloName, `UID ${profile.uid || profile.userId || profile.UID}`)}${details(c, [['Tài khoản gửi', c.h(sender)], ...(!card ? [['Số điện thoại', c.h(profile.phoneNumber || payload.phoneNumber)]] : []), ...(!checking ? [['Ảnh gửi', c.h(values.imageType === 'custom' ? 'PNG của bạn' : 'Ảnh mặc định')], ['Loại IP', c.h(values.ipType === 'both' ? 'IPv4 và IPv6' : values.ipType?.toUpperCase())], ['Xóa phía người gửi', c.h(state.autoDelete ? 'Có' : 'Không')]] : []), ['Thực hiện', isTimer ? c.date(runTime) : 'Ngay sau khi xác nhận'], ['Phí dự kiến', `<strong>${c.money(fee)}</strong>`], ['Số dư hiện tại', c.money(balance)], ['Số dư sau phí', c.money(Number(balance) - Number(fee))]])}${c.notice(c.demo ? 'Xác nhận chỉ tạo kết quả mô phỏng và cập nhật ví mẫu trên thiết bị.' : isTimer ? 'Phí sẽ được tính khi dịch vụ thực hiện lịch hẹn.' : 'Xác nhận để dịch vụ thực hiện yêu cầu và tính phí theo kết quả.', 'info')}<div class="form-actions">${button(c, 'Quay lại', 'back', 'ghost')}${button(c, c.demo ? 'Xác nhận mô phỏng' : checking ? 'Xác nhận & kiểm tra' : isTimer ? 'Xác nhận đặt lịch' : 'Xác nhận & gửi', 'confirm', 'primary', Number(balance) < Number(fee) ? 'disabled' : '')}</div>`;
      if (card) slot.insertAdjacentHTML('beforeend', `<div class="share-card-bridge"><p class="muted">Muốn liên hệ qua điện thoại? Người nhận cần tự nguyện cung cấp số.</p>${button(c, 'Yêu cầu chia sẻ số điện thoại', 'request-phone', 'secondary')}</div>`);
      show(2);
    });
    container.addEventListener('click', event => {
      const el = event.target.closest('[data-action]'); if (!el) return;
      if (el.dataset.action === 'back') show(1);
      if (el.dataset.action === 'restart') { state = null; show(1); }
      if (el.dataset.action === 'request-phone' && state) { c.app.phoneShareDraft = { recipientName: state.profile.displayName || state.profile.zaloName || '', targetUID: String(state.profile.userId || state.profile.uid || state.profile.UID) }; c.app.navigate('phone-share'); return; }
      if (el.dataset.action !== 'confirm' || !state) return;
      void busy(c, el, async () => {
        const p = state.profile;
        let endpoint;
        let payload;
        if (checking) {
          endpoint = '/check-status/confirm'; payload = { targetUserId: String(p.userId || p.uid || p.UID), zaloUID: state.payload.zaloUID, type, ...(!card ? { phoneNumber: state.payload.phoneNumber } : {}) };
        } else {
          endpoint = card ? state.isTimer ? '/send-image-by-card-timer/send' : '/send-image-by-card/send' : state.isTimer ? '/send-image-v2-timer/send' : '/send-image-v2/send';
          payload = { zaloUID: state.payload.zaloUID, imageType: state.payload.imageType, ipType: state.payload.ipType, autoDelete: state.autoDelete, isTimer: state.isTimer, runTime: state.runTime, ...(card ? { targetUID: String(p.userId || p.uid || p.UID), targetName: p.displayName || p.zaloName, targetAvatar: p.avatar || '' } : { phoneNumber: p.phoneNumber || state.payload.phoneNumber, userUID: String(p.uid || p.userId || p.UID), displayName: p.displayName, avatar: p.avatar || '' }) };
        }
        const response = await c.call(endpoint, { method: 'POST', body: payload });
        const data = response.data || {};
        const partial = data.results?.some(x => x.success === false);
        const charged = data.feeCharged ?? data.fee;
        const newBalance = data.newBalance ?? response.newBalance;
        const resultEntries = checking ? [['Lần hoạt động gần nhất', data.lastOnline === 0 ? c.badge('Đang trực tuyến', 'success') : data.lastOnline ? c.date(data.lastOnline) : 'Dịch vụ không trả về thời gian'], ['Phí báo giá', c.money(state.fee)], ['Số dư mới', newBalance === undefined ? 'Chưa có dữ liệu' : c.money(newBalance)]] : state.isTimer ? [['Lịch thực hiện', c.date(state.runTime)], ['Trạng thái', c.badge('Đang chờ', 'warning')], ['Phí dự kiến', c.money(state.fee)]] : [['Phí đã tính', charged === undefined ? 'Dịch vụ chưa trả về phí' : c.money(charged)], ['Số dư mới', newBalance === undefined ? 'Dịch vụ chưa trả về số dư' : c.money(newBalance)]];
        const results = data.results || [];
        const title = c.demo ? state.isTimer ? 'Đã tạo lịch mô phỏng' : 'Đã hoàn tất mô phỏng' : partial ? 'Yêu cầu hoàn tất một phần' : state.isTimer ? 'Dịch vụ đã nhận lịch hẹn' : checking ? 'Đã nhận kết quả kiểm tra' : 'Đã nhận kết quả từ dịch vụ';
        container.querySelector('[data-step="3"]').innerHTML = `<div class="result-icon">${c.icon(partial ? 'alert-circle' : 'check-circle', 40)}</div><h2>${c.h(title)}</h2>${c.notice(c.demo ? 'Kết quả dưới đây là dữ liệu mô phỏng, không có tin nhắn thật được gửi.' : response.message || 'Dịch vụ đã trả về kết quả.', partial ? 'warning' : 'success')}${person(c, data.displayName || p.displayName || p.zaloName, `UID ${p.uid || p.userId || p.UID}`)}${details(c, resultEntries)}${results.length ? c.table(['Yêu cầu', 'Loại', 'Kết quả', 'Chi tiết'], results.map(x => [c.h(x.reqID || '—'), c.h(x.type || '—'), status(c, x.result || (x.success ? 'SUCCESS' : 'FAILED')), c.h(x.detail || '—')])) : ''}<div class="form-actions">${button(c, 'Tạo yêu cầu khác', 'restart', 'primary')}${nav(c, state.isTimer ? 'Xem lịch hẹn' : 'Xem lịch sử', state.isTimer ? 'schedules' : 'history')}</div>`;
        show(3); c.success(title.replace(/^Đã /, 'Đã '));
      }, container.querySelector('[data-step="2"]'));
    });
  } };
}

async function history(c, scheduled) {
  const limit = 10;
  let page = 1;
  const title = scheduled ? 'Lịch hẹn Zalo' : 'Lịch sử yêu cầu';
  const endpoint = scheduled ? '/zalo-timer/history' : '/send-image/history';
  const initial = await c.call(`${endpoint}?page=1&limit=${limit}`);
  const html = c.pageHead(title, scheduled ? 'Theo dõi lịch thực hiện và kết quả của từng yêu cầu.' : 'Tra cứu yêu cầu gửi ảnh, kiểm tra trạng thái và phí đã sử dụng.', nav(c, 'Tạo yêu cầu', 'send-phone', 'primary'), 'Theo dõi Zalo')
    + c.card(scheduled ? 'Danh sách lịch hẹn' : 'Tất cả yêu cầu', `<div class="filter-bar"><label class="search-field"><span class="sr-only">Tìm trong trang hiện tại</span><input type="search" data-search placeholder="Tìm tên, SĐT, UID trong trang…"></label><label><span class="sr-only">Lọc trạng thái</span><select data-filter><option value="">Mọi trạng thái</option>${(scheduled ? [['0', 'Đang chờ'], ['1', 'Đang xử lý'], ['2', 'Thất bại'], ['3', 'Thành công']] : [['SUCCESS', 'Thành công'], ['FAILED', 'Thất bại'], ['ERROR', 'Lỗi'], ['PENDING', 'Đang chờ']]).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select></label>${button(c, `${c.icon('refresh-cw', 16)} Làm mới`, 'reload', 'secondary small')}</div><p class="muted">Bộ lọc áp dụng cho trang đang xem.</p><div data-error></div><div data-list></div>`, scheduled ? 'Phí được tính khi dịch vụ thực hiện. Chọn bản ghi để xem đầy đủ chi tiết.' : 'Mỗi loại IP có thể tạo một bản ghi riêng. Chọn Chi tiết để xem thông tin.');
  return { html, bind(container) {
    let response = initial;
    let entries = [];
    let currentRows = [];
    let totalPages = 1;
    function paint() {
      entries = listRows(c, response);
      const query = container.querySelector('[data-search]').value.trim().toLocaleLowerCase('vi');
      const filter = container.querySelector('[data-filter]').value;
      const scheduleStatus = value => ({ pending: '0', processing: '1', running: '1', failed: '2', completed: '3', success: '3' }[value] ?? String(value));
      currentRows = entries.filter(x => (!filter || (scheduled ? scheduleStatus(x.status) : String(x.sendResult)) === filter) && (!query || [x.displayName, x.targetName, x.phoneNumber, x.targetPhone, x.UID, x.targetUID, x.Detail, x.result].some(v => String(v || '').toLocaleLowerCase('vi').includes(query))));
      const pagination = response.pagination || response.data?.pagination || {};
      totalPages = Number(pagination.totalPages || Math.ceil(Number(pagination.total || entries.length) / limit) || 1);
      const labels = { 0: ['Đang chờ', 'warning'], 1: ['Đang xử lý', 'info'], 2: ['Thất bại', 'danger'], 3: ['Thành công', 'success'] };
      const rows = currentRows.map((x, i) => scheduled ? [c.date(x.runTime), person(c, x.targetName || x.displayName, x.targetPhone || x.phoneNumber || x.targetUID), c.h(x.type === 'card' ? 'Danh thiếp' : ['v2', 'phone'].includes(x.type) ? 'Số điện thoại' : x.type || 'Yêu cầu'), c.badge(...(labels[scheduleStatus(x.status)] || ['Chưa rõ', 'warning'])), c.date(x.createdAt || x.created_at), button(c, 'Chi tiết', 'detail', 'ghost small', `data-index="${i}"`)] : [c.h(`#${x.reqID || x.id || '—'}`), person(c, x.displayName, x.phoneNumber || x.UID), c.date(x.created_at || x.createdAt), c.h(Number(x.use_system_account) === 1 ? 'Hệ thống' : 'Cá nhân'), c.money(x.fee_charged ?? x.fee ?? 0), status(c, x.sendResult), button(c, 'Chi tiết', 'detail', 'ghost small', `data-index="${i}"`)]);
      container.querySelector('[data-list]').innerHTML = c.table(scheduled ? ['Thời gian chạy', 'Người nhận', 'Hình thức', 'Trạng thái', 'Ngày tạo', 'Thao tác'] : ['Mã yêu cầu', 'Người nhận', 'Thời gian', 'Tài khoản', 'Phí', 'Kết quả', 'Thao tác'], rows, query || filter ? 'Không có bản ghi phù hợp trong trang này.' : scheduled ? 'Chưa có lịch hẹn. Chọn Hẹn giờ khi tạo yêu cầu.' : 'Chưa có lịch sử yêu cầu.') + pager(c, page, totalPages, pagination.total ?? entries.length);
    }
    async function load(nextPage, el) {
      await busy(c, el, async () => { const result = await c.call(`${endpoint}?page=${nextPage}&limit=${limit}`); response = result; page = nextPage; paint(); }, container);
    }
    container.querySelector('[data-search]').addEventListener('input', paint);
    container.querySelector('[data-filter]').addEventListener('change', paint);
    container.addEventListener('click', event => {
      const el = event.target.closest('[data-action]'); if (!el) return;
      if (el.dataset.action === 'previous' && page > 1) void load(page - 1, el);
      if (el.dataset.action === 'next' && page < totalPages) void load(page + 1, el);
      if (el.dataset.action === 'reload') void load(page, el);
      if (el.dataset.action === 'detail') {
        const row = currentRows[Number(el.dataset.index)]; if (!row) return;
        c.app.modal({ title: scheduled ? 'Chi tiết lịch hẹn' : `Yêu cầu #${row.reqID || row.id || '—'}`, body: details(c, [['Người nhận', c.h(row.displayName || row.targetName || '—')], ['UID', `<code>${c.h(row.UID || row.targetUID || '—')}</code>`], ['Số điện thoại', c.h(row.phoneNumber || row.targetPhone || '—')], ['Thời gian tạo', c.date(row.created_at || row.createdAt)], ...(scheduled ? [['Thời gian chạy', c.date(row.runTime)]] : [['Phí đã tính', c.money(row.fee_charged ?? row.fee ?? 0)], ['Tài khoản gửi', c.h(row.sender_zalo_uid || '—')]]), ['Chi tiết', `<p class="break-word">${c.h(row.Detail || row.result || row.detail || 'Chưa có kết quả chi tiết.')}</p>`]]), submitLabel: 'Đóng', onSubmit: async () => {} });
      }
    });
    paint();
  } };
}

function templateParams(template) {
  if (Array.isArray(template?.params)) return template.params.map(String).filter(Boolean);
  return String(template?.params || '').split(',').map(x => x.trim()).filter(Boolean);
}

async function oaTemplates(c) {
  const rows = listRows(c, await c.call('/zalo-oa/templates'));
  const html = c.pageHead('Mẫu tin nhắn OA', 'Quản lý nội dung tham chiếu và các tham số cho mẫu Zalo Official Account.', `${button(c, 'Tìm mẫu mới từ Zalo', 'sync', 'secondary')}${button(c, `${c.icon('plus', 16)} Thêm mẫu`, 'create', 'primary')}`, 'Zalo Official Account')
    + c.card('Thư viện mẫu', `<div data-error></div>${c.table(['Mã mẫu', 'Nội dung tham chiếu', 'Tham số', 'Thao tác'], rows.map((row, i) => [`<strong>${c.h(row.template_id)}</strong>`, `<p class="break-word">${c.h(row.detail || 'Chưa có nội dung tham chiếu')}</p>`, templateParams(row).map(x => `<code>${c.h(x)}</code>`).join(' ') || '—', `<div class="actions">${button(c, 'Sửa', 'edit', 'ghost small', `data-index="${i}"`)}${button(c, 'Xóa', 'delete', 'danger small', `data-index="${i}"`)}</div>`]), 'Chưa có mẫu OA. Thêm mẫu hoặc đồng bộ từ Zalo.')}`, 'Mã mẫu cần khớp mẫu đã được duyệt trên Zalo.');
  function edit(row) {
    c.app.modal({ title: row ? 'Cập nhật mẫu OA' : 'Thêm mẫu OA', wide: true, submitLabel: 'Lưu mẫu', body: `<div class="stack">${c.field('Mã template', 'template_id', { required: true, value: row?.template_id, placeholder: 'Mã mẫu đã duyệt' })}${c.field('Nội dung tham chiếu', 'detail', { type: 'textarea', rows: 5, value: row?.detail, placeholder: 'Ví dụ: Xin chào <customer_name>, đơn <order_code>…', help: 'Văn bản tham khảo để người gửi nhận biết mẫu.' })}${c.field('Danh sách tham số', 'params', { value: templateParams(row).join(', '), placeholder: 'customer_name, order_code, date', help: 'Phân tách bằng dấu phẩy. Màn hình gửi sẽ tạo ô nhập tương ứng.' })}</div>`, onSubmit: async values => {
      const payload = { ...values, template_id: values.template_id.trim(), params: [...new Set(templateParams(values))].join(',') };
      if (!payload.template_id) throw new Error('Vui lòng nhập mã template.');
      await c.call(row ? `/zalo-oa/templates/${encodeURIComponent(row.id)}` : '/zalo-oa/templates', { method: row ? 'PUT' : 'POST', body: payload }); c.success('Đã lưu mẫu OA'); await c.app.refresh();
    } });
  }
  function reviewCandidates(response) {
    const existing = new Set(rows.map(row => String(row.template_id)));
    const candidates = listRows(c, response).filter(row => {
      const id = String(row.template_id ?? '').trim();
      if (!id || existing.has(id)) return false;
      existing.add(id); return true;
    });
    if (!candidates.length) {
      c.app.modal({ title: 'Chưa có mẫu OA mới', description: 'Danh sách Zalo trả về không có mẫu mới cần bổ sung vào thư viện.', body: c.empty('Thư viện đã có các mẫu tìm thấy', 'Bạn có thể kiểm tra lại sau hoặc thêm mẫu thủ công nếu đã có mã template hợp lệ.'), submitLabel: 'Đóng', onSubmit: async () => {} });
      return;
    }
    const saved = new Set();
    const dialog = c.app.modal({
      title: 'Chọn mẫu OA để lưu',
      description: `${c.demo ? 'Mô phỏng · ' : ''}Tìm thấy ${candidates.length} mẫu mới. Chọn mẫu, bổ sung nội dung tham chiếu rồi lưu vào thư viện.`,
      wide: true,
      submitLabel: c.demo ? 'Lưu mẫu mô phỏng đã chọn' : 'Lưu các mẫu đã chọn',
      body: c.notice('Danh sách này chưa được lưu. Chỉ các mẫu bạn chọn và xác nhận lưu mới được thêm vào thư viện.', 'info')
        + `<div class="stack">${candidates.map((row, i) => c.card(`${row.template_name || 'Mẫu OA'} · ${row.template_id}`, `<div class="stack">${check(c, `include_${i}`, `Chọn mẫu ${row.template_id}`)}<div class="form-grid">${c.field('Nội dung tham chiếu', `detail_${i}`, { type: 'textarea', rows: 3, value: row.detail || '', full: true, placeholder: 'Nhập nội dung để người gửi nhận biết mẫu này', help: 'Bắt buộc với mẫu được chọn.' })}${c.field('Danh sách tham số', `params_${i}`, { value: templateParams(row).join(', '), full: true, help: 'Các tham số từ Zalo, phân tách bằng dấu phẩy. Có thể chỉnh lại trước khi lưu.' })}</div><div data-import-result="${i}" role="status"></div></div>`)).join('')}</div>`,
      onSubmit: async (values, form) => {
        const selected = candidates.map((row, i) => ({ row, i })).filter(({ i }) => values[`include_${i}`] && !saved.has(i));
        if (!selected.length && !saved.size) throw new Error('Vui lòng chọn ít nhất một mẫu để lưu.');
        const pending = selected.map(({ row, i }) => {
          const detail = String(values[`detail_${i}`] ?? '').trim();
          if (!detail) throw new Error(`Vui lòng nhập nội dung tham chiếu cho mẫu ${row.template_id}.`);
          return { i, payload: { template_id: String(row.template_id), detail, params: [...new Set(templateParams({ params: values[`params_${i}`] ?? row.params }))].join(',') } };
        });
        for (const { i, payload } of pending) {
          try { await c.call('/zalo-oa/templates', { method: 'POST', body: payload }); }
          catch (error) {
            const prefix = saved.size ? `Đã lưu ${saved.size} mẫu. ` : '';
            throw new Error(`${prefix}Chưa lưu được mẫu ${payload.template_id}: ${error.message}. Bạn có thể thử lưu lại các mẫu còn chọn.`);
          }
          saved.add(i);
          const marker = form?.querySelector(`[data-import-result="${i}"]`);
          if (marker) marker.innerHTML = c.badge(c.demo ? 'Đã lưu mô phỏng' : 'Đã lưu vào thư viện', 'success');
          for (const name of [`include_${i}`, `detail_${i}`, `params_${i}`]) {
            const input = form?.elements?.namedItem(name);
            if (input) { input.disabled = true; input.required = false; if (input.type === 'checkbox') input.checked = false; }
          }
        }
        c.success(`Đã lưu ${saved.size} mẫu OA vào thư viện`);
        await c.app.refresh();
      },
    });
    if (dialog?.querySelector) for (let i = 0; i < candidates.length; i++) {
      const include = dialog.querySelector(`[name="include_${i}"]`);
      const detail = dialog.querySelector(`[name="detail_${i}"]`);
      const params = dialog.querySelector(`[name="params_${i}"]`);
      if (!include || !detail || !params) continue;
      const update = () => { detail.disabled = params.disabled = !include.checked; detail.required = include.checked; };
      include.addEventListener('change', update); update();
    }
  }
  return { html, bind(container) {
    container.addEventListener('click', event => {
      const el = event.target.closest('[data-action]'); if (!el) return;
      const row = rows[Number(el.dataset.index)];
      if (el.dataset.action === 'create') edit();
      if (el.dataset.action === 'edit' && row) edit(row);
      if (el.dataset.action === 'delete' && row) c.app.confirm({ title: 'Xóa mẫu OA?', description: `Xóa mẫu ${row.template_id} khỏi thư viện tham chiếu của hệ thống.`, confirmLabel: 'Xóa mẫu', onConfirm: async () => { await c.call(`/zalo-oa/templates/${encodeURIComponent(row.id)}`, { method: 'DELETE' }); c.success('Đã xóa mẫu OA'); await c.app.refresh(); } });
      if (el.dataset.action === 'sync') void busy(c, el, async () => { reviewCandidates(await c.call('/zalo-oa/fetch-new-templates')); }, container);
    });
  } };
}

async function oaSend(c) {
  const rows = listRows(c, await c.call('/zalo-oa/templates'));
  const type = c.app.getTab('oa-recipient', 'phone');
  const uid = type === 'uid';
  const options = rows.map(x => ({ value: String(x.template_id), label: `${x.template_id} · ${String(x.detail || 'Mẫu OA').slice(0, 60)}` }));
  const html = c.pageHead('Gửi tin nhắn OA', 'Chọn người nhận, mẫu và kiểm tra nội dung trước khi gửi.', nav(c, 'Quản lý mẫu', 'oa-templates'), 'Zalo Official Account')
    + c.tabs('oa-recipient', [{ value: 'phone', label: 'Gửi qua số điện thoại' }, { value: 'uid', label: 'Gửi qua UID' }], type)
    + `<div class="grid-2"><section class="card"><h2>Soạn yêu cầu</h2>${!rows.length ? c.notice('Chưa có template để gửi. Thêm mẫu trong thư viện trước khi tiếp tục.', 'warning') : ''}<form data-oa-form><div data-error role="status"></div><div class="form-grid">${c.field(uid ? 'UID người nhận' : 'Số điện thoại người nhận', uid ? 'user_id' : 'phone_number', { type: uid ? 'text' : 'tel', required: true, placeholder: uid ? 'Nhập Zalo UID' : 'Nhập số điện thoại', full: true })}${c.field('Mẫu chính', 'template_id', { type: 'select', required: true, options: [{ value: '', label: 'Chọn mẫu tin nhắn' }, ...options], full: true })}${c.field('Mẫu bổ sung (tùy chọn)', 'extra_template', { type: 'select', options: [{ value: '', label: 'Không sử dụng' }, ...options], full: true })}<div class="full" data-params></div></div><div class="form-actions">${button(c, 'Điền dữ liệu gợi ý', 'preview-data', 'ghost')}<button type="submit" class="btn primary" ${!rows.length ? 'disabled' : ''}>Kiểm tra & gửi ${c.icon('arrow-right', 16)}</button></div></form><div data-send-result aria-live="polite"></div></section><section class="card oa-preview"><h2>Nội dung mẫu</h2><div data-template-preview>${c.empty('Chọn mẫu để xem nội dung', 'Các tham số sẽ xuất hiện khi bạn chọn template.')}</div>${c.notice(c.demo ? 'Chế độ mô phỏng không gửi tin nhắn đến Zalo.' : 'Zalo OA cần token còn hiệu lực và mẫu hợp lệ. Dịch vụ có thể trả về lỗi cho từng mẫu.', 'info')}${nav(c, 'Xem kết quả OA', 'oa-results', 'ghost')}</section></div>`;
  return { html, bind(container) {
    const form = container.querySelector('[data-oa-form]');
    let paramNames = [];
    function chosen() { return [form.elements.template_id.value, form.elements.extra_template.value].filter(Boolean); }
    function update() {
      const saved = new Map([...form.querySelectorAll('[data-param]')].map(el => [el.dataset.param, el.value]));
      const templates = rows.filter(x => chosen().includes(String(x.template_id)));
      paramNames = [...new Set(templates.flatMap(templateParams))];
      container.querySelector('[data-template-preview]').innerHTML = templates.length ? templates.map(x => `<div class="stack"><div>${c.badge(`Mẫu ${x.template_id}`, 'info')}</div><p class="break-word">${c.h(x.detail || 'Mẫu chưa có nội dung tham chiếu.')}</p></div>`).join('<hr>') : c.empty('Chọn mẫu để xem nội dung', 'Các tham số xuất hiện sau khi bạn chọn template.');
      form.querySelector('[data-params]').innerHTML = paramNames.length ? `<h3>Tham số tin nhắn</h3><div class="form-grid">${paramNames.map((name, i) => c.field(name, `param_${i}`, { required: !['date', 'order_code', 'price', 'status', 'phone_number'].includes(name), value: saved.get(name) || '', placeholder: ['date', 'order_code', 'price', 'status', 'phone_number'].includes(name) ? 'Để trống để hệ thống điền' : `Nhập ${name}` })).join('')}</div>` : `<p class="muted">${templates.length ? 'Mẫu không khai báo tham số tùy chỉnh.' : 'Chọn template để nhập các tham số tương ứng.'}</p>`;
      paramNames.forEach((name, i) => { form.elements[`param_${i}`].dataset.param = name; });
    }
    form.elements.template_id.addEventListener('change', update); form.elements.extra_template.addEventListener('change', update);
    container.addEventListener('click', event => {
      const el = event.target.closest('[data-action="preview-data"]'); if (!el) return;
      void busy(c, el, async () => {
        if (!chosen().length) throw new Error('Chọn một mẫu trước để điền dữ liệu gợi ý.');
        const response = await c.call('/zalo-oa/preview-data');
        const values = response.data || {};
        paramNames.forEach((name, i) => { if (values[name] !== undefined) form.elements[`param_${i}`].value = values[name]; });
        c.app.toast(`${c.demo ? 'Mô phỏng · ' : ''}Đã điền dữ liệu gợi ý. Kiểm tra lại trước khi gửi.`, 'info');
      }, form);
    });
    onForm(c, form, async values => {
      const ids = [...new Set(chosen())];
      if (!ids.length) throw new Error('Vui lòng chọn mẫu chính.');
      if (!uid && !/^\+?\d[\d\s-]{8,14}$/.test(values.phone_number.trim())) throw new Error('Vui lòng nhập số điện thoại hợp lệ.');
      const params = Object.create(null);
      paramNames.forEach((name, i) => { if (values[`param_${i}`]?.trim()) params[name] = values[`param_${i}`].trim(); });
      const payload = { [uid ? 'user_id' : 'phone_number']: String(values[uid ? 'user_id' : 'phone_number']).trim(), template_id: ids.length === 1 ? ids[0] : ids, custom_params: params };
      c.app.confirm({ title: c.demo ? 'Gửi mô phỏng tin nhắn OA?' : 'Xác nhận gửi tin nhắn OA?', description: `Người nhận: ${payload[uid ? 'user_id' : 'phone_number']} · Mẫu ${ids.join(', ')}. ${c.demo ? 'Tác vụ dùng dữ liệu mẫu.' : 'Thao tác sẽ gửi yêu cầu đến dịch vụ Zalo OA.'}`, confirmLabel: c.demo ? 'Gửi mô phỏng' : 'Xác nhận gửi', onConfirm: async () => {
        const response = await c.call(uid ? '/zalo-oa/send-template-uid' : '/zalo-oa/send-template', { method: 'POST', body: payload });
        const results = response.results || (response.result ? [response.result] : []);
        const outcome = result => typeof result === 'object' && result !== null && result.error !== undefined ? Number(result.error) === 0 ? 'SUCCESS' : 'FAILED' : 'Chưa rõ';
        const failed = results.filter(x => outcome(x) === 'FAILED');
        const confirmed = results.length > 0 && results.every(x => outcome(x) === 'SUCCESS');
        const resultIds = response.payload_sent?.template_ids || ids;
        const label = c.demo ? 'Đã xử lý gửi OA mô phỏng' : failed.length ? 'Dịch vụ đã xử lý, có mẫu gửi lỗi' : confirmed ? 'Dịch vụ đã xác nhận gửi yêu cầu OA' : 'Dịch vụ chưa xác nhận kết quả của từng mẫu';
        container.querySelector('[data-send-result]').innerHTML = c.notice(label, confirmed ? 'success' : 'warning') + (results.length ? c.table(['Mã mẫu', 'Kết quả', 'Chi tiết / mã tin'], results.map((x, i) => [c.h(resultIds[i] || '—'), status(c, outcome(x)), c.h(x?.message || x?.data?.msg_id || JSON.stringify(x))])) : '') + nav(c, 'Mở kết quả OA', 'oa-results', 'ghost');
        if (failed.length) c.app.toast(`${c.demo ? 'Mô phỏng · ' : ''}${failed.length} mẫu trả về lỗi. Xem bảng kết quả.`, 'warning'); else if (confirmed) c.success('Đã xử lý yêu cầu gửi OA'); else c.app.toast(`${c.demo ? 'Mô phỏng · ' : ''}Đã nhận phản hồi, chưa có trạng thái gửi xác nhận.`, 'info');
      } });
    });
    update();
  } };
}

async function oaResults(c) {
  let rows = listRows(c, await c.call('/zalo-oa/results'));
  const limit = 10;
  const html = c.pageHead('Kết quả tin nhắn OA', 'Tra cứu phản hồi gửi và kiểm tra trạng thái nhận của tin nhắn.', nav(c, 'Soạn tin OA', 'oa-send', 'primary'), 'Zalo Official Account')
    + c.card('Lịch sử tin nhắn', `<div class="filter-bar"><label class="search-field"><span class="sr-only">Tìm kết quả OA</span><input type="search" data-search placeholder="Tìm SĐT / UID, mã đơn, template…"></label><label><span class="sr-only">Trạng thái kết quả OA</span><select data-filter><option value="">Mọi kết quả</option><option value="success">Thành công</option><option value="error">Lỗi</option></select></label>${button(c, 'Làm mới', 'reload', 'secondary small')}</div><div data-error></div><div data-list></div>`, 'Kiểm tra nhận tin cần mã tin nhắn do Zalo trả về.');
  return { html, bind(container) {
    let page = 1;
    let filtered = [];
    function paint() {
      const query = container.querySelector('[data-search]').value.trim().toLowerCase(); const filter = container.querySelector('[data-filter]').value;
      filtered = rows.filter(x => (!filter || x.result === filter) && (!query || [x.phone_number, x.order_code, x.template_id, x.msg_id, x.detail].some(v => String(v || '').toLowerCase().includes(query))));
      const totalPages = Math.max(1, Math.ceil(filtered.length / limit)); page = Math.min(page, totalPages);
      container.querySelector('[data-list]').innerHTML = c.table(['Mã đơn / thời gian', 'Người nhận', 'Template', 'Kết quả', 'Trạng thái / chi tiết', 'Thao tác'], filtered.slice((page - 1) * limit, page * limit).map((x, i) => [`<strong>${c.h(x.order_code || `#${x.id}`)}</strong><div class="muted">${c.date(x.created_at || x.createdAt)}</div>`, c.h(x.phone_number || x.user_id || '—'), `<code>${c.h(x.template_id)}</code>`, status(c, x.result), `<p class="break-word">${c.h(String(x.msg_status || x.detail || 'Chưa có trạng thái nhận').replace(/<br\s*\/?\s*>/gi, '\n'))}</p>`, button(c, 'Kiểm tra nhận', 'status', 'ghost small', `data-index="${(page - 1) * limit + i}" ${!x.msg_id ? 'disabled title="Chưa có mã tin nhắn"' : ''}`)]), 'Chưa có kết quả OA phù hợp.') + pager(c, page, totalPages, filtered.length);
    }
    container.querySelector('[data-search]').addEventListener('input', () => { page = 1; paint(); }); container.querySelector('[data-filter]').addEventListener('change', () => { page = 1; paint(); });
    container.addEventListener('click', event => {
      const el = event.target.closest('[data-action]'); if (!el) return;
      if (el.dataset.action === 'previous' && page > 1) { page--; paint(); }
      if (el.dataset.action === 'next' && page < Math.ceil(filtered.length / limit)) { page++; paint(); }
      if (el.dataset.action === 'reload') void busy(c, el, async () => { rows = listRows(c, await c.call('/zalo-oa/results')); paint(); }, container);
      if (el.dataset.action === 'status') void busy(c, el, async () => {
        const row = filtered[Number(el.dataset.index)]; if (!row?.msg_id) return;
        const query = new URLSearchParams({ message_id: row.msg_id, phone: row.phone_number || row.user_id || '', id: row.id });
        const response = await c.call(`/zalo-oa/message-status?${query}`); row.msg_status = typeof response.data === 'string' ? response.data : response.data?.message || response.message; paint(); c.success('Đã kiểm tra trạng thái tin nhắn');
      }, container);
    });
    paint();
  } };
}

async function oaToken(c) {
  const data = (await c.call('/zalo-oa/token')).data;
  const valid = data?.expires_at && new Date(data.expires_at).getTime() > Date.now();
  const mask = value => value ? `${String(value).slice(0, 5)}${'•'.repeat(18)}${String(value).slice(-4)}` : 'Chưa có';
  const html = c.pageHead('Kết nối Zalo OA', 'Kiểm tra thời hạn token và cấp lại phiên kết nối Official Account.', nav(c, 'Soạn tin OA', 'oa-send'), 'Zalo Official Account')
    + `<div class="grid-2">${c.card('Trạng thái kết nối', `${data ? c.badge(valid ? 'Token còn hiệu lực' : 'Token đã hết hạn', valid ? 'success' : 'danger') + details(c, [['Hết hạn lúc', c.date(data.expires_at)], ['Access token', `<code class="break-word" data-token="access_token">${c.h(mask(data.access_token))}</code>`], ['Refresh token', `<code class="break-word" data-token="refresh_token">${c.h(mask(data.refresh_token))}</code>`]]) + button(c, 'Hiện token', 'reveal', 'ghost small') : c.empty('Chưa có token', 'Nhập refresh token để thiết lập kết nối OA.')}<p class="muted">Token cấp quyền truy cập OA. Chỉ hiển thị khi cần kiểm tra.</p>`)}${c.card('Cấp lại token', `<form data-token-form><div data-error role="status"></div>${c.field('Refresh token (tùy chọn)', 'refresh_token', { type: 'password', help: 'Để trống để dùng refresh token đã lưu trên máy chủ.', placeholder: 'Nhập refresh token mới nếu cần' })}${c.notice(c.demo ? 'Cấp lại token chỉ tạo thông tin mẫu.' : 'Máy chủ cần cấu hình APP_ID và SECRET_KEY. Token mới thay thế phiên OA đang lưu.', 'info')}<div class="form-actions"><button type="submit" class="btn primary">${c.demo ? 'Cấp token mô phỏng' : 'Cấp lại token'}</button></div></form>`)}</div>`;
  return { html, bind(container) {
    let revealed = false;
    container.querySelector('[data-action="reveal"]')?.addEventListener('click', event => { revealed = !revealed; container.querySelectorAll('[data-token]').forEach(el => { el.textContent = revealed ? data[el.dataset.token] || 'Chưa có' : mask(data[el.dataset.token]); }); event.currentTarget.textContent = revealed ? 'Ẩn token' : 'Hiện token'; });
    onForm(c, container.querySelector('[data-token-form]'), async values => { await c.call('/zalo-oa/token/refresh', { method: 'POST', body: values.refresh_token ? { refresh_token: values.refresh_token.trim() } : {} }); c.success('Đã cấp lại token OA'); await c.app.refresh(); });
  } };
}

export async function renderZalo(route, app) {
  if (!routes.has(route)) return null;
  const c = context(app);
  try {
    if (route === 'accounts') return await accounts(c);
    if (['send-phone', 'send-card', 'check-status'].includes(route)) return await workflow(c, route);
    if (route === 'history' || route === 'schedules') return await history(c, route === 'schedules');
    if (route === 'oa-templates') return await oaTemplates(c);
    if (route === 'oa-send') return await oaSend(c);
    if (route === 'oa-results') return await oaResults(c);
    if (route === 'oa-token') return await oaToken(c);
  } catch (error) {
    return { html: c.pageHead('Chưa thể tải dữ liệu Zalo', 'Kiểm tra kết nối và quyền truy cập dịch vụ.') + c.card('Dịch vụ chưa sẵn sàng', `${c.notice(error.message || 'Không thể kết nối dịch vụ.', 'danger')}<div class="form-actions">${button(c, 'Thử lại', 'retry', 'primary')}${nav(c, 'Về tổng quan', 'overview')}</div>`), bind(container) { container.querySelector('[data-action="retry"]').addEventListener('click', event => { void busy(c, event.currentTarget, () => app.refresh(), container); }); } };
  }
  return null;
}
