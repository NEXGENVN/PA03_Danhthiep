// ════════════════════════════════════════════════════════════════
// CSRF PROTECTION MIDDLEWARE - ENHANCED VERSION
// Bảo vệ chống Cross-Site Request Forgery với Double-Submit Pattern
// ════════════════════════════════════════════════════════════════

const crypto = require('crypto');

// Store CSRF tokens in memory (trong production nên dùng Redis)
// Key format: `${userID}:${ip}` để bind token với cả user và IP
const csrfTokenStore = new Map();

// Thời gian hết hạn của CSRF token (1 giờ)
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════
// LẤY IP ADDRESS THẬT CỦA CLIENT
// ═══════════════════════════════════════════════════════════════

function getClientIP(req) {
    // Lấy IP từ Cloudflare header
    const cfIP = req.headers['cf-connecting-ip'];
    if (cfIP) return cfIP;
    
    // Fallback: X-Forwarded-For
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    // Fallback: X-Real-IP
    const realIP = req.headers['x-real-ip'];
    if (realIP) return realIP;
    
    // Fallback cuối: req.ip
    return req.ip || 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// TẠO CSRF TOKEN (DOUBLE-SUBMIT PATTERN)
// ═══════════════════════════════════════════════════════════════

function generateCsrfToken(userID, ip) {
    const token = crypto.randomBytes(32).toString('hex');
    const key = `${userID}:${ip}`;
    
    // Lưu token với userID + IP
    csrfTokenStore.set(key, {
        token: token,
        createdAt: Date.now(),
        userID: userID,
        ip: ip
    });
    
    console.log(`🔐 Generated CSRF token for user ${userID} from IP ${ip}`);
    return token;
}

// ═══════════════════════════════════════════════════════════════
// XÓA CSRF TOKEN CŨ (CLEANUP)
// ═══════════════════════════════════════════════════════════════

function cleanupExpiredTokens() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userID, data] of csrfTokenStore.entries()) {
        if (now - data.createdAt > CSRF_TOKEN_EXPIRY) {
            csrfTokenStore.delete(userID);
            cleaned++;
        }
    }
    
    if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired CSRF tokens`);
    }
}

// Chạy cleanup mỗi 10 phút
setInterval(cleanupExpiredTokens, 10 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE XÁC THỰC CSRF TOKEN (ENHANCED)
// ═══════════════════════════════════════════════════════════════

function csrfProtection(req, res, next) {
    // Bỏ qua CSRF check cho GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    
    // Lấy CSRF token từ header
    const csrfToken = req.headers['x-csrf-token'];
    
    if (!csrfToken) {
        console.log(`⚠️ Missing CSRF token from IP ${getClientIP(req)}`);
        return res.status(403).json({
            success: false,
            message: 'Thiếu CSRF token. Vui lòng tải lại trang.'
        });
    }
    
    // Lấy userID và IP
    const userID = req.user?.userID;
    if (!userID) {
        console.log('⚠️ No userID found in request');
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
    
    const clientIP = getClientIP(req);
    const key = `${userID}:${clientIP}`;
    
    const storedData = csrfTokenStore.get(key);
    
    if (!storedData) {
        console.log(`⚠️ No CSRF token found for user ${userID} from IP ${clientIP}`);
        return res.status(403).json({
            success: false,
            message: 'CSRF token không hợp lệ. Vui lòng tải lại trang.'
        });
    }
    
    // Kiểm tra token có hết hạn không
    if (Date.now() - storedData.createdAt > CSRF_TOKEN_EXPIRY) {
        csrfTokenStore.delete(key);
        console.log(`⚠️ Expired CSRF token for user ${userID}`);
        return res.status(403).json({
            success: false,
            message: 'CSRF token đã hết hạn. Vui lòng tải lại trang.'
        });
    }
    
    // So sánh token (constant-time comparison để chống timing attack)
    if (!crypto.timingSafeEqual(Buffer.from(csrfToken), Buffer.from(storedData.token))) {
        console.log(`⚠️ Invalid CSRF token for user ${userID}`);
        console.log(`   Expected: ${storedData.token.substring(0, 10)}...`);
        console.log(`   Received: ${csrfToken.substring(0, 10)}...`);
        return res.status(403).json({
            success: false,
            message: 'CSRF token không khớp. Có thể bị tấn công CSRF.'
        });
    }
    
    // Token hợp lệ - cho phép request tiếp tục
    console.log(`✅ Valid CSRF token for user ${userID} from IP ${clientIP}`);
    next();
}

// ═══════════════════════════════════════════════════════════════
// ENDPOINT LẤY CSRF TOKEN (CHO CLIENT)
// ═══════════════════════════════════════════════════════════════

function getCsrfToken(req, res) {
    if (!req.user || !req.user.userID) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }
    
    const clientIP = getClientIP(req);
    const token = generateCsrfToken(req.user.userID, clientIP);
    
    res.json({
        success: true,
        token: token,
        expiresIn: CSRF_TOKEN_EXPIRY / 1000 // seconds
    });
}

// ═══════════════════════════════════════════════════════════════
// TOKEN ROTATION - Tạo token mới sau các thao tác quan trọng
// ═══════════════════════════════════════════════════════════════

function rotateCsrfToken(req, res, next) {
    if (req.user && req.user.userID) {
        const clientIP = getClientIP(req);
        const newToken = generateCsrfToken(req.user.userID, clientIP);
        
        // Gửi token mới qua header response
        res.setHeader('X-New-CSRF-Token', newToken);
        console.log(`🔄 Rotated CSRF token for user ${req.user.userID}`);
    }
    next();
}

// ═══════════════════════════════════════════════════════════════
// XÓA CSRF TOKEN KHI LOGOUT hoặc ĐỔI IP
// ═══════════════════════════════════════════════════════════════

function removeCsrfToken(userID, ip = null) {
    if (ip) {
        // Xóa token cụ thể của user + IP
        const key = `${userID}:${ip}`;
        csrfTokenStore.delete(key);
        console.log(`🗑️ Removed CSRF token for user ${userID} from IP ${ip}`);
    } else {
        // Xóa tất cả tokens của user này (tất cả IPs)
        let deleted = 0;
        for (const [key, data] of csrfTokenStore.entries()) {
            if (data.userID === userID) {
                csrfTokenStore.delete(key);
                deleted++;
            }
        }
        console.log(`🗑️ Removed ${deleted} CSRF tokens for user ${userID}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// FORCE REGENERATE TOKEN (dùng khi phát hiện suspicious activity)
// ═══════════════════════════════════════════════════════════════

function forceRegenerateToken(req) {
    if (req.user && req.user.userID) {
        const clientIP = getClientIP(req);
        removeCsrfToken(req.user.userID, clientIP);
        const newToken = generateCsrfToken(req.user.userID, clientIP);
        console.log(`⚡ Force regenerated CSRF token for user ${req.user.userID}`);
        return newToken;
    }
    return null;
}

module.exports = {
    generateCsrfToken,
    csrfProtection,
    getCsrfToken,
    removeCsrfToken,
    rotateCsrfToken,
    forceRegenerateToken,
    getClientIP
};
