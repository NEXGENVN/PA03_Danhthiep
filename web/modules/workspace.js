/* Workspace tools intentionally use the shared API adapter in both modes. */
const ROUTES = new Set(['ip', 'leak', 'links', 'store', 'licenses', 'deposits', 'admin-users', 'admin-zalo', 'admin-products', 'admin-licenses', 'admin-leak', 'logs', 'profile']);
const value = (object, ...keys) => keys.map(key => object?.[key]).find(item => item !== undefined && item !== null) ?? '';
const idOf = item => value(item, 'id', 'ID', 'userID', 'productID', 'licenseID');
const keyOf = item => value(item, 'licenseKey', 'LicenseKey', 'key');
const roleNumber = role => ({ admin: 1, vip: 3, user: 2 })[String(role).toLowerCase()] || Number(role) || 2;
const stringify = item => typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item ?? '');
const active = item => ![false, 0, '0', 'false'].includes(item);
const safeUrl = candidate => {
  try { const url = new URL(String(candidate)); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
};
function validIP(ip) {
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) return ip.split('.').every(part => Number(part) <= 255);
  if (!/^[\da-f:]+$/i.test(ip) || !ip.includes(':') || ip.includes(':::')) return false;
  const parts = ip.split(':');
  if (parts.some(part => part.length > 4) || (ip.match(/::/g) || []).length > 1) return false;
  return ip.includes('::') ? parts.filter(Boolean).length < 8 : parts.length === 8 && parts.every(Boolean);
}

function context(app) {
  const { h, money, number, date, badge, pageHead, card, table, field, tabs, empty, notice, rows } = app.ui;
  const sample = app.client.mode === 'demo';
  const btn = (label, action, data = '', style = 'secondary') => `<button type="button" class="btn ${style}" data-action="${h(action)}" ${data}>${h(label)}</button>`;
  const attrs = (name, item) => `data-${name}="${h(item)}"`;
  const code = text => `<code>${h(text || '—')}</code>`;
  const muted = text => `<span class="muted">${h(text || '—')}</span>`;
  const status = statusValue => {
    const text = String(statusValue ?? '');
    const labels = { PENDING: 'Chờ thanh toán', PAID: 'Thành công', CANCELLED: 'Đã hủy', pending: 'Đang chờ', success: 'Thành công', SUCCESS: 'Thành công', failed: 'Thất bại', FAILED: 'Thất bại', ERROR: 'Lỗi', active: 'Hoạt động', revoked: 'Đã thu hồi', '1': 'Hoạt động', '0': 'Vô hiệu' };
    const kind = /paid|success|^active$|hoạt động|^1$/i.test(text) ? 'success' : /fail|error|revok|cancel|^0$/i.test(text) ? 'danger' : 'warning';
    return badge(labels[text] || text || 'Chưa rõ', kind);
  };
  const detail = object => `<pre class="detail-json">${h(stringify(object))}</pre>`;
  const facts = object => `<dl class="detail-grid">${Object.entries(object).map(([label, text]) => `<div><dt>${h(label)}</dt><dd>${h(stringify(text) || '—')}</dd></div>`).join('')}</dl>`;
  const search = (placeholder = 'Tìm trong danh sách…') => `<div class="table-toolbar">${field('Tìm kiếm', 'search', { type: 'search', placeholder })}<span class="muted" data-count></span></div>`;
  const body = fields => `<div class="form-grid">${fields.join('')}</div>`;
  const submit = (label = 'Lưu thay đổi') => `<div class="form-actions"><button class="btn primary" type="submit">${h(label)}</button></div>`;
  const form = (name, fields, label) => `<form data-form="${h(name)}">${body(fields)}<div data-form-error role="alert"></div>${submit(label)}</form>`;
  const summary = stats => `<div class="grid-3">${Object.entries(stats).map(([label, text]) => `<div class="stat-card"><span class="muted">${h(label)}</span><strong>${h(text)}</strong></div>`).join('')}</div>`;
  const heading = (title, description, actions = '') => pageHead(title, description, actions);
  async function api(path, options) {
    const response = await app.client.api(path, options);
    if (response?.success === false) throw new Error(response.message || 'Máy chủ từ chối yêu cầu.');
    return response;
  }
  const success = text => app.toast(`${sample ? 'Mẫu · ' : ''}${text}`, 'success');
  const error = caught => app.toast(caught?.message || 'Không thể thực hiện yêu cầu.', 'error');
  async function mutate(path, method, requestBody, message, refresh = true) {
    const response = await api(path, { method, body: requestBody });
    success(message);
    if (refresh) await app.refresh();
    return response;
  }
  function events(container, handlers = {}) {
    container.addEventListener('click', async event => {
      const target = event.target.closest('[data-action]');
      if (!target || !container.contains(target) || !handlers[target.dataset.action]) return;
      event.preventDefault();
      target.disabled = true;
      try { await handlers[target.dataset.action](target); } catch (caught) { error(caught); }
      finally { if (target.isConnected) target.disabled = false; }
    });
  }
  function bindForm(container, name, handler) {
    const target = container.querySelector(`[data-form="${name}"]`);
    target?.addEventListener('submit', async event => {
      event.preventDefault();
      if (!target.reportValidity()) return;
      const button = target.querySelector('[type="submit"]');
      const errorBox = target.querySelector('[data-form-error]');
      if (errorBox) errorBox.innerHTML = '';
      button.disabled = true;
      try { await handler(Object.fromEntries(new FormData(target)), target); }
      catch (caught) { if (errorBox) errorBox.innerHTML = notice(caught.message || 'Không thể thực hiện yêu cầu.', 'error'); else error(caught); }
      finally { if (button.isConnected) button.disabled = false; }
    });
  }
  function filter(container, items, render, predicate = () => true) {
    const input = container.querySelector('[name="search"]');
    const draw = () => {
      const query = (input?.value || '').trim().toLocaleLowerCase('vi');
      const filtered = items.filter(item => (!query || stringify(item).toLocaleLowerCase('vi').includes(query)) && predicate(item, container));
      container.querySelector('[data-list]').innerHTML = render(filtered);
      const count = container.querySelector('[data-count]');
      if (count) count.textContent = `${filtered.length} / ${items.length} bản ghi`;
    };
    input?.addEventListener('input', draw);
    container.querySelectorAll('[data-filter]').forEach(item => item.addEventListener('change', draw));
    draw();
  }
  function showDetail(title, object) { app.modal({ title, description: sample ? 'Dữ liệu mẫu tổng hợp.' : 'Dữ liệu máy chủ trả về.', body: detail(object), submitLabel: 'Đóng', onSubmit: async () => {} }); }
  async function copy(text) {
    if (!text) throw new Error('Chưa có nội dung để sao chép.');
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(String(text)); success('Đã sao chép vào bộ nhớ tạm.'); }
    else app.modal({ title: 'Sao chép nội dung', description: 'Chọn nội dung dưới đây để sao chép.', body: field('Nội dung', 'copy', { type: 'textarea', value: text, rows: 4 }), submitLabel: 'Đóng', onSubmit: async () => {} });
  }
  function pagination(response, key, pageSize = 30) {
    const page = Number(app.getTab(key, 1)) || 1;
    const meta = response.pagination || response.data?.pagination || {};
    const totalPages = Number(meta.totalPages || Math.ceil(Number(meta.total || 0) / pageSize)) || 1;
    return `<div class="pagination">${btn('Trang trước', 'page', `data-key="${h(key)}" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}`, 'ghost small')}<span>Trang ${h(page)} / ${h(totalPages)}</span>${btn('Trang sau', 'page', `data-key="${h(key)}" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}`, 'ghost small')}</div>`;
  }
  function pageHandler(target) { app.setTab(target.dataset.key, Number(target.dataset.page)); return app.refresh(); }
  return { app, ...app.ui, h, money, number, date, badge, pageHead, card, table, field, tabs, empty, notice, rows, sample, btn, attrs, code, muted, status, detail, facts, search, body, submit, form, summary, heading, api, success, error, mutate, events, bindForm, filter, showDetail, copy, pagination, pageHandler };
}

async function ipPage(c) {
  const { h, card, form, field, heading, notice, empty, api, bindForm, facts, safe = safeUrl } = c;
  return {
    html: heading('Tra cứu vị trí IP', 'Đối chiếu thông tin khu vực, mạng và tọa độ từ nhiều nguồn.') + `<div class="grid-2">${card('Nhập địa chỉ IP', form('ip', [field('Địa chỉ IPv4 hoặc IPv6', 'ip', { required: true, placeholder: '192.0.2.10' })], 'Tra cứu vị trí'))}${card('Thông tin bản đồ', notice('Vị trí IP là vị trí gần đúng của mạng. Kết quả thể hiện nguồn và tọa độ để đối chiếu.'))}</div><div data-result aria-live="polite">${empty('Sẵn sàng tra cứu', 'Nhập địa chỉ IP để xem kết quả tại đây.')}</div>`,
    bind(container) {
      bindForm(container, 'ip', async values => {
        const ip = values.ip.trim();
        if (!validIP(ip)) throw new Error('Địa chỉ IP không hợp lệ. Hãy kiểm tra IPv4 hoặc IPv6.');
        const response = await api('/api/check-ip/location', { method: 'POST', body: { ip } });
        const items = Array.isArray(response.data) ? response.data : response.data ? [response.data] : [];
        container.querySelector('[data-result]').innerHTML = items.length ? `<div class="stack">${items.map(item => {
          const map = safe(item.mapUrl || item.map_url);
          return card(item.source || 'Nguồn tra cứu', facts({ 'Địa chỉ IP': item.ip || ip, 'Loại IP': item.ipType || '', 'Khu vực': item.region, 'Thành phố': item.city, 'Quốc gia': item.country, 'Mạng / ISP': item.network || item.isp, 'Vĩ độ': item.latitude, 'Kinh độ': item.longitude }) + (map ? `<p><a href="${h(map)}" target="_blank" rel="noopener noreferrer">Mở vị trí trên bản đồ ↗</a></p>` : notice('Nguồn này không cung cấp liên kết bản đồ.')));
        }).join('')}</div>` : empty('Chưa có kết quả', 'Máy chủ không trả về thông tin vị trí cho IP này.');
        c.success('Đã hoàn tất tra cứu IP.');
      });
    }
  };
}

async function leakPage(c, admin = false) {
  const { app, h, card, heading, tabs, field, form, api, rows, search, table, code, money, date, btn, attrs, filter, events, showDetail, pagination, pageHandler, bindForm, facts, notice } = c;
  const tab = admin ? 'history' : app.getTab('leak', 'phone');
  const pageKey = admin ? 'admin-leak-page' : 'leak-page';
  const page = Number(app.getTab(pageKey, 1)) || 1;
  const response = tab === 'history' ? await api(`${admin ? '/api/admin/leak-history' : '/api/leak-lookup/history'}?page=${page}&limit=${admin ? 20 : 30}`) : { data: [] };
  const records = rows(response);
  let setup = null;
  if (admin) setup = (await api('/api/admin/tool-setup')).data || {};
  const list = listItems => table(admin ? ['Người dùng', 'Loại / từ khóa', 'Kết quả', 'Phí', 'Ngày', ''] : ['Loại / từ khóa', 'Kết quả', 'Phí', 'Ngày', ''], listItems.map(item => [
    ...(admin ? [h(value(item, 'userName', 'userID'))] : []),
    `<strong>${h(value(item, 'searchType', 'type'))}</strong><br>${code(value(item, 'searchValue', 'value'))}`,
    h(value(item, 'resultsCount', 'resultCount') || 0), money(value(item, 'fee_charged', 'fee') || 0), date(value(item, 'createdAt', 'created_at')),
    btn('Xem kết quả', 'detail', attrs('index', records.indexOf(item)), 'ghost small')
  ]), 'Chưa có lịch sử tra cứu.');
  let content;
  if (tab === 'history') content = card('Lịch sử tra cứu', search('Tìm loại, từ khóa, người dùng…') + `<div data-list>${list(records)}</div>` + pagination(response, pageKey, admin ? 20 : 30));
  else {
    const label = tab === 'phone' ? 'Số điện thoại' : tab === 'email' ? 'Địa chỉ email' : 'UID, số điện thoại hoặc liên kết Facebook';
    content = `<div class="grid-2">${card('1. Nhập thông tin', form('leak', [field(label, 'value', { type: tab === 'email' ? 'email' : 'text', required: true, placeholder: tab === 'email' ? 'person@example.test' : tab === 'phone' ? '0900000000' : '100000000001' })], 'Tiếp tục · xem phí'))}${card('Quy trình tra cứu', '<ol class="steps"><li>Nhập thông tin cần kiểm tra.</li><li>Xem phí và số dư trước khi xác nhận.</li><li>Đọc các bản ghi theo nguồn dữ liệu.</li></ol>' + notice('Hệ thống chỉ tính phí khi tìm thấy dữ liệu khớp.'))}</div><div data-result aria-live="polite"></div>`;
  }
  const config = admin ? `<div class="grid-2">${card('Phí tra cứu dữ liệu', form('leak-fee', [field('Phí mỗi lượt có kết quả (₫)', 'check_data_leak_money', { type: 'number', min: 0, required: true, value: setup.check_data_leak_money || 0 })], 'Lưu mức phí'))}${card('Thống kê lịch sử', c.summary({ 'Tổng lượt': c.number(response.pagination?.total || records.length), 'Doanh thu': money(response.totalRevenue ?? records.reduce((sum, item) => sum + Number(item.fee_charged || 0), 0)), 'Kết quả trên trang': c.number(records.reduce((sum, item) => sum + Number(item.resultsCount || 0), 0)) }))}</div>` : tabs('leak', [{ value: 'phone', label: 'Điện thoại' }, { value: 'email', label: 'Email' }, { value: 'facebook', label: 'Facebook' }, { value: 'history', label: 'Lịch sử' }], tab);
  return {
    html: heading(admin ? 'Quản trị tra cứu dữ liệu' : 'Tra cứu dữ liệu rò rỉ', admin ? 'Cấu hình phí và xem lịch sử trên toàn hệ thống.' : 'Kiểm tra điện thoại, email hoặc Facebook với bước xác nhận phí.') + config + content,
    bind(container) {
      if (tab === 'history') filter(container, records, list);
      events(container, { page: pageHandler, detail: target => { const item = records[Number(target.dataset.index)]; let data = value(item, 'resultsData', 'results'); try { if (typeof data === 'string') data = JSON.parse(data); } catch {} showDetail('Chi tiết kết quả tra cứu', data || item); } });
      if (admin) bindForm(container, 'leak-fee', values => c.mutate('/api/admin/tool-setup', 'PUT', { check_data_leak_money: Number(values.check_data_leak_money) }, 'Đã cập nhật phí tra cứu.'));
      else if (tab !== 'history') bindForm(container, 'leak', async values => {
        let query = values.value.trim();
        if (tab === 'phone') {
          if (!/^(0\d{9}|84\d{9})$/.test(query)) throw new Error('Nhập số điện thoại gồm 10 chữ số hoặc bắt đầu bằng 84.');
          if (query.startsWith('0')) query = `84${query.slice(1)}`;
        }
        if (tab === 'facebook') {
          if (/^https?:\/\//i.test(query)) {
            const resolved = await api('/api/facebook/find-uid', { method: 'POST', body: { link: query } });
            query = String(resolved.data?.id || resolved.data?.uid || '');
            if (!query) throw new Error('Máy chủ không trả về UID Facebook.');
          } else if (!/^\d+$/.test(query)) throw new Error('Nhập UID, số điện thoại hoặc URL Facebook hợp lệ.');
          if (/^84\d{9}$/.test(query)) query = `0${query.slice(2)}`;
        }
        const checked = await api('/api/leak-lookup/pre-check', { method: 'POST', body: { type: tab, value: query } });
        const data = checked.data || checked;
        const fee = Number(data.fee || 0), balance = Number(data.currentBalance ?? data.totalMoney ?? app.client.user?.totalMoney ?? 0);
        if (balance < fee) throw new Error(`Số dư ${money(balance)} chưa đủ phí ${money(fee)}. Vui lòng nạp thêm tiền.`);
        app.modal({ title: '2. Xác nhận tra cứu', description: c.sample ? 'Thao tác mẫu, không tra cứu nhà cung cấp thực.' : 'Phí chỉ được tính khi có kết quả.', body: facts({ 'Thông tin tra cứu': query, 'Phí tối đa': money(fee), 'Số dư': money(balance), 'Còn lại nếu tính phí': money(balance - fee) }), submitLabel: 'Xác nhận tra cứu', onSubmit: async () => {
          const result = await api('/api/leak-lookup/confirm', { method: 'POST', body: { type: tab, value: query } });
          const resultRows = result.results || (Array.isArray(result.data) ? result.data : result.data?.results) || [];
          container.querySelector('[data-result]').innerHTML = card('3. Kết quả tra cứu', notice(`${c.sample ? 'Mẫu · ' : ''}${resultRows.length} bản ghi. ${result.charged ? `Đã tính phí ${money(result.fee || fee)}.` : 'Không tính phí.'}`) + (resultRows.length ? resultRows.map((item, index) => card(item.source || `Bản ghi ${index + 1}`, facts(Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'source'))))).join('') : c.empty('Không tìm thấy dữ liệu', 'Không có bản ghi khớp với thông tin đã nhập.')));
          c.success('Đã hoàn tất tra cứu dữ liệu.');
        } });
      });
    }
  };
}

async function linksPage(c) {
  const { app, h, api, rows, heading, tabs, card, table, search, field, btn, attrs, code, date, filter, events, form, bindForm, facts } = c;
  const tab = app.getTab('links', 'links');
  const endpoint = tab === 'thumbnail' ? 'results-thumbnail' : tab;
  const response = await api(`/api/link/${endpoint}`);
  const items = rows(response);
  const templates = tab === 'links' ? rows(await api('/api/link/templates')) : [];
  const domains = tab === 'links' ? rows(await api('/api/link/domains')) : [];
  const isResult = ['results', 'thumbnail'].includes(tab);
  const locationOptions = [{ value: 0, label: 'Không lấy vị trí' }, { value: 1, label: 'Chỉ lấy vị trí' }, { value: 2, label: 'Kèm giải thích' }, { value: 3, label: 'Cần cấp quyền để xem nội dung' }];
  const linkURL = item => value(item, 'full_url', 'fullUrl', 'link_url', 'link', 'url');
  const shortURL = item => value(item, 'short_link', 'short_url', 'shortUrl', 'shortLink');
  const render = list => {
    if (tab === 'templates') return table(['Tên mẫu', 'URL / tiêu đề', 'Thumbnail', 'Ngày tạo', ''], list.map(item => [
      `<strong>${h(item.name)}</strong><br>${code(item.id)}`, `${h(item.link)}<br>${c.muted(item.title)}`, item.thumbnail ? h(item.thumbnail) : c.muted('Chưa có'), date(value(item, 'created_at', 'createdAt')), `<div class="actions">${btn('Sửa', 'edit', attrs('index', items.indexOf(item)), 'ghost small')}${btn('Xóa', 'delete', attrs('index', items.indexOf(item)), 'danger small')}</div>`
    ]), 'Chưa có trang mẫu. Thêm mẫu đầu tiên để tạo link.');
    if (tab === 'domains') return table(['Domain', 'Ghi chú', 'Ngày tạo', ''], list.map(item => [code(item.domain), h(item.detail || '—'), date(value(item, 'created_at', 'createdAt')), `<div class="actions">${btn('Chi tiết', 'detail', attrs('index', items.indexOf(item)), 'ghost small')}${btn('Sửa', 'edit', attrs('index', items.indexOf(item)), 'ghost small')}${btn('Xóa', 'delete', attrs('index', items.indexOf(item)), 'danger small')}</div>`]), 'Chưa có domain.');
    if (isResult) return table(['ID / tên link', 'Kết quả', 'Ngày tạo', ''], list.map(item => [
      `<strong>${h(value(item, 'link_name', 'linkName', 'name'))}</strong><br>${code(value(item, 'link_id', 'linkID', 'id'))}`, `<span class="truncate">${h(stringify(value(item, 'result', 'Result', 'detail', 'Detail', 'data')).slice(0, 140))}</span>`, date(value(item, 'created_at', 'createdAt')), btn('Xem đầy đủ', 'detail', attrs('index', items.indexOf(item)), 'ghost small')
    ]), 'Chưa có kết quả truy cập.');
    return table(['Tên link', 'URL đầy đủ / rút gọn', 'Chế độ vị trí', 'Ngày tạo', ''], list.map(item => [
      `<strong>${h(item.name)}</strong><br>${code(item.id)}`, `<div class="url-cell">${code(linkURL(item))}${shortURL(item) ? `<br>${code(shortURL(item))}` : ''}</div>`, h(locationOptions.find(option => String(option.value) === String(item.location_type))?.label || item.location_type || 'Không lấy vị trí'), date(value(item, 'created_at', 'createdAt')), `<div class="actions">${btn('Copy URL', 'copy', attrs('index', items.indexOf(item)), 'ghost small')}${shortURL(item) ? btn('Copy rút gọn', 'copy-short', attrs('index', items.indexOf(item)), 'ghost small') : ''}${btn('Sửa', 'edit', attrs('index', items.indexOf(item)), 'ghost small')}</div>`
    ]), 'Chưa có link. Tạo link từ một trang mẫu và domain.');
  };
  const label = tab === 'templates' ? 'trang mẫu' : tab === 'domains' ? 'domain' : 'link';
  const metaTools = tab === 'templates' ? `<div class="grid-2">${card('Lấy metadata từ URL', form('meta', [field('URL trang nguồn', 'link', { type: 'url', required: true, placeholder: 'https://example.test/bai-viet' })], 'Lấy tiêu đề & thumbnail'))}${card('Tải thumbnail', form('thumbnail', [field('Ảnh thumbnail', 'thumbnail', { type: 'file', required: true, help: 'Chọn ảnh JPG, PNG hoặc WebP, tối đa 3 MB.' })], 'Tải ảnh'))}</div>` : '';
  const edit = (item = {}) => {
    let fields;
    if (tab === 'templates') fields = [field('Tên mẫu', 'name', { required: true, value: item.name }), field('URL trang nguồn', 'link', { type: 'url', required: true, value: item.link }), field('Tiêu đề hiển thị', 'title', { value: item.title }), field('URL thumbnail', 'thumbnail', { type: 'url', value: item.thumbnail })];
    else if (tab === 'domains') fields = [field('Domain', 'domain', { required: true, value: item.domain, placeholder: 'links.example.test' }), field('Ghi chú', 'detail', { type: 'textarea', value: item.detail, rows: 3 })];
    else {
      if (!item.id && (!templates.length || !domains.length)) { app.toast('Cần ít nhất một trang mẫu và một domain trước khi tạo link.', 'error'); return; }
      fields = [field('Tên link', 'name', { required: true, value: item.name }), ...(!item.id ? [field('Trang mẫu', 'template_id', { type: 'select', required: true, options: templates.map(entry => ({ value: entry.id, label: entry.name })) }), field('Domain', 'domain_id', { type: 'select', required: true, options: domains.map(entry => ({ value: entry.id, label: entry.domain })) })] : []), field('Chế độ vị trí', 'location_type', { type: 'select', value: item.location_type || 0, options: locationOptions })];
    }
    const dialog = app.modal({ title: `${item.id ? 'Sửa' : 'Thêm'} ${label}`, description: tab === 'links' && !item.id ? 'Domain được gợi ý theo trang mẫu. Bạn có thể chọn lại trước khi lưu.' : '', body: c.body(fields), submitLabel: 'Lưu', onSubmit: async values => {
      const payload = { ...values };
      if (tab === 'links') { payload.location_type = Number(payload.location_type); if (!item.id) { payload.template_id = Number(payload.template_id); payload.domain_id = Number(payload.domain_id); } }
      if (tab === 'domains' && /\s/.test(payload.domain)) throw new Error('Domain không được chứa khoảng trắng.');
      return c.mutate(`/api/link/${tab}${item.id ? `/${encodeURIComponent(item.id)}` : ''}`, item.id ? 'PUT' : 'POST', payload, `Đã lưu ${label}.`);
    } });
    if (tab === 'links' && !item.id && dialog?.querySelector) {
      const templateSelect = dialog.querySelector('[name="template_id"]');
      const domainSelect = dialog.querySelector('[name="domain_id"]');
      const suggestDomain = () => {
        const selected = templates.find(entry => String(entry.id) === templateSelect.value);
        const link = String(selected?.link || '').toLowerCase();
        const keyword = link.includes('facebook') ? 'facebook' : link.includes('tiktok') ? 'tiktok' : 'baomoi';
        const suggested = domains.find(entry => String(entry.domain).toLowerCase().includes(keyword)) || domains.find(entry => String(entry.domain).toLowerCase().includes('baomoi')) || domains[0];
        if (suggested) domainSelect.value = String(suggested.id);
      };
      templateSelect?.addEventListener('change', suggestDomain);
      if (templateSelect && domainSelect) suggestDomain();
    }
  };
  return {
    html: heading('Bộ công cụ Link', 'Quản lý trang mẫu, domain, link và kết quả truy cập.', !isResult ? btn(`Thêm ${label}`, 'create', '', 'primary') : '') + tabs('links', [{ value: 'links', label: 'Danh sách link' }, { value: 'templates', label: 'Trang mẫu' }, { value: 'domains', label: 'Domain' }, { value: 'results', label: 'Kết quả link' }, { value: 'thumbnail', label: 'Kết quả thumbnail' }], tab) + card(isResult ? 'Kết quả truy cập' : `Danh sách ${label}`, search(isResult ? 'Lọc theo ID, tên link hoặc kết quả…' : 'Tìm kiếm…') + `<div data-list>${render(items)}</div>`) + metaTools,
    bind(container) {
      filter(container, items, render);
      events(container, {
        create: () => edit(), edit: target => edit(items[Number(target.dataset.index)]),
        detail: target => c.showDetail(tab === 'domains' ? 'Chi tiết domain' : 'Chi tiết kết quả', items[Number(target.dataset.index)]),
        copy: target => c.copy(linkURL(items[Number(target.dataset.index)])),
        'copy-short': target => c.copy(shortURL(items[Number(target.dataset.index)])),
        delete: target => { const item = items[Number(target.dataset.index)]; return app.confirm({ title: `Xóa ${label}?`, description: tab === 'templates' ? 'Các link liên quan đến trang mẫu cũng sẽ bị xóa.' : `Xóa domain ${item.domain}.`, confirmLabel: 'Xóa', onConfirm: () => c.mutate(`/api/link/${tab}/${encodeURIComponent(item.id)}`, 'DELETE', undefined, `Đã xóa ${label}.`) }); }
      });
      bindForm(container, 'meta', async values => {
        const response = await api('/api/link/fetch-meta', { method: 'POST', body: { link: values.link, template_id: null } });
        const data = response.data || response;
        edit({ link: values.link, title: data.title || response.title, thumbnail: data.thumbnail || response.thumbnail });
        c.success('Đã lấy metadata. Có thể bổ sung tên rồi lưu thành trang mẫu.');
      });
      bindForm(container, 'thumbnail', async (_, target) => {
        const file = target.elements.thumbnail.files[0];
        if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Chọn một ảnh PNG, JPG hoặc WebP.');
        if (file.size > 3 * 1024 * 1024) throw new Error('Ảnh không được lớn hơn 3 MB.');
        const payload = new FormData(); payload.append('thumbnail', file);
        const response = await api('/api/link/upload-thumbnail', { method: 'POST', body: payload });
        const url = response.url || response.thumbnail || response.data?.url || response.data?.thumbnail;
        if (!url) throw new Error('Máy chủ không trả về URL ảnh.');
        app.modal({ title: 'Thumbnail đã tải', description: c.sample ? 'URL ảnh mẫu.' : 'Dùng URL này trong trang mẫu.', body: field('URL thumbnail', 'thumbnail', { value: url }), submitLabel: 'Sao chép URL', onSubmit: () => c.copy(url) });
      });
      const imageInput = container.querySelector('[data-form="thumbnail"] input[type="file"]');
      if (imageInput) {
        imageInput.accept = 'image/png,image/jpeg,image/webp';
        imageInput.addEventListener('change', () => {
          container.querySelector('[data-local-preview]')?.remove();
          const file = imageInput.files[0];
          if (!file || !file.type.startsWith('image/')) return;
          const image = document.createElement('img');
          image.className = 'image-preview'; image.alt = 'Xem trước thumbnail đã chọn'; image.dataset.localPreview = '';
          const localURL = URL.createObjectURL(file); image.src = localURL;
          image.addEventListener('load', () => URL.revokeObjectURL(localURL), { once: true });
          imageInput.closest('label').after(image);
        });
      }
    }
  };
}

async function storePage(c) {
  const { app, h, api, rows, heading, card, search, field, btn, attrs, money, filter, events, facts } = c;
  const products = rows(await api('/api/licenses/products'));
  const render = list => list.length ? `<div class="grid-3">${list.map(product => card(product.productName, `<div class="product-icon">${c.icon('key', 30)}</div><p>${h(product.productDesc || 'License sử dụng công cụ PA03.')}</p><div class="price-list"><p>1 lượt <strong>${money(product.productOnePrice)}</strong></p><p>5 lượt <strong>${money(product.productFivePrice)}</strong></p><p>10 lượt <strong>${money(product.productTenPrice)}</strong></p></div>${field('Chọn gói sử dụng', `package-${idOf(product)}`, { type: 'select', value: 1, options: [{ value: 1, label: `1 lượt · ${money(product.productOnePrice)}` }, { value: 2, label: `5 lượt · ${money(product.productFivePrice)}` }, { value: 3, label: `10 lượt · ${money(product.productTenPrice)}` }] })}${btn('Mua license', 'buy', attrs('id', idOf(product)), 'primary')}`)).join('')}</div>` : c.empty('Chưa có sản phẩm', 'Cửa hàng chưa có license phù hợp với từ khóa.');
  return {
    html: heading('Cửa hàng license', 'Chọn gói 1, 5 hoặc 10 lượt và thanh toán từ ví.', `<a class="btn secondary" href="#licenses" data-nav="licenses">License đã mua</a>`) + c.summary({ 'Số dư ví': money(app.client.user?.totalMoney || 0), 'Sản phẩm': c.number(products.length), 'Gói sử dụng': '1 · 5 · 10 lượt' }) + search('Tìm sản phẩm…') + `<div data-list>${render(products)}</div>`,
    bind(container) {
      filter(container, products, render);
      events(container, { buy: async target => {
        const product = products.find(item => String(idOf(item)) === target.dataset.id);
        const packageInput = container.querySelector(`[name="package-${CSS.escape(String(idOf(product)))}"]`);
        const licenseType = Number(packageInput?.value || 1);
        const uses = { 1: 1, 2: 5, 3: 10 }[licenseType];
        const price = Number(product[{ 1: 'productOnePrice', 2: 'productFivePrice', 3: 'productTenPrice' }[licenseType]] || 0);
        const profile = await api('/api/auth/profile');
        const balance = Number(profile.data?.totalMoney ?? app.client.user?.totalMoney ?? 0);
        if (price > balance) throw new Error(`Số dư ${money(balance)} chưa đủ mua gói ${money(price)}.`);
        app.modal({ title: 'Xác nhận mua license', description: c.sample ? 'Mua mô phỏng bằng ví mẫu.' : 'Kiểm tra thông tin trước khi thanh toán.', body: facts({ 'Sản phẩm': product.productName, 'Gói sử dụng': `${uses} lượt`, 'Thanh toán': money(price), 'Số dư sau mua': money(balance - price) }), submitLabel: `Mua · ${money(price)}`, onSubmit: async () => {
          const response = await api('/api/licenses/purchase', { method: 'POST', body: { productID: idOf(product), licenseType } });
          const license = response.data?.license || response.data || response.license || {};
          c.success('Đã mua license. Mở “License đã mua” để xem và sao chép key.');
          await app.refresh();
          // Opening after the confirmation closes avoids two nested dialogs.
          setTimeout(() => app.modal({ title: c.sample ? 'License mẫu đã tạo' : 'License đã mua', body: field('License key', 'licenseKey', { type: 'textarea', value: keyOf(license), rows: 3 }) + facts({ 'Sản phẩm': product.productName, 'Số lượt': uses, 'Giá mua': money(price) }), submitLabel: 'Sao chép key', onSubmit: () => c.copy(keyOf(license)) }), 0);
        } });
      } });
    }
  };
}

async function licensesPage(c, admin = false) {
  const { app, h, api, rows, heading, card, table, search, field, btn, attrs, code, money, date, filter, events, facts } = c;
  const pageKey = 'admin-license-page';
  const page = Number(app.getTab(pageKey, 1)) || 1;
  const filterKeys = { productID: 'admin-license-product', status: 'admin-license-status', userName: 'admin-license-user' };
  const selected = Object.fromEntries(Object.entries(filterKeys).map(([name, key]) => [name, String(app.getTab(key, ''))]));
  const queryParams = new URLSearchParams({ page: String(page), limit: '20' });
  for (const [name, selectedValue] of Object.entries(selected)) if (selectedValue !== '') queryParams.set(name, selectedValue);
  const query = admin ? `?${queryParams}` : '';
  const response = await api(`${admin ? '/api/admin/licenses' : '/api/licenses/my-licenses'}${query}`);
  const items = rows(response);
  const products = admin ? rows(await api('/api/admin/products')) : [];
  const render = list => table(['License key', 'Sản phẩm', ...(admin ? ['Người mua'] : []), 'Lượt còn lại', 'Giá / ngày mua', 'Trạng thái', ''], list.map(item => [
    code(keyOf(item)), h(item.productName), ...(admin ? [h(value(item, 'userName', 'userID') || 'Chưa mua')] : []), h(value(item, 'countDown', 'remainingUses', 'count') || 0), `${money(item.pricePaid || 0)}<br>${c.muted(date(value(item, 'purchaseTime', 'createdAt')))}`, c.badge(({ '0': 'Chưa kích hoạt', '1': 'Hoạt động', '2': 'Hết hạn / thu hồi', active: 'Hoạt động', pending: 'Chưa kích hoạt', revoked: 'Đã thu hồi' })[String(value(item, 'status', 'licenseStatus'))] || 'Chưa rõ', String(value(item, 'status', 'licenseStatus')) === '1' ? 'success' : String(value(item, 'status', 'licenseStatus')) === '2' ? 'danger' : 'neutral'), `<div class="actions">${btn('Copy', 'copy', attrs('index', items.indexOf(item)), 'ghost small')}${btn('Chi tiết', 'detail', attrs('index', items.indexOf(item)), 'ghost small')}${admin ? btn('Tăng lượt', 'extend', attrs('index', items.indexOf(item)), 'secondary small') + btn('Thu hồi', 'revoke', attrs('index', items.indexOf(item)), 'danger small') : ''}</div>`
  ]), 'Chưa có license phù hợp.');
  const controls = admin ? `<form data-form="license-filters"><div class="form-grid">${field('Sản phẩm', 'productID', { type: 'select', value: selected.productID, options: [{ value: '', label: 'Tất cả sản phẩm' }, ...products.map(item => ({ value: idOf(item), label: item.productName }))] })}${field('Trạng thái', 'status', { type: 'select', value: selected.status, options: [{ value: '', label: 'Tất cả trạng thái' }, { value: 1, label: 'Hoạt động' }, { value: 0, label: 'Chưa kích hoạt' }, { value: 2, label: 'Hết hạn / thu hồi' }] })}${field('Tên người mua', 'userName', { value: selected.userName, placeholder: 'Nhập chính xác tên tài khoản', help: 'Tìm trên toàn bộ license của tài khoản.' })}</div><div data-form-error role="alert"></div><div class="form-actions">${btn('Xóa bộ lọc', 'license-clear', '', 'secondary')}<button type="submit" class="btn primary">Áp dụng bộ lọc</button></div></form>` : '';
  return {
    html: heading(admin ? 'Quản trị license' : 'License đã mua', admin ? 'Lọc license, xem chi tiết, tăng lượt và thu hồi với lý do.' : 'Xem key, số lượt và thời điểm kích hoạt của các license trong tài khoản.', admin ? '' : '<a class="btn primary" href="#store" data-nav="store">Mở cửa hàng</a>') + card('Danh sách license', controls + search(admin ? 'Tìm nhanh trên trang đang xem…' : 'Tìm key hoặc sản phẩm…') + `<div data-list>${render(items)}</div>` + (admin ? c.pagination(response, pageKey, 20) : '')),
    bind(container) {
      filter(container, items, render);
      if (admin) c.bindForm(container, 'license-filters', async values => {
        for (const [name, key] of Object.entries(filterKeys)) app.setTab(key, String(values[name] || '').trim());
        app.setTab(pageKey, 1);
        await app.refresh();
      });
      events(container, {
        page: c.pageHandler,
        'license-clear': async () => {
          for (const key of Object.values(filterKeys)) app.setTab(key, '');
          app.setTab(pageKey, 1);
          await app.refresh();
        },
        copy: target => c.copy(keyOf(items[Number(target.dataset.index)])),
        detail: async target => {
          let item = items[Number(target.dataset.index)];
          if (admin) item = (await api(`/api/admin/licenses/${encodeURIComponent(keyOf(item))}`)).data || item;
          c.showDetail('Chi tiết license', item);
        },
        extend: target => {
          const item = items[Number(target.dataset.index)];
          app.modal({ title: 'Tăng lượt sử dụng', body: facts({ 'License': keyOf(item), 'Sản phẩm': item.productName }) + field('Số lượt tăng thêm', 'count', { type: 'number', required: true, min: 1, step: 1, value: 1 }), submitLabel: 'Tăng lượt', onSubmit: values => c.mutate(`/api/admin/licenses/${encodeURIComponent(keyOf(item))}/extend`, 'POST', { count: Number(values.count) }, 'Đã tăng lượt sử dụng.') });
        },
        revoke: target => {
          const item = items[Number(target.dataset.index)];
          app.modal({ title: 'Thu hồi license', description: `License ${keyOf(item)}`, body: field('Lý do thu hồi', 'reason', { type: 'textarea', required: true, rows: 3 }), submitLabel: 'Thu hồi license', onSubmit: values => c.mutate(`/api/admin/licenses/${encodeURIComponent(keyOf(item))}/revoke`, 'POST', { reason: values.reason.trim() }, 'Đã thu hồi license.') });
        }
      });
    }
  };
}

async function depositsPage(c) {
  const { app, h, api, rows, heading, card, form, field, money, search, table, code, date, btn, attrs, filter, events, bindForm, notice, facts } = c;
  const items = rows(await api('/api/payos/history'));
  const pending = item => ['0', 'PENDING', 'pending'].includes(String(item.status));
  const depositStatus = item => c.badge(pending(item) ? 'Chờ thanh toán' : ['1', 'PAID', 'success'].includes(String(item.status)) ? 'Thành công' : 'Đã hủy', pending(item) ? 'warning' : ['1', 'PAID', 'success'].includes(String(item.status)) ? 'success' : 'danger');
  const render = list => table(['Ngày tạo', 'Mã giao dịch', 'Số tiền', 'Trạng thái', ''], list.map(item => [date(value(item, 'createdAt', 'created_at')), code(value(item, 'addInfo', 'orderCode', 'id')), money(item.amount), depositStatus(item), `<div class="actions">${btn('Chi tiết', 'detail', attrs('index', items.indexOf(item)), 'ghost small')}${pending(item) ? `${btn(c.sample ? 'Xem thanh toán mẫu' : 'Tiếp tục thanh toán', 'pay', attrs('index', items.indexOf(item)), 'secondary small')}${btn('Hủy', 'cancel', attrs('index', items.indexOf(item)), 'danger small')}` : ''}</div>`]), 'Chưa có giao dịch nạp tiền.');
  function checkout(item) {
    if (c.sample) {
      c.showDetail('Yêu cầu nạp tiền mẫu', { 'Thông báo': 'Đây là giao dịch mô phỏng. Không mở cổng thanh toán thật và không chuyển tiền.', 'Mã giao dịch': value(item, 'addInfo', 'orderCode', 'id'), 'Số tiền': money(item.amount), 'Trạng thái': 'Chờ thanh toán mẫu' });
      return;
    }
    const url = safeUrl(value(item, 'cashLink', 'checkoutUrl', 'checkout_url'));
    if (!url) throw new Error('Giao dịch chưa có liên kết thanh toán hợp lệ.');
    app.modal({ title: 'Tiếp tục thanh toán', description: 'Liên kết dưới đây do máy chủ PayOS trả về.', body: facts({ 'Mã giao dịch': value(item, 'addInfo', 'orderCode', 'id'), 'Số tiền': money(item.amount) }) + `<a class="btn primary" href="${h(url)}" target="_blank" rel="noopener noreferrer">Mở cổng thanh toán ↗</a>`, submitLabel: 'Đóng', onSubmit: async () => {} });
  }
  return {
    html: heading('Nạp tiền vào ví', 'Tạo yêu cầu PayOS và quản lý lịch sử thanh toán.') + `<div class="grid-2">${card('Tạo yêu cầu nạp', form('deposit', [field('Số tiền nạp (₫)', 'amount', { type: 'number', required: true, min: 10000, step: 1000, value: 100000, help: 'Tối thiểu 10.000 ₫ mỗi yêu cầu.' })], 'Tạo yêu cầu thanh toán'))}${card('Ví của bạn', facts({ 'Số dư hiện tại': money(app.client.user?.totalMoney || 0), 'Giao dịch đang chờ': items.filter(pending).length }) + notice(c.sample ? 'Chế độ mẫu: tạo và hủy giao dịch mô phỏng, không mở cổng thanh toán thật.' : 'Ví được cập nhật khi máy chủ xác nhận thanh toán. Bạn có thể làm mới lịch sử để kiểm tra.'))}</div>` + card('Lịch sử nạp tiền', search('Tìm theo mã hoặc trạng thái…') + `<div data-list>${render(items)}</div>`, '', btn('Làm mới', 'refresh', '', 'ghost small')),
    bind(container) {
      filter(container, items, render);
      events(container, { refresh: () => app.refresh(), detail: target => c.showDetail('Chi tiết giao dịch', items[Number(target.dataset.index)]), pay: target => checkout(items[Number(target.dataset.index)]), cancel: target => {
        const item = items[Number(target.dataset.index)];
        app.confirm({ title: 'Hủy yêu cầu nạp tiền?', description: `Giao dịch ${value(item, 'addInfo', 'orderCode', 'id')} · ${money(item.amount)}.`, confirmLabel: 'Hủy giao dịch', onConfirm: () => c.mutate('/api/payos/cancel', 'POST', { addInfo: value(item, 'addInfo', 'orderCode', 'id') }, 'Đã hủy yêu cầu nạp tiền.') });
      } });
      bindForm(container, 'deposit', async values => {
        const amount = Number(values.amount);
        if (!Number.isSafeInteger(amount) || amount < 10000) throw new Error('Số tiền nạp phải là số nguyên từ 10.000 ₫.');
        const response = await api('/api/payos/create', { method: 'POST', body: { amount } });
        const data = { ...response, ...(response.data || {}), amount };
        c.success('Đã tạo yêu cầu nạp tiền.');
        await app.refresh();
        setTimeout(() => { try { checkout(data); } catch (caught) { c.error(caught); } }, 0);
      });
    }
  };
}

async function usersPage(c) {
  const { app, h, api, rows, heading, tabs, card, table, search, field, btn, attrs, code, money, date, filter, events } = c;
  const tab = app.getTab('admin-users', 'users');
  const items = rows(await api(tab === 'blocks' ? '/api/admin/ip-blocks' : '/api/admin/users'));
  const currentID = value(app.client.user, 'userID', 'id');
  const role = roleValue => ({ 1: 'Admin', 3: 'VIP', 2: 'Người dùng' })[roleNumber(roleValue)];
  const render = list => tab === 'blocks' ? table(['Địa chỉ IP', 'Phạm vi', 'Lý do', 'Lần lỗi', 'Hạn chặn', ''], list.map(item => [
    code(value(item, 'ip_address', 'ipAddress')), c.badge(value(item, 'block_type', 'blockType'), 'warning'), h(item.reason || '—'), h(item.failed_count || 0), date(value(item, 'expires_at', 'expiresAt')), btn('Gỡ chặn', 'unblock', attrs('index', items.indexOf(item)), 'secondary small')
  ]), 'Không có IP đang bị chặn.') : table(['ID / người dùng', 'Email', 'Vai trò', 'Số dư', 'Trạng thái', ''], list.map(item => [
    `<strong>${h(item.userName)}</strong><br>${code(idOf(item))}`, h(item.email), c.badge(role(item.userRole), roleNumber(item.userRole) === 1 ? 'info' : 'neutral'), money(item.totalMoney), c.badge(active(item.isActive) ? 'Hoạt động' : 'Đã khóa', active(item.isActive) ? 'success' : 'danger'), `<div class="actions">${btn('Sửa', 'edit', attrs('index', items.indexOf(item)), 'ghost small')}${String(idOf(item)) !== String(currentID) ? btn('Xóa', 'delete', attrs('index', items.indexOf(item)), 'danger small') : c.muted('Tài khoản của bạn')}</div>`
  ]), 'Chưa có người dùng phù hợp.');
  const editUser = (item = {}) => app.modal({ title: item.userID || item.id ? 'Sửa người dùng' : 'Tạo người dùng', body: c.body([
    field('Tên người dùng', 'userName', { required: true, value: item.userName }), field('Email', 'email', { type: 'email', required: true, value: item.email }),
    ...(!idOf(item) ? [field('Mật khẩu ban đầu', 'password', { type: 'password', required: true, help: 'Tối thiểu 8 ký tự.' })] : []),
    field('Vai trò', 'userRole', { type: 'select', value: roleNumber(item.userRole), options: [{ value: 2, label: 'Người dùng' }, { value: 3, label: 'VIP' }, { value: 1, label: 'Admin' }] }),
    field('Số dư ví (₫)', 'totalMoney', { type: 'number', min: 0, required: true, value: item.totalMoney || 0 }),
    field('Trạng thái', 'isActive', { type: 'select', value: active(item.isActive) ? 1 : 0, options: [{ value: 1, label: 'Hoạt động' }, { value: 0, label: 'Khóa tài khoản' }] })
  ]), submitLabel: 'Lưu người dùng', onSubmit: values => {
    if (values.password && values.password.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
    return c.mutate(`/api/admin/users${idOf(item) ? `/${encodeURIComponent(idOf(item))}` : ''}`, idOf(item) ? 'PUT' : 'POST', { ...values, userRole: Number(values.userRole), totalMoney: Number(values.totalMoney), isActive: Number(values.isActive) }, 'Đã lưu người dùng.');
  } });
  const blockIP = () => app.modal({ title: 'Chặn địa chỉ IP', body: c.body([
    field('Địa chỉ IP', 'ipAddress', { required: true, placeholder: '192.0.2.25' }), field('Phạm vi chặn', 'blockType', { type: 'select', value: 'both', options: [{ value: 'both', label: 'Đăng nhập và API' }, { value: 'login', label: 'Đăng nhập' }, { value: 'api', label: 'API' }] }), field('Thời lượng chặn (phút)', 'blockMinutes', { type: 'number', required: true, min: 1, value: 60 }), field('Lý do', 'reason', { type: 'textarea', required: true, rows: 3 })
  ]), submitLabel: 'Chặn IP', onSubmit: values => {
    if (!validIP(values.ipAddress.trim())) throw new Error('Địa chỉ IP không hợp lệ.');
    return c.mutate('/api/admin/ip-blocks', 'POST', { ...values, ipAddress: values.ipAddress.trim(), blockMinutes: Number(values.blockMinutes) }, 'Đã chặn địa chỉ IP.');
  } });
  const stats = tab === 'blocks' ? { 'IP đang chặn': items.length, 'Chặn đăng nhập': items.filter(item => ['login', 'both'].includes(value(item, 'block_type', 'blockType'))).length, 'Chặn API': items.filter(item => ['api', 'both'].includes(value(item, 'block_type', 'blockType'))).length } : { 'Người dùng': items.length, 'Đang hoạt động': items.filter(item => active(item.isActive)).length, 'Quản trị viên': items.filter(item => roleNumber(item.userRole) === 1).length };
  return {
    html: heading('Quản trị người dùng', 'Quản lý tài khoản, quyền truy cập, số dư và IP bị chặn.', btn(tab === 'blocks' ? 'Chặn IP' : 'Tạo người dùng', 'create', '', 'primary')) + tabs('admin-users', [{ value: 'users', label: 'Người dùng' }, { value: 'blocks', label: 'Chặn IP' }], tab) + c.summary(stats) + card(tab === 'blocks' ? 'Danh sách chặn IP' : 'Danh sách người dùng', search(tab === 'blocks' ? 'Tìm địa chỉ IP hoặc lý do…' : 'Tìm tên, email hoặc ID…') + `<div data-list>${render(items)}</div>`),
    bind(container) {
      filter(container, items, render);
      events(container, { create: () => tab === 'blocks' ? blockIP() : editUser(), edit: target => editUser(items[Number(target.dataset.index)]), delete: target => {
        const item = items[Number(target.dataset.index)];
        app.confirm({ title: 'Xóa người dùng?', description: `Xóa tài khoản ${item.userName} (${item.email}).`, confirmLabel: 'Xóa người dùng', onConfirm: () => c.mutate(`/api/admin/users/${encodeURIComponent(idOf(item))}`, 'DELETE', undefined, 'Đã xóa người dùng.') });
      }, unblock: target => {
        const ip = value(items[Number(target.dataset.index)], 'ip_address', 'ipAddress');
        app.confirm({ title: 'Gỡ chặn IP?', description: `Cho phép địa chỉ ${ip} truy cập trở lại.`, confirmLabel: 'Gỡ chặn', onConfirm: () => c.mutate(`/api/admin/ip-blocks/${encodeURIComponent(ip)}`, 'DELETE', undefined, 'Đã gỡ chặn IP.') });
      } });
    }
  };
}

async function adminZaloPage(c) {
  const { app, h, api, rows, heading, tabs, card, field, form, table, search, btn, attrs, code, date, money, filter, events, bindForm } = c;
  const tab = app.getTab('admin-zalo', 'settings');
  const setup = (await api('/api/admin/tool-setup')).data || {};
  const accounts = rows(await api('/api/admin/zalo-accounts'));
  const requests = tab === 'requests' ? rows(await api('/api/admin/requests')) : [];
  const fees = [['zalo_system_money', 'Gửi từ tài khoản hệ thống'], ['zalo_custom_money', 'Gửi từ tài khoản người dùng'], ['check_phone_system_money', 'Last-online điện thoại · hệ thống'], ['check_phone_custom_money', 'Last-online điện thoại · người dùng'], ['check_card_money', 'Last-online qua danh thiếp']];
  const renderAccounts = list => table(['Tài khoản', 'UID', 'Điện thoại', 'Chủ tài khoản', 'Trạng thái', ''], list.map(item => [h(value(item, 'displayName', 'name')), code(item.UID), h(item.phoneNumber || '—'), h(value(item, 'userName', 'userID')), c.status(value(item, 'accStatus', 'status')), btn('Chi tiết', 'account-detail', attrs('index', accounts.indexOf(item)), 'ghost small')]), 'Chưa có tài khoản Zalo hệ thống.');
  const renderRequests = list => table(['Mã / người nhận', 'Người gửi', 'Phí', 'Kết quả', 'Ngày tạo', ''], list.map(item => [
    `${code(value(item, 'reqID', 'id'))}<br>${h(item.phoneNumber || item.displayName || '—')}`, `${h(item.sender_zalo_uid || '—')}<br>${c.muted(Number(item.use_system_account) === 1 ? 'Tài khoản hệ thống' : 'Tài khoản người dùng')}`, money(item.fee_charged || 0), c.status(value(item, 'sendResult', 'status')), date(value(item, 'created_at', 'createdAt')), btn('Chi tiết', 'request-detail', attrs('index', requests.indexOf(item)), 'ghost small')
  ]), 'Chưa có yêu cầu gửi.');
  let content;
  if (tab === 'settings') content = `<div class="grid-2">${card('Tài khoản gửi hệ thống & mức phí', form('zalo-fees', [field('Tài khoản Zalo hệ thống', 'uid_zalo_system', { type: 'select', value: setup.uid_zalo_system || '', options: [{ value: '', label: 'Không dùng tài khoản hệ thống' }, ...accounts.map(item => ({ value: item.UID, label: `${item.displayName || item.UID} · ${item.phoneNumber || 'Chưa có SĐT'}` }))] }), ...fees.map(([name, label]) => field(`${label} (₫)`, name, { type: 'number', required: true, min: 0, value: setup[name] || 0 }))], 'Lưu cấu hình'))}${card('Cấu hình hiện tại', c.facts({ 'UID gửi hệ thống': setup.uid_zalo_system || 'Chưa thiết lập', ...Object.fromEntries(fees.map(([name, label]) => [label, money(setup[name] || 0)])) }))}</div>`;
  else if (tab === 'accounts') content = card('Tất cả tài khoản Zalo', search('Tìm tên, UID hoặc số điện thoại…') + `<div data-list>${renderAccounts(accounts)}</div>`);
  else content = c.summary({ 'Yêu cầu': requests.length, 'Thành công': requests.filter(item => item.sendResult === 'SUCCESS').length, 'Doanh thu trên danh sách': money(requests.reduce((sum, item) => sum + Number(item.fee_charged || 0), 0)) }) + card('Yêu cầu tự động', search('Tìm điện thoại, UID hoặc nội dung…') + `<div data-filter>${field('Kết quả gửi', 'requestStatus', { type: 'select', options: [{ value: '', label: 'Tất cả' }, 'SUCCESS', 'FAILED', 'ERROR'] })}</div><div data-list>${renderRequests(requests)}</div>`);
  return {
    html: heading('Quản trị Zalo', 'Chọn tài khoản gửi hệ thống, cấu hình phí và theo dõi yêu cầu.') + tabs('admin-zalo', [{ value: 'settings', label: 'Cấu hình & phí' }, { value: 'accounts', label: 'Tài khoản Zalo' }, { value: 'requests', label: 'Yêu cầu tự động' }], tab) + content,
    bind(container) {
      if (tab === 'accounts') filter(container, accounts, renderAccounts);
      if (tab === 'requests') filter(container, requests, renderRequests, item => !container.querySelector('[name="requestStatus"]').value || item.sendResult === container.querySelector('[name="requestStatus"]').value);
      events(container, { 'account-detail': target => c.showDetail('Chi tiết tài khoản Zalo', accounts[Number(target.dataset.index)]), 'request-detail': target => c.showDetail('Chi tiết yêu cầu', requests[Number(target.dataset.index)]) });
      bindForm(container, 'zalo-fees', values => c.mutate('/api/admin/tool-setup', 'PUT', { uid_zalo_system: values.uid_zalo_system || null, ...Object.fromEntries(fees.map(([name]) => [name, Number(values[name])])) }, 'Đã cập nhật tài khoản hệ thống và mức phí.'));
    }
  };
}

async function productsPage(c) {
  const { app, h, api, rows, heading, card, table, search, field, btn, attrs, code, money, filter, events } = c;
  const items = rows(await api('/api/admin/products'));
  const render = list => table(['Sản phẩm', '1 lượt', '5 lượt', '10 lượt', 'Trạng thái', ''], list.map(item => [
    `<strong>${h(item.productName)}</strong><br>${code(idOf(item))}<br>${c.muted(item.productDesc)}`, money(item.productOnePrice), money(item.productFivePrice), money(item.productTenPrice), c.badge(active(item.isActive) ? 'Đang bán' : 'Đã ẩn', active(item.isActive) ? 'success' : 'neutral'), `<div class="actions">${btn('Sửa', 'edit', attrs('index', items.indexOf(item)), 'ghost small')}${btn(active(item.isActive) ? 'Ẩn' : 'Bật bán', 'toggle', attrs('index', items.indexOf(item)), 'secondary small')}${btn('Xóa', 'delete', attrs('index', items.indexOf(item)), 'danger small')}</div>`
  ]), 'Chưa có sản phẩm. Thêm sản phẩm đầu tiên cho cửa hàng.');
  const edit = (item = {}) => app.modal({ title: idOf(item) ? 'Sửa sản phẩm' : 'Thêm sản phẩm', wide: true, body: c.body([
    field('Tên sản phẩm', 'productName', { required: true, value: item.productName }), field('URL ảnh', 'productImage', { type: 'url', value: item.productImage, placeholder: 'https://example.test/anh.png' }),
    field('Mô tả sản phẩm', 'productDesc', { type: 'textarea', rows: 3, full: true, value: item.productDesc }),
    field('Giá gói 1 lượt (₫)', 'productOnePrice', { type: 'number', min: 0, required: true, value: item.productOnePrice || 0 }),
    field('Giá gói 5 lượt (₫)', 'productFivePrice', { type: 'number', min: 0, required: true, value: item.productFivePrice || 0 }),
    field('Giá gói 10 lượt (₫)', 'productTenPrice', { type: 'number', min: 0, required: true, value: item.productTenPrice || 0 }),
    field('Trạng thái', 'isActive', { type: 'select', value: active(item.isActive) ? 1 : 0, options: [{ value: 1, label: 'Đang bán' }, { value: 0, label: 'Ẩn sản phẩm' }] })
  ]), submitLabel: 'Lưu sản phẩm', onSubmit: values => c.mutate(`/api/admin/products${idOf(item) ? `/${encodeURIComponent(idOf(item))}` : ''}`, idOf(item) ? 'PUT' : 'POST', { ...values, productOnePrice: Number(values.productOnePrice), productFivePrice: Number(values.productFivePrice), productTenPrice: Number(values.productTenPrice), isActive: Number(values.isActive) }, 'Đã lưu sản phẩm.') });
  return {
    html: heading('Quản trị sản phẩm', 'Quản lý nội dung, giá gói 1/5/10 lượt và trạng thái hiển thị.', btn('Thêm sản phẩm', 'create', '', 'primary')) + card('Danh sách sản phẩm', search('Tìm tên hoặc mô tả sản phẩm…') + `<div data-filter>${field('Trạng thái', 'productStatus', { type: 'select', options: [{ value: '', label: 'Tất cả' }, { value: 1, label: 'Đang bán' }, { value: 0, label: 'Đã ẩn' }] })}</div><div data-list>${render(items)}</div>`),
    bind(container) {
      filter(container, items, render, item => !container.querySelector('[name="productStatus"]').value || Number(active(item.isActive)) === Number(container.querySelector('[name="productStatus"]').value));
      events(container, { create: () => edit(), edit: target => edit(items[Number(target.dataset.index)]), toggle: target => {
        const item = items[Number(target.dataset.index)];
        return c.mutate(`/api/admin/products/${encodeURIComponent(idOf(item))}`, 'PUT', { isActive: active(item.isActive) ? 0 : 1 }, active(item.isActive) ? 'Đã ẩn sản phẩm.' : 'Đã bật bán sản phẩm.');
      }, delete: target => {
        const item = items[Number(target.dataset.index)];
        app.confirm({ title: 'Xóa sản phẩm?', description: `${item.productName}. Sản phẩm đã có license được mua sẽ được vô hiệu hóa để giữ lịch sử.`, confirmLabel: 'Xóa sản phẩm', onConfirm: () => c.mutate(`/api/admin/products/${encodeURIComponent(idOf(item))}`, 'DELETE', undefined, 'Đã xử lý xóa sản phẩm.') });
      } });
    }
  };
}

async function logsPage(c) {
  const { app, h, api, rows, heading, tabs, card, table, search, field, btn, attrs, code, date, filter, events, facts } = c;
  const tab = app.getTab('logs', 'mine');
  const isAdmin = roleNumber(app.client.user?.userRole) === 1;
  const actualTab = !isAdmin && tab !== 'mine' ? 'mine' : tab;
  let items = [], stats = null, health = null, failure = '';
  if (actualTab === 'system') {
    const result = await Promise.allSettled([api('/api/logs/admin/system-stats?days=7'), c.sample ? Promise.resolve({ 'Chế độ': 'Mẫu · dữ liệu tổng hợp', 'Kết nối dịch vụ thực': 'Không kiểm tra trong chế độ mẫu' }) : app.client.health()]);
    if (result[0].status === 'fulfilled') stats = result[0].value.data || result[0].value;
    else failure = result[0].reason?.message || 'Không tải được thống kê hệ thống.';
    if (result[1].status === 'fulfilled') health = result[1].value;
    else health = { 'Kết nối': result[1].reason?.message || 'Không kết nối được máy chủ.' };
  } else {
    const path = actualTab === 'security' ? '/api/logs/admin/security?hours=24&limit=100' : actualTab === 'all' ? '/api/logs/admin/all?limit=100&offset=0' : '/api/logs?limit=100&offset=0';
    const response = await api(path);
    items = rows(response);
    if (!items.length && response.data?.alerts) items = response.data.alerts;
  }
  const render = list => table(['Thời gian', 'Sự kiện / endpoint', 'Người dùng / IP', 'Trạng thái', 'Thời gian xử lý', ''], list.map(item => [
    date(value(item, 'created_at', 'createdAt', 'timestamp')),
    `<strong>${h(value(item, 'event_type', 'eventType', 'alert_type'))}</strong><br>${code(value(item, 'endpoint', 'request_url', 'path'))}`,
    `${h(value(item, 'userName', 'userID') || 'Khách')}<br>${code(value(item, 'ip_address', 'ipAddress'))}`,
    c.badge(value(item, 'response_status', 'statusCode', 'status') || '—', Number(value(item, 'response_status', 'statusCode')) >= 400 ? 'danger' : 'success'),
    `${h(value(item, 'response_time_ms', 'response_time', 'responseTime') || 0)} ms`, btn('Chi tiết', 'detail', attrs('index', items.indexOf(item)), 'ghost small')
  ]), 'Chưa có nhật ký phù hợp với bộ lọc.');
  let content;
  if (actualTab === 'system') {
    const sums = stats?.summary || stats || {};
    content = (failure ? c.notice(failure, 'error') : '') + c.summary({ 'Yêu cầu 7 ngày': c.number(sums.totalRequests || 0), 'Lỗi': c.number(sums.totalErrors ?? sums.failedRequests ?? 0), 'Phản hồi trung bình': `${c.number(sums.avgResponseTime || 0)} ms` }) + `<div class="grid-2">${card('Trạng thái kết nối', c.detail(health))}${card('Tổng quan hệ thống', stats ? facts({ 'Thành công': sums.totalSuccess ?? sums.successfulRequests ?? 0, 'Giới hạn truy cập': sums.totalRateLimits || 0, 'Người dùng': sums.uniqueUsers || 0, 'Địa chỉ IP': sums.uniqueIPs || 0, 'Chu kỳ thống kê': stats.period || '7 ngày' }) : c.empty('Thống kê chưa sẵn sàng', 'Kiểm tra trạng thái máy chủ và làm mới.'))}</div>` + (stats ? card('Các endpoint và sự kiện', c.detail({ 'Loại sự kiện': stats.eventTypes || [], 'Lỗi HTTP': stats.errorStats || [], 'Người dùng hoạt động': stats.topUsers || [], 'Địa chỉ IP hoạt động': stats.topIPs || [] })) : '');
  } else content = card(actualTab === 'security' ? 'Cảnh báo bảo mật trong 24 giờ' : 'Nhật ký API gần nhất', search('Tìm sự kiện, endpoint, người dùng hoặc IP…') + `<div class="form-grid"><div data-filter>${field('Mã HTTP', 'logStatus', { type: 'select', options: [{ value: '', label: 'Tất cả' }, { value: 'success', label: 'Thành công · dưới 400' }, { value: 'error', label: 'Lỗi · từ 400' }] })}</div><div data-filter>${field('Từ ngày', 'logDate', { type: 'date' })}</div></div><div data-list>${render(items)}</div>`, 'Tối đa 100 bản ghi mới nhất. Bộ lọc áp dụng trên danh sách này.');
  return {
    html: heading('Nhật ký & hệ thống', 'Theo dõi yêu cầu API, chi tiết phản hồi và tình trạng kết nối.', btn('Làm mới', 'refresh', '', 'secondary')) + tabs('logs', [{ value: 'mine', label: 'Nhật ký của tôi' }, ...(isAdmin ? [{ value: 'all', label: 'Toàn hệ thống' }, { value: 'security', label: 'Bảo mật' }, { value: 'system', label: 'Trạng thái hệ thống' }] : [])], actualTab) + content,
    bind(container) {
      if (actualTab !== 'system') filter(container, items, render, item => {
        const status = container.querySelector('[name="logStatus"]')?.value;
        const after = container.querySelector('[name="logDate"]')?.value;
        const http = Number(value(item, 'response_status', 'statusCode', 'status'));
        const created = String(value(item, 'created_at', 'createdAt', 'timestamp'));
        return (!status || (status === 'error' ? http >= 400 : http < 400)) && (!after || created.slice(0, 10) >= after);
      });
      events(container, { refresh: () => app.refresh(), detail: target => c.showDetail('Chi tiết nhật ký', items[Number(target.dataset.index)]) });
    }
  };
}

async function profilePage(c) {
  const { app, api, heading, card, facts, field, form, bindForm } = c;
  const response = await api('/api/auth/profile');
  const user = response.data?.user || response.data || app.client.user || {};
  return {
    html: heading('Hồ sơ cá nhân', 'Thông tin tài khoản, ví và bảo mật đăng nhập.') + `<div class="grid-2">${card('Thông tin tài khoản', facts({ 'Tên người dùng': user.userName || user.username, 'Email': user.email, 'Vai trò': roleNumber(user.userRole) === 1 ? 'Quản trị viên' : roleNumber(user.userRole) === 3 ? 'VIP' : 'Người dùng', 'Số dư ví': c.money(user.totalMoney || 0), 'Đăng nhập gần nhất': c.date(value(user, 'lastLogin', 'lastLoginAt', 'last_login')), 'Ngày tạo': c.date(value(user, 'createdAt', 'created_at')) }), '', '<a class="btn ghost small" href="#deposits" data-nav="deposits">Nạp tiền</a>')}${card('Đổi mật khẩu', form('password', [field('Mật khẩu hiện tại', 'currentPassword', { type: 'password', required: true }), field('Mật khẩu mới', 'newPassword', { type: 'password', required: true, help: 'Tối thiểu 8 ký tự.' }), field('Nhập lại mật khẩu mới', 'confirmPassword', { type: 'password', required: true })], 'Đổi mật khẩu'))}</div>`,
    bind(container) {
      bindForm(container, 'password', async (values, target) => {
        if (values.newPassword.length < 8) throw new Error('Mật khẩu mới cần ít nhất 8 ký tự.');
        if (values.newPassword !== values.confirmPassword) throw new Error('Hai mật khẩu mới chưa khớp.');
        if (values.currentPassword === values.newPassword) throw new Error('Mật khẩu mới cần khác mật khẩu hiện tại.');
        await c.mutate('/api/auth/change-password', 'POST', values, 'Đã đổi mật khẩu.', false);
        target.reset();
      });
    }
  };
}

export async function renderWorkspace(route, app) {
  if (!ROUTES.has(route)) return null;
  const c = context(app);
  try {
    switch (route) {
      case 'ip': return await ipPage(c);
      case 'leak': return await leakPage(c);
      case 'links': return await linksPage(c);
      case 'store': return await storePage(c);
      case 'licenses': return await licensesPage(c);
      case 'deposits': return await depositsPage(c);
      case 'admin-users': return await usersPage(c);
      case 'admin-zalo': return await adminZaloPage(c);
      case 'admin-products': return await productsPage(c);
      case 'admin-licenses': return await licensesPage(c, true);
      case 'admin-leak': return await leakPage(c, true);
      case 'logs': return await logsPage(c);
      case 'profile': return await profilePage(c);
      default: return null;
    }
  } catch (caught) {
    return { html: c.heading('Dịch vụ chưa sẵn sàng', 'Không tải được dữ liệu cho màn hình này.') + c.notice(caught.message || 'Không thể kết nối máy chủ.', 'error') + c.empty('Dữ liệu chưa sẵn sàng', 'Kiểm tra kết nối và cấu hình dịch vụ, sau đó thử lại.', c.btn('Thử lại', 'retry', '', 'primary')), bind(container) { c.events(container, { retry: () => app.refresh() }); } };
  }
}
