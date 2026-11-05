// Derived analysis copy. Original: recovered/ZL_SERVER/routes/facebookToolsRoutes.js
/**
 * ════════════════════════════════════════════════════════════════
 * FACEBOOK TOOLS ROUTES
 * Proxy/middleware cho FB_SERVER API với user linking
 * ════════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/database');

// FB_SERVER Configuration
const FB_SERVER_BASE_URL = process.env.FB_SERVER_URL || 'http://127.0.0.1:3110';

/**
 * ════════════════════════════════════════════════════════════════
 * ACCOUNT MANAGEMENT
 * ════════════════════════════════════════════════════════════════
 */

/**
 * POST /api/facebook/accounts
 * Thêm Facebook account và tạo link với user
 */
router.post('/accounts', async (req, res) => {
  try {
    const userID = req.user.userID; // Từ authMiddleware
    const {
      cookie
    } = req.body;
    if (!cookie) {
      return res.status(400).json({
        success: false,
        message: 'Cookie là bắt buộc'
      });
    }

    // Call FB_SERVER API để add account
    const response = await axios.post(`${FB_SERVER_BASE_URL}/api/accounts`, {
      cookie
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://127.0.0.1:3100',
        // Giả lập origin từ frontend
        'x-internal-auth': process.env.INTERNAL_AUTH_KEY || 'Kh0aBaoMatNoiBoFBAUTOTOOL2026SECURE'
      }
    });
    if (response.status !== 201) {
      throw new Error('FB_SERVER failed to add account');
    }
    const fbAccount = response.data;
    const fb_userID = fbAccount.userID;

    // Tạo link trong bảng user_link_fb_account
    await db.query(`INSERT IGNORE INTO user_link_fb_account (userID, fb_userID) VALUES (?, ?)`, [userID, fb_userID]);
    res.status(201).json({
      success: true,
      message: 'Thêm tài khoản Facebook thành công',
      data: fbAccount
    });
  } catch (error) {
    console.error('Error adding FB account:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error || 'Lỗi từ FB_SERVER'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm tài khoản Facebook'
    });
  }
});

/**
 * GET /api/facebook/accounts
 * Lấy danh sách FB accounts của user hiện tại
 */
router.get('/accounts', async (req, res) => {
  try {
    const userID = req.user.userID;

    // Lấy danh sách fb_userID của user
    const links = await db.query(`SELECT fb_userID FROM user_link_fb_account WHERE userID = ?`, [userID]);
    if (links.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    const fb_userIDs = links.map(link => link.fb_userID);

    // Lấy chi tiết từ FB_SERVER
    const accountsPromises = fb_userIDs.map(fb_userID => axios.get(`${FB_SERVER_BASE_URL}/api/accounts/${fb_userID}`, {
      headers: {
        'x-internal-auth': process.env.INTERNAL_AUTH_KEY || 'Kh0aBaoMatNoiBoFBAUTOTOOL2026SECURE'
      }
    }));
    const accountsResponses = await Promise.allSettled(accountsPromises);
    const accounts = accountsResponses.filter(result => result.status === 'fulfilled').map(result => result.value.data);
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error getting FB accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tài khoản'
    });
  }
});

/**
 * DELETE /api/facebook/accounts/:fb_userID
 * Xóa FB account (xóa link, không xóa trong FB_SERVER)
 */
router.delete('/accounts/:fb_userID', async (req, res) => {
  try {
    const userID = req.user.userID;
    const {
      fb_userID
    } = req.params;

    // Xóa link (CASCADE sẽ tự động xóa khi FB_SERVER xóa account)
    const result = await db.query(`DELETE FROM user_link_fb_account WHERE userID = ? AND fb_userID = ?`, [userID, fb_userID]);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản'
      });
    }
    res.json({
      success: true,
      message: 'Xóa liên kết tài khoản thành công'
    });
  } catch (error) {
    console.error('Error deleting FB account link:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa tài khoản'
    });
  }
});

/**
 * ════════════════════════════════════════════════════════════════
 * POST SCRAPING
 * ════════════════════════════════════════════════════════════════
 */

/**
 * POST /api/facebook/scrape
 * Bắt đầu quét bài viết và tạo link với user
 */
router.post('/scrape', async (req, res) => {
  try {
    const userID = req.user.userID;
    const {
      fb_userID,
      groupID,
      textFilter,
      actorFilter,
      timeFilter,
      maxPost
    } = req.body;
    if (!fb_userID || !groupID) {
      return res.status(400).json({
        success: false,
        message: 'fb_userID và groupID là bắt buộc'
      });
    }

    // Kiểm tra user có quyền sử dụng fb_userID này không
    const hasAccess = await db.query(`SELECT 1 FROM user_link_fb_account WHERE userID = ? AND fb_userID = ?`, [userID, fb_userID]);
    if (hasAccess.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sử dụng tài khoản Facebook này'
      });
    }

    // Call FB_SERVER API để start scraping
    const response = await axios.post(`${FB_SERVER_BASE_URL}/api/scrape`, {
      userID: fb_userID,
      groupID,
      textFilter: textFilter || '',
      actorFilter: actorFilter || '',
      timeFilter: timeFilter || {},
      maxPost: maxPost || 100
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://127.0.0.1:3100',
        'x-internal-auth': process.env.INTERNAL_AUTH_KEY || 'Kh0aBaoMatNoiBoFBAUTOTOOL2026SECURE'
      }
    });
    if (response.status !== 201) {
      throw new Error('FB_SERVER failed to start scraping');
    }
    const {
      requestID
    } = response.data;

    // Tạo link trong bảng user_link_fb_post_scraped
    await db.query(`INSERT IGNORE INTO user_link_fb_post_scraped (userID, requestID) VALUES (?, ?)`, [userID, requestID]);
    res.status(201).json({
      success: true,
      message: 'Bắt đầu quét bài viết thành công',
      data: {
        requestID
      }
    });
  } catch (error) {
    console.error('Error starting scrape:', error);
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.error || 'Lỗi từ FB_SERVER'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi bắt đầu quét bài viết'
    });
  }
});

/**
 * GET /api/facebook/scrape/results
 * Lấy danh sách tất cả scraping results của user
 */
router.get('/scrape/results', async (req, res) => {
  try {
    const userID = req.user.userID;

    // Lấy danh sách requestID của user
    const links = await db.query(`SELECT requestID FROM user_link_fb_post_scraped WHERE userID = ? ORDER BY createdAt DESC`, [userID]);
    if (links.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    const requestIDs = links.map(link => link.requestID);

    // Lấy chi tiết từ FB_SERVER
    const resultsPromises = requestIDs.map(requestID => axios.get(`${FB_SERVER_BASE_URL}/api/scrape/${requestID}`, {
      headers: {
        'x-internal-auth': process.env.INTERNAL_AUTH_KEY || 'Kh0aBaoMatNoiBoFBAUTOTOOL2026SECURE'
      }
    }));
    const resultsResponses = await Promise.allSettled(resultsPromises);
    const results = resultsResponses.filter(result => result.status === 'fulfilled').map(result => result.value.data);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error getting scrape results:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy kết quả quét'
    });
  }
});

/**
 * GET /api/facebook/scrape/:requestID
 * Lấy chi tiết 1 scraping result
 */
router.get('/scrape/:requestID', async (req, res) => {
  try {
    const userID = req.user.userID;
    const {
      requestID
    } = req.params;

    // Kiểm tra quyền truy cập
    const hasAccess = await db.query(`SELECT 1 FROM user_link_fb_post_scraped WHERE userID = ? AND requestID = ?`, [userID, requestID]);
    if (hasAccess.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem kết quả này'
      });
    }

    // Lấy từ FB_SERVER
    const response = await axios.get(`${FB_SERVER_BASE_URL}/api/scrape/${requestID}`, {
      headers: {
        'x-internal-auth': process.env.INTERNAL_AUTH_KEY || 'Kh0aBaoMatNoiBoFBAUTOTOOL2026SECURE'
      }
    });
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Error getting scrape result:', error);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kết quả quét'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy kết quả quét'
    });
  }
});
module.exports = router;
