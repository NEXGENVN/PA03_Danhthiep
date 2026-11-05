// Derived analysis copy. Original: recovered/ZL_SERVER/zl_server.js
// ════════════════════════════════════════════════════════════════
// ZL_SERVER - ZALO TOOLS WORKER (INTERNAL ONLY)
// Routes mounted at /zalo/* (not /api/*)
// ════════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
const envResult = require('dotenv').config({
  path: envPath,
  override: true
});
if (envResult.error) {
  console.error(`⚠️ [ZL_SERVER] Không thể load file .env tại: ${envPath}`);
}
const db = require('./config/database');
const {
  ipWhitelistMiddleware
} = require('./middleware/ipWhitelist');
const {
  trustMiddleware
} = require('./middleware/trustMiddleware');
const app = express();
const HOST = process.env.ZL_SERVER_HOST;
const PORT = process.env.ZL_SERVER_PORT;

// ════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ════════════════════════════════════════════════════════════════

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(morgan('dev'));

// IP Whitelist - ONLY accept from localhost
app.use(ipWhitelistMiddleware);

// ════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'ZL_SERVER',
    message: 'Zalo Tools Worker Server is running',
    timestamp: new Date().toISOString()
  });
});

// All Zalo routes under /zalo/* with trust middleware
app.use('/zalo/zalo-accounts', trustMiddleware, require('./routes/zaloAccountRoutes'));
app.use('/zalo/send-image', trustMiddleware, require('./routes/sendImageRoutes'));
app.use('/zalo/send-image-v2', trustMiddleware, require('./routes/sendImageV2Routes'));
app.use('/zalo/send-image-by-card', trustMiddleware, require('./routes/sendImageByCardRoutes'));
app.use('/zalo/check-status', trustMiddleware, require('./routes/checkStatusRoutes'));
app.use('/zalo/licenses', trustMiddleware, require('./routes/licenseRoutes'));
app.use('/zalo/check-ip', trustMiddleware, require('./routes/checkIpRoutes'));
app.use('/zalo/zalo-oa', trustMiddleware, require('./routes/zaloOaRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found on ZL_SERVER'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('ZL_SERVER Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════

async function startServer() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         ZL_SERVER - ZALO TOOLS WORKER (INTERNAL ONLY)         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    console.log('🔌 Đang kết nối database...');
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.error('\n❌ Không thể kết nối database');
      process.exit(1);
    }
    app.listen(PORT, HOST, () => {
      console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
      console.log(`║           ZL_SERVER đang chạy tại http://${HOST}:${PORT}            ║`);
      console.log(`╠════════════════════════════════════════════════════════════════╣`);
      console.log(`║ ⚙️  CẤU HÌNH ĐÃ LOAD TỪ /WEB/.ENV:                              ║`);
      console.log(`║   • ENV PATH              : ${envPath}`);
      console.log(`║   • ZL_SERVER_HOST/PORT   : ${HOST}:${PORT}`);
      console.log(`║   • DB_HOST / DB_PORT     : ${process.env.DB_HOST || 'N/A'}:${process.env.DB_PORT || 'N/A'}`);
      console.log(`║   • DB_NAME / DB_USER     : ${process.env.DB_NAME || 'N/A'} (${process.env.DB_USER_ZL || process.env.DB_USER_MAIN || 'N/A'})`);
      console.log(`║   • INTERNAL_AUTH_KEY     : ${process.env.INTERNAL_AUTH_KEY ? '*****' + process.env.INTERNAL_AUTH_KEY.slice(-4) : 'N/A'}`);
      console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
    });
  } catch (error) {
    console.error('\n❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⏹️  Đang tắt ZL_SERVER...');
  await db.closePool();
  process.exit(0);
});
startServer();
module.exports = app;
