// Derived analysis copy. Original: recovered/ZL_SERVER/routes/sendImageByCardRoutes.js
// ════════════════════════════════════════════════════════════════
// SEND IMAGE BY CARD ROUTES
// Routes cho gửi ảnh qua danh thiếp
// ĐÃ CẬP NHẬT: Thêm Rate Limiting và CSRF Protection
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
  getPersonalAccounts,
  decodeFidAndGetProfile,
  sendImageByCardConfirmed
} = require('../controllers/sendImageByCardController');

// ⚠️ authMiddleware và csrfProtection đã được áp dụng ở server.js, không cần ở đây nữa

// GET /api/send-image-by-card/personal-accounts - Lấy danh sách tài khoản Zalo cá nhân
// Không cần rate limit vì chỉ là GET request đơn giản
router.get('/personal-accounts', getPersonalAccounts);

// POST /api/send-image-by-card/decode-fid - Giải mã chuỗi FID và lấy thông tin profile
// ✅ Áp dụng: Rate Limiting (10 req/phút) - Tương tự searchPhoneWithAccount
router.post('/decode-fid', decodeFidAndGetProfile);

// POST /api/send-image-by-card/send - Gửi ảnh qua danh thiếp
// ✅ Áp dụng: Rate Limiting (5 req/phút) - Tương tự sendImageConfirmed
router.post('/send', sendImageByCardConfirmed);
module.exports = router;
