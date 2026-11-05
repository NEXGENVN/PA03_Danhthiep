// ════════════════════════════════════════════════════════════════
// ADMIN DATALEAK LOGIC
// ════════════════════════════════════════════════════════════════

const API_URL = '/api';
const API_URL2 = `${API_URL}/admin`;
const token = localStorage.getItem('admin_token');

if (!token) {
    window.location.href = '/admin.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};

let csrfToken = null;
let currentHistory = [];

// ════════════════════════════════════════════════════════════════
// CSRF TOKEN MANAGEMENT
// ════════════════════════════════════════════════════════════════

async function fetchCsrfToken() {
    try {
        const response = await fetch(`${API_URL}/auth/csrf-token`, {
            headers: {
                'Authorization': `Bearer ${token}`
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
// INITIALIZATION
// ════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCsrfToken();
    loadToolSetup();
    loadHistory(1);
    updateStatsPlaceholder();
});

// ════════════════════════════════════════════════════════════════
// API CALL HELPER
// ════════════════════════════════════════════════════════════════

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
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

    if (response.status === 403) {
        const data = await response.json();
        if (data.message?.includes('CSRF')) {
            console.log('⚠️ CSRF token không hợp lệ, đang lấy token mới...');
            await fetchCsrfToken();
            if (csrfToken) {
                options.headers['X-CSRF-Token'] = csrfToken;
                const retryResponse = await fetch(`${API_URL2}${endpoint}`, options);
                return retryResponse.json();
            }
        }
    }

    return response.json();
}

// ════════════════════════════════════════════════════════════════
// TOOL SETUP (FEE CONFIG)
// ════════════════════════════════════════════════════════════════

async function loadToolSetup() {
    try {
        const data = await apiCall('/tool-setup');

        if (data.success && data.data) {
            document.getElementById('leakLookupFee').value = data.data.check_data_leak_money || 50000;
        }
    } catch (error) {
        console.error('Load tool setup error:', error);
        showAlert('Không thể tải cấu hình phí', 'error');
    }
}

async function updateFee() {
    const feeValue = document.getElementById('leakLookupFee').value;
    if (!feeValue || feeValue < 0) {
        return showAlert('Vui lòng nhập số tiền hợp lệ', 'error');
    }

    try {
        const data = await apiCall('/tool-setup', 'PUT', {
            check_data_leak_money: parseFloat(feeValue)
        });

        if (data.success) {
            showAlert('Cập nhật phí thành công', 'success');
        } else {
            showAlert(data.message || 'Cập nhật thất bại', 'error');
        }
    } catch (error) {
        console.error('Update fee error:', error);
        showAlert('Lỗi kết nối khi cập nhật phí', 'error');
    }
}

// ════════════════════════════════════════════════════════════════
// HISTORY LOADING
// ════════════════════════════════════════════════════════════════

async function loadHistory(page = 1) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = `<tr><td colspan="6" class="loading"><div class="spinner"></div><p>Đang tải dữ liệu...</p></td></tr>`;

    try {
        const data = await apiCall(`/leak-history?page=${page}&limit=20`);

        if (data.success) {
            currentHistory = data.data;
            renderHistory(data.data);
            renderPagination(data.pagination);
            calculateStats(data.pagination.total, data.data, data.totalRevenue);
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="error">${data.message || 'Lỗi tải lịch sử'}</td></tr>`;
        }
    } catch (error) {
        console.error('Load history error:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="error">Lỗi kết nối server</td></tr>`;
    }
}

function renderHistory(history) {
    const tbody = document.getElementById('historyTableBody');
    if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:50px;">Không có dữ liệu tra cứu</td></tr>`;
        return;
    }

    tbody.innerHTML = history.map((item, index) => {
        const date = new Date(item.createdAt).toLocaleString('vi-VN');
        const badgeClass = item.searchType === 'phone' ? 'badge-phone' : 'badge-email';

        return `
            <tr>
                <td><strong>${item.userID}</strong></td>
                <td><span class="badge ${badgeClass}">${item.searchType.toUpperCase()}</span></td>
                <td><code style="color:#00ffff;">${item.searchValue}</code></td>
                <td><span style="color:#0f0; font-weight:bold;">${item.resultsCount}</span></td>
                <td><span style="color:#ffcc00; font-weight:bold;">${(item.fee_charged || 0).toLocaleString('vi-VN')} ₫</span></td>
                <td><small>${date}</small></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewDetails(${index})">
                        👁️ Xem
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button onclick="loadHistory(${pagination.page - 1})" ${pagination.page === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> Trước
        </button>
        <span class="page-info">Trang ${pagination.page} / ${pagination.totalPages}</span>
        <button onclick="loadHistory(${pagination.page + 1})" ${pagination.page === pagination.totalPages ? 'disabled' : ''}>
            Tiếp <i class="fas fa-chevron-right"></i>
        </button>
    `;
    container.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════

function viewDetails(index) {
    try {
        const item = currentHistory[index];
        if (!item) return;

        let data = item.resultsData;

        // Nếu là string thì parse, nếu là object thì dùng luôn
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("Parse resultsData error:", e);
            }
        }

        document.getElementById('jsonContent').textContent = JSON.stringify(data, null, 4);
        document.getElementById('dataModal').style.display = 'flex';
    } catch (e) {
        console.error("View Details Error:", e);
        showAlert('Dữ liệu không hợp lệ', 'error');
    }
}

function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';

    setTimeout(() => {
        alert.style.display = 'none';
    }, 4000);
}

function calculateStats(total, currentData, totalRevenue) {
    document.getElementById('statTotalSearches').textContent = total.toLocaleString();

    // Dùng doanh thu thực tế từ backend
    document.getElementById('statTotalRevenue').textContent = (totalRevenue || 0).toLocaleString('vi-VN') + ' ₫';

    // Tính trung bình kết quả trên trang này
    if (currentData.length > 0) {
        const sum = currentData.reduce((acc, curr) => acc + (curr.resultsCount || 0), 0);
        const avg = (sum / currentData.length).toFixed(1);
        document.getElementById('statAvgResults').textContent = avg;
    }
}

function updateStatsPlaceholder() {
    document.getElementById('statTotalSearches').textContent = '-';
    document.getElementById('statTotalRevenue').textContent = '- ₫';
    document.getElementById('statAvgResults').textContent = '-';
}

