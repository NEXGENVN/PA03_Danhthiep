// Derived analysis copy. Original: recovered/ZL_SERVER/routes/zaloAccountRoutes.js
// ════════════════════════════════════════════════════════════════
// ZALO ACCOUNT ROUTES - QUẢN LÝ TÀI KHOẢN ZALO
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const zaloAccountController = require('../controllers/zaloAccountController');
const zaloAccountAutoController = require('../controllers/zaloAccountAutoController');

// ⚠️ authMiddleware đã được áp dụng ở server.js, không cần ở đây nữa

// GET /api/zalo-accounts - Lấy danh sách tài khoản Zalo
router.get('/', zaloAccountController.getZaloAccounts);

// POST /api/zalo-accounts/auto-fetch - Tự động lấy thông tin tài khoản từ IMEI và Cookie
router.post('/auto-fetch', zaloAccountAutoController.createZaloAccountAuto);

// POST /api/zalo-accounts/check-all-status - Kiểm tra trạng thái tất cả tài khoản
// ⚠️ QUAN TRỌNG: Đặt trước routes có :uid để tránh bị match nhầm
router.post('/check-all-status', zaloAccountController.checkAllAccountsStatus);

// POST /api/zalo-accounts - Thêm tài khoản Zalo mới (thủ công)
router.post('/', zaloAccountController.createZaloAccount);

// GET /api/zalo-accounts/:uid - Lấy chi tiết 1 tài khoản
router.get('/:uid', zaloAccountController.getZaloAccount);

// PUT /api/zalo-accounts/:uid - Cập nhật tài khoản Zalo
router.put('/:uid', zaloAccountController.updateZaloAccount);

// DELETE /api/zalo-accounts/:uid - Xóa tài khoản Zalo
router.delete('/:uid', zaloAccountController.deleteZaloAccount);

// POST /api/zalo-accounts/:uid/check-status - Kiểm tra trạng thái 1 tài khoản
router.post('/:uid/check-status', zaloAccountController.checkAccountStatus);
module.exports = router;
