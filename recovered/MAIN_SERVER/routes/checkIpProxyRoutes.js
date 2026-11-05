// Check IP Proxy Routes (PROXY TỚI MINI_SERVICE_SERVER)
const express = require('express');
const router = express.Router();
const axios = require('axios');
let MINI_SERVICE_SERVER_URL;

if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    MINI_SERVICE_SERVER_URL = 'http://host.docker.internal:' + process.env.MINI_SERVICE_SERVER_PORT;
} else {
    MINI_SERVICE_SERVER_URL = 'http://' + process.env.MINI_SERVICE_SERVER_HOST + ':' + process.env.MINI_SERVICE_SERVER_PORT;
}

async function forwardToMiniServer(req, res, endpoint, method = 'GET') {
    try {
        const userID = req.user?.userID;
        if (!userID) return res.status(401).json({ success: false, message: 'Unauthorized' });
        const url = `${MINI_SERVICE_SERVER_URL}${endpoint}`;
        let response = method === 'GET'
            ? await axios.get(url, { params: { ...req.query, userID }, timeout: 30000, headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY } })
            : await axios({ method, url, data: { ...req.body, userID }, timeout: 30000, headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY } });
        return res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) return res.status(error.response.status).json(error.response.data);
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'MINI_SERVICE_SERVER unavailable' });
        return res.status(500).json({ success: false, message: 'Proxy error' });
    }
}

router.post('/location', (req, res) => forwardToMiniServer(req, res, '/api/check-ip/location', 'POST'));

module.exports = router;

