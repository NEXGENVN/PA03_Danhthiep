// Derived analysis copy. Original: recovered/ZL_SERVER/middleware/ipWhitelist.js
// ════════════════════════════════════════════════════════════════
// IP WHITELIST MIDDLEWARE - CHỈ CHẤP NHẬN TỪ INTERNAL SERVER
// ════════════════════════════════════════════════════════════════

/**
 * Middleware chỉ cho phép requests từ localhost (127.0.0.1 hoặc ::1)
 * Tất cả requests khác sẽ bị từ chối với lỗi 403 Forbidden
 */
const ipWhitelistMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Normalize IPv6 loopback to IPv4
  const normalizedIP = clientIP === '::1' || clientIP === '::ffff:127.0.0.1' ? '127.0.0.1' : clientIP;

  // Chỉ cho phép localhost
  const allowedIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (allowedIPs.includes(clientIP) || normalizedIP === '127.0.0.1') {
    const expectedAuthKey = process.env.INTERNAL_AUTH_KEY;
    if (req.headers['x-internal-auth'] === expectedAuthKey) {
      // Request từ localhost và có mã hợp lệ - cho phép
      return next();
    } else {
      console.warn('⚠️ Unauthorized access attempt from local app missing auth header');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid or missing internal auth key.'
      });
    }
  }

  // Request từ IP khác - từ chối
  console.warn('⚠️ Unauthorized access attempt from IP:', clientIP);
  return res.status(403).json({
    success: false,
    message: 'Access denied. This service only accepts requests from internal server.',
    clientIP: clientIP
  });
};
module.exports = {
  ipWhitelistMiddleware
};
