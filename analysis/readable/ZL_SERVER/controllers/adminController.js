// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/adminController.js
const bcrypt = require('bcrypt'),
  jwt = require("jsonwebtoken"),
  db = require("../config/database"),
  {
    sanitizeUser,
    sanitizeUsers,
    sanitizeZaloAccount,
    sanitizeZaloAccounts,
    maskSensitiveData
  } = require("../utils/sanitize"),
  {
    verifyCaptcha,
    recordLoginAttempt,
    isCaptchaRequired,
    resetLoginAttempts,
    getClientIP,
    isIPBlocked,
    checkAndBlockIP,
    getBlockedIPs,
    unblockIP
  } = require("./captchaController");
exports.adminLogin = async (_0x6a6800, _0x5dc05b) => {
  try {
    const {
        userName: _0x29e697,
        password: _0x2b2059,
        captchaID: _0x2c94db,
        captchaValue: _0x441011
      } = _0x6a6800.body,
      _0x518c5c = getClientIP(_0x6a6800);
    console.log("🔐 Admin Login Attempt:", maskSensitiveData({
      'userName': _0x29e697,
      'password': _0x2b2059
    }), "from IP:", _0x518c5c);
    const _0x4c7a96 = await isIPBlocked(_0x518c5c, "login");
    if (_0x4c7a96.blocked) return _0x5dc05b.status(0x1ad).json({
      'success': false,
      'message': "IP của bạn đã bị chặn tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau " + _0x4c7a96.remainingMinutes + '\x20phút.',
      'blocked': true,
      'remainingMinutes': _0x4c7a96.remainingMinutes,
      'reason': _0x4c7a96.reason
    });
    if (!_0x29e697 || !_0x2b2059) return _0x5dc05b.status(0x190).json({
      'success': false,
      'message': "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu"
    });
    const _0x2c2d62 = await isCaptchaRequired(_0x518c5c, "admin");
    if (_0x2c2d62) {
      if (!_0x2c94db || !_0x441011) return _0x5dc05b.status(0x190).json({
        'success': false,
        'message': "Bạn đã đăng nhập sai nhiều lần. Vui lòng nhập mã CAPTCHA.",
        'captchaRequired': true
      });
      const _0x53e1d5 = await verifyCaptcha(_0x2c94db, _0x441011, _0x518c5c, "admin_login");
      if (!_0x53e1d5.valid) {
        await recordLoginAttempt(_0x518c5c, _0x29e697, 'admin', false);
        const _0x5eab63 = await checkAndBlockIP(_0x518c5c, "admin");
        if (_0x5eab63.blocked) return _0x5dc05b.status(0x1ad).json({
          'success': false,
          'message': "Bạn đã nhập sai quá " + _0x5eab63.failedCount + " lần. IP bị chặn " + _0x5eab63.blockDurationMinutes + " phút.",
          'blocked': true,
          'blockDurationMinutes': _0x5eab63.blockDurationMinutes
        });
        return _0x5dc05b.status(0x190).json({
          'success': false,
          'message': _0x53e1d5.message,
          'captchaRequired': true,
          'captchaInvalid': true,
          'remainingAttempts': _0x5eab63.remainingAttempts
        });
      }
    }
    const _0x277b43 = await db.query("SELECT * FROM user WHERE userName = ?", [_0x29e697]);
    if (!_0x277b43 || _0x277b43.length === 0x0) {
      await recordLoginAttempt(_0x518c5c, _0x29e697, "admin", false);
      const _0x516688 = await checkAndBlockIP(_0x518c5c, "admin");
      if (_0x516688.blocked) return _0x5dc05b.status(0x1ad).json({
        'success': false,
        'message': "Bạn đã đăng nhập sai quá " + _0x516688.failedCount + " lần. IP bị chặn " + _0x516688.blockDurationMinutes + " phút.",
        'blocked': true,
        'blockDurationMinutes': _0x516688.blockDurationMinutes
      });
      const _0x31608d = await isCaptchaRequired(_0x518c5c, "admin");
      return _0x5dc05b.status(0x191).json({
        'success': false,
        'message': "Tên đăng nhập hoặc mật khẩu không đúng",
        'captchaRequired': _0x31608d,
        'remainingAttempts': _0x516688.remainingAttempts
      });
    }
    const _0x45d481 = _0x277b43[0x0];
    if (_0x45d481.userRole !== 0x1) return _0x5dc05b.status(0x193).json({
      'success': false,
      'message': "Bạn không có quyền truy cập trang quản trị"
    });
    if (!_0x45d481.isActive) return _0x5dc05b.status(0x193).json({
      'success': false,
      'message': "Tài khoản đã bị khóa"
    });
    const _0x5ab149 = await bcrypt.compare(_0x2b2059, _0x45d481.password);
    if (!_0x5ab149) {
      await recordLoginAttempt(_0x518c5c, _0x29e697, 'admin', false);
      const _0xeefb46 = await checkAndBlockIP(_0x518c5c, "admin");
      if (_0xeefb46.blocked) return _0x5dc05b.status(0x1ad).json({
        'success': false,
        'message': "Bạn đã đăng nhập sai quá " + _0xeefb46.failedCount + " lần. IP bị chặn " + _0xeefb46.blockDurationMinutes + " phút.",
        'blocked': true,
        'blockDurationMinutes': _0xeefb46.blockDurationMinutes
      });
      const _0x5bdfcf = await isCaptchaRequired(_0x518c5c, "admin");
      return _0x5dc05b.status(0x191).json({
        'success': false,
        'message': "Tên đăng nhập hoặc mật khẩu không đúng",
        'captchaRequired': _0x5bdfcf,
        'remainingAttempts': _0xeefb46.remainingAttempts
      });
    }
    await resetLoginAttempts(_0x518c5c, "admin");
    const _0x535557 = jwt.sign({
      'userID': _0x45d481.userID,
      'userName': _0x45d481.userName,
      'userRole': _0x45d481.userRole
    }, process.env.JWT_SECRET, {
      'expiresIn': '7d'
    });
    await db.query("UPDATE user SET lastLogin = NOW(), lastIP = ? WHERE userID = ?", [_0x518c5c, _0x45d481.userID]), console.log("✅ Admin Login Success:", _0x45d481.userName);
    const _0x46bf89 = sanitizeUser(_0x45d481);
    _0x5dc05b.json({
      'success': true,
      'message': "Đăng nhập thành công",
      'token': _0x535557,
      'user': {
        ..._0x46bf89,
        'totalMoney': _0x45d481.totalMoney
      }
    });
  } catch (_0x1cfa3c) {
    console.error("❌ Admin Login Error:", _0x1cfa3c), _0x5dc05b.status(0x1f4).json({
      'success': false,
      'message': "Lỗi hệ thống khi đăng nhập",
      'error': _0x1cfa3c.message
    });
  }
}, exports.getAllUsers = async (_0x37658b, _0x1607b4) => {
  try {
    console.log("📋 Admin Get All Users");
    const _0xc088ba = await db.query("\n            SELECT \n                userID,\n                userName,\n                email,\n                lastIP,\n                lastLogin,\n                totalMoney,\n                userRole,\n                createdAt,\n                updatedAt,\n                isActive\n            FROM user\n            ORDER BY createdAt DESC\n        "),
      _0x5ed71f = sanitizeUsers(_0xc088ba);
    _0x1607b4.json({
      'success': true,
      'message': "Lấy danh sách người dùng thành công",
      'data': _0x5ed71f,
      'total': _0x5ed71f.length
    });
  } catch (_0x57e0af) {
    console.error("❌ Get All Users Error:", _0x57e0af), _0x1607b4.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách người dùng",
      'error': _0x57e0af.message
    });
  }
}, exports.getUserDetail = async (_0x353ee3, _0x2e9cd4) => {
  try {
    const {
      userID: _0x4bd888
    } = _0x353ee3.params;
    console.log("🔍 Admin Get User Detail:", _0x4bd888);
    const _0x2af651 = await db.query("SELECT userID, userName, email, lastIP, lastLogin, totalMoney, userRole, createdAt, updatedAt, isActive FROM user WHERE userID = ?", [_0x4bd888]);
    if (!_0x2af651 || _0x2af651.length === 0x0) return _0x2e9cd4.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy người dùng"
    });
    const _0x43f3bc = sanitizeUser(_0x2af651[0x0]);
    _0x2e9cd4.json({
      'success': true,
      'message': "Lấy thông tin người dùng thành công",
      'data': _0x43f3bc
    });
  } catch (_0x989c4d) {
    console.error("❌ Get User Detail Error:", _0x989c4d), _0x2e9cd4.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy thông tin người dùng",
      'error': _0x989c4d.message
    });
  }
}, exports.updateUser = async (_0x281f01, _0x18f42d) => {
  try {
    const {
        userID: _0x36d4ff
      } = _0x281f01.params,
      {
        userName: _0x5074b3,
        password: _0x5c3707,
        email: _0x3ceb8a,
        totalMoney: _0x1132c7,
        userRole: _0x4c52f9,
        isActive: _0x138019
      } = _0x281f01.body;
    console.log("✏️ Admin Update User:", _0x36d4ff, maskSensitiveData(_0x281f01.body));
    if (!_0x5074b3 || !_0x3ceb8a) return _0x18f42d.status(0x190).json({
      'success': false,
      'message': "Tên đăng nhập và email là bắt buộc"
    });
    const _0x4dc216 = await db.query("SELECT * FROM user WHERE userID = ?", [_0x36d4ff]);
    if (!_0x4dc216 || _0x4dc216.length === 0x0) return _0x18f42d.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy người dùng"
    });
    if (parseInt(_0x36d4ff) === _0x281f01.user.userID && _0x138019 === 0x0) return _0x18f42d.status(0x190).json({
      'success': false,
      'message': "Bạn không thể khóa chính tài khoản của mình"
    });
    if (parseInt(_0x36d4ff) === _0x281f01.user.userID && _0x4c52f9 !== 0x1) return _0x18f42d.status(0x190).json({
      'success': false,
      'message': "Bạn không thể thay đổi quyền của chính mình"
    });
    if (_0x5074b3 !== _0x4dc216[0x0].userName) {
      const _0x1a95f6 = await db.query("SELECT userID FROM user WHERE userName = ? AND userID != ?", [_0x5074b3, _0x36d4ff]);
      if (_0x1a95f6 && _0x1a95f6.length > 0x0) return _0x18f42d.status(0x190).json({
        'success': false,
        'message': "Tên đăng nhập đã tồn tại"
      });
    }
    if (_0x3ceb8a !== _0x4dc216[0x0].email) {
      const _0x2fa83b = await db.query("SELECT userID FROM user WHERE email = ? AND userID != ?", [_0x3ceb8a, _0x36d4ff]);
      if (_0x2fa83b && _0x2fa83b.length > 0x0) return _0x18f42d.status(0x190).json({
        'success': false,
        'message': "Email đã tồn tại"
      });
    }
    const _0x325bf4 = [],
      _0x3f981b = [];
    _0x325bf4.push("userName = ?"), _0x3f981b.push(_0x5074b3), _0x325bf4.push('email\x20=\x20?'), _0x3f981b.push(_0x3ceb8a);
    if (_0x5c3707 && _0x5c3707.trim() !== '') {
      const _0x464034 = await bcrypt.hash(_0x5c3707, 0xa);
      _0x325bf4.push("password = ?"), _0x3f981b.push(_0x464034);
    }
    _0x1132c7 !== undefined && (_0x325bf4.push("totalMoney = ?"), _0x3f981b.push(_0x1132c7));
    _0x4c52f9 !== undefined && (_0x325bf4.push("userRole = ?"), _0x3f981b.push(_0x4c52f9));
    _0x138019 !== undefined && (_0x325bf4.push("isActive = ?"), _0x3f981b.push(_0x138019));
    _0x325bf4.push("updatedAt = NOW()"), _0x3f981b.push(_0x36d4ff), await db.query("UPDATE user SET " + _0x325bf4.join(',\x20') + " WHERE userID = ?", _0x3f981b);
    const _0x53415f = await db.query("SELECT userID, userName, email, lastIP, lastLogin, totalMoney, userRole, createdAt, updatedAt, isActive FROM user WHERE userID = ?", [_0x36d4ff]),
      _0x49586e = sanitizeUser(_0x53415f[0x0]);
    console.log("✅ User Updated Successfully:", _0x36d4ff), _0x18f42d.json({
      'success': true,
      'message': "Cập nhật người dùng thành công",
      'data': _0x49586e
    });
  } catch (_0x179400) {
    console.error("❌ Update User Error:", _0x179400), _0x18f42d.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi cập nhật người dùng",
      'error': _0x179400.message
    });
  }
}, exports.deleteUser = async (_0x17beaf, _0x205f8e) => {
  try {
    const {
      userID: _0x1a4d60
    } = _0x17beaf.params;
    console.log("🗑️ Admin Delete User:", _0x1a4d60);
    if (parseInt(_0x1a4d60) === _0x17beaf.user.userID) return _0x205f8e.status(0x190).json({
      'success': false,
      'message': "Bạn không thể xóa chính tài khoản của mình"
    });
    const _0x329f56 = await db.query("SELECT userID FROM user WHERE userID = ?", [_0x1a4d60]);
    if (!_0x329f56 || _0x329f56.length === 0x0) return _0x205f8e.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy người dùng"
    });
    await db.query("DELETE FROM user WHERE userID = ?", [_0x1a4d60]), console.log("✅ User Deleted Successfully:", _0x1a4d60), _0x205f8e.json({
      'success': true,
      'message': "Xóa người dùng thành công"
    });
  } catch (_0x576686) {
    console.error("❌ Delete User Error:", _0x576686), _0x205f8e.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi xóa người dùng",
      'error': _0x576686.message
    });
  }
}, exports.createUser = async (_0x4c8163, _0x1f6c21) => {
  try {
    const {
      userName: _0x260a1e,
      password: _0x18adbb,
      email: _0x1401b6,
      totalMoney: _0x2ec329,
      userRole: _0x3f39d7
    } = _0x4c8163.body;
    console.log("➕ Admin Create User:", maskSensitiveData(_0x4c8163.body));
    if (!_0x260a1e || !_0x18adbb || !_0x1401b6) return _0x1f6c21.status(0x190).json({
      'success': false,
      'message': "Tên đăng nhập, mật khẩu và email là bắt buộc"
    });
    const _0x570454 = await db.query("SELECT userID FROM user WHERE userName = ?", [_0x260a1e]);
    if (_0x570454 && _0x570454.length > 0x0) return _0x1f6c21.status(0x190).json({
      'success': false,
      'message': "Tên đăng nhập đã tồn tại"
    });
    const _0x2fad6d = await db.query("SELECT userID FROM user WHERE email = ?", [_0x1401b6]);
    if (_0x2fad6d && _0x2fad6d.length > 0x0) return _0x1f6c21.status(0x190).json({
      'success': false,
      'message': "Email đã tồn tại"
    });
    const _0x364e66 = await bcrypt.hash(_0x18adbb, 0xa),
      _0x507c92 = await db.query("INSERT INTO user (userName, password, email, totalMoney, userRole, isActive, createdAt, updatedAt) \n             VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())", [_0x260a1e, _0x364e66, _0x1401b6, _0x2ec329 || 0x0, _0x3f39d7 || 0x0]),
      _0x1dc114 = await db.query("SELECT userID, userName, email, totalMoney, userRole, createdAt, updatedAt, isActive FROM user WHERE userID = ?", [_0x507c92.insertId]),
      _0x44797a = sanitizeUser(_0x1dc114[0x0]);
    console.log("✅ User Created Successfully:", _0x507c92.insertId), _0x1f6c21.json({
      'success': true,
      'message': "Tạo người dùng mới thành công",
      'data': _0x44797a
    });
  } catch (_0x2b6ded) {
    console.error("❌ Create User Error:", _0x2b6ded), _0x1f6c21.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi tạo người dùng mới",
      'error': _0x2b6ded.message
    });
  }
}, exports.getSystemStats = async (_0x6aa060, _0x1843ea) => {
  try {
    console.log("📊 Admin Get System Stats");
    const _0x36d8dd = await db.query("SELECT COUNT(*) as count FROM user"),
      _0x3d65da = await db.query("SELECT COUNT(*) as count FROM user WHERE isActive = 1"),
      _0x4cc88c = await db.query("SELECT COUNT(*) as count FROM user WHERE userRole = 1"),
      _0x123d7c = await db.query("SELECT COUNT(*) as count FROM zalo_account"),
      _0x61c20 = await db.query("SELECT COUNT(*) as count FROM auto_request"),
      _0x1bb752 = await db.query("SELECT COUNT(*) as count FROM auto_request WHERE sendResult = \"SUCCESS\""),
      _0x5aa2dd = await db.query("SELECT SUM(fee_charged) as total FROM auto_request WHERE fee_charged > 0");
    _0x1843ea.json({
      'success': true,
      'message': "Lấy thống kê hệ thống thành công",
      'data': {
        'totalUsers': _0x36d8dd[0x0].count,
        'activeUsers': _0x3d65da[0x0].count,
        'totalAdmins': _0x4cc88c[0x0].count,
        'totalZaloAccounts': _0x123d7c[0x0].count,
        'totalRequests': _0x61c20[0x0].count,
        'successRequests': _0x1bb752[0x0].count,
        'totalRevenue': _0x5aa2dd[0x0].total || 0x0
      }
    });
  } catch (_0x24ee75) {
    console.error("❌ Get System Stats Error:", _0x24ee75), _0x1843ea.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy thống kê hệ thống",
      'error': _0x24ee75.message
    });
  }
}, exports.getToolSetup = async (_0x1bfe13, _0x10bd27) => {
  try {
    console.log("⚙️ Admin Get Tool Setup");
    let _0x26a945 = await db.query("SELECT * FROM tool_setup LIMIT 1");
    (!_0x26a945 || _0x26a945.length === 0x0) && (await db.query("INSERT INTO tool_setup (uid_zalo_system, zalo_system_money, zalo_custom_money) VALUES (NULL, 30000.00, 20000.00)"), _0x26a945 = await db.query("SELECT * FROM tool_setup LIMIT 1"));
    let _0x42953d = null;
    if (_0x26a945[0x0].uid_zalo_system) {
      const _0x20f43a = await db.query("SELECT UID, displayName, phoneNumber, Avatar, accStatus FROM zalo_account WHERE UID = ?", [_0x26a945[0x0].uid_zalo_system]);
      _0x42953d = _0x20f43a.length > 0x0 ? sanitizeZaloAccount(_0x20f43a[0x0]) : null;
    }
    _0x10bd27.json({
      'success': true,
      'message': "Lấy cấu hình thành công",
      'data': {
        ..._0x26a945[0x0],
        'systemAccount': _0x42953d
      }
    });
  } catch (_0x54769c) {
    console.error("❌ Get Tool Setup Error:", _0x54769c), _0x10bd27.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy cấu hình",
      'error': _0x54769c.message
    });
  }
}, exports.updateToolSetup = async (_0x30ce4f, _0x1578a8) => {
  try {
    const {
      uid_zalo_system: _0xe44154,
      zalo_system_money: _0x41dcc6,
      zalo_custom_money: _0xcca8ca
    } = _0x30ce4f.body;
    console.log("⚙️ Admin Update Tool Setup:", {
      'uid_zalo_system': _0xe44154,
      'zalo_system_money': _0x41dcc6,
      'zalo_custom_money': _0xcca8ca
    });
    if (_0x41dcc6 !== undefined && (_0x41dcc6 < 0x0 || isNaN(_0x41dcc6))) return _0x1578a8.status(0x190).json({
      'success': false,
      'message': "Phí tài khoản hệ thống không hợp lệ"
    });
    if (_0xcca8ca !== undefined && (_0xcca8ca < 0x0 || isNaN(_0xcca8ca))) return _0x1578a8.status(0x190).json({
      'success': false,
      'message': "Phí tài khoản người dùng không hợp lệ"
    });
    if (_0xe44154) {
      const _0x144f4c = await db.query("SELECT UID FROM zalo_account WHERE UID = ?", [_0xe44154]);
      if (_0x144f4c.length === 0x0) return _0x1578a8.status(0x190).json({
        'success': false,
        'message': "UID tài khoản Zalo hệ thống không tồn tại"
      });
    }
    const _0x4ac040 = await db.query("SELECT STT FROM tool_setup LIMIT 1");
    if (!_0x4ac040 || _0x4ac040.length === 0x0) await db.query("INSERT INTO tool_setup (uid_zalo_system, zalo_system_money, zalo_custom_money) VALUES (?, ?, ?)", [_0xe44154 || null, _0x41dcc6 || 0x7530, _0xcca8ca || 0x4e20]);else {
      const _0xb7183a = [],
        _0x65f956 = [];
      _0xe44154 !== undefined && (_0xb7183a.push("uid_zalo_system = ?"), _0x65f956.push(_0xe44154 || null)), _0x41dcc6 !== undefined && (_0xb7183a.push("zalo_system_money = ?"), _0x65f956.push(_0x41dcc6)), _0xcca8ca !== undefined && (_0xb7183a.push("zalo_custom_money = ?"), _0x65f956.push(_0xcca8ca)), _0xb7183a.length > 0x0 && (_0x65f956.push(_0x4ac040[0x0].STT), await db.query("UPDATE tool_setup SET " + _0xb7183a.join(',\x20') + " WHERE STT = ?", _0x65f956));
    }
    const _0x2a3026 = await db.query("SELECT * FROM tool_setup LIMIT 1");
    console.log("✅ Tool Setup Updated Successfully"), _0x1578a8.json({
      'success': true,
      'message': "Cập nhật cấu hình thành công",
      'data': _0x2a3026[0x0]
    });
  } catch (_0x554b5d) {
    console.error("❌ Update Tool Setup Error:", _0x554b5d), _0x1578a8.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi cập nhật cấu hình",
      'error': _0x554b5d.message
    });
  }
}, exports.getAllZaloAccounts = async (_0x3ad546, _0x1976e0) => {
  try {
    console.log("📱 Admin Get All Zalo Accounts");
    const _0xc2cbfe = await db.query("SELECT \n                UID, \n                displayName, \n                phoneNumber, \n                Avatar, \n                accStatus,\n                ImportTime\n             FROM zalo_account\n             ORDER BY ImportTime DESC"),
      _0x1d1cc6 = sanitizeZaloAccounts(_0xc2cbfe);
    _0x1976e0.json({
      'success': true,
      'message': "Lấy danh sách tài khoản Zalo thành công",
      'data': _0x1d1cc6,
      'total': _0x1d1cc6.length
    });
  } catch (_0x2dc4e2) {
    console.error("❌ Get All Zalo Accounts Error:", _0x2dc4e2), _0x1976e0.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách tài khoản Zalo",
      'error': _0x2dc4e2.message
    });
  }
}, exports.getBlockedIPsList = async (_0x5b15b6, _0x4514d6) => {
  try {
    console.log("🚫 Admin Get Blocked IPs List");
    const _0x4c441e = await getBlockedIPs();
    _0x4514d6.json({
      'success': true,
      'message': "Lấy danh sách IP bị chặn thành công",
      'data': _0x4c441e,
      'total': _0x4c441e.length
    });
  } catch (_0x410a66) {
    console.error("❌ Get Blocked IPs Error:", _0x410a66), _0x4514d6.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách IP bị chặn",
      'error': _0x410a66.message
    });
  }
}, exports.unblockIPAddress = async (_0x298660, _0x35309b) => {
  try {
    const {
      ipAddress: _0x1ae475
    } = _0x298660.params;
    console.log("✅ Admin Unblock IP:", _0x1ae475);
    if (!_0x1ae475) return _0x35309b.status(0x190).json({
      'success': false,
      'message': "Vui lòng cung cấp địa chỉ IP"
    });
    const _0x25c157 = await unblockIP(_0x1ae475);
    _0x25c157.success ? _0x35309b.json({
      'success': true,
      'message': "Đã gỡ chặn IP: " + _0x1ae475,
      'affectedRows': _0x25c157.affectedRows
    }) : _0x35309b.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi gỡ chặn IP",
      'error': _0x25c157.error
    });
  } catch (_0x469b85) {
    console.error("❌ Unblock IP Error:", _0x469b85), _0x35309b.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi gỡ chặn IP",
      'error': _0x469b85.message
    });
  }
}, exports.blockIPManual = async (_0x5073cb, _0x12bae7) => {
  try {
    const {
      ipAddress: _0xa4e603,
      blockType: _0x3f7f94,
      reason: _0x13d8d7,
      blockMinutes: _0x1fa3d1
    } = _0x5073cb.body;
    console.log("🚫 Admin Block IP Manual:", {
      'ipAddress': _0xa4e603,
      'blockType': _0x3f7f94,
      'reason': _0x13d8d7,
      'blockMinutes': _0x1fa3d1
    });
    if (!_0xa4e603) return _0x12bae7.status(0x190).json({
      'success': false,
      'message': "Vui lòng cung cấp địa chỉ IP"
    });
    const {
        blockIP: _0x46f93b
      } = require("./captchaController"),
      _0x215b09 = await _0x46f93b(_0xa4e603, _0x3f7f94 || "both", _0x13d8d7 || "Chặn thủ công bởi admin", 0x0, _0x1fa3d1 || 0xf);
    _0x215b09.success ? _0x12bae7.json({
      'success': true,
      'message': "Đã chặn IP: " + _0xa4e603 + " trong " + _0x215b09.blockMinutes + " phút",
      'blockMinutes': _0x215b09.blockMinutes
    }) : _0x12bae7.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi chặn IP",
      'error': _0x215b09.error
    });
  } catch (_0x5cf453) {
    console.error("❌ Block IP Manual Error:", _0x5cf453), _0x12bae7.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi chặn IP",
      'error': _0x5cf453.message
    });
  }
}, exports.getAllAutoRequests = async (_0x151bf7, _0x1ffb5d) => {
  try {
    console.log("📋 Admin Get All Auto Requests");
    const _0x2d4aa8 = await db.query("\n            SELECT \n                ar.reqID,\n                ar.phoneNumber,\n                ar.UID,\n                ar.displayName,\n                ar.imageUrl,\n                ar.sendResult,\n                ar.Detail,\n                ar.created_at,\n                ar.fee_charged,\n                ar.use_system_account,\n                ar.sender_zalo_uid,\n                COALESCE(u.userName, 'N/A') as userName,\n                COALESCE(u.userID, 0) as userID\n            FROM auto_request ar\n            LEFT JOIN user_link_auto_request ular ON ar.reqID = ular.reqID\n            LEFT JOIN user u ON ular.userID = u.userID\n            ORDER BY ar.created_at DESC\n            LIMIT 1000\n        "),
      _0x20c28a = _0x2d4aa8.map(_0x1407c9 => ({
        'reqID': _0x1407c9.reqID,
        'phoneNumber': _0x1407c9.phoneNumber,
        'UID': _0x1407c9.UID,
        'displayName': _0x1407c9.displayName,
        'Detail': _0x1407c9.Detail,
        'created_at': _0x1407c9.created_at,
        'fee_charged': _0x1407c9.fee_charged,
        'use_system_account': _0x1407c9.use_system_account,
        'sender_zalo_uid': _0x1407c9.sender_zalo_uid,
        'userName': _0x1407c9.userName,
        'userID': _0x1407c9.userID,
        'sendResult': _0x1407c9.sendResult
      }));
    _0x1ffb5d.json({
      'success': true,
      'message': "Lấy danh sách request thành công",
      'data': _0x20c28a,
      'total': _0x20c28a.length
    });
  } catch (_0x498f18) {
    console.error("❌ Get All Auto Requests Error:", _0x498f18), _0x1ffb5d.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách request",
      'error': _0x498f18.message
    });
  }
};
