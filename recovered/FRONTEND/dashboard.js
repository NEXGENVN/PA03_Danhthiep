// ════════════════════════════════════════════════════════════════
// DASHBOARD JAVASCRIPT
// ĐÃ CẬP NHẬT: Thêm CSRF Token Management
// ════════════════════════════════════════════════════════════════

const API_URL = "/api";
let currentUser = null;
let token = null;
let csrfToken = null; // ✅ CSRF Token
let currentCheckPhoneData = null; // Lưu kết quả pre-check SĐT
let currentCheckCardData = null; // Lưu kết quả pre-check Card

// ════════════════════════════════════════════════════════════════
// CSRF TOKEN MANAGEMENT
// ════════════════════════════════════════════════════════════════

async function fetchCsrfToken() {
  try {
    const response = await fetch(`${API_URL}/auth/csrf-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      csrfToken = data.token;
      console.log("✅ Đã lấy CSRF token");
    }
  } catch (error) {
    console.error("❌ Lỗi lấy CSRF token:", error);
  }
}

// ════════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════════

async function init() {
  // Kiểm tra đăng nhập
  token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "index.html";
    return;
  }

  currentUser = JSON.parse(localStorage.getItem("user"));
  document.getElementById("user-name").textContent = currentUser.userName;

  // ✅ LẤY CSRF TOKEN NGAY SAU KHI ĐĂNG NHẬP
  await fetchCsrfToken();

  // ✅ CẬP NHẬT THÔNG TIN USER TỪ SERVER
  await refreshCurrentUser();

  // ✅ Di chuyển nội dung Zalo vào các tab trong hub-zalo
  moveZaloContentToTabs();

  // Phân quyền hiển thị VIP / Admin
  if (currentUser.userRole !== 1 && currentUser.userRole !== 3) {
    // Ẩn các nút tab
    document
      .querySelectorAll(
        "button[onclick=\"showZaloTab('send-image', this)\"], button[onclick=\"showZaloTab('send-image-by-card', this)\"]",
      )
      .forEach((el) => (el.style.display = "none"));

    // Ẩn nội dung tab
    document.getElementById("zalo-tab-send-image").style.display = "none";
    document.getElementById("zalo-tab-send-image-by-card").style.display =
      "none";

    // Active default tab khác
    const accountTabBtn = document.querySelector(
      "button[onclick=\"showZaloTab('zalo-accounts', this)\"]",
    );
    if (accountTabBtn) accountTabBtn.classList.add("active");
    document.getElementById("zalo-tab-zalo-accounts").style.display = "block";
    document.getElementById("zalo-tab-zalo-accounts").classList.add("active");

    // Xóa class active khỏi các nút vừa ẩn
    document
      .querySelectorAll("button[onclick=\"showZaloTab('send-image', this)\"]")
      .forEach((el) => el.classList.remove("active"));
  }

  // Hiển thị trang chủ dashboard
  showPage("dashboard-home");

  // ✅ KHỞI TẠO FLATPICKR CHO HẸN GIỜ
  initZaloTimerPickers();
}

/**
 * Khởi tạo Flatpickr cho các ô nhập thời gian hẹn giờ
 */
function initZaloTimerPickers() {
  const config = {
    enableTime: true,
    dateFormat: "H:i d/m/Y",
    time_24hr: true,
    minDate: "today",
    locale: "vn",
    disableMobile: "true",
  };

  if (document.getElementById("send-image-run-time")) {
    flatpickr("#send-image-run-time", config);
  }
  if (document.getElementById("send-card-run-time")) {
    flatpickr("#send-card-run-time", config);
  }
}

/**
 * Toggle hiển thị ô nhập thời gian khi tích vào checkbox hẹn giờ
 */
function toggleTimerInput(type) {
  const isChecked = document.getElementById(`${type}-is-timer`).checked;
  const timerGroup = document.getElementById(`${type}-timer-group`);
  if (timerGroup) {
    timerGroup.style.display = isChecked ? "block" : "none";

    // Nếu tích vào thì tự động gợi ý thời gian + 10 phút
    if (isChecked) {
      const input = document.getElementById(`${type}-run-time`);
      if (!input.value) {
        const futureDate = new Date(Date.now() + 10 * 60000);
        const hours = String(futureDate.getHours()).padStart(2, "0");
        const minutes = String(futureDate.getMinutes()).padStart(2, "0");
        const day = String(futureDate.getDate()).padStart(2, "0");
        const month = String(futureDate.getMonth() + 1).padStart(2, "0");
        const year = futureDate.getFullYear();
        input.value = `${hours}:${minutes} ${day}/${month}/${year}`;
      }
    }
  }
}

/**
 * Kiểm tra thời gian hẹn giờ (phải sau hiện tại ít nhất 5 phút)
 * @returns {string|null} ISO date string nếu hợp lệ, null nếu không
 */
function validateAndGetTimer(type) {
  const isTimer = document.getElementById(`${type}-is-timer`).checked;
  if (!isTimer) return null;

  const timeStr = document.getElementById(`${type}-run-time`).value;
  if (!timeStr) {
    alert("Vui lòng chọn thời gian hẹn giờ!");
    return false;
  }

  // Parse "H:i d/m/Y"
  const [time, date] = timeStr.split(" ");
  const [hours, minutes] = time.split(":");
  const [day, month, year] = date.split("/");

  const selectedDate = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  const diffMinutes = (selectedDate - now) / 60000;

  if (diffMinutes < 4.9) {
    // Cho phép sai số nhỏ
    alert("Thời gian hẹn giờ phải sau thời điểm hiện tại ít nhất 5 phút!");
    return false;
  }

  return selectedDate.toISOString();
}

// ════════════════════════════════════════════════════════════════
// MOVE ZALO CONTENT INTO TABS
// ════════════════════════════════════════════════════════════════

function moveZaloContentToTabs() {
  // Di chuyển nội dung Zalo
  const mappings = [
    { from: "send-image", to: "zalo-tab-send-image" },
    { from: "send-image-by-card", to: "zalo-tab-send-image-by-card" },
    { from: "zalo-accounts", to: "zalo-tab-zalo-accounts" },
    { from: "history", to: "zalo-tab-history" },
    { from: "licenses", to: "zalo-tab-licenses" },
  ];

  mappings.forEach(({ from, to }) => {
    const source = document.getElementById(from);
    const target = document.getElementById(to);
    if (source && target) {
      target.innerHTML = source.innerHTML;
      source.innerHTML = "";
    }
  });

  // Di chuyển nội dung Công cụ khác
  const checkIpSection = document.getElementById("check-ip");
  const tabCheckIp = document.getElementById("other-tab-check-ip");
  if (checkIpSection && tabCheckIp) {
    tabCheckIp.innerHTML = checkIpSection.innerHTML;
    checkIpSection.innerHTML = "";
  }
}

// ════════════════════════════════════════════════════════════════
// ZALO TAB SWITCHING
// ════════════════════════════════════════════════════════════════

function showZaloTab(tabName, btnElement) {
  // Ẩn tất cả tab trong hub-zalo
  document.querySelectorAll(".zalo-tab").forEach((tab) => {
    tab.style.display = "none";
    tab.classList.remove("active");
  });

  // Bỏ active tất cả sub-menu items trong hub-zalo
  const hubZalo = document.getElementById("hub-zalo");
  if (hubZalo) {
    hubZalo.querySelectorAll(".sub-menu-item").forEach((item) => {
      item.classList.remove("active");
    });
  }

  // Hiện tab được chọn
  const targetTab = document.getElementById("zalo-tab-" + tabName);
  if (targetTab) {
    targetTab.style.display = "block";
    targetTab.classList.add("active");
  }

  // Active button
  if (btnElement) {
    btnElement.classList.add("active");
  }

  // Load data tương ứng
  if (tabName === "send-image") {
    checkAllAccountsStatusSilent();
    loadSendZaloAccounts();
    showSendStep(1);
  } else if (tabName === "send-image-by-card") {
    checkAllAccountsStatusCardSilent();
    loadSendCardZaloAccounts();
    showSendCardStep(1);
  } else if (tabName === "zalo-accounts") {
    loadZaloAccounts();
  } else if (tabName === "history") {
    loadStats();
    loadHistory();
  } else if (tabName === "timer-history") {
    loadZaloTimerHistory();
  } else if (tabName === "check-status-phone") {
    checkAllAccountsStatusSilent();
    loadCheckStatusZaloAccounts(
      "check-status-phone-account",
      "check-status-phone-alert",
      true,
    );
    showCheckPhoneStep(1);
  } else if (tabName === "check-status-card") {
    checkAllAccountsStatusCardSilent();
    loadCheckStatusZaloAccounts(
      "check-status-card-account",
      "check-status-card-alert",
      false,
    );
    showCheckCardStep(1);
  } else if (tabName === "licenses") {
    refreshCurrentUser().then(() => {
      loadProducts();
      loadUserLicenses();
    });
  }
}

// ════════════════════════════════════════════════════════════════
// OTHER TAB SWITCHING (Công cụ khác)
// ════════════════════════════════════════════════════════════════

function showOtherTab(tabName, btnElement) {
  // Ẩn tất cả tab
  document.querySelectorAll(".other-tab").forEach((tab) => {
    tab.style.display = "none";
    tab.classList.remove("active");
  });

  // Bỏ active tất cả sub-menu items trong hub-other
  const hubOther = document.getElementById("hub-other");
  if (hubOther) {
    hubOther.querySelectorAll(".sub-menu-item").forEach((item) => {
      item.classList.remove("active");
    });
  }

  // Hiện tab được chọn
  const targetTab = document.getElementById("other-tab-" + tabName);
  if (targetTab) {
    targetTab.style.display = "block";
    targetTab.classList.add("active");
  }

  // Active button
  if (btnElement) {
    btnElement.classList.add("active");
  }

  // Load data tương ứng
  if (tabName === "check-ip") {
    // Check IP page tự xử lý khi user nhấn nút
  }
}

// ════════════════════════════════════════════════════════════════
// ✅ HÀM MỚI: CẬP NHẬT THÔNG TIN USER TỪ SERVER
// ════════════════════════════════════════════════════════════════

async function refreshCurrentUser() {
  try {
    const data = await apiCall("/auth/profile");

    if (data.success && data.data) {
      // Cập nhật currentUser với dữ liệu mới nhất từ server
      currentUser = {
        ...currentUser,
        totalMoney: parseFloat(data.data.totalMoney) || 0,
        email: data.data.email,
        userRole: data.data.userRole,
        lastLogin: data.data.lastLogin,
      };

      // Lưu lại vào localStorage
      localStorage.setItem("user", JSON.stringify(currentUser));

      console.log("✅ Đã cập nhật thông tin user:", currentUser);
    }
  } catch (error) {
    console.error("❌ Lỗi cập nhật thông tin user:", error);
  }
}

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS - ALERT & UI
// ════════════════════════════════════════════════════════════════

/**
 * Hiển thị thông báo
 */
function showAlert(elementId, message, type = "info") {
  const alertElement = document.getElementById(elementId);
  if (!alertElement) return;

  // Nếu message rỗng thì ẩn element luôn (dùng để clear alert)
  if (!message) {
    alertElement.style.display = "none";
    alertElement.textContent = "";
    return;
  }

  alertElement.className = `alert ${type}`;
  alertElement.textContent = message;
  alertElement.style.display = "block";

  // Tự động ẩn sau 5 giây (trừ success message)
  if (type !== "success") {
    setTimeout(() => {
      alertElement.style.display = "none";
    }, 5000);
  }
}

/**
 * Cuộn mượt đến phần "Bản quyền đã mua" và highlight
 */
function highlightMyLicenses() {
  const myLicensesCard = document
    .querySelector("#my-licenses-container")
    .closest(".card");

  if (myLicensesCard) {
    // Cuộn mượt đến phần bản quyền đã mua
    myLicensesCard.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    // Thêm hiệu ứng highlight
    myLicensesCard.style.transition = "all 0.3s ease";
    myLicensesCard.style.boxShadow = "0 0 30px rgba(102, 126, 234, 0.6)";
    myLicensesCard.style.transform = "scale(1.02)";

    // Xóa hiệu ứng sau 2 giây
    setTimeout(() => {
      myLicensesCard.style.boxShadow = "";
      myLicensesCard.style.transform = "";
    }, 2000);
  }
}

/**
 * Hiển thị modal thành công với thông tin license key
 */
function showSuccessModal(licenseKey, productName, price) {
  // Tạo modal HTML
  const modalHTML = `
        <div id="success-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        ">
            <div style="
                background: white;
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center;">
                    <div style="
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                        animation: scaleIn 0.5s ease;
                    ">
                        <span style="font-size: 40px;">✅</span>
                    </div>
                    
                    <h2 style="
                        color: #2d3748;
                        font-size: 28px;
                        margin-bottom: 10px;
                        font-weight: 700;
                    ">Mua thành công!</h2>
                    
                    <p style="
                        color: #718096;
                        margin-bottom: 30px;
                        font-size: 16px;
                    ">Cảm ơn bạn đã mua bản quyền</p>
                    
                    <div style="
                        background: #f7fafc;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                        border-left: 4px solid #667eea;
                    ">
                        <div style="margin-bottom: 15px;">
                            <label style="
                                display: block;
                                color: #4a5568;
                                font-size: 13px;
                                font-weight: 600;
                                margin-bottom: 5px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">Sản phẩm</label>
                            <p style="
                                color: #2d3748;
                                font-size: 16px;
                                font-weight: 600;
                            ">${productName}</p>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="
                                display: block;
                                color: #4a5568;
                                font-size: 13px;
                                font-weight: 600;
                                margin-bottom: 5px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">Key bản quyền</label>
                            <div style="
                                background: white;
                                padding: 12px;
                                border-radius: 8px;
                                border: 2px dashed #cbd5e0;
                                font-family: 'Be Vietnam Pro', sans-serif;
                                font-size: 16px;
                                font-weight: 700;
                                color: #667eea;
                                letter-spacing: 1px;
                                cursor: pointer;
                                transition: all 0.2s;
                            " onclick="copyLicenseKeyFromModal('${licenseKey}')" 
                               onmouseover="this.style.background='#edf2f7'; this.style.borderColor='#667eea';"
                               onmouseout="this.style.background='white'; this.style.borderColor='#cbd5e0';"
                               title="Click để copy">
                                ${licenseKey}
                            </div>
                            <p style="
                                color: #718096;
                                font-size: 12px;
                                margin-top: 5px;
                                font-style: italic;
                            ">💡 Click vào mã để copy</p>
                        </div>
                        
                        <div>
                            <label style="
                                display: block;
                                color: #4a5568;
                                font-size: 13px;
                                font-weight: 600;
                                margin-bottom: 5px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">Giá trị</label>
                            <p style="
                                color: #2d3748;
                                font-size: 18px;
                                font-weight: 700;
                                color: #48bb78;
                            ">${formatCurrency(price)}</p>
                        </div>
                    </div>
                    
                    <button onclick="closeSuccessModal()" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 15px 40px;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.5)';"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.4)';">
                        Xem bản quyền đã mua
                    </button>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { 
                    transform: translateY(50px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes scaleIn {
                0% { 
                    transform: scale(0);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2);
                }
                100% { 
                    transform: scale(1);
                    opacity: 1;
                }
            }
        </style>
    `;

  // Thêm modal vào body
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

/**
 * Đóng modal thành công và highlight bản quyền đã mua
 */
function closeSuccessModal() {
  const modal = document.getElementById("success-modal");
  if (modal) {
    modal.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => {
      modal.remove();
      // Highlight và scroll đến phần bản quyền đã mua
      highlightMyLicenses();
    }, 300);
  }
}

// Hiển thị alert cho Zalo Tools (Generic)
function showZaloAlert(elementId, message, type = "info") {
  const alert = document.getElementById(elementId);
  if (!alert) return;

  // Xóa timeout cũ nếu có
  if (alert.zaloTimeoutId) {
    clearTimeout(alert.zaloTimeoutId);
  }

  if (!message) {
    alert.style.display = "none";
    return;
  }

  alert.textContent = message;
  alert.className = `alert ${type}`;
  alert.style.display = "block";

  // Tự động ẩn sau 3 giây
  alert.zaloTimeoutId = setTimeout(() => {
    alert.style.display = "none";
  }, 3000);
}

// Hiển thị alert cho send image (Legacy support)
function showSendAlert(message, type = "info") {
  showZaloAlert("send-image-alert", message, type);
}

/**
 * Copy license key từ modal
 */
function copyLicenseKeyFromModal(licenseKey) {
  navigator.clipboard
    .writeText(licenseKey)
    .then(() => {
      // Hiển thị thông báo đã copy
      const copyNotification = document.createElement("div");
      copyNotification.innerHTML = "✅ Đã copy Key bản quyền!";
      copyNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;

      document.body.appendChild(copyNotification);

      setTimeout(() => {
        copyNotification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => copyNotification.remove(), 300);
      }, 2000);
    })
    .catch((err) => {
      console.error("❌ Error copying:", err);
      alert("❌ Không thể copy Key bản quyền");
    });
}

// Thêm animations cho copy notification
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// ════════════════════════════════════════════════════════════════
// API HELPERS
// ════════════════════════════════════════════════════════════════

async function apiCall(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (options.body instanceof FormData) {
    delete defaultOptions.headers["Content-Type"];
  }

  // ✅ THÊM CSRF TOKEN VÀO MỌI REQUEST (TRỪ GET)
  if (options.method && options.method !== "GET" && csrfToken) {
    defaultOptions.headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  // ✅ NẾU LỖI 403 (CSRF INVALID), TẢI LẠI CSRF TOKEN
  if (response.status === 403) {
    const data = await response.json();
    if (data.message && data.message.includes("CSRF")) {
      console.log("⚠️ CSRF token không hợp lệ, đang lấy token mới...");
      await fetchCsrfToken();

      // Thử lại request với token mới
      defaultOptions.headers["X-CSRF-Token"] = csrfToken;
      const retryResponse = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
          "X-CSRF-Token": csrfToken,
        },
      });
      return await retryResponse.json();
    }
  }

  if (response.status === 401) {
    logout();
    return;
  }

  // ✅ NẾU BỊ RATE LIMIT, HIỂN THỊ THÔNG BÁO
  if (response.status === 429) {
    const data = await response.json();
    alert(data.message || "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.");
    return data;
  }

  return await response.json();
}

// ════════════════════════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════════════════════════

function showPage(pageId) {
  // Bảo vệ trang Zalo OA, LINK & Tra cứu dữ liệu rò rỉ (Admin) - Chỉ cho phép userRole = 1
  if (
    (pageId === "hub-zalo-oa" || pageId === "hub-link" || pageId === "hub-leak-lookup") &&
    (!currentUser || currentUser.userRole !== 1)
  ) {
    showPage("dashboard-home");
    return;
  }


  // REDIRECT: Nếu trang đã được di chuyển vào Zalo Hub (Tabs), chuyển hướng tới đó
  const movedZaloPages = [
    "send-image",
    "send-image-by-card",
    "zalo-accounts",
    "history",
    "licenses",
  ];
  if (movedZaloPages.includes(pageId)) {
    showPage("hub-zalo"); // Chuyển sang Hub Zalo trước

    // Tìm button tương ứng trong sub-menu để active và load tab
    const tabBtn = document.querySelector(
      `#hub-zalo .sub-menu-item[onclick*="showZaloTab('${pageId}'"]`,
    );
    if (tabBtn) {
      showZaloTab(pageId, tabBtn);
    }
    return;
  }

  // Update menu
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Nếu đang ở hub page thì active "Trang chủ" (ngoại trừ hub-deposit)
  let menuPageId = pageId;
  if (pageId.startsWith("hub-") && pageId !== "hub-deposit") {
    menuPageId = "dashboard-home";
  }

  document.querySelectorAll(".menu-item").forEach((item) => {
    if (
      item.getAttribute("onclick") &&
      item.getAttribute("onclick").includes(`showPage('${menuPageId}')`)
    ) {
      item.classList.add("active");
    }
  });

  // Update pages
  document.querySelectorAll(".page-section").forEach((page) => {
    page.classList.remove("active");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
  }

  // Load data if needed
  if (pageId === "profile") {
    loadProfile();
  } else if (pageId === "hub-zalo") {
    // Load Zalo tab mặc định
    const hubZalo = document.getElementById("hub-zalo");
    const activeBtn = hubZalo
      ? hubZalo.querySelector(".sub-menu-item.active")
      : null;
    if (activeBtn) {
      const onclickAttr = activeBtn.getAttribute("onclick");
      const match = onclickAttr && onclickAttr.match(/showZaloTab\('([^']+)'/);
      if (match) {
        showZaloTab(match[1], activeBtn);
      }
    } else {
      const firstBtn = hubZalo ? hubZalo.querySelector(".sub-menu-item") : null;
      if (firstBtn) showZaloTab("send-image", firstBtn);
    }
  } else if (pageId === "hub-other") {
    // Load Other tab mặc định
    const hubOther = document.getElementById("hub-other");
    const activeBtn = hubOther
      ? hubOther.querySelector(".sub-menu-item.active")
      : null;
    if (activeBtn) {
      const onclickAttr = activeBtn.getAttribute("onclick");
      const match = onclickAttr && onclickAttr.match(/showOtherTab\('([^']+)'/);
      if (match) {
        showOtherTab(match[1], activeBtn);
      }
    } else {
      const firstBtn = hubOther
        ? hubOther.querySelector(".sub-menu-item")
        : null;
      if (firstBtn) showOtherTab("check-ip", firstBtn);
    }
  } else if (pageId === "hub-deposit") {
    // Load Deposit tab mặc định
    const hubDeposit = document.getElementById("hub-deposit");
    const activeBtn = hubDeposit
      ? hubDeposit.querySelector(".sub-menu-item.active")
      : null;
    if (activeBtn) {
      const onclickAttr = activeBtn.getAttribute("onclick");
      const match =
        onclickAttr && onclickAttr.match(/showDepositTab\('([^']+)'/);
      if (match) {
        showDepositTab(match[1], activeBtn);
      }
    } else {
      const firstBtn = hubDeposit
        ? hubDeposit.querySelector(".sub-menu-item")
        : null;
      if (firstBtn) showDepositTab("create", firstBtn);
    }
  } else if (pageId === "hub-leak-lookup") {
    // Load Leak tab mặc định
    const hubLeak = document.getElementById("hub-leak-lookup");
    const activeBtn = hubLeak
      ? hubLeak.querySelector(".sub-menu-item.active")
      : null;
    if (activeBtn) {
      const onclickAttr = activeBtn.getAttribute("onclick");
      const match = onclickAttr && onclickAttr.match(/showLeakTab\('([^']+)'/);
      if (match) {
        showLeakTab(match[1], activeBtn);
      }
    } else {
      const firstBtn = hubLeak ? hubLeak.querySelector(".sub-menu-item") : null;
      if (firstBtn) showLeakTab("leak-phone", firstBtn);
    }
  } else if (pageId === "hub-link") {
    // Load Link tab mặc định
    const hubLink = document.getElementById("hub-link");
    const activeBtn = hubLink
      ? hubLink.querySelector(".sub-menu-item.active")
      : null;
    if (activeBtn) {
      const onclickAttr = activeBtn.getAttribute("onclick");
      const match = onclickAttr && onclickAttr.match(/showLinkTab\('([^']+)'/);
      if (match) {
        showLinkTab(match[1], activeBtn);
      } else {
        showLinkTab("templates", activeBtn);
      }
    } else {
      const firstBtn = hubLink ? hubLink.querySelector(".sub-menu-item") : null;
      showLinkTab("templates", firstBtn);
    }
  } else if (pageId === "hub-zalo-oa") {
    // Load Zalo OA tab mặc định & tự động kiểm tra token hết hạn
    const hubZaloOa = document.getElementById("hub-zalo-oa");
    const activeBtn = hubZaloOa
      ? hubZaloOa.querySelector(".sub-menu-item.active")
      : null;
    if (activeBtn) {
      const onclickAttr = activeBtn.getAttribute("onclick");
      const match = onclickAttr && onclickAttr.match(/showZaloOaTab\('([^']+)'/);
      if (match) {
        showZaloOaTab(match[1], activeBtn);
      } else {
        showZaloOaTab("send", activeBtn);
      }
    } else {
      const firstBtn = hubZaloOa ? hubZaloOa.querySelector(".sub-menu-item") : null;
      showZaloOaTab("send", firstBtn);
    }
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// ════════════════════════════════════════════════════════════════
// ZALO ACCOUNTS
// ════════════════════════════════════════════════════════════════

async function loadZaloAccounts() {
  const container = document.getElementById("zalo-accounts-list");
  container.innerHTML = "<p>Đang tải...</p>";

  try {
    const data = await apiCall("/zalo-accounts");

    if (data.success && data.data.length > 0) {
      // Header với nút "Cập nhật trạng thái tất cả"
      let headerHtml = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0;">Danh sách tài khoản Zalo (${data.data.length})</h3>
                    <button id="check-all-status-btn" class="btn" onclick="checkAllAccountsStatus()">
                        🔄 Check trạng thái tất cả
                    </button>
                </div>
            `;

      let accountsHtml = data.data
        .map((account) => {
          // Xác định màu badge dựa trên trạng thái
          const isActive = account.accStatus === "Đang hoạt động";
          const badgeClass = isActive ? "badge-success" : "badge-danger";
          const statusIcon = isActive ? "🟢" : "🔴";

          // Avatar mặc định nếu không có
          const avatarUrl =
            account.Avatar || "https://via.placeholder.com/80?text=No+Avatar";

          return `
                <div class="card">
                    <div class="account-card-flex">
                        <div class="account-main-info">
                            <!-- Avatar -->
                            <div style="flex-shrink: 0;">
                                <img src="${avatarUrl}" alt="Avatar" 
                                     style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid ${isActive ? "#28a745" : "#dc3545"}; box-shadow: 0 2px 8px rgba(0,0,0,0.15);"
                                     onerror="this.src='https://via.placeholder.com/80?text=No+Avatar'">
                            </div>
                            <!-- Thông tin tài khoản -->
                            <div class="account-details">
                                <h3 style="margin: 0 0 10px 0;">${account.displayName}</h3>
                                <p style="color: #666; margin: 5px 0; font-size: 14px;">UID: ${account.UID}</p>
                                <p style="color: #666; margin: 5px 0; font-size: 14px;">Số điện thoại: ${account.phoneNumber || "Chưa có"}</p>
                                <p style="color: #666; margin: 5px 0;">Trạng thái: <span class="badge ${badgeClass}">${statusIcon} ${account.accStatus}</span></p>
                            </div>
                        </div>
                        <div class="account-actions">
                            <button class="btn" onclick="updateStatus('${account.UID}')">Check trạng thái</button>
                            <button class="btn btn-danger" onclick="deleteZaloAccount('${account.UID}')">Xóa</button>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

      container.innerHTML = headerHtml + accountsHtml;
    } else {
      container.innerHTML =
        '<div class="card"><p>Chưa có tài khoản Zalo nào. Vui lòng thêm tài khoản.</p></div>';
    }
  } catch (error) {
    container.innerHTML =
      '<div class="card"><p class="alert error">Lỗi tải danh sách tài khoản</p></div>';
  }
}

function showAddZaloForm() {
  const container = document.getElementById("zalo-accounts-list");
  container.innerHTML = `
        <div class="card">
            <div class="card-header">Thêm tài khoản Zalo mới</div>
            <div id="add-zalo-alert" class="alert" style="display: none;"></div>
            <form id="add-zalo-form" onsubmit="handleAddZaloAccountAuto(event)">
				<div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #17a2b8;">
                    <p style="margin: 0; color: #0c5460; font-size: 14px;">
                        <strong>💡 Hướng dẫn:</strong><br>
                        1. Mở trình duyệt, truy cập https://chat.zalo.me và đăng nhập vào Zalo<br>
                        2. Nhấn CTRL + SHIFT + C để mở DevTools<br>
                        3. Vào tab Application → Local Storage → Chọn https://chat.zalo.me → Tại tab bên phải kéo xuống cuối → Copy giá trị "z_uuid"<br>
                        4. Vào Cookies → Chọn https://chat.zalo.me → Tại tab bên phải, nhấp vào và copy giá trị "zpw_sek"<br>
                        5. Paste vào form tương ứng và nhấn "Tự động lấy thông tin"
                    </p>
                </div>
				<br>
                <div class="form-group">
                    <label>IMEI *</label>
                    <input type="text" id="zalo-imei-auto" required placeholder="Ví dụ: f17b174b-5ab5-4725-b079-8f255605a8bd-...">
                    <small style="color: #666; display: block; margin-top: 5px;">
                        Lấy từ DevTools (CTRL+SHIFT+C) → Application → Local Storage → https://chat.zalo.me → z_uuid
                    </small>
                </div>
                <div class="form-group">
                    <label>COOKIE zpw_sek *</label>
                    <textarea id="zalo-cookie-zpw-sek-auto" required rows="3" placeholder="Ví dụ: jQx1.190077195.a0.yh_tnfGZoNMVUfr-..."></textarea>
                    <small style="color: #666; display: block; margin-top: 5px;">
                        Lấy từ DevTools (CTRL+SHIFT+C) → Application → Cookies → https://chat.zalo.me → zpw_sek
                    </small>
                </div>
                <button type="submit" class="btn" id="add-zalo-auto-btn">
                    🔄 Tự động lấy thông tin và lưu
                </button>
                <button type="button" class="btn btn-secondary" onclick="loadZaloAccounts()">Hủy</button>
            </form>
        </div>
    `;
}

async function handleAddZaloAccount(event) {
  event.preventDefault();

  const formData = {
    UID: document.getElementById("zalo-uid").value,
    displayName: document.getElementById("zalo-displayname").value,
    phoneNumber: document.getElementById("zalo-phonenumber").value,
    Avatar: document.getElementById("zalo-avatar").value,
    IMEI: document.getElementById("zalo-imei").value,
    ENCRYPTION_KEY: document.getElementById("zalo-key").value,
    COOKIE_ZPW_SEK: document.getElementById("zalo-cookie-zpw-sek").value,
  };

  try {
    const data = await apiCall("/zalo-accounts", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    if (data.success) {
      alert("✅ Thêm tài khoản thành công!");
      loadZaloAccounts();
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    alert("❌ Lỗi kết nối đến server");
  }
}

async function handleAddZaloAccountAuto(event) {
  event.preventDefault();

  const imei = document.getElementById("zalo-imei-auto").value.trim();
  const cookieZpwSek = document
    .getElementById("zalo-cookie-zpw-sek-auto")
    .value.trim();
  const btn = document.getElementById("add-zalo-auto-btn");
  const alertDiv = document.getElementById("add-zalo-alert");
  console.log("IMEI: ", imei);
  console.log("COOKIE_ZPW_SEK: ", cookieZpwSek);
  // Validate
  if (!imei || !cookieZpwSek) {
    alertDiv.textContent = "❌ Vui lòng nhập đầy đủ IMEI và Cookie zpw_sek";
    alertDiv.className = "alert error";
    alertDiv.style.display = "block";
    return;
  }

  // Disable button
  btn.disabled = true;
  btn.innerHTML = "⏳ Đang lấy thông tin từ Zalo...";
  alertDiv.style.display = "none";

  try {
    console.log("IMEI: ", imei);
    console.log("COOKIE_ZPW_SEK: ", cookieZpwSek);
    const data = await apiCall("/zalo-accounts/auto-fetch", {
      method: "POST",
      body: JSON.stringify({
        IMEI: imei,
        COOKIE_ZPW_SEK: cookieZpwSek,
      }),
    });

    if (data.success) {
      alertDiv.textContent = `✅ ${data.message}`;
      alertDiv.className = "alert success";
      alertDiv.style.display = "block";

      // Show success info
      setTimeout(() => {
        loadZaloAccounts();
      }, 2000);
    } else {
      alertDiv.textContent = "❌ " + data.message;
      alertDiv.className = "alert error";
      alertDiv.style.display = "block";
    }
  } catch (error) {
    console.error("Add Zalo Account Auto Error:", error);
    alertDiv.textContent = "❌ Lỗi kết nối đến server";
    alertDiv.className = "alert error";
    alertDiv.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.innerHTML = "🔄 Tự động lấy thông tin và lưu";
  }
}

async function deleteZaloAccount(uid) {
  if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;

  try {
    const data = await apiCall(`/zalo-accounts/${uid}`, {
      method: "DELETE",
    });

    if (data.success) {
      alert("✅ Đã xóa tài khoản");
      loadZaloAccounts();
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    alert("❌ Lỗi kết nối đến server");
  }
}

// ════════════════════════════════════════════════════════════════
// CHECK ACCOUNT STATUS - KIỂM TRA TRẠNG THÁI TÀI KHOẢN
// ════════════════════════════════════════════════════════════════

/**
 * Cập nhật trạng thái 1 tài khoản Zalo
 */
async function updateStatus(uid) {
  try {
    // Tìm nút và hiển thị trạng thái đang kiểm tra
    const buttons = document.querySelectorAll(
      `button[onclick="updateStatus('${uid}')"]`,
    );
    buttons.forEach((btn) => {
      btn.disabled = true;
      btn.textContent = "⏳ Đang kiểm tra...";
    });

    const data = await apiCall(`/zalo-accounts/${uid}/check-status`, {
      method: "POST",
    });

    if (data.success) {
      const statusText = data.data.isActive
        ? "✅ Đang hoạt động"
        : "❌ Không hoạt động";
      alert(
        `${statusText}\n\nTài khoản: ${data.data.displayName || uid}${data.data.error ? "\nLỗi: " + data.data.error : ""}`,
      );
      loadZaloAccounts(); // Reload danh sách để cập nhật trạng thái mới
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    console.error("Update Status Error:", error);
    alert("❌ Lỗi kết nối đến server");
  } finally {
    // Khôi phục nút
    const buttons = document.querySelectorAll(
      `button[onclick="updateStatus('${uid}')"]`,
    );
    buttons.forEach((btn) => {
      btn.disabled = false;
      btn.textContent = "Check trạng thái";
    });
  }
}

/**
 * Kiểm tra trạng thái tất cả tài khoản Zalo
 */
async function checkAllAccountsStatus() {
  try {
    // Hiển thị nút đang xử lý
    const checkAllBtn = document.getElementById("check-all-status-btn");
    if (checkAllBtn) {
      checkAllBtn.disabled = true;
      checkAllBtn.innerHTML = "⏳ Đang kiểm tra tất cả...";
    }

    const data = await apiCall("/zalo-accounts/check-all-status", {
      method: "POST",
    });

    if (data.success) {
      // Hiển thị kết quả
      let resultMessage = `✅ Đã kiểm tra ${data.data.length} tài khoản:\n\n`;
      data.data.forEach((acc) => {
        const statusIcon = acc.isActive ? "🟢" : "🔴";
        resultMessage += `${statusIcon} ${acc.displayName}: ${acc.accStatus}\n`;
      });
      alert(resultMessage);
      loadZaloAccounts(); // Reload danh sách
    } else {
      alert("❌ " + data.message);
    }
  } catch (error) {
    console.error("Check All Status Error:", error);
    alert("❌ Lỗi kết nối đến server");
  } finally {
    // Khôi phục nút
    const checkAllBtn = document.getElementById("check-all-status-btn");
    if (checkAllBtn) {
      checkAllBtn.disabled = false;
      checkAllBtn.innerHTML = "🔄 Check trạng thái tất cả";
    }
  }
}

/**
 * Kiểm tra trạng thái tất cả tài khoản Zalo (Silent - không hiển thị alert)
 * Được gọi tự động khi người dùng vào tab "Lấy IP"
 */
async function checkAllAccountsStatusSilent() {
  try {
    console.log("🔄 Tự động kiểm tra trạng thái tất cả tài khoản...");

    // Hiển thị thông báo đang kiểm tra trong alert
    const activeTab = document.querySelector(".zalo-tab.active");
    const alertId = activeTab
      ? activeTab.querySelector(".alert")?.id || "send-image-alert"
      : "send-image-alert";

    showZaloAlert(
      alertId,
      "⏳ Đang tự động kiểm tra trạng thái tài khoản Zalo...",
      "warning",
    );

    const data = await apiCall("/zalo-accounts/check-all-status", {
      method: "POST",
    });

    if (data.success && data.data.length > 0) {
      console.log(`✅ Đã kiểm tra ${data.data.length} tài khoản`);

      const activeCount = data.data.filter((acc) => acc.isActive).length;
      const inactiveCount = data.data.length - activeCount;

      if (inactiveCount > 0) {
        const inactiveNames = data.data
          .filter((acc) => !acc.isActive)
          .map((acc) => acc.displayName)
          .join(", ");
        showZaloAlert(
          alertId,
          `⚠️ Đã kiểm tra ${data.data.length} tài khoản: ${activeCount} hoạt động, ${inactiveCount} không hoạt động (${inactiveNames})`,
          "error",
        );
      } else {
        showZaloAlert(
          alertId,
          `✅ Đã kiểm tra ${data.data.length} tài khoản - Tất cả đang hoạt động!`,
          "success",
        );
      }
    } else if (data.success && data.data.length === 0) {
      showZaloAlert(
        alertId,
        "⚠️ Bạn chưa thêm tài khoản Zalo. Bạn có thể sử dụng tài khoản hệ thống.",
        "warning",
      );
    } else {
      showZaloAlert(
        alertId,
        "❌ Lỗi kiểm tra trạng thái: " + (data.message || "Unknown"),
        "error",
      );
    }
  } catch (error) {
    console.error("Check All Status Silent Error:", error);
    const activeTab = document.querySelector(".zalo-tab.active");
    const alertId = activeTab
      ? activeTab.querySelector(".alert")?.id || "send-image-alert"
      : "send-image-alert";
    showZaloAlert(
      alertId,
      "❌ Lỗi kết nối khi kiểm tra trạng thái tài khoản",
      "error",
    );
  }
}

async function checkAllAccountsStatusCardSilent() {
  // Reuse the same logic as checkAllAccountsStatusSilent which now detects the active tab's alert
  return checkAllAccountsStatusSilent();
}

// ════════════════════════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════════════════════════

async function loadStats() {
  try {
    const data = await apiCall("/send-image/stats");

    if (data.success) {
      const stats = data.data;
      document.getElementById("stats-grid").innerHTML = `
                <div class="stat-card">
                    <div class="label">Tổng số đã gửi</div>
                    <div class="value">${stats.totalSent || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Thành công</div>
                    <div class="value" style="color: #28a745;">${stats.successCount || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Thất bại</div>
                    <div class="value" style="color: #dc3545;">${stats.failedCount || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Lỗi</div>
                    <div class="value" style="color: #ffc107;">${stats.errorCount || 0}</div>
                </div>
            `;
    }
  } catch (error) {
    console.error("Load stats error:", error);
  }
}

async function loadHistory(page = 1) {
  const tbody = document.getElementById("history-body");
  const limit = 30;
  tbody.innerHTML =
    '<tr><td colspan="8" style="text-align: center;">Đang tải...</td></tr>';

  try {
    const data = await apiCall(
      `/send-image/history?page=${page}&limit=${limit}`,
    );

    if (data.success && data.data.history.length > 0) {
      tbody.innerHTML = data.data.history
        .map(
          (item) => `
                <tr>
                    <td>${new Date(item.created_at).toLocaleString("vi-VN")}</td>
                    <td>${item.phoneNumber || "N/A"}</td>
                    <td>${item.displayName || "N/A"}</td>
					<td>${item.fee_charged || "0"}</td>
					<td>
					  ${
              item.use_system_account === 1
                ? "Hệ thống"
                : item.use_system_account === 0
                  ? "Người dùng"
                  : ""
            }
					</td>
                    <td><span class="badge badge-${item.sendResult === "SUCCESS" ? "success" : item.sendResult === "FAILED" ? "danger" : "warning"}">${item.sendResult}</span></td>
                    <td style="max-width: 250px; overflow-wrap: break-word;">${item.Detail}</td>
                </tr>
            `,
        )
        .join("");

      renderPagination("history-pagination", data.data.pagination, loadHistory);
    } else {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align: center;">Chưa có lịch sử gửi</td></tr>';
      document.getElementById("history-pagination").innerHTML = "";
    }
  } catch (error) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align: center;">Lỗi tải lịch sử</td></tr>';
  }
}

/**
 * Load Zalo Timer History
 */
async function loadZaloTimerHistory(page = 1) {
  const tbody = document.getElementById("zalo-timer-history-body");
  if (!tbody) return;
  const limit = 30;

  tbody.innerHTML =
    '<tr><td colspan="7" style="text-align: center;">⏳ Đang tải...</td></tr>';

  try {
    const data = await apiCall(
      `/zalo-timer/history?page=${page}&limit=${limit}`,
    );
    if (data.success) {
      if (!data.data || data.data.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="7" style="text-align: center;">Chưa có yêu cầu hẹn giờ nào</td></tr>';
        document.getElementById("zalo-timer-pagination").innerHTML = "";
        return;
      }

      tbody.innerHTML = data.data
        .map((item) => {
          let statusBadge = "";
          if (item.status === 0) {
            statusBadge =
              '<span class="badge badge-warning">⏳ Đang chờ</span>';
          } else if (item.status === 1) {
            statusBadge = '<span class="badge badge-info">🌀 Đang xử lý</span>';
          } else if (item.status === 2) {
            statusBadge = '<span class="badge badge-danger">❌ Thất bại</span>';
          } else if (item.status === 3) {
            statusBadge =
              '<span class="badge badge-success">✅ Thành công</span>';
          }

          return `
                    <tr>
                        <td>${formatDateTime(item.createdAt)}</td>
                        <td>${formatDateTime(item.runTime)}</td>
                        <td>${item.targetPhone || "N/A"}</td>
                        <td><code>${item.targetUID || "N/A"}</code></td>
                        <td>${item.targetName || "N/A"}</td>
                        <td>${statusBadge}</td>
                        <td style="max-width: 300px; font-size: 13px;">${item.result || "-"}</td>
                    </tr>
                `;
        })
        .join("");

      renderPagination(
        "zalo-timer-pagination",
        data.pagination,
        loadZaloTimerHistory,
      );
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">❌ ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error("Load Timer History Error:", error);
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; color: red;">❌ Lỗi kết nối máy chủ</td></tr>';
  }
}

/**
 * Render Pagination Controls
 */
function renderPagination(containerId, pagination, loadFunc) {
  const container = document.getElementById(containerId);
  if (!container || !pagination) return;

  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
        <div class="pagination-info">Trang ${page} / ${totalPages} (${total} bản ghi)</div>
        <button class="pagination-btn" ${page <= 1 ? "disabled" : ""} onclick="${loadFunc.name}(${page - 1})">« Trước</button>
    `;

  // Show a limited range of pages
  const range = 2;
  for (
    let i = Math.max(1, page - range);
    i <= Math.min(totalPages, page + range);
    i++
  ) {
    html += `<button class="pagination-btn ${i === page ? "active" : ""}" onclick="${loadFunc.name}(${i})">${i}</button>`;
  }

  html += `
        <button class="pagination-btn" ${page >= totalPages ? "disabled" : ""} onclick="${loadFunc.name}(${page + 1})">Tiếp »</button>
    `;

  container.innerHTML = html;
}

// ════════════════════════════════════════════════════════════════
// PROFILE
// ════════════════════════════════════════════════════════════════

async function loadProfile() {
  const container = document.getElementById("profile-info");
  container.innerHTML = "<p>Đang tải...</p>";

  try {
    const data = await apiCall("/auth/profile");

    if (data.success) {
      const user = data.data;
      const roleName =
        user.userRole === 1 ? "Admin" : user.userRole === 3 ? "VIP" : "User";
      container.innerHTML = `
                <p><strong>Tên đăng nhập:</strong> ${user.userName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Vai trò:</strong> ${roleName}</p>
                <p><strong>Số dư tài khoản:</strong> ${Number(user.totalMoney).toLocaleString("vi-VN")} VNĐ</p>
                <p><strong>Đăng nhập lần cuối:</strong> ${user.lastLogin ? new Date(user.lastLogin).toLocaleString("vi-VN") : "Chưa có"}</p>
            `;
    }
  } catch (error) {
    container.innerHTML = '<p class="alert error">Lỗi tải thông tin</p>';
  }
}

async function handleChangePassword(event) {
  event.preventDefault();

  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const alert = document.getElementById("profile-alert");

  alert.style.display = "none";

  if (newPassword !== confirmPassword) {
    alert.className = "alert error";
    alert.textContent = "❌ Mật khẩu xác nhận không khớp";
    alert.style.display = "block";
    return;
  }

  try {
    const data = await apiCall("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (data.success) {
      alert.className = "alert success";
      alert.textContent = "✅ " + data.message;
      alert.style.display = "block";
      document.getElementById("change-password-form").reset();
    } else {
      alert.className = "alert error";
      alert.textContent = "❌ " + data.message;
      alert.style.display = "block";
    }
  } catch (error) {
    alert.className = "alert error";
    alert.textContent = "❌ Lỗi kết nối đến server";
    alert.style.display = "block";
  }
}

// ════════════════════════════════════════════════════════════════
// SEND IMAGE V2 - INTEGRATED
// ════════════════════════════════════════════════════════════════

let sendImageData = {};

// Load danh sách tài khoản Zalo cho send image
async function loadSendZaloAccounts() {
  const select = document.getElementById("send-zalo-account");

  try {
    const data = await apiCall("/send-image-v2/zalo-accounts"); // data.data là mảng tài khoản

    if (data.success && data.data.length > 0) {
      // 🎯 BƯỚC 1: LỌC MẢNG TRƯỚC (SỬ DỤNG data.data là mảng gốc)
      const activeAccounts = data.data.filter((account) => {
        // Chỉ giữ lại các tài khoản có trạng thái "Đang hoạt động"
        return account.accStatus === "Đang hoạt động";
      });

      // Nếu mảng tài khoản hoạt động có dữ liệu, tiến hành thêm option
      if (activeAccounts.length > 0) {
        select.innerHTML =
          '<option value="">-- Chọn tài khoản Zalo để gửi yêu cầu lấy IP --</option>';

        // 🎯 BƯỚC 2: DUYỆT QUA MẢNG ĐÃ LỌC
        activeAccounts.forEach((account) => {
          const option = document.createElement("option");

          // 🎯 SỬA LỖI: Gán giá trị bằng UID của đối tượng 'account' đang được lặp
          option.value = account.UID;

          // Hiển thị tài khoản hệ thống với màu xanh
          if (account.isSystemAccount) {
            option.textContent = `🏢Sử dụng tài khoản hệ thống - Không cần thêm tài khoản Zalo`;
            option.style.color = "#007bff";
            option.style.fontWeight = "bold";
          } else {
            option.textContent = `${account.displayName} - SĐT: ${account.phoneNumber}`;
          }

          select.appendChild(option);
        });
      } else {
        // Trường hợp không có tài khoản nào "Đang hoạt động"
        select.innerHTML =
          '<option value="">Không có tài khoản Zalo đang hoạt động</option>';
        showSendAlert(
          "Không có tài khoản Zalo nào đang hoạt động. Vui lòng thêm tài khoản.",
          "warning",
        );
      }
    } else {
      // Trường hợp data.data rỗng
      select.innerHTML = '<option value="">Chưa có tài khoản Zalo</option>';
      showSendAlert(
        "Bạn chưa thêm tài khoản Zalo. Có thể sử dụng tài khoản hệ thống.",
        "error",
      );
    }
  } catch (error) {
    select.innerHTML = '<option value="">Lỗi tải danh sách</option>';
    console.error("Load Send Zalo Accounts Error:", error);
  }
}

// Update step indicator
function updateSendStepIndicator(step) {
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step-indicator-${i}`);
    indicator.classList.remove("active", "completed");
  }

  for (let i = 1; i < step; i++) {
    document.getElementById(`step-indicator-${i}`).classList.add("completed");
  }
  document.getElementById(`step-indicator-${step}`).classList.add("active");
}

// Show step
function showSendStep(step) {
  document.getElementById("send-image-step1").classList.remove("active");
  document.getElementById("send-image-step2").classList.remove("active");
  document.getElementById("send-image-step3").classList.remove("active");

  document.getElementById(`send-image-step${step}`).classList.add("active");
  updateSendStepIndicator(step);
  window.scrollTo(0, 0);
}

function togglePhoneImageUpload() {
  const isCustom =
    document.querySelector('input[name="image-type-phone"]:checked').value ===
    "custom";
  document.getElementById("phone-custom-image-group").style.display = isCustom
    ? "block"
    : "none";
}

function toggleCardImageUpload() {
  const isCustom =
    document.querySelector('input[name="image-type-card"]:checked').value ===
    "custom";
  document.getElementById("card-custom-image-group").style.display = isCustom
    ? "block"
    : "none";
}

async function uploadCustomImage(fileInputId) {
  const fileInput = document.getElementById(fileInputId);
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    return { success: false, message: "Vui lòng chọn file ảnh hợp lệ" };
  }

  const file = fileInput.files[0];

  // Validate size (3MB)
  if (file.size > 3 * 1024 * 1024) {
    return { success: false, message: "Kích thước file vượt quá 3MB" };
  }

  // Validate type (Client-side)
  if (file.type !== "image/png") {
    return { success: false, message: "Chỉ hỗ trợ file định dạng PNG" };
  }

  const formData = new FormData();
  formData.append("custom_image", file);

  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

  try {
    const response = await fetch(`${API_URL}/zalo/upload-custom-image`, {
      method: "POST",
      headers: headers,
      body: formData,
    });

    return await response.json();
  } catch (error) {
    return { success: false, message: "Lỗi khi upload ảnh lên server" };
  }
}

// Tìm kiếm số điện thoại
async function searchPhoneNumber() {
  const zaloUID = document.getElementById("send-zalo-account").value;
  const phoneNumber = document.getElementById("send-phone-number").value.trim();
  const imageType = document.querySelector(
    'input[name="image-type-phone"]:checked',
  ).value;
  const ipType = document.getElementById("send-image-ip-type").value;
  const autoDelete = document.getElementById("send-image-auto-delete").checked;

  const isTimer = document.getElementById("send-image-is-timer").checked;
  const runTime = validateAndGetTimer("send-image");
  if (isTimer && !runTime) return; // validateAndGetTimer already alerts

  if (!zaloUID) {
    showSendAlert("Vui lòng chọn tài khoản Zalo", "error");
    return;
  }

  if (!phoneNumber) {
    showSendAlert("Vui lòng nhập số điện thoại", "error");
    return;
  }

  const btn = document.getElementById("send-search-btn");
  btn.disabled = true;
  btn.textContent = "Đang tìm kiếm...";

  // Xử lý upload custom image
  if (imageType === "custom") {
    const uploadState = document.getElementById("send-phone-custom-image");
    if (!uploadState.files || uploadState.files.length === 0) {
      btn.disabled = false;
      btn.textContent = "🔍 Tìm kiếm người nhận";
      showSendAlert("Vui lòng chọn hình ảnh để gửi", "error");
      return;
    }
    btn.textContent = "↑ Đang tải ảnh lên...";
    const uploadResult = await uploadCustomImage("send-phone-custom-image");
    if (!uploadResult.success) {
      btn.disabled = false;
      btn.textContent = "🔍 Tìm kiếm người nhận";
      showSendAlert(uploadResult.message || "Lỗi upload ảnh", "error");
      return;
    }
    btn.textContent = "Đang tìm kiếm...";
  }

  try {
    const data = await apiCall("/send-image-v2/search", {
      method: "POST",
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        zaloUID: zaloUID,
        imageType: imageType,
        ipType: ipType,
      }),
    });

    if (data.success) {
      // Lưu dữ liệu tìm kiếm và thông tin phí
      sendImageData = {
        zaloUID: zaloUID,
        phoneNumber: data.data.phoneNumber,
        userUID: data.data.uid,
        displayName: data.data.displayName,
        avatar: data.data.avatar,
        localAvatar: data.data.localAvatar,
        imageType: imageType,
        ipType: ipType,
        autoDelete: autoDelete,
        isTimer: isTimer,
        runTime: runTime,
      };

      // Lưu thông tin phí
      if (data.feeInfo) {
        sendImageData.feeInfo = data.feeInfo;
      }

      const select = document.getElementById("send-zalo-account");
      const senderName = select.options[select.selectedIndex].text;

      document.getElementById("send-confirm-avatar").src = data.data.avatar;
      document.getElementById("send-confirm-name").textContent =
        data.data.displayName;
      document.getElementById("send-confirm-uid").textContent = data.data.uid;
      document.getElementById("send-confirm-phone").textContent =
        data.data.phoneNumber;
      document.getElementById("send-confirm-sender").textContent = senderName;

      // Hiển thị thông tin phí nếu có
      if (data.feeInfo) {
        const feeInfoDiv = document.getElementById("send-confirm-fee-info");
        if (feeInfoDiv) {
          const accountType = data.feeInfo.isSystemAccount
            ? '<span style="color: #007bff;">Tài khoản hệ thống</span>'
            : '<span style="color: #28a745;">Tài khoản của bạn</span>';

          const displayIpType =
            sendImageData.ipType === "ipv4"
              ? "IPv4"
              : sendImageData.ipType === "ipv6"
                ? "IPv6"
                : "Cả IPv4 và IPv6";

          feeInfoDiv.innerHTML = `
                        <div style="background: #fff3cd; color: #000; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                            <h4 style="margin: 0 0 10px 0; color: #856404;">Thông tin chi tiết về yêu cầu</h4>
                            <p style="margin: 5px 0;"><strong>Loại tài khoản lựa chọn:</strong> ${accountType}</p>
                            <p style="margin: 5px 0;"><strong>Loại IP muốn lấy:</strong> <span style="color: #667eea; font-weight: bold;">${displayIpType}</span></p>
                            ${isTimer ? `<p style="margin: 5px 0;"><strong>Hẹn giờ thực hiện lúc:</strong> <span style="color: #667eea; font-weight: bold;">${document.getElementById("send-image-run-time").value}</span></p>` : ""}
                            <p style="margin: 5px 0;"><strong>Phí gửi ảnh:</strong> <span style="color: #d32f2f; font-weight: bold;">${data.feeInfo.feeAmount.toLocaleString("vi-VN")} ₫</span></p>
                            <p style="margin: 5px 0;"><strong>Số dư hiện tại:</strong> ${data.feeInfo.currentBalance.toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 5px 0;"><strong>Số dư sau khi trừ:</strong> ${data.feeInfo.balanceAfterFee.toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
                                ⚠️ <strong>Lưu ý:</strong> Phí chỉ được trừ khi gửi yêu cầu thành công ${isTimer ? "(hoặc khi lịch chạy)" : ""}
                            </p>
                        </div>
                    `;
        }
      }

      showSendStep(2);
      showSendAlert(
        "Đã tìm thấy người dùng! Vui lòng xác nhận thông tin.",
        "success",
      );
    } else {
      // Kiểm tra nếu là lỗi số dư không đủ
      if (data.insufficientBalance) {
        showSendAlert(
          data.message || "Số dư không đủ để thực hiện giao dịch",
          "error",
        );
      } else {
        showSendAlert(data.message || "Không tìm thấy người dùng", "error");
      }
    }
  } catch (error) {
    console.error("Search Phone Error:", error);
    showSendAlert("Lỗi khi tìm kiếm số điện thoại", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "🔍 Tìm kiếm người nhận";
  }
}

// Gửi yêu cầu
async function sendImageConfirm() {
  const btn = document.getElementById("send-confirm-btn");
  btn.disabled = true;
  btn.textContent = "Đang gửi...";

  try {
    const endpoint = sendImageData.isTimer
      ? "/send-image-v2-timer/send"
      : "/send-image-v2/send";
    const data = await apiCall(endpoint, {
      method: "POST",
      body: JSON.stringify(sendImageData),
    });

    const resultContainer = document.getElementById("send-result-container");

    if (data.success) {
      resultContainer.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #28a745; margin-bottom: 10px;">${sendImageData.isTimer ? "Đã đặt lịch hẹn giờ!" : "Gửi yêu cầu thành công!"}</h3>
                    <p style="color: #666;">${sendImageData.isTimer ? "Yêu cầu sẽ được thực hiện vào " + document.getElementById("send-image-run-time").value : "Yêu cầu đã được gửi đến " + sendImageData.displayName}</p>
                    ${
                      !sendImageData.isTimer
                        ? `
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; color: #000; border-radius: 10px; text-align: left;">
                        <p><strong>Kết quả:</strong> ${data.data.results[0].result}</p>
                        <p><strong>Chi tiết:</strong> ${data.message}</p>
                        ${
                          data.data.feeCharged
                            ? `
                            <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                                <p style="margin: 0;"><strong>💰 Phí đã trừ:</strong> <span style="color: #d32f2f;">${data.data.feeCharged.toLocaleString("vi-VN")} ₫</span></p>
                                <p style="margin: 5px 0 0 0;"><strong>💳 Số dư mới:</strong> ${data.data.newBalance.toLocaleString("vi-VN")} ₫</p>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    `
                        : `
                    <div style="margin-top: 20px; padding: 15px; background: rgba(0, 255, 255, 0.05); color: #0ff; border: 1px dashed #0ff; border-radius: 10px; text-align: left;">
                        <p><strong>Trạng thái:</strong> Đang chờ đến lịch chạy</p>
                        <p><strong>Thời gian:</strong> ${document.getElementById("send-image-run-time").value}</p>
                        <p style="font-size: 13px; margin-top: 10px; color: #aaa;">* Phí dịch vụ sẽ được trừ khi hệ thống thực hiện gửi tin nhắn thành công.</p>
                    </div>
                    `
                    }
                </div>
            `;

      // Reload history và stats
      loadHistory();
      loadStats();
    } else {
      resultContainer.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">❌</div>
                    <h3 style="color: #dc3545; margin-bottom: 10px;">Gửi yêu cầu thất bại!</h3>
                    <p style="color: #666;">${data.message || "Có lỗi xảy ra"}</p>
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; color: #000; border-radius: 10px; text-align: left;">
                        ${
                          data.data
                            ? `
                            <p><strong>Kết quả:</strong> ${data.data.results[0].result}</p>
                            <p><strong>Chi tiết:</strong> ${data.message}</p>
                            ${
                              data.data.feeCharged === 0
                                ? `
                                <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 5px;">
                                    <p style="margin: 0; color: #155724;">✓ Không trừ tiền vì gửi thất bại</p>
                                </div>
                            `
                                : ""
                            }
                        `
                            : ""
                        }
                    </div>
                </div>
            `;
    }

    showSendStep(3);
  } catch (error) {
    console.error("Send Image Error:", error);
    showSendAlert("Lỗi khi gửi yêu cầu", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Xác nhận gửi";
  }
}

// Quay lại bước 1
function goBackToStep1Send() {
  showSendStep(1);
}

// Reset form
function resetSendImageForm() {
  document.getElementById("send-phone-number").value = "";
  sendImageData = {};
  showSendStep(1);
}

// ═════════════════════════════════════════════════════��════���═════
// SEND IMAGE BY CARD (LẤY IP QUA DANH THIẾP)
// ════════════════════════════════════════════════════════════════

let sendCardData = {};

// Load danh sách tài khoản Zalo cá nhân
async function loadSendCardZaloAccounts() {
  try {
    const data = await apiCall("/send-image-by-card/personal-accounts");

    if (data.success) {
      const activeAccounts = data.data.filter((account) => {
        // Chỉ giữ lại các tài khoản có trạng thái "Đang hoạt động"
        return account.accStatus === "Đang hoạt động";
      });

      // Nếu mảng tài khoản hoạt động có dữ liệu, tiến hành thêm option
      if (activeAccounts.length > 0) {
        const select = document.getElementById("send-card-zalo-account");
        select.innerHTML =
          '<option value="">-- Chọn tài khoản Zalo để gửi yêu cầu lấy IP --</option>';

        // 🎯 BƯỚC 2: DUYỆT QUA MẢNG ĐÃ LỌC
        activeAccounts.forEach((account) => {
          const option = document.createElement("option");

          // 🎯 SỬA LỖI: Gán giá trị bằng UID của đối tượng 'account' đang được lặp
          option.value = account.UID;

          option.textContent = `${account.displayName} - SĐT: ${account.phoneNumber}`;

          select.appendChild(option);
        });
      } else {
        // Trường hợp không có tài khoản nào "Đang hoạt động"
        select.innerHTML =
          '<option value="">Không có tài khoản Zalo đang hoạt động</option>';
        showSendCardAlert(
          "Không có tài khoản Zalo nào đang hoạt động. Vui lòng thêm tài khoản.",
          "warning",
        );
      }
    }
  } catch (error) {
    console.error("Load Card Accounts Error:", error);
  }
}

// Hiển thị alert cho send by card (Legacy support)
function showSendCardAlert(message, type = "info") {
  showZaloAlert("send-card-alert", message, type);
}

// Hiển thị step cho send by card
function showSendCardStep(step) {
  // Ẩn tất cả steps
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`send-card-step${i}`).classList.remove("active");
    document
      .getElementById(`step-card-indicator-${i}`)
      .classList.remove("active", "completed");
  }

  // Hiển thị step hiện tại
  document.getElementById(`send-card-step${step}`).classList.add("active");
  document
    .getElementById(`step-card-indicator-${step}`)
    .classList.add("active");

  // Đánh dấu completed cho các step trước đó
  for (let i = 1; i < step; i++) {
    document
      .getElementById(`step-card-indicator-${i}`)
      .classList.add("completed");
  }
}

// Giải mã FID và tìm kiếm
async function decodeFidAndSearch() {
  const btn = document.getElementById("send-card-search-btn");
  const encryptedFid = document
    .getElementById("send-card-fid-string")
    .value.trim();
  const zaloUID = document.getElementById("send-card-zalo-account").value;
  const imageType = document.querySelector(
    'input[name="image-type-card"]:checked',
  ).value;
  const ipType = document.getElementById("send-card-ip-type").value;
  const autoDelete = document.getElementById("send-card-auto-delete").checked;

  const isTimer = document.getElementById("send-card-is-timer").checked;
  const runTime = validateAndGetTimer("send-card");
  if (isTimer && !runTime) return;

  if (!encryptedFid) {
    showSendCardAlert("Vui lòng nhập chuỗi PARAMS!", "error");
    return;
  }

  if (!zaloUID) {
    showSendCardAlert("Vui lòng chọn tài khoản Zalo!", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "🔍 Đang xử lý...";

  // Xử lý upload custom image
  if (imageType === "custom") {
    const uploadState = document.getElementById("send-card-custom-image");
    if (!uploadState.files || uploadState.files.length === 0) {
      btn.disabled = false;
      btn.textContent = "🔍 Tìm kiếm người nhận";
      showSendCardAlert("Vui lòng chọn hình ảnh để đăng tải", "error");
      return;
    }
    btn.textContent = "↑ Đang tải ảnh lên...";
    const uploadResult = await uploadCustomImage("send-card-custom-image");
    if (!uploadResult.success) {
      btn.disabled = false;
      btn.textContent = "🔍 Tìm kiếm người nhận";
      showSendCardAlert(uploadResult.message || "Lỗi upload ảnh", "error");
      return;
    }
    btn.textContent = "🔍 Đang xử lý...";
  }

  try {
    const response = await apiCall("/send-image-by-card/decode-fid", {
      method: "POST",
      body: JSON.stringify({
        encryptedFid: encryptedFid,
        zaloUID: zaloUID,
        imageType: imageType,
        ipType: ipType,
      }),
    });

    if (response.success) {
      sendCardData = {
        targetUID: response.data.userId,
        targetName: response.data.displayName,
        targetAvatar: response.data.avatar,
        zaloUID: zaloUID,
        fee: response.data.fee,
        currentBalance: response.data.currentBalance,
        zaloName: response.data.zaloName || response.data.displayName,
        phoneNumber: response.data.phoneNumber || null,
        imageType: imageType,
        ipType: ipType,
        autoDelete: autoDelete,
        isTimer: isTimer,
        runTime: runTime,
      };

      // Lấy tên tài khoản Zalo
      const select = document.getElementById("send-card-zalo-account");
      const selectedOption = select.options[select.selectedIndex];
      sendCardData.zaloAccountName = selectedOption.textContent;

      // Hiển thị thông tin xác nhận
      document.getElementById("send-card-confirm-avatar").src =
        response.data.avatar;
      document.getElementById("send-card-confirm-name").textContent =
        response.data.displayName;
      document.getElementById("send-card-confirm-uid").textContent =
        response.data.userId;
      document.getElementById("send-card-confirm-sender").textContent =
        sendCardData.zaloAccountName;
      // Hiển thị số điện thoại
      if (response.data.phoneNumber) {
        const phoneElement = document.getElementById("send-card-confirm-phone");
        if (phoneElement) {
          phoneElement.textContent = response.data.phoneNumber;
          phoneElement.style.display = "block";
        }
      }

      // Hiển thị tên Zalo
      document.getElementById("send-card-confirm-zalo-name").textContent =
        response.data.zaloName || response.data.displayName;

      if (sendCardData.fee) {
        // Hiển thị thông tin phí từ response
        const feeInfo = document.getElementById("send-card-confirm-fee-info");
        if (feeInfo) {
          const displayIpType =
            sendCardData.ipType === "ipv4"
              ? "IPv4"
              : sendCardData.ipType === "ipv6"
                ? "IPv6"
                : "Cả IPv4 và IPv6";

          feeInfo.innerHTML = `
                        <div style="background: #fff3cd; color: #000; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                            <h4 style="margin: 0 0 10px 0; color: #856404;">Thông tin chi tiết về yêu cầu</h4>
                            <p style="margin: 5px 0;"><strong>Loại tài khoản lựa chọn:</strong> Tài khoản của bạn</p>
                            <p style="margin: 5px 0;"><strong>Loại IP muốn lấy:</strong> <span style="color: #667eea; font-weight: bold;">${displayIpType}</span></p>
                            ${isTimer ? `<p style="margin: 5px 0;"><strong>Hẹn giờ thực hiện lúc:</strong> <span style="color: #667eea; font-weight: bold;">${document.getElementById("send-card-run-time").value}</span></p>` : ""}
                            <p style="margin: 5px 0;"><strong>Phí gửi ảnh:</strong> <span style="color: #d32f2f; font-weight: bold;">${sendCardData.fee.toLocaleString("vi-VN")} ₫</span></p>
                            <p style="margin: 5px 0;"><strong>Số dư hiện tại:</strong> ${sendCardData.currentBalance.toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 5px 0;"><strong>Số dư sau khi trừ:</strong> ${(sendCardData.currentBalance - sendCardData.fee).toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
                                ⚠️ <strong>Lưu ý:</strong> Phí chỉ được trừ khi gửi yêu cầu thành công ${isTimer ? "(hoặc khi lịch chạy)" : ""}
                            </p>
                        </div>
                    `;
        }
      }

      // Hiển thị cảnh báo nếu số dư không đủ
      if (response.insufficientBalance) {
        showSendCardAlert(response.message, "error");
        return;
      }

      showSendCardStep(2);
    } else {
      showSendCardAlert(
        response.message || "Không thể giải mã PARAMS!",
        "error",
      );
    }
  } catch (error) {
    console.error("Decode PARAMS Error:", error);
    showSendCardAlert("Lỗi khi giải mã PARAMS", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "🔍 Tìm kiếm người nhận";
  }
}

// Xác nhận và gửi ảnh qua danh thiếp
async function sendImageByCardConfirm() {
  const btn = document.getElementById("send-card-confirm-btn");
  btn.disabled = true;
  btn.textContent = "⏳ Đang gửi...";

  try {
    const endpoint = sendCardData.isTimer
      ? "/send-image-by-card-timer/send"
      : "/send-image-by-card/send";
    const response = await apiCall(endpoint, {
      method: "POST",
      body: JSON.stringify(sendCardData),
    });

    const resultContainer = document.getElementById(
      "send-card-result-container",
    );

    if (response.success) {
      // Hiển thị kết quả thành công
      resultContainer.innerHTML = `
				<div style="text-align: center; padding: 30px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #28a745; margin-bottom: 10px;">${sendCardData.isTimer ? "Đã đặt lịch hẹn giờ!" : "Gửi yêu cầu thành công!"}</h3>
                    <p style="color: #666;">${sendCardData.isTimer ? "Yêu cầu sẽ được thực hiện vào " + document.getElementById("send-card-run-time").value : "Yêu cầu đã được gửi đến " + sendCardData.targetName}</p>
                    ${
                      !sendCardData.isTimer
                        ? `
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; color: #000; border-radius: 10px; text-align: left;">
                        <p><strong>Kết quả:</strong> ${response.data.results[0].result}</p>
                        <p><strong>Chi tiết:</strong> ${response.data.message}</p>
                        ${
                          response.data.fee
                            ? `
                            <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
                                <p style="margin: 0;"><strong>💰 Phí đã trừ:</strong> <span style="color: #d32f2f;">${response.data.fee.toLocaleString("vi-VN")} ₫</span></p>
                                <p style="margin: 5px 0 0 0;"><strong>💳 Số dư mới:</strong> ${response.data.newBalance.toLocaleString("vi-VN")} ₫</p>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    `
                        : `
                    <div style="margin-top: 20px; padding: 15px; background: rgba(0, 255, 255, 0.05); color: #0ff; border: 1px dashed #0ff; border-radius: 10px; text-align: left;">
                        <p><strong>Trạng thái:</strong> Đang chờ đến lịch chạy</p>
                        <p><strong>Thời gian:</strong> ${document.getElementById("send-card-run-time").value}</p>
                        <p style="font-size: 13px; margin-top: 10px; color: #aaa;">* Phí dịch vụ sẽ được trừ khi hệ thống thực hiện gửi tin nhắn thành công.</p>
                    </div>
                    `
                    }
                </div>
			`;

      // Cập nhật số dư (Chỉ khi không phải hẹn giờ)
      if (
        currentUser &&
        response.data &&
        response.data.newBalance !== undefined
      ) {
        currentUser.balance = response.data.newBalance;
        localStorage.setItem("user", JSON.stringify(currentUser));
      }

      // Load lại lịch sử
      loadHistory();
      loadStats();
    } else {
      showSendCardAlert(response.message || "Không thể gửi ảnh!", "error");
      resultContainer.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">❌</div>
                    <h3 style="color: #dc3545; margin-bottom: 10px;">Gửi yêu cầu thất bại!</h3>
                    <p style="color: #666;">${response.message || "Có lỗi xảy ra"}</p>
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; color: #000; border-radius: 10px; text-align: left;">
                        ${
                          response.data
                            ? `
                            <p><strong>Kết quả:</strong> ${response.data.results[0].result}</p>
                            <p><strong>Chi tiết:</strong> ${response.data.message}</p>
                            ${
                              response.data.fee === 0
                                ? `
                                <div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 5px;">
                                    <p style="margin: 0; color: #155724;">✓ Không trừ tiền vì gửi thất bại</p>
                                </div>
                            `
                                : ""
                            }
                        `
                            : ""
                        }
                    </div>
                </div>
            `;
    }

    showSendCardStep(3);
  } catch (error) {
    console.error("Send Image By Card Error:", error);
    showSendCardAlert("Lỗi khi gửi yêu cầu", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "✓ Xác nhận và gửi yêu cầu";
  }
}

// Quay lại bước 1
function goBackToStep1Card() {
  showSendCardStep(1);
}

// Reset form
function resetSendCardForm() {
  document.getElementById("send-card-fid-string").value = "";
  sendCardData = {};
  showSendCardStep(1);
}

// ════════════════════════════════════════════════════════════════
// RUN ON LOAD
// ════════════════════════════════════════════════════════════════

window.addEventListener("DOMContentLoaded", init);

// ════════════════════════════════════════════════════════════════
// IMAGE MODAL FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Mở modal phóng to hình ảnh
 * @param {string} imageSrc - Đường dẫn hình ảnh
 * @param {string} caption - Chú thích hình ảnh (tùy chọn)
 */
function openImageModal(imageSrc, caption) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const captionText = document.getElementById("modalCaption");

  modal.style.display = "flex";
  modalImg.src = imageSrc;
  captionText.innerHTML =
    caption || "Xem hình ảnh - Click nút X hoặc nhấn ESC để đóng";
}

/**
 * Đóng modal phóng to hình ảnh
 */
function closeImageModal() {
  const modal = document.getElementById("imageModal");
  modal.style.display = "none";
}

// Đóng modal khi click bên ngoài hình ảnh
window.onclick = function (event) {
  const modal = document.getElementById("imageModal");
  if (event.target === modal) {
    closeImageModal();
  }
};

// Đóng modal khi nhấn ESC
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeImageModal();
  }
});

// ════════════════════════════════════════════════════════════════
// CHECK IP LOCATION
// ════════════════════════════════════════════════════════════════

/**
 * Xử lý submit form check IP
 */
async function handleCheckIp(event) {
  event.preventDefault();

  const ipAddress = document.getElementById("ip-address").value.trim();
  const submitBtn = document.getElementById("check-ip-btn");
  const alertDiv = document.getElementById("check-ip-alert");
  const resultCard = document.getElementById("ip-result-card");

  // Validate IP format
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (!ipv4Regex.test(ipAddress) && !ipv6Regex.test(ipAddress)) {
    showAlert(
      "check-ip-alert",
      "Địa chỉ IP không hợp lệ. Vui lòng nhập đúng định dạng IPv4 hoặc IPv6.",
      "error",
    );
    return;
  }

  // Hiển thị trạng thái loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = "⏳ Đang kiểm tra...";
  alertDiv.style.display = "none";
  resultCard.style.display = "none";

  try {
    const response = await fetch(`${API_URL}/check-ip/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ ip: ipAddress }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Có lỗi xảy ra khi kiểm tra IP");
    }

    if (data.success && data.data) {
      // Hiển thị kết quả
      displayIpResult(data.data);
      showAlert("check-ip-alert", data.message, "success");
    } else {
      showAlert(
        "check-ip-alert",
        data.message || "Không thể lấy thông tin IP",
        "error",
      );
    }
  } catch (error) {
    console.error("Error checking IP:", error);
    showAlert(
      "check-ip-alert",
      error.message || "Có lỗi xảy ra khi kiểm tra IP",
      "error",
    );
  } finally {
    // Khôi phục trạng thái button
    submitBtn.disabled = false;
    submitBtn.innerHTML = "🔍 Kiểm tra vị trí";
  }
}

/**
 * Hiển thị kết quả tra cứu IP
 */
function displayIpResult(dataList) {
  const resultCard = document.getElementById("ip-result-card");
  const resultContent = document.getElementById("ip-result-content");

  // Đảm bảo dataList là một mảng
  if (!Array.isArray(dataList)) {
    dataList = [dataList];
  }

  // Xóa nội dung cũ
  resultContent.innerHTML = "";
  resultContent.className = ""; // Xóa class grid cũ để tự do styling

  // ⭐ Xóa tất cả map cũ (nếu có nằm ngoài content)
  const oldMapContainers = resultCard.querySelectorAll(".ip-map-container");
  oldMapContainers.forEach((mc) => mc.remove());

  dataList.forEach((data, index) => {
    const sourceBlock = document.createElement("div");
    sourceBlock.className = "ip-source-block";
    sourceBlock.style.background = "#ffffff";
    sourceBlock.style.borderRadius = "12px";
    sourceBlock.style.padding = "25px";
    sourceBlock.style.marginBottom = "30px";
    sourceBlock.style.border = "1px solid #e2e8f0";
    sourceBlock.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";

    if (index > 0) {
      sourceBlock.style.marginTop = "10px";
    }

    let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f7fafc; padding-bottom: 15px;">
                <h3 style="margin: 0; font-size: 18px; color: #2d3748; display: flex; align-items: center; font-weight: 700;">
                    <span style="display: inline-block; width: 4px; height: 20px; background: linear-gradient(to bottom, #667eea, #764ba2); border-radius: 2px; margin-right: 12px;"></span>
                    <i class="fas fa-database me-2" style="font-size: 14px; opacity: 0.7;"></i>
                    Nguồn: ${data.source || "Không xác định"}
                </h3>
                <span class="badge" style="background: rgba(102, 126, 234, 0.1); color: #667eea; font-weight: 700; border: 1px solid rgba(102, 126, 234, 0.2); padding: 5px 15px; border-radius: 8px;">
                    ${data.ipType || "N/A"}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div class="ip-result-item">
                    <label style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">🌐 Địa chỉ IP</label>
                    <div class="value" style="font-weight: 700; color: #2d3748; font-size: 16px;">${data.ip || "---"}</div>
                </div>
                <div class="ip-result-item">
                    <label style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">🗺️ Khu vực</label>
                    <div class="value" style="color: #4a5568;">${data.region || "---"}</div>
                </div>
                <div class="ip-result-item">
                    <label style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">🏙️ Thành phố</label>
                    <div class="value" style="color: #4a5568;">${data.city || "---"}</div>
                </div>
                <div class="ip-result-item">
                    <label style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">🌍 Quốc gia</label>
                    <div class="value" style="color: #4a5568;">${data.country || "---"}</div>
                </div>
                <div class="ip-result-item">
                    <label style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📡 Network / ISP</label>
                    <div class="value" style="color: #4a5568; font-weight: 500;">${data.network || "---"}</div>
                </div>
        `;

    if (data.latitude && data.longitude) {
      html += `
                <div class="ip-result-item">
                    <label style="display: block; font-size: 12px; color: #718096; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📍 Tọa độ</label>
                    <div class="value" style="color: #4a5568;">${data.latitude}, ${data.longitude}</div>
                </div>
            `;
    }

    html += `</div>`;

    // Thêm bản đồ cho nguồn này nếu có
    if (data.mapUrl) {
      html += `
                <div class="ip-map-container" style="margin-top: 25px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; height: 300px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                    <iframe
                        width="100%"
                        height="100%"
                        style="border:0;"
                        loading="lazy"
                        allowfullscreen
                        referrerpolicy="no-referrer-when-downgrade"
                        src="${data.mapUrl}">
                    </iframe>
                </div>
            `;
    }

    sourceBlock.innerHTML = html;
    resultContent.appendChild(sourceBlock);
  });

  resultCard.style.display = "block";

  // Cuộn mượt đến kết quả
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ════════════════════════════════════════════════════════════════
// LICENSES MANAGEMENT
// ════════════════════════════════════════════════════════════════

/**
 * Load danh sách sản phẩm
 */
async function loadProducts() {
  try {
    const data = await apiCall("/licenses/products", {
      method: "GET",
    });

    if (data.success) {
      displayProducts(data.data);
    } else {
      showAlert("licenses-alert", data.message, "error");
    }
  } catch (error) {
    console.error("❌ Error loading products:", error);
    showAlert("licenses-alert", "Không thể tải danh sách sản phẩm", "error");
  }
}

/**
 * Hiển thị danh sách sản phẩm
 */
function displayProducts(products) {
  const container = document.getElementById("products-container");

  if (products.length === 0) {
    container.innerHTML = `
            <div class="no-licenses">
                <div class="no-licenses-icon">📦</div>
                <p>Chưa có sản phẩm nào</p>
            </div>
        `;
    return;
  }

  container.innerHTML = products
    .map(
      (product) => `
        <div class="product-card">
            <img src="${product.productImage}" alt="${product.productName}" class="product-image" onerror="this.src='https://via.placeholder.com/400x300/667eea/ffffff?text=${encodeURIComponent(product.productName)}'">
            <div class="product-content">
                <h3 class="product-name">${product.productName}</h3>
                <p class="product-desc">${product.productDesc || "Không có mô tả"}</p>
                
                <div class="product-prices">
                    ${
                      product.productOnePrice > 0
                        ? `
                    <div class="price-option">
                        <span class="price-label">💎 01 lần sử dụng</span>
                        <span class="price-value">${formatCurrency(product.productOnePrice)}/01 lần</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      product.productFivePrice > 0
                        ? `
                    <div class="price-option">
                        <span class="price-label">📅 05 lần sử dụng</span>
                        <span class="price-value">${formatCurrency(product.productFivePrice)}/05 lần</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      product.productTenPrice > 0
                        ? `
                    <div class="price-option">
                        <span class="price-label">🎯 10 lần sử dụng</span>
                        <span class="price-value">${formatCurrency(product.productTenPrice)}/10 lần</span>
                    </div>
                    `
                        : ""
                    }
                </div>

                <select class="license-type-select" id="license-type-${product.productID}">
                    ${product.productOnePrice > 0 ? `<option value="1" data-price="${product.productOnePrice}">💎 01 lần - ${formatCurrency(product.productOnePrice)}</option>` : ""}
                    ${product.productFivePrice > 0 ? `<option value="2" data-price="${product.productFivePrice}">📅 05 lần - ${formatCurrency(product.productFivePrice)}</option>` : ""}
                    ${product.productTenPrice > 0 ? `<option value="3" data-price="${product.productTenPrice}">🎯 10 lần - ${formatCurrency(product.productTenPrice)}</option>` : ""}
                </select>

                <button class="btn-purchase" onclick="purchaseLicense(${product.productID})">
                    🛒 Mua ngay
                </button>
            </div>
        </div>
    `,
    )
    .join("");
}

/**
 * Mua bản quyền
 */
async function purchaseLicense(productID) {
  const selectElement = document.getElementById(`license-type-${productID}`);
  const licenseType = parseInt(selectElement.value);
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const price = parseFloat(selectedOption.dataset.price);

  // ✅ CẬP NHẬT THÔNG TIN USER TRƯỚC KHI KIỂM TRA SỐ DƯ
  await refreshCurrentUser();

  // Xác nhận mua hàng
  const confirmMessage = `Bạn có chắc chắn muốn mua bản quyền này?\n\nGiá: ${formatCurrency(price)}\nSố dư hiện tại: ${formatCurrency(currentUser.totalMoney)}`;

  if (!confirm(confirmMessage)) {
    return;
  }

  // Kiểm tra số dư
  if (currentUser.totalMoney < price) {
    showAlert(
      "licenses-alert",
      `Số dư không đủ! Bạn cần thêm ${formatCurrency(price - currentUser.totalMoney)} để mua bản quyền này.`,
      "error",
    );
    return;
  }

  // ✅ TÌM BUTTON ĐÚNG CÁCH THAY VÌ DÙNG event.target
  const btn = document.querySelector(
    `button[onclick="purchaseLicense(${productID})"]`,
  );
  if (!btn) {
    console.error("Không tìm thấy button");
    return;
  }

  const originalText = btn.innerHTML;

  try {
    // Disable button
    btn.disabled = true;
    btn.innerHTML = "⏳ Đang xử lý...";

    // ✅ apiCall ĐÃ TRẢ VỀ JSON RỒI, KHÔNG CẦN .json() NỮA
    const data = await apiCall("/licenses/purchase", {
      method: "POST",
      body: JSON.stringify({
        productID: productID,
        licenseType: licenseType,
      }),
    });

    if (data.success) {
      // ✅ LẤY TÊN SẢN PHẨM TỪ BUTTON CONTAINER
      const productCard = btn.closest(".product-card");
      const productName = productCard
        ? productCard.querySelector("h3").textContent
        : "Sản phẩm";

      // ✅ HIỂN THỊ MODAL THÀNH CÔNG
      showSuccessModal(data.data.license.licenseKey, productName, price);

      // Cập nhật số dư
      currentUser.totalMoney = data.data.newBalance;
      localStorage.setItem("user", JSON.stringify(currentUser));

      // Reload danh sách bản quyền và profile
      await loadUserLicenses();
      await loadProfile();
    } else {
      showAlert("licenses-alert", data.message, "error");
    }
  } catch (error) {
    console.error("❌ Error purchasing license:", error);
    showAlert(
      "licenses-alert",
      "Không thể mua bản quyền. Vui lòng thử lại!",
      "error",
    );
  } finally {
    // ✅ LUÔN LUÔN ENABLE LẠI BUTTON TRONG FINALLY
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/**
 * Load danh sách bản quyền của user
 */
async function loadUserLicenses() {
  try {
    const data = await apiCall("/licenses/my-licenses", {
      method: "GET",
    });

    if (data.success) {
      displayUserLicenses(data.data);
    } else {
      showAlert("licenses-alert", data.message, "error");
    }
  } catch (error) {
    console.error("❌ Error loading user licenses:", error);
    showAlert("licenses-alert", "Không thể tải danh sách bản quyền", "error");
  }
}

/**
 * Hiển thị danh sách bản quyền của user
 */
function displayUserLicenses(licenses) {
  const container = document.getElementById("my-licenses-container");

  if (licenses.length === 0) {
    container.innerHTML = `
            <div class="no-licenses">
                <div class="no-licenses-icon">🔑</div>
                <p>Bạn chưa mua bản quyền nào</p>
            </div>
        `;
    return;
  }

  container.innerHTML = `
        <table class="my-licenses-table">
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th>Key bản quyền</th>
                    <th>Giá</th>
                    <th>Ngày mua</th>
					<th>Ngày kích hoạt</th>
					<th>Số lần còn lại</th>
					<th>Trạng thái</th>
                </tr>
            </thead>
            <tbody>
                ${licenses
                  .map(
                    (license) => `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${license.productImage}" 
                                     style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover;"
                                     onerror="this.src='https://via.placeholder.com/40x40/667eea/ffffff?text=P'">
                                <span>${license.productName}</span>
                            </div>
                        </td>
                        <td>
                            <span class="license-key" title="Click để copy" onclick="copyLicenseKey('${license.licenseKey}')">
                                ${license.licenseKey}
                            </span>
                        </td>
                        <td>${formatCurrency(license.pricePaid)}</td>
                        <td>${formatDateTime(license.purchaseTime)}</td>
						<td>${license.activeTime ? formatDateTime(license.activeTime) : "-"}</td>
						<td>${license.countDown ? license.countDown : "-"}</td>
						<td>
                            <span class="license-status ${getLicenseStatusClass(license.licenseStatus)}">
                                ${getLicenseStatusText(license.licenseStatus)}
                            </span>
                        </td>
                    </tr>
                `,
                  )
                  .join("")}
            </tbody>
        </table>
    `;
}

/**
 * Get license status class for styling
 */
function getLicenseStatusClass(status) {
  if (status === "1" || status === 1) return "active";
  if (status === "0" || status === 0) return "inactive";
  if (status === "2" || status === 2) return "expired";
  return "inactive";
}

function getLicenseStatusText(status) {
  const map = {
    0: "Chưa kích hoạt",
    1: "Hoạt động",
    2: "Hết hạn",
  };
  return map[status] ?? "Không xác định";
}
/**
 * Copy license key to clipboard
 */
function copyLicenseKey(licenseKey) {
  navigator.clipboard
    .writeText(licenseKey)
    .then(() => {
      alert("✅ Đã copy Key bản quyền: " + licenseKey);
    })
    .catch((err) => {
      console.error("❌ Error copying license key:", err);
      alert("❌ Không thể copy Key bản quyền");
    });
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

/**
 * Format date time
 */
function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ════════════════════════════════════════════════════════════════
// DEPOSIT SYSTEM (PAYOS)
// ════════════════════════════════════════════════════════════════

async function createPayOSDepositRequest() {
  const amountInput = document.getElementById("deposit-amount");
  const amount = parseInt(amountInput.value);

  // PayOS constraint: minimum amount depends on config, but 10k is typical safe minimum
  if (!amount || amount < 10000) {
    alert("Vui lòng nhập số tiền hợp lệ (tối thiểu 10.000 VNĐ)");
    return;
  }

  try {
    const createBtn = document.querySelector(
      'button[onclick="createPayOSDepositRequest()"]',
    );
    createBtn.disabled = true;
    createBtn.textContent = "⏳ ĐANG TẠO YÊU CẦU...";

    const data = await apiCall("/payos/create", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });

    if (data.success && data.checkoutUrl) {
      const checkoutLink = document.getElementById("payos-checkout-link");
      checkoutLink.href = data.checkoutUrl;

      document.getElementById("deposit-qr-area").style.display = "block";

      // Cuộn xuống vùng hiển thị nút thanh toán
      document
        .getElementById("deposit-qr-area")
        .scrollIntoView({ behavior: "smooth" });

      // Optionally, automatically open the link in a new tab:
      // window.open(data.checkoutUrl, '_blank');
    } else {
      alert("Lỗi: " + (data.message || "Không thể tạo yêu cầu nạp tiền PayOS"));
    }
  } catch (error) {
    console.error("❌ Lỗi tạo yêu cầu nạp tiền:", error);
    alert("Có lỗi xảy ra khi kết nối đến máy chủ");
  } finally {
    const createBtn = document.querySelector(
      'button[onclick="createPayOSDepositRequest()"]',
    );
    createBtn.disabled = false;
    createBtn.textContent = "✨ TẠO MÃ QR THANH TOÁN TỰ ĐỘNG";
  }
}
async function cancelPayOSDeposit(addInfo) {
  if (!confirm("Bạn có chắc chắn muốn hủy giao dịch nạp tiền này?")) return;
  try {
    const response = await apiCall("/payos/cancel", {
      method: "POST",
      body: JSON.stringify({ addInfo }),
    });
    if (response.success) {
      showAlert("Đã hủy giao dịch nạp tiền", "success");
      loadDepositHistory();
    } else {
      showAlert(response.message || "Lỗi khi hủy giao dịch", "error");
    }
  } catch (error) {
    console.error("Cancel PayOS Error:", error);
    showAlert("Lỗi khi hủy giao dịch", "error");
  }
}

// ════════════════════════════════════════════════════════════════
// DEPOSIT TAB SWITCHING
// ════════════════════════════════════════════════════════════════

function showDepositTab(tabName, btnElement) {
  // Ẩn tất cả tab trong hub-deposit
  document.querySelectorAll(".deposit-tab").forEach((tab) => {
    tab.style.display = "none";
    tab.classList.remove("active");
  });

  // Bỏ active tất cả sub-menu items trong hub-deposit
  const hubDeposit = document.getElementById("hub-deposit");
  if (hubDeposit) {
    hubDeposit.querySelectorAll(".sub-menu-item").forEach((item) => {
      item.classList.remove("active");
    });
  }

  // Hiện tab được chọn
  const targetTab = document.getElementById("deposit-tab-" + tabName);
  if (targetTab) {
    targetTab.style.display = "block";
    targetTab.classList.add("active");
  }

  // Active button
  if (btnElement) {
    btnElement.classList.add("active");
  }

  // Load data tương ứng
  if (tabName === "create") {
    const qrArea = document.getElementById("deposit-qr-area");
    if (qrArea) qrArea.style.display = "none";
    const amountInput = document.getElementById("deposit-amount");
    if (amountInput) amountInput.value = "";
  } else if (tabName === "history") {
    loadDepositHistory();
  }
}

async function loadDepositHistory() {
  const tbody = document.getElementById("deposit-history-body");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="4" style="text-align: center;">⏳ Đang tải lịch sử...</td></tr>';

  try {
    const data = await apiCall("/payos/history");

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" style="text-align: center;">Chưa có giao dịch nào</td></tr>';
        return;
      }

      tbody.innerHTML = data.data
        .map((item) => {
          let statusHtml = "";

          let actionHtml = "";
          if (item.status == 0) {
            statusHtml =
              '<span class="badge badge-warning" style="margin-right: 10px;">⏳ Chờ thanh toán</span>';
            actionHtml = ``;
            if (item.cashLink) {
              actionHtml += `<a href="${item.cashLink}" class="btn btn-sm" style="padding: 2px 8px; font-size: 12px; height: 15px; background: #00d2ff; color: #fff; text-decoration: none; margin-right: 5px; border-radius: 4px;" target="_blank">Tiếp tục thanh toán</a>`;
            }
            actionHtml += `<button class="btn btn-sm btn-danger" style="padding: 2px 8px; font-size: 12px; height: 15px;" onclick="cancelPayOSDeposit('${item.addInfo}')">Hủy</button>`;
          } else if (item.status == 1) {
            statusHtml =
              '<span class="badge badge-success">✅ Thanh toán thành công</span>';
          } else if (item.status == 2) {
            statusHtml =
              '<span class="badge badge-danger" style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px;">❌ Đã hủy</span>';
          } else {
            statusHtml = `<span class="badge badge-secondary">Trạng thái: ${item.status}</span>`;
          }

          return `
                    <tr>
                        <td>${item.createdAt}</td>
                        <td><code style="color: #667eea; font-weight: bold;">${item.addInfo}</code></td>
                        <td style="font-weight: bold;">${formatCurrency(item.amount)}</td>
                        <td>
                            <div style="display: flex; align-items: center;">
                                ${statusHtml}
                                ${actionHtml}
                            </div>
                        </td>
                    </tr>
                `;
        })
        .join("");
    } else {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">❌ Lỗi: ${data.message}</td></tr>`;
    }
  } catch (error) {
    console.error("❌ Lỗi tải lịch sử nạp tiền:", error);
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align: center; color: red;">❌ Lỗi kết nối máy chủ</td></tr>';
  }
}

// ════════════════════════════════════════════════════════════════
// ZALO ACCOUNT STATUS CHECK (COMMON)
// ════════════════════════════════════════════════════════════════

async function loadCheckStatusZaloAccounts(
  selectId,
  alertId,
  includeSystem = false,
) {
  const select = document.getElementById(selectId);
  if (!select) return;

  try {
    const data = await apiCall("/send-image-v2/zalo-accounts");
    let html = '<option value="">-- Chọn tài khoản Zalo để check --</option>';

    if (includeSystem) {
      html += `<option value="SYSTEM" style="color: #007bff; font-weight: bold;">🏢 Sử dụng tài khoản hệ thống - Không cần tài khoản Zalo</option>`;
    }

    if (data.success && data.data && data.data.length > 0) {
      const activeAccounts = data.data.filter(
        (account) => account.accStatus === "Đang hoạt động",
      );
      activeAccounts.forEach((account) => {
        if (account.isSystemAccount) return;
        html += `<option value="${account.UID}">${account.displayName} - SĐT: ${account.phoneNumber || "N/A"}</option>`;
      });
    }
    select.innerHTML = html;
  } catch (error) {
    console.error("Load Check Status Accounts Error:", error);
    select.innerHTML = '<option value="">Lỗi tải danh sách</option>';
  }
}

// ════════════════════════════════════════════════════════════════
// 3-STEP ZALO STATUS CHECK (PHONE)
// ════════════════════════════════════════════════════════════════

function showCheckPhoneStep(step) {
  const s1 = document.getElementById("check-phone-step-1");
  const s2 = document.getElementById("check-phone-step-2");
  const s3 = document.getElementById("check-phone-step-3");
  if (s1) s1.style.display = step === 1 ? "block" : "none";
  if (s2) s2.style.display = step === 2 ? "block" : "none";
  if (s3) s3.style.display = step === 3 ? "block" : "none";

  [1, 2, 3].forEach((i) => {
    const el = document.getElementById("check-phone-step-" + i + "-indicator");
    if (el) {
      el.classList.toggle("active", step >= i);
      el.classList.toggle("completed", step > i);
    }
  });
}

async function checkZaloStatusPhoneStep1() {
  const btn = document.getElementById("check-status-phone-next-btn");
  const phoneNumber = document
    .getElementById("check-status-phone-number")
    .value.trim();
  const zaloUID = document.getElementById("check-status-phone-account").value;
  const alertId = "check-status-phone-alert";

  if (!phoneNumber || !zaloUID) {
    showZaloAlert(
      alertId,
      "Vui lòng nhập SĐT và chọn tài khoản Zalo!",
      "error",
    );
    return;
  }

  btn.disabled = true;
  btn.innerHTML = "⏳ Đang tìm kiếm...";

  try {
    const response = await apiCall("/check-status/pre-check", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, zaloUID, type: "phone" }),
    });

    if (response.success) {
      currentCheckPhoneData = response.data;
      const profile = response.data.profile;

      // Cập nhật thông tin profile
      document.getElementById("check-phone-confirm-avatar").src =
        profile.avatar || "https://via.placeholder.com/80";
      document.getElementById("check-phone-confirm-name").textContent =
        profile.displayName;
      document.getElementById("check-phone-confirm-uid").textContent =
        profile.userId;
      document.getElementById("check-phone-confirm-phone").textContent =
        phoneNumber;

      // Cập nhật tài khoản gửi
      const select = document.getElementById("check-status-phone-account");
      document.getElementById("check-phone-confirm-sender").textContent =
        select.options[select.selectedIndex].text;

      const feeInfoDiv = document.getElementById(
        "check-phone-confirm-fee-info",
      );
      if (feeInfoDiv) {
        const accountType = response.data.isSystemAccount
          ? '<span style="color: #007bff;">Tài khoản hệ thống</span>'
          : '<span style="color: #28a745;">Tài khoản của bạn</span>';

        feeInfoDiv.innerHTML = `
                        <div style="background: #fff3cd; color: #000; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                            <h4 style="margin: 0 0 10px 0; color: #856404;">Thông tin chi tiết về yêu cầu</h4>
                            <p style="margin: 5px 0;"><strong>Loại tài khoản lựa chọn:</strong> ${accountType}</p>
                            <p style="margin: 5px 0;"><strong>Phí check trạng thái:</strong> <span style="color: #d32f2f; font-weight: bold;">${response.data.fee.toLocaleString("vi-VN")} ₫</span></p>
                            <p style="margin: 5px 0;"><strong>Số dư hiện tại:</strong> ${response.data.currentBalance.toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 5px 0;"><strong>Số dư sau khi trừ:</strong> ${(response.data.currentBalance - response.data.fee).toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
                                ⚠️ <strong>Lưu ý:</strong> Phí chỉ được trừ khi gửi yêu cầu thành công
                            </p>
                        </div>
                    `;
      }
      showCheckPhoneStep(2);
    } else {
      showZaloAlert(
        alertId,
        response.message || "Không tìm thấy người dùng này",
        "error",
      );
    }
  } catch (error) {
    console.error("Check Status Phone Error:", error);
    showZaloAlert(alertId, "Lỗi khi tìm kiếm", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Tiếp tục ➔";
  }
}

async function checkZaloStatusPhoneStep2() {
  const btn = document.getElementById("check-status-phone-confirm-btn");
  const alertId = "check-status-phone-alert";
  const resultId = "check-status-phone-result";
  const phoneNumber = document
    .getElementById("check-status-phone-number")
    .value.trim();
  const zaloUID = document.getElementById("check-status-phone-account").value;

  if (!currentCheckPhoneData) return;

  btn.disabled = true;
  btn.innerHTML = "⏳ Đang kiểm tra & trừ tiền...";

  try {
    const response = await apiCall("/check-status/confirm", {
      method: "POST",
      body: JSON.stringify({
        targetUserId: currentCheckPhoneData.profile.userId,
        zaloUID: zaloUID,
        type: "phone",
        phoneNumber: phoneNumber,
      }),
    });

    if (response.success) {
      currentUser.totalMoney = response.newBalance;
      localStorage.setItem("user", JSON.stringify(currentUser));
      await loadProfile();
      renderCheckStatusResult(resultId, response.data);
      showCheckPhoneStep(3);
      showZaloAlert(alertId, "Kiểm tra trạng thái thành công!", "success");
    } else {
      showZaloAlert(alertId, response.message || "Lỗi khi xác nhận", "error");
    }
  } catch (error) {
    console.error("Check Status Phone Step 2 Error:", error);
    showZaloAlert(alertId, "Lỗi hệ thống khi xác nhận", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "✅ Xác nhận & Kiểm tra";
  }
}

function resetCheckPhone() {
  const input = document.getElementById("check-status-phone-number");
  if (input) input.value = "";
  currentCheckPhoneData = null;
  showCheckPhoneStep(1);
  showZaloAlert("check-status-phone-alert", "");
}

// ════════════════════════════════════════════════════════════════
// 3-STEP ZALO STATUS CHECK (CARD)
// ════════════════════════════════════════════════════════════════

function showCheckCardStep(step) {
  const s1 = document.getElementById("check-card-step-1");
  const s2 = document.getElementById("check-card-step-2");
  const s3 = document.getElementById("check-card-step-3");
  if (s1) s1.style.display = step === 1 ? "block" : "none";
  if (s2) s2.style.display = step === 2 ? "block" : "none";
  if (s3) s3.style.display = step === 3 ? "block" : "none";

  [1, 2, 3].forEach((i) => {
    const el = document.getElementById("check-card-step-" + i + "-indicator");
    if (el) {
      el.classList.toggle("active", step >= i);
      el.classList.toggle("completed", step > i);
    }
  });
}

async function checkZaloStatusCardStep1() {
  const btn = document.getElementById("check-status-card-next-btn");
  const encryptedFid = document
    .getElementById("check-status-card-fid")
    .value.trim();
  const zaloUID = document.getElementById("check-status-card-account").value;
  const alertId = "check-status-card-alert";

  if (!encryptedFid || !zaloUID) {
    showZaloAlert(
      alertId,
      "Vui lòng nhập PARAMS và chọn tài khoản Zalo!",
      "error",
    );
    return;
  }

  btn.disabled = true;
  btn.innerHTML = "⏳ Đang giải mã & tìm kiếm...";

  try {
    const response = await apiCall("/check-status/pre-check", {
      method: "POST",
      body: JSON.stringify({ encryptedFid, zaloUID, type: "card" }),
    });

    if (response.success) {
      currentCheckCardData = response.data;
      const profile = response.data.profile;

      // Cập nhật thông tin profile
      document.getElementById("check-card-confirm-avatar").src =
        profile.avatar || "https://via.placeholder.com/80";
      document.getElementById("check-card-confirm-name").textContent =
        profile.displayName;
      document.getElementById("check-card-confirm-uid").textContent =
        profile.userId;

      // Cập nhật tài khoản gửi
      const select = document.getElementById("check-status-card-account");
      document.getElementById("check-card-confirm-sender").textContent =
        select.options[select.selectedIndex].text;

      const feeInfoDiv = document.getElementById("check-card-confirm-fee-info");
      if (feeInfoDiv) {
        const accountType = response.data.isSystemAccount
          ? '<span style="color: #007bff;">Tài khoản hệ thống</span>'
          : '<span style="color: #28a745;">Tài khoản của bạn</span>';

        feeInfoDiv.innerHTML = `
                        <div style="background: #fff3cd; color: #000; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107;">
                            <h4 style="margin: 0 0 10px 0; color: #856404;">Thông tin chi tiết về yêu cầu</h4>
                            <p style="margin: 5px 0;"><strong>Loại tài khoản lựa chọn:</strong> ${accountType}</p>
                            <p style="margin: 5px 0;"><strong>Phí check trạng thái:</strong> <span style="color: #d32f2f; font-weight: bold;">${response.data.fee.toLocaleString("vi-VN")} ₫</span></p>
                            <p style="margin: 5px 0;"><strong>Số dư hiện tại:</strong> ${response.data.currentBalance.toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 5px 0;"><strong>Số dư sau khi trừ:</strong> ${(response.data.currentBalance - response.data.fee).toLocaleString("vi-VN")} ₫</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #856404;">
                                ⚠️ <strong>Lưu ý:</strong> Phí chỉ được trừ khi gửi yêu cầu thành công
                            </p>
                        </div>
                    `;
      }
      showCheckCardStep(2);
    } else {
      showZaloAlert(
        alertId,
        response.message || "Không thể lấy thông tin!",
        "error",
      );
    }
  } catch (error) {
    console.error("Check Status Card Error:", error);
    showZaloAlert(alertId, "Lỗi khi tìm kiếm", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Tiếp tục ➔";
  }
}

async function checkZaloStatusCardStep2() {
  const btn = document.getElementById("check-status-card-confirm-btn");
  const alertId = "check-status-card-alert";
  const resultId = "check-status-card-result";
  const zaloUID = document.getElementById("check-status-card-account").value;

  if (!currentCheckCardData) return;

  btn.disabled = true;
  btn.innerHTML = "⏳ Đang kiểm tra & trừ tiền...";

  try {
    const response = await apiCall("/check-status/confirm", {
      method: "POST",
      body: JSON.stringify({
        targetUserId: currentCheckCardData.profile.userId,
        zaloUID: zaloUID,
        type: "card",
      }),
    });

    if (response.success) {
      currentUser.totalMoney = response.newBalance;
      localStorage.setItem("user", JSON.stringify(currentUser));
      await loadProfile();
      renderCheckStatusResult(resultId, response.data);
      showCheckCardStep(3);
      showZaloAlert(alertId, "Kiểm tra trạng thái thành công!", "success");
    } else {
      showZaloAlert(alertId, response.message || "Lỗi khi xác nhận", "error");
    }
  } catch (error) {
    console.error("Check Status Card Step 2 Error:", error);
    showZaloAlert(alertId, "Lỗi hệ thống khi xác nhận", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = "✅ Xác nhận & Kiểm tra";
  }
}

function resetCheckCard() {
  const input = document.getElementById("check-status-card-fid");
  if (input) input.value = "";
  currentCheckCardData = null;
  showCheckCardStep(1);
  showZaloAlert("check-status-card-alert", "");
}

function renderCheckStatusResult(resultAreaId, data) {
  const resultArea = document.getElementById(resultAreaId);
  if (!resultArea) return;

  let lastOnlineText = "Không xác định";
  if (data.lastOnline) {
    lastOnlineText = new Date(data.lastOnline).toLocaleString("vi-VN");
  } else if (data.lastOnline === 0) {
    lastOnlineText = '<span style="color: #28a745;">🟢 Đang trực tuyến</span>';
  }

  resultArea.innerHTML = `
        <div style="background: rgba(0, 210, 255, 0.05); border: 1px solid #00d2ff; padding: 15px; border-radius: 10px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${data.avatar || "https://via.placeholder.com/80"}" style="width: 70px; height: 70px; border-radius: 50%;">
                <div>
                    <h3 style="margin: 0; color: #00d2ff;">${data.displayName || "N/A"}</h3>
                    <p style="margin: 5px 0;">ID: ${data.userId}</p>
                    <p style="margin: 0; font-weight: bold;">Lần cuối: ${lastOnlineText}</p>
                </div>
            </div>
        </div>
    `;
  resultArea.style.display = "block";
}

window.loadCheckStatusZaloAccounts = loadCheckStatusZaloAccounts;

