// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/authController.js
const bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken"),
  db = require("../config/database"),
  {
    updateLoginInfo
  } = require("../middleware/auth"),
  {
    sanitizeAuthResponse,
    sanitizeUserProfile,
    maskSensitiveData
  } = require("../utils/sanitize"),
  {
    verifyCaptcha,
    recordLoginAttempt,
    isCaptchaRequired,
    resetLoginAttempts,
    getClientIP,
    isIPBlocked,
    checkAndBlockIP
  } = require("./captchaController"),
  register = async (_0x3912d5, _0x3c12a2) => {
    try {
      const {
          userName: _0x2a1ecc,
          password: _0x36ce96,
          email: _0x224eb4,
          captchaID: _0x5ba390,
          captchaValue: _0x3d4ebf
        } = _0x3912d5.body,
        _0x52075f = getClientIP(_0x3912d5);
      console.log("Register attempt:", maskSensitiveData({
        'userName': _0x2a1ecc,
        'password': _0x36ce96,
        'email': _0x224eb4
      }));
      const _0x5c544f = await isIPBlocked(_0x52075f, 'register');
      if (_0x5c544f.blocked) return _0x3c12a2.status(0x1ad).json({
        'success': false,
        'message': "IP của bạn đã bị chặn tạm thời do đăng ký sai quá nhiều lần. Vui lòng thử lại sau " + _0x5c544f.remainingMinutes + '\x20phút.',
        'blocked': true,
        'remainingMinutes': _0x5c544f.remainingMinutes,
        'reason': _0x5c544f.reason
      });
      if (!_0x2a1ecc || !_0x36ce96 || !_0x224eb4) return _0x3c12a2.status(0x190).json({
        'success': false,
        'message': "Vui lòng điền đầy đủ thông tin"
      });
      if (!_0x5ba390 || !_0x3d4ebf) return _0x3c12a2.status(0x190).json({
        'success': false,
        'message': "Vui lòng nhập mã CAPTCHA",
        'captchaRequired': true
      });
      const _0x38097d = await verifyCaptcha(_0x5ba390, _0x3d4ebf, _0x52075f, "register");
      if (!_0x38097d.valid) {
        await recordLoginAttempt(_0x52075f, _0x2a1ecc, "register", false);
        const _0x376577 = await checkAndBlockIP(_0x52075f, "register");
        if (_0x376577.blocked) return _0x3c12a2.status(0x1ad).json({
          'success': false,
          'message': "Bạn đã nhập sai quá " + _0x376577.failedCount + " lần. IP bị chặn " + _0x376577.blockDurationMinutes + " phút.",
          'blocked': true,
          'blockDurationMinutes': _0x376577.blockDurationMinutes
        });
        return _0x3c12a2.status(0x190).json({
          'success': false,
          'message': _0x38097d.message,
          'captchaRequired': true,
          'captchaInvalid': true,
          'remainingAttempts': _0x376577.remainingAttempts
        });
      }
      const _0x19978d = await db.query("SELECT userID FROM user WHERE userName = ? OR email = ?", [_0x2a1ecc, _0x224eb4]);
      if (_0x19978d.length > 0x0) return _0x3c12a2.status(0x190).json({
        'success': false,
        'message': "Tên đăng nhập hoặc email đã tồn tại"
      });
      const _0x100782 = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 0xa,
        _0x28f799 = await bcrypt.hash(_0x36ce96, _0x100782),
        _0x245bf0 = await db.query("INSERT INTO user (userName, password, email, userRole, totalMoney, lastIP) \n             VALUES (?, ?, ?, 2, 0.00, ?)", [_0x2a1ecc, _0x28f799, _0x224eb4, _0x52075f]),
        _0x484c4e = jwt.sign({
          'userID': _0x245bf0.insertId,
          'userName': _0x2a1ecc,
          'email': _0x224eb4,
          'userRole': 0x2
        }, process.env.JWT_SECRET, {
          'expiresIn': process.env.JWT_EXPIRE || "24h"
        }),
        _0x3d9475 = sanitizeAuthResponse({
          'userID': _0x245bf0.insertId,
          'userName': _0x2a1ecc,
          'email': _0x224eb4,
          'userRole': 0x2
        }, _0x484c4e);
      console.log("✅ Registration successful:", _0x2a1ecc), _0x3c12a2.status(0xc9).json({
        'success': true,
        'message': "Đăng ký thành công",
        'data': _0x3d9475
      });
    } catch (_0x387d3c) {
      console.error("Register Error:", _0x387d3c), _0x3c12a2.status(0x1f4).json({
        'success': false,
        'message': "Lỗi đăng ký tài khoản"
      });
    }
  },
  login = async (_0x13cf02, _0x1bb3de) => {
    try {
      const {
          userName: _0x2b0635,
          password: _0x2c01b0,
          captchaID: _0x43c53e,
          captchaValue: _0x1c18cc
        } = _0x13cf02.body,
        _0x23dad3 = getClientIP(_0x13cf02);
      console.log("Login attempt:", maskSensitiveData({
        'userName': _0x2b0635,
        'password': _0x2c01b0
      }), "from IP:", _0x23dad3);
      const _0x5e5722 = await isIPBlocked(_0x23dad3, "login");
      if (_0x5e5722.blocked) return _0x1bb3de.status(0x1ad).json({
        'success': false,
        'message': "IP của bạn đã bị chặn tạm thời do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau " + _0x5e5722.remainingMinutes + " phút.",
        'blocked': true,
        'remainingMinutes': _0x5e5722.remainingMinutes,
        'reason': _0x5e5722.reason
      });
      if (!_0x2b0635 || !_0x2c01b0) return _0x1bb3de.status(0x190).json({
        'success': false,
        'message': "Vui lòng nhập tên đăng nhập và mật khẩu"
      });
      const _0x3b7abf = await isCaptchaRequired(_0x23dad3, 'user');
      if (_0x3b7abf) {
        if (!_0x43c53e || !_0x1c18cc) return _0x1bb3de.status(0x190).json({
          'success': false,
          'message': "Bạn đã đăng nhập sai nhiều lần. Vui lòng nhập mã CAPTCHA.",
          'captchaRequired': true
        });
        const _0x43d6ae = await verifyCaptcha(_0x43c53e, _0x1c18cc, _0x23dad3, "login");
        if (!_0x43d6ae.valid) {
          await recordLoginAttempt(_0x23dad3, _0x2b0635, "user", false);
          const _0xa2e9e4 = await checkAndBlockIP(_0x23dad3, "user");
          if (_0xa2e9e4.blocked) return _0x1bb3de.status(0x1ad).json({
            'success': false,
            'message': "Bạn đã nhập sai quá " + _0xa2e9e4.failedCount + " lần. IP bị chặn " + _0xa2e9e4.blockDurationMinutes + " phút.",
            'blocked': true,
            'blockDurationMinutes': _0xa2e9e4.blockDurationMinutes
          });
          return _0x1bb3de.status(0x190).json({
            'success': false,
            'message': _0x43d6ae.message,
            'captchaRequired': true,
            'captchaInvalid': true,
            'remainingAttempts': _0xa2e9e4.remainingAttempts
          });
        }
      }
      const _0x1b479e = await db.query("SELECT userID, userName, password, email, userRole, isActive FROM user WHERE userName = ?", [_0x2b0635]);
      if (_0x1b479e.length === 0x0) {
        await recordLoginAttempt(_0x23dad3, _0x2b0635, "user", false);
        const _0x28e76b = await checkAndBlockIP(_0x23dad3, "user");
        if (_0x28e76b.blocked) return _0x1bb3de.status(0x1ad).json({
          'success': false,
          'message': "Bạn đã đăng nhập sai quá " + _0x28e76b.failedCount + " lần. IP bị chặn " + _0x28e76b.blockDurationMinutes + " phút.",
          'blocked': true,
          'blockDurationMinutes': _0x28e76b.blockDurationMinutes
        });
        const _0x582272 = await isCaptchaRequired(_0x23dad3, "user");
        return _0x1bb3de.status(0x191).json({
          'success': false,
          'message': "Tên đăng nhập hoặc mật khẩu không đúng",
          'captchaRequired': _0x582272,
          'remainingAttempts': _0x28e76b.remainingAttempts
        });
      }
      const _0x797a83 = _0x1b479e[0x0];
      if (!_0x797a83.isActive) return _0x1bb3de.status(0x193).json({
        'success': false,
        'message': "Tài khoản đã bị vô hiệu hóa"
      });
      const _0x19ae3c = await bcrypt.compare(_0x2c01b0, _0x797a83.password);
      if (!_0x19ae3c) {
        await recordLoginAttempt(_0x23dad3, _0x2b0635, 'user', false);
        const _0x284063 = await checkAndBlockIP(_0x23dad3, "user");
        if (_0x284063.blocked) return _0x1bb3de.status(0x1ad).json({
          'success': false,
          'message': "Bạn đã đăng nhập sai quá " + _0x284063.failedCount + " lần. IP bị chặn " + _0x284063.blockDurationMinutes + " phút.",
          'blocked': true,
          'blockDurationMinutes': _0x284063.blockDurationMinutes
        });
        const _0x4b1b74 = await isCaptchaRequired(_0x23dad3, 'user');
        return _0x1bb3de.status(0x191).json({
          'success': false,
          'message': "Tên đăng nhập hoặc mật khẩu không đúng",
          'captchaRequired': _0x4b1b74,
          'remainingAttempts': _0x284063.remainingAttempts
        });
      }
      await resetLoginAttempts(_0x23dad3, "user"), await updateLoginInfo(_0x797a83.userID, _0x23dad3);
      const _0x15c285 = jwt.sign({
          'userID': _0x797a83.userID,
          'userName': _0x797a83.userName,
          'email': _0x797a83.email,
          'userRole': _0x797a83.userRole
        }, process.env.JWT_SECRET, {
          'expiresIn': process.env.JWT_EXPIRE || "24h"
        }),
        _0x2bdf5e = sanitizeAuthResponse(_0x797a83, _0x15c285);
      console.log("✅ Login successful:", _0x2b0635), _0x1bb3de.json({
        'success': true,
        'message': "Đăng nhập thành công",
        'data': _0x2bdf5e
      });
    } catch (_0xc02232) {
      console.error("Login Error:", _0xc02232), _0x1bb3de.status(0x1f4).json({
        'success': false,
        'message': "Lỗi đăng nhập"
      });
    }
  },
  getProfile = async (_0x4b7300, _0x50e1cc) => {
    try {
      const _0x1e7929 = await db.query("SELECT userID, userName, email, totalMoney, userRole, \n                    createdAt, isActive, lastLogin\n             FROM user WHERE userID = ?", [_0x4b7300.user.userID]);
      if (_0x1e7929.length === 0x0) return _0x50e1cc.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy người dùng"
      });
      const _0x243a61 = sanitizeUserProfile(_0x1e7929[0x0]);
      _0x50e1cc.json({
        'success': true,
        'data': _0x243a61
      });
    } catch (_0x59abec) {
      console.error("Get Profile Error:", _0x59abec), _0x50e1cc.status(0x1f4).json({
        'success': false,
        'message': "Lỗi lấy thông tin tài khoản"
      });
    }
  },
  changePassword = async (_0x40517f, _0x26c522) => {
    try {
      const {
        currentPassword: _0x159ba2,
        newPassword: _0x29207f
      } = _0x40517f.body;
      console.log("Change password attempt:", {
        'userID': _0x40517f.user.userID,
        ...maskSensitiveData({
          'currentPassword': _0x159ba2,
          'newPassword': _0x29207f
        })
      });
      if (!_0x159ba2 || !_0x29207f) return _0x26c522.status(0x190).json({
        'success': false,
        'message': "Vui lòng điền đầy đủ thông tin"
      });
      if (_0x29207f.length < 0x6) return _0x26c522.status(0x190).json({
        'success': false,
        'message': "Mật khẩu mới phải có ít nhất 6 ký tự"
      });
      const _0x35f986 = await db.query("SELECT password FROM user WHERE userID = ?", [_0x40517f.user.userID]);
      if (_0x35f986.length === 0x0) return _0x26c522.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy người dùng"
      });
      const _0x5f1007 = await bcrypt.compare(_0x159ba2, _0x35f986[0x0].password);
      if (!_0x5f1007) return _0x26c522.status(0x191).json({
        'success': false,
        'message': "Mật khẩu hiện tại không đúng"
      });
      const _0x3eb8db = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 0xa,
        _0x4a9763 = await bcrypt.hash(_0x29207f, _0x3eb8db);
      await db.query("UPDATE user SET password = ? WHERE userID = ?", [_0x4a9763, _0x40517f.user.userID]), console.log("✅ Password changed successfully for userID:", _0x40517f.user.userID), _0x26c522.json({
        'success': true,
        'message': "Đổi mật khẩu thành công"
      });
    } catch (_0x3c3c35) {
      console.error("Change Password Error:", _0x3c3c35), _0x26c522.status(0x1f4).json({
        'success': false,
        'message': "Lỗi đổi mật khẩu"
      });
    }
  };
module.exports = {
  'register': register,
  'login': login,
  'getProfile': getProfile,
  'changePassword': changePassword
};
