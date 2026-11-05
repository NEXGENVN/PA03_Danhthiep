/**
 * ════════════════════════════════════════════════════════════════
 * LEAK LOOKUP MODULE (DATA_FIND)
 * ════════════════════════════════════════════════════════════════
 */

let currentLeakPage = 1;
let totalLeakPages = 1;
let _leakLookupData = {
    phone: null,
    email: null,
    facebook: null
};

/**
 * Hiển thị/Ẩn các bước trong tra cứu (1, 2, 3)
 */
function showLeakStep(tab, step) {
    const s1 = document.getElementById(`leak-${tab}-step-1`);
    const s2 = document.getElementById(`leak-${tab}-step-2`);
    const s3 = document.getElementById(`leak-${tab}-step-3`);

    if (s1) s1.style.display = (step === 1) ? 'block' : 'none';
    if (s2) s2.style.display = (step === 2) ? 'block' : 'none';
    if (s3) s3.style.display = (step === 3) ? 'block' : 'none';

    // Cập nhật Step Indicator
    [1, 2, 3].forEach(i => {
        const el = document.getElementById(`leak-${tab}-step-${i}-indicator`);
        if (el) {
            el.classList.toggle('active', step >= i);
            el.classList.toggle('completed', step > i);
        }
    });
}

/**
 * Chuyển tab trong giao diện Tra cứu rò rỉ
 */
function showLeakTab(tabName, btnElement) {
    document.querySelectorAll('.leak-tab').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    const hubLeak = document.getElementById('hub-leak-lookup');
    if (hubLeak) {
        hubLeak.querySelectorAll('.sub-menu-item').forEach(item => {
            item.classList.remove('active');
        });
    }

    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }

    // Active button
    if (btnElement) {
        btnElement.classList.add('active');
    }

    if (tabName === 'leak-phone') {
        resetLeakLookup('phone');
    } else if (tabName === 'leak-email') {
        resetLeakLookup('email');
    } else if (tabName === 'leak-facebook') {
        resetLeakLookup('facebook');
    } else if (tabName === 'leak-history') {
        currentLeakPage = 1;
        loadLeakHistory(currentLeakPage);
    }
}

/**
 * Xử lý sự kiện tra cứu (SĐT hoặc Email)
 */
/**
 * [BƯỚC 1] Lấy phí tra cứu và số dư
 */
async function handlePreCheckLeak(event, tab) {
    if (event) event.preventDefault();
    const inputEl = document.getElementById(`leak-${tab}-input`);
    let value = inputEl ? inputEl.value.trim() : '';

    if (!value) {
        Swal.fire('Lỗi', 'Vui lòng nhập thông tin tra cứu', 'error');
        return;
    }

    // TỰ ĐỘNG CHUYỂN ĐỔI SĐT
    if (tab === 'phone' && /^0\d{9}$/.test(value)) {
        value = '84' + value.substring(1);
        inputEl.value = value;
    }

    // Với tab facebook: cho phép SĐT, UID hoặc URL
    if (tab === 'facebook') {
        const btn = document.getElementById(`leak-${tab}-next-btn`);

        // Phát hiện nếu là URL Facebook (có chứa facebook.com, fb.com hoặc bắt đầu bằng http)
        if (value.includes('facebook.com') || value.includes('fb.com') || value.startsWith('http')) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Đang lấy UID...';

            try {
                const resUid = await apiCall('/facebook/find-uid', {
                    method: 'POST',
                    body: JSON.stringify({ link: value })
                });

                if (resUid.success && resUid.data && resUid.data.id) {
                    value = resUid.data.id;
                    inputEl.value = value; // Cập nhật UID vào ô nhập để người dùng thấy
                    console.log('✅ Resolved UID from link:', value);
                } else {
                    Swal.fire('Lỗi lấy UID', resUid.message || 'Không thể trích xuất UID từ link này. Vui lòng kiểm tra lại quyền riêng tư của link.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Tiếp tục ➔';
                    return;
                }
            } catch (err) {
                console.error('Error finding UID:', err);
                Swal.fire('Lỗi', 'Lỗi hệ thống khi lấy UID từ đường dẫn Facebook', 'error');
                btn.disabled = false;
                btn.innerHTML = 'Tiếp tục ➔';
                return;
            }
        } else {
            // Nếu không phải URL, xử lý như SĐT hoặc UID bình thường
            if (/^84\d{9}$/.test(value)) {
                value = '0' + value.substring(2);
                inputEl.value = value;
            }

            // Nếu không phải toàn số thì báo lỗi
            if (!/^\d+$/.test(value)) {
                Swal.fire('Lỗi nhập liệu', 'Vui lòng nhập <strong>Số điện thoại</strong>, <strong>UID Facebook</strong> (chỉ chữ số) hoặc <strong>Link trang cá nhân</strong> Facebook hợp lệ.', 'error');
                return;
            }
        }
    }

    const btn = document.getElementById(`leak-${tab}-next-btn`);
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang kiểm tra...';

    try {
        const response = await apiCall('/leak-lookup/pre-check', {
            method: 'POST',
            body: JSON.stringify({ type: tab, value: value })
        });

        if (response.success) {
            _leakLookupData[tab] = {
                value: value,
                fee: response.data.fee,
                currentBalance: response.data.currentBalance
            };

            // Hiển thị info ở Bước 2
            const feeInfoArea = document.getElementById(`leak-${tab}-confirm-fee-info`);
            if (feeInfoArea) {
                const fee = response.data.fee || 0;
                const balance = response.data.currentBalance || 0;
                const remaining = balance - fee;

                let label = '📱 Số điện thoại';
                if (tab === 'email') label = '📧 Email';
                else if (tab === 'facebook') label = '👥 Tài khoản FB';

                feeInfoArea.innerHTML = `
                    <div style="background: #fff3cd; color: #000; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #ffc107; text-align: left; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h4 style="margin: 0 0 10px 0; color: #856404; border-bottom: 1px solid rgba(133, 100, 4, 0.2); padding-bottom: 5px; font-weight: 700;">Thông tin chi tiết về yêu cầu</h4>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>${label}:</strong> <span style="color: #0056b3;">${value}</span></p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>💵 Phí tra cứu:</strong> <span style="color: #d32f2f; font-weight: bold;">${fee.toLocaleString('vi-VN')} ₫</span></p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>💰 Số dư hiện tại:</strong> ${balance.toLocaleString('vi-VN')} ₫</p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>📉 Số dư sau khi trừ:</strong> <span style="color: ${remaining < 0 ? '#ff003c' : '#28a745'}; font-weight: bold;">${remaining.toLocaleString('vi-VN')} ₫</span></p>
                        <p style="margin: 10px 0 0 0; font-size: 13px; color: #856404; font-style: italic;">
                            ⚠️ <strong>Lưu ý:</strong> Phí chỉ tính khi hệ thống tìm thấy dữ liệu khớp.
                        </p>
                    </div>
                    ${balance < fee ? '<div style="background: rgba(220, 53, 69, 0.1); color: #dc3545; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 13px; border: 1px solid rgba(220, 53, 69, 0.2);">⚠️ Số dư không đủ để thực hiện tra cứu.</div>' : ''}
                `;
            }

            const confirmBtn = document.getElementById(`leak-${tab}-confirm-btn`);
            if (confirmBtn) confirmBtn.disabled = (response.data.currentBalance < response.data.fee);

            showLeakStep(tab, 2);
        } else {
            Swal.fire('Lỗi', response.message || 'Lỗi hệ thống', 'error');
        }
    } catch (error) {
        console.error('Pre-check error:', error);
        Swal.fire('Lỗi', 'Không thể kết nối đến máy chủ', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Tiếp tục ➔';
    }
}

/**
 * [BƯỚC 2] Xác nhận tra cứu và thanh toán
 */
async function confirmLeakSearch(tab) {
    const data = _leakLookupData[tab];
    if (!data) return;

    const btn = document.getElementById(`leak-${tab}-confirm-btn`);
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang thực hiện & Trừ tiền...';

    try {
        const response = await apiCall('/leak-lookup/confirm', {
            method: 'POST',
            body: JSON.stringify({ type: tab, value: data.value })
        });

        if (response.success) {
            // Cập nhật số dư local nếu có trừ tiền
            if (response.charged) {
                currentUser.totalMoney = response.newBalance;
                localStorage.setItem('user', JSON.stringify(currentUser));
                if (typeof loadProfile === 'function') loadProfile();
            }

            // Render kết quả ở Bước 3
            renderLeakResults(response.results, `leak-${tab}-result-container`);

            showLeakStep(tab, 3);
        } else {
            Swal.fire('Lỗi', response.message || 'Lỗi khi thanh toán', 'error');
        }
    } catch (error) {
        console.error('Confirm search error:', error);
        Swal.fire('Lỗi', 'Lỗi hệ thống khi tra cứu', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✅ Xác nhận & Tra cứu';
    }
}

/**
 * Reset tab về bước 1
 */
function resetLeakLookup(tab) {
    const input = document.getElementById(`leak-${tab}-input`);
    if (input) input.value = '';
    _leakLookupData[tab] = null;
    showLeakStep(tab, 1);
}

/**
 * Hiển thị kết quả tra cứu lên giao diện (không dùng JSON thô)
 */
function renderLeakResults(results, targetContainerId = 'leak-result-container', targetTitleId = 'leak-result-title') {
    const container = document.getElementById(targetContainerId);
    const titleStatus = document.getElementById(targetTitleId);
    if (!container) return;

    if (!results || results.length === 0) {
        if (titleStatus) titleStatus.innerHTML = '📍 Kết quả: Không tìm thấy dữ liệu';
        container.innerHTML = '<div style="padding: 30px; text-align: center; color: #ff003c; font-weight: 500;">❌ Không tìm thấy thông tin rò rỉ nào khớp với yêu cầu.</div>';
        return;
    }

    if (titleStatus) titleStatus.innerHTML = `📍 Kết quả: Tìm thấy ${results.length} bản ghi`;

    container.innerHTML = results.map((item, index) => {
        const { source, ...details } = item;
        const hasDetails = Object.keys(details).length > 0;

        let detailsHtml = '';
        if (hasDetails) {
            detailsHtml = '<div class="leak-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">';
            for (const [key, val] of Object.entries(details)) {
                if (val === null || val === undefined || val === '') continue;
                detailsHtml += `
                    <div class="leak-detail-item">
                        <span style="color: #888; font-size: 11px; text-transform: uppercase; display: block;">${key}</span>
                        <span style="color: #fff; font-size: 14px; word-break: break-all;">${val}</span>
                    </div>
                `;
            }
            detailsHtml += '</div>';
        } else {
            detailsHtml = `<div style="color: #aaaaaa; font-style: italic; font-size: 13px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; text-align: center;"> Phát hiện dữ liệu của bạn đã bị rò rỉ từ nguồn này. Hãy cẩn trọng!</div>`;
        }

        return `
            <div class="result-item" style="margin-bottom: 20px; padding: 18px; background: rgba(0, 210, 255, 0.03); border: 1px solid rgba(0, 210, 255, 0.15); border-radius: 12px; transition: all 0.3s hover;">
                <div style="font-weight: 700; color: #00d2ff; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <span>#${index + 1} Nguồn: ${source}</span>
                    <span style="font-size: 11px; font-weight: normal; background: rgba(0,210,255,0.1); padding: 2px 8px; border-radius: 4px;">DATA_MATCH</span>
                </div>
                ${detailsHtml}
            </div>
        `;
    }).join('');
}

/**
 * Tải lịch sử tra cứu với phân trang
 */
async function loadLeakHistory(page = 1) {
    const tbody = document.getElementById('leak-history-table-body');
    if (!tbody) return;

    currentLeakPage = page;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">⏳ Đang tải lịch sử...</td></tr>';

    try {
        const response = await apiCall(`/leak-lookup/history?page=${page}&limit=30`);
        console.log('📊 Phản hồi Lịch sử:', response);

        if (response && response.success) {
            const { data, pagination } = response;

            // Xử lý an toàn cho phân trang
            if (pagination && pagination.totalPages) {
                totalLeakPages = pagination.totalPages;
            } else {
                totalLeakPages = 1;
                console.warn('⚠️ Thiếu thông tin phân trang trong phản hồi API');
            }

            if (!data || data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #888;">Chưa có lịch sử tra cứu nào.</td></tr>';
                renderLeakPagination();
                return;
            }

            tbody.innerHTML = data.map(item => {
                const date = new Date(item.createdAt).toLocaleString('vi-VN');
                let typeText = '📱 Số điện thoại';
                if (item.searchType === 'email') typeText = '📧 Email';
                else if (item.searchType === 'facebook') typeText = '👥 Facebook';

                return `
                    <tr>
                        <td>${date}</td>
                        <td>${typeText}</td>
                        <td><span style="color: #00d2ff; font-weight: bold; font-family: monospace;">${item.searchValue}</span></td>
                        <td><span class="badge badge-success">${item.resultsCount} kết quả</span></td>
                        <td><span style="color: #ff9800; font-weight: bold;">${(item.fee_charged || 0).toLocaleString('vi-VN')} ₫</span></td>
                        <td>
                            <button class="btn btn-sm" onclick="viewLeakResult(${item.id})">👁️ Xem lại</button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Lưu dữ liệu vào biến tạm để phục vụ "Xem lại"
            window._leakHistoryData = data;

            renderLeakPagination();
        }
    } catch (error) {
        console.error('Load Leak History Error:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ff003c;">❌ Lỗi khi tải lịch sử.</td></tr>';
    }
}

/**
 * Hiển thị giao diện phân trang cho lịch sử
 */
function renderLeakPagination() {
    const container = document.getElementById('leak-history-pagination');
    if (!container) return;

    if (totalLeakPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px;">
            <button class="btn btn-sm btn-secondary" onclick="loadLeakHistory(${currentLeakPage - 1})" ${currentLeakPage === 1 ? 'disabled' : ''}>◀ Trước</button>
            <span style="font-weight: 500; font-size: 14px;">Trang ${currentLeakPage} / ${totalLeakPages}</span>
            <button class="btn btn-sm btn-secondary" onclick="loadLeakHistory(${currentLeakPage + 1})" ${currentLeakPage === totalLeakPages ? 'disabled' : ''}>Sau ▶</button>
        </div>
    `;
    container.innerHTML = html;
}

/**
 * Hiển thị kết quả tra cứu trong popup (modal)
 */
function viewLeakResult(historyId) {
    if (!window._leakHistoryData) return;
    const historyItem = window._leakHistoryData.find(h => h.id === historyId);
    if (!historyItem) {
        // Có thể ID này thuộc trang khác, cần handle nếu phức tạp hơn
        return;
    }

    const results = typeof historyItem.resultsData === 'string' ? JSON.parse(historyItem.resultsData) : historyItem.resultsData;

    // Đổ kết quả vào modal
    renderLeakResults(results, 'leak-modal-container', 'leak-modal-title');

    // Hiển thị modal
    const modal = document.getElementById('leak-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Ngăn cuộn nền
    }
}

/**
 * Đóng modal kết quả
 */
function closeLeakModal() {
    const modal = document.getElementById('leak-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ════════════════════════════════════════════════════════════════
// EXPOSE TO WINDOW
// ════════════════════════════════════════════════════════════════
window.showLeakTab = showLeakTab;
window.handlePreCheckLeak = handlePreCheckLeak;
window.confirmLeakSearch = confirmLeakSearch;
window.resetLeakLookup = resetLeakLookup;
window.showLeakStep = showLeakStep;
window.loadLeakHistory = loadLeakHistory;
window.viewLeakResult = viewLeakResult;
window.closeLeakModal = closeLeakModal;

// ════════════════════════════════════════════════════════════════
// ADMIN ROLE CHECK FOR CARD VISIBILITY
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const checkRoleInterval = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser !== null) {
            clearInterval(checkRoleInterval);
            if (currentUser.userRole === 1) {
                const leakCard = document.getElementById('hub-leak-card');
                if (leakCard) leakCard.style.display = 'block';
            }
        }
    }, 100);
});

