// Derived analysis copy. Original: recovered/ZL_SERVER/utils/sanitize.js
// ════════════════════════════════════════════════════════════════
// SANITIZE UTILITIES - Lọc dữ liệu nhạy cảm trước khi trả về client
// ════════════════════════════════════════════════════════════════

/**
 * Lọc thông tin user, loại bỏ các trường nhạy cảm
 * @param {Object} user - User object từ database
 * @returns {Object} - User object đã được lọc an toàn
 */
function sanitizeUser(user) {
  if (!user) return null;
  return {
    userID: user.userID,
    userName: user.userName,
    email: user.email,
    userRole: user.userRole,
    totalMoney: user.totalMoney,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: user.isActive
    // ❌ KHÔNG trả về:
    // - password / hashedPassword
    // - jwt / refreshToken
    // - lastIP
    // - các trường nhạy cảm khác
  };
}

/**
 * Lọc danh sách users
 * @param {Array} users - Mảng user objects
 * @returns {Array} - Mảng users đã được lọc
 */
function sanitizeUsers(users) {
  if (!Array.isArray(users)) return [];
  return users.map(user => sanitizeUser(user));
}

/**
 * Lọc thông tin Zalo account - CHỈ trả thông tin cơ bản
 * @param {Object} account - Zalo account object
 * @returns {Object} - Account đã được lọc
 */
function sanitizeZaloAccount(account) {
  if (!account) return null;
  return {
    UID: account.UID,
    displayName: account.displayName,
    phoneNumber: account.phoneNumber,
    Avatar: account.Avatar,
    accStatus: account.accStatus,
    ImportTime: account.ImportTime,
    isSystemAccount: account.isSystemAccount
    // Từ join table user_link_zalo_account
    // ❌ KHÔNG trả về (CỰC KỲ NHẠY CẢM):
    // - IMEI (device identifier)
    // - ENCRYPTION_KEY (khóa mã hóa AES)
    // - COOKIE_ZPW_SEK (session cookie Zalo)
    // - accessToken / refreshToken
    // - Các thông tin xác thực khác
  };
}

/**
 * Lọc Zalo account cho mục đích internal use (vẫn cần IMEI, keys để gọi API)
 * CHỈ dùng trong server, KHÔNG BAO GIỜ trả về client
 * @param {Object} account - Zalo account object
 * @returns {Object} - Account config để dùng trong server
 */
function getZaloAccountConfig(account) {
  if (!account) return null;

  // Object này CHỈ dùng trong server để gọi API
  // KHÔNG BAO GIỜ được trả về client
  return {
    UID: account.UID,
    IMEI: account.IMEI,
    ENCRYPTION_KEY: account.ENCRYPTION_KEY,
    COOKIE_ZPW_SEK: account.COOKIE_ZPW_SEK,
    displayName: account.displayName // Để log
  };
}

/**
 * Lọc thông tin user profile (cho getProfile API)
 * @param {Object} user - User object
 * @returns {Object} - User profile đã được lọc
 */
function sanitizeUserProfile(user) {
  if (!user) return null;
  return {
    userID: user.userID,
    userName: user.userName,
    email: user.email,
    totalMoney: user.totalMoney,
    userRole: user.userRole,
    createdAt: user.createdAt,
    isActive: user.isActive,
    lastLogin: user.lastLogin
    // ❌ KHÔNG trả về:
    // - lastIP (thông tin nhạy cảm về địa chỉ IP)
    // - lastLogin (có thể dùng cho tracking)
    // - password / hashedPassword
  };
}

/**
 * Lọc thông tin user cho login/register response
 * @param {Object} user - User object
 * @param {String} token - JWT token
 * @returns {Object} - Login data đã được lọc
 */
function sanitizeAuthResponse(user, token) {
  return {
    userID: user.userID,
    userName: user.userName,
    email: user.email,
    userRole: user.userRole,
    token: token
  };
}

/**
 * Lọc danh sách Zalo accounts
 * @param {Array} accounts - Mảng Zalo account objects
 * @returns {Array} - Mảng accounts đã được lọc
 */
function sanitizeZaloAccounts(accounts) {
  if (!Array.isArray(accounts)) return [];
  return accounts.map(account => sanitizeZaloAccount(account));
}

/**
 * Lọc thông tin tool setup
 * @param {Object} toolSetup - Tool setup object
 * @returns {Object} - Tool setup đã được lọc
 */
function sanitizeToolSetup(toolSetup) {
  if (!toolSetup) return null;
  return {
    setupID: toolSetup.setupID,
    zaloAccountID: toolSetup.zaloAccountID,
    deviceName: toolSetup.deviceName,
    deviceStatus: toolSetup.deviceStatus,
    settings: toolSetup.settings,
    createdAt: toolSetup.createdAt,
    updatedAt: toolSetup.updatedAt
    // ❌ KHÔNG trả về:
    // - API keys nếu có trong settings
    // - Private tokens
  };
}

/**
 * Mask các trường nhạy cảm khi logging
 * @param {Object} obj - Object cần mask
 * @returns {Object} - Object đã được mask
 */
function maskSensitiveData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = {
    ...obj
  };
  const sensitiveKeys = ['password', 'pwd', 'secret', 'token', 'jwt', 'refreshToken', 'accessToken', 'apiKey', 'privateKey', 'hashedPassword'];
  sensitiveKeys.forEach(key => {
    if (copy[key]) {
      copy[key] = '******';
    }
  });
  return copy;
}
module.exports = {
  sanitizeUser,
  sanitizeUsers,
  sanitizeZaloAccount,
  sanitizeZaloAccounts,
  sanitizeToolSetup,
  maskSensitiveData,
  getZaloAccountConfig,
  sanitizeUserProfile,
  sanitizeAuthResponse
};
