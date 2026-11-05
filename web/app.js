import * as ui from './ui.js';
import { createClient } from './data.js';
import { renderZalo } from './modules/zalo.js';
import { renderWorkspace } from './modules/workspace.js';
import { renderPhoneShare } from './modules/phone-share.js';

const { h, icon, money, number, date, badge, pageHead, card, table, rows } = ui;
const groups = [
  { label: 'Không gian làm việc', items: [
    ['overview', 'Tổng quan', 'grid', 'Hoạt động, số dư và trạng thái kết nối'],
    ['accounts', 'Tài khoản Zalo', 'users', 'Quản lý tài khoản và phiên đăng nhập'],
  ] },
  { label: 'Công cụ Zalo', items: [
    ['send-phone', 'Gửi ảnh theo SĐT', 'send', 'Tìm người nhận và gửi hình ảnh'],
    ['send-card', 'Gửi qua danh thiếp', 'card', 'Giải mã PARAMS và gửi ảnh'],
    ['phone-share', 'Xin chia sẻ số điện thoại', 'phone', 'Tạo liên kết để người nhận tự nguyện chia sẻ số điện thoại'],
    ['check-status', 'Kiểm tra trạng thái', 'activity', 'Tra cứu last-online theo điện thoại hoặc danh thiếp'],
    ['history', 'Lịch sử yêu cầu', 'clock', 'Kết quả, chi phí và chi tiết yêu cầu'],
    ['schedules', 'Lịch hẹn gửi', 'calendar', 'Danh sách yêu cầu đã lên lịch'],
  ] },
  { label: 'Zalo Official Account', admin: true, items: [
    ['oa-send', 'Gửi tin nhắn OA', 'message', 'Gửi template theo số điện thoại hoặc UID'],
    ['oa-templates', 'Thư viện template', 'layers', 'Quản lý nội dung và tham số mẫu'],
    ['oa-results', 'Kết quả OA', 'file', 'Kết quả gửi và trạng thái tin nhắn'],
    ['oa-token', 'Kết nối OA', 'key', 'Quản lý token và thời hạn kết nối'],
  ] },
  { label: 'Tiện ích & dịch vụ', items: [
    ['ip', 'Tra cứu địa chỉ IP', 'globe', 'Vị trí và thông tin mạng'],
    ['leak', 'Tra cứu dữ liệu', 'search', 'Điện thoại, email, Facebook và lịch sử', true],
    ['links', 'Quản lý liên kết', 'link', 'Trang mẫu, domain và kết quả truy cập', true],
    ['store', 'Cửa hàng license', 'shopping', 'Sản phẩm và gói bản quyền'],
    ['licenses', 'License đã mua', 'key', 'Bản quyền, số lượt và trạng thái'],
    ['deposits', 'Ví & nạp tiền', 'wallet', 'Số dư, yêu cầu nạp và lịch sử'],
  ] },
  { label: 'Quản trị hệ thống', admin: true, items: [
    ['admin-users', 'Người dùng & quyền', 'shield', 'Tài khoản, vai trò và IP bị chặn'],
    ['admin-zalo', 'Cấu hình Zalo', 'settings', 'Tài khoản hệ thống và bảng phí'],
    ['admin-products', 'Quản lý sản phẩm', 'box', 'Sản phẩm, giá và trạng thái'],
    ['admin-licenses', 'Quản lý license', 'key', 'Chi tiết, tăng lượt và thu hồi'],
    ['admin-leak', 'Quản lý tra cứu', 'search', 'Phí và lịch sử toàn hệ thống'],
  ] },
  { label: 'Tài khoản', items: [
    ['logs', 'Nhật ký & hệ thống', 'file', 'Nhật ký, cảnh báo và trạng thái máy chủ'],
    ['profile', 'Hồ sơ cá nhân', 'user', 'Thông tin tài khoản và đổi mật khẩu'],
  ] },
];
const allRoutes = groups.flatMap(group => group.items.map(item => ({ id:item[0], title:item[1], icon:item[2], description:item[3], admin:!!group.admin || !!item[4], group:group.label })));
const client = createClient();
let rendering = 0, activeModal = 0;
const state = { route:'overview', tabs:new Map(), health:null };
const isAdmin = () => client.mode === 'demo' || [1,'1','admin'].includes(client.user?.userRole);
const initials = value => String(value || 'PA').trim().split(/[\s_]+/).slice(-2).map(x => x[0]).join('').toUpperCase();
const availableRoutes = () => allRoutes.filter(item => !item.admin || isAdmin());
const app = {
  ui, client,
  getTab(key, fallback) { return state.tabs.has(key) ? state.tabs.get(key) : fallback; },
  setTab(key, value) { state.tabs.set(key, value); },
  navigate(route) { closeSidebar(); if (location.hash.replace(/^#\/?/, '') === route) void render(); else location.hash = route; },
  refresh: () => render(),
  toast(message, type = 'success') {
    const kind = type === 'danger' ? 'error' : type;
    const toast = document.createElement('div'); toast.className = `toast ${kind}`;
    toast.innerHTML = `${icon(kind === 'error' ? 'warning' : kind === 'info' ? 'info' : 'check')}<span>${h(message)}</span>`;
    document.querySelector('#toast-region').append(toast); setTimeout(() => toast.remove(), 5500);
  },
  modal(config) {
    const { title, description = '', body = '', submitLabel = 'Lưu thay đổi', onSubmit, wide = false, onCancel } = config;
    const dialog = document.querySelector('#dialog'), serial = ++activeModal;
    if (dialog.open) dialog.close();
    dialog.className = wide ? 'wide' : '';
    dialog.innerHTML = `<form class="dialog-form"><div class="dialog-head"><div><h2 id="dialog-title">${h(title)}</h2>${description ? `<p>${h(description)}</p>` : ''}</div><button class="icon-button" type="button" data-close aria-label="Đóng hộp thoại">${icon('close',18)}</button></div><div class="dialog-body">${body}<div class="dialog-error" role="alert"></div></div><div class="dialog-actions">${onSubmit && submitLabel !== 'Đóng' ? '<button type="button" class="btn secondary" data-close>Hủy</button>' : ''}<button type="submit" class="btn ${onSubmit && submitLabel !== 'Đóng' ? 'primary' : 'secondary'}">${h(submitLabel)}</button></div></form>`;
    const close = () => { dialog.close(); onCancel?.(); };
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
    dialog.oncancel = () => onCancel?.();
    const form = dialog.querySelector('form');
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (!form.reportValidity()) return;
      if (!onSubmit) { close(); return; }
      const submit = form.querySelector('[type=submit]'), error = form.querySelector('.dialog-error');
      if (submit.disabled) return;
      submit.disabled = true; const label = submit.textContent; submit.textContent = 'Đang xử lý…'; error.classList.remove('visible');
      try { await onSubmit(Object.fromEntries(new FormData(form)), form); if (serial === activeModal) dialog.close(); }
      catch (caught) { error.textContent = caught.message || 'Không thể hoàn tất thao tác. Vui lòng thử lại.'; error.classList.add('visible'); }
      finally { if (submit.isConnected) { submit.disabled = false; submit.textContent = label; } }
    });
    dialog.showModal();
    return dialog;
  },
  confirm({ title, description, confirmLabel = 'Xác nhận', onConfirm }) { return app.modal({ title, description, body:ui.notice(client.mode === 'demo' ? 'Bạn đang thao tác với dữ liệu mẫu. Không gửi yêu cầu tới nhà cung cấp.' : 'Thao tác này sử dụng dữ liệu trên máy chủ đã kết nối.'), submitLabel:confirmLabel, onSubmit:onConfirm }); },
};

function renderShell() {
  document.querySelector('#app').innerHTML = `<div class="layout"><aside class="sidebar" aria-label="Điều hướng chính"><a href="#overview" data-nav="overview" class="brand"><div class="brand-symbol">P</div><div class="brand-name">PA03<span>WORKSPACE</span></div></a><div class="workspace-switch"><span class="workspace-icon">${icon('layers',16)}</span><div><strong>Không gian PA03</strong><small>Công cụ & vận hành</small></div>${icon('down',13)}</div><nav class="nav-scroll" id="navigation"></nav><div class="nav-bottom"><button type="button" class="nav-help" data-global="help">${icon('help',16)}Hướng dẫn sử dụng${icon('external',12)}</button><div class="nav-user" data-global="profile" role="button" tabindex="0"><span class="avatar" data-user-avatar>ĐP</span><div><strong data-user-name>Điều phối demo</strong><small data-user-role>Quản trị viên</small></div>${icon('down',12)}</div></div></aside><div class="sidebar-shade" data-global="close-nav"></div><main class="main-shell"><header class="topbar"><div class="inline"><button type="button" class="icon-button mobile-toggle" data-global="menu" aria-label="Mở menu">${icon('menu')}</button><div class="breadcrumb"><span>Không gian làm việc</span>${icon('chevron')}<strong id="breadcrumb-title">Tổng quan</strong></div></div><div class="top-actions"><button type="button" class="top-search" data-global="search">${icon('search',16)}<span>Tìm công cụ…</span><kbd class="keycap">⌘ K</kbd></button><button type="button" class="mode-pill" data-global="mode"><i></i><span data-mode-label>Xem mẫu</span>${icon('down',11)}</button><span class="top-divider"></span><button type="button" class="icon-button" data-global="notifications" aria-label="Thông báo">${icon('bell',18)}<i class="notification-dot"></i></button><button type="button" class="icon-button" data-global="help" aria-label="Trợ giúp">${icon('help',18)}</button><button type="button" class="icon-button" data-global="profile" aria-label="Hồ sơ cá nhân"><span class="avatar small" data-user-avatar>ĐP</span></button></div></header><div id="content" class="content" tabindex="-1"></div><footer class="footer"><span>© 2026 PA03 Workspace <span>·</span> Không gian cho công việc mỗi ngày</span><span><i></i><span data-footer-mode>Dữ liệu mẫu · Sẵn sàng trải nghiệm</span></span></footer></main></div>`;
  updateShell();
}
function updateShell() {
  document.querySelector('#navigation').innerHTML = groups.filter(group => !group.admin || isAdmin()).map(group => `<div class="nav-group"><div class="nav-label">${h(group.label)}</div>${group.items.filter(item => !item[4] || isAdmin()).map(([id,title,glyph]) => `<a href="#${id}" data-nav="${id}" class="nav-item${state.route === id ? ' active' : ''}"${state.route === id ? ' aria-current="page"' : ''}>${icon(glyph,17)}<span>${h(title)}</span>${id === 'accounts' && client.mode === 'demo' ? '<span class="nav-count">05</span>' : ''}</a>`).join('')}</div>`).join('');
  const user = client.user;
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user?.fullname || user?.userName || 'Chưa đăng nhập');
  document.querySelectorAll('[data-user-avatar]').forEach(el => el.textContent = initials(user?.fullname || user?.userName || 'PA03'));
  document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = isAdmin() ? 'Quản trị viên' : [3,'3','vip'].includes(user?.userRole) ? 'Thành viên VIP' : 'Thành viên');
  document.querySelector('[data-mode-label]').textContent = client.mode === 'demo' ? 'Xem mẫu' : 'Backend cục bộ';
  document.querySelector('.mode-pill').classList.toggle('live', client.mode === 'live');
  document.querySelector('[data-footer-mode]').textContent = client.mode === 'demo' ? 'Dữ liệu mẫu · Không gửi tác vụ thật' : 'Đang sử dụng dữ liệu backend';
}
function closeSidebar() { document.querySelector('.sidebar')?.classList.remove('open'); }
function sampleBanner() { return client.mode === 'demo' ? `<div class="welcome-note">${icon('eye',16)}<span>Đang xem dữ liệu mẫu. Bạn có thể thử mọi công cụ mà không gửi tin hay tạo thanh toán thật.</span><a href="#" data-global="connect">Kết nối backend ${icon('arrow',12)}</a></div>` : ''; }
async function overview() {
  const [profileResult, accountResult, historyResult, licenseResult] = await Promise.all([
    client.api('/auth/profile'), client.api('/zalo-accounts'), client.api('/send-image/history?limit=8'), client.api('/licenses/my-licenses'),
  ]);
  const user = profileResult.data, accounts = rows(accountResult), requests = rows(historyResult), licenses = rows(licenseResult);
  const activeCount = accounts.filter(account => /đang hoạt động|active|^1$|^3$/i.test(account.accStatus)).length;
  const successCount = requests.filter(item => /success|thành công/i.test(item.sendResult)).length;
  const ratio = requests.length ? (successCount / requests.length * 100).toFixed(1) : '0';
  const stats = [
    { label:'Yêu cầu gần đây', value:number(requests.length), glyph:'send', foot:`${successCount} yêu cầu hoàn tất`, sub:'trong danh sách hiện tại' },
    { label:'Tài khoản hoạt động', value:`${activeCount}<span class="stat-unit"> / ${accounts.length}</span>`, glyph:'users', foot:`${accounts.length} tài khoản`, sub:'đã kết nối vào không gian' },
    { label:'Tỷ lệ hoàn tất', value:`${ratio}<span class="stat-unit">%</span>`, glyph:'activity', foot:`${licenses.length} license`, sub:'đang thuộc tài khoản' },
    { label:'Số dư ví', value:money(user.totalMoney), glyph:'wallet', foot:'Ví PA03', sub:client.mode === 'demo' ? 'số dư minh họa' : 'số dư từ backend', wallet:true },
  ];
  const latestTable = table(['Người nhận / mục tiêu', 'Loại yêu cầu', 'Thời gian', 'Trạng thái', 'Chi phí'], requests.slice(0,5).map((item,index) => [
    `<div class="person-cell"><span class="avatar small ${['','blue','lilac','sand'][index%4]}">${h(initials(item.displayName))}</span><div><strong>${h(item.displayName || item.phoneNumber || '—')}</strong><span>${h(item.phoneNumber || item.UID || '')}</span></div></div>`,
    `<span>${icon(item.type === 'card' ? 'card' : 'image',12)} &nbsp;${item.type === 'check-status' ? 'Trạng thái' : item.type === 'card' ? 'Danh thiếp' : 'Gửi hình ảnh'}</span>`,
    `<span>${date(item.created_at || item.createdAt)}</span>`,
    /success|thành công/i.test(item.sendResult) ? badge('Hoàn tất','green') : /pending|chờ/i.test(item.sendResult) ? badge('Đang chờ','amber') : badge('Chưa hoàn tất','red'),
    `<strong>${money(item.fee_charged)}</strong>`,
  ]), 'Chưa có yêu cầu. Bắt đầu bằng cách kết nối tài khoản Zalo.');
  const tools = [ ['send-phone','send','Gửi hình ảnh','Tiếp cận qua số điện thoại'], ['send-card','card','Qua danh thiếp','Kết nối từ thông tin liên hệ'], ['oa-send','message','Tin nhắn OA','Nội dung theo mẫu của bạn'], ['links','link','Liên kết','Quản lý trong một nơi'] ].filter(item => !allRoutes.find(r => r.id === item[0]).admin || isAdmin());
  const quick = `<div class="quick-grid">${tools.map(([id,glyph,title,subtitle]) => `<button type="button" class="quick-tile" data-nav="${id}">${icon(glyph)}<strong>${h(title)}</strong><small>${h(subtitle)}</small><span class="tile-arrow">Mở công cụ ${icon('arrow',12)}</span></button>`).join('')}</div>`;
  const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d;});
  const counts = client.mode === 'demo' ? [4,8,6,11,7,15,10] : days.map(day => requests.filter(r => new Date(r.created_at || r.createdAt).toDateString() === day.toDateString()).length);
  const max = Math.max(...counts,1);
  const usage = `<div class="usage-section"><div class="inline"><strong class="usage-total">${number(client.mode === 'demo' ? counts.reduce((a,b)=>a+b,0) : requests.length)}</strong><span class="muted usage-description">${client.mode === 'demo' ? 'lượt minh họa trong 7 ngày' : 'yêu cầu trong danh sách gần đây'}</span></div><div class="usage-chart" aria-label="Biểu đồ yêu cầu 7 ngày">${counts.map((n,i) => `<div class="bar-group" title="${h(days[i].toLocaleDateString('vi-VN'))}: ${n}"><div class="chart-bar alt" style="height:${Math.max(8,n/max*83)}%"></div><div class="chart-bar" style="height:${Math.max(5,n/max*100)}%"></div></div>`).join('')}</div><div class="chart-labels">${days.map(day => `<span>${day.getDate()}/${day.getMonth()+1}</span>`).join('')}</div><div class="chart-legend"><span><i></i>Yêu cầu${client.mode === 'demo' ? ' mẫu' : ''}</span><span><i class="alt"></i>Phân bố hoạt động</span></div></div>`;
  const activity = `<div class="activity-feed"><div class="activity-item"><span class="activity-dot">${icon('users')}</span><div><strong>${activeCount} tài khoản sẵn sàng</strong><br>Kiểm tra kết nối trước khi bắt đầu.<small>Trong không gian của bạn</small></div></div><div class="activity-item"><span class="activity-dot">${icon('key')}</span><div><strong>${licenses.length} license đã lưu</strong><br>Theo dõi các gói sử dụng tại thư viện.<small>Quản lý tập trung</small></div></div><div class="activity-item"><span class="activity-dot">${icon('shield')}</span><div><strong>${client.mode === 'demo' ? 'Chế độ xem mẫu' : 'Kết nối backend'}</strong><br>${client.mode === 'demo' ? 'Mọi thay đổi chỉ lưu trong trình duyệt.' : 'Bạn đang sử dụng dữ liệu cục bộ.'}<small>Phiên làm việc hiện tại</small></div></div></div>`;
  return { html:pageHead('Một ngày làm việc hiệu quả.', 'Mọi công cụ, kết nối và hoạt động của bạn — trong một không gian.', `<button class="btn secondary" type="button" data-global="refresh">${icon('refresh',14)}Làm mới</button><button class="btn primary" type="button" data-nav="send-phone">${icon('plus',15)}Tạo yêu cầu</button>`, 'Tổng quan không gian') + sampleBanner() + `<div class="stats-grid">${stats.map(item => `<section class="stat-card${item.wallet?' wallet-card':''}"><div class="stat-top"><span>${h(item.label)}</span><span class="stat-icon">${icon(item.glyph,15)}</span></div><div class="stat-value">${item.value}</div><div class="stat-foot">${icon('trend',11)}<strong>${h(item.foot)}</strong><span>· ${h(item.sub)}</span></div></section>`).join('')}</div><div class="dashboard-grid"><div class="dashboard-main">${card('Yêu cầu gần đây', `<div>${latestTable}</div><div class="table-footer"><span>Hiển thị ${Math.min(5,requests.length)} / ${requests.length} yêu cầu gần nhất</span><a href="#history" data-nav="history">Xem tất cả ${icon('arrow',12)}</a></div>`, 'Theo dõi kết quả và chi phí của các thao tác.', `<button class="btn ghost small" type="button" data-nav="history">${icon('filter',14)}Bộ lọc</button>`)}${card('Bắt đầu một công việc', quick, 'Chọn công cụ phù hợp với tác vụ hôm nay.')}${card('Hoạt động trong 7 ngày', usage, client.mode==='demo'?'Số liệu minh họa để xem cách hiển thị báo cáo.':'Phân bố từ các yêu cầu tải gần đây.', `<span class="badge neutral">7 ngày gần nhất ${icon('down',10)}</span>`)}</div><aside class="dashboard-aside"><section class="card aside-card"><div class="card-head"><h2>Trạng thái kết nối</h2><span class="status-dot"></span></div><div class="card-body" data-services>${serviceHTML()}</div></section><section class="card aside-card"><div class="card-head"><h2>Trong không gian của bạn</h2>${icon('activity',15)}</div><div class="card-body">${activity}</div></section><section class="help-card">${icon('sparkles',24)}<h3>Khám phá không gian PA03</h3><p>Các công cụ đã được sắp xếp theo công việc. Thử một quy trình từ đầu đến cuối ở chế độ xem mẫu.</p><button class="btn small" type="button" data-global="help">Xem hướng dẫn ${icon('arrow',12)}</button></section></aside></div>`, bind(){} };
}
function serviceHTML() {
  const services = state.health?.services || [{name:'MAIN_SERVER',state:'checking'},{name:'ZL_SERVER',state:'checking'},{name:'FILES_SERVER',state:'checking'}];
  const labels = {MAIN_SERVER:'Xác thực & điều phối', ZL_SERVER:'Công cụ Zalo', FILES_SERVER:'Tệp & hình ảnh'};
  return services.map(service => `<div class="system-row"><span class="system-name">${icon('server',13)}${h(labels[service.name] || service.name)}</span>${badge(service.state==='online'?'Đã kết nối':service.state==='checking'?'Đang kiểm tra':'Chưa kết nối',service.state==='online'?'green':'neutral')}</div>`).join('') + `<div class="system-row"><span class="system-name">${icon('layers',13)}Dịch vụ mở rộng</span>${badge('Chưa bổ sung','amber')}</div><div class="system-note">${client.mode==='demo'?'Dữ liệu mẫu hoạt động độc lập với các kết nối trên.':'Một số công cụ cần dịch vụ mở rộng để hoạt động.'}</div>`;
}
async function refreshHealth() { try { state.health = await client.health(); document.querySelectorAll('[data-services]').forEach(el => el.innerHTML = serviceHTML()); } catch { /* Page remains useful without local services. */ } }
function loginGate() { return { html:pageHead('Kết nối không gian của bạn', 'Đăng nhập để xem dữ liệu backend, hoặc tiếp tục khám phá bằng dữ liệu mẫu.') + ui.empty('Đăng nhập để tiếp tục', 'Dùng tài khoản đã tạo trên hệ thống. Chế độ xem mẫu luôn sẵn sàng để thử giao diện.', `<button type="button" class="btn primary" data-global="connect">${icon('lock',15)}Đăng nhập backend</button><button type="button" class="btn secondary" data-global="demo">${icon('eye',15)}Xem dữ liệu mẫu</button>`), bind(){} }; }
async function render() {
  const sequence = ++rendering;
  const requested = location.hash.replace(/^#\/?/, '') || 'overview';
  const route = allRoutes.find(item => item.id === requested) || allRoutes[0]; state.route = route.id;
  updateShell(); document.title = `${route.title} · PA03 Workspace`; document.querySelector('#breadcrumb-title').textContent = route.title;
  const content = document.querySelector('#content');
  content.innerHTML = '<div class="loading-block"><span class="spinner"></span>Đang mở không gian…</div>';
  try {
    let view;
    if (client.mode==='live' && !client.user) view = loginGate();
    else if (route.admin && !isAdmin()) view = {html:ui.empty('Không có quyền truy cập','Tính năng này dành cho tài khoản quản trị.', '<button type="button" class="btn primary" data-nav="overview">Về tổng quan</button>')};
    else view = route.id === 'overview' ? await overview() : (await renderPhoneShare(route.id,app) || await renderZalo(route.id,app) || await renderWorkspace(route.id,app));
    if (sequence !== rendering) return;
    content.innerHTML = (route.id!=='overview' ? sampleBanner() : '') + (view?.html || ui.empty('Không tìm thấy công cụ','Chọn một công cụ trong menu bên trái.'));
    view?.bind?.(content);
  } catch (error) {
    if (sequence !== rendering) return;
    content.innerHTML = pageHead(route.title,route.description) + `<div class="page-error">${icon('server',30)}<h2>Dữ liệu chưa sẵn sàng</h2><p>${h(error.message)}</p><button type="button" class="btn secondary" data-global="refresh">${icon('refresh',14)}Thử lại</button><button type="button" class="btn primary" data-global="demo">Xem dữ liệu mẫu</button></div>`;
  }
  updateShell();
}
function openHelp() {
  const dialog = app.modal({title:'Làm quen với PA03',description:'Một không gian cho kết nối, công cụ và vận hành.',wide:true,submitLabel:'Bắt đầu khám phá',body:`<div class="help-list"><div><h3>01 · Thử mọi luồng bằng dữ liệu mẫu</h3><p>Tạo yêu cầu gửi ảnh, mua license, quản lý tài khoản hoặc tạo liên kết. Các thay đổi mẫu được lưu riêng trong trình duyệt; không gửi tin, thu tiền hay tra cứu bên ngoài.</p></div><div><h3>02 · Kết nối dữ liệu của bạn</h3><p>Chọn “Kết nối backend” rồi đăng nhập. Các danh sách và thao tác dùng API cục bộ. Công cụ có dịch vụ chưa bổ sung sẽ hiển thị thông báo, không dùng kết quả mẫu thay thế.</p></div><div><h3>03 · Tìm đúng công cụ</h3><p>Menu được chia thành Zalo, Official Account, tiện ích và quản trị. Nhấn Ctrl/⌘ K để tìm nhanh. Các mục quản trị chỉ hiển thị cho người có quyền.</p></div></div><div class="form-actions"><button type="button" class="btn secondary" data-reset-demo>${icon('refresh',14)}Khôi phục dữ liệu mẫu</button></div>`});
  dialog.querySelector('[data-reset-demo]').addEventListener('click', () => { dialog.close(); app.confirm({title:'Khôi phục dữ liệu mẫu?',description:'Các thay đổi bạn đã thử trong chế độ xem mẫu sẽ được đặt lại. Dữ liệu backend không bị ảnh hưởng.',confirmLabel:'Khôi phục dữ liệu mẫu',onConfirm:async()=>{client.resetDemo();app.toast('Đã khôi phục dữ liệu mẫu.');await render();}}); });
}
function openSearch() {
  const dialog = app.modal({title:'Tìm công cụ',body:'<input type="search" name="tool-search" placeholder="Gõ tên công cụ, ví dụ: gửi ảnh, license…" aria-label="Tìm công cụ"><div class="search-results"></div>',submitLabel:'Đóng'});
  const search = dialog.querySelector('input'), normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const filter = () => { const q=normalize(search.value); dialog.querySelector('.search-results').innerHTML=availableRoutes().filter(r=>normalize(`${r.title} ${r.description}`).includes(q)).slice(0,8).map(r=>`<button type="button" class="search-result" data-search-nav="${r.id}">${icon(r.icon,17)}${h(r.title)}<small>${h(r.group)}</small></button>`).join('') || '<p class="muted">Chưa có công cụ phù hợp.</p>'; };
  filter(); search.addEventListener('input',filter); dialog.querySelector('.search-results').addEventListener('click',event=>{const button=event.target.closest('[data-search-nav]');if(button){dialog.close();app.navigate(button.dataset.searchNav);}}); search.focus();
}
function openMode() {
  const dialog=app.modal({title:'Chọn cách trải nghiệm',description:'Hai chế độ sử dụng dữ liệu riêng biệt.',body:`<div class="stack"><div class="mode-description"><strong>${icon('eye',17)} Xem dữ liệu mẫu</strong><p>Đầy đủ màn hình và luồng thao tác. Không cần tài khoản, không gửi tác vụ tới nhà cung cấp.</p><button class="btn secondary full" type="button" data-select-demo>${client.mode==='demo'?'Đang sử dụng chế độ mẫu':'Chuyển sang dữ liệu mẫu'}</button></div><div class="mode-description"><strong>${icon('server',17)} Kết nối backend cục bộ</strong><p>Dùng tài khoản để xem và quản lý dữ liệu trên máy chủ. Một số công cụ cần dịch vụ mở rộng.</p><button class="btn primary full" type="button" data-select-live>${client.mode==='live'&&client.user?'Đã kết nối · Đổi tài khoản':'Đăng nhập backend'}</button>${client.user&&client.mode==='live'?'<button class="btn ghost full" type="button" data-logout>Đăng xuất backend</button>':''}</div></div>`,submitLabel:'Đóng'});
  dialog.querySelector('[data-select-demo]').addEventListener('click',()=>{client.setMode('demo');dialog.close();void render();});
  dialog.querySelector('[data-select-live]').addEventListener('click',()=>openAuth());
  dialog.querySelector('[data-logout]')?.addEventListener('click',()=>{client.logout();client.setMode('demo');dialog.close();app.toast('Đã đăng xuất backend.');void render();});
}
function openAuth(type='login', previousMode=client.mode) {
  client.setMode('live'); let captchaID=null;
  // Keep every visible control aligned with the API mode, including saved sessions.
  void render();
  const registering=type==='register';
  const dialog=app.modal({title:registering?'Tạo tài khoản PA03':'Chào mừng trở lại',description:registering?'Tạo tài khoản trên backend đang kết nối.':'Đăng nhập để sử dụng dữ liệu của bạn.',submitLabel:registering?'Tạo tài khoản':'Đăng nhập',body:`<div class="auth-tabs"><button type="button" class="btn ${registering?'secondary':'primary'}" data-auth-tab="login">Đăng nhập</button><button type="button" class="btn ${registering?'primary':'secondary'}" data-auth-tab="register">Đăng ký</button></div><div class="stack">${ui.field('Tên đăng nhập','userName',{required:true,autocomplete:'username',placeholder:'Nhập tên đăng nhập'})}${registering?ui.field('Email','email',{type:'email',required:true,placeholder:'ban@example.com'}):''}${ui.field('Mật khẩu','password',{type:'password',required:true,autocomplete:registering?'new-password':'current-password',placeholder:'Nhập mật khẩu'})}<div data-auth-captcha></div></div>`,onCancel:()=>{client.setMode(previousMode);void render();},onSubmit:async(values,form)=>{
      try {
        if(registering&&values.password.length<8)throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
        const body={...values,...(captchaID?{captchaID}:{} )};
        await (registering?client.register(body):client.login(body));
        await client.api('/auth/profile');
        app.toast(registering?'Đã tạo tài khoản và kết nối backend.':'Đã kết nối backend.');
        await render();
      } catch(error) { if(error.response?.captchaRequired||error.response?.captchaInvalid) await loadCaptcha(); throw error; }
  }});
  const loadCaptcha=async()=>{
    try { const result=await client.api(`/captcha/generate?purpose=${registering?'register':'login'}`); captchaID=result.data?.captchaID;const image=result.data?.captchaImage;
      dialog.querySelector('[data-auth-captcha]').innerHTML=`${typeof image==='string'&&image.startsWith('data:image/')?`<img class="captcha-image" src="${h(image)}" alt="Mã xác minh">`:''}${ui.field('Mã xác minh','captchaValue',{required:true,placeholder:'Phân biệt chữ hoa và chữ thường'})}<button class="btn ghost small" type="button" data-captcha-refresh>${icon('refresh',12)}Đổi mã</button>`;
      dialog.querySelector('[data-captcha-refresh]').addEventListener('click',()=>void loadCaptcha());
    } catch(error){app.toast(error.message,'error');}
  };
  dialog.querySelectorAll('[data-auth-tab]').forEach(button=>button.addEventListener('click',()=>openAuth(button.dataset.authTab,previousMode)));
  if(registering)void loadCaptcha();
}
function openNotifications() { app.modal({title:'Thông báo trong không gian',description:'Thông tin cho phiên làm việc hiện tại.',body:`<div class="help-list"><div><h3>${client.mode==='demo'?'Bạn đang xem dữ liệu mẫu':'Đã chọn backend cục bộ'}</h3><p>${client.mode==='demo'?'Bạn có thể thử tạo, sửa và xóa dữ liệu mẫu. Không có tác vụ bên ngoài được thực hiện.':'Các yêu cầu được chuyển đến backend đã kết nối.'}</p></div><div><h3>Khám phá đầy đủ công cụ</h3><p>Zalo, OA, license, liên kết và quản trị đã có màn hình riêng trong menu.</p></div><div><h3>Dịch vụ mở rộng</h3><p>Hẹn giờ, PayOS, Link và các tra cứu bên ngoài cần thành phần backend bổ sung để vận hành thực tế.</p></div></div>`,submitLabel:'Đã hiểu'}); }

document.addEventListener('click',event=>{
  const nav=event.target.closest('[data-nav]'); if(nav){event.preventDefault();app.navigate(nav.dataset.nav);return;}
  const tab=event.target.closest('[data-tab-key]'); if(tab){event.preventDefault();app.setTab(tab.dataset.tabKey,tab.dataset.tabValue);void render();return;}
  const target=event.target.closest('[data-global]'); if(!target)return;event.preventDefault();
  switch(target.dataset.global){
    case 'menu':document.querySelector('.sidebar').classList.toggle('open');break;
    case 'close-nav':closeSidebar();break;
    case 'help':openHelp();break;
    case 'mode':openMode();break;
    case 'search':openSearch();break;
    case 'notifications':openNotifications();break;
    case 'profile':app.navigate('profile');break;
    case 'refresh':void render();void refreshHealth();break;
    case 'connect':openAuth();break;
    case 'demo':client.setMode('demo');void render();break;
    case 'logout':client.logout();client.setMode('demo');app.toast('Đã đăng xuất backend.');void render();break;
  }
});
document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}
  if(event.key==='Escape')closeSidebar();
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('.nav-user')){event.preventDefault();app.navigate('profile');}
});
window.addEventListener('hashchange',()=>{void render();window.scrollTo({top:0,behavior:'instant'});});
renderShell();void render();void refreshHealth();
setInterval(()=>void refreshHealth(),30000);
