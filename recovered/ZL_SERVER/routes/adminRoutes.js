// ════════════════════════════════════════════════════════════════
// ADMIN ROUTES - ĐỊNH TUYẾN API QUẢN TRỊ
// ĐÃ CẬP NHẬT: Thêm Rate Limiting và CSRF Protection
// ⚠️ LƯU Ý: Route /api/admin/login được định nghĩa trực tiếp trong server.js
//           để tránh áp dụng authMiddleware và csrfProtection
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminMiddleware } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');

// ════════════════════════════════════════════════════════════════
// PROTECTED ROUTES (Cần auth + admin role)
// ⚠️ authMiddleware và csrfProtection đã được áp dụng ở server.js
// ✅ Áp dụng: Admin Middleware + Rate Limiting (30 req/phút)
// ════════════════════════════════════════════════════════════════

// Áp dụng middleware cho tất cả admin routes
router.use(adminMiddleware); // ✅ Kiểm tra role admin
router.use(adminLimiter); // ✅ Rate limiting

/**
 * GET /api/admin/users
 * Lấy danh sách tất cả user
 */
router.get('/users', adminController.getAllUsers);

/**
 * GET /api/admin/users/:userID
 * Lấy thông tin chi tiết 1 user
 */
router.get('/users/:userID', adminController.getUserDetail);

/**
 * POST /api/admin/users
 * Tạo user mới
 */
router.post('/users', adminController.createUser);

/**
 * PUT /api/admin/users/:userID
 * Cập nhật thông tin user
 */
router.put('/users/:userID', adminController.updateUser);

/**
 * DELETE /api/admin/users/:userID
 * Xóa user
 */
router.delete('/users/:userID', adminController.deleteUser);

/**
 * GET /api/admin/stats
 * Lấy thống kê tổng quan hệ thống
 */
router.get('/stats', adminController.getSystemStats);

/**
 * GET /api/admin/tool-setup
 * Lấy cấu hình tool_setup
 */
router.get('/tool-setup', adminController.getToolSetup);

/**
 * PUT /api/admin/tool-setup
 * Cập nhật cấu hình tool_setup
 */
router.put('/tool-setup', adminController.updateToolSetup);

/**
 * GET /api/admin/zalo-accounts
 * Lấy danh sách tất cả tài khoản Zalo (để chọn làm tài khoản hệ thống)
 */
router.get('/zalo-accounts', adminController.getAllZaloAccounts);

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ IP BLOCKS
// ════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/ip-blocks
 * Lấy danh sách IP đang bị chặn
 */
router.get('/ip-blocks', adminController.getBlockedIPsList);

/**
 * POST /api/admin/ip-blocks
 * Chặn một IP thủ công
 * Body: { ipAddress, blockType, reason, blockMinutes }
 */
router.post('/ip-blocks', adminController.blockIPManual);

/**
 * DELETE /api/admin/ip-blocks/:ipAddress
 * Gỡ chặn một IP
 */
router.delete('/ip-blocks/:ipAddress', adminController.unblockIPAddress);

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ AUTO REQUESTS - Lịch sử gửi ảnh
// ════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/requests
 * Lấy danh sách tất cả các yêu cầu gửi ảnh trong hệ thống
 */
router.get('/requests', adminController.getAllAutoRequests);

module.exports = router;
