// Derived analysis copy. Original: recovered/ZL_SERVER/routes/sendImageV2Routes.js
// ════════════════════════════════════════════════════════════════
// SEND IMAGE V2 ROUTES - VỚI CHỌN TÀI KHOẢN & XÁC NHẬN
// ĐÃ CẬP NHẬT: Thêm Rate Limiting và CSRF Protection
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
  getUserZaloAccounts,
  searchPhoneWithAccount,
  sendImageConfirmed
} = require('../controllers/sendImageV2Controller');

// ⚠️ authMiddleware và csrfProtection đã được áp dụng ở server.js, không cần ở đây nữa

// GET /api/send-image-v2/zalo-accounts - Lấy danh sách tài khoản Zalo
router.get('/zalo-accounts', getUserZaloAccounts);

// POST /api/send-image-v2/search - Tìm kiếm số điện thoại
// ✅ Áp dụng: Rate Limiting (10 req/phút)
router.post('/search', searchPhoneWithAccount);

// POST /api/send-image-v2/send - Gửi hình ảnh sau khi xác nhận
// ✅ Áp dụng: Rate Limiting (5 req/phút)
router.post('/send', sendImageConfirmed);
module.exports = router;
