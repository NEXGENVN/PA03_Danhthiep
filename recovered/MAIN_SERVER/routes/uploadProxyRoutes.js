const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

let FILES_SERVER_URL;

if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    FILES_SERVER_URL = 'http://host.docker.internal:' + process.env.FILES_SERVER_PORT;
} else {
    FILES_SERVER_URL = 'http://' + process.env.FILES_SERVER_HOST + ':' + process.env.FILES_SERVER_PORT;
}

// Cấu hình multer lưu file vào memory
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file PNG'), false);
        }
    }
});

router.post('/', upload.single('custom_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh' });
        }

        const userID = req.user?.userID;
        if (!userID) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const uploadUrl = `${FILES_SERVER_URL}/api/upload`;

        // Tạo FormData để truyền file sang FILES_SERVER
        const form = new FormData();
        form.append('custom_image', req.file.buffer, {
            filename: req.file.originalname || 'upload.png',
            contentType: req.file.mimetype,
        });

        // Gửi sang FILES_SERVER
        const response = await axios.post(uploadUrl, form, {
            headers: {
                ...form.getHeaders(),
                'x-user-id': userID // Gửi UID cho FILES_SERVER
            },
            timeout: 10000 // 10s
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Upload Proxy Error:', error.message);

        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, message: 'FILES_SERVER hiện không phản hồi' });
        }

        return res.status(500).json({ success: false, message: 'Lỗi server khi trung chuyển ảnh' });
    }
});

// Bắt lỗi multer giới hạn
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'Kích thước file vượt quá 3MB' });
        }
    } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
});

module.exports = router;

