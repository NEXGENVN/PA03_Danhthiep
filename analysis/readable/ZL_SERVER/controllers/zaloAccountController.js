// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/zaloAccountController.js
const db = require("../config/database"),
  CryptoJS = require("crypto-js"),
  axios = require("../utils/axiosInstance"),
  {
    sanitizeZaloAccount,
    sanitizeZaloAccounts,
    maskSensitiveData
  } = require("../utils/sanitize");
function encodeAES(_0x55764a, _0x40e91e) {
  try {
    const _0x265c33 = CryptoJS.enc.Base64.parse(_0x40e91e),
      _0xcc9b94 = CryptoJS.AES.encrypt(_0x55764a, _0x265c33, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0xcc9b94.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (_0x392a27) {
    return console.error("Encode AES Error:", _0x392a27), null;
  }
}
function decodeAES(_0x390afb, _0x4090b1) {
  try {
    const _0x288762 = CryptoJS.enc.Base64.parse(_0x4090b1),
      _0x433b67 = CryptoJS.AES.decrypt({
        'ciphertext': CryptoJS.enc.Base64.parse(_0x390afb),
        'salt': ''
      }, _0x288762, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x433b67.toString(CryptoJS.enc.Utf8);
  } catch (_0x226247) {
    return console.error("Decode AES Error:", _0x226247), null;
  }
}
const getZaloAccounts = async (_0x43593d, _0x4c80a8) => {
    try {
      const _0x4770aa = await db.query("SELECT \n                za.UID, \n                za.displayName, \n                za.phoneNumber, \n                za.Avatar, \n                za.accStatus,\n                za.ImportTime\n             FROM zalo_account za\n             INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n             WHERE ulza.userID = ?\n             ORDER BY za.ImportTime DESC", [_0x43593d.user.userID]),
        _0x3196a6 = sanitizeZaloAccounts(_0x4770aa);
      _0x4c80a8.json({
        'success': true,
        'data': _0x3196a6
      });
    } catch (_0x346027) {
      console.error("Get Zalo Accounts Error:", _0x346027), _0x4c80a8.status(0x1f4).json({
        'success': false,
        'message': "Lỗi lấy danh sách tài khoản Zalo"
      });
    }
  },
  getZaloAccount = async (_0x500880, _0x9dedc) => {
    try {
      const {
          uid: _0x124147
        } = _0x500880.params,
        _0x1cf19e = await db.query("SELECT linkID FROM user_link_zalo_account WHERE userID = ? AND UID = ?", [_0x500880.user.userID, _0x124147]);
      if (_0x1cf19e.length === 0x0) return _0x9dedc.status(0x193).json({
        'success': false,
        'message': "Bạn không có quyền truy cập tài khoản này"
      });
      const _0x2833eb = await db.query("SELECT \n                UID, \n                displayName, \n                phoneNumber, \n                Avatar, \n                accStatus,\n                ImportTime\n             FROM zalo_account \n             WHERE UID = ?", [_0x124147]);
      if (_0x2833eb.length === 0x0) return _0x9dedc.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy tài khoản Zalo"
      });
      const _0x25cd41 = sanitizeZaloAccount({
        ..._0x2833eb[0x0]
      });
      _0x9dedc.json({
        'success': true,
        'data': _0x25cd41
      });
    } catch (_0x13e177) {
      console.error("Get Zalo Account Error:", _0x13e177), _0x9dedc.status(0x1f4).json({
        'success': false,
        'message': "Lỗi lấy thông tin tài khoản Zalo"
      });
    }
  },
  createZaloAccount = async (_0x360179, _0x58b6f7) => {
    try {
      const {
        UID: _0x849dd8,
        displayName: _0x5be613,
        phoneNumber: _0x21be99,
        Avatar: _0x450491,
        IMEI: _0x2c345e,
        ENCRYPTION_KEY: _0x4c2ff4,
        COOKIE_ZPW_SEK: _0x1dea41
      } = _0x360179.body;
      console.log("Create Zalo Account:", {
        'UID': _0x849dd8,
        'displayName': _0x5be613,
        'phoneNumber': _0x21be99,
        'userID': _0x360179.user.userID,
        ...maskSensitiveData({
          'IMEI': _0x2c345e,
          'ENCRYPTION_KEY': _0x4c2ff4,
          'COOKIE_ZPW_SEK': _0x1dea41
        })
      });
      if (!_0x849dd8 || !_0x5be613 || !_0x2c345e || !_0x4c2ff4 || !_0x1dea41) return _0x58b6f7.status(0x190).json({
        'success': false,
        'message': "Vui lòng điền đầy đủ thông tin (UID, displayName, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK)"
      });
      const _0x319f14 = await db.query("SELECT UID FROM zalo_account WHERE UID = ?", [_0x849dd8]);
      if (_0x319f14.length > 0x0) return _0x58b6f7.status(0x190).json({
        'success': false,
        'message': "UID này đã tồn tại trong hệ thống"
      });
      await db.transaction(async _0x3f9760 => {
        await _0x3f9760.execute("INSERT INTO zalo_account \n                 (UID, displayName, phoneNumber, Avatar, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK, accStatus)\n                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Đang hoạt động')", [_0x849dd8, _0x5be613, _0x21be99, _0x450491 || null, _0x2c345e, _0x4c2ff4, _0x1dea41]), await _0x3f9760.execute("INSERT INTO user_link_zalo_account (userID, UID) VALUES (?, ?)", [_0x360179.user.userID, _0x849dd8]);
      }), console.log("✅ Zalo account created:", _0x849dd8), _0x58b6f7.status(0xc9).json({
        'success': true,
        'message': "Thêm tài khoản Zalo thành công",
        'data': {
          'UID': _0x849dd8,
          'displayName': _0x5be613,
          'phoneNumber': _0x21be99,
          'accStatus': "Đang hoạt động"
        }
      });
    } catch (_0x4e0836) {
      console.error("Create Zalo Account Error:", _0x4e0836), _0x58b6f7.status(0x1f4).json({
        'success': false,
        'message': "Lỗi thêm tài khoản Zalo"
      });
    }
  },
  updateZaloAccount = async (_0x27aef0, _0x4a62bb) => {
    try {
      const {
          uid: _0x4532f6
        } = _0x27aef0.params,
        {
          displayName: _0x4c0093,
          phoneNumber: _0x2ddc06,
          Avatar: _0x9ebcd0,
          IMEI: _0x29a33f,
          ENCRYPTION_KEY: _0x577802,
          COOKIE_ZPW_SEK: _0x2970c8,
          accStatus: _0x18fb1f
        } = _0x27aef0.body;
      console.log("Update Zalo Account:", {
        'uid': _0x4532f6,
        'displayName': _0x4c0093,
        'phoneNumber': _0x2ddc06,
        'accStatus': _0x18fb1f,
        'userID': _0x27aef0.user.userID,
        ...maskSensitiveData({
          'IMEI': _0x29a33f,
          'ENCRYPTION_KEY': _0x577802,
          'COOKIE_ZPW_SEK': _0x2970c8
        })
      });
      const _0x17c15c = await db.query("SELECT * FROM user_link_zalo_account WHERE userID = ? AND UID = ?", [_0x27aef0.user.userID, _0x4532f6]);
      if (_0x17c15c.length === 0x0) return _0x4a62bb.status(0x193).json({
        'success': false,
        'message': "Bạn không có quyền chỉnh sửa tài khoản này"
      });
      const _0x24f9a7 = [],
        _0x56ec0c = [];
      _0x4c0093 !== undefined && (_0x24f9a7.push("displayName = ?"), _0x56ec0c.push(_0x4c0093));
      _0x2ddc06 !== undefined && (_0x24f9a7.push("phoneNumber = ?"), _0x56ec0c.push(_0x2ddc06));
      _0x9ebcd0 !== undefined && (_0x24f9a7.push("Avatar = ?"), _0x56ec0c.push(_0x9ebcd0));
      _0x29a33f !== undefined && (_0x24f9a7.push('IMEI\x20=\x20?'), _0x56ec0c.push(_0x29a33f));
      _0x577802 !== undefined && (_0x24f9a7.push("ENCRYPTION_KEY = ?"), _0x56ec0c.push(_0x577802));
      _0x2970c8 !== undefined && (_0x24f9a7.push("COOKIE_ZPW_SEK = ?"), _0x56ec0c.push(_0x2970c8));
      _0x18fb1f !== undefined && (_0x24f9a7.push("accStatus = ?"), _0x56ec0c.push(_0x18fb1f));
      if (_0x24f9a7.length === 0x0) return _0x4a62bb.status(0x190).json({
        'success': false,
        'message': "Không có thông tin nào được cập nhật"
      });
      _0x56ec0c.push(_0x4532f6), await db.query("UPDATE zalo_account SET " + _0x24f9a7.join(',\x20') + ", ImportTime = NOW() WHERE UID = ?", _0x56ec0c), console.log("✅ Zalo account updated:", _0x4532f6), _0x4a62bb.json({
        'success': true,
        'message': "Cập nhật tài khoản Zalo thành công"
      });
    } catch (_0x28f487) {
      console.error("Update Zalo Account Error:", _0x28f487), _0x4a62bb.status(0x1f4).json({
        'success': false,
        'message': "Lỗi cập nhật tài khoản Zalo"
      });
    }
  },
  deleteZaloAccount = async (_0x551aef, _0x40d1f9) => {
    try {
      const {
        uid: _0x2c6ad0
      } = _0x551aef.params;
      console.log("Delete Zalo Account:", {
        'uid': _0x2c6ad0,
        'userID': _0x551aef.user.userID
      });
      const _0x513be9 = await db.query("SELECT * FROM user_link_zalo_account WHERE userID = ? AND UID = ?", [_0x551aef.user.userID, _0x2c6ad0]);
      if (_0x513be9.length === 0x0) return _0x40d1f9.status(0x193).json({
        'success': false,
        'message': "Bạn không có quyền xóa tài khoản này"
      });
      await db.query("DELETE FROM zalo_account WHERE UID = ?", [_0x2c6ad0]), console.log("✅ Zalo account deleted:", _0x2c6ad0), _0x40d1f9.json({
        'success': true,
        'message': "Xóa tài khoản Zalo thành công"
      });
    } catch (_0x5b4356) {
      console.error("Delete Zalo Account Error:", _0x5b4356), _0x40d1f9.status(0x1f4).json({
        'success': false,
        'message': "Lỗi xóa tài khoản Zalo"
      });
    }
  },
  checkAccountStatus = async (_0x54bae8, _0x34c126) => {
    try {
      const {
        uid: _0x5c9f96
      } = _0x54bae8.params;
      console.log("Check Account Status:", {
        'uid': _0x5c9f96,
        'userID': _0x54bae8.user.userID
      });
      const _0x2d4c71 = await db.query("SELECT * FROM user_link_zalo_account WHERE userID = ? AND UID = ?", [_0x54bae8.user.userID, _0x5c9f96]);
      if (_0x2d4c71.length === 0x0) return _0x34c126.status(0x193).json({
        'success': false,
        'message': "Bạn không có quyền truy cập tài khoản này"
      });
      const _0x2e85d3 = await db.query("SELECT UID, displayName, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK \n             FROM zalo_account \n             WHERE UID = ?", [_0x5c9f96]);
      if (_0x2e85d3.length === 0x0) return _0x34c126.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy tài khoản Zalo"
      });
      const {
          IMEI: _0x266fd7,
          ENCRYPTION_KEY: _0x2e6f79,
          COOKIE_ZPW_SEK: _0x1b7e81
        } = _0x2e85d3[0x0],
        _0x31c056 = await checkSingleAccountStatus(_0x266fd7, _0x2e6f79, _0x1b7e81),
        _0x39de6c = _0x31c056.isActive ? "Đang hoạt động" : "Không hoạt động";
      await db.query("UPDATE zalo_account SET accStatus = ? WHERE UID = ?", [_0x39de6c, _0x5c9f96]), console.log('✅\x20Account\x20' + _0x5c9f96 + " status updated: " + _0x39de6c), _0x34c126.json({
        'success': true,
        'message': "Cập nhật trạng thái thành công",
        'data': {
          'UID': _0x5c9f96,
          'accStatus': _0x39de6c,
          'isActive': _0x31c056.isActive,
          'displayName': _0x31c056.displayName || null,
          'error': _0x31c056.error || null
        }
      });
    } catch (_0x5557c9) {
      console.error("Check Account Status Error:", _0x5557c9), _0x34c126.status(0x1f4).json({
        'success': false,
        'message': "Lỗi kiểm tra trạng thái tài khoản"
      });
    }
  },
  checkAllAccountsStatus = async (_0x229860, _0x10d7fd) => {
    try {
      console.log("Check All Accounts Status:", {
        'userID': _0x229860.user.userID
      });
      const _0x3ae19e = await db.query("SELECT za.UID, za.displayName, za.IMEI, za.ENCRYPTION_KEY, za.COOKIE_ZPW_SEK \n             FROM zalo_account za\n             INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n             WHERE ulza.userID = ?", [_0x229860.user.userID]);
      if (_0x3ae19e.length === 0x0) return _0x10d7fd.json({
        'success': true,
        'message': "Không có tài khoản nào để kiểm tra",
        'data': []
      });
      const _0x435b44 = [];
      for (const _0x4129f3 of _0x3ae19e) {
        try {
          const _0x138b93 = await checkSingleAccountStatus(_0x4129f3.IMEI, _0x4129f3.ENCRYPTION_KEY, _0x4129f3.COOKIE_ZPW_SEK),
            _0x508fb6 = _0x138b93.isActive ? "Đang hoạt động" : "Không hoạt động";
          await db.query("UPDATE zalo_account SET accStatus = ? WHERE UID = ?", [_0x508fb6, _0x4129f3.UID]), _0x435b44.push({
            'UID': _0x4129f3.UID,
            'displayName': _0x4129f3.displayName,
            'accStatus': _0x508fb6,
            'isActive': _0x138b93.isActive,
            'checkedDisplayName': _0x138b93.displayName || null,
            'error': _0x138b93.error || null
          }), console.log("✅ Account " + _0x4129f3.UID + " checked: " + _0x508fb6), await new Promise(_0x381a21 => setTimeout(_0x381a21, 0x12c));
        } catch (_0x2adfa5) {
          console.error("Error checking account " + _0x4129f3.UID + ':', _0x2adfa5), _0x435b44.push({
            'UID': _0x4129f3.UID,
            'displayName': _0x4129f3.displayName,
            'accStatus': "Không hoạt động",
            'isActive': false,
            'error': _0x2adfa5.message
          });
        }
      }
      _0x10d7fd.json({
        'success': true,
        'message': "Đã kiểm tra " + _0x435b44.length + '\x20tài\x20khoản',
        'data': _0x435b44
      });
    } catch (_0xa2a7d4) {
      console.error("Check All Accounts Status Error:", _0xa2a7d4), _0x10d7fd.status(0x1f4).json({
        'success': false,
        'message': "Lỗi kiểm tra trạng thái tất cả tài khoản"
      });
    }
  };
async function checkSingleAccountStatus(_0x117fa3, _0x4fd6ad, _0x1dd358) {
  try {
    const _0x27d047 = {
        'avatar_size': 0x78,
        'imei': _0x117fa3
      },
      _0x53e62a = JSON.stringify(_0x27d047),
      _0x39e577 = encodeAES(_0x53e62a, _0x4fd6ad);
    if (!_0x39e577) return {
      'isActive': false,
      'error': "Không thể mã hóa request"
    };
    const _0x5b7e64 = encodeURIComponent(_0x39e577),
      _0x4f1eea = await axios.get("https://tt-profile-wpa.chat.zalo.me/api/social/profile/me-v2?zpw_ver=670&zpw_type=30&params=" + _0x5b7e64 + "&os=7&browser=1", {
        'headers': {
          'Host': "tt-profile-wpa.chat.zalo.me",
          'Cookie': 'zpw_sek=' + _0x1dd358,
          'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 OPR/123.0.0.0",
          'Accept': "application/json, text/plain, */*",
          'Content-Type': "application/x-www-form-urlencoded",
          'Origin': "https://chat.zalo.me",
          'Referer': "https://chat.zalo.me/",
          'Accept-Encoding': "gzip, deflate, br",
          'Accept-Language': "vi,en;q=0.9"
        },
        'timeout': 0x3a98,
        'decompress': true
      });
    if (!_0x4f1eea.data || _0x4f1eea.data.error_code !== 0x0) return {
      'isActive': false,
      'error': "API error: " + (_0x4f1eea.data?.["error_message"] || "Unknown")
    };
    const _0x38acfe = decodeAES(_0x4f1eea.data.data, _0x4fd6ad);
    if (!_0x38acfe) return {
      'isActive': false,
      'error': "Không thể giải mã response"
    };
    let _0x10c98e;
    try {
      _0x10c98e = JSON.parse(_0x38acfe);
    } catch (_0x23ce9d) {
      return {
        'isActive': false,
        'error': "Không thể parse JSON"
      };
    }
    if (_0x10c98e.error_code !== 0x0) return {
      'isActive': false,
      'error': "Profile error: " + (_0x10c98e.error_message || "Unknown")
    };
    if (_0x10c98e.data && _0x10c98e.data.profile && _0x10c98e.data.profile.displayName) return {
      'isActive': true,
      'displayName': _0x10c98e.data.profile.displayName,
      'avatar': _0x10c98e.data.profile.avatar
    };
    return {
      'isActive': false,
      'error': "Không tìm thấy displayName"
    };
  } catch (_0x4ca140) {
    return console.error("checkSingleAccountStatus Error:", _0x4ca140.message), {
      'isActive': false,
      'error': _0x4ca140.message
    };
  }
}
module.exports = {
  'getZaloAccounts': getZaloAccounts,
  'getZaloAccount': getZaloAccount,
  'createZaloAccount': createZaloAccount,
  'updateZaloAccount': updateZaloAccount,
  'deleteZaloAccount': deleteZaloAccount,
  'checkAccountStatus': checkAccountStatus,
  'checkAllAccountsStatus': checkAllAccountsStatus
};
