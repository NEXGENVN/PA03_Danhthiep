// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/zaloAccountAutoController.js
const CryptoJS = require('crypto-js'),
  axios = require("../utils/axiosInstance"),
  db = require("../config/database"),
  {
    maskSensitiveData
  } = require("../utils/sanitize");
class ParamCipher {
  constructor({
    type: _0x45b41e,
    imei: _0x421a09
  }) {
    this.type = _0x45b41e, this.imei = _0x421a09, this.enc_ver = 'v2', this.firstLaunchTime = Date.now(), this.zcid_ext = ParamCipher.randomString(), this.createZcid(), this.createEncryptKey();
  }
  ["createZcid"]() {
    const _0x4aef4e = this.type + ',' + this.imei + ',' + this.firstLaunchTime;
    this.zcid = ParamCipher.encodeAES("3FC4F0D2AB50057BCE0D90D9187A22B1", _0x4aef4e, 'hex', true);
  }
  ["createEncryptKey"]() {
    const _0x4007a1 = CryptoJS.MD5(this.zcid_ext).toString().toUpperCase(),
      {
        even: _0x3dacef
      } = ParamCipher.processStr(_0x4007a1),
      {
        even: _0x4a7066,
        odd: _0x38e83e
      } = ParamCipher.processStr(this.zcid);
    this.encryptKey = _0x3dacef.slice(0x0, 0x8).join('') + _0x4a7066.slice(0x0, 0xc).join('') + _0x38e83e.reverse().slice(0x0, 0xc).join('');
  }
  ["getParams"]() {
    return {
      'zcid': this.zcid,
      'zcid_ext': this.zcid_ext,
      'enc_ver': this.enc_ver
    };
  }
  static ["processStr"](_0x521090) {
    if (!_0x521090 || typeof _0x521090 !== "string") return {
      'even': null,
      'odd': null
    };
    const [_0x5b3dde, _0x5777d4] = [..._0x521090].reduce((_0x41e882, _0x34471a, _0x586890) => (_0x41e882[_0x586890 % 0x2].push(_0x34471a), _0x41e882), [[], []]);
    return {
      'even': _0x5b3dde,
      'odd': _0x5777d4
    };
  }
  static ["randomString"](_0x1d4f66 = 0x6, _0x4a62d6 = 0xc) {
    let _0x285d7c = Math.floor(Math.random() * (_0x4a62d6 - _0x1d4f66 + 0x1)) + _0x1d4f66,
      _0x4a1177 = '';
    while (_0x285d7c > 0x0) {
      _0x4a1177 += Math.random().toString(0x10).substr(0x2, _0x285d7c > 0xc ? 0xc : _0x285d7c), _0x285d7c -= 0xc;
    }
    return _0x4a1177;
  }
  static ["encodeAES"](_0x2bd042, _0x584ce5, _0x49d664, _0x321631) {
    const _0x4152f2 = _0x49d664 === 'hex' ? CryptoJS.enc.Hex : CryptoJS.enc.Base64,
      _0x343c2b = CryptoJS.enc.Utf8.parse(_0x2bd042),
      _0x4730b0 = {
        'words': [0x0, 0x0, 0x0, 0x0],
        'sigBytes': 0x10
      },
      _0xfa3b45 = CryptoJS.AES.encrypt(_0x584ce5, _0x343c2b, {
        'iv': _0x4730b0,
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      }).ciphertext.toString(_0x4152f2);
    return _0x321631 ? _0xfa3b45.toUpperCase() : _0xfa3b45;
  }
}
function getSignKey(_0x4c0c5e, _0x41758b) {
  const _0x1770f2 = Object.keys(_0x41758b).sort();
  let _0x2fc4e0 = "zsecure" + _0x4c0c5e;
  for (const _0x132872 of _0x1770f2) _0x2fc4e0 += _0x41758b[_0x132872];
  return CryptoJS.MD5(_0x2fc4e0).toString();
}
function decodeResponse(_0x3152d6, _0x5c4522) {
  const _0x160295 = CryptoJS.enc.Utf8.parse(_0x3152d6),
    _0x4901f8 = CryptoJS.AES.decrypt({
      'ciphertext': CryptoJS.enc.Base64.parse(_0x5c4522),
      'salt': ''
    }, _0x160295, {
      'iv': {
        'words': [0x0, 0x0, 0x0, 0x0],
        'sigBytes': 0x10
      },
      'mode': CryptoJS.mode.CBC,
      'padding': CryptoJS.pad.Pkcs7
    });
  return _0x4901f8.toString(CryptoJS.enc.Utf8);
}
function buildRequest(_0x53cb9f, _0x2da808, _0x416794) {
  _0x416794.ts = Date.now();
  const _0x27443d = ParamCipher.encodeAES(_0x53cb9f.encryptKey, JSON.stringify(_0x416794), 'base64', false),
    _0x4d3aed = {
      ..._0x53cb9f.getParams(),
      'params': _0x27443d,
      'type': _0x53cb9f.type,
      'client_version': 0x298
    };
  return _0x4d3aed.signkey = getSignKey(_0x2da808, _0x4d3aed), {
    'params': _0x4d3aed,
    'enk': _0x53cb9f.encryptKey
  };
}
function encodeAES(_0x2b3701, _0x257bdd) {
  try {
    const _0x1d8a91 = CryptoJS.enc.Base64.parse(_0x257bdd),
      _0x1f49f2 = CryptoJS.AES.encrypt(_0x2b3701, _0x1d8a91, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x1f49f2.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (_0x2a6494) {
    return console.error("Encode AES Error:", _0x2a6494), null;
  }
}
function decodeAES(_0x3511e3, _0x406086) {
  try {
    const _0x59f55b = CryptoJS.enc.Base64.parse(_0x406086),
      _0xb01a53 = CryptoJS.AES.decrypt({
        'ciphertext': CryptoJS.enc.Base64.parse(_0x3511e3),
        'salt': ''
      }, _0x59f55b, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0xb01a53.toString(CryptoJS.enc.Utf8);
  } catch (_0x38d9f3) {
    return console.error("Decode AES Error:", _0x38d9f3), null;
  }
}
const createZaloAccountAuto = async (_0x5cf7da, _0x358831) => {
  try {
    const {
      IMEI: _0x4dee45,
      COOKIE_ZPW_SEK: _0x898158
    } = _0x5cf7da.body;
    if (!_0x4dee45 || !_0x898158) return _0x358831.status(0x190).json({
      'success': false,
      'message': "Vui lòng điền đầy đủ IMEI và COOKIE_ZPW_SEK"
    });
    console.log("═══════════════════════════════════════════════════════════════"), console.log("🚀 BƯỚC 1: LẤY THÔNG TIN TỪ API LOGIN"), console.log("═══════════════════════════════════════════════════════════════");
    const _0x773d9d = new ParamCipher({
        'type': 0x1e,
        'imei': _0x4dee45
      }),
      _0x3d01a8 = {
        'imei': _0x4dee45,
        'computer_name': "Web",
        'language': 'vi'
      },
      _0x32f617 = "getlogininfo",
      {
        params: _0x2a1c62,
        enk: _0x1977c9
      } = buildRequest(_0x773d9d, _0x32f617, _0x3d01a8),
      _0x5b2e62 = "https://wpa.chat.zalo.me/api/login/getLoginInfo";
    console.log("   📡 Đang gọi API:", _0x5b2e62), console.log("   🔑 IMEI:", _0x4dee45);
    let _0x15b8c2;
    try {
      _0x15b8c2 = await axios.get(_0x5b2e62, {
        'params': _0x2a1c62,
        'headers': {
          'Cookie': "zpw_sek=" + _0x898158,
          'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        'timeout': 0x3a98
      });
    } catch (_0x437b88) {
      return console.error("❌ Lỗi gọi API getLoginInfo:", _0x437b88.message), _0x358831.status(0x1f4).json({
        'success': false,
        'message': "Lỗi kết nối với Zalo API. Vui lòng kiểm tra COOKIE_ZPW_SEK"
      });
    }
    if (!_0x15b8c2.data || !_0x15b8c2.data.data) return console.error("❌ API getLoginInfo không trả về dữ liệu"), _0x358831.status(0x1f4).json({
      'success': false,
      'message': "API Zalo không trả về dữ liệu. Cookie có thể đã hết hạn"
    });
    console.log("   🔓 Đang giải mã response...");
    const _0x2c11de = decodeResponse(_0x1977c9, _0x15b8c2.data.data);
    let _0x431747;
    try {
      _0x431747 = JSON.parse(_0x2c11de);
    } catch (_0x1fb178) {
      return console.error("❌ Không thể parse JSON:", _0x1fb178.message), _0x358831.status(0x1f4).json({
        'success': false,
        'message': "Lỗi giải mã dữ liệu từ Zalo API"
      });
    }
    if (_0x431747.error_code !== 0x0) return console.error("❌ API trả về lỗi:", _0x431747.error_message), _0x358831.status(0x190).json({
      'success': false,
      'message': "Lỗi từ Zalo: " + (_0x431747.error_message || "Không xác định")
    });
    const _0x5208a5 = _0x431747.data.uid,
      _0x522587 = _0x431747.data.zpw_enk,
      _0x391d07 = _0x431747.data.phone_number;
    console.log("   ✅ Lấy thông tin thành công!"), console.log("   📋 UID:", _0x5208a5), console.log("   📞 Phone:", _0x391d07), console.log("   🔑 Encryption Key:", _0x522587 ? 'Có' : "Không");
    if (!_0x5208a5 || !_0x522587 || !_0x391d07) return _0x358831.status(0x1f4).json({
      'success': false,
      'message': "Thiếu thông tin quan trọng từ API (UID/ENCRYPTION_KEY/phoneNumber)"
    });
    console.log(''), console.log("═══════════════════════════════════════════════════════════════"), console.log("🔍 BƯỚC 2: LẤY THÔNG TIN PROFILE"), console.log("═══════════════════════════════════════════════════════════════");
    const _0x1d3db3 = {
        'avatar_size': 0x78,
        'imei': _0x4dee45
      },
      _0x1e0a22 = JSON.stringify(_0x1d3db3),
      _0x247d3d = encodeAES(_0x1e0a22, _0x522587);
    if (!_0x247d3d) return _0x358831.status(0x1f4).json({
      'success': false,
      'message': "Không thể mã hóa request profile"
    });
    const _0x51db31 = encodeURIComponent(_0x247d3d);
    console.log("   👤 Đang lấy thông tin profile...");
    let _0x1342a0;
    try {
      _0x1342a0 = await axios.get("https://tt-profile-wpa.chat.zalo.me/api/social/profile/me-v2?zpw_ver=670&zpw_type=30&params=" + _0x51db31 + "&os=7&browser=1", {
        'headers': {
          'Host': "tt-profile-wpa.chat.zalo.me",
          'Cookie': "zpw_sek=" + _0x898158,
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
    } catch (_0x238fc7) {
      return console.error("❌ Lỗi gọi API profile:", _0x238fc7.message), _0x358831.status(0x1f4).json({
        'success': false,
        'message': "Lỗi kết nối với Zalo API khi lấy profile"
      });
    }
    let _0x385724 = null,
      _0x496d00 = null;
    if (!_0x1342a0.data || _0x1342a0.data.error_code !== 0x0) return console.error("❌ API profile trả về lỗi"), _0x358831.status(0x1f4).json({
      'success': false,
      'message': "API profile không trả về dữ liệu hợp lệ"
    });
    console.log("   🔓 Đang giải mã data...");
    const _0x21e940 = decodeAES(_0x1342a0.data.data, _0x522587);
    if (!_0x21e940) return console.error("❌ Không thể giải mã profile data"), _0x358831.status(0x1f4).json({
      'success': false,
      'message': "Không thể giải mã dữ liệu profile"
    });
    let _0x38820a;
    try {
      _0x38820a = JSON.parse(_0x21e940);
    } catch (_0x3a8969) {
      return console.error("❌ Không thể parse profile JSON:", _0x3a8969.message), _0x358831.status(0x1f4).json({
        'success': false,
        'message': "Lỗi parse dữ liệu profile"
      });
    }
    if (_0x38820a.error_code !== 0x0) return console.error("❌ Profile data có lỗi:", _0x38820a.error_message), _0x358831.status(0x1f4).json({
      'success': false,
      'message': "Lỗi lấy profile: " + (_0x38820a.error_message || "Không xác định")
    });
    if (_0x38820a.data && _0x38820a.data.profile) {
      const _0x50c572 = _0x38820a.data.profile;
      _0x385724 = _0x50c572.displayName, _0x496d00 = _0x50c572.avatar, console.log("   ✅ Lấy profile thành công!"), console.log("   👤 Display Name:", _0x385724), console.log("   🖼️  Avatar:", _0x496d00 ? 'Có' : "Không");
    } else console.log("   ⚠️  Không tìm thấy thông tin profile, sẽ dùng phoneNumber"), _0x385724 = _0x391d07;
    console.log(''), console.log("═══════════════════════════════════════════════════════════════"), console.log("💾 BƯỚC 3: LƯU VÀO DATABASE"), console.log("═══════════════════════════════════════════════════════════════");
    const _0x13e5fe = await db.query("SELECT UID FROM zalo_account WHERE UID = ?", [_0x5208a5]);
    if (_0x13e5fe.length > 0x0) return console.log("   ⚠️  UID đã tồn tại trong hệ thống"), _0x358831.status(0x190).json({
      'success': false,
      'message': "UID này đã tồn tại trong hệ thống"
    });
    await db.transaction(async _0x350a1c => {
      await _0x350a1c.execute("INSERT INTO zalo_account \n                 (UID, displayName, phoneNumber, Avatar, IMEI, ENCRYPTION_KEY, COOKIE_ZPW_SEK, accStatus)\n                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Đang hoạt động')", [_0x5208a5, _0x385724, _0x391d07, _0x496d00 || null, _0x4dee45, _0x522587, _0x898158]), console.log("   ✅ Đã thêm vào zalo_account"), await _0x350a1c.execute("INSERT INTO user_link_zalo_account (userID, UID) VALUES (?, ?)", [_0x5cf7da.user.userID, _0x5208a5]);
    }), console.log(''), console.log("═══════════════════════════════════════════════════════════════"), console.log("✅ HOÀN TẤT - TÀI KHOẢN ĐÃ ĐƯỢC TẠO THÀNH CÔNG"), console.log("═══════════════════════════════════════════════════════════════"), console.log(''), _0x358831.status(0xc9).json({
      'success': true,
      'message': "Thêm tài khoản Zalo thành công",
      'data': {
        'UID': _0x5208a5,
        'displayName': _0x385724,
        'phoneNumber': _0x391d07,
        'Avatar': _0x496d00,
        'accStatus': "Đang hoạt động"
      }
    });
  } catch (_0x1d77dd) {
    console.error("═══════════════════════════════════════════════════════════════"), console.error("❌ LỖI NGHIÊM TRỌNG:", _0x1d77dd), console.error("═══════════════════════════════════════════════════════════════"), _0x358831.status(0x1f4).json({
      'success': false,
      'message': "Lỗi server khi xử lý",
      'error': _0x1d77dd.message
    });
  }
};
module.exports = {
  'createZaloAccountAuto': createZaloAccountAuto
};
