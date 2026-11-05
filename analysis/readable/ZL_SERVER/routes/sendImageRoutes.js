// Derived analysis copy. Original: recovered/ZL_SERVER/routes/sendImageRoutes.js
// ════════════════════════════════════════════════════════════════
// SEND IMAGE ROUTES - GỬI HÌNH ẢNH ZALO
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const sendImageController = require('../controllers/sendImageController');

// ⚠️ authMiddleware đã được áp dụng ở server.js, không cần ở đây nữa

// POST /api/send-image - Gửi hình ảnh đến số điện thoại
router.post('/', sendImageController.sendImageToPhone);

// GET /api/send-image/history - Lấy lịch sử gửi ảnh
router.get('/history', sendImageController.getSendHistory);

// GET /api/send-image/stats - Lấy thống kê
router.get('/stats', sendImageController.getSendStats);
module.exports = router;
