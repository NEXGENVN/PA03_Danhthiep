// ════════════════════════════════════════════════════════════════
// BỘ CÔNG CỤ LINK (ADMIN ONLY - ROLE === 1)
// ════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Check role to display the hub card
    const checkRoleInterval = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkRoleInterval);
            if (currentUser.userRole === 1) {
                const linkCard = document.getElementById('hub-link-card');
                if (linkCard) linkCard.style.display = 'block';
            }
        }
    }, 100);
});

let windowLinkTemplates = [];
let windowLinkDomains = [];

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Chuyển Tab trong Hub LINK
 */
function showLinkTab(tabId, buttonElement) {
    // Hide all tabs
    const tabs = document.querySelectorAll('#hub-link .link-tab');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Remove active class from buttons
    const buttons = document.querySelectorAll('#hub-link .sub-menu-item');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show target tab
    const targetTab = document.getElementById(`link-tab-${tabId}`);
    if (targetTab) targetTab.style.display = 'block';
    
    if (buttonElement) buttonElement.classList.add('active');

    // Load data based on tab
    if (tabId === 'templates') loadLinkTemplates();
    if (tabId === 'links') loadLinkList();
    if (tabId === 'domains') loadLinkDomains();
    if (tabId === 'results') loadLinkResults();
    if (tabId === 'results_thumbnail') loadLinkResultsThumbnail();
}

// ════════════════════════════════════════════════════════════════
// TAB 1: QUẢN LÝ TRANG MẪU (link_template)
// ════════════════════════════════════════════════════════════════

async function loadLinkTemplates() {
    const tbody = document.getElementById('link-templates-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Đang tải danh sách trang mẫu...</td></tr>';

    try {
        const data = await apiCall('/link/templates');
        if (data.success) {
            windowLinkTemplates = data.data || [];
            if (windowLinkTemplates.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Chưa có trang mẫu nào. Vui lòng nhấn "Thêm trang mẫu mới".</td></tr>';
                return;
            }

            tbody.innerHTML = windowLinkTemplates.map(item => {
                const thumbHtml = item.thumbnail 
                    ? `<img src="${item.thumbnail}" style="max-height: 45px; max-width: 80px; border-radius: 4px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/80x45?text=No+Img'">`
                    : '<span style="color:#999; font-style:italic">Không có</span>';
                
                const createdDate = item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'N/A';

                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 12px; font-weight: bold; color: #00d2ff;">${item.id}</td>
                        <td style="padding: 12px; font-weight: bold; color: #fff;">${item.name}</td>
                        <td style="padding: 12px; max-width: 250px; word-break: break-all;">
                            <a href="${item.link}" target="_blank" style="color: #64748b; text-decoration: none;" onmouseover="this.style.color='#00d2ff'" onmouseout="this.style.color='#64748b'">${item.link}</a>
                        </td>
                        <td style="padding: 12px;">${thumbHtml}</td>
                        <td style="padding: 12px; max-width: 200px; font-size: 13px;">${item.title || 'N/A'}</td>
                        <td style="padding: 12px; font-size: 12px; color: #aaa;">${createdDate}</td>
                        <td style="padding: 12px; text-align: center;">
                            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;" onclick="editLinkTemplate(${item.id})">✏️ Sửa</button>
                            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="deleteLinkTemplate(${item.id})">🗑️ Xóa</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi: ${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Lỗi load link templates:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi kết nối máy chủ</td></tr>';
    }
}

function openLinkTemplateModal() {
    document.getElementById('link-template-modal-title').innerText = 'Thêm Trang Mẫu Mới';
    document.getElementById('link-template-id').value = '';
    document.getElementById('link-template-name').value = '';
    document.getElementById('link-template-url').value = '';
    document.getElementById('link-template-title').value = '';
    document.getElementById('link-template-thumbnail').value = '';
    document.getElementById('link-template-thumb-preview').style.display = 'none';
    document.getElementById('linkTemplateModal').style.display = 'flex';
}

function closeLinkTemplateModal() {
    document.getElementById('linkTemplateModal').style.display = 'none';
}

async function fetchWebMetaForModal() {
    const url = document.getElementById('link-template-url').value.trim();
    if (!url) {
        return alert('Vui lòng nhập Link trang web để lấy dữ liệu');
    }

    const btn = event.target;
    const ogText = btn.innerHTML;
    btn.innerHTML = '⏳ Đang quét...';
    btn.disabled = true;

    try {
        const templateId = document.getElementById('link-template-id').value;
        const data = await apiCall('/link/fetch-meta', {
            method: 'POST',
            body: JSON.stringify({ 
                link: url, 
                template_id: templateId ? parseInt(templateId, 10) : null 
            })
        });

        if (data.success) {
            if (data.title) document.getElementById('link-template-title').value = data.title;
            if (data.thumbnail) {
                document.getElementById('link-template-thumbnail').value = data.thumbnail;
                document.getElementById('link-template-thumb-img').src = data.thumbnail;
                document.getElementById('link-template-thumb-preview').style.display = 'block';
            }
        } else {
            alert('Không thể tự động lấy tiêu đề/thumbnail: ' + (data.message || 'Lỗi kết nối'));
        }
    } catch (e) {
        console.error('Lỗi fetch web meta:', e);
        alert('Lỗi khi lấy thông tin trang web');
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
    }
}

async function saveLinkTemplate() {
    const id = document.getElementById('link-template-id').value;
    const name = document.getElementById('link-template-name').value.trim();
    const link = document.getElementById('link-template-url').value.trim();
    const title = document.getElementById('link-template-title').value.trim();
    const thumbnail = document.getElementById('link-template-thumbnail').value.trim();

    if (!name || !link) {
        return alert('Vui lòng điền đầy đủ Tên Mẫu và Link trang web');
    }

    const payload = { name, link, title, thumbnail };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/link/templates/${id}` : '/link/templates';

    try {
        const data = await apiCall(endpoint, {
            method,
            body: JSON.stringify(payload)
        });

        if (data.success) {
            alert(id ? '✅ Cập nhật trang mẫu thành công' : '✅ Tạo trang mẫu thành công');
            closeLinkTemplateModal();
            loadLinkTemplates();
        } else {
            alert('❌ Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi save link template:', error);
        alert('❌ Có lỗi xảy ra khi lưu trang mẫu');
    }
}

function editLinkTemplate(id) {
    const item = windowLinkTemplates.find(t => t.id === id);
    if (!item) return alert('Không tìm thấy dữ liệu trang mẫu');

    document.getElementById('link-template-modal-title').innerText = 'Sửa Trang Mẫu #' + id;
    document.getElementById('link-template-id').value = item.id;
    document.getElementById('link-template-name').value = item.name;
    document.getElementById('link-template-url').value = item.link;
    document.getElementById('link-template-title').value = item.title || '';
    document.getElementById('link-template-thumbnail').value = item.thumbnail || '';
    
    if (item.thumbnail) {
        document.getElementById('link-template-thumb-img').src = item.thumbnail;
        document.getElementById('link-template-thumb-preview').style.display = 'block';
    } else {
        document.getElementById('link-template-thumb-preview').style.display = 'none';
    }

    document.getElementById('linkTemplateModal').style.display = 'flex';
}

async function deleteLinkTemplate(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa trang mẫu #${id}?`)) return;

    try {
        const data = await apiCall(`/link/templates/${id}`, {
            method: 'DELETE'
        });

        if (data.success) {
            alert('✅ Đã xóa trang mẫu và các link liên quan');
            loadLinkTemplates();
            loadLinkList();
        } else {
            alert('❌ Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi xóa trang mẫu:', error);
        alert('❌ Có lỗi xảy ra khi xóa trang mẫu');
    }
}

// ════════════════════════════════════════════════════════════════
// TAB 2: QUẢN LÝ LINK (link_list) - Không cho sửa, xóa
// ════════════════════════════════════════════════════════════════

window._linkItemsMap = {};

function getLocationTypeBadge(locType) {
    const t = Number(locType);
    if (t === 0) return '<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; padding: 4px 10px; border-radius: 12px; border: 1px solid #64748b; font-size: 11px;">🚫 Không lấy vị trí</span>';
    if (t === 2) return '<span class="badge" style="background: rgba(234, 179, 8, 0.15); color: #facc15; padding: 4px 10px; border-radius: 12px; border: 1px solid #eab308; font-size: 11px;">💬 Kèm giải thích</span>';
    if (t === 3) return '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; padding: 4px 10px; border-radius: 12px; border: 1px solid #ef4444; font-size: 11px;">🔒 Cấp quyền mới tải nội dung</span>';
    return '<span class="badge" style="background: rgba(34, 197, 94, 0.15); color: #4ade80; padding: 4px 10px; border-radius: 12px; border: 1px solid #22c55e; font-size: 11px;">📍 Chỉ lấy vị trí</span>';
}

async function loadLinkList() {
    const tbody = document.getElementById('link-list-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Đang tải danh sách link...</td></tr>';

    try {
        const data = await apiCall('/link/links');
        if (data.success) {
            const list = data.data || [];
            if (list.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">Chưa có link nào được tạo. Vui lòng nhấn "Tạo Link mới".</td></tr>';
                return;
            }

            window._linkItemsMap = {};
            tbody.innerHTML = list.map(item => {
                window._linkItemsMap[item.id] = item;
                const createdDate = item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'N/A';
                const shortLink = item.short_link || item.link;

                return `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 12px; font-weight: bold; color: #00d2ff; vertical-align: middle;">${item.id}</td>
                        <td style="padding: 12px; font-weight: bold; color: #fff; vertical-align: middle;">${item.name}</td>
                        <td style="padding: 12px; vertical-align: middle;"><span class="badge badge-info" style="background: rgba(0, 210, 255, 0.1); color: #00d2ff; padding: 4px 10px; border-radius: 12px; border: 1px solid #00d2ff;">${item.template_name || ('Template #' + item.template_id)}</span></td>
                        <td style="padding: 12px; vertical-align: middle;">${getLocationTypeBadge(item.location_type)}</td>
                        <td style="padding: 12px; min-width: 320px; max-width: 450px;">
                            <div style="margin-bottom: 6px;">
                                <span style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 2px;">🔗 Dạng 1 (Đầy đủ):</span>
                                <input type="text" value="${item.link}" readonly style="width: 100%; background: #0f172a; color: #00d2ff; border: 1px solid #334155; border-radius: 4px; padding: 6px 10px; font-family: monospace; font-size: 12px; cursor: pointer;" onclick="this.select(); copyLinkToClipboard(this.value);" title="Nhấp để copy Link dạng 1">
                            </div>
                            <div>
                                <span style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 2px;">⚡ Dạng 2 (Rút gọn):</span>
                                <input type="text" value="${shortLink}" readonly style="width: 100%; background: #0f172a; color: #38bdf8; border: 1px solid #334155; border-radius: 4px; padding: 6px 10px; font-family: monospace; font-size: 12px; cursor: pointer;" onclick="this.select(); copyLinkToClipboard(this.value);" title="Nhấp để copy Link dạng 2">
                            </div>
                        </td>
                        <td style="padding: 12px; font-size: 12px; color: #aaa; vertical-align: middle;">${createdDate}</td>
                        <td style="padding: 12px; text-align: center; vertical-align: middle;">
                            <button class="btn btn-sm" style="padding: 6px 12px; font-size: 12px; background: #3b82f6; color: #fff; border: none; border-radius: 6px; cursor: pointer;" onclick="openEditLinkModal(${item.id})">✏️ Sửa</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi: ${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Lỗi load link list:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi kết nối máy chủ</td></tr>';
    }
}

function openEditLinkModal(id) {
    const item = window._linkItemsMap ? window._linkItemsMap[id] : null;
    if (!item) return;
    document.getElementById('edit-link-id').value = item.id;
    document.getElementById('edit-link-name').value = item.name || '';
    document.getElementById('edit-link-location-type').value = String(item.location_type !== undefined && item.location_type !== null ? item.location_type : 1);
    document.getElementById('editLinkModal').style.display = 'flex';
}

function closeEditLinkModal() {
    document.getElementById('editLinkModal').style.display = 'none';
}

async function saveEditLink() {
    const id = document.getElementById('edit-link-id').value;
    const name = document.getElementById('edit-link-name').value.trim();
    const location_type = document.getElementById('edit-link-location-type').value;

    if (!name) {
        return alert('Vui lòng nhập Tên Link');
    }

    const btn = event.target;
    const ogText = btn.innerHTML;
    btn.innerHTML = '⏳ Đang lưu...';
    btn.disabled = true;

    try {
        const data = await apiCall(`/link/links/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name,
                location_type: parseInt(location_type, 10)
            })
        });

        if (data.success) {
            alert('✅ Cập nhật Link thành công!');
            closeEditLinkModal();
            loadLinkList();
        } else {
            alert('❌ Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi save edit link:', error);
        alert('❌ Có lỗi xảy ra khi cập nhật Link');
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
    }
}

function copyLinkToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Đã copy link vào bộ nhớ tạm:\n' + text);
    }).catch(err => {
        console.error('Copy error:', err);
        // Fallback
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        alert('✅ Đã copy link:\n' + text);
    });
}

async function openCreateLinkModal() {
    // Load list of templates and domains into select dropdowns
    try {
        const tplSelect = document.getElementById('create-link-template-select');
        const domSelect = document.getElementById('create-link-domain-select');

        if (tplSelect) tplSelect.innerHTML = '<option value="">-- Đang tải trang mẫu... --</option>';
        if (domSelect) domSelect.innerHTML = '<option value="">-- Đang tải domain... --</option>';

        const [tplRes, domRes] = await Promise.all([
            apiCall('/link/templates'),
            apiCall('/link/domains')
        ]);

        if (tplRes.success && tplRes.data.length > 0) {
            windowLinkTemplates = tplRes.data;
            if (tplSelect) {
                tplSelect.innerHTML = '<option value="">-- Chọn trang mẫu --</option>' + 
                    tplRes.data.map(t => `<option value="${t.id}">${t.name} (ID: ${t.id})</option>`).join('');
            }
        } else {
            windowLinkTemplates = [];
            if (tplSelect) tplSelect.innerHTML = '<option value="">-- Chưa có trang mẫu nào (Vui lòng tạo trước) --</option>';
        }

        if (domRes.success && domRes.data.length > 0) {
            windowLinkDomains = domRes.data;
            if (domSelect) {
                domSelect.innerHTML = '<option value="">-- Chọn domain --</option>' + 
                    domRes.data.map(d => `<option value="${d.id}">${d.domain} (${d.detail || 'ID: ' + d.id})</option>`).join('');
            }
        } else {
            windowLinkDomains = [];
            if (domSelect) domSelect.innerHTML = '<option value="">-- Chưa có domain nào --</option>';
        }

        // Attach template change listener for smart domain suggestion
        if (tplSelect) {
            tplSelect.onchange = autoSuggestDomainForTemplate;
        }

    } catch (e) {
        console.error('Lỗi load template/domain dropdown:', e);
    }

    document.getElementById('create-link-name').value = '';
    const locTypeSelect = document.getElementById('create-link-location-type');
    if (locTypeSelect) locTypeSelect.value = '0';
    document.getElementById('createLinkModal').style.display = 'flex';
}

function autoSuggestDomainForTemplate() {
    const tplSelect = document.getElementById('create-link-template-select');
    const domSelect = document.getElementById('create-link-domain-select');
    if (!tplSelect || !domSelect || !windowLinkDomains.length) return;

    const tplId = tplSelect.value;
    if (!tplId) return;

    const selectedTpl = windowLinkTemplates.find(t => String(t.id) === String(tplId));
    if (!selectedTpl || !selectedTpl.link) return;

    const tplLinkLower = selectedTpl.link.toLowerCase();

    let targetKeyword = 'baomoi';
    if (tplLinkLower.includes('facebook')) {
        targetKeyword = 'facebook';
    } else if (tplLinkLower.includes('tiktok')) {
        targetKeyword = 'tiktok';
    }

    // Search for domain matching target keyword
    const matchedDomain = windowLinkDomains.find(d => d.domain.toLowerCase().includes(targetKeyword));
    if (matchedDomain) {
        domSelect.value = matchedDomain.id;
    } else {
        // Fallback: search for baomoi if keyword was facebook/tiktok but not found, or pick first available domain
        const fallbackBaomoi = windowLinkDomains.find(d => d.domain.toLowerCase().includes('baomoi'));
        if (fallbackBaomoi) {
            domSelect.value = fallbackBaomoi.id;
        } else if (windowLinkDomains.length > 0) {
            domSelect.value = windowLinkDomains[0].id;
        }
    }
}

function closeCreateLinkModal() {
    document.getElementById('createLinkModal').style.display = 'none';
}

async function submitCreateLink() {
    const name = document.getElementById('create-link-name').value.trim();
    const template_id = document.getElementById('create-link-template-select').value;
    const domain_id = document.getElementById('create-link-domain-select')?.value || null;
    const location_type = document.getElementById('create-link-location-type')?.value || '0';

    if (!name || !template_id) {
        return alert('Vui lòng điền Tên Link và chọn Trang Mẫu');
    }

    const btn = event.target;
    const ogText = btn.innerHTML;
    btn.innerHTML = '⏳ Đang tạo...';
    btn.disabled = true;

    try {
        const data = await apiCall('/link/links', {
            method: 'POST',
            body: JSON.stringify({ 
                name, 
                template_id: parseInt(template_id, 10),
                domain_id: domain_id ? parseInt(domain_id, 10) : null,
                location_type: parseInt(location_type, 10)
            })
        });

        if (data.success) {
            alert('✅ Tạo Link thành công!');
            closeCreateLinkModal();
            loadLinkList();
        } else {
            alert('❌ Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi submit create link:', error);
        alert('❌ Có lỗi xảy ra khi tạo Link');
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
    }
}

// ════════════════════════════════════════════════════════════════
// TAB: QUẢN LÝ DOMAIN (link_domains)
// ════════════════════════════════════════════════════════════════

async function loadLinkDomains() {
    const tbody = document.getElementById('link-domains-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">⏳ Đang tải dữ liệu domain...</td></tr>';

    try {
        const data = await apiCall('/link/domains');
        if (data.success) {
            windowLinkDomains = data.data || [];
            renderLinkDomains(windowLinkDomains);
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red; padding: 20px;">Lỗi: ${data.message}</td></tr>`;
        }
    } catch (e) {
        console.error('Lỗi loadLinkDomains:', e);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red; padding: 20px;">Lỗi kết nối khi tải danh sách domain.</td></tr>';
    }
}

function renderLinkDomains(domains) {
    const tbody = document.getElementById('link-domains-body');
    if (!tbody) return;

    if (!domains || domains.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">Chưa có domain nào. Nhấn "Thêm domain mới" để tạo.</td></tr>';
        return;
    }

    tbody.innerHTML = domains.map(d => {
        const createdDate = d.created_at ? new Date(d.created_at).toLocaleString('vi-VN') : '-';
        const detailText = d.detail ? escapeHtml(d.detail) : '<span style="color:#666;">Không có</span>';
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-weight: bold; color: #00d2ff;">#${d.id}</td>
                <td style="padding: 12px; font-weight: bold; color: #fff;">${escapeHtml(d.domain)}</td>
                <td style="padding: 12px; color: #ccc;">${detailText}</td>
                <td style="padding: 12px; color: #888; font-size: 13px;">${createdDate}</td>
                <td style="padding: 12px; text-align: center;">
                    <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 12px; margin-right: 5px;" onclick="editDomain(${d.id})">✏️ Sửa</button>
                    <button class="btn btn-danger" style="padding: 4px 10px; font-size: 12px; background: #ef4444; border: none; color: #fff;" onclick="deleteDomain(${d.id})">🗑️ Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openDomainModal(domainObj = null) {
    const modal = document.getElementById('linkDomainModal');
    if (!modal) return;

    const titleEl = document.getElementById('link-domain-modal-title');
    const idEl = document.getElementById('link-domain-id');
    const domainEl = document.getElementById('link-domain-name');
    const detailEl = document.getElementById('link-domain-detail');

    if (domainObj) {
        if (titleEl) titleEl.innerText = 'Chỉnh Sửa Domain';
        if (idEl) idEl.value = domainObj.id;
        if (domainEl) domainEl.value = domainObj.domain || '';
        if (detailEl) detailEl.value = domainObj.detail || '';
    } else {
        if (titleEl) titleEl.innerText = 'Thêm Domain Mới';
        if (idEl) idEl.value = '';
        if (domainEl) domainEl.value = '';
        if (detailEl) detailEl.value = '';
    }

    modal.style.display = 'flex';
}

function closeDomainModal() {
    const modal = document.getElementById('linkDomainModal');
    if (modal) modal.style.display = 'none';
}

async function saveDomain() {
    const id = document.getElementById('link-domain-id').value;
    const domain = document.getElementById('link-domain-name').value.trim();
    const detail = document.getElementById('link-domain-detail').value.trim();

    if (!domain) {
        return alert('Vui lòng nhập Tên Domain!');
    }

    const isEdit = !!id;
    const endpoint = isEdit ? `/link/domains/${id}` : '/link/domains';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await apiCall(endpoint, {
            method,
            body: JSON.stringify({ domain, detail })
        });

        if (res.success) {
            alert(res.message || 'Lưu domain thành công!');
            closeDomainModal();
            loadLinkDomains();
        } else {
            alert('❌ Lỗi: ' + res.message);
        }
    } catch (e) {
        console.error('Lỗi saveDomain:', e);
        alert('❌ Có lỗi xảy ra khi lưu domain');
    }
}

function editDomain(id) {
    const domainObj = windowLinkDomains.find(d => d.id === id);
    if (domainObj) {
        openDomainModal(domainObj);
    } else {
        alert('Không tìm thấy dữ liệu domain');
    }
}

async function deleteDomain(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa domain #${id}?`)) return;

    try {
        const res = await apiCall(`/link/domains/${id}`, { method: 'DELETE' });
        if (res.success) {
            alert('✅ Đã xóa domain!');
            loadLinkDomains();
        } else {
            alert('❌ Lỗi: ' + res.message);
        }
    } catch (e) {
        console.error('Lỗi deleteDomain:', e);
        alert('❌ Có lỗi xảy ra khi xóa domain');
    }
}

// ════════════════════════════════════════════════════════════════
// TAB 3: KẾT QUẢ (link_results)
// ════════════════════════════════════════════════════════════════

let windowLinkResults = [];

async function loadLinkResults() {
    const tbody = document.getElementById('link-results-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Đang tải danh sách kết quả...</td></tr>';

    try {
        const data = await apiCall('/link/results');
        if (data.success) {
            windowLinkResults = data.data || [];
            filterLinkResults();
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi: ${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Lỗi load link results:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi kết nối máy chủ</td></tr>';
    }
}

function filterLinkResults() {
    const tbody = document.getElementById('link-results-body');
    if (!tbody) return;

    const searchInput = document.getElementById('link-results-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filtered = windowLinkResults.filter(item => {
        if (!query) return true;
        const linkIdStr = String(item.link_id || '').toLowerCase();
        const linkNameStr = String(item.link_name || '').toLowerCase();
        return linkIdStr.includes(query) || linkNameStr.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Không tìm thấy dữ liệu phù hợp.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const createdDate = item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'N/A';
        const formattedResult = item.result ? item.result.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>') : 'N/A';

        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-weight: bold; color: #00d2ff; vertical-align: top;">${item.id}</td>
                <td style="padding: 12px; vertical-align: top;">
                    <div style="font-weight: bold; color: #fff;">${item.link_name || 'N/A'}</div>
                    <div style="font-size: 12px; color: #64748b;">Link ID: ${item.link_id}</div>
                </td>
                <td style="padding: 12px; vertical-align: top;">
                    <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.6; color: #38bdf8;">
                        ${formattedResult}
                    </div>
                </td>
                <td style="padding: 12px; font-size: 12px; color: #aaa; vertical-align: top;">${createdDate}</td>
            </tr>
        `;
    }).join('');
}

// ════════════════════════════════════════════════════════════════
// TAB 4: KẾT QUẢ LẤY IP QUA THUMBNAIL (link_results_thumbnail)
// ════════════════════════════════════════════════════════════════

let windowLinkResultsThumbnail = [];

async function loadLinkResultsThumbnail() {
    const tbody = document.getElementById('link-results-thumbnail-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Đang tải danh sách kết quả thumbnail...</td></tr>';

    try {
        const data = await apiCall('/link/results-thumbnail');
        if (data.success) {
            windowLinkResultsThumbnail = data.data || [];
            filterLinkResultsThumbnail();
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi: ${data.message}</td></tr>`;
        }
    } catch (error) {
        console.error('Lỗi load link results thumbnail:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444; padding: 20px;">Lỗi kết nối máy chủ</td></tr>';
    }
}

function filterLinkResultsThumbnail() {
    const tbody = document.getElementById('link-results-thumbnail-body');
    if (!tbody) return;

    const searchInput = document.getElementById('link-results-thumbnail-search');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const filtered = windowLinkResultsThumbnail.filter(item => {
        if (!query) return true;
        const linkIdStr = String(item.link_id || '').toLowerCase();
        const linkNameStr = String(item.link_name || '').toLowerCase();
        return linkIdStr.includes(query) || linkNameStr.includes(query);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Không tìm thấy dữ liệu phù hợp.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(item => {
        const createdDate = item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : 'N/A';
        const formattedResults = item.results 
            ? item.results.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
            : '<span style="color:#888; font-style:italic">Chưa có kết quả (Đang giữ chỗ)</span>';

        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 12px; font-weight: bold; color: #00d2ff; vertical-align: top;">${item.id}</td>
                <td style="padding: 12px; vertical-align: top;">
                    <div style="font-weight: bold; color: #fff;">${item.link_name || 'N/A'}</div>
                    <div style="font-size: 12px; color: #64748b;">Link ID: ${item.link_id}</div>
                </td>
                <td style="padding: 12px; vertical-align: top;">
                    <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid #334155; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 13px; line-height: 1.6; color: #38bdf8;">
                        ${formattedResults}
                    </div>
                </td>
                <td style="padding: 12px; font-size: 12px; color: #aaa; vertical-align: top;">${createdDate}</td>
            </tr>
        `;
    }).join('');
}

async function uploadThumbnailFile(input) {
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    const templateId = document.getElementById('link-template-id')?.value || '';

    const formData = new FormData();
    formData.append('thumbnail', file);
    if (templateId) {
        formData.append('template_id', templateId);
    }

    const thumbInput = document.getElementById('link-template-thumbnail');
    const originalText = thumbInput ? thumbInput.value : '';
    if (thumbInput) {
        thumbInput.value = '⏳ Đang tải ảnh lên FILES_SERVER...';
    }

    try {
        const data = await apiCall('/link/upload-thumbnail', {
            method: 'POST',
            body: formData
        });

        if (data && data.success && data.url) {
            if (thumbInput) {
                thumbInput.value = data.url;
            }
            const imgPreview = document.getElementById('link-template-thumb-img');
            const previewContainer = document.getElementById('link-template-thumb-preview');
            if (imgPreview && previewContainer) {
                imgPreview.src = data.url;
                previewContainer.style.display = 'block';
            }
            alert('✅ Tải ảnh thumbnail từ máy tính lên FILES_SERVER thành công!');
        } else {
            alert('❌ Lỗi upload ảnh: ' + (data?.message || 'Không xác định'));
            if (thumbInput) thumbInput.value = originalText;
        }
    } catch (err) {
        console.error('Lỗi upload thumbnail file:', err);
        alert('❌ Lỗi kết nối máy chủ khi upload ảnh!');
        if (thumbInput) thumbInput.value = originalText;
    } finally {
        input.value = '';
    }
}


