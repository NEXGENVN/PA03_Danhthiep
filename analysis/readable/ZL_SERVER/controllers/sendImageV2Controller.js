// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/sendImageV2Controller.js
const CryptoJS = require('crypto-js'),
  axios = require("../utils/axiosInstance"),
  db = require("../config/database"),
  {
    getZaloAccountConfig,
    sanitizeZaloAccount,
    sanitizeZaloAccounts,
    maskSensitiveData
  } = require("../utils/sanitize");
function encodeAES(_0x6ed154, _0x108e16) {
  try {
    const _0x1402b1 = CryptoJS.enc.Base64.parse(_0x108e16),
      _0x4337d1 = CryptoJS.AES.encrypt(_0x6ed154, _0x1402b1, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x4337d1.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (_0x100d0e) {
    return console.error("Encode AES Error:", _0x100d0e), null;
  }
}
function decodeAES(_0x1d7de3, _0x20bdaf) {
  try {
    const _0x15646b = decodeURIComponent(_0x1d7de3),
      _0x4e6948 = CryptoJS.enc.Base64.parse(_0x20bdaf),
      _0x59f083 = CryptoJS.AES.decrypt({
        'ciphertext': CryptoJS.enc.Base64.parse(_0x15646b),
        'salt': ''
      }, _0x4e6948, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x59f083.toString(CryptoJS.enc.Utf8);
  } catch (_0x44c6bc) {
    return console.error("Decode AES Error:", _0x44c6bc), null;
  }
}
function normalizePhoneNumber(_0x38f735) {
  return _0x38f735 = _0x38f735.replace(/[\s\-]/g, ''), _0x38f735.startsWith('0') && (_0x38f735 = '84' + _0x38f735.substring(0x1)), _0x38f735.startsWith('+84') && (_0x38f735 = _0x38f735.substring(0x1)), _0x38f735;
}
async function searchPhoneNumber(_0x4775be, _0x26e78c) {
  try {
    const _0x4465fb = {
        'phone': _0x4775be,
        'avatar_size': 0xf0,
        'language': 'vi',
        'imei': _0x26e78c.IMEI,
        'reqSrc': 0x55
      },
      _0x30b346 = JSON.stringify(_0x4465fb),
      _0x5489a6 = encodeAES(_0x30b346, _0x26e78c.ENCRYPTION_KEY);
    if (!_0x5489a6) throw new Error("Không thể mã hóa request");
    const _0x6e993f = encodeURIComponent(_0x5489a6);
    console.log("🔍 Đang tìm số điện thoại:", _0x4775be);
    const _0x187280 = await axios.get("https://tt-friend-wpa.chat.zalo.me/api/friend/profile/get?zpw_ver=670&zpw_type=30&params=" + _0x6e993f, {
      'headers': {
        'Host': "tt-friend-wpa.chat.zalo.me",
        'Cookie': "zpw_sek=" + _0x26e78c.COOKIE_ZPW_SEK,
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        'Accept': "application/json, text/plain, */*",
        'Content-Type': "application/x-www-form-urlencoded",
        'Origin': "https://chat.zalo.me",
        'Referer': "https://chat.zalo.me/",
        'Accept-Encoding': "gzip, deflate, br"
      },
      'decompress': true,
      'timeout': 0x2710
    });
    if (_0x187280.data.error_code === 0x0 && _0x187280.data.data) {
      const _0x4d8469 = _0x187280.data.data;
      console.log("🔓 Đang giải mã data...");
      const _0x2f9570 = decodeAES(_0x4d8469, _0x26e78c.ENCRYPTION_KEY);
      if (!_0x2f9570) return {
        'success': false,
        'message': "Lỗi giải mã dữ liệu"
      };
      let _0x4b5067;
      try {
        _0x4b5067 = JSON.parse(_0x2f9570);
      } catch (_0x42ded7) {
        return {
          'success': false,
          'message': "Lỗi parse dữ liệu"
        };
      }
      if (_0x4b5067.error_code !== 0x0) return {
        'success': false,
        'message': _0x4b5067.error_message || "Không tìm thấy người dùng"
      };
      const _0x2fb960 = _0x4b5067.data;
      if (!_0x2fb960 || !_0x2fb960.uid) return {
        'success': false,
        'message': "Không tìm thấy thông tin người dùng"
      };
      return console.log("✅ Tìm thấy user:", {
        'uid': _0x2fb960.uid,
        'name': _0x2fb960.display_name || _0x2fb960.zalo_name
      }), {
        'success': true,
        'data': _0x2fb960
      };
    } else return {
      'success': false,
      'message': _0x187280.data.error_message || "Không tìm thấy người dùng"
    };
  } catch (_0x3db32f) {
    return console.error("❌ Search Phone Error:", _0x3db32f.message), {
      'success': false,
      'message': "Lỗi khi tìm kiếm số điện thoại: " + _0x3db32f.message
    };
  }
}
async function sendPhoto(_0x41122a, _0x139d76, _0x2cf41a, _0x4286ea = true) {
  try {
    const _0x4961b0 = Date.now(),
      _0x3553f6 = {
        'photoId': Math.floor(Math.random() * 0xe8d4a51000).toString(),
        'clientId': _0x4961b0,
        'desc': '',
        'width': 0x320,
        'height': 0x230,
        'previewThumb': "AwAYABj/2gAMAwEAAhEDEQA/AKtvYwIqvdSlc8hFGTUXuXboNvY...",
        'toid': _0x41122a,
        'checksum': "fb3d027ca1d518e878e4894cb30e3a51",
        'rawUrl': _0x139d76,
        'thumbUrl': _0x139d76,
        'normalUrl': _0x139d76,
        'hdUrl': _0x139d76,
        'hdSize': "484852",
        'language': 'vi',
        'zsource': 0x12e,
        'jcp': JSON.stringify({
          'sendSource': 0x12e,
          'convertible': 'jxl'
        }),
        'ttl': 0x0,
        'imei': _0x2cf41a.IMEI
      },
      _0x497644 = JSON.stringify(_0x3553f6),
      _0x10b9f6 = encodeAES(_0x497644, _0x2cf41a.ENCRYPTION_KEY);
    if (!_0x10b9f6) throw new Error("Không thể mã hóa request");
    const _0x544778 = encodeURIComponent(_0x10b9f6);
    console.log("📤 Đang gửi ảnh đến UID:", _0x41122a);
    const _0x4bd400 = await axios.post("https://tt-files-wpa.chat.zalo.me/api/message/photo_original/send?zpw_ver=670&zpw_type=30&nretry=0", "params=" + _0x544778, {
      'headers': {
        'Host': "tt-files-wpa.chat.zalo.me",
        'Cookie': "zpw_sek=" + _0x2cf41a.COOKIE_ZPW_SEK,
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        'Accept': "application/json, text/plain, */*",
        'Content-Type': "application/x-www-form-urlencoded",
        'Origin': "https://chat.zalo.me",
        'Referer': "https://chat.zalo.me/",
        'Accept-Encoding': "gzip, deflate, br"
      },
      'decompress': true,
      'timeout': 0x2710
    });
    if (_0x4bd400.data.error_code !== 0x0) return {
      'success': false,
      'result': "FAILED",
      'detail': _0x4bd400.data.error_message
    };
    const _0x88193 = _0x4bd400.data.data,
      _0x331709 = decodeAES(_0x88193, _0x2cf41a.ENCRYPTION_KEY);
    if (!_0x331709) return {
      'success': false,
      'result': "ERROR",
      'detail': "Không thể giải mã response, có thể phiên đăng nhập đã hết hiệu lực"
    };
    const _0x417b87 = JSON.parse(_0x331709);
    if (_0x417b87.error_code === 0x0) {
      console.log("✅ Gửi yêu cầu thành công");
      const _0x2c6133 = _0x417b87.data?.["msgId"];
      if (_0x4286ea && _0x2c6133) try {
        console.log("🗑️ Đang tự động xóa hình ảnh phía người gửi...");
        const _0x1adb14 = Date.now(),
          _0x5b2152 = {
            'toid': _0x41122a,
            'cliMsgId': _0x1adb14,
            'msgs': [{
              'cliMsgId': _0x4961b0.toString(),
              'globalMsgId': _0x2c6133,
              'ownerId': _0x2cf41a.UID,
              'destId': _0x41122a
            }],
            'onlyMe': 0x1,
            'imei': _0x2cf41a.IMEI
          },
          _0x1548b0 = JSON.stringify(_0x5b2152),
          _0x179e6e = encodeAES(_0x1548b0, _0x2cf41a.ENCRYPTION_KEY);
        if (_0x179e6e) {
          const _0x474586 = encodeURIComponent(_0x179e6e),
            _0x1261bb = await axios.post("https://tt-chat2-wpa.chat.zalo.me/api/message/delete?zpw_ver=683&zpw_type=30&nretry=0", "params=" + _0x474586, {
              'headers': {
                'Host': "tt-chat2-wpa.chat.zalo.me",
                'Cookie': "zpw_sek=" + _0x2cf41a.COOKIE_ZPW_SEK,
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                'Accept': "application/json, text/plain, */*",
                'Content-Type': "application/x-www-form-urlencoded",
                'Origin': "https://chat.zalo.me",
                'Referer': "https://chat.zalo.me/",
                'Accept-Encoding': "gzip, deflate, br"
              },
              'decompress': true,
              'timeout': 0x2710
            });
          if (_0x1261bb.data.error_code === 0x0) {
            const _0x27794c = decodeAES(_0x1261bb.data.data, _0x2cf41a.ENCRYPTION_KEY);
            if (_0x27794c) {
              const _0x3e90e5 = JSON.parse(_0x27794c);
              _0x3e90e5.error_code === 0x0 ? console.log("✅ Xóa hình ảnh phía người gửi thành công:", _0x3e90e5) : console.error("❌ Xóa hình ảnh phía người gửi thất bại:", _0x3e90e5.error_message);
            }
          } else console.error("❌ Request xóa hình ảnh phía người gửi thất bại:", _0x1261bb.data.error_message);
        } else console.error("❌ Không thể mã hóa request xóa hình ảnh");
      } catch (_0x2fb5f0) {
        console.error("❌ Có lỗi khi xóa hình ảnh phía người gửi:", _0x2fb5f0.message);
      }
      return {
        'success': true,
        'result': 'SUCCESS',
        'detail': "Gửi yêu cầu thành công",
        'msgId': _0x2c6133
      };
    } else return console.log("❌ Gửi yêu cầu thất bại: " + _0x417b87.error_message + " - error_code: " + _0x417b87.error_code), {
      'success': false,
      'result': 'FAILED',
      'detail': _0x417b87.error_message || "Không thể gửi yêu cầu"
    };
  } catch (_0x44b844) {
    return console.error("❌ Có lỗi xử lý:", _0x44b844.message), {
      'success': false,
      'result': 'ERROR',
      'detail': _0x44b844.message
    };
  }
}
async function getToolSetup() {
  const _0x46201f = await db.query("SELECT * FROM tool_setup WHERE STT = 1");
  if (_0x46201f.length === 0x0) return {
    'id': 0x1,
    'uid_zalo_system': null,
    'zalo_system_money': 0x7530,
    'zalo_custom_money': 0x4e20
  };
  return _0x46201f[0x0];
}
const getUserZaloAccounts = async (_0x368d5d, _0x1b033f) => {
    try {
      const _0x3f317e = await db.query("SELECT \n                za.UID, \n                za.displayName, \n                za.phoneNumber,\n                za.Avatar, \n                za.accStatus,\n                za.ImportTime,\n                FALSE as isSystemAccount\n             FROM zalo_account za\n             INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n             WHERE ulza.userID = ?\n             ORDER BY za.ImportTime DESC", [_0x368d5d.user.userID]),
        _0x2acb5c = await getToolSetup(),
        _0x195335 = [];
      if (_0x2acb5c.uid_zalo_system) {
        const _0x150d59 = await db.query("SELECT UID, accStatus FROM zalo_account WHERE UID = ?", [_0x2acb5c.uid_zalo_system]);
        _0x150d59.length > 0x0 && _0x195335.push({
          'UID': _0x150d59[0x0].UID,
          'isSystemAccount': true,
          'accStatus': _0x150d59[0x0].accStatus
        });
      }
      _0x195335.push(..._0x3f317e);
      const _0x48893f = _0x195335.map(_0x4b1094 => {
        if (_0x4b1094.isSystemAccount) return _0x4b1094;
        return sanitizeZaloAccount(_0x4b1094);
      });
      _0x1b033f.json({
        'success': true,
        'data': _0x48893f
      });
    } catch (_0x1c0bcb) {
      console.error("Get User Zalo Accounts Error:", _0x1c0bcb), _0x1b033f.status(0x1f4).json({
        'success': false,
        'message': "Lỗi lấy danh sách tài khoản Zalo"
      });
    }
  },
  searchPhoneWithAccount = async (_0x4396e3, _0x2ed4c9) => {
    try {
      let {
        phoneNumber: _0x3f2372,
        zaloUID: _0x476e6e,
        imageType: _0x2d4684,
        ipType: _0x3f3800
      } = _0x4396e3.body;
      if (!_0x3f2372 || !_0x476e6e) return _0x2ed4c9.status(0x190).json({
        'success': false,
        'message': "Thiếu thông tin cần thiết"
      });
      _0x3f2372 = normalizePhoneNumber(_0x3f2372), console.log("\n═══════════════════════════════════════════════════════"), console.log("🔍 TÌM KIẾM SỐ ĐIỆN THOẠI VỚI TÀI KHOẢN ZALO"), console.log("   Phone:", _0x3f2372), console.log("   Zalo UID:", _0x476e6e), console.log("   User ID:", _0x4396e3.user.userID);
      const _0x271b2f = await getToolSetup(),
        _0x8823e3 = _0x476e6e === _0x271b2f.uid_zalo_system;
      let _0x2c49d7 = _0x8823e3 ? _0x271b2f.zalo_system_money : _0x271b2f.zalo_custom_money;
      _0x2d4684 === "custom" && (_0x2c49d7 += 0x1388);
      _0x3f3800 === 'both' && (_0x2c49d7 *= 0x2);
      console.log("💰 Loại tài khoản:", _0x8823e3 ? 'Hệ\x20thống' : "Của user"), console.log("💸 Phí dự kiến:", _0x2c49d7.toLocaleString("vi-VN"), '₫');
      const _0x27e141 = await db.query("SELECT totalMoney FROM user WHERE userID = ?", [_0x4396e3.user.userID]);
      if (_0x27e141.length === 0x0) return console.log("❌ Không tìm thấy user"), console.log("═══════════════════════════════════════════════════════\n"), _0x2ed4c9.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy user"
      });
      const _0x142ca3 = parseFloat(_0x27e141[0x0].totalMoney);
      if (_0x142ca3 < _0x2c49d7) return console.log("❌ Số dư không đủ:", _0x142ca3.toLocaleString('vi-VN'), '<', _0x2c49d7.toLocaleString("vi-VN"), '₫'), console.log("═══════════════════════════════════════════════════════\n"), _0x2ed4c9.status(0x190).json({
        'success': false,
        'message': "Số dư không đủ. Cần " + _0x2c49d7.toLocaleString('vi-VN') + '₫,\x20còn\x20' + _0x142ca3.toLocaleString("vi-VN") + '₫',
        'insufficientBalance': true
      });
      let _0x3b63ff;
      if (_0x8823e3) {
        const _0x1b7654 = await db.query("SELECT UID, displayName, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK FROM zalo_account WHERE UID = ?", [_0x476e6e]);
        if (_0x1b7654.length === 0x0) return _0x2ed4c9.status(0x190).json({
          'success': false,
          'message': "Tài khoản hệ thống không khả dụng"
        });
        _0x3b63ff = getZaloAccountConfig(_0x1b7654[0x0]);
      } else {
        const _0x478d23 = await db.query("SELECT za.UID, za.displayName, za.IMEI, za.ENCRYPTION_KEY, za.COOKIE_ZPW_SEK\n                 FROM zalo_account za\n                 INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n                 WHERE ulza.userID = ? AND za.UID = ?", [_0x4396e3.user.userID, _0x476e6e]);
        if (_0x478d23.length === 0x0) return _0x2ed4c9.status(0x190).json({
          'success': false,
          'message': "Tài khoản Zalo đã chọn không khả dụng"
        });
        _0x3b63ff = getZaloAccountConfig(_0x478d23[0x0]);
      }
      console.log("📱 Đang dùng tài khoản:", _0x3b63ff.displayName), console.log("💳 Số dư hiện tại:", _0x142ca3.toLocaleString("vi-VN"), '₫');
      const _0x42f86e = await searchPhoneNumber(_0x3f2372, _0x3b63ff);
      if (!_0x42f86e.success) return console.log("❌ Không tìm thấy người dùng"), console.log("═══════════════════════════════════════════════════════\n"), _0x2ed4c9.status(0x194).json({
        'success': false,
        'message': "Số điện thoại này chưa đăng ký tài khoản hoặc không cho phép người lạ tìm kiếm"
      });
      const _0x4f5c5b = _0x42f86e.data;
      console.log("✅ Tìm thấy user:", _0x4f5c5b.display_name || _0x4f5c5b.zalo_name), console.log("═══════════════════════════════════════════════════════\n"), _0x2ed4c9.json({
        'success': true,
        'data': {
          'uid': _0x4f5c5b.uid,
          'displayName': _0x4f5c5b.display_name || _0x4f5c5b.zalo_name,
          'avatar': _0x4f5c5b.avatar,
          'phoneNumber': _0x3f2372
        },
        'feeInfo': {
          'feeAmount': _0x2c49d7,
          'isSystemAccount': _0x8823e3,
          'currentBalance': _0x142ca3,
          'balanceAfterFee': _0x142ca3 - _0x2c49d7
        }
      });
    } catch (_0x17fd9d) {
      console.error("Search Phone With Account Error:", _0x17fd9d), _0x2ed4c9.status(0x1f4).json({
        'success': false,
        'message': "Lỗi hệ thống khi tìm kiếm"
      });
    }
  },
  sendImageConfirmed = async (_0x490a58, _0x56052d) => {
    const _0x5692f2 = await db.getConnection();
    try {
      const {
          phoneNumber: _0x359851,
          zaloUID: _0x1ed119,
          userUID: _0x8a1e50,
          displayName: _0xf2c65a,
          avatar: _0x161c6f,
          imageType: _0x53aaff,
          ipType: _0x954942,
          autoDelete: _0x5f1d7d
        } = _0x490a58.body,
        _0xd1f81a = !!_0x5f1d7d;
      if (!_0x359851 || typeof _0x359851 !== "string" || _0x359851.length < 0xa) return _0x56052d.status(0x190).json({
        'success': false,
        'message': "Số điện thoại không hợp lệ"
      });
      if (!_0x1ed119 || typeof _0x1ed119 !== "string") return _0x56052d.status(0x190).json({
        'success': false,
        'message': "Tài khoản Zalo không hợp lệ"
      });
      if (!_0x8a1e50 || typeof _0x8a1e50 !== "string") return _0x56052d.status(0x190).json({
        'success': false,
        'message': "UID người nhận không hợp lệ"
      });
      await _0x5692f2.beginTransaction(), console.log("\n🔒 Đã bắt đầu transaction với row lock");
      const [_0x5d9a0f] = await _0x5692f2.query("SELECT totalMoney FROM user WHERE userID = ? FOR UPDATE", [_0x490a58.user.userID]);
      if (_0x5d9a0f.length === 0x0) return await _0x5692f2.rollback(), _0x56052d.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy user"
      });
      const _0x4dd89f = await getToolSetup(),
        _0x3662de = _0x1ed119 === _0x4dd89f.uid_zalo_system;
      let _0x16057b = _0x3662de ? _0x4dd89f.zalo_system_money : _0x4dd89f.zalo_custom_money;
      _0x53aaff === "custom" && (_0x16057b += 0x1388);
      _0x954942 === "both" && (_0x16057b *= 0x2);
      const _0x1eff21 = parseFloat(_0x5d9a0f[0x0].totalMoney);
      if (_0x1eff21 < _0x16057b) return await _0x5692f2.rollback(), console.log("⚠️ Số dư không đủ: " + _0x1eff21 + " < " + _0x16057b), _0x56052d.status(0x190).json({
        'success': false,
        'message': "Số dư không đủ. Cần " + _0x16057b.toLocaleString("vi-VN") + '₫,\x20còn\x20' + _0x1eff21.toLocaleString('vi-VN') + '₫'
      });
      console.log("💳 Số dư hiện tại: " + _0x1eff21.toLocaleString("vi-VN") + '₫'), console.log("💰 Phí dự kiến: " + _0x16057b.toLocaleString("vi-VN") + '₫');
      let _0x4ade55;
      if (_0x3662de) {
        const [_0x107250] = await _0x5692f2.query("SELECT UID, displayName, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK FROM zalo_account WHERE UID = ?", [_0x1ed119]);
        if (_0x107250.length === 0x0) return await _0x5692f2.rollback(), _0x56052d.status(0x190).json({
          'success': false,
          'message': "Tài khoản hệ thống không hợp lệ"
        });
        _0x4ade55 = getZaloAccountConfig(_0x107250[0x0]);
      } else {
        const [_0x10ed27] = await _0x5692f2.query("SELECT za.UID, za.displayName, za.IMEI, za.ENCRYPTION_KEY, za.COOKIE_ZPW_SEK\n                 FROM zalo_account za\n                 INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n                 WHERE ulza.userID = ? AND za.UID = ?", [_0x490a58.user.userID, _0x1ed119]);
        if (_0x10ed27.length === 0x0) return await _0x5692f2.rollback(), _0x56052d.status(0x190).json({
          'success': false,
          'message': "Không có quyền sử dụng tài khoản Zalo này"
        });
        _0x4ade55 = getZaloAccountConfig(_0x10ed27[0x0]);
      }
      console.log("📱 Đang dùng tài khoản: " + _0x4ade55.displayName), console.log("📤 Gửi hình ảnh đến UID: " + _0x8a1e50);
      let _0x19cf16 = [];
      if (_0x954942 === 'ipv4') _0x19cf16.push({
        'type': "IPv4",
        'url': process.env.IMG_URL_V4 || process.env.IMG_URL
      });else {
        if (_0x954942 === "ipv6") _0x19cf16.push({
          'type': "IPv6",
          'url': process.env.IMG_URL_V6 || process.env.IMG_URL
        });else _0x954942 === "both" ? (_0x19cf16.push({
          'type': "IPv4",
          'url': process.env.IMG_URL_V4 || process.env.IMG_URL
        }), _0x19cf16.push({
          'type': "IPv6",
          'url': process.env.IMG_URL_V6 || process.env.IMG_URL
        })) : _0x19cf16.push({
          'type': "Default",
          'url': process.env.IMG_URL
        });
      }
      const _0x887759 = [];
      let _0x443766 = 0x0;
      for (const _0x3e3541 of _0x19cf16) {
        let _0x1d970b = _0x3e3541.url;
        if (_0x53aaff === "custom") {
          const _0x324c18 = "cus_user_" + _0x490a58.user.userID + ".png";
          _0x1d970b = _0x1d970b.replace("qc.png", _0x324c18);
        }
        const [_0x414306] = await _0x5692f2.query("INSERT INTO auto_request \n                 (phoneNumber, UID, displayName, Avatar, imageUrl, sendResult, Detail, fee_charged, use_system_account, sender_zalo_uid)\n                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [_0x359851, _0x8a1e50, _0xf2c65a, _0x161c6f, "PENDING", 'PENDING', "Đang xử lý " + _0x3e3541.type + "...", 0x0, _0x3662de, _0x1ed119]),
          _0x3055af = _0x414306.insertId;
        await _0x5692f2.query("INSERT INTO user_link_auto_request (userID, reqID) VALUES (?, ?)", [_0x490a58.user.userID, _0x3055af]);
        const _0x2da65c = '' + _0x1d970b + (_0x1d970b.includes('?') ? '&' : '?') + 'req=' + _0x3055af;
        console.log("\n📤 Gửi hình ảnh " + _0x3e3541.type + " đến UID:", _0x8a1e50), console.log("🔗 URL:", _0x2da65c);
        const _0xecf9a5 = await sendPhoto(_0x8a1e50, _0x2da65c, _0x4ade55, _0xd1f81a);
        let _0xd310f4 = 0x0;
        _0xecf9a5.success && (_0xd310f4 = _0x16057b / _0x19cf16.length, _0x443766 += _0xd310f4), await _0x5692f2.query("UPDATE auto_request \n                 SET imageUrl = ?, sendResult = ?, Detail = ?, fee_charged = ?\n                 WHERE reqID = ?", [_0x2da65c, _0xecf9a5.result, _0xecf9a5.detail + (["IPv4", "IPv6"].includes(_0x3e3541.type) ? '\x20(' + _0x3e3541.type + ')' : ''), _0xd310f4, _0x3055af]), _0x887759.push({
          'reqID': _0x3055af,
          'type': _0x3e3541.type,
          ..._0xecf9a5
        });
      }
      let _0x385373 = _0x1eff21;
      _0x443766 > 0x0 && (await _0x5692f2.query("UPDATE user SET totalMoney = totalMoney - ? WHERE userID = ?", [_0x443766, _0x490a58.user.userID]), _0x385373 = _0x1eff21 - _0x443766, console.log("💳 Đã trừ tổng cộng " + _0x443766.toLocaleString("vi-VN") + "₫ từ tài khoản"));
      await _0x5692f2.commit(), console.log("✅ Transaction committed successfully\n");
      const _0x3936a7 = _0x887759.every(_0x334328 => _0x334328.success),
        _0x29984d = _0x887759[_0x887759.length - 0x1];
      if (_0x3936a7) return _0x56052d.json({
        'success': true,
        'message': _0x954942 === "both" ? "Gửi thành công cả 2 yêu cầu (IPv4 & IPv6)" : _0x29984d.detail,
        'data': {
          'reqID': _0x887759[0x0].reqID,
          'results': _0x887759,
          'feeCharged': _0x443766,
          'newBalance': _0x385373
        }
      });else {
        const _0x4ed975 = _0x887759.some(_0x37f98a => _0x37f98a.success);
        return _0x56052d.status(_0x4ed975 ? 0xc8 : 0x190).json({
          'success': _0x4ed975,
          'message': _0x4ed975 ? "Gửi thành công một phần yêu cầu" : "Gửi yêu cầu thất bại",
          'data': {
            'results': _0x887759,
            'feeCharged': _0x443766,
            'newBalance': _0x385373
          }
        });
      }
    } catch (_0x17eef3) {
      await _0x5692f2.rollback(), console.error("❌ Lỗi khi gửi yêu cầu :", _0x17eef3), _0x56052d.status(0x1f4).json({
        'success': false,
        'message': "Lỗi hệ thống khi gửi yêu cầu"
      });
    } finally {
      _0x5692f2.release();
    }
  };
module.exports = {
  'getUserZaloAccounts': getUserZaloAccounts,
  'searchPhoneWithAccount': searchPhoneWithAccount,
  'sendImageConfirmed': sendImageConfirmed
};
