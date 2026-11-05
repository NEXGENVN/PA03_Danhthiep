// ════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE - XÁC THỰC JWT
// ════════════════════════════════════════════════════════════════

const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Middleware xác thực JWT token
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const token = authHeader.substring(7); // Bỏ 'Bearer '

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Kiểm tra user còn tồn tại và active
        const user = await db.query(
            'SELECT userID, userName, email, userRole, isActive FROM user WHERE userID = ?',
            [decoded.userID]
        );

        if (!user || user.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        if (!user[0].isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Gắn thông tin user vào request
        req.user = {
            userID: user[0].userID,
            userName: user[0].userName,
            email: user[0].email,
            userRole: user[0].userRole
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }

        console.error('Auth Middleware Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực'
        });
    }
};

/**
 * Middleware kiểm tra quyền admin
 */
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.userRole === 1) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập chức năng này'
        });
    }
};

/**
 * Middleware kiểm tra quyền user (admin hoặc chính user đó)
 */
const ownerOrAdminMiddleware = (req, res, next) => {
    const requestedUserID = parseInt(req.params.userID || req.body.userID);

    if (req.user.userRole === 1 || req.user.userID === requestedUserID) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập thông tin này'
        });
    }
};

/**
 * Middleware kiểm tra quyền VIP hoặc Admin
 */
const vipOrAdminMiddleware = (req, res, next) => {
    if (req.user && (req.user.userRole === 1 || req.user.userRole === 3)) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Tính năng này chỉ dành cho Admin hoặc VIP'
        });
    }
};

/**
 * Middleware cập nhật lastLogin và lastIP
 */
const updateLoginInfo = async (userID, ip) => {
    try {
        await db.query(
            'UPDATE user SET lastLogin = NOW(), lastIP = ? WHERE userID = ?',
            [ip, userID]
        );
    } catch (error) {
        console.error('Update login info error:', error);
    }
};

module.exports = {
    authMiddleware,
    authenticate: authMiddleware, // Alias cho tương thích
    adminMiddleware,
    ownerOrAdminMiddleware,
    vipOrAdminMiddleware,
    updateLoginInfo
};

