// Zalo Timer Proxy Routes
const express = require('express');
const router = express.Router();
const axios = require('axios');
let ZL_TIMER_SERVER_URL;

if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    ZL_TIMER_SERVER_URL = 'http://host.docker.internal:' + process.env.ZL_TIMER_SERVER_PORT;
} else {
    ZL_TIMER_SERVER_URL = 'http://' + process.env.ZL_TIMER_SERVER_HOST + ':' + process.env.ZL_TIMER_SERVER_PORT;
}

async function forwardToTimerServer(req, res, endpoint) {
    try {
        const userID = req.user?.userID;
        if (!userID) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const url = `${ZL_TIMER_SERVER_URL}${endpoint}`;
        const response = await axios({
            method: 'POST',
            url,
            data: { ...req.body, userID },
            timeout: 30000,
            headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY }
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[TIMER PROXY ERROR] ${endpoint}:`, error.message);
        if (error.response) return res.status(error.response.status).json(error.response.data);
        if (error.code === 'ECONNREFUSED') return res.status(503).json({ success: false, message: 'ZL_TIMER_SERVER unavailable' });
        return res.status(500).json({ success: false, message: 'Proxy error' });
    }
}

// Get Timer History
router.get('/history', async (req, res) => {
    try {
        const userID = req.user?.userID;
        if (!userID) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const url = `${ZL_TIMER_SERVER_URL}/api/history/${userID}`;
        const response = await axios({
            method: 'GET',
            url,
            params: req.query, // Forward query parameters for pagination
            timeout: 30000,
            headers: { 'x-internal-auth': process.env.INTERNAL_AUTH_KEY }
        });

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`[TIMER PROXY ERROR] /history:`, error.message);
        if (error.response) return res.status(error.response.status).json(error.response.data);
        return res.status(500).json({ success: false, message: 'Proxy error' });
    }
});

// Routes
router.post('/send', (req, res) => {
    const endpoint = req.baseUrl.includes('v2') ? '/api/schedule/v2' : '/api/schedule/card';
    return forwardToTimerServer(req, res, endpoint);
});

module.exports = router;

