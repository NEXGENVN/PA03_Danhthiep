// ════════════════════════════════════════════════════════════════
// RATE LIMITER MIDDLEWARE
// Giới hạn số lần gọi API để tránh spam và DDoS
// ════════════════════════════════════════════════════════════════

const rateLimit = require('express-rate-limit');

// ═══════════════════════════════════════════════════════════════
// RATE LIMIT CHUNG CHO TOÀN BỘ APP
// ═══════════════════════════════════════════════════════════════

const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS),
    max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS),
    message: 'Bạn đã gửi quá nhiều yêu cầu trong khoảng thời gian nhất định. Hãy thử lại sau 15 phút!',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Bỏ qua rate limit cho các api của admin và auth
        return req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth') || req.path === '/api/csrf-token';
    }
});

// ═══════════════════════════════════════════════════════════════
// RATE LIMIT CHO ĐĂNG NHẬP (CHỐNG BRUTE FORCE)
// ═══════════════════════════════════════════════════════════════

const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS),
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS),
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Rate limit theo IP cho login
        return req.ip;
    },
    handler: (req, res) => {
        console.log(`⚠️ Đã đạt giới hạn yêu cầu đăng nhập cho IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
            retryAfter: 900
        });
    }
});

module.exports = {
    loginLimiter,
    globalLimiter
};

