const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let LINK_SERVER_URL;
const INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;

if (process.env.DOCKER_HOST && process.env.DOCKER_HOST.trim().toLowerCase() === 'true') {
    LINK_SERVER_URL = 'http://host.docker.internal:' + (process.env.LINK_SERVER_PORT || 3130);
} else {
    LINK_SERVER_URL = 'http://' + (process.env.LINK_SERVER_HOST || '127.0.0.1') + ':' + (process.env.LINK_SERVER_PORT || 3130);
}

/**
 * Generic Proxy Handler for LINK_SERVER
 */
async function proxyToLinkServer(req, res, targetPath) {
    try {
        const url = `${LINK_SERVER_URL}/api${targetPath}`;
        const response = await axios({
            method: req.method,
            url: url,
            params: req.query,
            data: req.body,
            timeout: 15000,
            headers: {
                'x-internal-auth': INTERNAL_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[LINK PROXY ERROR] ${req.method} ${targetPath}:`, error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, message: 'Máy chủ LINK_SERVER (127.0.0.1:3130) hiện không hoạt động' });
        }
        return res.status(500).json({ success: false, message: 'Lỗi proxy LINK_SERVER' });
    }
}

// 1. Fetch web metadata (title & thumbnail)
router.post('/fetch-meta', (req, res) => proxyToLinkServer(req, res, '/fetch-meta'));

// 2. Templates (CRUD)
router.get('/templates', (req, res) => proxyToLinkServer(req, res, '/templates'));
router.post('/templates', (req, res) => proxyToLinkServer(req, res, '/templates'));
router.put('/templates/:id', (req, res) => proxyToLinkServer(req, res, `/templates/${req.params.id}`));
router.delete('/templates/:id', (req, res) => proxyToLinkServer(req, res, `/templates/${req.params.id}`));

// 2b. Domains (CRUD)
router.get('/domains', (req, res) => proxyToLinkServer(req, res, '/domains'));
router.post('/domains', (req, res) => proxyToLinkServer(req, res, '/domains'));
router.put('/domains/:id', (req, res) => proxyToLinkServer(req, res, `/domains/${req.params.id}`));
router.delete('/domains/:id', (req, res) => proxyToLinkServer(req, res, `/domains/${req.params.id}`));

// 3. Links (GET, POST, PUT)
router.get('/links', (req, res) => proxyToLinkServer(req, res, '/links'));
router.post('/links', (req, res) => proxyToLinkServer(req, res, '/links'));
router.put('/links/:id', (req, res) => proxyToLinkServer(req, res, `/links/${req.params.id}`));

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const FormData = require('form-data');

// Upload custom thumbnail route
router.post('/upload-thumbnail', upload.single('thumbnail'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh thumbnail' });
        }

        const form = new FormData();
        form.append('thumbnail', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        if (req.body && req.body.template_id) {
            form.append('template_id', req.body.template_id);
        }

        const response = await axios.post(`${LINK_SERVER_URL}/api/upload-custom-thumbnail`, form, {
            headers: {
                ...form.getHeaders(),
                'x-internal-auth': INTERNAL_AUTH_KEY
            },
            timeout: 15000
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error('[LINK PROXY UPLOAD ERROR]:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ success: false, message: 'Lỗi proxy upload thumbnail: ' + error.message });
    }
});

// 4. Results (GET)
router.get('/results', (req, res) => proxyToLinkServer(req, res, '/results'));
router.get('/results-thumbnail', (req, res) => proxyToLinkServer(req, res, '/results-thumbnail'));

module.exports = router;

