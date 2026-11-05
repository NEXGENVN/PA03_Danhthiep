// ════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD JAVASCRIPT - CÔNG CỤ ZALO
// ════════════════════════════════════════════════════════════════
const API_URL = '/api';
const API_URL2 = `${API_URL}/admin`;

let currentUser = null;
let adminToken = null;
let csrfToken = null;
let toolSetupConfig = null;
let allZaloAccounts = [];
let allAutoRequests = [];

// ════════════════════════════════════════════════════════════════
// CSRF TOKEN MANAGEMENT
// ════════════════════════════════════════════════════════════════

async function fetchCsrfToken() {
    try {
        const response = await fetch(`${API_URL}/auth/csrf-token`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        const data = await response.json();
        if (data.success) {
            csrfToken = data.token;
            console.log('✅ Đã lấy CSRF token');
        }
    } catch (error) {
        console.error('❌ Lỗi lấy CSRF token:', error);
    }
}

// ════════════════════════════════════════════════════════════════
// KHỞI TẠO
// ════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadZaloAccounts();
    loadToolSetup();
    loadAutoRequests();
});

// ════════════════════════════════════════════════════════════════
// XÁC THỰC
// ════════════════════════════════════════════════════════════════

async function checkAuth() {
    adminToken = localStorage.getItem('admin_token');
    const userStr = localStorage.getItem('admin_user');

    if (!adminToken || !userStr) {
        window.location.href = '/admin.html';
        return;
    }

    currentUser = JSON.parse(userStr);

    // Hiển thị thông tin user
    document.getElementById('userName').textContent = currentUser.userName;
    document.getElementById('userAvatar').textContent = currentUser.userName.charAt(0).toUpperCase();

    // ✅ Lấy CSRF token
    await fetchCsrfToken();
}

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin.html';
    }
}

// ════════════════════════════════════════════════════════════════
// API CALLS
// ════════════════════════════════════════════════════════════════

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        credentials: 'omit'
    };

    if (method !== 'GET' && csrfToken) {
        options.headers['X-CSRF-Token'] = csrfToken;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL2}${endpoint}`, options);


    if (response.status === 401 || response.status === 403) {
        const data = await response.json();

        if (response.status === 403 && data.message?.includes('CSRF')) {
            console.log('⚠️ CSRF token không hợp lệ, đang lấy token mới...');
            await fetchCsrfToken();
            options.headers['X-CSRF-Token'] = csrfToken;
            const retryResponse = await fetch(`${API_URL2}${endpoint}`, options);
            return retryResponse.json();
        }

        showAlert('Phiên đăng nhập đã hết hạn', 'error');
        setTimeout(() => {
            logout();
        }, 2000);
        throw new Error('Unauthorized');
    }

    return response.json();
}

// ════════════════════════════════════════════════════════════════
// TÀI KHOẢN ZALO HỆ THỐNG
// ════════════════════════════════════════════════════════════════

async function loadZaloAccounts() {
    try {
        const response = await apiCall('/zalo-accounts');
        const tbody = document.getElementById('zaloAccountsTableBody');

        if (response.success) {
            allZaloAccounts = response.data;

            const totalZaloElem = document.getElementById('totalZaloAccounts');
            if (totalZaloElem) totalZaloElem.textContent = allZaloAccounts.length;

            if (allZaloAccounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #00ff41; opacity: 0.7;">Chưa có tài khoản Zalo nào</td></tr>';
            } else {
                tbody.innerHTML = allZaloAccounts.map(account => `
                    <tr>
                        <td>
                            <img src="${account.Avatar || 'https://via.placeholder.com/40'}" alt="Avatar" style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid #00ff41; object-fit: cover;">
                        </td>
                        <td class="text-truncate" title="${account.UID}"><strong>${account.UID}</strong></td>
                        <td>${account.displayName || 'N/A'}</td>
                        <td>${account.phoneNumber || 'N/A'}</td>
                        <td>
                            <span class="badge ${account.accStatus === 'Đang hoạt động' ? 'badge-success' : 'badge-danger'}">
                                ${account.accStatus || 'N/A'}
                            </span>
                        </td>
                        <td>${formatDateTime(account.ImportTime || account.createdAt)}</td>
                    </tr>
                `).join('');
            }
        } else {
            showAlert(response.message || 'Lỗi khi tải danh sách tài khoản Zalo', 'error');
        }
    } catch (error) {
        console.error('Error loading Zalo accounts:', error);
        showAlert('Lỗi kết nối khi tải danh sách tài khoản Zalo', 'error');
    }
}

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ CẤU HÌNH TOOL_SETUP
// ════════════════════════════════════════════════════════════════

async function loadToolSetup() {
    try {
        const data = await apiCall('/tool-setup');

        if (data.success) {
            toolSetupConfig = data.data;
            displayToolSetupInfo();
        }
    } catch (error) {
        console.error('Load tool setup error:', error);
    }
}

function displayToolSetupInfo() {
    const container = document.getElementById('toolSetupInfo');

    if (!toolSetupConfig) {
        container.innerHTML = '<p style="color: #00ff41; opacity: 0.7;">Chưa có cấu hình</p>';
        return;
    }

    const systemAccount = toolSetupConfig.systemAccount;

    container.innerHTML = `
        <div class="config-box">
            <h4 style="margin: 0 0 15px 0;">Cấu hình hiện tại:</h4>
            
            <div style="margin-bottom: 10px;">
                <strong>Tài khoản hệ thống:</strong><br>
                ${systemAccount ? `
                    <div class="config-value-box">
                        <strong>📱 ${systemAccount.displayName}</strong><br>
                        📞 SĐT: ${systemAccount.phoneNumber || 'N/A'}<br>
                        🆔 UID: ${systemAccount.UID}
                    </div>
                ` : '<span style="color: #ff003c;">Chưa thiết lập</span>'}
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Phí sử dụng tài khoản hệ thống để lấy IP:</strong> 
                <span class="text-danger" style="font-weight: bold;">${(toolSetupConfig.zalo_system_money || 0).toLocaleString('vi-VN')} ₫</span>
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Phí sử dụng tài khoản người dùng để lấy IP:</strong> 
                <span class="text-danger" style="font-weight: bold;">${(toolSetupConfig.zalo_custom_money || 0).toLocaleString('vi-VN')} ₫</span>
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Phí sử dụng tài khoản hệ thống để check Last-Online:</strong> 
                <span class="text-danger" style="font-weight: bold;">${(toolSetupConfig.check_phone_system_money || 0).toLocaleString('vi-VN')} ₫</span>
            </div>
            
            <div style="margin-bottom: 10px;">
                <strong>Phí sử dụng tài khoản người dùng để check Last-Online:</strong> 
                <span class="text-danger" style="font-weight: bold;">${(toolSetupConfig.check_phone_custom_money || 0).toLocaleString('vi-VN')} ₫</span>
            </div>

            <div style="margin-bottom: 10px;">
                <strong>Phí check Last-Online bằng danh thiếp:</strong> 
                <span class="text-danger" style="font-weight: bold;">${(toolSetupConfig.check_card_money || 0).toLocaleString('vi-VN')} ₫</span>
            </div>
        </div>
    `;
}

async function openToolSetupModal() {
    document.getElementById('toolSetupModal').style.display = 'flex';

    // Fill current config
    if (toolSetupConfig) {
        document.getElementById('setup_uid_zalo_system').value = toolSetupConfig.uid_zalo_system || '';
        document.getElementById('setup_zalo_system_money').value = toolSetupConfig.zalo_system_money || 30000;
        document.getElementById('setup_zalo_custom_money').value = toolSetupConfig.zalo_custom_money || 20000;
        document.getElementById('setup_check_phone_system_money').value = toolSetupConfig.check_phone_system_money || 10000;
        document.getElementById('setup_check_phone_custom_money').value = toolSetupConfig.check_phone_custom_money || 5000;
        document.getElementById('setup_check_card_money').value = toolSetupConfig.check_card_money || 5000;
    } else {
        document.getElementById('setup_zalo_system_money').value = 30000;
        document.getElementById('setup_zalo_custom_money').value = 20000;
        document.getElementById('setup_check_phone_system_money').value = 10000;
        document.getElementById('setup_check_phone_custom_money').value = 5000;
        document.getElementById('setup_check_card_money').value = 5000;
    }

    // Request accounts if not loaded yet
    if (allZaloAccounts.length === 0) {
        await loadZaloAccounts();
    }

    const select = document.getElementById('setup_uid_zalo_system');
    select.innerHTML = '<option value="">-- Không sử dụng tài khoản hệ thống --</option>';

    allZaloAccounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.UID;
        option.textContent = `${account.displayName || 'N/A'} - SĐT: ${account.phoneNumber || 'N/A'}`;
        select.appendChild(option);
    });

    if (toolSetupConfig && toolSetupConfig.uid_zalo_system) {
        select.value = toolSetupConfig.uid_zalo_system;
    }
}

function closeToolSetupModal() {
    document.getElementById('toolSetupModal').style.display = 'none';
}

async function updateToolSetup() {
    const btn = document.getElementById('updateToolSetupBtn');
    btn.disabled = true;
    btn.textContent = 'Đang cập nhật...';

    try {
        const uid_zalo_system = document.getElementById('setup_uid_zalo_system').value;
        const zalo_system_money = parseFloat(document.getElementById('setup_zalo_system_money').value);
        const zalo_custom_money = parseFloat(document.getElementById('setup_zalo_custom_money').value);
        const check_phone_system_money = parseFloat(document.getElementById('setup_check_phone_system_money').value);
        const check_phone_custom_money = parseFloat(document.getElementById('setup_check_phone_custom_money').value);
        const check_card_money = parseFloat(document.getElementById('setup_check_card_money').value);

        if (isNaN(zalo_system_money) || isNaN(zalo_custom_money) || isNaN(check_phone_system_money) || isNaN(check_phone_custom_money) || isNaN(check_card_money)) {
            showAlert('Vui lòng nhập giá phí hợp lệ', 'error');
            return;
        }

        const data = await apiCall('/tool-setup', 'PUT', {
            uid_zalo_system: uid_zalo_system || null,
            zalo_system_money,
            zalo_custom_money,
            check_phone_system_money,
            check_phone_custom_money,
            check_card_money
        });

        if (data.success) {
            showAlert('Cập nhật cấu hình thành công', 'success');
            closeToolSetupModal();
            loadToolSetup();
        } else {
            showAlert(data.message || 'Lỗi khi cập nhật cấu hình', 'error');
        }
    } catch (error) {
        console.error('Update tool setup error:', error);
        showAlert('Lỗi khi cập nhật cấu hình', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '✅ Cập nhật cấu hình';
    }
}

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ AUTO REQUESTS
// ════════════════════════════════════════════════════════════════

async function loadAutoRequests() {
    try {
        const response = await apiCall('/requests');

        if (response.success) {
            allAutoRequests = response.data;
            renderAutoRequests(allAutoRequests);
            updateRequestStats(allAutoRequests);
        } else {
            showAlert(response.message || 'Lỗi khi tải danh sách requests', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading auto requests:', error);
        showAlert('Lỗi kết nối khi tải danh sách requests', 'error');
    }
}

function renderAutoRequests(requests) {
    const tbody = document.getElementById('requestsTableBody');

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #00ff41; opacity: 0.7;">Chưa có request nào</td></tr>';
        return;
    }

    tbody.innerHTML = requests.map(req => `
        <tr>
            <td>${req.reqID}</td>
            <td>${req.phoneNumber || 'N/A'}</td>
            <td class="text-truncate" title="${req.displayName || 'N/A'}">${req.displayName || 'N/A'}</td>
            <td class="column-detail" title="${req.Detail || 'N/A'}">${req.Detail || 'N/A'}</td>
            <td>${formatDateTime(req.created_at)}</td>
            <td><strong>${formatMoney(req.fee_charged)}</strong></td>
            <td>
                <span class="badge ${req.use_system_account === 1 ? 'badge-info' : 'badge-primary'}">
                    ${req.use_system_account === 1 ? 'Hệ thống' : 'Người dùng'}
                </span>
            </td>
            <td class="text-truncate" title="${req.sender_zalo_uid || 'N/A'}">${req.sender_zalo_uid || 'N/A'}</td>
        </tr>
    `).join('');
}

function updateRequestStats(requests) {
    const totalRequestsEl = document.getElementById('totalRequests');
    if (totalRequestsEl) totalRequestsEl.textContent = requests.length;

    const successCount = requests.filter(r => r.sendResult === 'SUCCESS').length;
    const successRequestsEl = document.getElementById('successRequests');
    if (successRequestsEl) successRequestsEl.textContent = successCount;

    const failedCount = requests.filter(r => r.sendResult === 'FAILED' || r.sendResult === 'ERROR').length;
    const failedRequestsEl = document.getElementById('failedRequests');
    if (failedRequestsEl) failedRequestsEl.textContent = failedCount;

    const totalRevenue = requests.reduce((sum, r) => sum + (parseFloat(r.fee_charged) || 0), 0);
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) totalRevenueEl.textContent = formatMoney(totalRevenue);
}

function filterRequests() {
    const searchTerm = document.getElementById('searchRequestInput').value.toLowerCase();
    const filteredRequests = allAutoRequests.filter(req =>
        (req.phoneNumber && req.phoneNumber.toLowerCase().includes(searchTerm)) ||
        (req.UID && req.UID.toLowerCase().includes(searchTerm)) ||
        (req.displayName && req.displayName.toLowerCase().includes(searchTerm)) ||
        (req.Detail && req.Detail.toLowerCase().includes(searchTerm))
    );
    renderAutoRequests(filteredRequests);
}

// ════════════════════════════════════════════════════════════════
// TIỆN ÍCH HIỂN THỊ
// ════════════════════════════════════════════════════════════════

function showAlert(message, type = 'error') {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
    alert.style.display = 'block';

    setTimeout(() => {
        alert.style.display = 'none';
        alert.classList.remove('show');
    }, 5000);
}

function formatMoney(amount) {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeToolSetupModal();
    }
});

document.getElementById('toolSetupModal').addEventListener('click', (e) => {
    if (e.target.id === 'toolSetupModal') {
        closeToolSetupModal();
    }
});

