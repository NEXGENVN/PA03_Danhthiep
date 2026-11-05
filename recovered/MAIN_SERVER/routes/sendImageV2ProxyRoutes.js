// Send Image V2 Proxy Routes
const express = require('express');
const router = express.Router();
const axios = require('axios');
let ZL_SERVER_URL;

if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    ZL_SERVER_URL = 'http://host.docker.internal:' + process.env.ZL_SERVER_PORT;
} else {
    ZL_SERVER_URL = 'http://' + process.env.ZL_SERVER_HOST + ':' + process.env.ZL_SERVER_PORT;
}

async function forwardToZLServer(req, res, endpoint, method = 'GET') {
    try {
        const userID = req.user?.userID;
        if (!userID) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const url = `${ZL_SERVER_URL}${endpoint}`;
        let response = method === 'GET'
            ? await axios.get(url, { params: { ...req.query, userID }, timeout: 30000, headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY } })
            : await axios({ method, url, data: { ...req.body, userID }, timeout: 30000, headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY } });
        return res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) return res.status(error.response.status).json(error.response.data);
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'ZL_SERVER unavailable' });
        return res.status(500).json({ success: false, message: 'Proxy error' });
    }
}

router.post('/send', (req, res) => forwardToZLServer(req, res, '/zalo/send-image-v2/send', 'POST'));
router.post('/search', (req, res) => forwardToZLServer(req, res, '/zalo/send-image-v2/search', 'POST'));
router.get('/zalo-accounts', (req, res) => forwardToZLServer(req, res, '/zalo/send-image-v2/zalo-accounts', 'GET'));

module.exports = router;

