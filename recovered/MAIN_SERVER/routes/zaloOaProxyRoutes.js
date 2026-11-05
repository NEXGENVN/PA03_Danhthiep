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

// Token
router.get('/token', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/token', 'GET'));
router.post('/token/refresh', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/token/refresh', 'POST'));

// Templates
router.get('/templates', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/templates', 'GET'));
router.post('/templates', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/templates', 'POST'));
router.put('/templates/:id', (req, res) => forwardToZLServer(req, res, `/zalo/zalo-oa/templates/${req.params.id}`, 'PUT'));
router.delete('/templates/:id', (req, res) => forwardToZLServer(req, res, `/zalo/zalo-oa/templates/${req.params.id}`, 'DELETE'));

// Send and Results
router.post('/send-template', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/send-template', 'POST'));
router.post('/send-template-uid', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/send-template-uid', 'POST'));
router.get('/results', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/results', 'GET'));
router.get('/preview-data', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/preview-data', 'GET'));
router.get('/message-status', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/message-status', 'GET'));
router.get('/fetch-new-templates', (req, res) => forwardToZLServer(req, res, '/zalo/zalo-oa/fetch-new-templates', 'GET'));

module.exports = router;

