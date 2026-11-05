// Derived analysis copy. Original: recovered/ZL_SERVER/routes/checkStatusRoutes.js
// ════════════════════════════════════════════════════════════════
// CHECK STATUS ROUTES
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const {
  preCheckStatus,
  confirmCheckStatus
} = require('../controllers/checkStatusController');

// POST /zalo/check-status/pre-check
router.post('/pre-check', preCheckStatus);

// POST /zalo/check-status/confirm
router.post('/confirm', confirmCheckStatus);
module.exports = router;
