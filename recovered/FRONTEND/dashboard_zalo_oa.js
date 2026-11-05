// Zalo OA Toolset Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check role to display the hub card
    const checkRoleInterval = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkRoleInterval);
            if (currentUser.userRole === 1) {
                const oaCard = document.getElementById('hub-zalo-oa-card');
                if (oaCard) oaCard.style.display = 'block';
            }
        }
    }, 100);
});

// Show specific tab in Zalo OA Hub
function showZaloOaTab(tabId, buttonElement) {
    // Hide all tabs
    const tabs = document.querySelectorAll('#hub-zalo-oa .zalo-oa-tab');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Remove active class from all buttons
    const buttons = document.querySelectorAll('#hub-zalo-oa .sub-menu-item');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(`zalo-oa-tab-${tabId}`).style.display = 'block';
    
    // Add active class to clicked button
    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    // Tự động kiểm tra & refresh token nếu đã hết hạn
    checkAndAutoRefreshTokenOa();

    // Call specific init functions based on tab
    if (tabId === 'templates') loadOaTemplates();
    if (tabId === 'token') loadOaToken();
    if (tabId === 'results') loadOaResults();
    if (tabId === 'send') loadOaTemplatesForSend();
    if (tabId === 'send-uid') loadOaTemplatesForSendUid();
}

// Tự động kiểm tra và refresh token nếu đã hết hạn khi vào bộ công cụ Zalo OA
async function checkAndAutoRefreshTokenOa() {
    try {
        const data = await apiCall('/zalo-oa/token');
        if (data && data.success && data.data) {
            const tokenData = data.data;
            if (tokenData.expires_at) {
                const expiresAt = new Date(tokenData.expires_at);
                const now = new Date();
                // Kiểm tra nếu token đã hết hạn hoặc sắp hết hạn trong vòng 60s
                if (expiresAt <= new Date(now.getTime() + 60000)) {
                    console.log('🔄 [Zalo OA] Access token đã hết hạn, tự động cấp lại token mới...');
                    const refreshRes = await apiCall('/zalo-oa/token/refresh', {
                        method: 'POST',
                        body: JSON.stringify({ refresh_token: tokenData.refresh_token || '' })
                    });
                    if (refreshRes && refreshRes.success) {
                        console.log('✅ [Zalo OA] Tự động cấp lại token thành công!');
                        const tokenTab = document.getElementById('zalo-oa-tab-token');
                        if (tokenTab && tokenTab.style.display !== 'none') {
                            loadOaToken();
                        }
                    } else {
                        console.warn('⚠️ [Zalo OA] Tự động cấp lại token thất bại:', refreshRes ? refreshRes.message : 'Unknown error');
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ [Zalo OA] Lỗi tự động kiểm tra/refresh token:', error);
    }
}

// -----------------------------------------
// TAB: QUẢN LÝ TOKEN
// -----------------------------------------
async function loadOaToken() {
    try {
        const data = await apiCall('/zalo-oa/token');
        
        const tokenInfoDiv = document.getElementById('zalo-oa-token-info');
        if (data.success && data.data) {
            const tokenData = data.data;
            const expiresAt = new Date(tokenData.expires_at);
            const now = new Date();
            const isExpired = expiresAt <= now;
            
            let statusHtml = isExpired 
                ? `<span class="badge badge-danger" style="padding: 5px 15px; border-radius: 20px;">Hết hạn</span>`
                : `<span class="badge badge-success" style="padding: 5px 15px; border-radius: 20px; background: rgba(0, 210, 255, 0.1); color: #00d2ff; border: 1px solid #00d2ff;">Còn hạn</span>`;
                
            tokenInfoDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px;">
                    <span style="font-weight: bold; font-size: 16px; color: #fff;">Trạng thái:</span> 
                    <span>${statusHtml}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 20px;">
                    <span style="font-weight: bold; font-size: 16px; color: #fff;">Thời gian hết hạn:</span> 
                    <span style="color: #00d2ff; font-weight: bold; font-size: 16px;">${expiresAt.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                    <span style="font-weight: bold; font-size: 16px; white-space: nowrap; margin-right: 30px; color: #fff;">Refresh Token hiện tại:</span> 
                    <span style="word-break: break-all; color: #00d2ff; text-align: right; line-height: 1.6; font-family: monospace; font-size: 15px;" title="${tokenData.refresh_token}">
                        ${tokenData.refresh_token.length > 50 ? tokenData.refresh_token.substring(0, 50) + '...' : tokenData.refresh_token}
                    </span>
                </div>
            `;
            // Save to a global variable so we can use it in the prompt if needed
            window.currentZaloRefreshData = tokenData.refresh_token;
        } else {
            tokenInfoDiv.innerHTML = `<p>Chưa có token nào được lưu.</p>`;
            window.currentZaloRefreshData = '';
        }
    } catch (error) {
        console.error('Lỗi khi lấy token info:', error);
    }
}

async function promptRefreshToken() {
    const defaultToken = window.currentZaloRefreshData || '';
    document.getElementById('oa-refresh-token-input').value = defaultToken;
    document.getElementById('oaRefreshTokenModal').style.display = 'flex';
}

function closeOaRefreshTokenModal() {
    document.getElementById('oaRefreshTokenModal').style.display = 'none';
}

async function submitOaRefreshToken() {
    const refreshToken = document.getElementById('oa-refresh-token-input').value;
    
    // Nếu user bấm "Cập nhật ngay" mà để trống thì vẫn cho phép (sẽ dùng token cũ trong DB)
    // Nhưng nếu user bấm "Bỏ qua" thì đã có closeOaRefreshTokenModal lo
    
    try {
        const payload = {};
        if (refreshToken && refreshToken.trim() !== '') {
            payload.refresh_token = refreshToken.trim();
        }
        
        const data = await apiCall('/zalo-oa/token/refresh', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        if (data.success) {
            alert('Lấy Access Token thành công!');
            closeOaRefreshTokenModal();
            loadOaToken();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi refresh token:', error);
        alert('Có lỗi xảy ra khi refresh token.');
    }
}

// -----------------------------------------
// TAB: QUẢN LÝ TEMPLATE
// -----------------------------------------
async function loadOaTemplates() {
    try {
        const data = await apiCall('/zalo-oa/templates');
        
        const tbody = document.getElementById('zalo-oa-templates-body');
        if (data.success) {
            window.oaTemplateListManage = data.data;
            if (data.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Chưa có template nào</td></tr>`;
                return;
            }
            
            tbody.innerHTML = data.data.map(item => `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.template_id}</td>
                    <td>${item.detail}</td>
                    <td>${item.params}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 12px;" onclick="editOaTemplate(${item.id})">Sửa</button>
                        <button class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;" onclick="deleteOaTemplate(${item.id})">Xóa</button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Lỗi load template:', error);
    }
}

async function saveOaTemplate() {
    const id = document.getElementById('oa-template-id').value;
    const template_id = document.getElementById('oa-template-code').value;
    const detail = document.getElementById('oa-template-detail').value;
    const params = document.getElementById('oa-template-params').value;
    
    if (!template_id) return alert('Vui lòng nhập Template ID');
    
    const payload = { template_id, detail, params };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/zalo-oa/templates/${id}` : `/zalo-oa/templates`;
    
    try {
        const data = await apiCall(url, {
            method,
            body: JSON.stringify(payload)
        });
        if (data.success) {
            alert('Lưu template thành công');
            closeOaTemplateModal();
            loadOaTemplates();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi save template:', error);
    }
}

function openOaTemplateModal() {
    document.getElementById('oa-template-modal-title').innerText = 'Thêm Template Mới';
    document.getElementById('oa-template-id').value = '';
    document.getElementById('oa-template-code').value = '';
    document.getElementById('oa-template-detail').value = '';
    document.getElementById('oa-template-params').value = '';
    document.getElementById('oaTemplateModal').style.display = 'flex';
}

function closeOaTemplateModal() {
    document.getElementById('oaTemplateModal').style.display = 'none';
}

function editOaTemplate(id) {
    const template = (window.oaTemplateListManage || []).find(t => t.id === id);
    if (!template) return alert('Không tìm thấy dữ liệu template!');
    
    document.getElementById('oa-template-modal-title').innerText = 'Sửa Template';
    document.getElementById('oa-template-id').value = template.id;
    document.getElementById('oa-template-code').value = template.template_id;
    document.getElementById('oa-template-detail').value = template.detail || '';
    document.getElementById('oa-template-params').value = template.params || '';
    document.getElementById('oaTemplateModal').style.display = 'flex';
}

async function deleteOaTemplate(id) {
    if (!confirm('Bạn có chắc muốn xóa template này?')) return;
    try {
        const data = await apiCall(`/zalo-oa/templates/${id}`, {
            method: 'DELETE'
        });
        if (data.success) {
            loadOaTemplates();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi xóa template:', error);
    }
}

// -----------------------------------------
// TAB: KẾT QUẢ
// -----------------------------------------
async function loadOaResults() {
    try {
        const data = await apiCall('/zalo-oa/results');
        
        const tbody = document.getElementById('zalo-oa-results-body');
        if (data.success) {
            if (data.data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu</td></tr>`;
                return;
            }
            
            tbody.innerHTML = data.data.map(item => {
                const dateObj = new Date(item.created_at);
                
                let isFailed = false;
                let messageToDisplay = '';
                
                if (item.result === 'success') {
                    isFailed = false;
                    messageToDisplay = item.detail || 'Thành công';
                } else if (item.result === 'error') {
                    isFailed = true;
                    messageToDisplay = item.detail || 'Lỗi không xác định';
                } else {
                    // Fallback cho dữ liệu cũ (JSON)
                    isFailed = item.result && (item.result.includes('"error":') || item.result.includes('"result":"error"'));
                    messageToDisplay = item.result;
                    try {
                        const parsed = JSON.parse(item.result);
                        if (parsed && parsed.message) messageToDisplay = parsed.message;
                    } catch (e) {}
                }
                
                const badgeClass = isFailed ? 'badge-danger' : 'badge-success';
                const statusText = isFailed ? 'Lỗi' : 'Thành công';
                const textColor = isFailed ? '#F44336' : '#00d2ff';
                
                return `
                <tr>
                    <td>${item.id}</td>
                    <td>${dateObj.toLocaleString()}</td>
                    <td>${item.order_code}</td>
                    <td>${item.phone_number || item.user_id || 'N/A'}</td>
                    <td>${item.template_id}</td>
                    <td style="font-size: 12px; line-height: 1.4;">${item.msg_status || '<span style="color:#999; font-style:italic">Chưa kiểm tra</span>'}</td>
                    <td style="text-align: center;">
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </td>
                    <td>
                        <div style="font-size: 13px; font-weight: bold; color: ${textColor}; max-width: 350px;" title='${messageToDisplay.replace(/'/g, "&apos;")}'>
                            ${messageToDisplay}
                        </div>
                    </td>
                    <td>
                        ${item.msg_id ? `<button class="btn btn-sm" style="background:#00d2ff; color:#fff; padding:4px 8px; border-radius:4px; font-size:11px; white-space:nowrap;" onclick="updateOaMessageStatus('${item.msg_id}', '${item.phone_number}', ${item.id}, this)">Update Status</button>` : ''}
                    </td>
                </tr>
            `}).join('');
        }
    } catch (error) {
        console.error('Lỗi load results:', error);
    }
}
async function updateOaMessageStatus(msgId, phone, id, btn) {
    if (!msgId || !phone || !id) return;
    
    const originalText = btn.innerText;
    btn.innerText = 'Updating...';
    btn.disabled = true;
    
    try {
        const data = await apiCall(`/zalo-oa/message-status?message_id=${msgId}&phone=${phone}&id=${id}`);
        if (data.success) {
            // Re-load results to see updated status
            await loadOaResults();
        } else {
            alert('Lỗi: ' + data.message);
            btn.innerText = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái:', error);
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// -----------------------------------------
// TAB: GỬI TIN NHẮN OA
// -----------------------------------------
let oaTemplateList = [];

function onOaIpTypeChange() {
    const ipType = document.getElementById('oa-send-ip-type').value;
    const singleContainer = document.getElementById('oa-single-template-container');
    const bothContainer = document.getElementById('oa-both-templates-container');
    
    if (ipType === 'both') {
        singleContainer.style.display = 'none';
        bothContainer.style.display = 'block';
        
        // Load v4 templates into v4 select
        const v4Select = document.getElementById('oa-send-template-v4-select');
        const v4Templates = oaTemplateList.filter(t => (t.detail || '').toLowerCase().includes('v4'));
        v4Select.innerHTML = `<option value="">-- Chọn Template V4 --</option>` + 
            v4Templates.map(item => `<option value="${item.template_id}">${item.template_id} - ${item.detail}</option>`).join('');
            
        // Load v6 templates into v6 select
        const v6Select = document.getElementById('oa-send-template-v6-select');
        const v6Templates = oaTemplateList.filter(t => (t.detail || '').toLowerCase().includes('v6'));
        v6Select.innerHTML = `<option value="">-- Chọn Template V6 --</option>` + 
            v6Templates.map(item => `<option value="${item.template_id}">${item.template_id} - ${item.detail}</option>`).join('');
    } else {
        singleContainer.style.display = 'block';
        bothContainer.style.display = 'none';
        
        const label = document.getElementById('oa-template-label');
        label.innerText = `Mẫu tin nhắn (Template) cho ${ipType.toUpperCase()} *`;
        
        const select = document.getElementById('oa-send-template-select');
        const searchKey = ipType === 'ipv4' ? 'v4' : 'v6';
        const filteredTemplates = oaTemplateList.filter(t => (t.detail || '').toLowerCase().includes(searchKey));
        select.innerHTML = `<option value="">-- Chọn Template --</option>` + 
            filteredTemplates.map(item => `<option value="${item.template_id}">${item.template_id} - ${item.detail}</option>`).join('');
    }
}

async function loadOaTemplatesForSend() {
    try {
        const data = await apiCall('/zalo-oa/templates');
        
        if (data.success) {
            oaTemplateList = data.data;
            // Trigger initial filter (default is ipv4)
            onOaIpTypeChange();
        }
    } catch (error) {
        console.error('Lỗi load template for send:', error);
    }
}

async function checkAndLoadOaDynamicFields() {
    const phone = document.getElementById('oa-send-phone').value.trim();
    const ipType = document.getElementById('oa-send-ip-type').value;
    
    let templateIds = [];
    if (ipType === 'both') {
        const v4Id = document.getElementById('oa-send-template-v4-select').value;
        const v6Id = document.getElementById('oa-send-template-v6-select').value;
        if (!v4Id || !v6Id) {
            alert('Vui lòng chọn đầy đủ Template cho cả IPv4 và IPv6.');
            return;
        }
        templateIds = [v4Id, v6Id];
    } else {
        const templateId = document.getElementById('oa-send-template-select').value;
        if (!templateId) {
            alert('Vui lòng chọn Template.');
            return;
        }
        templateIds = [templateId];
    }

    if (!phone) {
        alert('Vui lòng điền Số điện thoại.');
        return;
    }
    
    const dynamicFieldsDiv = document.getElementById('oa-send-dynamic-fields');
    
    // Switch to step 2 and show loading
    document.getElementById('oa-send-step-1').style.display = 'none';
    document.getElementById('oa-send-step-2').style.display = 'block';
    
    // Hiện loading
    dynamicFieldsDiv.innerHTML = '<div style="text-align: center; color: #888; padding: 10px;">Đang tải dữ liệu mô phỏng...</div>';
    
    // Gọi API lấy dữ liệu preview
    let previewData = {};
    try {
        const previewRes = await apiCall('/zalo-oa/preview-data');
        if (previewRes.success) {
            previewData = previewRes.data;
        }
    } catch (e) {
        console.error('Error fetching preview data:', e);
    }
    
    // Thu thập tất cả params từ các template được chọn
    const allParams = new Set();
    templateIds.forEach(tid => {
        const template = oaTemplateList.find(t => t.template_id === tid);
        if (template && template.params) {
            template.params.split(',').map(p => p.trim()).filter(p => p !== '').forEach(p => allParams.add(p));
        }
    });
    
    const paramsList = Array.from(allParams);
    
    let customFieldsHTML = [];
    let autoFieldsHTML = [];
    
    paramsList.forEach(param => {
        const paramLower = param.toLowerCase();
        // Các trường hệ thống tự sinh
        if (['date', 'order_code', 'price', 'phone_number'].includes(paramLower)) {
            let valToDisplay = previewData[paramLower] || 'Auto-generated';
            if (paramLower === 'phone_number') valToDisplay = phone;
            
            autoFieldsHTML.push(`
            <div class="form-group" style="opacity: 0.7;">
                <label>${param} (Hệ thống tự động sinh)</label>
                <input type="text" class="oa-custom-param-auto" data-param="${param}" value="${valToDisplay}" readonly style="background: rgba(255,255,255,0.05); color: #00d2ff; font-weight: bold;">
            </div>`);
        } else {
            let defaultVal = '';
            if (paramLower === 'status') {
                defaultVal = 'Đang xử lý';
            }
            
            customFieldsHTML.push(`
            <div class="form-group">
                <label>${param} *</label>
                <input type="text" id="oa-param-${param}" class="oa-custom-param" data-param="${param}" value="${defaultVal}" required>
            </div>`);
        }
    });
    
    dynamicFieldsDiv.innerHTML = (paramsList.length > 0) 
        ? (customFieldsHTML.join('') + autoFieldsHTML.join(''))
        : '<div style="text-align: center; color: #888; padding: 20px;">Template này không có tham số cần điền.</div>';
}

function backToOaStep1() {
    document.getElementById('oa-send-step-1').style.display = 'block';
    document.getElementById('oa-send-step-2').style.display = 'none';
    document.getElementById('oa-send-step-3').style.display = 'none';
    
    // Reset form fields
    document.getElementById('oa-send-dynamic-fields').innerHTML = '';
}

async function sendOaMessage() {
    const phone = document.getElementById('oa-send-phone').value.trim();
    const ipType = document.getElementById('oa-send-ip-type').value;
    
    let templateIds = [];
    if (ipType === 'both') {
        templateIds = [
            document.getElementById('oa-send-template-v4-select').value,
            document.getElementById('oa-send-template-v6-select').value
        ];
    } else {
        templateIds = [document.getElementById('oa-send-template-select').value];
    }
    
    if (!phone) return alert('Vui lòng nhập số điện thoại');
    if (templateIds.some(id => !id)) return alert('Vui lòng chọn đầy đủ template');
    
    const custom_params = {};
    const inputs = document.querySelectorAll('#oa-send-step-2 .oa-custom-param');
    let valid = true;
    inputs.forEach(input => {
        if (!input.value && input.hasAttribute('required')) valid = false;
        custom_params[input.dataset.param] = input.value;
    });
    
    // Lấy cả các trường tự sinh
    const autoInputs = document.querySelectorAll('#oa-send-step-2 .oa-custom-param-auto');
    autoInputs.forEach(input => {
        custom_params[input.dataset.param] = input.value;
    });
    
    if (!valid) return alert('Vui lòng điền đầy đủ các tham số cấu hình');
    
    const btn = document.getElementById('btn-send-oa');
    const ogText = btn.innerHTML;
    btn.innerHTML = 'Đang xử lý...';
    btn.disabled = true;
    
    try {
        const payload = {
            phone_number: phone,
            template_id: ipType === 'both' ? templateIds : templateIds[0],
            custom_params: custom_params
        };
        
        const data = await apiCall('/zalo-oa/send-template', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        // Show step 3
        document.getElementById('oa-send-step-2').style.display = 'none';
        document.getElementById('oa-send-step-3').style.display = 'block';
        
        const resultContainer = document.getElementById('oa-send-result-container');
        
        if (data.success) {
            resultContainer.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
                    <h3 style="color: #4CAF50; margin-top: 0;">Gửi tin nhắn thành công</h3>
                    <div style="text-align: left; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <p style="margin: 5px 0;">SĐT: <strong>${phone}</strong></p>
                        <p style="margin: 5px 0;">Mẫu gửi: <strong>${ipType === 'both' ? templateIds.join(', ') : templateIds[0]}</strong></p>
                        <p style="margin: 8px 0; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; color: #aaa;">
                            ${data.message}
                        </p>
                    </div>
                </div>
            `;
            document.getElementById('oa-send-phone').value = '';
        } else {
            resultContainer.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">❌</div>
                    <h3 style="color: #F44336; margin-top: 0;">Gửi tin nhắn thất bại</h3>
                    <p style="color: #ddd;">Lỗi: ${data.message}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi send OA message:', error);
        document.getElementById('oa-send-step-2').style.display = 'none';
        document.getElementById('oa-send-step-3').style.display = 'block';
        document.getElementById('oa-send-result-container').innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 40px; margin-bottom: 10px;">🔌</div>
                <h3 style="color: #F44336; margin-top: 0;">Lỗi kết nối</h3>
                <p style="color: #ddd;">Không thể kết nối đến máy chủ. Vui lòng thử lại sau.</p>
            </div>
        `;
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
    }
}

function toggleAllOaFetch(master) {
    const checkboxes = document.querySelectorAll('.oa-auto-fetch-checkbox');
    checkboxes.forEach(cb => cb.checked = master.checked);
}

async function autoFetchOaTemplates() {
    try {
        const btn = event.target;
        const ogText = btn.innerHTML;
        btn.innerHTML = '🔄 Đang tìm...';
        btn.disabled = true;

        const data = await apiCall('/zalo-oa/fetch-new-templates');
        
        btn.innerHTML = ogText;
        btn.disabled = false;

        if (data.success) {
            autoFetchedData = data.data;
            if (autoFetchedData.length === 0) {
                alert(data.message || 'Không tìm thấy template mới nào.');
                return;
            }
            
            const tbody = document.getElementById('oa-auto-fetch-body');
            tbody.innerHTML = autoFetchedData.map((t, index) => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="text-align: center; padding: 15px 12px;"><input type="checkbox" class="oa-auto-fetch-checkbox" data-index="${index}"></td>
                    <td style="font-weight: bold; color: #00d2ff; padding: 15px 12px;">${t.template_id}</td>
                    <td style="color: #fff; padding: 15px 12px;">${t.template_name}</td>
                    <td style="padding: 15px 12px;"><div style="max-width: 250px; font-size: 12px; color: #aaa; line-height: 1.5;">${t.params}</div></td>
                    <td style="padding: 15px 12px;"><input type="text" class="oa-auto-detail-input" data-index="${index}" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; outline: none; transition: 0.3s;" onfocus="this.style.borderColor='#00d2ff'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'" placeholder="VD: Thông báo trạng thái đơn hàng"></td>
                </tr>
            `).join('');
            
            if (document.getElementById('oa-auto-fetch-all')) {
                document.getElementById('oa-auto-fetch-all').checked = false;
            }
            
            document.getElementById('oa-auto-fetch-modal').style.display = 'flex';
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Lỗi auto fetch OA templates:', error);
        alert('Lỗi kết nối khi đồng bộ template.');
        // Khôi phục nút nếu có lỗi
        const btn = document.querySelector('button[onclick="autoFetchOaTemplates()"]');
        if (btn) {
            btn.innerHTML = '🔄 Tự động cập nhật';
            btn.disabled = false;
        }
    }
}

function closeOaAutoFetchModal() {
    document.getElementById('oa-auto-fetch-modal').style.display = 'none';
}

async function saveAutoFetchedTemplates() {
    const checkboxes = document.querySelectorAll('.oa-auto-fetch-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Vui lòng chọn ít nhất một template để lưu.');
        return;
    }

    const templatesToSave = [];
    checkboxes.forEach(cb => {
        const index = parseInt(cb.getAttribute('data-index'));
        const detailInput = document.querySelector(`.oa-auto-detail-input[data-index="${index}"]`);
        const detail = detailInput ? detailInput.value.trim() : '';
        const t = autoFetchedData[index];
        
        templatesToSave.push({
            template_id: t.template_id,
            detail: detail || t.template_name,
            params: t.params
        });
    });

    const saveBtn = event.target;
    const ogText = saveBtn.innerHTML;
    saveBtn.innerHTML = '⏳ Đang lưu...';
    saveBtn.disabled = true;

    try {
        let successCount = 0;
        for (const t of templatesToSave) {
            const data = await apiCall('/zalo-oa/templates', {
                method: 'POST',
                body: JSON.stringify(t)
            });
            if (data.success) successCount++;
        }
        
        alert(`Đã lưu thành công ${successCount}/${templatesToSave.length} template mới.`);
        closeOaAutoFetchModal();
        loadOaTemplates(); // Tải lại danh sách chính
    } catch (error) {
        console.error('Lỗi lưu template đồng bộ:', error);
        alert('Có lỗi xảy ra khi lưu template.');
    } finally {
        saveBtn.innerHTML = ogText;
        saveBtn.disabled = false;
    }
}

// -----------------------------------------
// TAB: GỬI TIN NHẮN OA BẰNG UID
// -----------------------------------------
function onOaIpTypeChangeUid() {
    const ipType = document.getElementById('oa-send-uid-ip-type').value;
    const singleContainer = document.getElementById('oa-uid-single-template-container');
    const bothContainer = document.getElementById('oa-uid-both-templates-container');
    
    if (ipType === 'both') {
        singleContainer.style.display = 'none';
        bothContainer.style.display = 'block';
        
        // Load v4 templates into v4 select
        const v4Select = document.getElementById('oa-send-uid-template-v4-select');
        const v4Templates = oaTemplateList.filter(t => (t.detail || '').toLowerCase().includes('v4'));
        v4Select.innerHTML = `<option value="">-- Chọn Template V4 --</option>` + 
            v4Templates.map(item => `<option value="${item.template_id}">${item.template_id} - ${item.detail}</option>`).join('');
            
        // Load v6 templates into v6 select
        const v6Select = document.getElementById('oa-send-uid-template-v6-select');
        const v6Templates = oaTemplateList.filter(t => (t.detail || '').toLowerCase().includes('v6'));
        v6Select.innerHTML = `<option value="">-- Chọn Template V6 --</option>` + 
            v6Templates.map(item => `<option value="${item.template_id}">${item.template_id} - ${item.detail}</option>`).join('');
    } else {
        singleContainer.style.display = 'block';
        bothContainer.style.display = 'none';
        
        const label = document.getElementById('oa-uid-template-label');
        label.innerText = `Mẫu tin nhắn (Template) cho ${ipType.toUpperCase()} *`;
        
        const select = document.getElementById('oa-send-uid-template-select');
        const searchKey = ipType === 'ipv4' ? 'v4' : 'v6';
        const filteredTemplates = oaTemplateList.filter(t => (t.detail || '').toLowerCase().includes(searchKey));
        select.innerHTML = `<option value="">-- Chọn Template --</option>` + 
            filteredTemplates.map(item => `<option value="${item.template_id}">${item.template_id} - ${item.detail}</option>`).join('');
    }
}

async function loadOaTemplatesForSendUid() {
    if (oaTemplateList.length === 0) {
        await loadOaTemplatesForSend();
    } else {
        onOaIpTypeChangeUid();
    }
}

async function checkAndLoadOaDynamicFieldsUid() {
    const uid = document.getElementById('oa-send-uid').value.trim();
    const ipType = document.getElementById('oa-send-uid-ip-type').value;
    
    let templateIds = [];
    if (ipType === 'both') {
        const v4Id = document.getElementById('oa-send-uid-template-v4-select').value;
        const v6Id = document.getElementById('oa-send-uid-template-v6-select').value;
        if (!v4Id || !v6Id) {
            alert('Vui lòng chọn đầy đủ Template cho cả IPv4 và IPv6.');
            return;
        }
        templateIds = [v4Id, v6Id];
    } else {
        const templateId = document.getElementById('oa-send-uid-template-select').value;
        if (!templateId) {
            alert('Vui lòng chọn Template.');
            return;
        }
        templateIds = [templateId];
    }

    if (!uid) {
        alert('Vui lòng điền Zalo UserID (UID).');
        return;
    }
    
    const dynamicFieldsDiv = document.getElementById('oa-send-uid-dynamic-fields');
    
    // Switch to step 2 and show loading
    document.getElementById('oa-send-uid-step-1').style.display = 'none';
    document.getElementById('oa-send-uid-step-2').style.display = 'block';
    
    // Hiện loading
    dynamicFieldsDiv.innerHTML = '<div style="text-align: center; color: #888; padding: 10px;">Đang tải dữ liệu mô phỏng...</div>';
    
    // Gọi API lấy dữ liệu preview
    let previewData = {};
    try {
        const previewRes = await apiCall('/zalo-oa/preview-data');
        if (previewRes.success) {
            previewData = previewRes.data;
        }
    } catch (e) {
        console.error('Error fetching preview data:', e);
    }
    
    // Thu thập tất cả params từ các template được chọn
    const allParams = new Set();
    templateIds.forEach(tid => {
        const template = oaTemplateList.find(t => t.template_id === tid);
        if (template && template.params) {
            template.params.split(',').map(p => p.trim()).filter(p => p !== '').forEach(p => allParams.add(p));
        }
    });
    
    const paramsList = Array.from(allParams);
    
    let customFieldsHTML = [];
    let autoFieldsHTML = [];
    
    paramsList.forEach(param => {
        const paramLower = param.toLowerCase();
        // Các trường hệ thống tự sinh (Trừ phone_number khi gửi bằng UID)
        if (['date', 'order_code', 'price'].includes(paramLower)) {
            let valToDisplay = previewData[paramLower] || 'Auto-generated';
            
            autoFieldsHTML.push(`
            <div class="form-group" style="opacity: 0.7;">
                <label>${param} (Hệ thống tự động sinh)</label>
                <input type="text" class="oa-custom-param-auto" data-param="${param}" value="${valToDisplay}" readonly style="background: rgba(255,255,255,0.05); color: #00d2ff; font-weight: bold;">
            </div>`);
        } else if (paramLower === 'phone_number') {
            // Khi gửi bằng UID, nếu có phone_number thì cho user tự nhập
            customFieldsHTML.push(`
            <div class="form-group">
                <label>${param} (Vui lòng tự nhập vì đang gửi bằng UID) *</label>
                <input type="text" class="oa-custom-param" data-param="${param}" placeholder="Nhập số điện thoại" required>
            </div>`);
        } else {
            let defaultVal = '';
            if (paramLower === 'status') {
                defaultVal = 'Đang xử lý';
            }
            
            customFieldsHTML.push(`
            <div class="form-group">
                <label>${param} *</label>
                <input type="text" class="oa-custom-param" data-param="${param}" value="${defaultVal}" required>
            </div>`);
        }
    });
    
    dynamicFieldsDiv.innerHTML = (paramsList.length > 0) 
        ? (customFieldsHTML.join('') + autoFieldsHTML.join(''))
        : '<div style="text-align: center; color: #888; padding: 20px;">Template này không có tham số cần điền.</div>';
}

function backToOaUidStep1() {
    document.getElementById('oa-send-uid-step-1').style.display = 'block';
    document.getElementById('oa-send-uid-step-2').style.display = 'none';
    document.getElementById('oa-send-uid-step-3').style.display = 'none';
    
    // Reset form fields
    document.getElementById('oa-send-uid-dynamic-fields').innerHTML = '';
}

async function sendOaMessageUid() {
    const uid = document.getElementById('oa-send-uid').value.trim();
    const ipType = document.getElementById('oa-send-uid-ip-type').value;
    
    let templateIds = [];
    if (ipType === 'both') {
        templateIds = [
            document.getElementById('oa-send-uid-template-v4-select').value,
            document.getElementById('oa-send-uid-template-v6-select').value
        ];
    } else {
        templateIds = [document.getElementById('oa-send-uid-template-select').value];
    }
    
    if (!uid) return alert('Vui lòng nhập Zalo UserID (UID)');
    if (templateIds.some(id => !id)) return alert('Vui lòng chọn đầy đủ template');
    
    const custom_params = {};
    const inputs = document.querySelectorAll('#oa-send-uid-step-2 .oa-custom-param');
    let valid = true;
    inputs.forEach(input => {
        if (!input.value && input.hasAttribute('required')) valid = false;
        custom_params[input.dataset.param] = input.value;
    });
    
    // Lấy cả các trường tự sinh
    const autoInputs = document.querySelectorAll('#oa-send-uid-step-2 .oa-custom-param-auto');
    autoInputs.forEach(input => {
        custom_params[input.dataset.param] = input.value;
    });
    
    if (!valid) return alert('Vui lòng điền đầy đủ các tham số cấu hình');
    
    const btn = document.getElementById('btn-send-oa-uid');
    const ogText = btn.innerHTML;
    btn.innerHTML = 'Đang xử lý...';
    btn.disabled = true;
    
    try {
        const payload = {
            user_id: uid,
            template_id: ipType === 'both' ? templateIds : templateIds[0],
            custom_params: custom_params
        };
        
        const data = await apiCall('/zalo-oa/send-template-uid', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        // Show step 3
        document.getElementById('oa-send-uid-step-2').style.display = 'none';
        document.getElementById('oa-send-uid-step-3').style.display = 'block';
        
        const resultContainer = document.getElementById('oa-send-uid-result-container');
        
        if (data.success) {
            resultContainer.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">✅</div>
                    <h3 style="color: #4CAF50; margin-top: 0;">Gửi tin nhắn thành công</h3>
                    <div style="text-align: left; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <p style="margin: 5px 0;">UID: <strong>${uid}</strong></p>
                        <p style="margin: 5px 0;">Mẫu gửi: <strong>${ipType === 'both' ? templateIds.join(', ') : templateIds[0]}</strong></p>
                        <p style="margin: 8px 0; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; color: #aaa;">
                            ${data.message}
                        </p>
                    </div>
                </div>
            `;
            document.getElementById('oa-send-uid').value = '';
        } else {
            resultContainer.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 40px; margin-bottom: 10px;">❌</div>
                    <h3 style="color: #F44336; margin-top: 0;">Gửi tin nhắn thất bại</h3>
                    <p style="color: #ddd;">Lỗi: ${data.message}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Lỗi send OA message UID:', error);
        document.getElementById('oa-send-uid-step-2').style.display = 'none';
        document.getElementById('oa-send-uid-step-3').style.display = 'block';
        document.getElementById('oa-send-uid-result-container').innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 40px; margin-bottom: 10px;">🔌</div>
                <h3 style="color: #F44336; margin-top: 0;">Lỗi kết nối</h3>
                <p style="color: #ddd;">Không thể kết nối đến máy chủ. Vui lòng thử lại sau.</p>
            </div>
        `;
    } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
    }
}

