// ════════════════════════════════════════════════════════════════
// CAPTCHA ROUTES - TẠO VÀ KIỂM TRA CAPTCHA
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const captchaController = require('../controllers/captchaController');
const rateLimit = require('express-rate-limit');

// ════════════════════════════════════════════════════════════════
// RATE LIMITER CHO CAPTCHA
// Giới hạn số lượng CAPTCHA có thể tạo để tránh spam
// ════════════════════════════════════════════════════════════════

const captchaLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 10, // Tối đa 10 CAPTCHA/phút
    message: {
        success: false,
        message: 'Bạn đang yêu cầu CAPTCHA quá nhanh. Vui lòng đợi.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ════════════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ════════════════════════════════════════════════════════════════

/**
 * GET /api/captcha/generate
 * Tạo CAPTCHA mới
 * Query params:
 *   - purpose: 'register' | 'login' | 'admin_login'
 */
router.get('/generate', captchaLimiter, captchaController.generateCaptcha);

/**
 * GET /api/captcha/check-required
 * Kiểm tra xem có cần CAPTCHA không dựa trên số lần đăng nhập sai
 * Query params:
 *   - type: 'user' | 'admin'
 */
router.get('/check-required', captchaController.checkCaptchaRequired);

module.exports = router;
