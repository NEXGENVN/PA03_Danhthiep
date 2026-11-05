// ════════════════════════════════════════════════════════════════
// MIDDLEWARE: API REQUEST LOGGER - IMPROVED VERSION
// Ghi nhận toàn bộ API requests vào database
// ════════════════════════════════════════════════════════════════

const db = require('../config/database');

// ════════════════════════════════════════════════════════════════
// HELPER: Lấy IP thực từ request (hỗ trợ proxy/CDN)
// ════════════════════════════════════════════════════════════════

function getClientIP(req) {
    // Cloudflare: CF-Connecting-IP
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }
    
    // Proxy tiêu chuẩn: X-Forwarded-For
    if (req.headers['x-forwarded-for']) {
        const ips = req.headers['x-forwarded-for'].split(',');
        return ips[0].trim();
    }
    
    // X-Real-IP (nginx)
    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'];
    }
    
    // Direct connection
    return req.ip || req.connection.remoteAddress || 'unknown';
}

// ════════════════════════════════════════════════════════════════
// HELPER: Sanitize request body (loại bỏ sensitive data)
// ════════════════════════════════════════════════════════════════

function sanitizeRequestBody(body) {
    if (!body || typeof body !== 'object') {
        return null;
    }
    
    const sanitized = { ...body };
    
    // Danh sách fields cần ẩn
    const sensitiveFields = [
        'password',
        'newPassword',
        'oldPassword',
        'confirmPassword',
        'zpw_sek',
        'COOKIE_ZPW_SEK',
        'ENCRYPTION_KEY',
        'accessToken',
        'refreshToken',
        'token',
        'secret',
        'apiKey'
    ];
    
    // Thay thế sensitive fields bằng [REDACTED]
    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }
    
    return sanitized;
}

// ════════════════════════════════════════════════════════════════
// HELPER: Xác định event type và category
// ════════════════════════════════════════════════════════════════

function determineEventInfo(req, res) {
    const path = req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    let eventType = 'API_REQUEST';
    let eventCategory = 'general';
    let eventDescription = `${method} ${path}`;
    
    // Auth events
    if (path.includes('/auth/login')) {
        eventType = statusCode === 200 ? 'AUTH_SUCCESS' : 'AUTH_FAILED';
        eventCategory = 'auth';
        eventDescription = statusCode === 200 ? 'User logged in' : 'Login failed';
    } else if (path.includes('/auth/register')) {
        eventType = statusCode === 201 ? 'USER_REGISTERED' : 'REGISTRATION_FAILED';
        eventCategory = 'auth';
        eventDescription = statusCode === 201 ? 'New user registered' : 'Registration failed';
    } else if (path.includes('/auth/logout')) {
        eventType = 'AUTH_LOGOUT';
        eventCategory = 'auth';
        eventDescription = 'User logged out';
    } else if (path.includes('/auth/change-password')) {
        eventType = statusCode === 200 ? 'PASSWORD_CHANGED' : 'PASSWORD_CHANGE_FAILED';
        eventCategory = 'auth';
        eventDescription = statusCode === 200 ? 'Password changed successfully' : 'Password change failed';
    }
    
    // Zalo account events
    else if (path.includes('/zalo-accounts')) {
        eventCategory = 'zalo';
        if (method === 'POST') {
            eventType = 'ZALO_ACCOUNT_ADDED';
            eventDescription = 'Zalo account added';
        } else if (method === 'PUT') {
            eventType = 'ZALO_ACCOUNT_UPDATED';
            eventDescription = 'Zalo account updated';
        } else if (method === 'DELETE') {
            eventType = 'ZALO_ACCOUNT_DELETED';
            eventDescription = 'Zalo account deleted';
        } else {
            eventType = 'ZALO_ACCOUNT_VIEWED';
            eventDescription = 'Zalo accounts viewed';
        }
    }
    
    // Image sending events
    else if (path.includes('/send-image')) {
        eventCategory = 'image';
        if (method === 'POST') {
            if (path.includes('/search')) {
                eventType = 'ZALO_SEARCH';
                eventDescription = 'Zalo phone search';
            } else {
                eventType = statusCode === 200 ? 'IMAGE_SENT' : 'IMAGE_SEND_FAILED';
                eventDescription = statusCode === 200 ? 'Image sent successfully' : 'Image send failed';
            }
        } else if (path.includes('/history')) {
            eventType = 'HISTORY_VIEWED';
            eventDescription = 'Send history viewed';
        } else if (path.includes('/stats')) {
            eventType = 'STATS_VIEWED';
            eventDescription = 'Stats viewed';
        }
    }
    
    // Admin events
    else if (path.includes('/admin')) {
        eventCategory = 'admin';
        if (path.includes('/users')) {
            if (method === 'POST') {
                eventType = 'ADMIN_USER_CREATED';
                eventDescription = 'Admin created new user';
            } else if (method === 'PUT') {
                eventType = 'ADMIN_USER_UPDATED';
                eventDescription = 'Admin updated user';
            } else if (method === 'DELETE') {
                eventType = 'ADMIN_USER_DELETED';
                eventDescription = 'Admin deleted user';
            } else {
                eventType = 'ADMIN_USERS_VIEWED';
                eventDescription = 'Admin viewed users';
            }
        } else if (path.includes('/stats')) {
            eventType = 'ADMIN_STATS_VIEWED';
            eventDescription = 'Admin viewed system stats';
        } else if (path.includes('/security')) {
            eventType = 'ADMIN_SECURITY_ACTION';
            eventDescription = 'Admin performed security action';
        }
    }
    
    // CAPTCHA events
    else if (path.includes('/captcha')) {
        eventCategory = 'auth';
        eventType = 'CAPTCHA_REQUEST';
        eventDescription = 'CAPTCHA generated/verified';
    }
    
    // CSRF events
    else if (path.includes('/csrf-token')) {
        eventCategory = 'auth';
        eventType = 'CSRF_TOKEN_REQUEST';
        eventDescription = 'CSRF token requested';
    }
    
    // Error events
    if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 401) {
            eventType = 'AUTH_REQUIRED';
            eventDescription = 'Unauthorized access attempt';
        } else if (statusCode === 403) {
            eventType = 'ACCESS_FORBIDDEN';
            eventDescription = 'Forbidden access attempt';
        } else if (statusCode === 429) {
            eventType = 'RATE_LIMIT_EXCEEDED';
            eventDescription = 'Rate limit exceeded';
        }
    } else if (statusCode >= 500) {
        eventType = 'SERVER_ERROR';
        eventDescription = `Server error: ${statusCode}`;
    }
    
    return { eventType, eventCategory, eventDescription };
}

// ════════════════════════════════════════════════════════════════
// MIDDLEWARE: API Logger
// ════════════════════════════════════════════════════════════════

const apiLogger = async (req, res, next) => {
    // Lưu thời điểm bắt đầu request
    const startTime = Date.now();
    
    // Lấy thông tin từ request
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || null;
    const requestMethod = req.method;
    const requestPath = req.path;
    const requestQuery = Object.keys(req.query).length > 0 ? JSON.stringify(req.query) : null;
    
    // ⚠️ QUAN TRỌNG: Lấy thông tin user (nếu đã authenticated)
    // Lưu ý: req.user chỉ tồn tại SAU KHI authMiddleware đã chạy
    // Nếu apiLogger chạy TRƯỚC authMiddleware, userID và userName sẽ luôn là null
    const userID = req.user?.userID || null;
    const userName = req.user?.userName || null;
    const sessionId = req.user?.sessionId || null;
    
    // Sanitize request body
    const sanitizedBody = sanitizeRequestBody(req.body);
    const requestBody = sanitizedBody && Object.keys(sanitizedBody).length > 0 
        ? JSON.stringify(sanitizedBody) 
        : null;
    
    // Check CSRF token validity (nếu có)
    const csrfTokenValid = req.csrfTokenValid !== undefined ? req.csrfTokenValid : null;
    
    // Override res.json để capture response
    const originalJson = res.json.bind(res);
    let responseStatusCode = null;
    let errorMessage = null;
    let rateLimitHit = false;
    
    res.json = function(data) {
        responseStatusCode = res.statusCode;
        
        // Capture error message
        if (data && !data.success && data.message) {
            errorMessage = data.message;
        }
        
        // ✅ IMPROVED: Check rate limit - nhiều cách detect
        if (responseStatusCode === 429) {
            rateLimitHit = true;
        }
        
        // Check message có chứa các từ khóa rate limit (tiếng Anh và tiếng Việt)
        if (data && data.message) {
            const msg = data.message.toLowerCase();
            if (msg.includes('rate limit') || 
                msg.includes('quá nhanh') || 
                msg.includes('quá nhiều') ||
                msg.includes('retry') ||
                msg.includes('thử lại sau')) {
                rateLimitHit = true;
            }
        }
        
        // Check RateLimit headers (express-rate-limit sets these)
        if (res.getHeader('RateLimit-Remaining') !== undefined) {
            const remaining = parseInt(res.getHeader('RateLimit-Remaining'));
            if (remaining === 0 || responseStatusCode === 429) {
                rateLimitHit = true;
            }
        }
        
        return originalJson(data);
    };
    
    // Override res.send để capture non-JSON responses
    const originalSend = res.send.bind(res);
    res.send = function(data) {
        if (!responseStatusCode) {
            responseStatusCode = res.statusCode;
        }
        return originalSend(data);
    };
    
    // Sau khi response kết thúc
    res.on('finish', async () => {
        try {
            // Tính response time
            const responseTime = Date.now() - startTime;
            
            // Xác định event info
            const { eventType, eventCategory, eventDescription } = determineEventInfo(req, res);
            
            // Lưu log vào database (async, không block response)
            const query = `
                INSERT INTO api_logs (
                    ip_address,
                    user_agent,
                    request_method,
                    request_path,
                    request_query,
                    userID,
                    userName,
                    request_body,
                    response_status,
                    response_time,
                    event_type,
                    event_category,
                    event_description,
                    error_message,
                    session_id,
                    csrf_token_valid,
                    rate_limit_hit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                ipAddress,
                userAgent,
                requestMethod,
                requestPath,
                requestQuery,
                userID,
                userName,
                requestBody,
                responseStatusCode || res.statusCode,
                responseTime,
                eventType,
                eventCategory,
                eventDescription,
                errorMessage,
                sessionId,
                csrfTokenValid,
                rateLimitHit
            ];
            
            await db.query(query, values);
            
            // Log ra console trong development mode
            if (process.env.NODE_ENV === 'development') {
                const userInfo = userID ? `[User: ${userName}(${userID})]` : '[Anonymous]';
                const rateLimitInfo = rateLimitHit ? '⚠️ RATE LIMITED' : '';
                console.log(`📝 ${userInfo} ${requestMethod} ${requestPath} - ${responseStatusCode || res.statusCode} (${responseTime}ms) ${rateLimitInfo}`);
            }
            
        } catch (error) {
            // Không để lỗi logging ảnh hưởng đến response
            console.error('❌ API Logger Error:', error.message);
        }
    });
    
    next();
};

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS: Lấy logs từ database
// ════════════════════════════════════════════════════════════════

/**
 * Lấy logs của user
 */
async function getUserLogs(userID, limit = 50, offset = 0) {
    try {
        const query = `
            SELECT * FROM v_api_logs_with_user
            WHERE userID = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [logs] = await db.query(query, [userID, limit, offset]);
        
        // Đếm tổng số logs
        const [countResult] = await db.query(
            'SELECT COUNT(*) as total FROM api_logs WHERE userID = ?',
            [userID]
        );
        
        return {
            logs,
            total: countResult[0].total,
            limit,
            offset
        };
    } catch (error) {
        console.error('Error getting user logs:', error);
        throw error;
    }
}

/**
 * Lấy security alerts
 */
async function getSecurityAlerts(hours = 24, limit = 100) {
    try {
        const query = `
            SELECT * FROM v_security_alerts
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
            ORDER BY created_at DESC
            LIMIT ?
        `;
        
        const [alerts] = await db.query(query, [hours, limit]);
        return alerts;
    } catch (error) {
        console.error('Error getting security alerts:', error);
        throw error;
    }
}

/**
 * Lấy thống kê logs
 */
async function getLogStats(userID = null, days = 7) {
    try {
        let query, params;
        
        if (userID) {
            // Stats cho user cụ thể
            query = `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_requests,
                    AVG(response_time) as avg_response_time,
                    SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success_count,
                    SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as error_count
                FROM api_logs
                WHERE userID = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `;
            params = [userID, days];
        } else {
            // Stats cho toàn hệ thống
            query = `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total_requests,
                    COUNT(DISTINCT userID) as unique_users,
                    COUNT(DISTINCT ip_address) as unique_ips,
                    AVG(response_time) as avg_response_time,
                    SUM(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 ELSE 0 END) as success_count,
                    SUM(CASE WHEN response_status >= 400 THEN 1 ELSE 0 END) as error_count,
                    SUM(CASE WHEN rate_limit_hit = TRUE THEN 1 ELSE 0 END) as rate_limit_count
                FROM api_logs
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            `;
            params = [days];
        }
        
        const [stats] = await db.query(query, params);
        return stats;
    } catch (error) {
        console.error('Error getting log stats:', error);
        throw error;
    }
}

/**
 * Xóa logs cũ
 */
async function cleanupOldLogs(daysToKeep = 90) {
    try {
        const query = `
            DELETE FROM api_logs
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        
        const [result] = await db.query(query, [daysToKeep]);
        
        console.log(`✅ Cleaned up ${result.affectedRows} old logs (older than ${daysToKeep} days)`);
        
        return {
            deletedRows: result.affectedRows,
            daysKept: daysToKeep
        };
    } catch (error) {
        console.error('Error cleaning up old logs:', error);
        throw error;
    }
}

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════

module.exports = {
    apiLogger,
    getUserLogs,
    getSecurityAlerts,
    getLogStats,
    cleanupOldLogs,
    getClientIP
};
