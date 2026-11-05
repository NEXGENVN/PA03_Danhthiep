// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/adminProductController.js
const db = require("../config/database");
function extractRows(_0x2ecd04) {
  if (Array.isArray(_0x2ecd04) && Array.isArray(_0x2ecd04[0x0])) return _0x2ecd04[0x0];else {
    if (Array.isArray(_0x2ecd04)) return _0x2ecd04;else return _0x2ecd04 && _0x2ecd04.rows ? _0x2ecd04.rows : [];
  }
}
exports.getAllProducts = async (_0x5ccae3, _0x7a84c2) => {
  try {
    const _0x5c3079 = "\n            SELECT \n                productID,\n                productName,\n                productDesc,\n                productOnePrice,\n                productFivePrice,\n                productTenPrice,\n                productImage,\n                isActive,\n                createdAt,\n                updatedAt\n            FROM product\n            ORDER BY productID ASC\n        ",
      _0x662ba3 = await db.query(_0x5c3079),
      _0x286799 = extractRows(_0x662ba3);
    _0x7a84c2.json({
      'success': true,
      'message': "Lấy danh sách sản phẩm thành công",
      'data': _0x286799
    });
  } catch (_0x4771f4) {
    console.error("❌ Error getting all products:", _0x4771f4), _0x7a84c2.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách sản phẩm",
      'error': _0x4771f4.message
    });
  }
}, exports.getProductById = async (_0x369b70, _0x4a44ec) => {
  try {
    const {
      productID: _0x9c0327
    } = _0x369b70.params;
    if (!_0x9c0327) return _0x4a44ec.status(0x190).json({
      'success': false,
      'message': "Thiếu productID"
    });
    const _0x1d9e3c = "\n            SELECT \n                productID,\n                productName,\n                productDesc,\n                productOnePrice,\n                productFivePrice,\n                productTenPrice,\n                productImage,\n                isActive,\n                createdAt,\n                updatedAt\n            FROM product\n            WHERE productID = ?\n        ",
      _0xb9431e = await db.query(_0x1d9e3c, [_0x9c0327]),
      _0x19320a = extractRows(_0xb9431e);
    if (!_0x19320a || _0x19320a.length === 0x0) return _0x4a44ec.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy sản phẩm"
    });
    _0x4a44ec.json({
      'success': true,
      'message': "Lấy thông tin sản phẩm thành công",
      'data': _0x19320a[0x0]
    });
  } catch (_0xd057a5) {
    console.error("❌ Error getting product:", _0xd057a5), _0x4a44ec.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy thông tin sản phẩm",
      'error': _0xd057a5.message
    });
  }
}, exports.createProduct = async (_0x3201fc, _0x56629a) => {
  try {
    const {
      productName: _0x50ae4b,
      productDesc: _0xc7e2f1,
      productOnePrice: _0x5e6b36,
      productFivePrice: _0x52b0be,
      productTenPrice: _0x586dd9,
      productImage: _0x3f9ba6,
      isActive: _0xb874f4
    } = _0x3201fc.body;
    if (!_0x50ae4b || !_0xc7e2f1) return _0x56629a.status(0x190).json({
      'success': false,
      'message': "Thiếu thông tin sản phẩm (tên và mô tả là bắt buộc)"
    });
    const _0x3fe79c = parseFloat(_0x5e6b36) || 0x0,
      _0x33b592 = parseFloat(_0x52b0be) || 0x0,
      _0x10cb0c = parseFloat(_0x586dd9) || 0x0;
    if (_0x3fe79c < 0x0 || _0x33b592 < 0x0 || _0x10cb0c < 0x0) return _0x56629a.status(0x190).json({
      'success': false,
      'message': "Giá không được âm"
    });
    if (_0x3fe79c === 0x0 && _0x33b592 === 0x0 && _0x10cb0c === 0x0) return _0x56629a.status(0x190).json({
      'success': false,
      'message': "Phải có ít nhất một loại giá khác 0"
    });
    const _0x42b3fe = "\n            INSERT INTO product (\n                productName,\n                productDesc,\n                productOnePrice,\n                productFivePrice,\n                productTenPrice,\n                productImage,\n                isActive\n            ) VALUES (?, ?, ?, ?, ?, ?, ?)\n        ",
      _0x3e00f7 = [_0x50ae4b, _0xc7e2f1, _0x3fe79c, _0x33b592, _0x10cb0c, _0x3f9ba6 || "https://via.placeholder.com/300x200/667eea/ffffff?text=Product", _0xb874f4 !== undefined ? _0xb874f4 : true],
      _0x2ebaf5 = await db.query(_0x42b3fe, _0x3e00f7),
      _0x6dcca9 = _0x2ebaf5.insertId || _0x2ebaf5[0x0] && _0x2ebaf5[0x0].insertId;
    _0x56629a.json({
      'success': true,
      'message': "Tạo sản phẩm mới thành công",
      'data': {
        'productID': _0x6dcca9,
        'productName': _0x50ae4b
      }
    });
  } catch (_0x17663b) {
    console.error("❌ Error creating product:", _0x17663b), _0x56629a.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi tạo sản phẩm",
      'error': _0x17663b.message
    });
  }
}, exports.updateProduct = async (_0x217a37, _0x3b74d5) => {
  try {
    const {
        productID: _0xf5da0c
      } = _0x217a37.params,
      {
        productName: _0x3d05e0,
        productDesc: _0x5c3cf8,
        productOnePrice: _0x4227aa,
        productFivePrice: _0x220914,
        productTenPrice: _0x48ab9c,
        productImage: _0xd7cda,
        isActive: _0x590c3d
      } = _0x217a37.body;
    if (!_0xf5da0c) return _0x3b74d5.status(0x190).json({
      'success': false,
      'message': "Thiếu productID"
    });
    const _0x47bf94 = "SELECT productID FROM product WHERE productID = ?",
      _0x4825c3 = await db.query(_0x47bf94, [_0xf5da0c]),
      _0x3560f2 = extractRows(_0x4825c3);
    if (!_0x3560f2 || _0x3560f2.length === 0x0) return _0x3b74d5.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy sản phẩm"
    });
    if (_0x4227aa !== undefined) {
      const _0x139431 = parseFloat(_0x4227aa);
      if (_0x139431 < 0x0) return _0x3b74d5.status(0x190).json({
        'success': false,
        'message': "Giá không được âm"
      });
    }
    if (_0x220914 !== undefined) {
      const _0x2b4624 = parseFloat(_0x220914);
      if (_0x2b4624 < 0x0) return _0x3b74d5.status(0x190).json({
        'success': false,
        'message': "Giá không được âm"
      });
    }
    if (_0x48ab9c !== undefined) {
      const _0x9bb835 = parseFloat(_0x48ab9c);
      if (_0x9bb835 < 0x0) return _0x3b74d5.status(0x190).json({
        'success': false,
        'message': "Giá không được âm"
      });
    }
    const _0x3f9d30 = [],
      _0xd95b60 = [];
    _0x3d05e0 !== undefined && (_0x3f9d30.push("productName = ?"), _0xd95b60.push(_0x3d05e0));
    _0x5c3cf8 !== undefined && (_0x3f9d30.push("productDesc = ?"), _0xd95b60.push(_0x5c3cf8));
    _0x4227aa !== undefined && (_0x3f9d30.push("productOnePrice = ?"), _0xd95b60.push(parseFloat(_0x4227aa) || 0x0));
    _0x220914 !== undefined && (_0x3f9d30.push("productFivePrice = ?"), _0xd95b60.push(parseFloat(_0x220914) || 0x0));
    _0x48ab9c !== undefined && (_0x3f9d30.push("productTenPrice = ?"), _0xd95b60.push(parseFloat(_0x48ab9c) || 0x0));
    _0xd7cda !== undefined && (_0x3f9d30.push("productImage = ?"), _0xd95b60.push(_0xd7cda));
    _0x590c3d !== undefined && (_0x3f9d30.push("isActive = ?"), _0xd95b60.push(_0x590c3d));
    if (_0x3f9d30.length === 0x0) return _0x3b74d5.status(0x190).json({
      'success': false,
      'message': "Không có thông tin nào để cập nhật"
    });
    _0xd95b60.push(_0xf5da0c);
    const _0x4ef1ae = "\n            UPDATE product \n            SET " + _0x3f9d30.join(',\x20') + "\n            WHERE productID = ?\n        ";
    await db.query(_0x4ef1ae, _0xd95b60), _0x3b74d5.json({
      'success': true,
      'message': "Cập nhật sản phẩm thành công"
    });
  } catch (_0x56fdf7) {
    console.error("❌ Error updating product:", _0x56fdf7), _0x3b74d5.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi cập nhật sản phẩm",
      'error': _0x56fdf7.message
    });
  }
}, exports.deleteProduct = async (_0x3d5e0e, _0x51cb41) => {
  try {
    const {
      productID: _0x3dfc71
    } = _0x3d5e0e.params;
    if (!_0x3dfc71) return _0x51cb41.status(0x190).json({
      'success': false,
      'message': "Thiếu productID"
    });
    const _0x5b209c = "\n            SELECT COUNT(*) as licenseCount \n            FROM license \n            WHERE productID = ?\n        ",
      _0x11c6fd = await db.query(_0x5b209c, [_0x3dfc71]),
      _0x189a6c = extractRows(_0x11c6fd),
      _0x56c9c0 = _0x189a6c[0x0]?.["licenseCount"] || 0x0;
    if (_0x56c9c0 > 0x0) {
      const _0x34ad54 = "UPDATE product SET isActive = FALSE WHERE productID = ?";
      return await db.query(_0x34ad54, [_0x3dfc71]), _0x51cb41.json({
        'success': true,
        'message': "Đã vô hiệu hóa sản phẩm (có " + _0x56c9c0 + " licenses đã mua, không thể xóa hoàn toàn)"
      });
    } else {
      const _0x5bdc0a = "DELETE FROM product WHERE productID = ?";
      return await db.query(_0x5bdc0a, [_0x3dfc71]), _0x51cb41.json({
        'success': true,
        'message': "Đã xóa sản phẩm thành công"
      });
    }
  } catch (_0x205b24) {
    console.error("❌ Error deleting product:", _0x205b24), _0x51cb41.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi xóa sản phẩm",
      'error': _0x205b24.message
    });
  }
}, exports.getProductStats = async (_0x5957ff, _0x10c18c) => {
  try {
    const _0x2e3703 = "\n            SELECT \n                p.productID,\n                p.productName,\n                p.isActive,\n                COUNT(l.licenseID) as totalLicenses,\n                SUM(CASE WHEN l.isActivated = TRUE THEN 1 ELSE 0 END) as activatedLicenses,\n                SUM(l.pricePaid) as totalRevenue\n            FROM product p\n            LEFT JOIN license l ON p.productID = l.productID\n            GROUP BY p.productID, p.productName, p.isActive\n            ORDER BY totalRevenue DESC\n        ",
      _0x19135a = await db.query(_0x2e3703),
      _0x1e97a9 = extractRows(_0x19135a);
    _0x10c18c.json({
      'success': true,
      'message': "Lấy thống kê sản phẩm thành công",
      'data': _0x1e97a9
    });
  } catch (_0x19f7c4) {
    console.error("❌ Error getting product stats:", _0x19f7c4), _0x10c18c.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy thống kê sản phẩm",
      'error': _0x19f7c4.message
    });
  }
}, exports.getAllLicenses = async (_0x2c81b7, _0x5296d9) => {
  try {
    const {
        productID: _0x4cda62,
        userName: _0x244ea3,
        status: _0x7ca48b,
        page = 0x1,
        limit = 0x32
      } = _0x2c81b7.query,
      _0x44b846 = [],
      _0x221b66 = [];
    _0x4cda62 && (_0x44b846.push("l.productID = ?"), _0x221b66.push(_0x4cda62));
    _0x244ea3 && (_0x44b846.push("u.userName = ?"), _0x221b66.push(_0x244ea3));
    _0x7ca48b !== undefined && (_0x44b846.push("l.status = ?"), _0x221b66.push(_0x7ca48b));
    const _0x4f6432 = _0x44b846.length > 0x0 ? "WHERE " + _0x44b846.join('\x20AND\x20') : '',
      _0x15c3a4 = Math.max(0x1, parseInt(page) || 0x1),
      _0x39de33 = Math.max(0x1, parseInt(limit) || 0x32),
      _0x26d97c = (_0x15c3a4 - 0x1) * _0x39de33,
      _0x4da4e9 = "\n            SELECT COUNT(*) as total\n            FROM license l\n            LEFT JOIN user_link_license ull ON l.licenseKey = ull.licenseKey\n            LEFT JOIN user u ON ull.userID = u.userID\n            " + _0x4f6432 + "\n        ",
      _0x3eb08e = await db.query(_0x4da4e9, _0x221b66),
      _0x158229 = extractRows(_0x3eb08e)[0x0]?.["total"] || 0x0,
      _0x1f98a8 = "\n            SELECT \n                l.licenseKey,\n                l.status,\n                p.productID,\n                p.productName,\n                p.productImage,\n                u.userID,\n                u.userName,\n                u.email,\n                ull.pricePaid,\n                ull.purchaseTime\n            FROM license l\n            INNER JOIN product p ON l.productID = p.productID\n            LEFT JOIN user_link_license ull ON l.licenseKey = ull.licenseKey\n            LEFT JOIN user u ON ull.userID = u.userID\n            " + _0x4f6432 + "\n            ORDER BY ull.purchaseTime DESC, l.createdAt DESC\n            LIMIT " + _0x39de33 + " OFFSET " + _0x26d97c + "\n        ",
      _0x3e55bc = _0x221b66,
      _0x42869a = await db.query(_0x1f98a8, _0x3e55bc),
      _0xe0d7e4 = extractRows(_0x42869a);
    _0x5296d9.json({
      'success': true,
      'message': "Lấy danh sách licenses thành công",
      'data': {
        'licenses': _0xe0d7e4,
        'pagination': {
          'page': _0x15c3a4,
          'limit': _0x39de33,
          'total': _0x158229,
          'totalPages': Math.ceil(_0x158229 / _0x39de33)
        }
      }
    });
  } catch (_0x365d02) {
    console.error("❌ Error getting all licenses:", _0x365d02), _0x5296d9.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách licenses",
      'error': _0x365d02.message
    });
  }
}, exports.getLicenseById = async (_0x18c2f1, _0x5b4530) => {
  try {
    const {
        licenseKey: _0xc7dacb
      } = _0x18c2f1.params,
      _0x29267f = "\n            SELECT \n                l.licenseKey,\n                l.activeTime,\n                l.createdAt,\n                l.updatedAt,\n                l.status,\n                l.countDown,\n                p.productID,\n                p.productName,\n                p.productImage,\n                u.userID,\n                u.userName,\n                u.email,\n                ull.pricePaid,\n                ull.purchaseTime\n            FROM license l\n            INNER JOIN product p ON l.productID = p.productID\n            LEFT JOIN user_link_license ull ON l.licenseKey = ull.licenseKey\n            LEFT JOIN user u ON ull.userID = u.userID\n            WHERE l.licenseKey = ?\n        ",
      _0x27d68b = await db.query(_0x29267f, [_0xc7dacb]),
      _0x3243b3 = extractRows(_0x27d68b);
    if (!_0x3243b3 || _0x3243b3.length === 0x0) return _0x5b4530.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy license"
    });
    _0x5b4530.json({
      'success': true,
      'message': "Lấy thông tin license thành công",
      'data': _0x3243b3[0x0]
    });
  } catch (_0x5a9096) {
    console.error("❌ Error getting license:", _0x5a9096), _0x5b4530.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy thông tin license",
      'error': _0x5a9096.message
    });
  }
}, exports.revokeLicense = async (_0x37def7, _0x18b553) => {
  try {
    const {
        licenseKey: _0x247dc6
      } = _0x37def7.params,
      {
        reason: _0x4a8b1a
      } = _0x37def7.body,
      _0x410b86 = "SELECT * FROM license WHERE licenseKey = ?",
      _0x1f7519 = await db.query(_0x410b86, [_0x247dc6]),
      _0x4546af = extractRows(_0x1f7519);
    if (!_0x4546af || _0x4546af.length === 0x0) return _0x18b553.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy license"
    });
    const _0x443d67 = "\n            UPDATE license \n            SET status = 2\n            WHERE licenseKey = ?\n        ";
    await db.query(_0x443d67, [_0x247dc6]), console.log("🔒 Admin revoked license " + _0x247dc6 + ". Reason: " + (_0x4a8b1a || "No reason provided")), _0x18b553.json({
      'success': true,
      'message': "Đã vô hiệu hóa license thành công"
    });
  } catch (_0x32e900) {
    console.error("❌ Error revoking license:", _0x32e900), _0x18b553.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi vô hiệu hóa license",
      'error': _0x32e900.message
    });
  }
}, exports.extendLicense = async (_0xe838b, _0x5ef3a7) => {
  try {
    const {
        licenseKey: _0x4e78da
      } = _0xe838b.params,
      {
        count: _0x565227
      } = _0xe838b.body;
    if (!_0x565227 || _0x565227 < 0x1) return _0x5ef3a7.status(0x190).json({
      'success': false,
      'message': "Số lượt tăng không hợp lệ"
    });
    const _0x169894 = "SELECT * FROM license WHERE licenseKey = ?",
      _0x33df63 = await db.query(_0x169894, [_0x4e78da]),
      _0x3fb253 = extractRows(_0x33df63);
    if (!_0x3fb253 || _0x3fb253.length === 0x0) return _0x5ef3a7.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy license"
    });
    const _0x3c706b = _0x3fb253[0x0];
    newCountDown = _0x3c706b.countDown + _0x565227;
    const _0x1f1d4e = "\n            UPDATE license \n            SET countDown = ?\n            WHERE licenseKey = ?\n        ";
    await db.query(_0x1f1d4e, [newCountDown, _0x4e78da]), console.log("📅 Admin extended countDown license " + _0x4e78da + '\x20by\x20' + _0x565227 + '\x20times'), _0x5ef3a7.json({
      'success': true,
      'message': "Đã tăng lượt dùng license thêm " + _0x565227 + " lần",
      'data': {
        'newCountDown': newCountDown
      }
    });
  } catch (_0x17812f) {
    console.error("❌ Error countDown license:", _0x17812f), _0x5ef3a7.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi tăng lượt dùng license",
      'error': _0x17812f.message
    });
  }
}, exports.deleteLicense = async (_0x558441, _0x48a69a) => {
  try {
    const {
        licenseKey: _0xa3bd9d
      } = _0x558441.params,
      _0x5d1e38 = "SELECT * FROM license WHERE licenseKey = ?",
      _0x3cfb21 = await db.query(_0x5d1e38, [_0xa3bd9d]),
      _0x4f905e = extractRows(_0x3cfb21);
    if (!_0x4f905e || _0x4f905e.length === 0x0) return _0x48a69a.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy license"
    });
    await db.query("DELETE FROM user_link_license WHERE licenseKey = ?", [_0xa3bd9d]);
    const _0x159652 = "DELETE FROM license WHERE licenseKey = ?";
    await db.query(_0x159652, [_0xa3bd9d]), console.log("🗑️ Admin deleted license " + _0xa3bd9d), _0x48a69a.json({
      'success': true,
      'message': "Đã xóa license thành công"
    });
  } catch (_0x46c73c) {
    console.error("❌ Error deleting license:", _0x46c73c), _0x48a69a.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi xóa license",
      'error': _0x46c73c.message
    });
  }
}, exports.getLicenseStats = async (_0x23a25e, _0x36d2d5) => {
  try {
    const _0x536b7f = "\n            SELECT \n                COUNT(*) as totalLicenses,\n                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as activatedLicenses,\n                SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as notActivatedLicenses,\n                SUM(CASE WHEN status = 1 AND countDown > 0 THEN 1 ELSE 0 END) as activeLicenses,\n                SUM(CASE WHEN status = 2 OR countDown = 0 THEN 1 ELSE 0 END) as expiredLicenses,\n                COUNT(DISTINCT productID) as totalProducts,\n                (SELECT SUM(pricePaid) FROM user_link_license) as totalRevenue,\n                (SELECT COUNT(DISTINCT userID) FROM user_link_license) as totalUsers\n            FROM license\n        ",
      _0x174402 = await db.query(_0x536b7f),
      _0x3f51ca = extractRows(_0x174402)[0x0];
    _0x36d2d5.json({
      'success': true,
      'message': "Lấy thống kê licenses thành công",
      'data': _0x3f51ca
    });
  } catch (_0x4fa14d) {
    console.error("❌ Error getting license stats:", _0x4fa14d), _0x36d2d5.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy thống kê licenses",
      'error': _0x4fa14d.message
    });
  }
}, module.exports = exports;
