// Derived analysis copy. Original: recovered/ZL_SERVER/config/database.js
// ════════════════════════════════════════════════════════════════
// DATABASE CONFIG - KẾT NỐI MYSQL (ZL_SERVER)
// ════════════════════════════════════════════════════════════════

const mysql = require('mysql2/promise');
require('dotenv').config({
  path: require('path').join(__dirname, '../../.env')
});

// ════════════════════════════════════════════════════════════════
// TẠO CONNECTION POOL
// ════════════════════════════════════════════════════════════════

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER_ZL_SERVER,
  password: process.env.DB_PASSWORD_ZL_SERVER,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  timezone: '+07:00'
});

// Tự động set timezone cho mỗi kết nối mới (đặc biệt quan trọng với server từ xa)
pool.on('connection', connection => {
  connection.query("SET time_zone = '+07:00'");
});

// ════════════════════════════════════════════════════════════════
// QUERY WRAPPER
// ════════════════════════════════════════════════════════════════

/**
 * Execute SQL query với params
 * @param {string} sql - Câu SQL query
 * @param {Array} params - Parameters cho query
 * @returns {Promise<Array>} Kết quả query
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════════
// TEST CONNECTION
// ════════════════════════════════════════════════════════════════

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [ZL_SERVER] Kết nối database thành công!');
    console.log('   Host:', process.env.DB_HOST);
    console.log('   Database:', process.env.DB_NAME);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [ZL_SERVER] Lỗi kết nối database:', error.message);
    return false;
  }
}

/**
 * Thực thi transaction
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Lấy connection từ pool để thực hiện transaction thủ công
 */
async function getConnection() {
  return await pool.getConnection();
}

// ════════════════════════════════════════════════════════════════
// CLOSE POOL
// ════════════════════════════════════════════════════════════════

async function closePool() {
  try {
    await pool.end();
    console.log('✅ [ZL_SERVER] Đóng kết nối database');
  } catch (error) {
    console.error('❌ [ZL_SERVER] Lỗi đóng connection pool:', error);
  }
}

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════

module.exports = {
  pool,
  query,
  transaction,
  getConnection,
  testConnection,
  closePool
};
