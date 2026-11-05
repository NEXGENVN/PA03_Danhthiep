// ════════════════════════════════════════════════════════════════
// CAPTCHA CONTROLLER - TẠO VÀ XÁC THỰC CAPTCHA
// Mục đích: Chống spam đăng ký và brute force đăng nhập
// ════════════════════════════════════════════════════════════════

const crypto = require('crypto');
const db = require('../config/database');

// ════════════════════════════════════════════════════════════════
// CẤU HÌNH CAPTCHA
// ════════════════════════════════════════════════════════════════

const CAPTCHA_CONFIG = {
    length: 6,                    // Độ dài CAPTCHA (tăng lên 6)
    expiresMinutes: 5,            // Hết hạn sau 5 phút
    failedAttemptsThreshold: 2,   // Số lần đăng nhập sai trước khi yêu cầu CAPTCHA
    checkWindowMinutes: 15,       // Kiểm tra trong khoảng 15 phút gần đây
    
    // ✅ CẤU HÌNH CHẶN IP TẠM THỜI
    ipBlock: {
        maxFailedAttempts: 10,    // Số lần sai tối đa trước khi chặn
        blockDurationMinutes: 15, // Thời gian chặn (phút)
        checkWindowMinutes: 30    // Khoảng thời gian kiểm tra số lần sai
    },
    // ✅ UPGRADE: Bao gồm cả CHỮ HOA và chữ thường - PHÂN BIỆT CASE
    // Loại bỏ các ký tự dễ nhầm: I, l, O, o, 0, 1
    upperCase: 'ABCDEFGHJKMNPQRSTUVWXYZ',  // Bỏ I, L, O
    lowerCase: 'abcdefghjkmnpqrstuvwxyz',  // Bỏ i, l, o
    numbers: '23456789',                     // Bỏ 0, 1
    width: 200,                   // Tăng width để chứa 6 ký tự
    height: 60,                   // Tăng height
    caseSensitive: true,          // ✅ BẬT PHÂN BIỆT CHỮ HOA/THƯỜNG
    
    // ✅ CẤU HÌNH NOISE CHỐNG OCR
    noise: {
        lines: 8,                 // Số đường nhiễu (tăng từ 5)
        curves: 4,                // Số đường cong
        dots: 80,                 // Số chấm nhiễu (tăng từ 30)
        circles: 6,               // Số vòng tròn nhiễu
        bezierCurves: 3,          // Số đường bezier phức tạp
        gridDistortion: true,     // Bật distortion lưới
        waveDistortion: true      // Bật distortion sóng
    }
};

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Tạo random string cho CAPTCHA với cả chữ hoa và thường
 * ✅ UPGRADE: Đảm bảo có mix cả 3 loại ký tự
 */
function generateCaptchaText() {
    const { upperCase, lowerCase, numbers, length } = CAPTCHA_CONFIG;
    const allChars = upperCase + lowerCase + numbers;
    
    let result = '';
    
    // Đảm bảo có ít nhất 1 chữ hoa, 1 chữ thường và 1 số
    result += upperCase.charAt(Math.floor(Math.random() * upperCase.length));
    result += lowerCase.charAt(Math.floor(Math.random() * lowerCase.length));
    result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    
    // Điền các ký tự còn lại ngẫu nhiên
    for (let i = 3; i < length; i++) {
        result += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Xáo trộn thứ tự ký tự
    result = result.split('').sort(() => Math.random() - 0.5).join('');
    
    return result;
}

/**
 * Hash CAPTCHA text để lưu database (không lưu plain text)
 * ✅ UPGRADE: PHÂN BIỆT CHỮ HOA/THƯỜNG - không convert toUpperCase nữa
 */
function hashCaptchaText(text) {
    // Giữ nguyên case - phân biệt chữ hoa và chữ thường
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Tạo UUID cho captcha session
 */
function generateCaptchaID() {
    return crypto.randomUUID();
}

/**
 * Tạo SVG CAPTCHA image với độ nhiễu CAO chống OCR
 * ✅ UPGRADE: Tăng cường độ phức tạp visual
 */
function generateCaptchaSVG(text) {
    const width = CAPTCHA_CONFIG.width;
    const height = CAPTCHA_CONFIG.height;
    const chars = text.split('');
    const noiseConfig = CAPTCHA_CONFIG.noise;
    
    // Random background với gradient phức tạp
    const bgColor1 = `rgb(${235 + Math.random() * 20}, ${235 + Math.random() * 20}, ${235 + Math.random() * 20})`;
    const bgColor2 = `rgb(${245 + Math.random() * 10}, ${240 + Math.random() * 15}, ${250 + Math.random() * 5})`;
    
    // Màu sắc cho text - đa dạng hơn
    const textColors = [
        '#1a237e', '#b71c1c', '#1b5e20', '#e65100', '#4a148c',
        '#006064', '#880e4f', '#33691e', '#bf360c', '#311b92',
        '#0d47a1', '#4a148c', '#1b5e20', '#e65100', '#263238',
        '#37474f', '#455a64', '#512da8', '#7b1fa2', '#c2185b'
    ];
    
    // Font families để làm khó OCR
    const fontFamilies = [
        'Arial', 'Georgia', 'Times New Roman', 'Verdana', 
        'Trebuchet MS', 'Impact', 'Comic Sans MS'
    ];
    
    // ═══════════════════════════════════════════════════════════════
    // GRADIENT BACKGROUND
    // ═══════════════════════════════════════════════════════════════
    const gradientId = `grad_${Math.random().toString(36).substr(2, 9)}`;
    const gradient = `
        <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${bgColor1};stop-opacity:1" />
                <stop offset="50%" style="stop-color:${bgColor2};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${bgColor1};stop-opacity:1" />
            </linearGradient>
        </defs>
    `;
    
    // ═══════════════════════════════════════════════════════════════
    // NOISE LINES - Đường thẳng nhiễu
    // ═══════════════════════════════════════════════════════════════
    let noiseLines = '';
    for (let i = 0; i < noiseConfig.lines; i++) {
        const x1 = Math.random() * width;
        const y1 = Math.random() * height;
        const x2 = Math.random() * width;
        const y2 = Math.random() * height;
        const strokeWidth = 0.5 + Math.random() * 1.5;
        const color = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, ${0.3 + Math.random() * 0.4})`;
        noiseLines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}"/>`;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BEZIER CURVES - Đường cong phức tạp
    // ═══════════════════════════════════════════════════════════════
    let bezierCurves = '';
    for (let i = 0; i < noiseConfig.bezierCurves; i++) {
        const startX = Math.random() * width * 0.3;
        const startY = Math.random() * height;
        const cp1X = width * 0.25 + Math.random() * width * 0.25;
        const cp1Y = Math.random() * height;
        const cp2X = width * 0.5 + Math.random() * width * 0.25;
        const cp2Y = Math.random() * height;
        const endX = width * 0.7 + Math.random() * width * 0.3;
        const endY = Math.random() * height;
        const color = `rgba(${50 + Math.random() * 100}, ${50 + Math.random() * 100}, ${50 + Math.random() * 100}, ${0.2 + Math.random() * 0.3})`;
        bezierCurves += `<path d="M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}" fill="none" stroke="${color}" stroke-width="${1 + Math.random() * 2}"/>`;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // NOISE DOTS - Chấm nhiễu với kích thước đa dạng
    // ═══════════════════════════════════════════════════════════════
    let noiseDots = '';
    for (let i = 0; i < noiseConfig.dots; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const r = 0.5 + Math.random() * 2;
        const color = `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200}, ${0.3 + Math.random() * 0.5})`;
        noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // NOISE CIRCLES - Vòng tròn nhiễu
    // ═══════════════════════════════════════════════════════════════
    let noiseCircles = '';
    for (let i = 0; i < noiseConfig.circles; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const r = 5 + Math.random() * 20;
        const color = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, ${0.1 + Math.random() * 0.15})`;
        noiseCircles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${0.5 + Math.random()}"/>`;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SINE WAVE DISTORTION LINES
    // ═══════════════════════════════════════════════════════════════
    let waveLines = '';
    if (noiseConfig.waveDistortion) {
        for (let i = 0; i < 3; i++) {
            let pathD = `M 0 ${height * (0.3 + i * 0.2)}`;
            const amplitude = 5 + Math.random() * 10;
            const frequency = 0.05 + Math.random() * 0.05;
            const phase = Math.random() * Math.PI * 2;
            
            for (let x = 0; x <= width; x += 2) {
                const y = height * (0.3 + i * 0.2) + Math.sin(x * frequency + phase) * amplitude;
                pathD += ` L ${x} ${y}`;
            }
            
            const color = `rgba(${80 + Math.random() * 80}, ${80 + Math.random() * 80}, ${80 + Math.random() * 80}, ${0.2 + Math.random() * 0.2})`;
            waveLines += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="${0.8 + Math.random() * 1.2}"/>`;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GRID DISTORTION PATTERN
    // ═══════════════════════════════════════════════════════════════
    let gridPattern = '';
    if (noiseConfig.gridDistortion) {
        const gridSize = 15;
        for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
                if (Math.random() > 0.7) {
                    const offsetX = (Math.random() - 0.5) * 3;
                    const offsetY = (Math.random() - 0.5) * 3;
                    const color = `rgba(${100 + Math.random() * 100}, ${100 + Math.random() * 100}, ${100 + Math.random() * 100}, 0.1)`;
                    gridPattern += `<rect x="${x + offsetX}" y="${y + offsetY}" width="${gridSize - 2}" height="${gridSize - 2}" fill="none" stroke="${color}" stroke-width="0.3"/>`;
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // TEXT CHARACTERS với distortion mạnh
    // ═══════════════════════════════════════════════════════════════
    let textElements = '';
    const charWidth = (width - 30) / chars.length;
    
    chars.forEach((char, index) => {
        const x = 15 + index * charWidth + (Math.random() * 8 - 4);
        const y = height / 2 + 5 + (Math.random() * 14 - 7);
        const rotation = Math.random() * 40 - 20;  // -20 to 20 degrees (tăng)
        const fontSize = 22 + Math.random() * 10;  // Font size đa dạng hơn
        const color = textColors[Math.floor(Math.random() * textColors.length)];
        const fontFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
        
        // Thêm skew transform để làm biến dạng thêm
        const skewX = Math.random() * 15 - 7.5;
        const scaleX = 0.85 + Math.random() * 0.3;
        const scaleY = 0.9 + Math.random() * 0.2;
        
        // Font weight ngẫu nhiên
        const fontWeights = ['normal', 'bold', '600', '700', '800'];
        const fontWeight = fontWeights[Math.floor(Math.random() * fontWeights.length)];
        
        // Letter spacing variation
        const letterSpacing = Math.random() * 2 - 1;
        
        textElements += `
            <text 
                x="${x}" 
                y="${y}" 
                font-family="${fontFamily}, sans-serif" 
                font-size="${fontSize}" 
                font-weight="${fontWeight}"
                fill="${color}"
                letter-spacing="${letterSpacing}"
                transform="rotate(${rotation} ${x} ${y}) skewX(${skewX}) scale(${scaleX}, ${scaleY})"
                style="text-shadow: ${Math.random() * 2}px ${Math.random() * 2}px ${Math.random() * 2}px rgba(0,0,0,0.1);"
            >${char}</text>
        `;
        
        // Thêm đường gạch nhẹ qua một số ký tự để làm khó OCR
        if (Math.random() > 0.6) {
            const lineY = y - fontSize * 0.3 + Math.random() * fontSize * 0.6;
            const lineColor = `rgba(${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${0.3 + Math.random() * 0.3})`;
            textElements += `<line x1="${x - 2}" y1="${lineY}" x2="${x + fontSize * 0.6}" y2="${lineY + (Math.random() * 6 - 3)}" stroke="${lineColor}" stroke-width="${0.5 + Math.random() * 1}"/>`;
        }
    });
    
    // ═══════════════════════════════════════════════════════════════
    // OVERLAY CURVES qua text
    // ═══════════════════════════════════════════════════════════════
    let overlayCurves = '';
    for (let i = 0; i < noiseConfig.curves; i++) {
        const curveY1 = height * 0.2 + Math.random() * height * 0.3;
        const curveY2 = height * 0.5 + Math.random() * height * 0.3;
        const cpY = height * 0.3 + Math.random() * height * 0.4;
        const curveColor = `rgba(${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${Math.random() * 100 + 50}, ${0.25 + Math.random() * 0.25})`;
        
        overlayCurves += `
            <path 
                d="M 0 ${curveY1} Q ${width * 0.3 + Math.random() * width * 0.2} ${cpY} ${width * 0.5} ${height * 0.5 + Math.random() * 10} T ${width} ${curveY2}"
                fill="none"
                stroke="${curveColor}"
                stroke-width="${1.5 + Math.random() * 2}"
            />
        `;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // RANDOM POLYGONS
    // ═══════════════════════════════════════════════════════════════
    let randomPolygons = '';
    for (let i = 0; i < 4; i++) {
        const points = [];
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const numPoints = 3 + Math.floor(Math.random() * 3);
        
        for (let j = 0; j < numPoints; j++) {
            const angle = (j / numPoints) * Math.PI * 2;
            const r = 5 + Math.random() * 15;
            points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
        }
        
        const color = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150}, ${0.05 + Math.random() * 0.1})`;
        randomPolygons += `<polygon points="${points.join(' ')}" fill="${color}" stroke="${color}" stroke-width="0.5"/>`;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // COMPILE SVG
    // ═══════════════════════════════════════════════════════════════
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            ${gradient}
            <rect width="100%" height="100%" fill="url(#${gradientId})"/>
            ${gridPattern}
            ${noiseCircles}
            ${randomPolygons}
            ${noiseLines}
            ${waveLines}
            ${bezierCurves}
            ${noiseDots}
            ${textElements}
            ${overlayCurves}
        </svg>
    `.trim().replace(/\s+/g, ' ');
    
    return svg;
}

/**
 * Lấy IP từ request (hỗ trợ proxy)
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.ip ||
           'unknown';
}

// ════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ════════════════════════════════════════════════════════════════

/**
 * Tạo CAPTCHA mới
 * GET /api/captcha/generate?purpose=register|login|admin_login
 */
exports.generateCaptcha = async (req, res) => {
    try {
        const purpose = req.query.purpose || 'login';
        const validPurposes = ['register', 'login', 'admin_login'];
        
        if (!validPurposes.includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: 'Purpose không hợp lệ'
            });
        }
        
        const ip = getClientIP(req);
        const captchaText = generateCaptchaText();
        const captchaID = generateCaptchaID();
        const hashedText = hashCaptchaText(captchaText);
        
        // DEBUG LOG
        console.log('🔐 === CAPTCHA GENERATE DEBUG ===');
        console.log('🔐 Generated text (PLAIN):', captchaText);
        console.log('🔐 Generated hash:', hashedText);
        console.log('🔐 Hash length:', hashedText.length);
        console.log('🔐 CaptchaID:', captchaID);
        console.log('🔐 Purpose:', purpose);
        
        // ✅ FIX: Sử dụng MySQL DATE_ADD thay vì JavaScript Date để tránh timezone mismatch
        await db.query(
            `INSERT INTO captcha_sessions (captchaID, captchaText, ipAddress, purpose, expiresAt)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
            [captchaID, hashedText, ip, purpose, CAPTCHA_CONFIG.expiresMinutes]
        );
        
        // Verify lưu đúng
        const saved = await db.query('SELECT captchaText, expiresAt, NOW() as currentTime FROM captcha_sessions WHERE captchaID = ?', [captchaID]);
        console.log('🔐 Saved in DB:', saved[0]?.captchaText);
        console.log('🔐 Saved length:', saved[0]?.captchaText?.length);
        console.log('🔐 ExpiresAt (MySQL):', saved[0]?.expiresAt);
        console.log('🔐 CurrentTime (MySQL):', saved[0]?.currentTime);
        console.log('🔐 Match after save:', saved[0]?.captchaText === hashedText);
        
        // Tạo SVG image
        const svgImage = generateCaptchaSVG(captchaText);
        const base64Image = Buffer.from(svgImage).toString('base64');
        
        console.log(`🔐 CAPTCHA created: ${captchaID} for ${purpose} from IP ${ip}`);
        
        res.json({
            success: true,
            data: {
                captchaID: captchaID,
                captchaImage: `data:image/svg+xml;base64,${base64Image}`,
                expiresIn: CAPTCHA_CONFIG.expiresMinutes * 60 // seconds
            }
        });
        
    } catch (error) {
        console.error('Generate CAPTCHA Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo CAPTCHA'
        });
    }
};

/**
 * Kiểm tra xem có cần CAPTCHA không dựa trên số lần đăng nhập sai
 * GET /api/captcha/check-required?type=user|admin
 */
exports.checkCaptchaRequired = async (req, res) => {
    try {
        const type = req.query.type || 'user';
        const ip = getClientIP(req);
        const attemptType = type === 'admin' ? 'admin' : 'user';
        
        // Đếm số lần đăng nhập thất bại trong 15 phút gần đây
        const results = await db.query(
            `SELECT COUNT(*) as failedCount 
             FROM login_attempts 
             WHERE ipAddress = ? 
             AND attemptType = ? 
             AND isSuccess = FALSE 
             AND attemptTime > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [ip, attemptType, CAPTCHA_CONFIG.checkWindowMinutes]
        );
        
        const failedCount = results[0]?.failedCount || 0;
        const captchaRequired = failedCount >= CAPTCHA_CONFIG.failedAttemptsThreshold;
        
        console.log(`🔍 CAPTCHA check for IP ${ip} (${attemptType}): ${failedCount} failed attempts, required: ${captchaRequired}`);
        
        res.json({
            success: true,
            data: {
                captchaRequired: captchaRequired,
                failedAttempts: failedCount,
                threshold: CAPTCHA_CONFIG.failedAttemptsThreshold
            }
        });
        
    } catch (error) {
        console.error('Check CAPTCHA Required Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kiểm tra CAPTCHA'
        });
    }
};

/**
 * Xác thực CAPTCHA (internal function - không export như API)
 * @param {string} captchaID - ID của CAPTCHA
 * @param {string} captchaValue - Giá trị người dùng nhập
 * @param {string} ip - IP của người dùng
 * @param {string} purpose - Mục đích sử dụng
 * @returns {Object} { valid: boolean, message: string }
 */
exports.verifyCaptcha = async (captchaID, captchaValue, ip, purpose = 'login') => {
    try {
        console.log('🔍 === CAPTCHA VERIFY DEBUG ===');
        console.log('🔍 Input captchaID:', captchaID);
        console.log('🔍 Input captchaValue:', captchaValue);
        console.log('🔍 Input purpose:', purpose);
        console.log('🔍 Input IP:', ip);
        
        if (!captchaID || !captchaValue) {
            return { valid: false, message: 'Vui lòng nhập mã CAPTCHA' };
        }
        
        // Tìm CAPTCHA session
        const sessions = await db.query(
            `SELECT * FROM captcha_sessions 
             WHERE captchaID = ? 
             AND purpose = ?
             AND isUsed = FALSE
             AND expiresAt > NOW()`,
            [captchaID, purpose]
        );
        
        console.log('🔍 Sessions found:', sessions.length);
        
        if (sessions.length === 0) {
            // Debug: Tìm tất cả session với captchaID này
            const allSessions = await db.query(
                'SELECT captchaID, purpose, isUsed, expiresAt, NOW() as currentTime FROM captcha_sessions WHERE captchaID = ?',
                [captchaID]
            );
            console.log('🔍 All sessions with this ID:', JSON.stringify(allSessions, null, 2));
            return { valid: false, message: 'CAPTCHA không hợp lệ hoặc đã hết hạn' };
        }
        
        const session = sessions[0];
        console.log('🔍 Session found:');
        console.log('   - captchaID:', session.captchaID);
        console.log('   - captchaText (hash in DB):', session.captchaText);
        console.log('   - captchaText length:', session.captchaText ? session.captchaText.length : 0);
        console.log('   - purpose:', session.purpose);
        console.log('   - isUsed:', session.isUsed);
        console.log('   - expiresAt:', session.expiresAt);
        
        // So sánh hash
        const inputHash = hashCaptchaText(captchaValue);
        console.log('🔍 User input (CASE SENSITIVE):', captchaValue);
        console.log('🔍 Input hash:', inputHash);
        console.log('🔍 Input hash length:', inputHash.length);
        console.log('🔍 DB hash:', session.captchaText);
        console.log('🔍 DB hash length:', session.captchaText ? session.captchaText.length : 0);
        console.log('🔍 Hash match:', inputHash === session.captchaText);
        
        if (inputHash !== session.captchaText) {
            console.log('❌ CAPTCHA MISMATCH!');
            console.log('   Expected (DB):', session.captchaText);
            console.log('   Got (input):  ', inputHash);
            return { valid: false, message: 'Mã CAPTCHA không đúng' };
        }
        
        // Đánh dấu đã sử dụng
        await db.query(
            'UPDATE captcha_sessions SET isUsed = TRUE WHERE captchaID = ?',
            [captchaID]
        );
        
        console.log(`✅ CAPTCHA verified: ${captchaID}`);
        return { valid: true, message: 'CAPTCHA hợp lệ' };
        
    } catch (error) {
        console.error('Verify CAPTCHA Error:', error);
        return { valid: false, message: 'Lỗi xác thực CAPTCHA' };
    }
};

/**
 * Ghi nhận login attempt
 * @param {string} ip - IP address
 * @param {string} userName - Username
 * @param {string} attemptType - 'user' hoặc 'admin'
 * @param {boolean} isSuccess - Đăng nhập thành công hay không
 */
exports.recordLoginAttempt = async (ip, userName, attemptType = 'user', isSuccess = false) => {
    try {
        await db.query(
            `INSERT INTO login_attempts (ipAddress, userName, attemptType, isSuccess)
             VALUES (?, ?, ?, ?)`,
            [ip, userName, attemptType, isSuccess]
        );
        
        console.log(`📝 Login attempt recorded: IP=${ip}, user=${userName}, type=${attemptType}, success=${isSuccess}`);
        
    } catch (error) {
        console.error('Record Login Attempt Error:', error);
    }
};

/**
 * Kiểm tra xem IP có cần CAPTCHA không
 * @param {string} ip - IP address
 * @param {string} attemptType - 'user' hoặc 'admin'
 * @returns {boolean}
 */
exports.isCaptchaRequired = async (ip, attemptType = 'user') => {
    try {
        const results = await db.query(
            `SELECT COUNT(*) as failedCount 
             FROM login_attempts 
             WHERE ipAddress = ? 
             AND attemptType = ? 
             AND isSuccess = FALSE 
             AND attemptTime > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [ip, attemptType, CAPTCHA_CONFIG.checkWindowMinutes]
        );
        
        const failedCount = results[0]?.failedCount || 0;
        return failedCount >= CAPTCHA_CONFIG.failedAttemptsThreshold;
        
    } catch (error) {
        console.error('Check CAPTCHA Required Error:', error);
        return false;
    }
};

/**
 * Reset login attempts khi đăng nhập thành công
 * ✅ FIX: Xóa tất cả failed attempts của IP này để reset counter
 * @param {string} ip - IP address
 * @param {string} attemptType - 'user' hoặc 'admin'
 */
exports.resetLoginAttempts = async (ip, attemptType = 'user') => {
    try {
        // ✅ Xóa tất cả các lần đăng nhập thất bại trước đó của IP này
        const deleteResult = await db.query(
            `DELETE FROM login_attempts 
             WHERE ipAddress = ? 
             AND attemptType = ? 
             AND isSuccess = FALSE`,
            [ip, attemptType]
        );
        
        console.log(`✅ Reset login attempts for IP ${ip} (${attemptType}): deleted ${deleteResult.affectedRows || 0} failed attempts`);
        
    } catch (error) {
        console.error('Reset Login Attempts Error:', error);
    }
};

// ════════════════════════════════════════════════════════════════
// IP BLOCK FUNCTIONS - Chặn IP tạm thời sau nhiều lần sai
// ════════════════════════════════════════════════════════════════

/**
 * Kiểm tra IP có đang bị chặn không
 * @param {string} ip - IP address
 * @param {string} blockType - 'login', 'register', hoặc 'both'
 * @returns {Object} { blocked: boolean, remainingSeconds: number, reason: string }
 */
exports.isIPBlocked = async (ip, blockType = 'both') => {
    try {
        const results = await db.query(
            `SELECT 
                blockID,
                ipAddress,
                blockType,
                reason,
                failedAttempts,
                blockedAt,
                expiresAt,
                TIMESTAMPDIFF(SECOND, NOW(), expiresAt) as remainingSeconds
             FROM ip_blocks
             WHERE ipAddress = ?
             AND isActive = TRUE
             AND expiresAt > NOW()
             AND (blockType = ? OR blockType = 'both')
             ORDER BY blockedAt DESC
             LIMIT 1`,
            [ip, blockType]
        );
        
        if (results.length === 0) {
            return { blocked: false };
        }
        
        const block = results[0];
        const remainingMinutes = Math.ceil(block.remainingSeconds / 60);
        
        console.log(`🚫 IP ${ip} is BLOCKED. Remaining: ${remainingMinutes} minutes. Reason: ${block.reason}`);
        
        return {
            blocked: true,
            remainingSeconds: block.remainingSeconds,
            remainingMinutes: remainingMinutes,
            reason: block.reason,
            blockedAt: block.blockedAt,
            expiresAt: block.expiresAt,
            failedAttempts: block.failedAttempts
        };
        
    } catch (error) {
        console.error('Check IP Blocked Error:', error);
        return { blocked: false };
    }
};

/**
 * Chặn IP tạm thời
 * @param {string} ip - IP address
 * @param {string} blockType - 'login', 'register', hoặc 'both'
 * @param {string} reason - Lý do chặn
 * @param {number} failedAttempts - Số lần thất bại
 * @param {number} blockMinutes - Thời gian chặn (phút)
 */
exports.blockIP = async (ip, blockType = 'both', reason = '', failedAttempts = 0, blockMinutes = null) => {
    try {
        const duration = blockMinutes || CAPTCHA_CONFIG.ipBlock.blockDurationMinutes;
        
        // Đánh dấu các block cũ không còn active
        await db.query(
            `UPDATE ip_blocks SET isActive = FALSE WHERE ipAddress = ? AND isActive = TRUE`,
            [ip]
        );
        
        // Tạo block mới
        await db.query(
            `INSERT INTO ip_blocks (ipAddress, blockType, reason, failedAttempts, expiresAt)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
            [ip, blockType, reason, failedAttempts, duration]
        );
        
        console.log(`🚫 IP ${ip} BLOCKED for ${duration} minutes. Reason: ${reason}. Failed attempts: ${failedAttempts}`);
        
        return { success: true, blockMinutes: duration };
        
    } catch (error) {
        console.error('Block IP Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Gỡ chặn IP (manual unblock)
 * @param {string} ip - IP address
 */
exports.unblockIP = async (ip) => {
    try {
        const result = await db.query(
            `UPDATE ip_blocks SET isActive = FALSE WHERE ipAddress = ? AND isActive = TRUE`,
            [ip]
        );
        
        console.log(`✅ IP ${ip} UNBLOCKED. Affected rows: ${result.affectedRows || 0}`);
        
        return { success: true, affectedRows: result.affectedRows || 0 };
        
    } catch (error) {
        console.error('Unblock IP Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Kiểm tra và tự động chặn IP nếu vượt quá số lần sai cho phép
 * Gọi hàm này sau mỗi lần đăng nhập/đăng ký thất bại
 * @param {string} ip - IP address
 * @param {string} attemptType - 'user', 'admin', hoặc 'register'
 * @returns {Object} { shouldBlock: boolean, blocked: boolean, failedCount: number }
 */
exports.checkAndBlockIP = async (ip, attemptType = 'user') => {
    try {
        const { ipBlock } = CAPTCHA_CONFIG;
        
        // Đếm số lần thất bại trong khoảng thời gian
        const results = await db.query(
            `SELECT COUNT(*) as failedCount 
             FROM login_attempts 
             WHERE ipAddress = ? 
             AND isSuccess = FALSE 
             AND attemptTime > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
            [ip, ipBlock.checkWindowMinutes]
        );
        
        const failedCount = results[0]?.failedCount || 0;
        
        console.log(`🔍 IP ${ip}: ${failedCount}/${ipBlock.maxFailedAttempts} failed attempts in last ${ipBlock.checkWindowMinutes} minutes`);
        
        // Nếu vượt quá ngưỡng -> chặn IP
        if (failedCount >= ipBlock.maxFailedAttempts) {
            // Xác định blockType dựa trên attemptType
            let blockType = 'both';
            if (attemptType === 'register') {
                blockType = 'register';
            } else if (attemptType === 'user' || attemptType === 'admin') {
                blockType = 'login';
            }
            
            const reason = `Quá ${ipBlock.maxFailedAttempts} lần ${attemptType === 'register' ? 'đăng ký' : 'đăng nhập'} thất bại trong ${ipBlock.checkWindowMinutes} phút`;
            
            await exports.blockIP(ip, blockType, reason, failedCount, ipBlock.blockDurationMinutes);
            
            // Reset login attempts sau khi block để tránh block liên tục
            await db.query(
                `DELETE FROM login_attempts WHERE ipAddress = ? AND isSuccess = FALSE`,
                [ip]
            );
            
            return {
                shouldBlock: true,
                blocked: true,
                failedCount: failedCount,
                blockDurationMinutes: ipBlock.blockDurationMinutes
            };
        }
        
        return {
            shouldBlock: false,
            blocked: false,
            failedCount: failedCount,
            remainingAttempts: ipBlock.maxFailedAttempts - failedCount
        };
        
    } catch (error) {
        console.error('Check and Block IP Error:', error);
        return { shouldBlock: false, blocked: false, failedCount: 0 };
    }
};

/**
 * Lấy danh sách IP đang bị chặn (cho admin)
 */
exports.getBlockedIPs = async () => {
    try {
        const results = await db.query(
            `SELECT 
                blockID,
                ipAddress,
                blockType,
                reason,
                failedAttempts,
                blockedAt,
                expiresAt,
                TIMESTAMPDIFF(SECOND, NOW(), expiresAt) as remainingSeconds,
                TIMESTAMPDIFF(MINUTE, NOW(), expiresAt) as remainingMinutes
             FROM ip_blocks
             WHERE isActive = TRUE AND expiresAt > NOW()
             ORDER BY blockedAt DESC`
        );
        
        return results;
        
    } catch (error) {
        console.error('Get Blocked IPs Error:', error);
        return [];
    }
};

// Export config cho các module khác sử dụng
exports.CAPTCHA_CONFIG = CAPTCHA_CONFIG;
exports.getClientIP = getClientIP;
