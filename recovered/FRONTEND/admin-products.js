// ════════════════════════════════════════════════════════════════
// ADMIN PRODUCTS & LICENSES JAVASCRIPT
// ════════════════════════════════════════════════════════════════

const API_URL = '/api';
let token = null;
let csrfToken = null;
let currentEditingProduct = null;
let currentViewingLicense = null;

// Pagination
let currentPage = 1;
let totalPages = 1;
const pageLimit = 20;

// ════════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════════

async function init() {
    // Kiểm tra đăng nhập và quyền admin
    token = localStorage.getItem('admin_token');
    if (!token) {
        window.location.href = 'admin.html';
        return;
    }

    const admin = JSON.parse(localStorage.getItem('admin_user'));
    if (!admin || admin.userRole !== 1) {
        alert('Bạn không có quyền truy cập trang này!');
        window.location.href = 'admin.html';
        return;
    }

    // Hiển thị tên admin
    document.getElementById('userName').textContent = admin.userName;
    document.getElementById('userAvatar').textContent = admin.userName.charAt(0).toUpperCase();

    // Lấy CSRF token
    await fetchCsrfToken();

    // Load data cho tab hiện tại
    await loadProducts();
    await loadProductsForFilter();
}

// ════════════════════════════════════════════════════════════════
// TAB SWITCHING
// ════════════════════════════════════════════════════════════════

function switchTab(tabName, event) {
    // Update tab buttons
    document.querySelectorAll('.sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Tìm button được click
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: tìm button theo tabName
        const buttons = document.querySelectorAll('.sub-tab');
        buttons.forEach(btn => {
            if ((tabName === 'products' && btn.textContent.includes('Sản phẩm')) ||
                (tabName === 'licenses' && btn.textContent.includes('Bản quyền'))) {
                btn.classList.add('active');
            }
        });
    }

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tabName === 'products') {
        document.getElementById('productsTab').classList.add('active');
        loadProducts();
    } else if (tabName === 'licenses') {
        document.getElementById('licensesTab').classList.add('active');
        loadLicenses();
    }
}

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
// API HELPERS
// ════════════════════════════════════════════════════════════════

async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    // Thêm CSRF token cho non-GET requests
    if (options.method && options.method !== 'GET' && csrfToken) {
        defaultOptions.headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });

    // Xử lý CSRF token không hợp lệ
    if (response.status === 403) {
        const data = await response.json();
        if (data.message && data.message.includes('CSRF')) {
            console.log('⚠️ CSRF token không hợp lệ, đang lấy token mới...');
            await fetchCsrfToken();

            // Thử lại với token mới
            defaultOptions.headers['X-CSRF-Token'] = csrfToken;
            const retryResponse = await fetch(`${API_URL}${endpoint}`, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers,
                    'X-CSRF-Token': csrfToken
                }
            });
            return await retryResponse.json();
        }
    }

    if (response.status === 401) {
        logout();
        return;
    }

    return await response.json();
}

// ════════════════════════════════════════════════════════════════
// PRODUCT MANAGEMENT
// ════════════════════════════════════════════════════════════════

async function loadProducts() {
    try {
        const data = await apiCall('/admin/products');

        if (data.success) {
            displayProducts(data.data);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showAlert('Không thể tải danh sách sản phẩm', 'error');
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');

    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #999;">
                    Chưa có sản phẩm nào
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = products.map(product => `
        <tr>
            <td><strong>#${product.productID}</strong></td>
            <td>
                <img src="${product.productImage || 'https://via.placeholder.com/60x60/667eea/ffffff?text=P'}" 
                     alt="${product.productName}" 
                     class="product-image"
                     onerror="this.src='https://via.placeholder.com/60x60/667eea/ffffff?text=P'">
            </td>
            <td>
                <strong>${product.productName}</strong>
                <br>
                <small style="color: #666;">${truncateText(product.productDesc, 50)}</small>
            </td>
            <td class="price-display">${formatCurrency(product.productOnePrice)}</td>
            <td class="price-display">${formatCurrency(product.productFivePrice)}</td>
            <td class="price-display">${formatCurrency(product.productTenPrice)}</td>
            <td>
                <span class="badge ${product.isActive ? 'badge-success' : 'badge-danger'}">
                    ${product.isActive ? '✅ Hoạt động' : '❌ Vô hiệu'}
                </span>
            </td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="openEditModal(${product.productID})">
                    ✏️ Sửa
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.productID}, '${escapeHtml(product.productName)}')">
                    🗑️ Xóa
                </button>
            </td>
        </tr>
    `).join('');
}

function openCreateModal() {
    currentEditingProduct = null;
    document.getElementById('modalTitle').textContent = 'Thêm sản phẩm mới';
    document.getElementById('productForm').reset();
    document.getElementById('productID').value = '';
    document.getElementById('isActive').checked = true;
    document.getElementById('productModal').classList.add('active');
}

async function openEditModal(productID) {
    try {
        const data = await apiCall(`/admin/products/${productID}`);

        if (data.success) {
            currentEditingProduct = data.data;
            document.getElementById('modalTitle').textContent = 'Chỉnh sửa sản phẩm';

            // Fill form
            document.getElementById('productID').value = data.data.productID;
            document.getElementById('productName').value = data.data.productName;
            document.getElementById('productDesc').value = data.data.productDesc;
            document.getElementById('productOnePrice').value = data.data.productOnePrice || 0;
            document.getElementById('productFivePrice').value = data.data.productFivePrice || 0;
            document.getElementById('productTenPrice').value = data.data.productTenPrice || 0;
            document.getElementById('productImage').value = data.data.productImage || '';
            document.getElementById('isActive').checked = data.data.isActive;

            document.getElementById('productModal').classList.add('active');
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error loading product:', error);
        showAlert('Không thể tải thông tin sản phẩm', 'error');
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    currentEditingProduct = null;
}

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productID = document.getElementById('productID').value;
    const formData = {
        productName: document.getElementById('productName').value.trim(),
        productDesc: document.getElementById('productDesc').value.trim(),
        productOnePrice: parseFloat(document.getElementById('productOnePrice').value) || 0,
        productFivePrice: parseFloat(document.getElementById('productFivePrice').value) || 0,
        productTenPrice: parseFloat(document.getElementById('productTenPrice').value) || 0,
        productImage: document.getElementById('productImage').value.trim(),
        isActive: document.getElementById('isActive').checked
    };

    if (!formData.productName || !formData.productDesc) {
        showAlert('Vui lòng điền đầy đủ tên và mô tả sản phẩm', 'error');
        return;
    }

    if (formData.productOnePrice === 0 && formData.productFivePrice === 0 && formData.productTenPrice === 0) {
        showAlert('Phải có ít nhất một loại giá khác 0', 'error');
        return;
    }

    try {
        let data;

        if (productID) {
            data = await apiCall(`/admin/products/${productID}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            data = await apiCall('/admin/products', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }

        if (data.success) {
            showAlert(data.message, 'success');
            closeProductModal();
            await loadProducts();
            await loadProductsForFilter();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error saving product:', error);
        showAlert('Không thể lưu sản phẩm', 'error');
    }
});

async function deleteProduct(productID, productName) {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}"?\n\nLưu ý: Nếu đã có license được mua, sản phẩm sẽ chỉ bị vô hiệu hóa.`)) {
        return;
    }

    try {
        const data = await apiCall(`/admin/products/${productID}`, {
            method: 'DELETE'
        });

        if (data.success) {
            showAlert(data.message, 'success');
            await loadProducts();
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        showAlert('Không thể xóa sản phẩm', 'error');
    }
}

// ════════════════════════════════════════════════════════════════
// LICENSE MANAGEMENT
// ════════════════════════════════════════════════════════════════

async function loadLicenses(page = 1) {
    try {
        currentPage = page;

        // Get filter values
        const productID = document.getElementById('filterProduct').value;
        const status = document.getElementById('filterstatus').value;
        const userName = document.getElementById('filterUserName').value;

        // Build query params
        const params = new URLSearchParams({
            page: currentPage,
            limit: pageLimit
        });

        if (productID) params.append('productID', productID);
        if (status) params.append('status', status);
        if (userName) params.append('userName', userName);

        const data = await apiCall(`/admin/licenses?${params.toString()}`);

        if (data.success) {
            displayLicenses(data.data.licenses);
            updatePagination(data.data.pagination);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error loading licenses:', error);
        showAlert('Không thể tải danh sách licenses', 'error');
    }
}

function displayLicenses(licenses) {
    const tbody = document.getElementById('licensesTableBody');

    if (!licenses || licenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #999;">
                    Không tìm thấy license nào
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = licenses.map(license => `
        <tr>
            <td>
                <span class="license-key" onclick="copyToClipboard('${license.licenseKey}')" title="Click to copy">
                    ${license.licenseKey.substring(0, 15)}...
                </span>
            </td>
            <td>
                <strong>${license.productName}</strong>
                <br>
                <small style="color: #666;">ID: ${license.productID}</small>
            </td>
            <td>
                ${license.userName ? `<strong>${license.userName}</strong><br><small style="color: #666;">${license.email}</small>` : '<em style="color: #999;">Chưa mua</em>'}
            </td>
            <td class="price-display">${license.pricePaid ? formatCurrency(license.pricePaid) : '-'}</td>
            <td>${license.purchaseTime ? formatDateTime(license.purchaseTime) : '-'}</td>
			<td>
              <span class="license-status ${getLicenseStatusClass(license.status)}">
                   ${getLicenseStatusText(license.status)}
              </span>
            </td>
            <td>
                <button class="btn btn-info btn-sm" onclick="viewLicenseDetails('${license.licenseKey}')">
                    👁️ Chi tiết
                </button>
            </td>
        </tr>
    `).join('');
}


async function viewLicenseDetails(licenseKey) {
    try {
        const data = await apiCall(`/admin/licenses/${licenseKey}`);

        if (data.success) {
            currentViewingLicense = data.data;
            showLicenseModal(data.data);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error loading license details:', error);
        showAlert('Không thể tải thông tin license', 'error');
    }
}

function showLicenseModal(license) {
    const detailsHTML = `
        <div class="info-row">
            <div class="info-label">License Key:</div>
            <div class="info-value">
                <span class="license-key" onclick="copyToClipboard('${license.licenseKey}')">
                    ${license.licenseKey}
                </span>
            </div>
        </div>
        <div class="info-row">
            <div class="info-label">Sản phẩm:</div>
            <div class="info-value"><strong>${license.productName}</strong> (ID: ${license.productID})</div>
        </div>
        <div class="info-row">
            <div class="info-label">Người mua:</div>
            <div class="info-value">${license.userName ? `<strong>${license.userName}</strong> (${license.email})` : '<em style="color: #999;">Chưa có người mua</em>'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Giá mua:</div>
            <div class="info-value price-display">${license.pricePaid ? formatCurrency(license.pricePaid) : '-'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Ngày mua:</div>
            <div class="info-value">${license.purchaseTime ? formatDateTime(license.purchaseTime) : '-'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Số lượt còn lại:</div>
            <div class="info-value">${license.countDown}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Lần cập nhật cuối:</div>
            <div class="info-value">${formatDateTime(license.updatedAt)}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Hiệu lực:</div>
            <span class="license-status ${getLicenseStatusClass(license.status)}">
                ${getLicenseStatusText(license.status)}
            </span>
        </div>
        ${license.status > 0 ? `
        <div class="info-row">
            <div class="info-label">Ngày kích hoạt:</div>
            <div class="info-value">${formatDateTime(license.activeTime)}</div>
        </div>
        ` : ''}
    `;

    document.getElementById('licenseDetails').innerHTML = detailsHTML;
    document.getElementById('licenseModal').classList.add('active');
}

function getLicenseStatusClass(status) {
    if (status === 0) return 'inactive';
    if (status === 1) return 'active';
    if (status === 2) return 'expired';
    return 'inactive';
}

function getLicenseStatusText(status) {
    const map = {
        0: 'Chưa kích hoạt',
        1: 'Hoạt động',
        2: 'Hết hạn'
    };
    return map[status] ?? 'Không xác định';
}

function closeLicenseModal() {
    document.getElementById('licenseModal').classList.remove('active');
    document.getElementById('extendForm').style.display = 'none';
    currentViewingLicense = null;
}

function showExtendForm() {
    document.getElementById('extendForm').style.display = 'block';
}

function hideExtendForm() {
    document.getElementById('extendForm').style.display = 'none';
}

async function confirmExtend() {
    if (!currentViewingLicense) return;

    const count = parseInt(document.getElementById('extendCount').value);

    if (!count || count < 1) {
        showAlert('Vui lòng nhập số lần hợp lệ', 'error');
        return;
    }

    if (!confirm(`Bạn có chắc muốn tăng license này thêm ${count} lần sử dụng?`)) {
        return;
    }

    try {
        const data = await apiCall(`/admin/licenses/${currentViewingLicense.licenseKey}/extend`, {
            method: 'POST',
            body: JSON.stringify({ count: count })
        });

        if (data.success) {
            showAlert(data.message, 'success');
            closeLicenseModal();
            await loadLicenses(currentPage);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error extending count license:', error);
        showAlert('Không thể tăng lượt dùng license', 'error');
    }
}

async function revokeLicense() {
    if (!currentViewingLicense) return;

    const reason = prompt('Lý do vô hiệu hóa license (tùy chọn):');

    if (reason === null) return; // User clicked cancel

    if (!confirm('Bạn có chắc muốn vô hiệu hóa license này?')) {
        return;
    }

    try {
        const data = await apiCall(`/admin/licenses/${currentViewingLicense.licenseKey}/revoke`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason })
        });

        if (data.success) {
            showAlert(data.message, 'success');
            closeLicenseModal();
            await loadLicenses(currentPage);
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        console.error('❌ Error revoking license:', error);
        showAlert('Không thể vô hiệu hóa license', 'error');
    }
}

// ════════════════════════════════════════════════════════════════
// PAGINATION
// ════════════════════════════════════════════════════════════════

function updatePagination(pagination) {
    totalPages = pagination.totalPages;
    document.getElementById('pageInfo').textContent = `Trang ${pagination.page} / ${pagination.totalPages} (Tổng: ${pagination.total})`;

    document.getElementById('prevPageBtn').disabled = pagination.page <= 1;
    document.getElementById('nextPageBtn').disabled = pagination.page >= pagination.totalPages;
}

function changeLicensePage(delta) {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
        loadLicenses(newPage);
    }
}

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - FILTER
// ════════════════════════════════════════════════════════════════

async function loadProductsForFilter() {
    try {
        const data = await apiCall('/admin/products');

        if (data.success) {
            const select = document.getElementById('filterProduct');
            select.innerHTML = '<option value="">Tất cả</option>' +
                data.data.map(p => `<option value="${p.productID}">${p.productName}</option>`).join('');
        }
    } catch (error) {
        console.error('❌ Error loading products for filter:', error);
    }
}

// ════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════

function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.className = `alert alert-${type} active`;
    alert.textContent = message;

    setTimeout(() => {
        alert.classList.remove('active');
    }, 5000);
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return '-';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showAlert('Đã copy: ' + text, 'success');
    } catch (error) {
        console.error('❌ Error copying:', error);
        showAlert('Không thể copy', 'error');
    }
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = 'admin.html';
}

// ════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', init);

// Close modals when clicking outside
document.getElementById('productModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('productModal')) {
        closeProductModal();
    }
});

document.getElementById('licenseModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('licenseModal')) {
        closeLicenseModal();
    }
});
