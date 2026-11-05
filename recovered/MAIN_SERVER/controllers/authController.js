// ════════════════════════════════════════════════════════════════
// AUTH CONTROLLER - ĐĂNG KÝ, ĐĂNG NHẬP, ĐỔI MẬT KHẨU
// ✅ ĐÃ CẬP NHẬT: Thêm Sanitize để bảo vệ dữ liệu nhạy cảm
// ════════════════════════════════════════════════════════════════

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { updateLoginInfo } = require('../middleware/auth');
const { 
    sanitizeAuthResponse, 
    sanitizeUserProfile,
    maskSensitiveData 
} = require('../utils/sanitize');
const {
    verifyCaptcha,
    recordLoginAttempt,
    isCaptchaRequired,
    resetLoginAttempts,
    getClientIP,
    isIPBlocked,
    checkAndBlockIP
} = require('./captchaController');

/**
 * Đăng ký tài khoản mới
 * ✅ BẮT BUỘC CAPTCHA KHI ĐĂNG KÝ
 * ✅ KIỂM TRA IP BỊ CHẶN
 */
const register = async (req, res) => {
    try {
        const { userName, password, email, captchaID, captchaValue } = req.body;
        const ip = getClientIP(req);

        // ✅ Mask password khi log
        console.log('Register attempt:', maskSensitiveData({ userName, password, email }));

        // ✅ KIỂM TRA IP CÓ BỊ CHẶN KHÔNG
        const blockStatus = await isIPBlocked(ip, 'register');
        if (blockStatus.blocked) {
            return res.status(429).json({
                success: false,
                message: `IP của bạn đã bị chặn tạm thời do đăng ký sai quá nhiều lần. Vui lòng thử lại sau ${blockStatus.remainingMinutes} phút.`,
                blocked: true,
                remainingMinutes: blockStatus.remainingMinutes,
                reason: blockStatus.reason
            });
        }

        // Validate input
        if (!userName || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // ✅ KIỂM TRA CAPTCHA BẮT BUỘC KHI ĐĂNG KÝ
        if (!captchaID || !captchaValue) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập mã CAPTCHA',
                captchaRequired: true
            });
        }

        const captchaResult = await verifyCaptcha(captchaID, captchaValue, ip, 'register');
        if (!captchaResult.valid) {
            // ✅ GHI NHẬN ĐĂNG KÝ THẤT BẠI (sai captcha)
            await recordLoginAttempt(ip, userName, 'register', false);
            
            // ✅ KIỂM TRA VÀ TỰ ĐỘNG CHẶN NẾU QUÁ NHIỀU LẦN SAI
            const blockCheck = await checkAndBlockIP(ip, 'register');
            
            if (blockCheck.blocked) {
                return res.status(429).json({
                    success: false,
                    message: `Bạn đã nhập sai quá ${blockCheck.failedCount} lần. IP bị chặn ${blockCheck.blockDurationMinutes} phút.`,
                    blocked: true,
                    blockDurationMinutes: blockCheck.blockDurationMinutes
                });
            }
            
            return res.status(400).json({
                success: false,
                message: captchaResult.message,
                captchaRequired: true,
                captchaInvalid: true,
                remainingAttempts: blockCheck.remainingAttempts
            });
        }

        // Kiểm tra username đã tồn tại
        const existingUser = await db.query(
            'SELECT userID FROM user WHERE userName = ? OR email = ?',
            [userName, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập hoặc email đã tồn tại'
            });
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user
        const result = await db.query(
            `INSERT INTO user (userName, password, email, userRole, totalMoney, lastIP) 
             VALUES (?, ?, ?, 2, 0.00, ?)`,
            [userName, hashedPassword, email, ip]
        );

        // Tạo JWT token
        const token = jwt.sign(
            { userID: result.insertId, userName, email, userRole: 2 },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // ✅ Sanitize response
        const safeResponse = sanitizeAuthResponse(
            { userID: result.insertId, userName, email, userRole: 2 },
            token
        );

        console.log('✅ Registration successful:', userName);

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: safeResponse
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi đăng ký tài khoản'
        });
    }
};

/**
 * Đăng nhập
 * ✅ YÊU CẦU CAPTCHA SAU 2 LẦN ĐĂNG NHẬP SAI LIÊN TIẾP
 * ✅ CHẶN IP 15 PHÚT SAU 10 LẦN SAI
 */
const login = async (req, res) => {
    try {
        const { userName, password, captchaID, captchaValue } = req.body;
        const ip = getClientIP(req);

        // ✅ Mask password khi log
        console.log('Login attempt:', maskSensitiveData({ userName, password }), 'from IP:', ip);

        // ✅ KIỂM TRA IP CÓ BỊ CHẶN KHÔNG (KIỂM TRA ĐẦU TIÊN)
        const blockStatus = await isIPBlocked(ip, 'login');
        if (blockStatus.blocked) {
            return res.status(429).json({
                success: false,
                message: `IP của bạn đã bị chặn tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${blockStatus.remainingMinutes} phút.`,
                blocked: true,
                remainingMinutes: blockStatus.remainingMinutes,
                reason: blockStatus.reason
            });
        }

        // Validate input
        if (!userName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên đăng nhập và mật khẩu'
            });
        }

        // ✅ KIỂM TRA XEM CÓ CẦN CAPTCHA KHÔNG
        const needCaptcha = await isCaptchaRequired(ip, 'user');
        
        if (needCaptcha) {
            if (!captchaID || !captchaValue) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã đăng nhập sai nhiều lần. Vui lòng nhập mã CAPTCHA.',
                    captchaRequired: true
                });
            }

            const captchaResult = await verifyCaptcha(captchaID, captchaValue, ip, 'login');
            if (!captchaResult.valid) {
                // ✅ GHI NHẬN THẤT BẠI (sai captcha)
                await recordLoginAttempt(ip, userName, 'user', false);
                
                // ✅ KIỂM TRA VÀ TỰ ĐỘNG CHẶN NẾU QUÁ NHIỀU LẦN SAI
                const blockCheck = await checkAndBlockIP(ip, 'user');
                
                if (blockCheck.blocked) {
                    return res.status(429).json({
                        success: false,
                        message: `Bạn đã nhập sai quá ${blockCheck.failedCount} lần. IP bị chặn ${blockCheck.blockDurationMinutes} phút.`,
                        blocked: true,
                        blockDurationMinutes: blockCheck.blockDurationMinutes
                    });
                }
                
                return res.status(400).json({
                    success: false,
                    message: captchaResult.message,
                    captchaRequired: true,
                    captchaInvalid: true,
                    remainingAttempts: blockCheck.remainingAttempts
                });
            }
        }

        // Tìm user
        const users = await db.query(
            'SELECT userID, userName, password, email, userRole, isActive FROM user WHERE userName = ?',
            [userName]
        );

        if (users.length === 0) {
            // ✅ GHI NHẬN ĐĂNG NHẬP THẤT BẠI
            await recordLoginAttempt(ip, userName, 'user', false);
            
            // ✅ KIỂM TRA VÀ TỰ ĐỘNG CHẶN NẾU QUÁ NHIỀU LẦN SAI
            const blockCheck = await checkAndBlockIP(ip, 'user');
            
            if (blockCheck.blocked) {
                return res.status(429).json({
                    success: false,
                    message: `Bạn đã đăng nhập sai quá ${blockCheck.failedCount} lần. IP bị chặn ${blockCheck.blockDurationMinutes} phút.`,
                    blocked: true,
                    blockDurationMinutes: blockCheck.blockDurationMinutes
                });
            }
            
            // Kiểm tra xem sau lần này có cần CAPTCHA không
            const nowNeedCaptcha = await isCaptchaRequired(ip, 'user');
            
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng',
                captchaRequired: nowNeedCaptcha,
                remainingAttempts: blockCheck.remainingAttempts
            });
        }

        const user = users[0];

        // Kiểm tra tài khoản có bị khóa không
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị vô hiệu hóa'
            });
        }

        // Kiểm tra password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // ✅ GHI NHẬN ĐĂNG NHẬP THẤT BẠI
            await recordLoginAttempt(ip, userName, 'user', false);
            
            // ✅ KIỂM TRA VÀ TỰ ĐỘNG CHẶN NẾU QUÁ NHIỀU LẦN SAI
            const blockCheck = await checkAndBlockIP(ip, 'user');
            
            if (blockCheck.blocked) {
                return res.status(429).json({
                    success: false,
                    message: `Bạn đã đăng nhập sai quá ${blockCheck.failedCount} lần. IP bị chặn ${blockCheck.blockDurationMinutes} phút.`,
                    blocked: true,
                    blockDurationMinutes: blockCheck.blockDurationMinutes
                });
            }
            
            // Kiểm tra xem sau lần này có cần CAPTCHA không
            const nowNeedCaptcha = await isCaptchaRequired(ip, 'user');
            
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng',
                captchaRequired: nowNeedCaptcha,
                remainingAttempts: blockCheck.remainingAttempts
            });
        }

        // ✅ ĐĂNG NHẬP THÀNH CÔNG - Reset counter
        await resetLoginAttempts(ip, 'user');

        // Cập nhật lastLogin và lastIP
        await updateLoginInfo(user.userID, ip);

        // Tạo JWT token
        const token = jwt.sign(
            { 
                userID: user.userID, 
                userName: user.userName, 
                email: user.email,
                userRole: user.userRole 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // ✅ Sanitize response
        const safeResponse = sanitizeAuthResponse(user, token);

        console.log('✅ Login successful:', userName);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: safeResponse
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi đăng nhập'
        });
    }
};

/**
 * Lấy thông tin user hiện tại
 */
const getProfile = async (req, res) => {
    try {
        const user = await db.query(
            `SELECT userID, userName, email, totalMoney, userRole, 
                    createdAt, isActive, lastLogin
             FROM user WHERE userID = ?`,
            [req.user.userID]
        );

        if (user.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // ✅ Sanitize user profile (loại bỏ lastIP, lastLogin)
        const safeProfile = sanitizeUserProfile(user[0]);

        res.json({
            success: true,
            data: safeProfile
        });

    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin tài khoản'
        });
    }
};

/**
 * Đổi mật khẩu
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // ✅ Mask passwords khi log
        console.log('Change password attempt:', {
            userID: req.user.userID,
            ...maskSensitiveData({ currentPassword, newPassword })
        });

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
            });
        }

        // Lấy password hiện tại
        const users = await db.query(
            'SELECT password FROM user WHERE userID = ?',
            [req.user.userID]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Kiểm tra mật khẩu cũ
        const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Hash mật khẩu mới
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Cập nhật mật khẩu
        await db.query(
            'UPDATE user SET password = ? WHERE userID = ?',
            [hashedPassword, req.user.userID]
        );

        console.log('✅ Password changed successfully for userID:', req.user.userID);

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi đổi mật khẩu'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    changePassword
};
