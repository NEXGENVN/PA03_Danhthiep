// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/checkIpController.js
const axios = require("../utils/axiosInstance"),
  cheerio = require('cheerio');
exports.checkIpLocation = async (_0xf7755e, _0x156a25) => {
  try {
    const {
      ip: _0x1ed61c
    } = _0xf7755e.body;
    if (!_0x1ed61c) return _0x156a25.status(0x190).json({
      'success': false,
      'message': "Vui lòng nhập địa chỉ IP"
    });
    const _0x1a5813 = /^(\d{1,3}\.){3}\d{1,3}$/,
      _0x4e5796 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (!_0x1a5813.test(_0x1ed61c) && !_0x4e5796.test(_0x1ed61c)) return _0x156a25.status(0x190).json({
      'success': false,
      'message': "Địa chỉ IP không hợp lệ"
    });
    console.log("[Check IP] Checking IP: " + _0x1ed61c);
    const _0x1054e6 = await axios.post("https://kiemtraip.vn/", "ip=" + encodeURIComponent(_0x1ed61c), {
        'headers': {
          'Content-Type': "application/x-www-form-urlencoded",
          'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
          'Accept': "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          'Origin': "https://kiemtraip.vn",
          'Referer': "https://kiemtraip.vn/",
          'Accept-Language': "vi,en;q=0.9"
        },
        'timeout': 0x2710,
        'maxRedirects': 0x5
      }),
      _0x15cf37 = cheerio.load(_0x1054e6.data),
      _0x1eb4ad = {
        'ip': '',
        'ipType': '',
        'region': '',
        'city': '',
        'country': '',
        'network': '',
        'latitude': '',
        'longitude': ''
      };
    _0x15cf37('p').each((_0x5ccdb5, _0x301a8d) => {
      const _0x5847e0 = _0x15cf37(_0x301a8d).text().trim(),
        _0x4fdd26 = _0x15cf37(_0x301a8d).find("span").first().text().trim();
      if (_0x5847e0.startsWith("Địa chỉ IP:")) _0x1eb4ad.ip = _0x4fdd26;else {
        if (_0x5847e0.startsWith("Loại IP:")) _0x1eb4ad.ipType = _0x4fdd26;else {
          if (_0x5847e0.startsWith('Khu\x20vực:')) _0x1eb4ad.region = _0x4fdd26;else {
            if (_0x5847e0.startsWith('Thành\x20phố:')) _0x1eb4ad.city = _0x4fdd26;else {
              if (_0x5847e0.startsWith("Quốc gia:")) _0x1eb4ad.country = _0x4fdd26;else _0x5847e0.startsWith("Network:") && (_0x1eb4ad.network = _0x4fdd26);
            }
          }
        }
      }
    }), _0x15cf37("code").each((_0x6c98d6, _0x26279c) => {
      const _0x2791a9 = _0x15cf37(_0x26279c).text().trim(),
        _0x15b78e = _0x15cf37(_0x26279c).find("span").first().text().trim();
      if (_0x2791a9.includes("Latitude:")) _0x1eb4ad.latitude = _0x15b78e;else _0x2791a9.includes("Longitude:") && (_0x1eb4ad.longitude = _0x15b78e);
    });
    if (!_0x1eb4ad.ip && !_0x1eb4ad.city && !_0x1eb4ad.country) return console.log("[Check IP] No data found in HTML"), console.log("[Check IP] HTML sample:", _0x1054e6.data.substring(0x0, 0x1f4)), _0x156a25.status(0x194).json({
      'success': false,
      'message': "Không tìm thấy thông tin IP. Có thể IP này không có trong cơ sở dữ liệu."
    });
    console.log("[Check IP] Result:", _0x1eb4ad);
    let _0x4a9882 = null;
    return _0x1eb4ad.latitude && _0x1eb4ad.longitude && (_0x4a9882 = "https://www.google.com/maps?q=" + _0x1eb4ad.latitude + ',' + _0x1eb4ad.longitude + "&hl=vi&z=14&output=embed"), _0x156a25.json({
      'success': true,
      'message': "Lấy thông tin IP thành công",
      'data': {
        ..._0x1eb4ad,
        'mapUrl': _0x4a9882
      },
      'note': "Vị trí này chỉ là vị trí tham khảo dựa trên lịch sử vị trí của nhà cung cấp dịch vụ mạng gần nhất."
    });
  } catch (_0x4a2105) {
    console.error("[Check IP] Error:", _0x4a2105.message);
    if (_0x4a2105.code === "ECONNABORTED") return _0x156a25.status(0x198).json({
      'success': false,
      'message': "Timeout khi kết nối đến dịch vụ kiểm tra IP"
    });
    if (_0x4a2105.response) return _0x156a25.status(_0x4a2105.response.status).json({
      'success': false,
      'message': "Không thể kết nối đến dịch vụ kiểm tra IP"
    });
    return _0x156a25.status(0x1f4).json({
      'success': false,
      'message': "Có lỗi xảy ra khi kiểm tra IP",
      'error': process.env.NODE_ENV === "development" ? _0x4a2105.message : undefined
    });
  }
};
