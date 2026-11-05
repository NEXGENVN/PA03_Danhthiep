// ════════════════════════════════════════════════════════════════
// ADMIN CONTROLLER - QUẢN LÝ NGƯỜI DÙNG HỆ THỐNG
// ✅ ĐÃ CẬP NHẬT: Thêm Sanitize để bảo vệ dữ liệu nhạy cảm
// ════════════════════════════════════════════════════════════════

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('../config/database');

let INTERNAL_AUTH_KEY;
let DATA_FIND_SERVER_URL;

if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    DATA_FIND_SERVER_URL = 'http://host.docker.internal:' + process.env.DATA_FIND_SERVER_PORT;
    INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;
} else {
    DATA_FIND_SERVER_URL = 'http://' + process.env.DATA_FIND_SERVER_HOST + ':' + process.env.DATA_FIND_SERVER_PORT;
    INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;
}

const {
    sanitizeUser,
    sanitizeUsers,
    sanitizeZaloAccount,
    sanitizeZaloAccounts,
    maskSensitiveData
} = require('../utils/sanitize');
const {
    verifyCaptcha,
    recordLoginAttempt,
    isCaptchaRequired,
    resetLoginAttempts,
    getClientIP,
    isIPBlocked,
    checkAndBlockIP,
    getBlockedIPs,
    unblockIP
} = require('./captchaController');

/**
 * Admin đăng nhập (chỉ role 1)
 * ✅ YÊU CẦU CAPTCHA SAU 2 LẦN ĐĂNG NHẬP SAI LIÊN TIẾP
 * ✅ CHẶN IP 15 PHÚT SAU 10 LẦN SAI
 */
exports.adminLogin = async (req, res) => {
    try {
        const { userName, password, captchaID, captchaValue } = req.body;
        const ip = getClientIP(req);

        // ✅ Mask password khi log
        console.log('🔐 Admin Login Attempt:', maskSensitiveData({ userName, password }), 'from IP:', ip);

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
                message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
            });
        }

        // ✅ KIỂM TRA XEM CÓ CẦN CAPTCHA KHÔNG
        const needCaptcha = await isCaptchaRequired(ip, 'admin');

        if (needCaptcha) {
            if (!captchaID || !captchaValue) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã đăng nhập sai nhiều lần. Vui lòng nhập mã CAPTCHA.',
                    captchaRequired: true
                });
            }

            const captchaResult = await verifyCaptcha(captchaID, captchaValue, ip, 'admin_login');
            if (!captchaResult.valid) {
                // ✅ GHI NHẬN THẤT BẠI (sai captcha)
                await recordLoginAttempt(ip, userName, 'admin', false);

                // ✅ KIỂM TRA VÀ TỰ ĐỘNG CHẶN NẾU QUÁ NHIỀU LẦN SAI
                const blockCheck = await checkAndBlockIP(ip, 'admin');

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

        // Kiểm tra user tồn tại
        const users = await db.query(
            'SELECT * FROM user WHERE userName = ?',
            [userName]
        );

        if (!users || users.length === 0) {
            // ✅ GHI NHẬN ĐĂNG NHẬP THẤT BẠI
            await recordLoginAttempt(ip, userName, 'admin', false);

            // ✅ KIỂM TRA VÀ TỰ ĐỘNG CHẶN NẾU QUÁ NHIỀU LẦN SAI
            const blockCheck = await checkAndBlockIP(ip, 'admin');

            if (blockCheck.blocked) {
                return res.status(429).json({
                    success: false,
                    message: `Bạn đã đăng nhập sai quá ${blockCheck.failedCount} lần. IP bị chặn ${blockCheck.blockDurationMinutes} phút.`,
                    blocked: true,
                    blockDurationMinutes: blockCheck.blockDurationMinutes
                });
            }

            // Kiểm tra xem sau lần này có cần CAPTCHA không
            const nowNeedCaptcha = await isCaptchaRequired(ip, 'admin');

            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng',
                captchaRequired: nowNeedCaptcha,
                remainingAttempts: blockCheck.remainingAttempts
            });
        }

        const user = users[0];

        // Kiểm tra role TRƯỚC KHI verify password
        if (user.userRole !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập trang quản trị'
            });
        }

        // Kiểm tra tài khoản có active không
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            // ✅ GHI NHẬN ĐĂNG NHẬP THẤT BẠI
            await recordLoginAttempt(ip, userName, 'admin', false);

            // ✅ KIỂM TRA VÀ TỰ ĐỘNG CHẶN NẾU QUÁ NHIỀU LẦN SAI
            const blockCheck = await checkAndBlockIP(ip, 'admin');

            if (blockCheck.blocked) {
                return res.status(429).json({
                    success: false,
                    message: `Bạn đã đăng nhập sai quá ${blockCheck.failedCount} lần. IP bị chặn ${blockCheck.blockDurationMinutes} phút.`,
                    blocked: true,
                    blockDurationMinutes: blockCheck.blockDurationMinutes
                });
            }

            // Kiểm tra xem sau lần này có cần CAPTCHA không
            const nowNeedCaptcha = await isCaptchaRequired(ip, 'admin');

            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng',
                captchaRequired: nowNeedCaptcha,
                remainingAttempts: blockCheck.remainingAttempts
            });
        }

        // ✅ ĐĂNG NHẬP THÀNH CÔNG - Reset counter
        await resetLoginAttempts(ip, 'admin');

        // Tạo JWT token
        const token = jwt.sign(
            {
                userID: user.userID,
                userName: user.userName,
                userRole: user.userRole
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Cập nhật lastLogin và lastIP
        await db.query(
            'UPDATE user SET lastLogin = NOW(), lastIP = ? WHERE userID = ?',
            [ip, user.userID]
        );

        console.log('✅ Admin Login Success:', user.userName);

        // ✅ Sanitize user data trước khi trả về
        const safeUser = sanitizeUser(user);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                ...safeUser,
                totalMoney: user.totalMoney
            }
        });

    } catch (error) {
        console.error('❌ Admin Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi đăng nhập',
            error: error.message
        });
    }
};

/**
 * Lấy danh sách tất cả user (admin only)
 */
exports.getAllUsers = async (req, res) => {
    try {
        console.log('📋 Admin Get All Users');

        const users = await db.query(`
            SELECT 
                userID,
                userName,
                email,
                lastIP,
                lastLogin,
                totalMoney,
                userRole,
                createdAt,
                updatedAt,
                isActive
            FROM user
            ORDER BY createdAt DESC
        `);
        // ✅ Sanitize tất cả users trước khi trả về
        const safeUsers = sanitizeUsers(users);

        res.json({
            success: true,
            message: 'Lấy danh sách người dùng thành công',
            data: safeUsers,
            total: safeUsers.length
        });

    } catch (error) {
        console.error('❌ Get All Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách người dùng',
            error: error.message
        });
    }
};

/**
 * Lấy thông tin chi tiết 1 user (admin only)
 */
exports.getUserDetail = async (req, res) => {
    try {
        const { userID } = req.params;

        console.log('🔍 Admin Get User Detail:', userID);

        const users = await db.query(
            'SELECT userID, userName, email, lastIP, lastLogin, totalMoney, userRole, createdAt, updatedAt, isActive FROM user WHERE userID = ?',
            [userID]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // ✅ Sanitize user data
        const safeUser = sanitizeUser(users[0]);

        res.json({
            success: true,
            message: 'Lấy thông tin người dùng thành công',
            data: safeUser
        });

    } catch (error) {
        console.error('❌ Get User Detail Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng',
            error: error.message
        });
    }
};

/**
 * Cập nhật thông tin user (admin only)
 */
exports.updateUser = async (req, res) => {
    try {
        const { userID } = req.params;
        const { userName, password, email, totalMoney, userRole, isActive } = req.body;

        // ✅ Mask sensitive data khi log
        console.log('✏️ Admin Update User:', userID, maskSensitiveData(req.body));

        // Validate input
        if (!userName || !email) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập và email là bắt buộc'
            });
        }

        // Kiểm tra user tồn tại
        const existingUsers = await db.query(
            'SELECT * FROM user WHERE userID = ?',
            [userID]
        );

        if (!existingUsers || existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Không cho phép admin tự khóa chính mình
        if (parseInt(userID) === req.user.userID && isActive === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể khóa chính tài khoản của mình'
            });
        }

        // Không cho phép admin tự giảm quyền chính mình
        if (parseInt(userID) === req.user.userID && userRole !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể thay đổi quyền của chính mình'
            });
        }

        // Kiểm tra trùng userName (nếu thay đổi)
        if (userName !== existingUsers[0].userName) {
            const duplicateUser = await db.query(
                'SELECT userID FROM user WHERE userName = ? AND userID != ?',
                [userName, userID]
            );

            if (duplicateUser && duplicateUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Tên đăng nhập đã tồn tại'
                });
            }
        }

        // Kiểm tra trùng email (nếu thay đổi)
        if (email !== existingUsers[0].email) {
            const duplicateEmail = await db.query(
                'SELECT userID FROM user WHERE email = ? AND userID != ?',
                [email, userID]
            );

            if (duplicateEmail && duplicateEmail.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã tồn tại'
                });
            }
        }

        // Build UPDATE query
        const updates = [];
        const values = [];

        updates.push('userName = ?');
        values.push(userName);

        updates.push('email = ?');
        values.push(email);

        // Nếu có password mới, hash nó
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (totalMoney !== undefined) {
            updates.push('totalMoney = ?');
            values.push(totalMoney);
        }

        if (userRole !== undefined) {
            updates.push('userRole = ?');
            values.push(userRole);
        }

        if (isActive !== undefined) {
            updates.push('isActive = ?');
            values.push(isActive);
        }

        updates.push('updatedAt = NOW()');
        values.push(userID);

        // Execute UPDATE
        await db.query(
            `UPDATE user SET ${updates.join(', ')} WHERE userID = ?`,
            values
        );

        // Lấy thông tin user sau khi update
        const updatedUsers = await db.query(
            'SELECT userID, userName, email, lastIP, lastLogin, totalMoney, userRole, createdAt, updatedAt, isActive FROM user WHERE userID = ?',
            [userID]
        );

        // ✅ Sanitize user data
        const safeUser = sanitizeUser(updatedUsers[0]);

        console.log('✅ User Updated Successfully:', userID);

        res.json({
            success: true,
            message: 'Cập nhật người dùng thành công',
            data: safeUser
        });

    } catch (error) {
        console.error('❌ Update User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật người dùng',
            error: error.message
        });
    }
};

/**
 * Xóa user (admin only)
 */
exports.deleteUser = async (req, res) => {
    try {
        const { userID } = req.params;

        console.log('🗑️ Admin Delete User:', userID);

        // Không cho phép admin tự xóa chính mình
        if (parseInt(userID) === req.user.userID) {
            return res.status(400).json({
                success: false,
                message: 'Bạn không thể xóa chính tài khoản của mình'
            });
        }

        // Kiểm tra user tồn tại
        const users = await db.query(
            'SELECT userID FROM user WHERE userID = ?',
            [userID]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Xóa user
        await db.query('DELETE FROM user WHERE userID = ?', [userID]);

        console.log('✅ User Deleted Successfully:', userID);

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });

    } catch (error) {
        console.error('❌ Delete User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa người dùng',
            error: error.message
        });
    }
};

/**
 * Tạo user mới (admin only)
 */
exports.createUser = async (req, res) => {
    try {
        const { userName, password, email, totalMoney, userRole } = req.body;

        // ✅ Mask password khi log
        console.log('➕ Admin Create User:', maskSensitiveData(req.body));

        // Validate input
        if (!userName || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập, mật khẩu và email là bắt buộc'
            });
        }

        // Kiểm tra trùng userName
        const existingUser = await db.query(
            'SELECT userID FROM user WHERE userName = ?',
            [userName]
        );

        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Kiểm tra trùng email
        const existingEmail = await db.query(
            'SELECT userID FROM user WHERE email = ?',
            [email]
        );

        if (existingEmail && existingEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email đã tồn tại'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user mới
        const result = await db.query(
            `INSERT INTO user (userName, password, email, totalMoney, userRole, isActive, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
                userName,
                hashedPassword,
                email,
                totalMoney || 0,
                userRole || 0
            ]
        );

        // Lấy thông tin user vừa tạo
        const newUsers = await db.query(
            'SELECT userID, userName, email, totalMoney, userRole, createdAt, updatedAt, isActive FROM user WHERE userID = ?',
            [result.insertId]
        );

        // ✅ Sanitize user data
        const safeUser = sanitizeUser(newUsers[0]);

        console.log('✅ User Created Successfully:', result.insertId);

        res.json({
            success: true,
            message: 'Tạo người dùng mới thành công',
            data: safeUser
        });

    } catch (error) {
        console.error('❌ Create User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo người dùng mới',
            error: error.message
        });
    }
};

/**
 * Thống kê tổng quan hệ thống (admin only)
 */
exports.getSystemStats = async (req, res) => {
    try {
        console.log('📊 Admin Get System Stats');

        // Đếm số user
        const totalUsers = await db.query('SELECT COUNT(*) as count FROM user');

        // Đếm số user active
        const activeUsers = await db.query('SELECT COUNT(*) as count FROM user WHERE isActive = 1');

        // Đếm số admin
        const totalAdmins = await db.query('SELECT COUNT(*) as count FROM user WHERE userRole = 1');

        // Đếm số Zalo account
        const totalZaloAccounts = await db.query('SELECT COUNT(*) as count FROM zalo_account');

        // Đếm số request
        const totalRequests = await db.query('SELECT COUNT(*) as count FROM auto_request');

        // Đếm số request thành công
        const successRequests = await db.query('SELECT COUNT(*) as count FROM auto_request WHERE sendResult = "SUCCESS"');

        // Tổng doanh thu
        const totalRevenue = await db.query('SELECT SUM(fee_charged) as total FROM auto_request WHERE fee_charged > 0');

        res.json({
            success: true,
            message: 'Lấy thống kê hệ thống thành công',
            data: {
                totalUsers: totalUsers[0].count,
                activeUsers: activeUsers[0].count,
                totalAdmins: totalAdmins[0].count,
                totalZaloAccounts: totalZaloAccounts[0].count,
                totalRequests: totalRequests[0].count,
                successRequests: successRequests[0].count,
                totalRevenue: totalRevenue[0].total || 0
            }
        });

    } catch (error) {
        console.error('❌ Get System Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê hệ thống',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ CẤU HÌNH TOOL_SETUP
// ════════════════════════════════════════════════════════════════

/**
 * Lấy cấu hình tool_setup (admin only)
 */
exports.getToolSetup = async (req, res) => {
    try {
        console.log('⚙️ Admin Get Tool Setup');

        let toolSetup = await db.query('SELECT * FROM tool_setup LIMIT 1');

        // Nếu chưa có, tạo mới
        if (!toolSetup || toolSetup.length === 0) {
            await db.query(
                `INSERT INTO tool_setup 
                 (uid_zalo_system, zalo_system_money, zalo_custom_money, check_phone_system_money, check_phone_custom_money, check_card_money) 
                 VALUES (NULL, 30000.00, 20000.00, 10000.00, 5000.00, 5000.00)`
            );
            toolSetup = await db.query('SELECT * FROM tool_setup LIMIT 1');
        }

        // Lấy thông tin tài khoản hệ thống nếu có
        let systemAccount = null;
        if (toolSetup[0].uid_zalo_system) {
            const accounts = await db.query(
                'SELECT UID, displayName, phoneNumber, Avatar, accStatus FROM zalo_account WHERE UID = ?',
                [toolSetup[0].uid_zalo_system]
            );

            // ✅ Sanitize Zalo account
            systemAccount = accounts.length > 0 ? sanitizeZaloAccount(accounts[0]) : null;
        }

        res.json({
            success: true,
            message: 'Lấy cấu hình thành công',
            data: {
                ...toolSetup[0],
                systemAccount: systemAccount
            }
        });

    } catch (error) {
        console.error('❌ Get Tool Setup Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy cấu hình',
            error: error.message
        });
    }
};

/**
 * Cập nhật cấu hình tool_setup (admin only)
 */
exports.updateToolSetup = async (req, res) => {
    try {
        const {
            uid_zalo_system,
            zalo_system_money,
            zalo_custom_money,
            check_phone_system_money,
            check_phone_custom_money,
            check_card_money,
            check_data_leak_money
        } = req.body;

        console.log('⚙️ Admin Update Tool Setup:', req.body);

        // Validate số tiền
        if (zalo_system_money !== undefined && (zalo_system_money < 0 || isNaN(zalo_system_money))) {
            return res.status(400).json({
                success: false,
                message: 'Phí tài khoản hệ thống không hợp lệ'
            });
        }

        if (zalo_custom_money !== undefined && (zalo_custom_money < 0 || isNaN(zalo_custom_money))) {
            return res.status(400).json({
                success: false,
                message: 'Phí tài khoản người dùng không hợp lệ'
            });
        }

        if (check_phone_system_money !== undefined && (check_phone_system_money < 0 || isNaN(check_phone_system_money))) {
            return res.status(400).json({
                success: false,
                message: 'Phí check SĐT hệ thống không hợp lệ'
            });
        }

        if (check_phone_custom_money !== undefined && (check_phone_custom_money < 0 || isNaN(check_phone_custom_money))) {
            return res.status(400).json({
                success: false,
                message: 'Phí check SĐT người dùng không hợp lệ'
            });
        }

        if (check_card_money !== undefined && (check_card_money < 0 || isNaN(check_card_money))) {
            return res.status(400).json({
                success: false,
                message: 'Phí check danh thiếp không hợp lệ'
            });
        }

        if (check_data_leak_money !== undefined && (check_data_leak_money < 0 || isNaN(check_data_leak_money))) {
            return res.status(400).json({
                success: false,
                message: 'Phí check Data Leak không hợp lệ'
            });
        }

        // Nếu có uid_zalo_system, kiểm tra tồn tại
        if (uid_zalo_system) {
            const accounts = await db.query(
                'SELECT UID FROM zalo_account WHERE UID = ?',
                [uid_zalo_system]
            );

            if (accounts.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'UID tài khoản Zalo hệ thống không tồn tại'
                });
            }
        }

        // Kiểm tra xem đã có cấu hình chưa
        const existing = await db.query('SELECT STT FROM tool_setup LIMIT 1');

        if (!existing || existing.length === 0) {
            // Insert mới
            await db.query(
                `INSERT INTO tool_setup 
                 (uid_zalo_system, zalo_system_money, zalo_custom_money, check_phone_system_money, check_phone_custom_money, check_card_money, check_data_leak_money) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    uid_zalo_system || null,
                    zalo_system_money || 30000.00,
                    zalo_custom_money || 20000.00,
                    check_phone_system_money || 10000.00,
                    check_phone_custom_money || 5000.00,
                    check_card_money || 5000.00,
                    check_data_leak_money || 5000.00
                ]
            );
        } else {
            // Update
            const updates = [];
            const values = [];

            if (uid_zalo_system !== undefined) {
                updates.push('uid_zalo_system = ?');
                values.push(uid_zalo_system || null);
            }

            if (zalo_system_money !== undefined) {
                updates.push('zalo_system_money = ?');
                values.push(zalo_system_money);
            }

            if (zalo_custom_money !== undefined) {
                updates.push('zalo_custom_money = ?');
                values.push(zalo_custom_money);
            }

            if (check_phone_system_money !== undefined) {
                updates.push('check_phone_system_money = ?');
                values.push(check_phone_system_money);
            }

            if (check_phone_custom_money !== undefined) {
                updates.push('check_phone_custom_money = ?');
                values.push(check_phone_custom_money);
            }

            if (check_card_money !== undefined) {
                updates.push('check_card_money = ?');
                values.push(check_card_money);
            }

            if (check_data_leak_money !== undefined) {
                updates.push('check_data_leak_money = ?');
                values.push(check_data_leak_money);
            }

            if (updates.length > 0) {
                values.push(existing[0].STT);
                await db.query(
                    `UPDATE tool_setup SET ${updates.join(', ')} WHERE STT = ?`,
                    values
                );
            }
        }

        // Lấy lại cấu hình mới
        const updatedSetup = await db.query('SELECT * FROM tool_setup LIMIT 1');

        console.log('✅ Tool Setup Updated Successfully');

        res.json({
            success: true,
            message: 'Cập nhật cấu hình thành công',
            data: updatedSetup[0]
        });

    } catch (error) {
        console.error('❌ Update Tool Setup Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật cấu hình',
            error: error.message
        });
    }
};

/**
 * Lấy danh sách tất cả tài khoản Zalo (để chọn làm tài khoản hệ thống)
 */
exports.getAllZaloAccounts = async (req, res) => {
    try {
        console.log('📱 Admin Get All Zalo Accounts');

        const accounts = await db.query(
            `SELECT 
                UID, 
                displayName, 
                phoneNumber, 
                Avatar, 
                accStatus,
                ImportTime
             FROM zalo_account
             ORDER BY ImportTime DESC`
        );

        // ✅ Sanitize tất cả Zalo accounts
        const safeAccounts = sanitizeZaloAccounts(accounts);

        res.json({
            success: true,
            message: 'Lấy danh sách tài khoản Zalo thành công',
            data: safeAccounts,
            total: safeAccounts.length
        });

    } catch (error) {
        console.error('❌ Get All Zalo Accounts Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tài khoản Zalo',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ IP BLOCKS - Admin quản lý các IP bị chặn
// ════════════════════════════════════════════════════════════════

/**
 * Lấy danh sách IP đang bị chặn (admin only)
 */
exports.getBlockedIPsList = async (req, res) => {
    try {
        console.log('🚫 Admin Get Blocked IPs List');

        const blockedIPs = await getBlockedIPs();

        res.json({
            success: true,
            message: 'Lấy danh sách IP bị chặn thành công',
            data: blockedIPs,
            total: blockedIPs.length
        });

    } catch (error) {
        console.error('❌ Get Blocked IPs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách IP bị chặn',
            error: error.message
        });
    }
};

/**
 * Gỡ chặn một IP (admin only)
 */
exports.unblockIPAddress = async (req, res) => {
    try {
        const { ipAddress } = req.params;

        console.log('✅ Admin Unblock IP:', ipAddress);

        if (!ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp địa chỉ IP'
            });
        }

        const result = await unblockIP(ipAddress);

        if (result.success) {
            res.json({
                success: true,
                message: `Đã gỡ chặn IP: ${ipAddress}`,
                affectedRows: result.affectedRows
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi gỡ chặn IP',
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Unblock IP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gỡ chặn IP',
            error: error.message
        });
    }
};

/**
 * Chặn một IP thủ công (admin only)
 */
exports.blockIPManual = async (req, res) => {
    try {
        const { ipAddress, blockType, reason, blockMinutes } = req.body;

        console.log('🚫 Admin Block IP Manual:', { ipAddress, blockType, reason, blockMinutes });

        if (!ipAddress) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp địa chỉ IP'
            });
        }

        const { blockIP } = require('./captchaController');
        const result = await blockIP(
            ipAddress,
            blockType || 'both',
            reason || 'Chặn thủ công bởi admin',
            0,
            blockMinutes || 15
        );

        if (result.success) {
            res.json({
                success: true,
                message: `Đã chặn IP: ${ipAddress} trong ${result.blockMinutes} phút`,
                blockMinutes: result.blockMinutes
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Lỗi khi chặn IP',
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Block IP Manual Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi chặn IP',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// QUẢN LÝ AUTO REQUESTS - Lịch sử gửi ảnh toàn hệ thống
// ════════════════════════════════════════════════════════════════

/**
 * Lấy danh sách tất cả auto_request trong hệ thống (admin only)
 */
exports.getAllAutoRequests = async (req, res) => {
    try {
        console.log('📋 Admin Get All Auto Requests');

        const requests = await db.query(`
            SELECT 
                ar.reqID,
                ar.phoneNumber,
                ar.UID,
                ar.displayName,
                ar.imageUrl,
                ar.sendResult,
                ar.Detail,
                ar.created_at,
                ar.fee_charged,
                ar.use_system_account,
                ar.sender_zalo_uid,
                COALESCE(u.userName, 'N/A') as userName,
                COALESCE(u.userID, 0) as userID
            FROM auto_request ar
            LEFT JOIN user_link_auto_request ular ON ar.reqID = ular.reqID
            LEFT JOIN user u ON ular.userID = u.userID
            ORDER BY ar.created_at DESC
            LIMIT 1000
        `);

        // Format dữ liệu để trả về
        const formattedRequests = requests.map(req => ({
            reqID: req.reqID,
            phoneNumber: req.phoneNumber,
            UID: req.UID,
            displayName: req.displayName,
            Detail: req.Detail,
            created_at: req.created_at,
            fee_charged: req.fee_charged,
            use_system_account: req.use_system_account,
            sender_zalo_uid: req.sender_zalo_uid,
            userName: req.userName,
            userID: req.userID,
            sendResult: req.sendResult
        }));

        res.json({
            success: true,
            message: 'Lấy danh sách request thành công',
            data: formattedRequests,
            total: formattedRequests.length
        });

    } catch (error) {
        console.error('❌ Get All Auto Requests Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách request',
            error: error.message
        });
    }
};



/**
 * Lấy lịch sử tra cứu rò rỉ toàn hệ thống (admin only)
 */
exports.getGlobalLeakHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        console.log(`📋 Admin Get Global Leak History - Page: ${page}`);

        // 1. Gọi DATA_FIND_SERVER lấy history
        const response = await axios({
            method: 'GET',
            url: `${DATA_FIND_SERVER_URL}/api/admin/history`,
            params: { page, limit },
            headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY },
            timeout: 10000
        });

        if (!response.data || !response.data.success) {
            throw new Error(response.data.message || 'Không thể lấy dữ liệu từ DATA_FIND_SERVER');
        }

        const historyData = response.data.data;
        const pagination = response.data.pagination;

        // 2. Lấy danh sách userID duy nhất để lookup name
        const userIDs = [...new Set(historyData.map(h => h.userID))];

        let userMap = {};
        if (userIDs.length > 0) {
            const users = await db.query(
                'SELECT userID, userName FROM user WHERE userID IN (?)',
                [userIDs]
            );
            users.forEach(u => {
                userMap[u.userID] = u.userName;
            });
        }

        // 3. Gắn userName vào data
        const enrichedHistory = historyData.map(h => ({
            ...h,
            userName: userMap[h.userID] || 'Unknown User'
        }));

        res.json({
            success: true,
            data: enrichedHistory,
            totalRevenue: response.data.totalRevenue || 0,
            pagination
        });

    } catch (error) {
        console.error('❌ Get Global Leak History Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử tra cứu rò rỉ',
            error: error.message
        });
    }
};



