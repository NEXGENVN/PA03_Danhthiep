// ════════════════════════════════════════════════════════════════
// MAIN_SERVER - AUTHENTICATION & ROUTING HUB (PORT 3100)
// ════════════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
const envResult = require('dotenv').config({ path: envPath, override: true });
if (envResult.error) {
    console.error(`⚠️ [MAIN_SERVER] Không thể load file .env tại: ${envPath}`);
}

const db = require('./config/database');
const { authMiddleware, vipOrAdminMiddleware, adminMiddleware } = require('./middleware/auth');
const { csrfProtection, getCsrfToken } = require('./middleware/csrf');
const { apiLogger } = require('./middleware/apiLogger');
const { loginLimiter, globalLimiter } = require('./middleware/rateLimiter');
const adminController = require('./controllers/adminController');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const captchaRoutes = require('./routes/captchaRoutes');
const logsRoutes = require('./routes/logsRoutes');

// ════════════════════════════════════════════════════════════════
// KHỞI TẠO APP
// ════════════════════════════════════════════════════════════════

const app = express();
const PORT = process.env.MAIN_SERVER_PORT;
const DOCKER_HOST = process.env.DOCKER_HOST.trim().toLowerCase() == 'true';
if (DOCKER_HOST) {
    HOST = `0.0.0.0`;
}
else {
    HOST = process.env.MAIN_SERVER_HOST;
}

// ════════════════════════════════════════════════════════════════
// MIDDLEWARE SETTINGS
// ════════════════════════════════════════════════════════════════

// Trust proxy
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Rate Limiting
app.use(globalLimiter);

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ════════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'MAIN_SERVER',
        message: 'Main Authentication & Routing Hub is running',
        timestamp: new Date().toISOString()
    });
});

// Public routes (no auth required)
app.use('/api/auth', authRoutes);
app.use('/api/captcha', captchaRoutes);

// Get CSRF token endpoint (requires auth)
app.get('/api/csrf-token', authMiddleware, getCsrfToken);


// Protected routes - Zalo proxy (requires auth + CSRF + logging)
const authAndLog = [authMiddleware, apiLogger];
const authVipAndLog = [authMiddleware, vipOrAdminMiddleware, apiLogger];
const authAdminAndLog = [authMiddleware, adminMiddleware, apiLogger];

// Each Zalo endpoint mounted separately to match frontend expectations
app.use('/api/zalo-accounts', authAndLog, csrfProtection, require('./routes/zaloAccountProxyRoutes'));
app.use('/api/zalo-oa', authAdminAndLog, csrfProtection, require('./routes/zaloOaProxyRoutes'));
app.use('/api/send-image', authAndLog, csrfProtection, require('./routes/sendImageProxyRoutes'));
app.use('/api/send-image-v2', authVipAndLog, csrfProtection, require('./routes/sendImageV2ProxyRoutes'));
app.use('/api/send-image-by-card', authVipAndLog, csrfProtection, require('./routes/sendImageByCardProxyRoutes'));
app.use('/api/send-image-v2-timer', authVipAndLog, csrfProtection, require('./routes/zaloTimerProxyRoutes'));
app.use('/api/send-image-by-card-timer', authVipAndLog, csrfProtection, require('./routes/zaloTimerProxyRoutes'));
app.use('/api/zalo-timer', authAndLog, csrfProtection, require('./routes/zaloTimerProxyRoutes'));
app.use('/api/zalo/upload-custom-image', authAndLog, csrfProtection, require('./routes/uploadProxyRoutes'));
app.use('/api/check-status', authVipAndLog, csrfProtection, require('./routes/checkStatusProxyRoutes'));
app.use('/api/licenses', authAndLog, csrfProtection, require('./routes/licenseProxyRoutes'));
app.use('/api/check-ip', authAndLog, csrfProtection, require('./routes/checkIpProxyRoutes'));
app.use('/api/leak-lookup', authAdminAndLog, csrfProtection, require('./routes/dataFindProxyRoutes'));
app.use('/api/link', authAdminAndLog, csrfProtection, require('./routes/linkProxyRoutes'));




// Public route - Admin Login (requires rate limiting but no auth/CSRF)
app.post('/api/admin/login', loginLimiter, adminController.adminLogin);

// Protected routes -Admin (requires auth + CSRF + logging)
app.use('/api/admin', authAndLog, csrfProtection, adminRoutes);
app.use('/api/admin', authAndLog, csrfProtection, adminProductRoutes);

// Protected routes - Logs
app.use('/api/logs', authAndLog, csrfProtection, logsRoutes);

// Protected routes - Deposit (proxy to CASH_PAYOS)
app.use('/api/payos', authAndLog, csrfProtection, require('./routes/payosProxyRoutes'));

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint không tồn tại'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err);

    // CSRF error
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            message: 'Invalid CSRF token'
        });
    }

    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS policy violation'
        });
    }

    // Generic error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi server',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ════════════════════════════════════════════════════════════════
// KHỞI ĐỘNG SERVER
// ════════════════════════════════════════════════════════════════

async function startServer() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         MAIN_SERVER - AUTHENTICATION & ROUTING HUB            ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    try {

        // Start server
        app.listen(PORT, HOST, () => {
            console.log(`\n╔════════════════════════════════════════════════════════════════╗`);
            console.log(`║          MAIN_SERVER đang chạy tại http://${HOST}:${PORT}           ║`);
            console.log(`╠════════════════════════════════════════════════════════════════╣`);
            console.log(`║ ⚙️  CẤU HÌNH ĐÃ LOAD TỪ /WEB/.ENV:                              ║`);
            console.log(`║   • ENV PATH                  : ${envPath}`);
            console.log(`║   • MAIN_SERVER_HOST/PORT     : ${HOST}:${PORT}`);
            console.log(`║   • NODE_ENV                  : ${process.env.NODE_ENV || 'N/A'}`);
            console.log(`║   • DB_HOST / DB_PORT         : ${process.env.DB_HOST || 'N/A'}:${process.env.DB_PORT || 'N/A'}`);
            console.log(`║   • DB_NAME / DB_USER_MAIN    : ${process.env.DB_NAME || 'N/A'} (${process.env.DB_USER_MAIN || 'N/A'})`);
            console.log(`║   • INTERNAL_AUTH_KEY         : ${process.env.INTERNAL_AUTH_KEY ? '*****' + process.env.INTERNAL_AUTH_KEY.slice(-4) : 'N/A'}`);
            console.log(`║   • CORS_ORIGIN               : ${process.env.CORS_ORIGIN || 'N/A'}`);
            console.log(`╚════════════════════════════════════════════════════════════════╝\n`);
        });

    } catch (error) {
        console.error('\n❌ Lỗi khởi động server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n⏹️  Đang tắt MAIN_SERVER...');
    await db.closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n⏹️  Đang tắt MAIN_SERVER...');
    await db.closePool();
    process.exit(0);
});

// Start
startServer();

module.exports = app;

