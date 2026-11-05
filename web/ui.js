export const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const glyphs = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4L22 2ZM22 2 11 13"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  card: '<rect x="2" y="4" width="20" height="16" rx="3"/><circle cx="8" cy="10" r="2"/><path d="M5 16a3 3 0 0 1 6 0m4-7h4m-4 4h4"/>',
  activity: '<path d="M2 12h4l3-8 6 16 3-8h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h1m6 0h1"/>',
  message: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l2.2-5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 10h8m-8 4h5"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8l10-5Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8m-8 4h6"/>',
  key: '<circle cx="8" cy="15" r="5"/><path d="m11.5 11.5 9-9m-3 3 3 3m-6 0 3 3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  shopping: '<path d="M3 3h2l2.4 12a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6"/><circle cx="10" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>',
  wallet: '<path d="M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v11H5a3 3 0 0 1-3-3V6m19 7h-5v4h5"/>',
  box: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 10v10M3 7l9 5 9-5M7.5 4.5l9 5"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/>',
  settings: '<path d="m9 3-1 3-3 1v4l-2 2 2 3 3 1 1 4h5l1-3 3-1 2-3-2-3V7l-4-1-1-3H9Z"/><circle cx="11.5" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  external: '<path d="M14 3h7v7M21 3 10 14m0-11H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3"/>',
  filter: '<path d="M3 5h18M6 12h12M9 19h6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  edit: '<path d="m16 3 5 5-12 12H4v-5L16 3ZM14 5l5 5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3m-10 0 1 15h12l1-15M10 10v7m4-7v7"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-12 9h12m-8 4h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  logout: '<path d="M9 3H3v18h6m6-14 5 5-5 5M9 12h12"/>',
  trend: '<path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  warning: '<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2"/>',
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6m-6 11h6"/>',
};
const aliases = { dashboard:'grid', home:'grid', history:'clock', list:'file', creditcard:'wallet', payment:'wallet', receipt:'file', database:'server', package:'box', zap:'sparkles', phone:'send', mail:'message', code:'key', arrowRight:'arrow', 'arrow-right':'arrow', 'chevron-right':'chevron', 'chevron-down':'down', 'check-circle':'check', 'alert-circle':'warning', 'x':'close', 'more-horizontal':'filter' };
export function icon(name, size = 20) { return `<svg class="icon" width="${Number(size) || 20}" height="${Number(size) || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[aliases[name] || name] || '<circle cx="12" cy="12" r="7"/>'}</svg>`; }
export const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value) || 0);
export const number = value => new Intl.NumberFormat('vi-VN').format(Number(value) || 0);
export const date = value => { if (!value) return '—'; const d = new Date(value); return Number.isNaN(d.getTime()) ? h(value) : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(d); };
export function badge(label, type = 'neutral') { const aliases = {success:'green', active:'green', pending:'amber', warning:'amber', error:'red', danger:'red', info:'blue', inactive:'neutral'}; return `<span class="badge ${h(aliases[type] || type)}"><i></i>${h(label)}</span>`; }
export function pageHead(title, description, actions = '', eyebrow = 'Không gian làm việc') { return `<div class="page-head"><div><div class="eyebrow">${h(eyebrow)}</div><h1>${h(title)}</h1><p>${h(description)}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</div>`; }
export function card(title, body, subtitle = '', actions = '') { return `<section class="card"><div class="card-head"><div><h2>${h(title)}</h2>${subtitle ? `<p>${h(subtitle)}</p>` : ''}</div>${actions}</div><div class="card-body">${body}</div></section>`; }
export function table(headers, data, emptyText = 'Chưa có dữ liệu') { return `<div class="table-wrap"><table><thead><tr>${headers.map(v => `<th>${h(typeof v === 'object' ? v.label : v)}</th>`).join('')}</tr></thead><tbody>${data.length ? data.map(row => `<tr>${row.map(cell => `<td>${cell ?? '—'}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="table-empty">${icon('file',28)}<span>${h(emptyText)}</span></td></tr>`}</tbody></table></div>`; }
export function field(label, name, options = {}) {
  const o = options || {}, value = o.value ?? '', type = o.type || 'text';
  const attrs = `${o.required ? ' required' : ''}${o.disabled ? ' disabled' : ''}${o.readonly ? ' readonly' : ''}${o.min !== undefined ? ` min="${h(o.min)}"` : ''}${o.max !== undefined ? ` max="${h(o.max)}"` : ''}${o.step !== undefined ? ` step="${h(o.step)}"` : ''}${o.accept ? ` accept="${h(o.accept)}"` : ''}${o.autocomplete ? ` autocomplete="${h(o.autocomplete)}"` : ''}${o.id ? ` id="${h(o.id)}"` : ''}`;
  let control;
  if (type === 'select' || o.options) control = `<select name="${h(name)}"${attrs}>${(o.options || []).map(item => { const v = typeof item === 'object' ? item.value : item, text = typeof item === 'object' ? item.label : item; return `<option value="${h(v)}"${String(v) === String(value) ? ' selected' : ''}>${h(text)}</option>`; }).join('')}</select>`;
  else if (type === 'textarea') control = `<textarea name="${h(name)}" rows="${Number(o.rows) || 4}" placeholder="${h(o.placeholder || '')}"${attrs}>${h(value)}</textarea>`;
  else if (type === 'checkbox') control = `<input type="checkbox" name="${h(name)}" value="${h(value || '1')}"${o.checked || value === true ? ' checked' : ''}${attrs}>`;
  else control = `<input type="${h(type)}" name="${h(name)}" value="${type === 'file' ? '' : h(value)}" placeholder="${h(o.placeholder || '')}"${attrs}>`;
  return `<label class="field${o.full ? ' full' : ''}${type === 'checkbox' ? ' checkbox-field' : ''}"><span>${h(label)}${o.required ? ' <em>*</em>' : ''}</span>${control}${o.help ? `<small>${h(o.help)}</small>` : ''}</label>`;
}
export function tabs(key, items, active) { return `<div class="tabs" role="tablist">${items.map(item => { const id = typeof item === 'string' ? item : item.id ?? item.value, label = typeof item === 'string' ? item : item.label; return `<button type="button" role="tab" aria-selected="${String(id) === String(active)}" class="tab${String(id) === String(active) ? ' active' : ''}" data-tab-key="${h(key)}" data-tab-value="${h(id)}">${h(label)}</button>`; }).join('')}</div>`; }
export function empty(title, description, action = '') { return `<div class="empty-state"><div class="empty-icon">${icon('layers',28)}</div><h3>${h(title)}</h3><p>${h(description)}</p>${action}</div>`; }
export function notice(text, type = 'info') { return `<div class="notice ${h(type)}">${icon(type === 'warning' || type === 'error' ? 'warning' : 'info',18)}<span>${h(text)}</span></div>`; }
export function rows(response) { const d = response?.data ?? response; if (Array.isArray(d)) return d; for (const key of ['data','items','results','logs','requests','accounts','products','licenses','users','history','templates','links','domains']) if (Array.isArray(d?.[key])) return d[key]; return []; }
