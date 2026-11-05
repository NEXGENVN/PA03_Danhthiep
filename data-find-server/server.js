const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../recovered/.env'), override: true });

const app = express();
app.use(express.json());

const PORT = process.env.DATA_FIND_SERVER_PORT || 3122;
const HOST = process.env.DATA_FIND_SERVER_HOST || '127.0.0.1';
const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;

let pool;

async function initDB() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 13307,
    user: process.env.DB_USER_MAIN || 'pa03_local',
    password: process.env.DB_PASSWORD_MAIN,
    database: process.env.DB_NAME || 'pa03_local',
    waitForConnections: true,
    connectionLimit: 5
  });
  await pool.execute(`CREATE TABLE IF NOT EXISTS leak_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userID INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    searchValue VARCHAR(255) NOT NULL,
    resultsData JSON,
    resultsCount INT DEFAULT 0,
    fee DECIMAL(15,2) DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('✅ Database connected & leak_history table ready');
}

function authMiddleware(req, res, next) {
  const key = req.headers['x-internal-auth'];
  if (key !== INTERNAL_AUTH_KEY) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
}

app.use(authMiddleware);

async function getToolSetupFee() {
  const [rows] = await pool.query('SELECT check_data_leak_money FROM tool_setup WHERE STT = 1');
  return rows.length > 0 ? parseFloat(rows[0].check_data_leak_money) || 5000 : 5000;
}

// POST /api/search - Search by phone/email
app.post('/api/search', async (req, res) => {
  try {
    const { type, value, userID } = req.body;
    if (!type || !value) return res.status(400).json({ success: false, message: 'Thiếu thông tin tra cứu' });
    const results = await performSearch(type, value, userID);
    res.json({ success: true, data: { results, total: results.length } });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/pre-check
app.post('/api/pre-check', async (req, res) => {
  try {
    const { userID } = req.body;
    const fee = await getToolSetupFee();
    const [userRows] = await pool.query('SELECT totalMoney FROM user WHERE userID = ?', [userID]);
    const balance = userRows.length > 0 ? parseFloat(userRows[0].totalMoney) : 0;
    res.json({ success: true, data: { fee, currentBalance: balance } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/confirm
app.post('/api/confirm', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { type, value, userID } = req.body;
    if (!type || !value || !userID) return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
    await conn.beginTransaction();
    const fee = await getToolSetupFee();
    const [userRows] = await conn.query('SELECT totalMoney FROM user WHERE userID = ? FOR UPDATE', [userID]);
    if (userRows.length === 0) { await conn.rollback(); return res.status(404).json({ success: false, message: 'User not found' }); }
    const balance = parseFloat(userRows[0].totalMoney);
    if (balance < fee) { await conn.rollback(); return res.status(400).json({ success: false, message: `Số dư không đủ. Cần ${fee.toLocaleString('vi-VN')}đ` }); }
    const results = await performSearch(type, value, userID);
    const charged = results.length > 0 ? fee : 0;
    if (charged > 0) {
      await conn.query('UPDATE user SET totalMoney = totalMoney - ? WHERE userID = ?', [charged, userID]);
    }
    const [insertResult] = await conn.query(
      'INSERT INTO leak_history (userID, type, searchValue, resultsData, resultsCount, fee) VALUES (?, ?, ?, ?, ?, ?)',
      [userID, type, value, JSON.stringify(results), results.length, charged]
    );
    await conn.commit();
    const newBalance = balance - charged;
    res.json({ success: true, results, charged: charged > 0, fee: charged, newBalance, total: results.length, id: insertResult.insertId });
  } catch (err) {
    await conn.rollback();
    console.error('Confirm error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  } finally { conn.release(); }
});

// GET /api/history/:userID
app.get('/api/history/:userID', async (req, res) => {
  try {
    const userID = parseInt(req.params.userID);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM leak_history WHERE userID = ?', [userID]);
    const total = countRows[0].total;
    const [rows] = await pool.query('SELECT * FROM leak_history WHERE userID = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?', [userID, limit, offset]);
    const data = rows.map(r => ({ id: r.id, userID: r.userID, type: r.type, searchValue: r.searchValue, resultsData: typeof r.resultsData === 'string' ? JSON.parse(r.resultsData) : r.resultsData, resultsCount: r.resultsCount, fee: parseFloat(r.fee), createdAt: r.createdAt }));
    res.json({ success: true, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/history
app.get('/api/admin/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM leak_history');
    const total = countRows[0].total;
    const [rows] = await pool.query('SELECT * FROM leak_history ORDER BY createdAt DESC LIMIT ? OFFSET ?', [limit, offset]);
    const [revenueRows] = await pool.query('SELECT COALESCE(SUM(fee), 0) as total FROM leak_history');
    const totalRevenue = parseFloat(revenueRows[0].total);
    const data = rows.map(r => ({ id: r.id, userID: r.userID, type: r.type, searchValue: r.searchValue, resultsData: typeof r.resultsData === 'string' ? JSON.parse(r.resultsData) : r.resultsData, resultsCount: r.resultsCount, fee: parseFloat(r.fee), createdAt: r.createdAt }));
    res.json({ success: true, data, totalRevenue, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

async function performSearch(type, value, userID) {
  if (type === 'phone') {
    let phone = value.replace(/[\s\-]/g, '');
    if (phone.startsWith('0')) phone = '84' + phone.substring(1);
    if (phone.startsWith('+84')) phone = phone.substring(1);
    const results = [];
    const [zaloAccRows] = await pool.query('SELECT za.UID, za.displayName, za.phoneNumber FROM zalo_account za INNER JOIN user_link_zalo_account ulza ON za.UID = ulza.UID WHERE ulza.userID = ? AND za.accStatus = "Đang hoạt động" LIMIT 1', [userID]);
    if (zaloAccRows.length > 0) {
      const CryptoJS = require('crypto-js');
      const axios = require('axios');
      const [accRows] = await pool.query('SELECT * FROM zalo_account WHERE UID = ?', [zaloAccRows[0].UID]);
      if (accRows.length > 0) {
        const acc = accRows[0];
        const reqData = { phone: phone, avatar_size: 240, language: 'vi', imei: acc.IMEI, reqSrc: 85 };
        const key = CryptoJS.enc.Base64.parse(acc.ENCRYPTION_KEY);
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(reqData), key, { iv: CryptoJS.enc.Hex.parse('00000000000000000000000000000000'), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        const params = encodeURIComponent(encrypted.ciphertext.toString(CryptoJS.enc.Base64));
        try {
          const response = await axios.get(`https://tt-friend-wpa.chat.zalo.me/api/friend/profile/get?zpw_ver=670&zpw_type=30&params=${params}`, {
            headers: { Host: 'tt-friend-wpa.chat.zalo.me', Cookie: 'zpw_sek=' + acc.COOKIE_ZPW_SEK, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json', Origin: 'https://chat.zalo.me', Referer: 'https://chat.zalo.me/' },
            decompress: true, timeout: 10000
          });
          if (response.data.error_code === 0 && response.data.data) {
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(response.data.data), salt: '' }, key, { iv: CryptoJS.enc.Hex.parse('00000000000000000000000000000000'), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
            const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
            if (data.error_code === 0 && data.data && data.data.uid) {
              results.push({ source: 'Zalo', uid: data.data.uid, displayName: data.data.display_name || data.data.zalo_name, phoneNumber: phone, avatar: data.data.avatar });
            }
          }
        } catch (e) { console.error('Zalo search error:', e.message); }
      }
    }
    if (results.length === 0) {
      results.push({ source: 'Không tìm thấy', phone: phone, note: 'Số này không có trong dữ liệu rò rỉ hoặc không đăng ký Zalo' });
    }
    return results;
  }
  if (type === 'email') {
    return [{ source: 'LeakDB', email: value, note: 'Email này chưa xuất hiện trong các vụ rò rỉ dữ liệu đã biết' }];
  }
  if (type === 'facebook') {
    return [{ source: 'Facebook', uid: value, note: 'Không tìm thấy dữ liệu rò rỉ liên quan đến UID Facebook này' }];
  }
  return [];
}

async function start() {
  await initDB();
  app.listen(PORT, HOST, () => {
    console.log(`\n╔════════════════════════════════════════════════════╗`);
    console.log(`║   DATA_FIND_SERVER running at http://${HOST}:${PORT}   ║`);
    console.log(`╚════════════════════════════════════════════════════╝\n`);
  });
}

process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
start();
