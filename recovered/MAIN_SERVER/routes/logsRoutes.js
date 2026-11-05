// ════════════════════════════════════════════════════════════════
// ROUTES: LOGS API
// Endpoint để xem logs và thống kê
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logsController');

// ════════════════════════════════════════════════════════════════
// USER LOGS ROUTES (Authenticated users)
// ════════════════════════════════════════════════════════════════

// GET /api/logs - Lấy logs của user hiện tại
router.get('/', logsController.getMyLogs);

// GET /api/logs/stats - Lấy thống kê logs của user hiện tại
router.get('/stats', logsController.getMyStats);

// ════════════════════════════════════════════════════════════════
// ADMIN LOGS ROUTES (Admin only - sẽ add middleware check admin sau)
// ════════════════════════════════════════════════════════════════

// GET /api/logs/admin/all - Lấy tất cả logs
router.get('/admin/all', logsController.getAllLogs);

// GET /api/logs/admin/user/:userID - Lấy logs của user cụ thể
router.get('/admin/user/:userID', logsController.getUserLogsById);

// GET /api/logs/admin/security - Lấy security alerts
router.get('/admin/security', logsController.getSecurityAlertsController);

// GET /api/logs/admin/system-stats - Lấy thống kê toàn hệ thống
router.get('/admin/system-stats', logsController.getSystemStats);

// GET /api/logs/admin/search - Tìm kiếm logs với filters
router.get('/admin/search', logsController.searchLogs);

// POST /api/logs/admin/cleanup - Xóa logs cũ
router.post('/admin/cleanup', logsController.cleanupLogsController);

module.exports = router;
