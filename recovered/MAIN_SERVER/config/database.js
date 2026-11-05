// ════════════════════════════════════════════════════════════════
// DATABASE CONFIG - KẾT NỐI MYSQL
// ════════════════════════════════════════════════════════════════

const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
// ════════════════════════════════════════════════════════════════
// TẠO CONNECTION POOL
// ════════════════════════════════════════════════════════════════

let HOST;
if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    HOST = 'host.docker.internal';
}
else {
    HOST = process.env.DB_HOST;
}
const pool = mysql.createPool({
    host: HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER_MAIN,
    password: process.env.DB_PASSWORD_MAIN,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: 'utf8mb4'
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
        console.log('✅ Kết nối database thành công!');
        console.log('   Host:', process.env.DB_HOST);
        console.log('   Database:', process.env.DB_NAME);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Lỗi kết nối database:', error.message);
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
 * ✅ Thêm hàm này để hỗ trợ Transaction Lock
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
        console.log('✅ Đóng kết nối database');
    } catch (error) {
        console.error('❌ Lỗi đóng connection pool:', error);
    }
}

// ════════════════════════════════════════════════════════════════
// INIT FB_SETUP TABLE
// ════════════════════════════════════════════════════════════════

/**
 * Tạo bảng fb_setup nếu chưa có và seed dòng mặc định
 */
async function initFbSetup() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS fb_setup (
                id INT AUTO_INCREMENT PRIMARY KEY,
                group_scan_price DECIMAL(15,2) DEFAULT 0.00,
                member_scan_price DECIMAL(15,2) DEFAULT 0.00,
                post_scan_price DECIMAL(15,2) DEFAULT 0.00,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Seed dòng mặc định nếu bảng trống
        const rows = await query('SELECT COUNT(*) as cnt FROM fb_setup');
        if (rows[0].cnt === 0) {
            await query('INSERT INTO fb_setup (group_scan_price, member_scan_price, post_scan_price) VALUES (0, 0, 0)');
        }
        console.log('✅ Bảng fb_setup đã được khởi tạo');
    } catch (error) {
        console.error('❌ Lỗi khởi tạo bảng fb_setup:', error.message);
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
    closePool,
    initFbSetup
};
