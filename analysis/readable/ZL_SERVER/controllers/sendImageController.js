// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/sendImageController.js
const CryptoJS = require("crypto-js"),
  axios = require("../utils/axiosInstance"),
  db = require("../config/database"),
  {
    getZaloAccountConfig,
    maskSensitiveData
  } = require("../utils/sanitize");
function encodeAES(_0x52b760, _0x2b6f02) {
  try {
    const _0x417ffb = CryptoJS.enc.Base64.parse(_0x2b6f02),
      _0x39ed53 = CryptoJS.AES.encrypt(_0x52b760, _0x417ffb, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x39ed53.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (_0x458356) {
    return console.error("Encode AES Error:", _0x458356), null;
  }
}
function decodeAES(_0x214c60, _0x1dc07c) {
  try {
    const _0x38f68b = decodeURIComponent(_0x214c60),
      _0x2c53ed = CryptoJS.enc.Base64.parse(_0x1dc07c),
      _0xee037b = CryptoJS.AES.decrypt({
        'ciphertext': CryptoJS.enc.Base64.parse(_0x38f68b),
        'salt': ''
      }, _0x2c53ed, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0xee037b.toString(CryptoJS.enc.Utf8);
  } catch (_0x4d3e60) {
    return console.error("Decode AES Error:", _0x4d3e60), null;
  }
}
async function searchPhoneNumber(_0x204561, _0x1c84a9) {
  try {
    const _0x26bc61 = {
        'phone': _0x204561,
        'avatar_size': 0xf0,
        'language': 'vi',
        'imei': _0x1c84a9.IMEI,
        'reqSrc': 0x55
      },
      _0xdaed25 = JSON.stringify(_0x26bc61),
      _0x47c7e5 = encodeAES(_0xdaed25, _0x1c84a9.ENCRYPTION_KEY);
    if (!_0x47c7e5) throw new Error("Không thể mã hóa request");
    const _0x2bedfa = encodeURIComponent(_0x47c7e5);
    console.log("🔍 Đang tìm số điện thoại:", _0x204561);
    const _0x2d6832 = await axios.get("https://tt-friend-wpa.chat.zalo.me/api/friend/profile/get?zpw_ver=670&zpw_type=30&params=" + _0x2bedfa, {
      'headers': {
        'Host': "tt-friend-wpa.chat.zalo.me",
        'Cookie': "zpw_sek=" + _0x1c84a9.COOKIE_ZPW_SEK,
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
    console.log("📥 Search Response:", {
      'error_code': _0x2d6832.data.error_code,
      'has_data': !!_0x2d6832.data.data,
      'data_type': typeof _0x2d6832.data.data
    });
    if (_0x2d6832.data.error_code === 0x0 && _0x2d6832.data.data) {
      const _0x518f5a = _0x2d6832.data.data;
      console.log("🔓 Đang giải mã data...");
      const _0x3c4c32 = decodeAES(_0x518f5a, _0x1c84a9.ENCRYPTION_KEY);
      if (!_0x3c4c32) return console.error("❌ Không thể giải mã data"), {
        'success': false,
        'message': "Lỗi giải mã dữ liệu"
      };
      console.log("📄 Decrypted text length:", _0x3c4c32.length);
      let _0x429080;
      try {
        _0x429080 = JSON.parse(_0x3c4c32);
      } catch (_0x9a41ad) {
        return console.error("❌ Lỗi parse JSON:", _0x9a41ad), console.error("Decrypted text:", _0x3c4c32.substring(0x0, 0xc8)), {
          'success': false,
          'message': "Lỗi parse dữ liệu"
        };
      }
      console.log("📦 Parsed data:", {
        'error_code': _0x429080.error_code,
        'has_nested_data': !!_0x429080.data
      });
      if (_0x429080.error_code !== 0x0) return console.log("⚠️ Lỗi từ API:", _0x429080.error_message), {
        'success': false,
        'message': _0x429080.error_message || "Không tìm thấy người dùng"
      };
      const _0x3122f6 = _0x429080.data;
      if (!_0x3122f6 || !_0x3122f6.uid) return console.error("❌ userData không có uid:", _0x3122f6), {
        'success': false,
        'message': "Không tìm thấy thông tin người dùng"
      };
      return console.log("✅ Tìm thấy user:", {
        'uid': _0x3122f6.uid,
        'name': _0x3122f6.display_name || _0x3122f6.zalo_name
      }), {
        'success': true,
        'data': _0x3122f6
      };
    } else return {
      'success': false,
      'message': _0x2d6832.data.error_message || "Không tìm thấy người dùng"
    };
  } catch (_0x437d32) {
    return console.error("❌ Search Phone Error:", _0x437d32.message), _0x437d32.response && (console.error("Response status:", _0x437d32.response.status), console.error("Response data:", _0x437d32.response.data)), {
      'success': false,
      'message': "Lỗi khi tìm kiếm số điện thoại: " + _0x437d32.message
    };
  }
}
async function sendPhoto(_0xb7184d, _0x5e9fe6, _0x5090e5) {
  try {
    const _0x5e5c8b = Date.now(),
      _0x196afa = {
        'photoId': Math.floor(Math.random() * 0xe8d4a51000).toString(),
        'clientId': _0x5e5c8b,
        'desc': '',
        'width': 0x320,
        'height': 0x230,
        'previewThumb': "AwAYABj/2gAMAwEAAhEDEQA/AKtvYwIqvdSlc8hFGTUXuXboNvY...",
        'toid': _0xb7184d,
        'checksum': "fb3d027ca1d518e878e4894cb30e3a51",
        'rawUrl': _0x5e9fe6,
        'thumbUrl': _0x5e9fe6,
        'normalUrl': _0x5e9fe6,
        'hdUrl': _0x5e9fe6,
        'hdSize': "484852",
        'language': 'vi',
        'zsource': 0x12e,
        'jcp': JSON.stringify({
          'sendSource': 0x12e,
          'convertible': "jxl"
        }),
        'ttl': 0x0,
        'imei': _0x5090e5.IMEI
      },
      _0x14c58d = JSON.stringify(_0x196afa),
      _0x3adb3e = encodeAES(_0x14c58d, _0x5090e5.ENCRYPTION_KEY);
    if (!_0x3adb3e) throw new Error("Không thể mã hóa request");
    const _0x1fd475 = encodeURIComponent(_0x3adb3e);
    console.log("📤 Đang gửi ảnh đến UID:", _0xb7184d);
    const _0x255403 = await axios.post("https://tt-files-wpa.chat.zalo.me/api/message/photo_original/send?zpw_ver=670&zpw_type=30&nretry=0", "params=" + _0x1fd475, {
      'headers': {
        'Host': "tt-files-wpa.chat.zalo.me",
        'Cookie': "zpw_sek=" + _0x5090e5.COOKIE_ZPW_SEK,
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
    if (_0x255403.data && _0x255403.data.data) {
      const _0x8f0eff = _0x255403.data.data,
        _0x580011 = decodeAES(_0x8f0eff, _0x5090e5.ENCRYPTION_KEY);
      if (_0x580011) try {
        const _0x24457b = JSON.parse(_0x580011);
        return _0x24457b.error_code === 0x0 ? (console.log("✅ Gửi ảnh thành công"), {
          'success': true,
          'result': "THÀNH CÔNG",
          'detail': "Gửi thành công"
        }) : (console.log("❌ Lỗi từ API:", _0x24457b.error_message), {
          'success': false,
          'result': "XẢY RA LỖI",
          'detail': _0x24457b.error_message || "LỖI KHÔNG XÁC ĐỊNH"
        });
      } catch (_0x25c96a) {
        return console.error("❌ Lỗi parse response:", _0x25c96a), {
          'success': false,
          'result': "XẢY RA LỖI",
          'detail': "LỖI PARSE RESPONSE"
        };
      } else {
        console.log("❌ Không giải mã được response");
        const _0x389b7e = _0x255403.data;
        if (_0x389b7e.error_code !== 0x0) return {
          'success': false,
          'result': "ERROR",
          'detail': _0x389b7e.error_message || "LỖI KHÔNG XÁC ĐỊNH"
        };
      }
    }
    return console.log("❌ Lỗi nghiêm trọng"), {
      'success': false,
      'result': 'XẢY\x20RA\x20LỖI',
      'detail': "LỖI NGHIÊM TRỌNG - Không thể giải mã response"
    };
  } catch (_0xa9fa35) {
    return console.error("❌ Send Photo Error:", _0xa9fa35.message), {
      'success': false,
      'result': 'XẢY\x20RA\x20LỖI',
      'detail': "LỖI NGHIÊM TRỌNG: " + _0xa9fa35.message
    };
  }
}
const sendImageToPhone = async (_0x52283b, _0x40aeae) => {
    try {
      const {
        phoneNumber: _0x5c8834,
        imageUrl: _0x20fc90
      } = _0x52283b.body;
      if (!_0x5c8834 || !_0x20fc90) return _0x40aeae.status(0x190).json({
        'success': false,
        'message': "Vui lòng nhập số điện thoại"
      });
      const _0xa72917 = await db.query("SELECT \n                za.UID,\n                za.displayName,\n                za.IMEI, \n                za.ENCRYPTION_KEY, \n                za.COOKIE_ZPW_SEK\n             FROM zalo_account za\n             INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n             WHERE ulza.userID = ?", [_0x52283b.user.userID]);
      if (_0xa72917.length === 0x0) return _0x40aeae.status(0x190).json({
        'success': false,
        'message': "Bạn chưa cấu hình tài khoản Zalo. Vui lòng thêm tài khoản Zalo trước."
      });
      const _0xea7838 = getZaloAccountConfig(_0xa72917[0x0]);
      console.log("\n═══════════════════════════════════════════════════════"), console.log("🔍 Bước 1: Tìm kiếm số điện thoại:", _0x5c8834), console.log("📱 Using Zalo account:", _0xea7838.displayName);
      const _0x2adb23 = await searchPhoneNumber(_0x5c8834, _0xea7838);
      if (!_0x2adb23.success) {
        console.log("❌ Không tìm thấy người dùng");
        const _0x332fe0 = await db.query("INSERT INTO auto_request \n                 (phoneNumber, UID, displayName, Avatar, imageUrl, sendResult, Detail)\n                 VALUES (?, NULL, NULL, NULL, ?, 'FAILED', ?)", [_0x5c8834, _0x20fc90, _0x2adb23.message || "KHÔNG TÌM THẤY NGƯỜI DÙNG"]);
        return await db.query("INSERT INTO user_link_auto_request (userID, reqID) VALUES (?, ?)", [_0x52283b.user.userID, _0x332fe0.insertId]), _0x40aeae.status(0x194).json({
          'success': false,
          'message': _0x2adb23.message,
          'result': 'FAILED',
          'detail': "KHÔNG TÌM THẤY NGƯỜI DÙNG"
        });
      }
      const _0x351db9 = _0x2adb23.data;
      console.log("📤 Bước 2: Gửi hình ảnh đến UID:", _0x351db9.uid);
      const _0x43ed85 = await sendPhoto(_0x351db9.uid, _0x20fc90, _0xea7838);
      console.log("═══════════════════════════════════════════════════════\n");
      const _0x4647aa = await db.query("INSERT INTO auto_request \n             (phoneNumber, UID, displayName, Avatar, imageUrl, sendResult, Detail)\n             VALUES (?, ?, ?, ?, ?, ?, ?)", [_0x5c8834, _0x351db9.uid || null, _0x351db9.display_name || _0x351db9.zalo_name || null, _0x351db9.avatar || null, _0x20fc90, _0x43ed85.result, _0x43ed85.detail]);
      return await db.query("INSERT INTO user_link_auto_request (userID, reqID) VALUES (?, ?)", [_0x52283b.user.userID, _0x4647aa.insertId]), _0x43ed85.success ? _0x40aeae.json({
        'success': true,
        'message': "Gửi hình ảnh thành công",
        'data': {
          'reqID': _0x4647aa.insertId,
          'phoneNumber': _0x5c8834,
          'UID': _0x351db9.uid,
          'displayName': _0x351db9.display_name || _0x351db9.zalo_name,
          'result': _0x43ed85.result,
          'detail': _0x43ed85.detail
        }
      }) : _0x40aeae.status(0x190).json({
        'success': false,
        'message': "Gửi hình ảnh thất bại",
        'data': {
          'reqID': _0x4647aa.insertId,
          'phoneNumber': _0x5c8834,
          'UID': _0x351db9.uid,
          'displayName': _0x351db9.display_name || _0x351db9.zalo_name,
          'result': _0x43ed85.result,
          'detail': _0x43ed85.detail
        }
      });
    } catch (_0x3ae8a0) {
      console.error("Send Image Controller Error:", _0x3ae8a0), _0x40aeae.status(0x1f4).json({
        'success': false,
        'message': "Lỗi hệ thống khi gửi hình ảnh"
      });
    }
  },
  getSendHistory = async (_0xbb9f95, _0x39fe77) => {
    try {
      const {
          page = 0x1,
          sendResult: _0x5d2748,
          limit = 0x64
        } = _0xbb9f95.query,
        _0x369639 = Math.min(parseInt(limit) || 0x1e, 0x64),
        _0x21e69a = (page - 0x1) * _0x369639;
      let _0x233253 = "WHERE ular.userID = ?";
      const _0x325de2 = [_0xbb9f95.user.userID];
      _0x5d2748 && (_0x233253 += " AND ar.sendResult = ?", _0x325de2.push(_0x5d2748));
      const _0x4bfc29 = await db.query("SELECT ar.reqID,  ar.phoneNumber,  ar.displayName,  ar.Avatar,  ar.sendResult,  ar.Detail,  ar.created_at,  ar.fee_charged,  ar.use_system_account FROM auto_request ar\n             INNER JOIN user_link_auto_request ular ON ar.reqID = ular.reqID\n             " + _0x233253 + "\n             ORDER BY ar.created_at DESC\n             LIMIT " + _0x369639 + " OFFSET " + _0x21e69a, _0x325de2),
        _0x5d5b0a = _0x4bfc29,
        _0xbf470c = await db.query("SELECT COUNT(*) as total FROM auto_request ar\n             INNER JOIN user_link_auto_request ular ON ar.reqID = ular.reqID\n             " + _0x233253, _0x325de2),
        _0x29b76e = _0xbf470c[0x0].total;
      _0x39fe77.json({
        'success': true,
        'data': {
          'history': _0x5d5b0a,
          'pagination': {
            'page': parseInt(page),
            'limit': _0x369639,
            'total': _0x29b76e,
            'totalPages': Math.ceil(_0x29b76e / _0x369639)
          }
        }
      });
    } catch (_0x532cae) {
      console.error("Get Send History Error:", _0x532cae), _0x39fe77.status(0x1f4).json({
        'success': false,
        'message': "Lỗi lấy lịch sử gửi ảnh"
      });
    }
  },
  getSendStats = async (_0xdcfcf8, _0x276957) => {
    try {
      const _0x2f3f86 = await db.query("SELECT \n                COUNT(*) as totalSent,\n                SUM(CASE WHEN ar.sendResult = 'SUCCESS' THEN 1 ELSE 0 END) as successCount,\n                SUM(CASE WHEN ar.sendResult = 'FAILED' THEN 1 ELSE 0 END) as failedCount,\n                SUM(CASE WHEN ar.sendResult = 'ERROR' THEN 1 ELSE 0 END) as errorCount\n             FROM auto_request ar\n             INNER JOIN user_link_auto_request ular ON ar.reqID = ular.reqID\n             WHERE ular.userID = ?", [_0xdcfcf8.user.userID]);
      _0x276957.json({
        'success': true,
        'data': _0x2f3f86[0x0]
      });
    } catch (_0x3a0df7) {
      console.error("Get Send Stats Error:", _0x3a0df7), _0x276957.status(0x1f4).json({
        'success': false,
        'message': "Lỗi lấy thống kê"
      });
    }
  };
module.exports = {
  'sendImageToPhone': sendImageToPhone,
  'getSendHistory': getSendHistory,
  'getSendStats': getSendStats
};
