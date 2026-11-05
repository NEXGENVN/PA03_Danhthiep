const express = require('express');
const router = express.Router();
const axios = require('axios');

let DATA_FIND_SERVER_URL;
let INTERNAL_AUTH_KEY = process.env.INTERNAL_AUTH_KEY;

if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    DATA_FIND_SERVER_URL = 'http://host.docker.internal:' + process.env.DATA_FIND_SERVER_PORT;
} else {
    DATA_FIND_SERVER_URL = 'http://' + process.env.DATA_FIND_SERVER_HOST + ':' + process.env.DATA_FIND_SERVER_PORT;
}

/**
 * Proxy for search (phone and email)
 */
async function handleSearch(req, res, type) {
    try {
        const userID = req.user?.userID;
        const userRole = req.user?.userRole;
        if (!userID) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { value } = req.body;
        if (!value) return res.status(400).json({ success: false, message: 'Thiếu thông tin tra cứu' });

        const url = `${DATA_FIND_SERVER_URL}/api/search`;
        const response = await axios({
            method: 'POST',
            url,
            data: { type, value, userRole, userID },
            timeout: 30000,
            headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY }
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[DATA_FIND PROXY ERROR] ${type}:`, error.message);
        if (error.response) return res.status(error.response.status).json(error.response.data);
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'DATA_FIND_SERVER unavailable' });
        return res.status(500).json({ success: false, message: 'Proxy error' });
    }
}

// Search Phone
router.post('/phone', (req, res) => handleSearch(req, res, 'phone'));

// Search Email
router.post('/email', (req, res) => handleSearch(req, res, 'email'));

// Pre-check Leak Lookup (Lấy phí & Số dư)
router.post('/pre-check', async (req, res) => {
    try {
        const response = await axios({
            method: 'POST',
            url: `${DATA_FIND_SERVER_URL}/api/pre-check`,
            data: { userID: req.user.userID },
            timeout: 10000,
            headers: { 'x-internal-auth': INTERNAL_AUTH_KEY }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Leak Lookup Pre-check Proxy Error:', error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response && error.response.data ? error.response.data.message : 'Lỗi kết nối máy chủ tra cứu';
        res.status(status).json({ success: false, message });
    }
});

// Confirm Leak Lookup (Payment & Search)
router.post('/confirm', async (req, res) => {
    try {
        const { type, value } = req.body;
        if (!type || !value) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin tra cứu' });
        }

        const response = await axios({
            method: 'POST',
            url: `${DATA_FIND_SERVER_URL}/api/confirm`,
            data: {
                type,
                value,
                userID: req.user.userID,
                userRole: req.user.userRole
            },
            timeout: 60000, // Search might take time
            headers: { 'x-internal-auth': INTERNAL_AUTH_KEY }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Leak Lookup Confirm Proxy Error:', error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response && error.response.data ? error.response.data.message : 'Lỗi xử lý tra cứu';
        res.status(status).json({ success: false, message });
    }
});

// Get History
router.get('/history', async (req, res) => {
    try {
        const userID = req.user?.userID;
        if (!userID) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;

        const url = `${DATA_FIND_SERVER_URL}/api/history/${userID}?page=${page}&limit=${limit}`;
        const response = await axios({
            method: 'GET',
            url,
            timeout: 30000,
            headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY }
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[DATA_FIND PROXY ERROR] /history:`, error.message);
        if (error.response) return res.status(error.response.status).json(error.response.data);
        return res.status(500).json({ success: false, message: 'Proxy error' });
    }
});


module.exports = router;

