const express = require('express');
const router = express.Router();
const axios = require('axios');

let PAYOS_URL;

if (process.env.DOCKER_HOST.trim().toLowerCase() == 'true') {
    PAYOS_URL = 'http://host.docker.internal:' + process.env.PAYOS_PORT;
} else {
    PAYOS_URL = 'http://' + process.env.PAYOS_HOST + ':' + process.env.PAYOS_PORT;
}

// Proxy request to CASH_PAYOS server
router.post('/create', async (req, res) => {
    try {
        const { amount } = req.body;
        const userID = req.user.userID; // From authMiddleware

        // Determine return/cancel URLs based on the origin or provide default
        const baseUrl = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : 'http://localhost';
        const returnUrl = `${baseUrl}/dashboard.html`;
        const cancelUrl = `${baseUrl}/dashboard.html`;

        const response = await axios.post(`${PAYOS_URL}/api/payos/create`, {
            userID,
            amount,
            returnUrl,
            cancelUrl
        }, {
            headers: {
                'x-internal-auth': process.env.INTERNAL_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error proxying to CASH_PAYOS:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Lỗi khi tạo yêu cầu nạp tiền PayOS'
        });
    }
});

// Proxy request to fetch deposit history
router.get('/history', async (req, res) => {
    try {
        const userID = req.user.userID;

        const response = await axios.get(`${PAYOS_URL}/api/payos/history?userID=${userID}`, {
            headers: {
                'x-internal-auth': process.env.INTERNAL_AUTH_KEY
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error proxying to CASH_PAYOS history:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Lỗi khi lấy lịch sử nạp tiền PayOS'
        });
    }
});

// Proxy request to manually cancel a deposit
router.post('/cancel', async (req, res) => {
    try {
        const userID = req.user.userID;
        const { addInfo } = req.body;

        const response = await axios.post(`${PAYOS_URL}/api/payos/cancel`, {
            userID,
            addInfo
        }, {
            headers: {
                'x-internal-auth': process.env.INTERNAL_AUTH_KEY,
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error proxying to CASH_PAYOS cancel:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Lỗi khi hủy giao dịch PayOS'
        });
    }
});

module.exports = router;

