// ════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD JAVASCRIPT
// ĐÃ CẬP NHẬT: Thêm CSRF Token Management
// ════════════════════════════════════════════════════════════════

const API_URL = '/api';
const API_URL2 = `${API_URL}/admin`;

let allUsers = [];
let allIPBlocks = []; // Add IP blocks
let currentUser = null;
let adminToken = null;
let csrfToken = null; // ✅ CSRF Token

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
    loadStats();
    loadUsers();
    loadIPBlocks();
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
        }
    };

    // ✅ Thêm CSRF token cho POST/PUT/DELETE
    if (method !== 'GET' && csrfToken) {
        options.headers['X-CSRF-Token'] = csrfToken;
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL2}${endpoint}`, options);

    // ✅ Xử lý rate limit

    if (response.status === 401 || response.status === 403) {
        const data = await response.json();

        // ✅ Nếu lỗi CSRF, lấy token mới
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
// LOAD DỮ LIỆU
// ════════════════════════════════════════════════════════════════

async function loadStats() {
    try {
        const data = await apiCall('/stats');

        if (data.success) {
            document.getElementById('totalUsers').textContent = data.data.totalUsers;
            document.getElementById('activeUsers').textContent = data.data.activeUsers;
            document.getElementById('totalAdmins').textContent = data.data.totalAdmins;
            document.getElementById('totalAdmins').textContent = data.data.totalAdmins;
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

async function loadUsers() {
    try {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="loading"><div class="spinner"></div><p>Đang tải dữ liệu...</p></td></tr>';

        const data = await apiCall('/users');

        if (data.success) {
            allUsers = data.data;
            displayUsers(allUsers);
        } else {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-state"><div class="empty-state-icon">❌</div><p>${data.message}</p></td></tr>`;
        }
    } catch (error) {
        console.error('Load users error:', error);
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><div class="empty-state-icon">❌</div><p>Lỗi khi tải dữ liệu</p></td></tr>';
    }
}

// ════════════════════════════════════════════════════════════════
// HIỂN THỊ DỮ LIỆU
// ════════════════════════════════════════════════════════════════

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><div class="empty-state-icon">📭</div><p>Không có người dùng nào</p></td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.userID}</strong></td>
            <td>${escapeHtml(user.userName)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td class="money-display">${formatMoney(user.totalMoney)}</td>
            <td>
                <span class="badge ${user.userRole === 1 ? 'badge-admin' : (user.userRole === 3 ? 'badge-vip' : 'badge-user')}">
                    ${user.userRole === 1 ? '🔑 Admin' : (user.userRole === 3 ? '🌟 VIP' : '👤 User')}
                </span>
            </td>
            <td>
                <span class="badge ${user.isActive ? 'badge-active' : 'badge-inactive'}">
                    ${user.isActive ? '✅ Hoạt động' : '❌ Khóa'}
                </span>
            </td>
            <td>${formatDateTime(user.lastLogin)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="openEditModal(${user.userID})" title="Chỉnh sửa">
                        ✏️
                    </button>
                    ${user.userID !== currentUser.userID ? `
                        <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.userID})" title="Xóa">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// ════════════════════════════════════════════════════════════════
// TÌM KIẾM
// ════════════════════════════════════════════════════════════════

function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filtered = allUsers.filter(user => {
        return user.userName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.userID.toString().includes(searchTerm);
    });

    displayUsers(filtered);
}

// ════════════════════════════════════════════════════════════════
// MODAL EDIT USER
// ════════════════════════════════════════════════════════════════

function openEditModal(userID) {
    const user = allUsers.find(u => u.userID === userID);
    if (!user) return;

    document.getElementById('editUserID').value = user.userID;
    document.getElementById('editUserName').value = user.userName;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPassword').value = '';
    document.getElementById('editTotalMoney').value = user.totalMoney;
    document.getElementById('editUserRole').value = user.userRole;
    document.getElementById('editIsActive').value = user.isActive ? '1' : '0';

    document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    document.getElementById('editForm').reset();
}

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userID = document.getElementById('editUserID').value;
    const formData = {
        userName: document.getElementById('editUserName').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        password: document.getElementById('editPassword').value.trim(),
        totalMoney: parseFloat(document.getElementById('editTotalMoney').value),
        userRole: parseInt(document.getElementById('editUserRole').value),
        isActive: parseInt(document.getElementById('editIsActive').value)
    };

    try {
        const data = await apiCall(`/users/${userID}`, 'PUT', formData);

        if (data.success) {
            showAlert('Cập nhật thông tin thành công!', 'success');
            closeEditModal();
            loadUsers();
            loadStats();
        } else {
            showAlert(data.message || 'Cập nhật thất bại', 'error');
        }
    } catch (error) {
        console.error('Update user error:', error);
        showAlert('Lỗi khi cập nhật', 'error');
    }
});

// ════════════════════════════════════════════════════════════════
// MODAL CREATE USER
// ════════════════════════════════════════════════════════════════

function openCreateModal() {
    document.getElementById('createModal').classList.add('show');
}

function closeCreateModal() {
    document.getElementById('createModal').classList.remove('show');
    document.getElementById('createForm').reset();
}

document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        userName: document.getElementById('createUserName').value.trim(),
        email: document.getElementById('createEmail').value.trim(),
        password: document.getElementById('createPassword').value.trim(),
        totalMoney: parseFloat(document.getElementById('createTotalMoney').value) || 0,
        userRole: parseInt(document.getElementById('createUserRole').value),
        isActive: parseInt(document.getElementById('createIsActive').value)
    };

    try {
        const data = await apiCall('/users', 'POST', formData);

        if (data.success) {
            showAlert('Tạo user mới thành công!', 'success');
            closeCreateModal();
            loadUsers();
            loadStats();
        } else {
            showAlert(data.message || 'Tạo user thất bại', 'error');
        }
    } catch (error) {
        console.error('Create user error:', error);
        showAlert('Lỗi khi tạo user', 'error');
    }
});

// ════════════════════════════════════════════════════════════════
// XÓA USER
// ════════════════════════════════════════════════════════════════

async function deleteUser(userID) {
    const user = allUsers.find(u => u.userID === userID);
    if (!user) return;

    const confirmed = confirm(
        `⚠️ BẠN CÓ CHẮC MUỐN XÓA USER?\n\n` +
        `Tên: ${user.userName}\n` +
        `Email: ${user.email}\n\n` +
        `Hành động này KHÔNG THỂ HOÀN TÁC!`
    );

    if (!confirmed) return;

    try {
        const data = await apiCall(`/users/${userID}`, 'DELETE');

        if (data.success) {
            showAlert('Xóa user thành công!', 'success');
            loadUsers();
            loadStats();
        } else {
            showAlert(data.message || 'Xóa user thất bại', 'error');
        }
    } catch (error) {
        console.error('Delete user error:', error);
        showAlert('Lỗi khi xóa user', 'error');
    }
}

// ════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════

function showAlert(message, type = 'error') {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;

    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

function formatMoney(amount) {
    if (!amount) return '0 đ';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
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
// ĐÓNG MODAL KHI CLICK BÊN NGOÀI
// ════════════════════════════════════════════════════════════════

document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target.id === 'editModal') {
        closeEditModal();
    }
});

document.getElementById('createModal').addEventListener('click', (e) => {
    if (e.target.id === 'createModal') {
        closeCreateModal();
    }
});

// ════════════════════════════════════════════════════════════════
// ESC KEY TO CLOSE MODALS
// ════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModal();
        closeCreateModal();
        closeBlockIPModal();
    }
});

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ IP BLOCKS
// ════════════════════════════════════════════════════════════════

async function loadIPBlocks() {
    try {
        const response = await apiCall('/ip-blocks');

        if (response.success) {
            allIPBlocks = response.data;
            renderIPBlocks(allIPBlocks);
            updateIPStats(allIPBlocks);
        } else {
            showAlert(response.message || 'Lỗi khi tải danh sách IP blocks', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading IP blocks:', error);
        showAlert('Lỗi kết nối khi tải danh sách IP blocks', 'error');
    }
}

function renderIPBlocks(blocks) {
    const tbody = document.getElementById('ipBlocksTableBody');

    if (blocks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #00ff41; opacity: 0.7;">Không có IP nào đang bị chặn</td></tr>';
        return;
    }

    tbody.innerHTML = blocks.map(block => `
        <tr>
            <td>${block.id}</td>
            <td><strong>${block.ip_address}</strong></td>
            <td>
                <span class="badge badge-${getBlockTypeBadge(block.block_type)}">
                    ${formatBlockType(block.block_type)}
                </span>
            </td>
            <td class="text-truncate" title="${block.reason || 'N/A'}">${block.reason || 'N/A'}</td>
            <td>${block.failed_count}</td>
            <td>${formatDateTime(block.created_at)}</td>
            <td>${formatDateTime(block.expires_at)}</td>
            <td>
                <button class="btn btn-success btn-sm" onclick="unblockIP('${block.ip_address}')">
                    ✅ Gỡ chặn
                </button>
            </td>
        </tr>
    `).join('');
}

function updateIPStats(blocks) {
    document.getElementById('totalBlockedIPs').textContent = blocks.length;
    document.getElementById('loginBlockedIPs').textContent =
        blocks.filter(b => b.block_type === 'login' || b.block_type === 'both').length;
    document.getElementById('apiBlockedIPs').textContent =
        blocks.filter(b => b.block_type === 'api' || b.block_type === 'both').length;
}

function getBlockTypeBadge(type) {
    const badges = {
        'both': 'danger',
        'login': 'warning',
        'api': 'info'
    };
    return badges[type] || 'primary';
}

function formatBlockType(type) {
    const types = {
        'both': 'Login & API',
        'login': 'Login',
        'api': 'API'
    };
    return types[type] || type;
}

function filterIPs() {
    const searchTerm = document.getElementById('searchIPInput').value.toLowerCase();
    const filteredBlocks = allIPBlocks.filter(block =>
        block.ip_address.toLowerCase().includes(searchTerm) ||
        (block.reason && block.reason.toLowerCase().includes(searchTerm))
    );
    renderIPBlocks(filteredBlocks);
}

// ════════════════════════════════════════════════════════════════
// CHẶN IP THỦ CÔNG
// ════════════════════════════════════════════════════════════════

function openBlockIPModal() {
    document.getElementById('blockIPModal').style.display = 'flex';
    document.getElementById('blockIPForm').reset();
}

function closeBlockIPModal() {
    document.getElementById('blockIPModal').style.display = 'none';
}

// Đóng modal bắt sự kiện click bên ngoài
document.getElementById('blockIPModal').addEventListener('click', (e) => {
    if (e.target.id === 'blockIPModal') {
        closeBlockIPModal();
    }
});

document.getElementById('blockIPForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ipAddress = document.getElementById('blockIPAddress').value.trim();
    const blockType = document.getElementById('blockType').value;
    const reason = document.getElementById('blockReason').value.trim();
    const blockMinutes = parseInt(document.getElementById('blockMinutes').value);

    if (!ipAddress) {
        showAlert('Vui lòng nhập địa chỉ IP', 'error');
        return;
    }

    try {
        const payload = {
            ipAddress,
            blockType,
            reason: reason || 'Chặn thủ công bởi admin',
            blockMinutes
        };

        const response = await apiCall('/ip-blocks', 'POST', payload);

        if (response.success) {
            showAlert(`✅ Đã chặn IP ${ipAddress} thành công`, 'success');
            closeBlockIPModal();
            await loadIPBlocks();
        } else {
            showAlert(response.message || 'Lỗi khi chặn IP', 'error');
        }
    } catch (error) {
        console.error('❌ Error blocking IP:', error);
        showAlert('Lỗi kết nối khi chặn IP', 'error');
    }
});

// ════════════════════════════════════════════════════════════════
// GỠ CHẶN IP
// ════════════════════════════════════════════════════════════════

async function unblockIP(ipAddress) {
    if (!confirm(`Bạn có chắc muốn gỡ chặn IP: ${ipAddress}?`)) {
        return;
    }

    try {
        const response = await apiCall(`/ip-blocks/${encodeURIComponent(ipAddress)}`, 'DELETE');

        if (response.success) {
            showAlert(`✅ Đã gỡ chặn IP ${ipAddress}`, 'success');
            await loadIPBlocks();
        } else {
            showAlert(response.message || 'Lỗi khi gỡ chặn IP', 'error');
        }
    } catch (error) {
        console.error('❌ Error unblocking IP:', error);
        showAlert('Lỗi kết nối khi gỡ chặn IP', 'error');
    }
}
