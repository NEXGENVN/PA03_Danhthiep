// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/licenseController.js
const db = require("../config/database"),
  crypto = require("crypto"),
  generateLicenseKey = () => {
    const _0x2fd464 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
      _0x53395b = 0x5,
      _0xf9da24 = 0x6;
    let _0xea5eb3 = '';
    for (let _0x1d01cf = 0x0; _0x1d01cf < _0xf9da24; _0x1d01cf++) {
      const _0x2d427d = crypto.randomBytes(_0x53395b);
      let _0x46e949 = '';
      for (let _0x2d9e8d = 0x0; _0x2d9e8d < _0x53395b; _0x2d9e8d++) {
        const _0x5171e1 = _0x2d427d[_0x2d9e8d] % _0x2fd464.length;
        _0x46e949 += _0x2fd464[_0x5171e1];
      }
      _0xea5eb3 += _0x46e949, _0x1d01cf < _0xf9da24 - 0x1 && (_0xea5eb3 += '-');
    }
    return _0xea5eb3;
  },
  validateLicenseKeyFormat = _0x3589a9 => {
    const _0x20636b = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/;
    return _0x20636b.test(_0x3589a9);
  };
exports.getProducts = async (_0x27c63f, _0x157900) => {
  try {
    const _0x4c6712 = "\n      SELECT \n        productID,\n        productName,\n        productDesc,\n        productOnePrice,\n        productFivePrice,\n        productTenPrice,\n        productImage\n      FROM product\n      WHERE isActive = TRUE\n      ORDER BY productID ASC\n    ",
      _0x5c07ad = await db.query(_0x4c6712);
    let _0x29f2fe;
    if (Array.isArray(_0x5c07ad) && Array.isArray(_0x5c07ad[0x0])) _0x29f2fe = _0x5c07ad[0x0];else Array.isArray(_0x5c07ad) ? _0x29f2fe = _0x5c07ad : _0x29f2fe = [];
    _0x157900.json({
      'success': true,
      'message': "Lấy danh sách sản phẩm thành công (debug)",
      'data': _0x29f2fe
    });
  } catch (_0x4b43a7) {
    console.error("❌ Error getting products (debug):", _0x4b43a7), _0x157900.status(0x1f4).json({
      'success': false,
      'message': "Lỗi",
      'error': _0x4b43a7.message
    });
  }
};
function extractRows(_0x57c674) {
  if (Array.isArray(_0x57c674) && Array.isArray(_0x57c674[0x0])) return _0x57c674[0x0];else {
    if (Array.isArray(_0x57c674)) return _0x57c674;else return _0x57c674 && _0x57c674.rows ? _0x57c674.rows : [];
  }
}
exports.purchaseLicense = async (_0x207a28, _0x213cc5) => {
  let _0x371b46;
  try {
    _0x371b46 = await db.getConnection();
    const {
        productID: _0x1fdf2e,
        licenseType: _0x1bac08
      } = _0x207a28.body,
      _0x152f0f = _0x207a28.user && _0x207a28.user.userID;
    console.log("userID: ", _0x152f0f);
    if (!_0x1fdf2e || !_0x1bac08 || !_0x152f0f) return _0x213cc5.status(0x190).json({
      'success': false,
      'message': "Thiếu thông tin productID, licenseType hoặc userID"
    });
    if (![0x1, 0x2, 0x3].includes(parseInt(_0x1bac08))) return _0x213cc5.status(0x190).json({
      'success': false,
      'message': "licenseType không hợp lệ. Chỉ chấp nhận 1, 2, hoặc 3"
    });
    await _0x371b46.beginTransaction();
    const _0x36c267 = await _0x371b46.query("SELECT * FROM product WHERE productID = ? AND isActive = TRUE", [_0x1fdf2e]),
      _0x374a35 = extractRows(_0x36c267);
    if (!_0x374a35 || _0x374a35.length === 0x0) return await _0x371b46.rollback(), _0x213cc5.status(0x194).json({
      'success': false,
      'message': "Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa"
    });
    const _0x2d96a0 = _0x374a35[0x0];
    let _0x3e57b5 = 0x0;
    switch (parseInt(_0x1bac08)) {
      case 0x1:
        _0x3e57b5 = Number(_0x2d96a0.productOnePrice);
        break;
      case 0x2:
        _0x3e57b5 = Number(_0x2d96a0.productFivePrice);
        break;
      case 0x3:
        _0x3e57b5 = Number(_0x2d96a0.productTenPrice);
        break;
    }
    if (Number.isNaN(_0x3e57b5) || _0x3e57b5 < 0x0) return await _0x371b46.rollback(), _0x213cc5.status(0x1f4).json({
      'success': false,
      'message': "Giá sản phẩm không hợp lệ"
    });
    const _0x4a6883 = await _0x371b46.query("SELECT totalMoney FROM user WHERE userID = ? FOR UPDATE", [_0x152f0f]),
      _0x2e8726 = extractRows(_0x4a6883);
    if (!_0x2e8726 || _0x2e8726.length === 0x0) return await _0x371b46.rollback(), _0x213cc5.status(0x194).json({
      'success': false,
      'message': "Người dùng không tồn tại"
    });
    const _0x42db7a = parseFloat(_0x2e8726[0x0].totalMoney);
    console.log("currentBalance: ", _0x42db7a);
    if (isNaN(_0x42db7a)) return await _0x371b46.rollback(), _0x213cc5.status(0x1f4).json({
      'success': false,
      'message': "Số dư người dùng không hợp lệ"
    });
    if (_0x42db7a < _0x3e57b5) return await _0x371b46.rollback(), _0x213cc5.status(0x190).json({
      'success': false,
      'message': "Số dư không đủ để mua bản quyền",
      'data': {
        'currentBalance': _0x42db7a,
        'requiredAmount': _0x3e57b5,
        'shortage': _0x3e57b5 - _0x42db7a
      }
    });
    let _0x53c5e5,
      _0x59960a = false,
      _0x1c7bc6 = 0x0;
    const _0x19e39c = 0x14;
    while (!_0x59960a && _0x1c7bc6 < _0x19e39c) {
      _0x1c7bc6++, _0x53c5e5 = generateLicenseKey();
      try {
        const _0x2f3008 = await _0x371b46.query("SELECT licenseKey FROM license WHERE licenseKey = ?", [_0x53c5e5]),
          _0x3d829a = extractRows(_0x2f3008);
        if (_0x3d829a && _0x3d829a.length > 0x0) {
          console.log("⚠️ License key collision detected: " + _0x53c5e5 + " (attempt " + _0x1c7bc6 + '/' + _0x19e39c + ')');
          continue;
        }
        countDown = 0x0;
        if (_0x1bac08 === 0x1) countDown = 0x1;else {
          if (_0x1bac08 === 0x2) countDown = 0x5;else _0x1bac08 === 0x3 && (countDown = 0xa);
        }
        await _0x371b46.query("INSERT INTO license \n                        (licenseKey, productID, countDown, status, createdAt, updatedAt)\n                    VALUES (?, ?, ?, 0, NOW(), NOW())", [_0x53c5e5, _0x1fdf2e, countDown]), _0x59960a = true, console.log("✅ License key created successfully: " + _0x53c5e5 + " (attempts: " + _0x1c7bc6 + ')');
      } catch (_0x3b933a) {
        if (_0x3b933a && _0x3b933a.code === "ER_DUP_ENTRY") {
          console.log("⚠️ Race condition detected - duplicate key during INSERT: " + _0x53c5e5 + " (attempt " + _0x1c7bc6 + '/' + _0x19e39c + ')');
          continue;
        } else {
          console.error("❌ Unexpected error during license INSERT:", _0x3b933a);
          throw _0x3b933a;
        }
      }
    }
    if (!_0x59960a) return await _0x371b46.rollback(), _0x213cc5.status(0x1f4).json({
      'success': false,
      'message': "Không thể tạo license key duy nhất sau " + _0x19e39c + " lần thử. Vui lòng thử lại sau.",
      'debug': {
        'attempts': _0x1c7bc6,
        'reason': "Too many collisions or database issue"
      }
    });
    await _0x371b46.query("INSERT INTO user_link_license \n                (userID, licenseKey, purchaseTime, pricePaid)\n            VALUES (?, ?, NOW(), ?)", [_0x152f0f, _0x53c5e5, _0x3e57b5]), await _0x371b46.query("UPDATE user SET totalMoney = totalMoney - ? WHERE userID = ?", [_0x3e57b5, _0x152f0f]), await _0x371b46.commit();
    const _0x3e0600 = await _0x371b46.query("SELECT \n\t\t\t   l.*,\n\t\t\t   p.productName,\n\t\t\t   p.productImage,\n\t\t\t   CASE\n\t\t\t\t WHEN l.countDown = 1 THEN '1 lần'\n\t\t\t\t WHEN l.countDown = 5 THEN '5 lần'\n\t\t\t\t WHEN l.countDown = 10 THEN '10 lần'\n\t\t\t\t ELSE CONCAT(l.countDown, ' lần')\n\t\t\t   END AS licenseTypeName\n\t\t\tFROM license l\n\t\t\tINNER JOIN product p ON l.productID = p.productID\n\t\t\tWHERE l.licenseKey = ?", [_0x53c5e5]),
      _0x548521 = extractRows(_0x3e0600);
    _0x213cc5.json({
      'success': true,
      'message': "Mua bản quyền thành công",
      'data': {
        'license': _0x548521[0x0] || null,
        'pricePaid': _0x3e57b5,
        'newBalance': _0x42db7a - _0x3e57b5
      }
    });
  } catch (_0x239a56) {
    if (_0x371b46) try {
      await _0x371b46.rollback();
    } catch (_0x3cbb3a) {
      console.error("Rollback error:", _0x3cbb3a);
    }
    console.error("❌ Error purchasing license:", _0x239a56), _0x213cc5.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi mua bản quyền",
      'error': _0x239a56.message
    });
  } finally {
    if (_0x371b46) try {
      _0x371b46.release();
    } catch (_0x3ab600) {
      console.error("Release connection error:", _0x3ab600);
    }
  }
}, exports.getUserLicenses = async (_0x44f8fb, _0x3860b5) => {
  try {
    const _0x1e782e = _0x44f8fb.user && _0x44f8fb.user.userID;
    if (!_0x1e782e) return _0x3860b5.status(0x190).json({
      'success': false,
      'message': "Thiếu thông tin cần thiết"
    });
    const _0x51ec77 = "\n            SELECT           \n                ull.licenseKey           AS licenseKey,\n                p.productName            AS productName,\n                p.productImage           AS productImage,\n                ull.purchaseTime         AS purchaseTime,\n                ull.pricePaid            AS pricePaid,\n                l.activeTime             AS activeTime,\n                l.countDown              AS countDown,\n                l.status                 AS licenseStatus\n            FROM user_link_license ull\n            JOIN user u       ON ull.userID = u.userID\n            JOIN license l    ON ull.licenseKey = l.licenseKey\n            LEFT JOIN product p ON l.productID = p.productID\n            WHERE ull.userID = ?",
      _0xf3a9b7 = await db.query(_0x51ec77, [_0x1e782e]),
      _0x8da2ce = extractRows(_0xf3a9b7),
      _0x1ab03b = Array.isArray(_0x8da2ce) ? _0x8da2ce : [];
    return _0x3860b5.json({
      'success': true,
      'message': "Lấy danh sách bản quyền thành công",
      'data': _0x1ab03b
    });
  } catch (_0x5276b2) {
    return console.error("❌ Error getting user licenses:", _0x5276b2), _0x3860b5.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách bản quyền",
      'error': _0x5276b2.message
    });
  }
}, module.exports = exports;
