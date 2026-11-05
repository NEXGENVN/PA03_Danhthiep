// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/sendImageByCardController.js
const CryptoJS = require("crypto-js"),
  axios = require("../utils/axiosInstance"),
  db = require("../config/database"),
  {
    getZaloAccountConfig,
    sanitizeZaloAccount,
    sanitizeZaloAccounts,
    maskSensitiveData
  } = require("../utils/sanitize");
function encodeAES(_0xd35d32, _0x5a1be1) {
  try {
    const _0x22fa11 = CryptoJS.enc.Base64.parse(_0x5a1be1),
      _0x4c8990 = CryptoJS.AES.encrypt(_0xd35d32, _0x22fa11, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x4c8990.ciphertext.toString(CryptoJS.enc.Base64);
  } catch (_0x2378e1) {
    return console.error("Encode AES Error:", _0x2378e1), null;
  }
}
function decodeAES(_0x1c69bb, _0xa41149) {
  try {
    const _0x137467 = decodeURIComponent(_0x1c69bb),
      _0x5b6044 = CryptoJS.enc.Base64.parse(_0xa41149),
      _0x2873af = CryptoJS.AES.decrypt({
        'ciphertext': CryptoJS.enc.Base64.parse(_0x137467),
        'salt': ''
      }, _0x5b6044, {
        'iv': CryptoJS.enc.Hex.parse("00000000000000000000000000000000"),
        'mode': CryptoJS.mode.CBC,
        'padding': CryptoJS.pad.Pkcs7
      });
    return _0x2873af.toString(CryptoJS.enc.Utf8);
  } catch (_0x82c12) {
    return console.error("Decode AES Error:", _0x82c12), null;
  }
}
async function getProfileInfo(_0x5cf42e, _0x107700) {
  try {
    const _0x38eaa0 = {
        'phonebook_version': Math.floor(Date.now() / 0x3e8),
        'friend_pversion_map': [_0x5cf42e + '_0'],
        'avatar_size': 0x78,
        'language': 'vi',
        'show_online_status': 0x1,
        'imei': _0x107700.IMEI
      },
      _0x1af9b8 = JSON.stringify(_0x38eaa0),
      _0x570574 = encodeAES(_0x1af9b8, _0x107700.ENCRYPTION_KEY);
    if (!_0x570574) throw new Error("Không thể mã hóa request");
    const _0x1b4b74 = encodeURIComponent(_0x570574);
    console.log("🔍 Đang lấy thông tin profile với FID:", _0x5cf42e);
    const _0x3b710f = await axios.post("https://tt-profile-wpa.chat.zalo.me/api/social/friend/getprofiles/v2?zpw_ver=671&zpw_type=30", "params=" + _0x1b4b74, {
      'headers': {
        'Host': "tt-profile-wpa.chat.zalo.me",
        'Cookie': 'zpw_sek=' + _0x107700.COOKIE_ZPW_SEK,
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        'Accept': "application/json, text/plain, */*",
        'Content-Type': "application/x-www-form-urlencoded",
        'Origin': "https://chat.zalo.me",
        'Referer': "https://chat.zalo.me/"
      },
      'decompress': true,
      'timeout': 0x2710
    });
    if (_0x3b710f.data.error_code !== 0x0) return {
      'success': false,
      'message': _0x3b710f.data.error_message || "API trả về lỗi"
    };
    if (_0x3b710f.data.data && typeof _0x3b710f.data.data === "string") {
      const _0x25ecd0 = decodeAES(_0x3b710f.data.data, _0x107700.ENCRYPTION_KEY);
      if (!_0x25ecd0) return {
        'success': false,
        'message': "Không thể giải mã dữ liệu profile"
      };
      const _0x484b63 = JSON.parse(_0x25ecd0);
      if (_0x484b63.data && _0x484b63.data.changed_profiles) {
        const _0x24064f = _0x484b63.data.changed_profiles,
          _0x19d4c9 = Object.keys(_0x24064f)[0x0];
        if (_0x19d4c9) {
          const _0x453d22 = _0x24064f[_0x19d4c9];
          return console.log("✅ Tìm thấy user:", {
            'userId': _0x453d22.userId,
            'name': _0x453d22.displayName
          }), {
            'success': true,
            'data': {
              'userId': _0x453d22.userId,
              'displayName': _0x453d22.displayName,
              'zaloName': _0x453d22.zaloName,
              'avatar': _0x453d22.avatar
            }
          };
        }
      }
    }
    return {
      'success': false,
      'message': "Không tìm thấy thông tin profile"
    };
  } catch (_0x4a17ff) {
    return console.error("❌ Get Profile Error:", _0x4a17ff.message), {
      'success': false,
      'message': "Lỗi khi lấy profile: " + _0x4a17ff.message
    };
  }
}
async function sendPhoto(_0x5c7345, _0x291d81, _0x1988d2, _0x4766f4 = true) {
  try {
    const _0x2c10a6 = Date.now(),
      _0x33d071 = {
        'photoId': Math.floor(Math.random() * 0xe8d4a51000).toString(),
        'clientId': _0x2c10a6,
        'desc': '',
        'width': 0x320,
        'height': 0x230,
        'previewThumb': "AwAYABj/2gAMAwEAAhEDEQA/AKtvYwIqvdSlc8hFGTUXuXboNvY...",
        'toid': _0x5c7345,
        'checksum': "fb3d027ca1d518e878e4894cb30e3a51",
        'rawUrl': _0x291d81,
        'thumbUrl': _0x291d81,
        'normalUrl': _0x291d81,
        'hdUrl': _0x291d81,
        'hdSize': "78924",
        'language': 'vi',
        'zsource': 0x12e,
        'jcp': JSON.stringify({
          'sendSource': 0x12e,
          'convertible': 'jxl'
        }),
        'ttl': 0x0,
        'imei': _0x1988d2.IMEI
      },
      _0x17058b = JSON.stringify(_0x33d071),
      _0x404da6 = encodeAES(_0x17058b, _0x1988d2.ENCRYPTION_KEY);
    if (!_0x404da6) throw new Error("Mã hóa thất bại");
    const _0x3f1831 = encodeURIComponent(_0x404da6);
    console.log("📤 Đang gửi yêu cầu đến UID:", _0x5c7345);
    const _0x7a6f5d = await axios.post("https://tt-files-wpa.chat.zalo.me/api/message/photo_original/send?zpw_ver=670&zpw_type=30&nretry=0", "params=" + _0x3f1831, {
      'headers': {
        'Host': "tt-files-wpa.chat.zalo.me",
        'Cookie': "zpw_sek=" + _0x1988d2.COOKIE_ZPW_SEK,
        'Content-Type': "application/x-www-form-urlencoded",
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        'Accept': "application/json, text/plain, */*",
        'Origin': "https://chat.zalo.me",
        'Referer': "https://chat.zalo.me/"
      },
      'decompress': true,
      'timeout': 0x2710
    });
    if (_0x7a6f5d.data.error_code !== 0x0) return {
      'success': false,
      'result': 'FAILED',
      'detail': _0x7a6f5d.data.error_message
    };
    const _0x269820 = _0x7a6f5d.data.data,
      _0x34ae13 = decodeAES(_0x269820, _0x1988d2.ENCRYPTION_KEY);
    if (!_0x34ae13) return {
      'success': false,
      'result': "ERROR",
      'detail': "Không thể giải mã response, có thể phiên đăng nhập đã hết hiệu lực"
    };
    const _0x485ae5 = JSON.parse(_0x34ae13);
    if (_0x485ae5.error_code === 0x0) {
      console.log("✅ Gửi yêu cầu thành công");
      const _0x3cbd60 = _0x485ae5.data?.["msgId"];
      if (_0x4766f4 && _0x3cbd60) try {
        console.log("🗑️ Đang tự động xóa hình ảnh phía người gửi...");
        const _0x40d710 = Date.now(),
          _0x43616c = {
            'toid': _0x5c7345,
            'cliMsgId': _0x40d710,
            'msgs': [{
              'cliMsgId': _0x2c10a6.toString(),
              'globalMsgId': _0x3cbd60,
              'ownerId': _0x1988d2.UID,
              'destId': _0x5c7345
            }],
            'onlyMe': 0x1,
            'imei': _0x1988d2.IMEI
          },
          _0x4191d0 = JSON.stringify(_0x43616c),
          _0x5dba69 = encodeAES(_0x4191d0, _0x1988d2.ENCRYPTION_KEY);
        if (_0x5dba69) {
          const _0x4000fa = encodeURIComponent(_0x5dba69),
            _0x430b32 = await axios.post("https://tt-chat2-wpa.chat.zalo.me/api/message/delete?zpw_ver=683&zpw_type=30&nretry=0", "params=" + _0x4000fa, {
              'headers': {
                'Host': "tt-chat2-wpa.chat.zalo.me",
                'Cookie': "zpw_sek=" + _0x1988d2.COOKIE_ZPW_SEK,
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
          if (_0x430b32.data.error_code === 0x0) {
            const _0x4e582e = decodeAES(_0x430b32.data.data, _0x1988d2.ENCRYPTION_KEY);
            if (_0x4e582e) {
              const _0x274884 = JSON.parse(_0x4e582e);
              _0x274884.error_code === 0x0 ? console.log("✅ Xóa hình ảnh phía người gửi thành công:", _0x274884) : console.error("❌ Xóa hình ảnh phía người gửi thất bại:", _0x274884.error_message);
            }
          } else console.error("❌ Request xóa hình ảnh phía người gửi thất bại:", _0x430b32.data.error_message);
        } else console.error("❌ Không thể mã hóa request xóa hình ảnh");
      } catch (_0x2e2229) {
        console.error("❌ Có lỗi khi xóa hình ảnh phía người gửi:", _0x2e2229.message);
      }
      return {
        'success': true,
        'result': 'SUCCESS',
        'detail': "Gửi yêu cầu thành công",
        'msgId': _0x3cbd60
      };
    } else return console.log("❌ Gửi yêu cầu thất bại: " + _0x485ae5.error_message + " - error_code: " + _0x485ae5.error_code), {
      'success': false,
      'result': "FAILED",
      'detail': _0x485ae5.error_message || "Không thể gửi yêu cầu"
    };
  } catch (_0x5ac759) {
    return console.error("❌ Có lỗi xử lý:", _0x5ac759.message), {
      'success': false,
      'result': "ERROR",
      'detail': _0x5ac759.message
    };
  }
}
async function getToolSetup() {
  const _0x5aaa79 = await db.query("SELECT * FROM tool_setup WHERE STT = 1");
  if (_0x5aaa79.length === 0x0) return {
    'id': 0x1,
    'uid_zalo_system': null,
    'zalo_system_money': 0x7530,
    'zalo_custom_money': 0x4e20,
    'imageUrl': null
  };
  return _0x5aaa79[0x0];
}
const getPersonalAccounts = async (_0x1cf871, _0x3023cd) => {
    try {
      const _0x5d5762 = await db.query("SELECT \n                za.UID, \n                za.displayName, \n\t\t\t\tza.phoneNumber,\n                za.accStatus\n             FROM zalo_account za\n             INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n             WHERE ulza.userID = ? AND za.accStatus = 'Đang hoạt động'\n             ORDER BY za.ImportTime DESC", [_0x1cf871.user.userID]),
        _0xc75be2 = _0x5d5762.map(_0x7d072d => ({
          'UID': _0x7d072d.UID,
          'displayName': _0x7d072d.displayName,
          'phoneNumber': _0x7d072d.phoneNumber,
          'accStatus': _0x7d072d.accStatus
        }));
      _0x3023cd.json({
        'success': true,
        'data': _0xc75be2
      });
    } catch (_0x1f9432) {
      console.error("Get Personal Accounts Error:", _0x1f9432), _0x3023cd.status(0x1f4).json({
        'success': false,
        'message': "Lỗi lấy danh sách tài khoản Zalo"
      });
    }
  },
  decodeFidAndGetProfile = async (_0x562de3, _0x528cfc) => {
    try {
      let {
        encryptedFid: _0x316490,
        zaloUID: _0x216531,
        imageType: _0x567103,
        ipType: _0x3b8f1e
      } = _0x562de3.body;
      if (!_0x316490 || !_0x216531) return _0x528cfc.status(0x190).json({
        'success': false,
        'message': "Thiếu thông tin cần thiết"
      });
      console.log("\n═══════════════════════════════════════════════════════"), console.log("🔓 GIẢI MÃ PARAMS VÀ LẤY THÔNG TIN PROFILE"), console.log("   Zalo UID:", _0x216531), console.log("   User ID:", _0x562de3.user.userID);
      const _0x3aa6ab = await getToolSetup();
      let _0x4a4e88 = _0x3aa6ab.zalo_custom_money;
      _0x567103 === "custom" && (_0x4a4e88 += 0x1388);
      _0x3b8f1e === "both" && (_0x4a4e88 *= 0x2);
      console.log("💸 Phí dự kiến:", _0x4a4e88.toLocaleString("vi-VN"), '₫');
      const _0x4d56c1 = await db.query("SELECT totalMoney FROM user WHERE userID = ?", [_0x562de3.user.userID]);
      if (_0x4d56c1.length === 0x0) return console.log("❌ Không tìm thấy user"), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy user"
      });
      const _0x1965d5 = parseFloat(_0x4d56c1[0x0].totalMoney);
      if (_0x1965d5 < _0x4a4e88) return console.log("❌ Số dư không đủ:", _0x1965d5.toLocaleString('vi-VN'), '<', _0x4a4e88.toLocaleString("vi-VN"), '₫'), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x190).json({
        'success': false,
        'message': "Số dư không đủ. Cần " + _0x4a4e88.toLocaleString('vi-VN') + "₫, còn " + _0x1965d5.toLocaleString('vi-VN') + '₫',
        'insufficientBalance': true
      });
      const _0x2b9be5 = await db.query("SELECT za.UID, za.displayName, za.IMEI, za.ENCRYPTION_KEY, za.COOKIE_ZPW_SEK\n             FROM zalo_account za\n             INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n             WHERE ulza.userID = ? AND za.UID = ? AND za.accStatus = 'Đang hoạt động'", [_0x562de3.user.userID, _0x216531]);
      if (_0x2b9be5.length === 0x0) return console.log("❌ Không tìm thấy tài khoản Zalo"), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x190).json({
        'success': false,
        'message': "Không tìm thấy tài khoản Zalo hoặc tài khoản không hoạt động"
      });
      const _0x599f34 = getZaloAccountConfig(_0x2b9be5[0x0]);
      console.log("✅ Tài khoản Zalo:", _0x2b9be5[0x0].displayName), console.log("🔓 Đang giải mã chuỗi PARAMS...");
      const _0x11b786 = decodeAES(_0x316490, _0x599f34.ENCRYPTION_KEY);
      if (!_0x11b786) return console.log("❌ Không thể giải mã chuỗi PARAMS"), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x190).json({
        'success': false,
        'message': "Không thể giải mã chuỗi PARAMS"
      });
      let _0x3ec4b8;
      try {
        _0x3ec4b8 = JSON.parse(_0x11b786);
      } catch (_0x51414e) {
        return console.log("❌ Chuỗi PARAMS không hợp lệ"), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x190).json({
          'success': false,
          'message': "Chuỗi PARAMS không hợp lệ"
        });
      }
      if (!_0x3ec4b8.fid) return console.log("❌ Không tìm thấy thông tin cần thiết trong dữ liệu"), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x190).json({
        'success': false,
        'message': "Không tìm thấy thông tin cần thiết trong dữ liệu"
      });
      const _0x56bc79 = _0x3ec4b8.fid;
      console.log("✅ Đã giải mã PARAMS:", _0x56bc79);
      const _0xa619bc = await getProfileInfo(_0x56bc79, _0x599f34);
      if (!_0xa619bc.success) return console.log("❌ Không thể lấy thông tin profile"), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x194).json({
        'success': false,
        'message': _0xa619bc.message || "Không thể lấy thông tin người dùng"
      });
      console.log("✅ HOÀN THÀNH BƯỚC TÌM KIẾM"), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.json({
        'success': true,
        'data': {
          ..._0xa619bc.data,
          'fee': _0x4a4e88,
          'currentBalance': _0x1965d5
        }
      });
    } catch (_0x510c16) {
      console.error("Decode PARAMS Error:", _0x510c16), console.log("═══════════════════════════════════════════════════════\n"), _0x528cfc.status(0x1f4).json({
        'success': false,
        'message': "Lỗi hệ thống"
      });
    }
  },
  sendImageByCardConfirmed = async (_0x426a80, _0x53a3e8) => {
    const _0x51ef37 = await db.getConnection();
    try {
      await _0x51ef37.beginTransaction();
      const {
          targetUID: _0xf7c0ef,
          targetName: _0x33066e,
          zaloUID: _0x35913b,
          targetAvatar: _0x2fa7c8,
          imageType: _0x2b2d09,
          ipType: _0x49f60c,
          autoDelete: _0x1090b8
        } = _0x426a80.body,
        _0x87599b = !!_0x1090b8;
      if (!_0xf7c0ef || !_0x33066e || !_0x35913b) return await _0x51ef37.rollback(), _0x53a3e8.status(0x190).json({
        'success': false,
        'message': "Thiếu thông tin cần thiết"
      });
      const _0x3617e9 = _0x2fa7c8 || '';
      console.log("\n═══════════════════════════════════════════════════════"), console.log("📤 GỬI ẢNH QUA DANH THIẾP (ĐÃ XÁC NHẬN)"), console.log("   User ID:", _0x426a80.user.userID), console.log("   Target UID:", _0xf7c0ef), console.log("   Zalo UID:", _0x35913b);
      const [_0x53a6e2] = await _0x51ef37.execute("SELECT userID, userName, totalMoney FROM user WHERE userID = ? FOR UPDATE", [_0x426a80.user.userID]);
      if (_0x53a6e2.length === 0x0) return await _0x51ef37.rollback(), console.log("❌ Không tìm thấy user"), console.log("═══════════════════════════════════════════════════════\n"), _0x53a3e8.status(0x194).json({
        'success': false,
        'message': "Không tìm thấy user"
      });
      const _0x5c934d = _0x53a6e2[0x0],
        _0x1160a0 = parseFloat(_0x5c934d.totalMoney);
      console.log('👤\x20User:', _0x5c934d.userName), console.log('💰\x20Số\x20dư:', _0x1160a0.toLocaleString("vi-VN"), '₫');
      const _0x4710e4 = await getToolSetup();
      let _0x140086 = _0x4710e4.zalo_custom_money;
      _0x2b2d09 === "custom" && (_0x140086 += 0x1388);
      _0x49f60c === "both" && (_0x140086 *= 0x2);
      console.log("💸 Phí:", _0x140086.toLocaleString("vi-VN"), '₫');
      if (_0x1160a0 < _0x140086) return await _0x51ef37.rollback(), console.log("❌ Số dư không đủ"), console.log("═══════════════════════════════════════════════════════\n"), _0x53a3e8.status(0x190).json({
        'success': false,
        'message': "Số dư không đủ. Cần " + _0x140086.toLocaleString("vi-VN") + '₫'
      });
      const [_0x4f65f2] = await _0x51ef37.execute("SELECT za.UID, za.displayName, za.IMEI, za.ENCRYPTION_KEY, za.COOKIE_ZPW_SEK\n             FROM zalo_account za\n             INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID\n             WHERE ulza.userID = ? AND za.UID = ? AND za.accStatus = 'Đang hoạt động'", [_0x426a80.user.userID, _0x35913b]);
      if (_0x4f65f2.length === 0x0) return await _0x51ef37.rollback(), console.log("❌ Không tìm thấy tài khoản Zalo"), console.log("═══════════════════════════════════════════════════════\n"), _0x53a3e8.status(0x190).json({
        'success': false,
        'message': "Số điện thoại chưa đăng ký Zalo hoặc không cho phép tìm kiếm"
      });
      const _0x5a5351 = getZaloAccountConfig(_0x4f65f2[0x0]);
      console.log("✅ Tài khoản Zalo:", _0x4f65f2[0x0].displayName);
      let _0x3fa368 = [];
      if (_0x49f60c === "ipv4") _0x3fa368.push({
        'type': 'IPv4',
        'url': process.env.IMG_URL_V4 || process.env.IMG_URL
      });else {
        if (_0x49f60c === "ipv6") _0x3fa368.push({
          'type': "IPv6",
          'url': process.env.IMG_URL_V6 || process.env.IMG_URL
        });else _0x49f60c === 'both' ? (_0x3fa368.push({
          'type': "IPv4",
          'url': process.env.IMG_URL_V4 || process.env.IMG_URL
        }), _0x3fa368.push({
          'type': 'IPv6',
          'url': process.env.IMG_URL_V6 || process.env.IMG_URL
        })) : _0x3fa368.push({
          'type': "Default",
          'url': process.env.IMG_URL
        });
      }
      const _0x43cc43 = [];
      let _0x2afe20 = 0x0;
      for (const _0x220182 of _0x3fa368) {
        let _0x51a9b2 = _0x220182.url;
        if (_0x2b2d09 === "custom") {
          const _0x37b1c9 = 'cus_user_' + _0x426a80.user.userID + '.png';
          _0x51a9b2 = _0x51a9b2.replace("qc.png", _0x37b1c9);
        }
        const [_0x31cc14] = await _0x51ef37.execute("INSERT INTO auto_request \n                 (phoneNumber, UID, displayName, Avatar, imageUrl, sendResult, Detail, fee_charged, use_system_account, sender_zalo_uid)\n                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", ["[Danh thiếp]", _0xf7c0ef, _0x33066e, _0x3617e9, "PENDING", 'PENDING', "Đang xử lý " + _0x220182.type + "...", 0x0, 0x0, _0x35913b]),
          _0x9cece1 = _0x31cc14.insertId;
        await _0x51ef37.query("INSERT INTO user_link_auto_request (userID, reqID) VALUES (?, ?)", [_0x426a80.user.userID, _0x9cece1]);
        const _0x323efb = '' + _0x51a9b2 + (_0x51a9b2.includes('?') ? '&' : '?') + "req=" + _0x9cece1;
        console.log("\n📤 Gửi hình ảnh " + _0x220182.type + " đến UID:", _0xf7c0ef), console.log('🔗\x20URL:', _0x323efb);
        const _0x330dde = await sendPhoto(_0xf7c0ef, _0x323efb, _0x5a5351, _0x87599b);
        let _0x50085d = 0x0;
        _0x330dde.success && (_0x50085d = _0x140086 / _0x3fa368.length, _0x2afe20 += _0x50085d), await _0x51ef37.execute("UPDATE auto_request \n                 SET imageUrl = ?, sendResult = ?, Detail = ?, fee_charged = ?\n                 WHERE reqID = ?", [_0x323efb, _0x330dde.result, _0x330dde.detail + (["IPv4", "IPv6"].includes(_0x220182.type) ? '\x20(' + _0x220182.type + ')' : ''), _0x50085d, _0x9cece1]), _0x43cc43.push({
          'reqID': _0x9cece1,
          'type': _0x220182.type,
          ..._0x330dde
        });
      }
      let _0x233a8d = _0x1160a0;
      _0x2afe20 > 0x0 && (await _0x51ef37.execute("UPDATE user SET totalMoney = totalMoney - ? WHERE userID = ?", [_0x2afe20, _0x426a80.user.userID]), _0x233a8d = _0x1160a0 - _0x2afe20, console.log("💳 Đã trừ tổng cộng " + _0x2afe20.toLocaleString('vi-VN') + "₫ từ tài khoản"));
      await _0x51ef37.commit(), console.log("✅ Transaction committed successfully\n");
      const _0x2700f5 = _0x43cc43.every(_0x5d82ac => _0x5d82ac.success),
        _0x3a7fb1 = _0x43cc43[_0x43cc43.length - 0x1];
      if (_0x2700f5) return _0x53a3e8.json({
        'success': true,
        'message': _0x49f60c === "both" ? "Gửi thành công cả 2 yêu cầu (IPv4 & IPv6)" : _0x3a7fb1.detail,
        'data': {
          'result': _0x3a7fb1.result,
          'detail': _0x3a7fb1.detail,
          'fee': _0x2afe20,
          'newBalance': _0x233a8d,
          'reqID': _0x43cc43[0x0].reqID,
          'results': _0x43cc43
        }
      });else {
        const _0x33dcac = _0x43cc43.some(_0x1d65a7 => _0x1d65a7.success);
        return _0x53a3e8.status(_0x33dcac ? 0xc8 : 0x190).json({
          'success': _0x33dcac,
          'message': _0x33dcac ? "Gửi thành công một phần yêu cầu" : "Gửi yêu cầu thất bại",
          'data': {
            'results': _0x43cc43,
            'fee': _0x2afe20,
            'newBalance': _0x233a8d
          }
        });
      }
    } catch (_0x4c60da) {
      await _0x51ef37.rollback(), console.error("❌ Lỗi khi gửi yêu cầu :", _0x4c60da), _0x53a3e8.status(0x1f4).json({
        'success': false,
        'message': "Lỗi hệ thống khi gửi yêu cầu"
      });
    } finally {
      _0x51ef37.release();
    }
  };
module.exports = {
  'getPersonalAccounts': getPersonalAccounts,
  'decodeFidAndGetProfile': decodeFidAndGetProfile,
  'sendImageByCardConfirmed': sendImageByCardConfirmed
};
