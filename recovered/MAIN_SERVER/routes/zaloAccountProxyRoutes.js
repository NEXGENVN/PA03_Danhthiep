// ════════════════════════════════════════════════════════════════
// ZALO ACCOUNTS PROXY ROUTES
// ════════════════════════════════════════════════════════════════

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
        if (!userID) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const url = `${ZL_SERVER_URL}${endpoint}`;
        console.log(`🔀 Proxy ${method} ${endpoint} → ZL_SERVER for user ${userID}`);

        let response;
        if (method === 'GET') {
            response = await axios.get(url, {
                params: { ...req.query, userID },
                timeout: 30000,
                headers: {
                    'x-internal-auth': process.env.INTERNAL_AUTH_KEY
                }
            });
        } else {
            response = await axios({
                method,
                url,
                data: { ...req.body, userID },
                timeout: 30000,
                headers: {
                    'x-internal-auth': process.env.INTERNAL_AUTH_KEY
                }
            });
        }

        return res.status(response.status).json(response.data);
    } catch (error) {
        console.error('❌ Proxy Error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({ success: false, message: 'ZL_SERVER unavailable' });
        }
        return res.status(500).json({ success: false, message: 'Proxy error' });
    }
}

router.get('/', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-accounts', 'GET'));
router.get('/:uid', (req, res) => forwardToZLServer(req, res, `/zalo/zalo-accounts/${req.params.uid}`, 'GET'));
router.post('/', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-accounts', 'POST'));
router.post('/auto-fetch', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-accounts/auto-fetch', 'POST'));
router.put('/:uid', (req, res) => forwardToZLServer(req, res, `/zalo/zalo-accounts/${req.params.uid}`, 'PUT'));
router.delete('/:uid', (req, res) => forwardToZLServer(req, res, `/zalo/zalo-accounts/${req.params.uid}`, 'DELETE'));
router.post('/:uid/check-status', (req, res) => forwardToZLServer(req, res, `/zalo/zalo-accounts/${req.params.uid}/check-status`, 'POST'));
router.post('/check-all-status', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-accounts/check-all-status', 'POST'));

module.exports = router;

