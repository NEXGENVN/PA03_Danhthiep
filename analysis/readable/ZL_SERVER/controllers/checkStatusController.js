// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/checkStatusController.js
const CryptoJS = require("crypto-js"),
  axios = require("../utils/axiosInstance"),
  db = require("../config/database"),
  {
    getZaloAccountConfig,
    sanitizeZaloAccount,
    sanitizeZaloAccounts,
    maskSensitiveData
  } = require("../utils/sanitize");
async function getToolSetup() {
  const _0x366e93 = await db.query("SELECT * FROM tool_setup WHERE STT = 1");
  if (_0x366e93.length === 0x0) return {
    'uid_zalo_system': null,
    'zalo_system_money': 0x7530,
    'zalo_custom_money': 0x4e20,
    'check_phone_system_money': 0x2710,
    'check_phone_custom_money': 0x1388,
    'check_card_money': 0x1388
  };
  return _0x366e93[0x0];
}
function encodeAES(_0x226fd9, _0x5b599f) {
  try {
    const _0xc8befa = CryptoJS.enc.Base64.parse(_0x5b599f),
      _0x36dd11 = CryptoJS.AES.encrypt(_0x226fd9, _0xc8befa, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x36dd11.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (_0x51aca7) {
    return console.error("Encode AES Error:", _0x51aca7), null;
  }
}
function decodeAES(_0x3225a, _0x440044) {
  try {
    const _0x55b687 = decodeURIComponent(_0x3225a),
      _0xdd56b3 = CryptoJS.enc.Base64.parse(_0x440044),
      _0xc1d370 = CryptoJS.AES.decrypt({
        'ciphertext': CryptoJS.enc.Base64.parse(_0x55b687),
        'salt': ''
      }, _0xdd56b3, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0xc1d370.toString(CryptoJS.enc.Utf8);
  } catch (_0x184b30) {
    return console.error("Decode AES Error:", _0x184b30), null;
  }
}
function normalizePhoneNumber(_0x4374ff) {
  return _0x4374ff = _0x4374ff.replace(/[\s\-]/g, ''), _0x4374ff.startsWith('0') && (_0x4374ff = '84' + _0x4374ff.substring(0x1)), _0x4374ff.startsWith("+84") && (_0x4374ff = _0x4374ff.substring(0x1)), _0x4374ff;
}
function formatLastOnline(_0xceda7a) {
  if (!_0xceda7a || _0xceda7a === 0x0) return "Không xác định";
  try {
    const _0x463c46 = new Date(_0xceda7a),
      _0x78187a = String(_0x463c46.getHours()).padStart(0x2, '0'),
      _0x47402f = String(_0x463c46.getMinutes()).padStart(0x2, '0'),
      _0x3de6c4 = String(_0x463c46.getSeconds()).padStart(0x2, '0'),
      _0x5d68ad = String(_0x463c46.getDate()).padStart(0x2, '0'),
      _0x89d4aa = String(_0x463c46.getMonth() + 0x1).padStart(0x2, '0'),
      _0x539959 = _0x463c46.getFullYear();
    return _0x78187a + ':' + _0x47402f + ':' + _0x3de6c4 + '\x20' + _0x5d68ad + '/' + _0x89d4aa + '/' + _0x539959;
  } catch (_0x39b533) {
    return "Lỗi định dạng";
  }
}
async function searchPhoneNumber(_0x2641b6, _0x5b92fc) {
  try {
    const _0x3b7c9a = {
        'phone': _0x2641b6,
        'avatar_size': 0xf0,
        'language': 'vi',
        'imei': _0x5b92fc.IMEI,
        'reqSrc': 0x55
      },
      _0x4de8f9 = JSON.stringify(_0x3b7c9a),
      _0x270be4 = encodeAES(_0x4de8f9, _0x5b92fc.ENCRYPTION_KEY);
    if (!_0x270be4) throw new Error("Không thể mã hóa request");
    const _0x4c75d2 = encodeURIComponent(_0x270be4),
      _0x381fa7 = await axios.get("https://tt-friend-wpa.chat.zalo.me/api/friend/profile/get?zpw_ver=670&zpw_type=30&params=" + _0x4c75d2, {
        'headers': {
          'Cookie': 'zpw_sek=' + _0x5b92fc.COOKIE_ZPW_SEK,
          'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          'Accept': "application/json, text/plain, */*",
          'Content-Type': "application/x-www-form-urlencoded",
          'Origin': "https://chat.zalo.me",
          'Referer': "https://chat.zalo.me/"
        },
        'decompress': true,
        'timeout': 0x2710
      });
    if (_0x381fa7.data.error_code === 0x0 && _0x381fa7.data.data) {
      const _0xf67ad4 = _0x381fa7.data.data,
        _0x4fd233 = decodeAES(_0xf67ad4, _0x5b92fc.ENCRYPTION_KEY);
      if (!_0x4fd233) return {
        'success': false,
        'message': "Lỗi giải mã dữ liệu"
      };
      let _0x585baf = JSON.parse(_0x4fd233);
      if (_0x585baf.error_code !== 0x0) return {
        'success': false,
        'message': _0x585baf.error_message || "Không tìm thấy người dùng"
      };
      return {
        'success': true,
        'data': _0x585baf.data
      };
    } else return {
      'success': false,
      'message': _0x381fa7.data.error_message || "Không tìm thấy người dùng"
    };
  } catch (_0x37e9ca) {
    return console.error("❌ Search Phone Error:", _0x37e9ca.message), {
      'success': false,
      'message': "Lỗi khi tìm kiếm số điện thoại: " + _0x37e9ca.message
    };
  }
}
async function getProfileInfo(_0x58976c, _0x3b31bd) {
  try {
    const _0x5b1190 = {
        'phonebook_version': Math.floor(Date.now() / 0x3e8),
        'friend_pversion_map': [_0x58976c + '_0'],
        'avatar_size': 0xf0,
        'language': 'vi',
        'show_online_status': 0x1,
        'imei': _0x3b31bd.IMEI
      },
      _0x25a8ac = JSON.stringify(_0x5b1190),
      _0x3bf001 = encodeAES(_0x25a8ac, _0x3b31bd.ENCRYPTION_KEY);
    if (!_0x3bf001) throw new Error("Không thể mã hóa request");
    const _0x16426d = encodeURIComponent(_0x3bf001),
      _0x522abf = await axios.post("https://tt-profile-wpa.chat.zalo.me/api/social/friend/getprofiles/v2?zpw_ver=671&zpw_type=30", "params=" + _0x16426d, {
        'headers': {
          'Cookie': 'zpw_sek=' + _0x3b31bd.COOKIE_ZPW_SEK,
          'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          'Accept': "application/json, text/plain, */*",
          'Content-Type': "application/x-www-form-urlencoded",
          'Origin': "https://chat.zalo.me",
          'Referer': "https://chat.zalo.me/"
        },
        'decompress': true,
        'timeout': 0x2710
      });
    if (_0x522abf.data.error_code !== 0x0) return {
      'success': false,
      'message': _0x522abf.data.error_message || "API trả về lỗi"
    };
    if (_0x522abf.data.data && typeof _0x522abf.data.data === 'string') {
      const _0x388587 = decodeAES(_0x522abf.data.data, _0x3b31bd.ENCRYPTION_KEY);
      if (!_0x388587) return {
        'success': false,
        'message': "Không thể giải mã dữ liệu profile"
      };
      const _0x1ddbaf = JSON.parse(_0x388587);
      if (_0x1ddbaf.data && _0x1ddbaf.data.changed_profiles) {
        const _0x5b35ed = _0x1ddbaf.data.changed_profiles,
          _0x996dc = Object.keys(_0x5b35ed)[0x0];
        if (_0x996dc) {
          const _0x1e6a6c = _0x5b35ed[_0x996dc];
          return {
            'success': true,
            'data': {
              'userId': _0x1e6a6c.userId,
              'displayName': _0x1e6a6c.displayName,
              'zaloName': _0x1e6a6c.zaloName,
              'avatar': _0x1e6a6c.avatar,
              'lastOnline': _0x1e6a6c.lastActionTime
            }
          };
        }
      }
    }
    return {
      'success': false,
      'message': "Không tìm thấy thông tin profile"
    };
  } catch (_0x4b818c) {
    return console.error("❌ Get Profile Error:", _0x4b818c.message), {
      'success': false,
      'message': "Lỗi khi lấy profile: " + _0x4b818c.message
    };
  }
}
const preCheckStatus = async (_0x58b529, _0x10be47) => {
    try {
      let {
        phoneNumber: _0x5464d4,
        encryptedFid: _0x100711,
        zaloUID: _0x1e0a51,
        type: _0x2c7880
      } = _0x58b529.body;
      if (!_0x1e0a51 || !_0x5464d4 && !_0x100711) return _0x10be47.status(0x190).json({
        'success': false,
        'message': "Thiếu thông tin cần thiết"
      });
      const _0x2cd763 = await getToolSetup();
      let _0x2d1077 = _0x2cd763.uid_zalo_system ? _0x2cd763.uid_zalo_system.toString() : null,
        _0x45efb5 = _0x1e0a51 === "SYSTEM" || _0x1e0a51.toString() === _0x2d1077;
      _0x1e0a51 === "SYSTEM" && _0x2d1077 && (_0x1e0a51 = _0x2d1077);
      let _0x8d331d = 0x0;
      _0x2c7880 === "phone" ? _0x8d331d = _0x45efb5 ? _0x2cd763.check_phone_system_money || 0x2710 : _0x2cd763.check_phone_custom_money || 0x1388 : _0x8d331d = _0x2cd763.check_card_money || 0x1388;
      _0x8d331d = parseFloat(_0x8d331d);
      let _0x548561;
      _0x45efb5 ? _0x548561 = await db.query("SELECT UID, displayName, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK\n                 FROM zalo_account WHERE UID = ? AND accStatus = 'Đang hoạt động'", [_0x1e0a51]) : _0x548561 = await db.query("SELECT za.UID, za.displayName, za.IMEI, za.ENCRYPTION_KEY, za.COOKIE_ZPW_SEK\n                 FROM zalo_account za\n                 INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n                 WHERE ulza.userID = ? AND za.UID = ? AND za.accStatus = 'Đang hoạt động'", [_0x58b529.user.userID, _0x1e0a51]);
      if (_0x548561.length === 0x0) return _0x10be47.status(0x190).json({
        'success': false,
        'message': "Tài khoản Zalo không khả dụng hoặc không thuộc quyền sở hữu"
      });
      const _0x191c5b = getZaloAccountConfig(_0x548561[0x0]);
      let _0x3e9f3d = null;
      if (_0x2c7880 === "phone") {
        _0x5464d4 = normalizePhoneNumber(_0x5464d4);
        const _0x1c2c24 = await searchPhoneNumber(_0x5464d4, _0x191c5b);
        if (!_0x1c2c24.success) return _0x10be47.status(0x194).json({
          'success': false,
          'message': _0x1c2c24.message
        });
        _0x3e9f3d = {
          'userId': _0x1c2c24.data.uid,
          'displayName': _0x1c2c24.data.display_name || _0x1c2c24.data.zalo_name,
          'zaloName': _0x1c2c24.data.zalo_name,
          'avatar': _0x1c2c24.data.avatar
        };
      } else {
        const _0x128af9 = decodeAES(_0x100711, _0x191c5b.ENCRYPTION_KEY);
        if (!_0x128af9) return _0x10be47.status(0x190).json({
          'success': false,
          'message': "Không thể giải mã dữ liệu PARAMS"
        });
        let _0x2b8178;
        try {
          const _0x597e3d = JSON.parse(_0x128af9);
          _0x2b8178 = _0x597e3d.fid;
        } catch (_0x1f4916) {
          _0x2b8178 = _0x128af9;
        }
        if (!_0x2b8178) return _0x10be47.status(0x190).json({
          'success': false,
          'message': "Dữ liệu PARAMS không hợp lệ"
        });
        const _0x26aba8 = await getProfileInfo(_0x2b8178, _0x191c5b);
        if (!_0x26aba8.success) return _0x10be47.status(0x194).json({
          'success': false,
          'message': _0x26aba8.message
        });
        _0x3e9f3d = {
          'userId': _0x26aba8.data.userId,
          'displayName': _0x26aba8.data.displayName,
          'zaloName': _0x26aba8.data.zaloName,
          'avatar': _0x26aba8.data.avatar
        };
      }
      const _0x718de0 = await db.query("SELECT totalMoney FROM user WHERE userID = ?", [_0x58b529.user.userID]),
        _0x2eabfc = _0x718de0.length > 0x0 ? parseFloat(_0x718de0[0x0].totalMoney) : 0x0;
      _0x10be47.json({
        'success': true,
        'data': {
          'profile': _0x3e9f3d,
          'fee': _0x8d331d,
          'isSystemAccount': _0x45efb5,
          'currentBalance': _0x2eabfc,
          'totalMoney': _0x2eabfc
        }
      });
    } catch (_0x5690d8) {
      console.error("Pre-check Status Error:", _0x5690d8), _0x10be47.status(0x1f4).json({
        'success': false,
        'message': "Lỗi hệ thống"
      });
    }
  },
  confirmCheckStatus = async (_0x408f67, _0x5b99fe) => {
    let _0x5038be;
    try {
      let {
        targetUserId: _0x29e59e,
        zaloUID: _0x27a07e,
        type: _0x34bfb7,
        phoneNumber: _0xaeae9b
      } = _0x408f67.body;
      if (!_0x29e59e || !_0x27a07e || !_0x34bfb7) return _0x5b99fe.status(0x190).json({
        'success': false,
        'message': "Thiếu thông tin cần thiết"
      });
      const _0x38c99f = await getToolSetup();
      let _0x2a7a9a = _0x38c99f.uid_zalo_system ? _0x38c99f.uid_zalo_system.toString() : null,
        _0x1fba66 = _0x27a07e === "SYSTEM" || _0x27a07e.toString() === _0x2a7a9a;
      _0x27a07e === "SYSTEM" && _0x2a7a9a && (_0x27a07e = _0x2a7a9a);
      let _0x584ae6 = 0x0;
      _0x34bfb7 === "phone" ? _0x584ae6 = _0x1fba66 ? _0x38c99f.check_phone_system_money || 0x2710 : _0x38c99f.check_phone_custom_money || 0x1388 : _0x584ae6 = _0x38c99f.check_card_money || 0x1388;
      _0x584ae6 = parseFloat(_0x584ae6), _0x5038be = await db.getConnection(), await _0x5038be.beginTransaction();
      const [_0x37f93e] = await _0x5038be.query("SELECT totalMoney FROM user WHERE userID = ? FOR UPDATE", [_0x408f67.user.userID]);
      if (!_0x37f93e || _0x37f93e.length === 0x0) return await _0x5038be.rollback(), _0x5b99fe.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy thông tin người dùng"
      });
      const _0x1706f6 = parseFloat(_0x37f93e[0x0].totalMoney);
      if (_0x1706f6 < _0x584ae6) return await _0x5038be.rollback(), _0x5b99fe.status(0x190).json({
        'success': false,
        'message': "Số dư không đủ để thực hiện yêu cầu này"
      });
      let _0x2af54d;
      _0x1fba66 ? [_0x2af54d] = await _0x5038be.query("SELECT UID, displayName, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK\n                 FROM zalo_account WHERE UID = ? AND accStatus = 'Đang hoạt động'", [_0x27a07e]) : [_0x2af54d] = await _0x5038be.query("SELECT za.UID, za.displayName, za.IMEI, za.ENCRYPTION_KEY, za.COOKIE_ZPW_SEK\n                 FROM zalo_account za\n                 INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n                 WHERE ulza.userID = ? AND za.UID = ? AND za.accStatus = 'Đang hoạt động'", [_0x408f67.user.userID, _0x27a07e]);
      if (_0x2af54d.length === 0x0) return await _0x5038be.rollback(), _0x5b99fe.status(0x190).json({
        'success': false,
        'message': "Tài khoản Zalo không khả dụng"
      });
      const _0x2093c2 = getZaloAccountConfig(_0x2af54d[0x0]),
        _0xcdc932 = await getProfileInfo(_0x29e59e, _0x2093c2);
      if (!_0xcdc932.success) return await _0x5038be.rollback(), _0x5b99fe.status(0x194).json({
        'success': false,
        'message': "Không thể lấy thông tin trạng thái: " + _0xcdc932.message
      });
      const _0x1261d3 = _0x1706f6 - _0x584ae6;
      await _0x5038be.query("UPDATE user SET totalMoney = ? WHERE userID = ?", [_0x1261d3, _0x408f67.user.userID]);
      const _0x139bc4 = formatLastOnline(_0xcdc932.data.lastOnline),
        _0x4ec0d8 = "Check Last-Online thành công\nThời gian online lần cuối: " + _0x139bc4,
        [_0x455954] = await _0x5038be.query("INSERT INTO auto_request (phoneNumber, UID, displayName, Detail, sendResult, fee_charged, use_system_account, sender_zalo_uid, created_at)\n             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())", [_0x34bfb7 === "phone" ? _0xaeae9b || null : "[Danh thiếp]", _0x29e59e, _0xcdc932.data.displayName, _0x4ec0d8, "SUCCESS", _0x584ae6, _0x1fba66 ? 0x1 : 0x0, _0x27a07e]);
      await _0x5038be.query("INSERT INTO user_link_auto_request (userID, reqID) VALUES (?, ?)", [_0x408f67.user.userID, _0x455954.insertId]), await _0x5038be.commit(), _0x5b99fe.json({
        'success': true,
        'data': _0xcdc932.data,
        'newBalance': _0x1261d3
      });
    } catch (_0x5a7928) {
      if (_0x5038be) await _0x5038be.rollback();
      console.error("Confirm Check Status Error:", _0x5a7928), _0x5b99fe.status(0x1f4).json({
        'success': false,
        'message': "Lỗi hệ thống khi xử lý yêu cầu"
      });
    } finally {
      if (_0x5038be) _0x5038be.release();
    }
  };
module.exports = {
  'preCheckStatus': preCheckStatus,
  'confirmCheckStatus': confirmCheckStatus
};
