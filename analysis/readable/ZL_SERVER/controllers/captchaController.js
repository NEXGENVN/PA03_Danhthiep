// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/captchaController.js
const crypto = require("crypto"),
  db = require("../config/database"),
  CAPTCHA_CONFIG = {
    'length': 0x6,
    'expiresMinutes': 0x5,
    'failedAttemptsThreshold': 0x2,
    'checkWindowMinutes': 0xf,
    'ipBlock': {
      'maxFailedAttempts': 0xa,
      'blockDurationMinutes': 0xf,
      'checkWindowMinutes': 0x1e
    },
    'upperCase': "ABCDEFGHJKMNPQRSTUVWXYZ",
    'lowerCase': "abcdefghjkmnpqrstuvwxyz",
    'numbers': "23456789",
    'width': 0xc8,
    'height': 0x3c,
    'caseSensitive': true,
    'noise': {
      'lines': 0x8,
      'curves': 0x4,
      'dots': 0x50,
      'circles': 0x6,
      'bezierCurves': 0x3,
      'gridDistortion': true,
      'waveDistortion': true
    }
  };
function generateCaptchaText() {
  const {
      upperCase: _0x9883f9,
      lowerCase: _0x50e046,
      numbers: _0x2363ea,
      length: _0x2384d8
    } = CAPTCHA_CONFIG,
    _0x20f146 = _0x9883f9 + _0x50e046 + _0x2363ea;
  let _0x101d2d = '';
  _0x101d2d += _0x9883f9.charAt(Math.floor(Math.random() * _0x9883f9.length)), _0x101d2d += _0x50e046.charAt(Math.floor(Math.random() * _0x50e046.length)), _0x101d2d += _0x2363ea.charAt(Math.floor(Math.random() * _0x2363ea.length));
  for (let _0x59fa82 = 0x3; _0x59fa82 < _0x2384d8; _0x59fa82++) {
    _0x101d2d += _0x20f146.charAt(Math.floor(Math.random() * _0x20f146.length));
  }
  return _0x101d2d = _0x101d2d.split('').sort(() => Math.random() - 0.5).join(''), _0x101d2d;
}
function hashCaptchaText(_0x3957a1) {
  return crypto.createHash('sha256').update(_0x3957a1).digest("hex");
}
function generateCaptchaID() {
  return crypto.randomUUID();
}
function generateCaptchaSVG(_0xf3108b) {
  const _0x229fb5 = CAPTCHA_CONFIG.width,
    _0x415ff0 = CAPTCHA_CONFIG.height,
    _0x2a64c7 = _0xf3108b.split(''),
    _0x48b690 = CAPTCHA_CONFIG.noise,
    _0x1b0932 = "rgb(" + (0xeb + Math.random() * 0x14) + ',\x20' + (0xeb + Math.random() * 0x14) + ',\x20' + (0xeb + Math.random() * 0x14) + ')',
    _0x5b99f5 = "rgb(" + (0xf5 + Math.random() * 0xa) + ',\x20' + (0xf0 + Math.random() * 0xf) + ',\x20' + (0xfa + Math.random() * 0x5) + ')',
    _0x328e7c = ["#1a237e", "#b71c1c", "#1b5e20", "#e65100", "#4a148c", "#006064", '#880e4f', "#33691e", "#bf360c", "#311b92", "#0d47a1", '#4a148c', "#1b5e20", "#e65100", "#263238", "#37474f", "#455a64", "#512da8", '#7b1fa2', "#c2185b"],
    _0x30156a = ["Arial", "Georgia", "Times New Roman", 'Verdana', "Trebuchet MS", "Impact", "Comic Sans MS"],
    _0x566ae4 = "grad_" + Math.random().toString(0x24).substr(0x2, 0x9),
    _0xb67358 = "\n        <defs>\n            <linearGradient id=\"" + _0x566ae4 + "\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n                <stop offset=\"0%\" style=\"stop-color:" + _0x1b0932 + ";stop-opacity:1\" />\n                <stop offset=\"50%\" style=\"stop-color:" + _0x5b99f5 + ";stop-opacity:1\" />\n                <stop offset=\"100%\" style=\"stop-color:" + _0x1b0932 + ";stop-opacity:1\" />\n            </linearGradient>\n        </defs>\n    ";
  let _0x3a426 = '';
  for (let _0x1d284d = 0x0; _0x1d284d < _0x48b690.lines; _0x1d284d++) {
    const _0x3a46a5 = Math.random() * _0x229fb5,
      _0x501425 = Math.random() * _0x415ff0,
      _0x4772fb = Math.random() * _0x229fb5,
      _0x5c7237 = Math.random() * _0x415ff0,
      _0x2d770a = 0.5 + Math.random() * 1.5,
      _0x5ea5fd = "rgba(" + Math.random() * 0x96 + ',\x20' + Math.random() * 0x96 + ',\x20' + Math.random() * 0x96 + ',\x20' + (0.3 + Math.random() * 0.4) + ')';
    _0x3a426 += "<line x1=\"" + _0x3a46a5 + "\" y1=\"" + _0x501425 + "\" x2=\"" + _0x4772fb + '\x22\x20y2=\x22' + _0x5c7237 + "\" stroke=\"" + _0x5ea5fd + "\" stroke-width=\"" + _0x2d770a + "\"/>";
  }
  let _0x5a1925 = '';
  for (let _0x18d111 = 0x0; _0x18d111 < _0x48b690.bezierCurves; _0x18d111++) {
    const _0x4eb1aa = Math.random() * _0x229fb5 * 0.3,
      _0x61e9c1 = Math.random() * _0x415ff0,
      _0x55f121 = _0x229fb5 * 0.25 + Math.random() * _0x229fb5 * 0.25,
      _0x13217d = Math.random() * _0x415ff0,
      _0x5e5310 = _0x229fb5 * 0.5 + Math.random() * _0x229fb5 * 0.25,
      _0x501e23 = Math.random() * _0x415ff0,
      _0x23da12 = _0x229fb5 * 0.7 + Math.random() * _0x229fb5 * 0.3,
      _0x2a0b9c = Math.random() * _0x415ff0,
      _0x3d7093 = 'rgba(' + (0x32 + Math.random() * 0x64) + ',\x20' + (0x32 + Math.random() * 0x64) + ',\x20' + (0x32 + Math.random() * 0x64) + ',\x20' + (0.2 + Math.random() * 0.3) + ')';
    _0x5a1925 += "<path d=\"M " + _0x4eb1aa + '\x20' + _0x61e9c1 + " C " + _0x55f121 + '\x20' + _0x13217d + ',\x20' + _0x5e5310 + '\x20' + _0x501e23 + ',\x20' + _0x23da12 + '\x20' + _0x2a0b9c + "\" fill=\"none\" stroke=\"" + _0x3d7093 + "\" stroke-width=\"" + (0x1 + Math.random() * 0x2) + "\"/>";
  }
  let _0xac4540 = '';
  for (let _0x444cb5 = 0x0; _0x444cb5 < _0x48b690.dots; _0x444cb5++) {
    const _0x3768ae = Math.random() * _0x229fb5,
      _0x140909 = Math.random() * _0x415ff0,
      _0x229659 = 0.5 + Math.random() * 0x2,
      _0x795ef7 = "rgba(" + Math.random() * 0xc8 + ',\x20' + Math.random() * 0xc8 + ',\x20' + Math.random() * 0xc8 + ',\x20' + (0.3 + Math.random() * 0.5) + ')';
    _0xac4540 += "<circle cx=\"" + _0x3768ae + "\" cy=\"" + _0x140909 + '\x22\x20r=\x22' + _0x229659 + "\" fill=\"" + _0x795ef7 + "\"/>";
  }
  let _0x2e3122 = '';
  for (let _0x3352f7 = 0x0; _0x3352f7 < _0x48b690.circles; _0x3352f7++) {
    const _0x4ab32c = Math.random() * _0x229fb5,
      _0x1bb42b = Math.random() * _0x415ff0,
      _0x57025e = 0x5 + Math.random() * 0x14,
      _0x1d58ab = "rgba(" + Math.random() * 0x96 + ',\x20' + Math.random() * 0x96 + ',\x20' + Math.random() * 0x96 + ',\x20' + (0.1 + Math.random() * 0.15) + ')';
    _0x2e3122 += "<circle cx=\"" + _0x4ab32c + "\" cy=\"" + _0x1bb42b + "\" r=\"" + _0x57025e + "\" fill=\"none\" stroke=\"" + _0x1d58ab + "\" stroke-width=\"" + (0.5 + Math.random()) + "\"/>";
  }
  let _0x120533 = '';
  if (_0x48b690.waveDistortion) for (let _0x16f4ff = 0x0; _0x16f4ff < 0x3; _0x16f4ff++) {
    let _0x1c39b0 = "M 0 " + _0x415ff0 * (0.3 + _0x16f4ff * 0.2);
    const _0x21e983 = 0x5 + Math.random() * 0xa,
      _0x26f466 = 0.05 + Math.random() * 0.05,
      _0xca3eba = Math.random() * Math.PI * 0x2;
    for (let _0x58877b = 0x0; _0x58877b <= _0x229fb5; _0x58877b += 0x2) {
      const _0x2a40e1 = _0x415ff0 * (0.3 + _0x16f4ff * 0.2) + Math.sin(_0x58877b * _0x26f466 + _0xca3eba) * _0x21e983;
      _0x1c39b0 += " L " + _0x58877b + '\x20' + _0x2a40e1;
    }
    const _0x2f3809 = "rgba(" + (0x50 + Math.random() * 0x50) + ',\x20' + (0x50 + Math.random() * 0x50) + ',\x20' + (0x50 + Math.random() * 0x50) + ',\x20' + (0.2 + Math.random() * 0.2) + ')';
    _0x120533 += "<path d=\"" + _0x1c39b0 + "\" fill=\"none\" stroke=\"" + _0x2f3809 + "\" stroke-width=\"" + (0.8 + Math.random() * 1.2) + "\"/>";
  }
  let _0x26efe8 = '';
  if (_0x48b690.gridDistortion) {
    const _0x504072 = 0xf;
    for (let _0x1e5b20 = 0x0; _0x1e5b20 < _0x229fb5; _0x1e5b20 += _0x504072) {
      for (let _0x57e8c4 = 0x0; _0x57e8c4 < _0x415ff0; _0x57e8c4 += _0x504072) {
        if (Math.random() > 0.7) {
          const _0x117099 = (Math.random() - 0.5) * 0x3,
            _0x21a89a = (Math.random() - 0.5) * 0x3,
            _0x501f36 = "rgba(" + (0x64 + Math.random() * 0x64) + ',\x20' + (0x64 + Math.random() * 0x64) + ',\x20' + (0x64 + Math.random() * 0x64) + ", 0.1)";
          _0x26efe8 += '<rect\x20x=\x22' + (_0x1e5b20 + _0x117099) + "\" y=\"" + (_0x57e8c4 + _0x21a89a) + "\" width=\"" + (_0x504072 - 0x2) + '\x22\x20height=\x22' + (_0x504072 - 0x2) + "\" fill=\"none\" stroke=\"" + _0x501f36 + "\" stroke-width=\"0.3\"/>";
        }
      }
    }
  }
  let _0x57b4d1 = '';
  const _0x36ef43 = (_0x229fb5 - 0x1e) / _0x2a64c7.length;
  _0x2a64c7.forEach((_0x130058, _0x27aad3) => {
    const _0x2c9800 = 0xf + _0x27aad3 * _0x36ef43 + (Math.random() * 0x8 - 0x4),
      _0x4a071e = _0x415ff0 / 0x2 + 0x5 + (Math.random() * 0xe - 0x7),
      _0x3b0829 = Math.random() * 0x28 - 0x14,
      _0x389a2e = 0x16 + Math.random() * 0xa,
      _0x261bb4 = _0x328e7c[Math.floor(Math.random() * _0x328e7c.length)],
      _0x202048 = _0x30156a[Math.floor(Math.random() * _0x30156a.length)],
      _0x249b3a = Math.random() * 0xf - 7.5,
      _0xdb3e15 = 0.85 + Math.random() * 0.3,
      _0x51f101 = 0.9 + Math.random() * 0.2,
      _0x50fd72 = ["normal", "bold", '600', '700', "800"],
      _0x5c7820 = _0x50fd72[Math.floor(Math.random() * _0x50fd72.length)],
      _0x1a21a3 = Math.random() * 0x2 - 0x1;
    _0x57b4d1 += "\n            <text \n                x=\"" + _0x2c9800 + "\" \n                y=\"" + _0x4a071e + "\" \n                font-family=\"" + _0x202048 + ", sans-serif\" \n                font-size=\"" + _0x389a2e + "\" \n                font-weight=\"" + _0x5c7820 + "\"\n                fill=\"" + _0x261bb4 + "\"\n                letter-spacing=\"" + _0x1a21a3 + "\"\n                transform=\"rotate(" + _0x3b0829 + '\x20' + _0x2c9800 + '\x20' + _0x4a071e + ") skewX(" + _0x249b3a + ") scale(" + _0xdb3e15 + ',\x20' + _0x51f101 + ")\"\n                style=\"text-shadow: " + Math.random() * 0x2 + 'px\x20' + Math.random() * 0x2 + "px " + Math.random() * 0x2 + "px rgba(0,0,0,0.1);\"\n            >" + _0x130058 + "</text>\n        ";
    if (Math.random() > 0.6) {
      const _0x188fc7 = _0x4a071e - _0x389a2e * 0.3 + Math.random() * _0x389a2e * 0.6,
        _0x5d3f76 = "rgba(" + (Math.random() * 0x64 + 0x32) + ',\x20' + (Math.random() * 0x64 + 0x32) + ',\x20' + (Math.random() * 0x64 + 0x32) + ',\x20' + (0.3 + Math.random() * 0.3) + ')';
      _0x57b4d1 += "<line x1=\"" + (_0x2c9800 - 0x2) + "\" y1=\"" + _0x188fc7 + "\" x2=\"" + (_0x2c9800 + _0x389a2e * 0.6) + "\" y2=\"" + (_0x188fc7 + (Math.random() * 0x6 - 0x3)) + '\x22\x20stroke=\x22' + _0x5d3f76 + "\" stroke-width=\"" + (0.5 + Math.random() * 0x1) + '\x22/>';
    }
  });
  let _0x130230 = '';
  for (let _0x167de5 = 0x0; _0x167de5 < _0x48b690.curves; _0x167de5++) {
    const _0x27ccae = _0x415ff0 * 0.2 + Math.random() * _0x415ff0 * 0.3,
      _0x5ed91e = _0x415ff0 * 0.5 + Math.random() * _0x415ff0 * 0.3,
      _0x210097 = _0x415ff0 * 0.3 + Math.random() * _0x415ff0 * 0.4,
      _0x252389 = "rgba(" + (Math.random() * 0x64 + 0x32) + ',\x20' + (Math.random() * 0x64 + 0x32) + ',\x20' + (Math.random() * 0x64 + 0x32) + ',\x20' + (0.25 + Math.random() * 0.25) + ')';
    _0x130230 += "\n            <path \n                d=\"M 0 " + _0x27ccae + " Q " + (_0x229fb5 * 0.3 + Math.random() * _0x229fb5 * 0.2) + '\x20' + _0x210097 + '\x20' + _0x229fb5 * 0.5 + '\x20' + (_0x415ff0 * 0.5 + Math.random() * 0xa) + " T " + _0x229fb5 + '\x20' + _0x5ed91e + "\"\n                fill=\"none\"\n                stroke=\"" + _0x252389 + "\"\n                stroke-width=\"" + (1.5 + Math.random() * 0x2) + "\"\n            />\n        ";
  }
  let _0x3143a8 = '';
  for (let _0x422305 = 0x0; _0x422305 < 0x4; _0x422305++) {
    const _0x1a0311 = [],
      _0x2b1472 = Math.random() * _0x229fb5,
      _0x57e4ef = Math.random() * _0x415ff0,
      _0x2630cc = 0x3 + Math.floor(Math.random() * 0x3);
    for (let _0x171083 = 0x0; _0x171083 < _0x2630cc; _0x171083++) {
      const _0x20dd9d = _0x171083 / _0x2630cc * Math.PI * 0x2,
        _0x510169 = 0x5 + Math.random() * 0xf;
      _0x1a0311.push(_0x2b1472 + Math.cos(_0x20dd9d) * _0x510169 + ',' + (_0x57e4ef + Math.sin(_0x20dd9d) * _0x510169));
    }
    const _0x531277 = "rgba(" + Math.random() * 0x96 + ',\x20' + Math.random() * 0x96 + ',\x20' + Math.random() * 0x96 + ',\x20' + (0.05 + Math.random() * 0.1) + ')';
    _0x3143a8 += "<polygon points=\"" + _0x1a0311.join('\x20') + "\" fill=\"" + _0x531277 + "\" stroke=\"" + _0x531277 + "\" stroke-width=\"0.5\"/>";
  }
  const _0x204287 = ("\n        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + _0x229fb5 + "\" height=\"" + _0x415ff0 + "\" viewBox=\"0 0 " + _0x229fb5 + '\x20' + _0x415ff0 + "\">\n            " + _0xb67358 + "\n            <rect width=\"100%\" height=\"100%\" fill=\"url(#" + _0x566ae4 + ")\"/>\n            " + _0x26efe8 + "\n            " + _0x2e3122 + "\n            " + _0x3143a8 + "\n            " + _0x3a426 + "\n            " + _0x120533 + "\n            " + _0x5a1925 + "\n            " + _0xac4540 + "\n            " + _0x57b4d1 + "\n            " + _0x130230 + "\n        </svg>\n    ").trim().replace(/\s+/g, '\x20');
  return _0x204287;
}
function getClientIP(_0x52a2db) {
  return _0x52a2db.headers["x-forwarded-for"]?.["split"](',')[0x0]?.["trim"]() || _0x52a2db.headers["x-real-ip"] || _0x52a2db.connection?.["remoteAddress"] || _0x52a2db.ip || "unknown";
}
exports.generateCaptcha = async (_0xd86d3d, _0x170594) => {
  try {
    const _0x5bd46a = _0xd86d3d.query.purpose || "login",
      _0x291857 = ['register', "login", "admin_login"];
    if (!_0x291857.includes(_0x5bd46a)) return _0x170594.status(0x190).json({
      'success': false,
      'message': "Purpose không hợp lệ"
    });
    const _0x1bc0ca = getClientIP(_0xd86d3d),
      _0x5080a4 = generateCaptchaText(),
      _0x23d23e = generateCaptchaID(),
      _0xdf4361 = hashCaptchaText(_0x5080a4);
    console.log("🔐 === CAPTCHA GENERATE DEBUG ==="), console.log("🔐 Generated text (PLAIN):", _0x5080a4), console.log("🔐 Generated hash:", _0xdf4361), console.log("🔐 Hash length:", _0xdf4361.length), console.log("🔐 CaptchaID:", _0x23d23e), console.log("🔐 Purpose:", _0x5bd46a), await db.query("INSERT INTO captcha_sessions (captchaID, captchaText, ipAddress, purpose, expiresAt)\n             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))", [_0x23d23e, _0xdf4361, _0x1bc0ca, _0x5bd46a, CAPTCHA_CONFIG.expiresMinutes]);
    const _0x40bf51 = await db.query("SELECT captchaText, expiresAt, NOW() as currentTime FROM captcha_sessions WHERE captchaID = ?", [_0x23d23e]);
    console.log("🔐 Saved in DB:", _0x40bf51[0x0]?.["captchaText"]), console.log("🔐 Saved length:", _0x40bf51[0x0]?.["captchaText"]?.['length']), console.log("🔐 ExpiresAt (MySQL):", _0x40bf51[0x0]?.["expiresAt"]), console.log("🔐 CurrentTime (MySQL):", _0x40bf51[0x0]?.["currentTime"]), console.log("🔐 Match after save:", _0x40bf51[0x0]?.["captchaText"] === _0xdf4361);
    const _0x4728e6 = generateCaptchaSVG(_0x5080a4),
      _0x36914a = Buffer.from(_0x4728e6).toString('base64');
    console.log("🔐 CAPTCHA created: " + _0x23d23e + '\x20for\x20' + _0x5bd46a + '\x20from\x20IP\x20' + _0x1bc0ca), _0x170594.json({
      'success': true,
      'data': {
        'captchaID': _0x23d23e,
        'captchaImage': "data:image/svg+xml;base64," + _0x36914a,
        'expiresIn': CAPTCHA_CONFIG.expiresMinutes * 0x3c
      }
    });
  } catch (_0x45f275) {
    console.error("Generate CAPTCHA Error:", _0x45f275), _0x170594.status(0x1f4).json({
      'success': false,
      'message': "Lỗi tạo CAPTCHA"
    });
  }
}, exports.checkCaptchaRequired = async (_0x514026, _0x25995b) => {
  try {
    const _0x5653ab = _0x514026.query.type || "user",
      _0x1c7f2e = getClientIP(_0x514026),
      _0xef1c68 = _0x5653ab === "admin" ? "admin" : "user",
      _0x3c58bc = await db.query("SELECT COUNT(*) as failedCount \n             FROM login_attempts \n             WHERE ipAddress = ? \n             AND attemptType = ? \n             AND isSuccess = FALSE \n             AND attemptTime > DATE_SUB(NOW(), INTERVAL ? MINUTE)", [_0x1c7f2e, _0xef1c68, CAPTCHA_CONFIG.checkWindowMinutes]),
      _0x5c0739 = _0x3c58bc[0x0]?.["failedCount"] || 0x0,
      _0x179fe0 = _0x5c0739 >= CAPTCHA_CONFIG.failedAttemptsThreshold;
    console.log("🔍 CAPTCHA check for IP " + _0x1c7f2e + '\x20(' + _0xef1c68 + '):\x20' + _0x5c0739 + " failed attempts, required: " + _0x179fe0), _0x25995b.json({
      'success': true,
      'data': {
        'captchaRequired': _0x179fe0,
        'failedAttempts': _0x5c0739,
        'threshold': CAPTCHA_CONFIG.failedAttemptsThreshold
      }
    });
  } catch (_0x574350) {
    console.error("Check CAPTCHA Required Error:", _0x574350), _0x25995b.status(0x1f4).json({
      'success': false,
      'message': "Lỗi kiểm tra CAPTCHA"
    });
  }
}, exports.verifyCaptcha = async (_0x53014a, _0x257c16, _0xac099a, _0x4bbee1 = 'login') => {
  try {
    console.log("🔍 === CAPTCHA VERIFY DEBUG ==="), console.log("🔍 Input captchaID:", _0x53014a), console.log("🔍 Input captchaValue:", _0x257c16), console.log("🔍 Input purpose:", _0x4bbee1), console.log("🔍 Input IP:", _0xac099a);
    if (!_0x53014a || !_0x257c16) return {
      'valid': false,
      'message': "Vui lòng nhập mã CAPTCHA"
    };
    const _0x61e3ae = await db.query("SELECT * FROM captcha_sessions \n             WHERE captchaID = ? \n             AND purpose = ?\n             AND isUsed = FALSE\n             AND expiresAt > NOW()", [_0x53014a, _0x4bbee1]);
    console.log("🔍 Sessions found:", _0x61e3ae.length);
    if (_0x61e3ae.length === 0x0) {
      const _0x1094b6 = await db.query("SELECT captchaID, purpose, isUsed, expiresAt, NOW() as currentTime FROM captcha_sessions WHERE captchaID = ?", [_0x53014a]);
      return console.log("🔍 All sessions with this ID:", JSON.stringify(_0x1094b6, null, 0x2)), {
        'valid': false,
        'message': "CAPTCHA không hợp lệ hoặc đã hết hạn"
      };
    }
    const _0x33c225 = _0x61e3ae[0x0];
    console.log("🔍 Session found:"), console.log("   - captchaID:", _0x33c225.captchaID), console.log("   - captchaText (hash in DB):", _0x33c225.captchaText), console.log("   - captchaText length:", _0x33c225.captchaText ? _0x33c225.captchaText.length : 0x0), console.log("   - purpose:", _0x33c225.purpose), console.log("   - isUsed:", _0x33c225.isUsed), console.log("   - expiresAt:", _0x33c225.expiresAt);
    const _0x285c7c = hashCaptchaText(_0x257c16);
    console.log("🔍 User input (CASE SENSITIVE):", _0x257c16), console.log("🔍 Input hash:", _0x285c7c), console.log("🔍 Input hash length:", _0x285c7c.length), console.log("🔍 DB hash:", _0x33c225.captchaText), console.log("🔍 DB hash length:", _0x33c225.captchaText ? _0x33c225.captchaText.length : 0x0), console.log("🔍 Hash match:", _0x285c7c === _0x33c225.captchaText);
    if (_0x285c7c !== _0x33c225.captchaText) return console.log("❌ CAPTCHA MISMATCH!"), console.log("   Expected (DB):", _0x33c225.captchaText), console.log("   Got (input):  ", _0x285c7c), {
      'valid': false,
      'message': "Mã CAPTCHA không đúng"
    };
    return await db.query("UPDATE captcha_sessions SET isUsed = TRUE WHERE captchaID = ?", [_0x53014a]), console.log("✅ CAPTCHA verified: " + _0x53014a), {
      'valid': true,
      'message': "CAPTCHA hợp lệ"
    };
  } catch (_0x2c050d) {
    return console.error("Verify CAPTCHA Error:", _0x2c050d), {
      'valid': false,
      'message': "Lỗi xác thực CAPTCHA"
    };
  }
}, exports.recordLoginAttempt = async (_0x4798d3, _0x5a7d36, _0x18efaa = "user", _0x413847 = false) => {
  try {
    await db.query("INSERT INTO login_attempts (ipAddress, userName, attemptType, isSuccess)\n             VALUES (?, ?, ?, ?)", [_0x4798d3, _0x5a7d36, _0x18efaa, _0x413847]), console.log("📝 Login attempt recorded: IP=" + _0x4798d3 + ", user=" + _0x5a7d36 + ", type=" + _0x18efaa + ", success=" + _0x413847);
  } catch (_0x31e33c) {
    console.error("Record Login Attempt Error:", _0x31e33c);
  }
}, exports.isCaptchaRequired = async (_0x5c386f, _0x1cf22f = "user") => {
  try {
    const _0x4220b5 = await db.query("SELECT COUNT(*) as failedCount \n             FROM login_attempts \n             WHERE ipAddress = ? \n             AND attemptType = ? \n             AND isSuccess = FALSE \n             AND attemptTime > DATE_SUB(NOW(), INTERVAL ? MINUTE)", [_0x5c386f, _0x1cf22f, CAPTCHA_CONFIG.checkWindowMinutes]),
      _0x5904da = _0x4220b5[0x0]?.["failedCount"] || 0x0;
    return _0x5904da >= CAPTCHA_CONFIG.failedAttemptsThreshold;
  } catch (_0x296014) {
    return console.error("Check CAPTCHA Required Error:", _0x296014), false;
  }
}, exports.resetLoginAttempts = async (_0x2dac49, _0x41da1b = "user") => {
  try {
    const _0x1ea660 = await db.query("DELETE FROM login_attempts \n             WHERE ipAddress = ? \n             AND attemptType = ? \n             AND isSuccess = FALSE", [_0x2dac49, _0x41da1b]);
    console.log("✅ Reset login attempts for IP " + _0x2dac49 + '\x20(' + _0x41da1b + "): deleted " + (_0x1ea660.affectedRows || 0x0) + " failed attempts");
  } catch (_0x256f04) {
    console.error("Reset Login Attempts Error:", _0x256f04);
  }
}, exports.isIPBlocked = async (_0xe81931, _0x30766b = "both") => {
  try {
    const _0x7113e2 = await db.query("SELECT \n                blockID,\n                ipAddress,\n                blockType,\n                reason,\n                failedAttempts,\n                blockedAt,\n                expiresAt,\n                TIMESTAMPDIFF(SECOND, NOW(), expiresAt) as remainingSeconds\n             FROM ip_blocks\n             WHERE ipAddress = ?\n             AND isActive = TRUE\n             AND expiresAt > NOW()\n             AND (blockType = ? OR blockType = 'both')\n             ORDER BY blockedAt DESC\n             LIMIT 1", [_0xe81931, _0x30766b]);
    if (_0x7113e2.length === 0x0) return {
      'blocked': false
    };
    const _0x54ba58 = _0x7113e2[0x0],
      _0x28a107 = Math.ceil(_0x54ba58.remainingSeconds / 0x3c);
    return console.log("🚫 IP " + _0xe81931 + " is BLOCKED. Remaining: " + _0x28a107 + " minutes. Reason: " + _0x54ba58.reason), {
      'blocked': true,
      'remainingSeconds': _0x54ba58.remainingSeconds,
      'remainingMinutes': _0x28a107,
      'reason': _0x54ba58.reason,
      'blockedAt': _0x54ba58.blockedAt,
      'expiresAt': _0x54ba58.expiresAt,
      'failedAttempts': _0x54ba58.failedAttempts
    };
  } catch (_0x29bbd2) {
    return console.error("Check IP Blocked Error:", _0x29bbd2), {
      'blocked': false
    };
  }
}, exports.blockIP = async (_0x3d575b, _0x3174e1 = "both", _0x3a742d = '', _0x19d2ce = 0x0, _0x32ac00 = null) => {
  try {
    const _0x2f24f3 = _0x32ac00 || CAPTCHA_CONFIG.ipBlock.blockDurationMinutes;
    return await db.query("UPDATE ip_blocks SET isActive = FALSE WHERE ipAddress = ? AND isActive = TRUE", [_0x3d575b]), await db.query("INSERT INTO ip_blocks (ipAddress, blockType, reason, failedAttempts, expiresAt)\n             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))", [_0x3d575b, _0x3174e1, _0x3a742d, _0x19d2ce, _0x2f24f3]), console.log('🚫\x20IP\x20' + _0x3d575b + " BLOCKED for " + _0x2f24f3 + " minutes. Reason: " + _0x3a742d + ". Failed attempts: " + _0x19d2ce), {
      'success': true,
      'blockMinutes': _0x2f24f3
    };
  } catch (_0x559a17) {
    return console.error("Block IP Error:", _0x559a17), {
      'success': false,
      'error': _0x559a17.message
    };
  }
}, exports.unblockIP = async _0x34f5ec => {
  try {
    const _0x34aeef = await db.query("UPDATE ip_blocks SET isActive = FALSE WHERE ipAddress = ? AND isActive = TRUE", [_0x34f5ec]);
    return console.log("✅ IP " + _0x34f5ec + " UNBLOCKED. Affected rows: " + (_0x34aeef.affectedRows || 0x0)), {
      'success': true,
      'affectedRows': _0x34aeef.affectedRows || 0x0
    };
  } catch (_0x551c1f) {
    return console.error("Unblock IP Error:", _0x551c1f), {
      'success': false,
      'error': _0x551c1f.message
    };
  }
}, exports.checkAndBlockIP = async (_0x1c58f2, _0x56ec96 = "user") => {
  try {
    const {
        ipBlock: _0xefc0ac
      } = CAPTCHA_CONFIG,
      _0x52f518 = await db.query("SELECT COUNT(*) as failedCount \n             FROM login_attempts \n             WHERE ipAddress = ? \n             AND isSuccess = FALSE \n             AND attemptTime > DATE_SUB(NOW(), INTERVAL ? MINUTE)", [_0x1c58f2, _0xefc0ac.checkWindowMinutes]),
      _0x3dc32c = _0x52f518[0x0]?.["failedCount"] || 0x0;
    console.log("🔍 IP " + _0x1c58f2 + ':\x20' + _0x3dc32c + '/' + _0xefc0ac.maxFailedAttempts + " failed attempts in last " + _0xefc0ac.checkWindowMinutes + " minutes");
    if (_0x3dc32c >= _0xefc0ac.maxFailedAttempts) {
      let _0x4cc463 = "both";
      if (_0x56ec96 === "register") _0x4cc463 = "register";else (_0x56ec96 === 'user' || _0x56ec96 === "admin") && (_0x4cc463 = "login");
      const _0x455ab9 = "Quá " + _0xefc0ac.maxFailedAttempts + " lần " + (_0x56ec96 === "register" ? "đăng ký" : "đăng nhập") + " thất bại trong " + _0xefc0ac.checkWindowMinutes + " phút";
      return await exports.blockIP(_0x1c58f2, _0x4cc463, _0x455ab9, _0x3dc32c, _0xefc0ac.blockDurationMinutes), await db.query("DELETE FROM login_attempts WHERE ipAddress = ? AND isSuccess = FALSE", [_0x1c58f2]), {
        'shouldBlock': true,
        'blocked': true,
        'failedCount': _0x3dc32c,
        'blockDurationMinutes': _0xefc0ac.blockDurationMinutes
      };
    }
    return {
      'shouldBlock': false,
      'blocked': false,
      'failedCount': _0x3dc32c,
      'remainingAttempts': _0xefc0ac.maxFailedAttempts - _0x3dc32c
    };
  } catch (_0x4c80b0) {
    return console.error("Check and Block IP Error:", _0x4c80b0), {
      'shouldBlock': false,
      'blocked': false,
      'failedCount': 0x0
    };
  }
}, exports.getBlockedIPs = async () => {
  try {
    const _0x24d6af = await db.query("SELECT \n                blockID,\n                ipAddress,\n                blockType,\n                reason,\n                failedAttempts,\n                blockedAt,\n                expiresAt,\n                TIMESTAMPDIFF(SECOND, NOW(), expiresAt) as remainingSeconds,\n                TIMESTAMPDIFF(MINUTE, NOW(), expiresAt) as remainingMinutes\n             FROM ip_blocks\n             WHERE isActive = TRUE AND expiresAt > NOW()\n             ORDER BY blockedAt DESC");
    return _0x24d6af;
  } catch (_0x40d906) {
    return console.error("Get Blocked IPs Error:", _0x40d906), [];
  }
}, exports.CAPTCHA_CONFIG = CAPTCHA_CONFIG, exports.getClientIP = getClientIP;
