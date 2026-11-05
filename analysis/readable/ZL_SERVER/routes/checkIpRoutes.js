// Derived analysis copy. Original: recovered/ZL_SERVER/routes/checkIpRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const checkIpController = require('../controllers/checkIpController');
// Rate limiter: 10 requests per minute cho mỗi user
const checkIpLimiter = rateLimit({
  windowMs: 60000,
  // 1 minute
  max: 10,
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu kiểm tra IP. Vui lòng thử lại sau.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => {
    // Rate limit theo userID
    return req.user ? req.user.userID.toString() : req.ip;
  },
  handler: (req, res) => {
    console.log(`⚠️ Check IP rate limit exceeded for user ${req.user?.userID || req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu kiểm tra IP. Vui lòng thử lại sau 1 phút.',
      retryAfter: 60
    });
  }
});

/**
 * POST /api/check-ip/location
 * Check IP location từ kiemtraip.vn
 * Body: { ip: string }
 */
router.post('/location', checkIpLimiter, checkIpController.checkIpLocation);
module.exports = router;
