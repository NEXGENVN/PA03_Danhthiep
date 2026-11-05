// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/zaloOaController.js
const axios = require("../utils/axiosInstance"),
  db = require("../config/database");
exports.getToken = async (_0x2a6805, _0x39acb7) => {
  try {
    const _0x2136e8 = await db.query("SELECT * FROM zalo_token ORDER BY id DESC LIMIT 1");
    if (_0x2136e8.length > 0x0) return _0x39acb7.json({
      'success': true,
      'data': _0x2136e8[0x0]
    });
    _0x39acb7.json({
      'success': true,
      'data': null
    });
  } catch (_0x3504c9) {
    console.error("Error fetching token:", _0x3504c9), _0x39acb7.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy token"
    });
  }
}, exports.refreshToken = async (_0x2d0660, _0x2e7ae5) => {
  try {
    const {
        refresh_token: _0x5bf2bb
      } = _0x2d0660.body,
      _0x43d475 = process.env.SECRET_KEY,
      _0x14c3f6 = process.env.APP_ID;
    if (!_0x43d475 || !_0x14c3f6) return _0x2e7ae5.status(0x190).json({
      'success': false,
      'message': "Vui lòng cấu hình SECRET_KEY và APP_ID trong .env"
    });
    let _0x4e9be6 = _0x5bf2bb;
    if (!_0x4e9be6) {
      const _0x8c3832 = await db.query("SELECT refresh_token FROM zalo_token ORDER BY id DESC LIMIT 1");
      _0x8c3832.length > 0x0 ? _0x4e9be6 = _0x8c3832[0x0].refresh_token : _0x4e9be6 = process.env.REFRESH_TOKEN;
    }
    if (!_0x4e9be6) return _0x2e7ae5.status(0x190).json({
      'success': false,
      'message': "Không tìm thấy refresh_token để cấp lại"
    });
    const _0x124df4 = "https://oauth.zaloapp.com/v4/oa/access_token",
      _0x36ea6c = {
        'Content-Type': "application/x-www-form-urlencoded",
        'secret_key': _0x43d475
      },
      _0x59cdee = new URLSearchParams({
        'refresh_token': _0x4e9be6,
        'app_id': _0x14c3f6,
        'grant_type': "refresh_token"
      }),
      _0x577e54 = await axios.post(_0x124df4, _0x59cdee, {
        'headers': _0x36ea6c
      }),
      _0x38d775 = _0x577e54.data;
    if (_0x38d775.access_token) {
      const _0x861c58 = parseInt(_0x38d775.expires_in) || 0x15f90,
        _0x21bac0 = new Date(Date.now() + _0x861c58 * 0x3e8);
      return await db.query("DELETE FROM zalo_token"), await db.query("INSERT INTO zalo_token (access_token, refresh_token, expires_at) VALUES (?, ?, ?)", [_0x38d775.access_token, _0x38d775.refresh_token, _0x21bac0]), _0x2e7ae5.json({
        'success': true,
        'message': "Lấy Access Token thành công",
        'data': {
          'access_token': _0x38d775.access_token,
          'refresh_token': _0x38d775.refresh_token,
          'expires_at': _0x21bac0
        }
      });
    }
    return _0x2e7ae5.status(0x190).json({
      'success': false,
      'message': "Không thể cấp lại token",
      'data': _0x38d775
    });
  } catch (_0x48894c) {
    console.error("Error refreshing token:", _0x48894c.response ? _0x48894c.response.data : _0x48894c.message), _0x2e7ae5.status(0x1f4).json({
      'success': false,
      'message': "Lỗi kết nối Zalo API",
      'error': _0x48894c.response ? _0x48894c.response.data : _0x48894c.message
    });
  }
}, exports.getTemplates = async (_0x4d92e1, _0x2d3952) => {
  try {
    const _0x3bc1a0 = await db.query("SELECT * FROM zalo_template ORDER BY id DESC");
    _0x2d3952.json({
      'success': true,
      'data': _0x3bc1a0
    });
  } catch (_0x5b36b4) {
    console.error("Error fetching templates:", _0x5b36b4), _0x2d3952.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy danh sách template"
    });
  }
}, exports.addTemplate = async (_0x45a97e, _0x445424) => {
  try {
    const {
      template_id: _0x5baf3b,
      detail: _0x597f67,
      params: _0x40c215
    } = _0x45a97e.body;
    if (!_0x5baf3b) return _0x445424.status(0x190).json({
      'success': false,
      'message': "Thiếu template_id"
    });
    await db.query("INSERT INTO zalo_template (template_id, detail, params) VALUES (?, ?, ?)", [_0x5baf3b, _0x597f67 || '', _0x40c215 || '']), _0x445424.json({
      'success': true,
      'message': "Thêm template thành công"
    });
  } catch (_0x41cfab) {
    console.error("Error adding template:", _0x41cfab), _0x445424.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi thêm template"
    });
  }
}, exports.updateTemplate = async (_0x3a4edc, _0x18308) => {
  try {
    const {
        id: _0x2afa8f
      } = _0x3a4edc.params,
      {
        template_id: _0x230d29,
        detail: _0x4d6fcd,
        params: _0x336da0
      } = _0x3a4edc.body;
    await db.query("UPDATE zalo_template SET template_id = ?, detail = ?, params = ? WHERE id = ?", [_0x230d29, _0x4d6fcd, _0x336da0, _0x2afa8f]), _0x18308.json({
      'success': true,
      'message': "Cập nhật template thành công"
    });
  } catch (_0x381532) {
    console.error("Error updating template:", _0x381532), _0x18308.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi cập nhật template"
    });
  }
}, exports.deleteTemplate = async (_0x1707a6, _0x10c923) => {
  try {
    const {
      id: _0x3dade3
    } = _0x1707a6.params;
    await db.query("DELETE FROM zalo_template WHERE id = ?", [_0x3dade3]), _0x10c923.json({
      'success': true,
      'message': "Xóa template thành công"
    });
  } catch (_0x2a5caf) {
    console.error("Error deleting template:", _0x2a5caf), _0x10c923.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi xóa template"
    });
  }
}, exports.getResults = async (_0x1f5a74, _0xfbdb9b) => {
  try {
    const _0x2c6d5a = await db.query("SELECT * FROM oa_result ORDER BY id DESC");
    _0xfbdb9b.json({
      'success': true,
      'data': _0x2c6d5a
    });
  } catch (_0x1fdc85) {
    console.error("Error fetching results:", _0x1fdc85), _0xfbdb9b.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi lấy kết quả"
    });
  }
}, exports.sendTemplate = async (_0x55aaa9, _0x5994c7) => {
  try {
    let {
      phone_number: _0x2b7ce5,
      template_id: _0x4264d5,
      custom_params: _0x2e8c49
    } = _0x55aaa9.body;
    if (!_0x2b7ce5 || !_0x4264d5) return _0x5994c7.status(0x190).json({
      'success': false,
      'message': "Thiếu thông tin phone_number hoặc template_id"
    });
    _0x2b7ce5.startsWith('0') && (_0x2b7ce5 = '84' + _0x2b7ce5.substring(0x1));
    const _0x2fafc6 = await db.query("SELECT COUNT(*) as count FROM oa_result"),
      _0x5329dd = (_0x2fafc6[0x0].count + 0x1).toString().padStart(0x7, '0'),
      _0x3efe1b = 'BC' + _0x5329dd;
    let _0x136765 = {
      ..._0x2e8c49
    };
    const _0x244d4e = new Date(new Date().toLocaleString('en-US', {
        'timeZone': "Asia/Ho_Chi_Minh"
      })),
      _0x2ff977 = String(_0x244d4e.getDate()).padStart(0x2, '0'),
      _0x44b6e9 = String(_0x244d4e.getMonth() + 0x1).padStart(0x2, '0'),
      _0x5a6f61 = _0x244d4e.getFullYear();
    !_0x136765.date && (_0x136765.date = _0x2ff977 + '/' + _0x44b6e9 + '/' + _0x5a6f61);
    !_0x136765.order_code && (_0x136765.order_code = _0x3efe1b);
    if (!_0x136765.price) {
      const _0x28acb4 = Math.floor(Math.random() * 0x51) + 0xa;
      _0x136765.price = _0x28acb4 * 0x2710;
    }
    !_0x136765.phone_number && (_0x136765.phone_number = _0x55aaa9.body.phone_number);
    !_0x136765.status && (_0x136765.status = "Đang xử lý");
    const _0x1f388c = await db.query("SELECT * FROM zalo_token ORDER BY id DESC LIMIT 1");
    if (_0x1f388c.length === 0x0 || !_0x1f388c[0x0].access_token) return _0x5994c7.status(0x190).json({
      'success': false,
      'error_code': "TOKEN_MISSING",
      'message': "Không tìm thấy Access Token. Vui lòng cập nhật token."
    });
    const _0x2fd41d = _0x1f388c[0x0],
      _0x5b6372 = new Date();
    if (new Date(_0x2fd41d.expires_at) <= _0x5b6372) return _0x5994c7.status(0x190).json({
      'success': false,
      'error_code': "TOKEN_EXPIRED",
      'message': "Access Token đã hết hạn. Vui lòng sang tab Quản lý token để lấy token mới."
    });
    const _0x42768c = _0x2fd41d.access_token,
      _0x1e1ac2 = "https://business.openapi.zalo.me/message/template",
      _0x391040 = {
        'Content-Type': "application/json",
        'access_token': _0x42768c
      };
    let _0xf88051 = Array.isArray(_0x4264d5) ? _0x4264d5 : [_0x4264d5];
    _0xf88051.length === 0x2 && _0xf88051.reverse();
    let _0x179034 = 0x0,
      _0x128a75 = null,
      _0x849462 = null,
      _0x45ed13 = [];
    for (let _0x534bfa = 0x0; _0x534bfa < _0xf88051.length; _0x534bfa++) {
      const _0x2b8bea = _0xf88051[_0x534bfa],
        _0xb68f68 = await db.query("SELECT params FROM zalo_template WHERE template_id = ?", [_0x2b8bea]);
      let _0xc432d0 = {};
      if (_0xb68f68.length > 0x0 && _0xb68f68[0x0].params) {
        const _0x16d4eb = _0xb68f68[0x0].params.split(',').map(_0x479053 => _0x479053.trim()).filter(_0x15011a => _0x15011a !== '');
        _0x16d4eb.forEach(_0x4617f1 => {
          _0x136765[_0x4617f1] !== undefined && (_0xc432d0[_0x4617f1] = _0x136765[_0x4617f1]);
        });
      } else _0xc432d0 = _0x136765;
      const _0x674b62 = {
        'phone': _0x2b7ce5,
        'template_id': _0x2b8bea,
        'template_data': _0xc432d0
      };
      console.log("[Zalo OA Phone] Sending to tid " + _0x2b8bea + ':', JSON.stringify(_0x674b62, null, 0x2));
      try {
        const _0x50ac08 = await axios.post(_0x1e1ac2, _0x674b62, {
            'headers': _0x391040
          }),
          _0x4bdc09 = _0x50ac08.data;
        console.log("[Zalo OA Phone] Response for tid " + _0x2b8bea + ':', JSON.stringify(_0x4bdc09, null, 0x2)), _0x45ed13.push(_0x4bdc09), _0x534bfa === 0x0 && (_0x849462 = _0x4bdc09, _0x4bdc09.error === 0x0 && _0x4bdc09.data && _0x4bdc09.data.msg_id && (_0x128a75 = _0x4bdc09.data.msg_id)), _0x4bdc09.error === 0x0 && _0x179034++;
      } catch (_0x4f3916) {
        const _0x1bbd4b = _0x4f3916.response ? _0x4f3916.response.data : _0x4f3916.message;
        _0x45ed13.push(_0x1bbd4b);
        if (_0x534bfa === 0x0) _0x849462 = _0x1bbd4b;
      }
    }
    const _0x1b4d4f = _0x179034 > 0x0 ? "success" : 'error';
    let _0x4e11ba = '';
    if (_0xf88051.length > 0x1) {
      _0x4e11ba = 'Đã\x20xử\x20lý\x20' + _0xf88051.length + " mẫu. Thành công: " + _0x179034 + '.';
      if (_0x179034 < _0xf88051.length) {
        const _0x2a5e4a = _0x45ed13.find(_0xae536d => _0xae536d.error !== 0x0);
        if (_0x2a5e4a) _0x4e11ba += " Chi tiết lỗi: " + (_0x2a5e4a.message || JSON.stringify(_0x2a5e4a));
      }
    } else _0x849462.error === 0x0 ? _0x4e11ba = "Gửi Template thành công" : _0x4e11ba = _0x849462.message || JSON.stringify(_0x849462);
    const _0x3429fe = _0xf88051.length > 0x1 ? _0xf88051.map(_0x11a0da => '{' + _0x11a0da + '}').join(',\x20') : _0xf88051[0x0].toString();
    await db.query("INSERT INTO oa_result (order_code, phone_number, template_id, msg_id, result, detail) VALUES (?, ?, ?, ?, ?, ?)", [_0x3efe1b, _0x2b7ce5, _0x3429fe, _0x128a75, _0x1b4d4f, _0x4e11ba]), _0x5994c7.json({
      'success': true,
      'message': "Đã xử lý yêu cầu gửi tin nhắn",
      'result': _0x849462,
      'results': _0x45ed13,
      'payload_sent': {
        'phone': _0x2b7ce5,
        'template_ids': _0xf88051,
        'template_data': _0x136765
      }
    });
  } catch (_0x11148a) {
    console.error("Error sending template:", _0x11148a), _0x5994c7.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi xử lý gửi tin nhắn"
    });
  }
}, exports.sendTemplateUid = async (_0x1830c1, _0x11eb5a) => {
  try {
    let {
      user_id: _0xe30944,
      template_id: _0x23b330,
      custom_params: _0x979e4
    } = _0x1830c1.body;
    if (!_0xe30944 || !_0x23b330) return _0x11eb5a.status(0x190).json({
      'success': false,
      'message': "Thiếu thông tin user_id hoặc template_id"
    });
    const _0x3423f0 = await db.query("SELECT COUNT(*) as count FROM oa_result"),
      _0x15af63 = (_0x3423f0[0x0].count + 0x1).toString().padStart(0x7, '0'),
      _0x3c9c34 = 'BC' + _0x15af63;
    let _0x4c1e7c = {
      ..._0x979e4
    };
    const _0x786856 = new Date(new Date().toLocaleString("en-US", {
        'timeZone': "Asia/Ho_Chi_Minh"
      })),
      _0xdb5de2 = String(_0x786856.getDate()).padStart(0x2, '0'),
      _0x18942e = String(_0x786856.getMonth() + 0x1).padStart(0x2, '0'),
      _0x2eea94 = _0x786856.getFullYear();
    !_0x4c1e7c.date && (_0x4c1e7c.date = _0xdb5de2 + '/' + _0x18942e + '/' + _0x2eea94);
    !_0x4c1e7c.order_code && (_0x4c1e7c.order_code = _0x3c9c34);
    if (!_0x4c1e7c.price) {
      const _0x44fee7 = Math.floor(Math.random() * 0x51) + 0xa;
      _0x4c1e7c.price = _0x44fee7 * 0x2710;
    }
    !_0x4c1e7c.status && (_0x4c1e7c.status = 'Đang\x20xử\x20lý');
    const _0x45390e = await db.query("SELECT * FROM zalo_token ORDER BY id DESC LIMIT 1");
    if (_0x45390e.length === 0x0 || !_0x45390e[0x0].access_token) return _0x11eb5a.status(0x190).json({
      'success': false,
      'error_code': "TOKEN_MISSING",
      'message': "Không tìm thấy Access Token. Vui lòng cập nhật token."
    });
    const _0x44cf8f = _0x45390e[0x0],
      _0x2607ca = new Date();
    if (new Date(_0x44cf8f.expires_at) <= _0x2607ca) return _0x11eb5a.status(0x190).json({
      'success': false,
      'error_code': "TOKEN_EXPIRED",
      'message': "Access Token đã hết hạn. Vui lòng sang tab Quản lý token để lấy token mới."
    });
    const _0x116cd2 = _0x44cf8f.access_token,
      _0x5fe64e = "https://openapi.zalo.me/v3.0/oa/message/template",
      _0x7d89c6 = {
        'Content-Type': "application/json",
        'access_token': _0x116cd2
      };
    let _0x459ea1 = Array.isArray(_0x23b330) ? _0x23b330 : [_0x23b330];
    _0x459ea1.length === 0x2 && _0x459ea1.reverse();
    let _0x698ec6 = 0x0,
      _0x29d1a7 = null,
      _0x297509 = null,
      _0x51ac7e = [];
    for (let _0x2d572e = 0x0; _0x2d572e < _0x459ea1.length; _0x2d572e++) {
      const _0x40fd31 = _0x459ea1[_0x2d572e],
        _0x19e16b = await db.query("SELECT params FROM zalo_template WHERE template_id = ?", [_0x40fd31]);
      let _0x17c03e = {};
      if (_0x19e16b.length > 0x0 && _0x19e16b[0x0].params) {
        const _0xbf9ed6 = _0x19e16b[0x0].params.split(',').map(_0x2710fd => _0x2710fd.trim()).filter(_0x1c8498 => _0x1c8498 !== '');
        _0xbf9ed6.forEach(_0xce93d4 => {
          _0x4c1e7c[_0xce93d4] !== undefined && (_0x17c03e[_0xce93d4] = _0x4c1e7c[_0xce93d4]);
        });
      } else _0x17c03e = _0x4c1e7c;
      const _0x3807b4 = {
        'user_id': _0xe30944,
        'template_id': _0x40fd31,
        'template_data': _0x17c03e
      };
      console.log("[Zalo OA UID] Sending to tid " + _0x40fd31 + ':', JSON.stringify(_0x3807b4, null, 0x2));
      try {
        const _0x32faab = await axios.post(_0x5fe64e, _0x3807b4, {
            'headers': _0x7d89c6
          }),
          _0x108bc2 = _0x32faab.data;
        console.log("[Zalo OA UID] Response for tid " + _0x40fd31 + ':', JSON.stringify(_0x108bc2, null, 0x2)), _0x51ac7e.push(_0x108bc2), _0x2d572e === 0x0 && (_0x297509 = _0x108bc2, _0x108bc2.error === 0x0 && _0x108bc2.data && _0x108bc2.data.msg_id && (_0x29d1a7 = _0x108bc2.data.msg_id)), _0x108bc2.error === 0x0 && _0x698ec6++;
      } catch (_0x4c6786) {
        const _0x3e7fb1 = _0x4c6786.response ? _0x4c6786.response.data : _0x4c6786.message;
        _0x51ac7e.push(_0x3e7fb1);
        if (_0x2d572e === 0x0) _0x297509 = _0x3e7fb1;
      }
    }
    const _0x40bfc8 = _0x698ec6 > 0x0 ? 'success' : "error";
    let _0xe65020 = '';
    if (_0x459ea1.length > 0x1) {
      _0xe65020 = "Đã xử lý " + _0x459ea1.length + " mẫu. Thành công: " + _0x698ec6 + '.';
      if (_0x698ec6 < _0x459ea1.length) {
        const _0x24e5c4 = _0x51ac7e.find(_0x37a7f4 => _0x37a7f4.error !== 0x0);
        if (_0x24e5c4) _0xe65020 += " Chi tiết lỗi: " + (_0x24e5c4.message || JSON.stringify(_0x24e5c4));
      }
    } else _0x297509.error === 0x0 ? _0xe65020 = "Gửi Template thành công" : _0xe65020 = _0x297509.message || JSON.stringify(_0x297509);
    const _0x436808 = _0x459ea1.length > 0x1 ? _0x459ea1.map(_0x21c380 => '{' + _0x21c380 + '}').join(',\x20') : _0x459ea1[0x0].toString();
    await db.query("INSERT INTO oa_result (order_code, phone_number, template_id, msg_id, result, detail) VALUES (?, ?, ?, ?, ?, ?)", [_0x3c9c34, _0xe30944, _0x436808, _0x29d1a7, _0x40bfc8, _0xe65020]), _0x11eb5a.json({
      'success': true,
      'message': "Đã xử lý yêu cầu gửi tin nhắn UID",
      'result': _0x297509,
      'results': _0x51ac7e,
      'payload_sent': {
        'user_id': _0xe30944,
        'template_ids': _0x459ea1,
        'template_data': _0x4c1e7c
      }
    });
  } catch (_0x52222a) {
    console.error("Error sending template UID:", _0x52222a), _0x11eb5a.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi xử lý gửi tin nhắn UID"
    });
  }
}, exports.previewData = async (_0x37287e, _0x462d18) => {
  try {
    const _0xbe32af = await db.query("SELECT COUNT(*) as count FROM oa_result"),
      _0x53c397 = (_0xbe32af[0x0].count + 0x1).toString().padStart(0x7, '0'),
      _0x3759ce = 'BC' + _0x53c397,
      _0x5731c2 = new Date(new Date().toLocaleString('en-US', {
        'timeZone': "Asia/Ho_Chi_Minh"
      })),
      _0x52170e = String(_0x5731c2.getDate()).padStart(0x2, '0'),
      _0x3a2feb = String(_0x5731c2.getMonth() + 0x1).padStart(0x2, '0'),
      _0x54a49 = _0x5731c2.getFullYear(),
      _0x3750f0 = _0x52170e + '/' + _0x3a2feb + '/' + _0x54a49,
      _0x30917e = Math.floor(Math.random() * 0x51) + 0xa,
      _0x5ee9ab = _0x30917e * 0x2710,
      _0x446c67 = 'Đang\x20xử\x20lý';
    _0x462d18.json({
      'success': true,
      'data': {
        'date': _0x3750f0,
        'order_code': _0x3759ce,
        'price': _0x5ee9ab,
        'status': _0x446c67
      }
    });
  } catch (_0x531e8e) {
    console.error("Error preview data:", _0x531e8e), _0x462d18.status(0x1f4).json({
      'success': false,
      'message': "Lỗi lấy dữ liệu preview"
    });
  }
}, exports.getMessageStatus = async (_0x195af6, _0x3bc6b4) => {
  try {
    const {
      message_id: _0x1976c0,
      phone: _0x480dc6,
      id: _0x510329
    } = _0x195af6.query;
    if (!_0x1976c0 || !_0x480dc6 || !_0x510329) return _0x3bc6b4.status(0x190).json({
      'success': false,
      'message': "Thiếu thông tin tra cứu"
    });
    const _0x2d2c07 = await db.query("SELECT * FROM zalo_token ORDER BY id DESC LIMIT 1");
    if (_0x2d2c07.length === 0x0 || !_0x2d2c07[0x0].access_token) return _0x3bc6b4.status(0x190).json({
      'success': false,
      'message': "Thiếu Access Token"
    });
    const _0xdd3d26 = _0x2d2c07[0x0].access_token,
      _0x480053 = "https://business.openapi.zalo.me/message/status?message_id=" + _0x1976c0 + "&phone=" + _0x480dc6,
      _0x2479f6 = await axios.get(_0x480053, {
        'headers': {
          'Content-Type': "application/json",
          'access_token': _0xdd3d26
        }
      }),
      _0xfcc1cd = _0x2479f6.data;
    if (_0xfcc1cd.error === 0x0 && _0xfcc1cd.data) {
      const _0x228eb5 = _0xfcc1cd.data;
      let _0xfb294b = "Trạng thái: " + _0x228eb5.message;
      if (_0x228eb5.delivery_time) {
        const _0x22090e = new Date(parseInt(_0x228eb5.delivery_time)),
          _0x275cc0 = new Date(_0x22090e.toLocaleString('en-US', {
            'timeZone': "Asia/Ho_Chi_Minh"
          }));
        if (!isNaN(_0x275cc0.getTime())) {
          const _0x34df61 = String(_0x275cc0.getHours()).padStart(0x2, '0'),
            _0x20f028 = String(_0x275cc0.getMinutes()).padStart(0x2, '0'),
            _0x54b516 = String(_0x275cc0.getSeconds()).padStart(0x2, '0'),
            _0x4a9306 = String(_0x275cc0.getDate()).padStart(0x2, '0'),
            _0x2b4c86 = String(_0x275cc0.getMonth() + 0x1).padStart(0x2, '0'),
            _0x2bde5b = _0x275cc0.getFullYear();
          _0xfb294b += "<br>Thời gian: " + _0x34df61 + ':' + _0x20f028 + ':' + _0x54b516 + '\x20' + _0x4a9306 + '/' + _0x2b4c86 + '/' + _0x2bde5b;
        }
      }
      return await db.query("UPDATE oa_result SET msg_status = ? WHERE id = ?", [_0xfb294b, _0x510329]), _0x3bc6b4.json({
        'success': true,
        'message': "Cập nhật trạng thái thành công",
        'data': _0xfb294b
      });
    }
    return _0x3bc6b4.status(0x190).json({
      'success': false,
      'message': _0xfcc1cd.message || "Không thể lấy trạng thái",
      'raw': _0xfcc1cd
    });
  } catch (_0x317b3d) {
    console.error("Error updating message status:", _0x317b3d), _0x3bc6b4.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi cập nhật trạng thái"
    });
  }
}, exports.fetchNewTemplates = async (_0x34d343, _0x2708cc) => {
  try {
    const _0x39a282 = await db.query("SELECT * FROM zalo_token ORDER BY id DESC LIMIT 1");
    if (_0x39a282.length === 0x0 || !_0x39a282[0x0].access_token) return _0x2708cc.status(0x190).json({
      'success': false,
      'message': "Thiếu Access Token"
    });
    const _0x9e3851 = _0x39a282[0x0].access_token,
      _0x2ef4f3 = "https://business.openapi.zalo.me/template/all?offset=0&limit=100&status=1&filterPreset=1",
      _0x3db151 = await axios.get(_0x2ef4f3, {
        'headers': {
          'access_token': _0x9e3851
        }
      });
    if (_0x3db151.data.error !== 0x0) return _0x2708cc.status(0x190).json({
      'success': false,
      'message': _0x3db151.data.message
    });
    const _0xc94902 = _0x3db151.data.data || [],
      _0x54156a = await db.query("SELECT template_id FROM zalo_template"),
      _0x22e7a0 = new Set(_0x54156a.map(_0x2db84c => _0x2db84c.template_id.toString())),
      _0x2211fb = _0xc94902.filter(_0x46ed19 => !_0x22e7a0.has(_0x46ed19.templateId.toString()));
    if (_0x2211fb.length === 0x0) return _0x2708cc.json({
      'success': true,
      'data': [],
      'message': "Không tìm thấy template mới nào."
    });
    const _0x4c1d56 = [];
    for (const _0x2d9679 of _0x2211fb) {
      try {
        const _0xee0d34 = "https://business.openapi.zalo.me/template/info/v2?template_id=" + _0x2d9679.templateId,
          _0x28733f = await axios.get(_0xee0d34, {
            'headers': {
              'access_token': _0x9e3851
            }
          });
        if (_0x28733f.data.error === 0x0) {
          const _0x225b42 = _0x28733f.data.data,
            _0x1ccb1e = _0x225b42.listParams ? _0x225b42.listParams.map(_0x26ef92 => _0x26ef92.name).join(',\x20') : '';
          _0x4c1d56.push({
            'template_id': _0x225b42.templateId,
            'template_name': _0x225b42.templateName,
            'params': _0x1ccb1e,
            'detail': ''
          });
        }
      } catch (_0x4aecd6) {
        console.error("Error fetching detail for template " + _0x2d9679.templateId + ':', _0x4aecd6.message);
      }
    }
    _0x2708cc.json({
      'success': true,
      'data': _0x4c1d56
    });
  } catch (_0x2724c5) {
    console.error("Error fetching new templates:", _0x2724c5), _0x2708cc.status(0x1f4).json({
      'success': false,
      'message': "Lỗi khi đồng bộ template"
    });
  }
};
