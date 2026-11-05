// Derived analysis copy. Original: recovered/ZL_SERVER/routes/authRoutes.js
// ════════════════════════════════════════════════════════════════
// AUTH ROUTES - ĐĂNG KÝ, ĐĂNG NHẬP
// ĐÃ CẬP NHẬT: Thêm Rate Limiting cho login và CSRF token endpoint
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  authMiddleware
} = require('../middleware/auth');
const {
  loginLimiter
} = require('../middleware/rateLimiter');
const {
  getCsrfToken
} = require('../middleware/csrf');

// Public routes
router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login); // ✅ Rate limit: 5 lần/15 phút

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/change-password', authMiddleware, authController.changePassword);

// ✅ CSRF Token endpoint - Client gọi để lấy token
router.get('/csrf-token', authMiddleware, getCsrfToken);
module.exports = router;
