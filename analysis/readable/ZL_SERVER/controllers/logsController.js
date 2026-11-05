// Derived analysis copy. Original: recovered/ZL_SERVER/controllers/logsController.js
const db = require("../config/database"),
  {
    getUserLogs,
    getSecurityAlerts,
    getLogStats,
    cleanupOldLogs
  } = require("../middleware/apiLogger"),
  getMyLogs = async (_0x4f5dab, _0x1def35) => {
    try {
      const _0x1932dd = _0x4f5dab.user.userID,
        _0x4eb42e = parseInt(_0x4f5dab.query.limit) || 0x32,
        _0x335d1c = parseInt(_0x4f5dab.query.offset) || 0x0,
        _0x438423 = await getUserLogs(_0x1932dd, _0x4eb42e, _0x335d1c);
      _0x1def35.json({
        'success': true,
        'message': "Lấy logs thành công",
        'data': _0x438423
      });
    } catch (_0x42e27c) {
      console.error("Error in getMyLogs:", _0x42e27c), _0x1def35.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi lấy logs",
        'error': process.env.NODE_ENV === "development" ? _0x42e27c.message : undefined
      });
    }
  },
  getMyStats = async (_0x4ed565, _0x2aa8ed) => {
    try {
      const _0x47f7fd = _0x4ed565.user.userID,
        _0xec546d = parseInt(_0x4ed565.query.days) || 0x7,
        _0x22e4bc = await getLogStats(_0x47f7fd, _0xec546d),
        _0x318b3e = _0x22e4bc.reduce((_0x3e0b5c, _0x13ef6a) => {
          return _0x3e0b5c.totalRequests += _0x13ef6a.total_requests || 0x0, _0x3e0b5c.totalSuccess += _0x13ef6a.success_count || 0x0, _0x3e0b5c.totalErrors += _0x13ef6a.error_count || 0x0, _0x3e0b5c;
        }, {
          'totalRequests': 0x0,
          'totalSuccess': 0x0,
          'totalErrors': 0x0
        });
      _0x2aa8ed.json({
        'success': true,
        'message': "Lấy thống kê thành công",
        'data': {
          'stats': _0x22e4bc,
          'summary': _0x318b3e,
          'period': _0xec546d + '\x20days'
        }
      });
    } catch (_0x131a9b) {
      console.error("Error in getMyStats:", _0x131a9b), _0x2aa8ed.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi lấy thống kê",
        'error': process.env.NODE_ENV === "development" ? _0x131a9b.message : undefined
      });
    }
  },
  getAllLogs = async (_0x796d8, _0x9569b5) => {
    try {
      const _0x242dcd = parseInt(_0x796d8.query.limit) || 0x64,
        _0x231aa3 = parseInt(_0x796d8.query.offset) || 0x0,
        _0x3c6b17 = "\n            SELECT * FROM v_api_logs_with_user\n            ORDER BY created_at DESC\n            LIMIT ? OFFSET ?\n        ",
        [_0x3f8c66] = await db.query(_0x3c6b17, [_0x242dcd, _0x231aa3]),
        [_0x19a568] = await db.query("SELECT COUNT(*) as total FROM api_logs");
      _0x9569b5.json({
        'success': true,
        'message': "Lấy logs thành công",
        'data': {
          'logs': _0x3f8c66,
          'total': _0x19a568[0x0].total,
          'limit': _0x242dcd,
          'offset': _0x231aa3
        }
      });
    } catch (_0xf77803) {
      console.error("Error in getAllLogs:", _0xf77803), _0x9569b5.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi lấy logs",
        'error': process.env.NODE_ENV === "development" ? _0xf77803.message : undefined
      });
    }
  },
  getUserLogsById = async (_0x179721, _0x4626c4) => {
    try {
      const _0x10905a = parseInt(_0x179721.params.userID),
        _0x498ef5 = parseInt(_0x179721.query.limit) || 0x32,
        _0xbbe3e7 = parseInt(_0x179721.query.offset) || 0x0,
        _0x27b094 = await getUserLogs(_0x10905a, _0x498ef5, _0xbbe3e7);
      _0x4626c4.json({
        'success': true,
        'message': "Lấy logs thành công",
        'data': _0x27b094
      });
    } catch (_0x3cb937) {
      console.error("Error in getUserLogsById:", _0x3cb937), _0x4626c4.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi lấy logs",
        'error': process.env.NODE_ENV === "development" ? _0x3cb937.message : undefined
      });
    }
  },
  getSecurityAlertsController = async (_0x380cf2, _0x30bc84) => {
    try {
      const _0x14a853 = parseInt(_0x380cf2.query.hours) || 0x18,
        _0x16a0dd = parseInt(_0x380cf2.query.limit) || 0x64,
        _0x307249 = await getSecurityAlerts(_0x14a853, _0x16a0dd),
        _0x1a8c58 = _0x307249.reduce((_0x798316, _0x407476) => {
          const _0x289039 = _0x407476.alert_type || "Unknown";
          return !_0x798316[_0x289039] && (_0x798316[_0x289039] = []), _0x798316[_0x289039].push(_0x407476), _0x798316;
        }, {});
      _0x30bc84.json({
        'success': true,
        'message': "Lấy security alerts thành công",
        'data': {
          'alerts': _0x307249,
          'alertsByType': _0x1a8c58,
          'period': _0x14a853 + " hours",
          'total': _0x307249.length
        }
      });
    } catch (_0x3f937e) {
      console.error("Error in getSecurityAlertsController:", _0x3f937e), _0x30bc84.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi lấy security alerts",
        'error': process.env.NODE_ENV === "development" ? _0x3f937e.message : undefined
      });
    }
  },
  getSystemStats = async (_0xab021b, _0x5a27c7) => {
    try {
      const _0x3cb3d1 = parseInt(_0xab021b.query.days) || 0x7,
        _0x2d5a52 = await getLogStats(null, _0x3cb3d1),
        [_0xd40a4c] = await db.query("\n            SELECT \n                userID,\n                userName,\n                COUNT(*) as request_count,\n                MAX(created_at) as last_request\n            FROM api_logs\n            WHERE userID IS NOT NULL\n            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)\n            GROUP BY userID, userName\n            ORDER BY request_count DESC\n            LIMIT 10\n        ", [_0x3cb3d1]),
        [_0x5d43b5] = await db.query("\n            SELECT \n                ip_address,\n                COUNT(*) as request_count,\n                COUNT(DISTINCT userID) as unique_users,\n                MAX(created_at) as last_request\n            FROM api_logs\n            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)\n            GROUP BY ip_address\n            ORDER BY request_count DESC\n            LIMIT 10\n        ", [_0x3cb3d1]),
        [_0x57066a] = await db.query("\n            SELECT \n                event_type,\n                event_category,\n                COUNT(*) as count\n            FROM api_logs\n            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)\n            GROUP BY event_type, event_category\n            ORDER BY count DESC\n            LIMIT 20\n        ", [_0x3cb3d1]),
        [_0x6259e1] = await db.query("\n            SELECT \n                response_status,\n                COUNT(*) as count\n            FROM api_logs\n            WHERE response_status >= 400\n            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)\n            GROUP BY response_status\n            ORDER BY count DESC\n        ", [_0x3cb3d1]),
        _0x54d405 = _0x2d5a52.reduce((_0x1b0bf1, _0x132526) => {
          return _0x1b0bf1.totalRequests += _0x132526.total_requests || 0x0, _0x1b0bf1.totalSuccess += _0x132526.success_count || 0x0, _0x1b0bf1.totalErrors += _0x132526.error_count || 0x0, _0x1b0bf1.totalRateLimits += _0x132526.rate_limit_count || 0x0, _0x1b0bf1.uniqueUsers += _0x132526.unique_users || 0x0, _0x1b0bf1.uniqueIPs += _0x132526.unique_ips || 0x0, _0x1b0bf1;
        }, {
          'totalRequests': 0x0,
          'totalSuccess': 0x0,
          'totalErrors': 0x0,
          'totalRateLimits': 0x0,
          'uniqueUsers': 0x0,
          'uniqueIPs': 0x0
        }),
        _0x229baf = _0x2d5a52.reduce((_0xbe527d, _0xc93441) => _0xbe527d + (_0xc93441.avg_response_time || 0x0), 0x0) / _0x2d5a52.length;
      _0x54d405.avgResponseTime = Math.round(_0x229baf), _0x5a27c7.json({
        'success': true,
        'message': "Lấy thống kê thành công",
        'data': {
          'stats': _0x2d5a52,
          'summary': _0x54d405,
          'topUsers': _0xd40a4c,
          'topIPs': _0x5d43b5,
          'eventTypes': _0x57066a,
          'errorStats': _0x6259e1,
          'period': _0x3cb3d1 + " days"
        }
      });
    } catch (_0x214692) {
      console.error("Error in getSystemStats:", _0x214692), _0x5a27c7.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi lấy thống kê",
        'error': process.env.NODE_ENV === "development" ? _0x214692.message : undefined
      });
    }
  },
  searchLogs = async (_0x2d4a7c, _0x44e68d) => {
    try {
      const {
        userID: _0x21062c,
        ip_address: _0xb98c9c,
        event_type: _0x5b3368,
        event_category: _0x55efb3,
        status_min: _0x185b9a,
        status_max: _0x2eec54,
        date_from: _0x2baf9f,
        date_to: _0x398fe6,
        limit = 0x64,
        offset = 0x0
      } = _0x2d4a7c.query;
      let _0x177ad2 = "SELECT * FROM v_api_logs_with_user WHERE 1=1";
      const _0x16eda7 = [];
      _0x21062c && (_0x177ad2 += " AND userID = ?", _0x16eda7.push(parseInt(_0x21062c)));
      _0xb98c9c && (_0x177ad2 += " AND ip_address = ?", _0x16eda7.push(_0xb98c9c));
      _0x5b3368 && (_0x177ad2 += " AND event_type = ?", _0x16eda7.push(_0x5b3368));
      _0x55efb3 && (_0x177ad2 += " AND event_category = ?", _0x16eda7.push(_0x55efb3));
      _0x185b9a && (_0x177ad2 += " AND response_status >= ?", _0x16eda7.push(parseInt(_0x185b9a)));
      _0x2eec54 && (_0x177ad2 += " AND response_status <= ?", _0x16eda7.push(parseInt(_0x2eec54)));
      _0x2baf9f && (_0x177ad2 += " AND created_at >= ?", _0x16eda7.push(_0x2baf9f));
      _0x398fe6 && (_0x177ad2 += " AND created_at <= ?", _0x16eda7.push(_0x398fe6));
      _0x177ad2 += " ORDER BY created_at DESC LIMIT ? OFFSET ?", _0x16eda7.push(parseInt(limit), parseInt(offset));
      const [_0x58546f] = await db.query(_0x177ad2, _0x16eda7);
      _0x44e68d.json({
        'success': true,
        'message': "Tìm kiếm thành công",
        'data': {
          'logs': _0x58546f,
          'count': _0x58546f.length,
          'limit': parseInt(limit),
          'offset': parseInt(offset),
          'filters': {
            'userID': _0x21062c,
            'ip_address': _0xb98c9c,
            'event_type': _0x5b3368,
            'event_category': _0x55efb3,
            'status_min': _0x185b9a,
            'status_max': _0x2eec54,
            'date_from': _0x2baf9f,
            'date_to': _0x398fe6
          }
        }
      });
    } catch (_0x2cceac) {
      console.error("Error in searchLogs:", _0x2cceac), _0x44e68d.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi tìm kiếm",
        'error': process.env.NODE_ENV === "development" ? _0x2cceac.message : undefined
      });
    }
  },
  cleanupLogsController = async (_0x172b3, _0x51460c) => {
    try {
      const _0x5a45c9 = parseInt(_0x172b3.query.daysToKeep) || 0x5a,
        _0x5a181e = await cleanupOldLogs(_0x5a45c9);
      _0x51460c.json({
        'success': true,
        'message': "Đã xóa " + _0x5a181e.deletedRows + " logs cũ hơn " + _0x5a45c9 + " ngày",
        'data': _0x5a181e
      });
    } catch (_0x6b16f2) {
      console.error("Error in cleanupLogsController:", _0x6b16f2), _0x51460c.status(0x1f4).json({
        'success': false,
        'message': "Lỗi khi xóa logs",
        'error': process.env.NODE_ENV === "development" ? _0x6b16f2.message : undefined
      });
    }
  };
module.exports = {
  'getMyLogs': getMyLogs,
  'getMyStats': getMyStats,
  'getAllLogs': getAllLogs,
  'getUserLogsById': getUserLogsById,
  'getSecurityAlertsController': getSecurityAlertsController,
  'getSystemStats': getSystemStats,
  'searchLogs': searchLogs,
  'cleanupLogsController': cleanupLogsController
};
