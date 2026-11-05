// Derived analysis copy. Original: recovered/ZL_SERVER/routes/licenseRoutes.js
// ════════════════════════════════════════════════════════════════
// LICENSE ROUTES - ĐỊNH NGHĨA CÁC ROUTE CHO BẢN QUYỀN
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');

// ════════════════════════════════════════════════════════════════
// PUBLIC ROUTES (Không cần authentication)
// ════════════════════════════════════════════════════════════════

// Lấy thông tin tổng quan (mặc định lấy products)
router.get('/', licenseController.getProducts);

// Lấy danh sách sản phẩm
router.get('/products', licenseController.getProducts);

// Mua bản quyền
router.post('/purchase', licenseController.purchaseLicense);

// Lấy danh sách bản quyền của user
router.get('/my-licenses', licenseController.getUserLicenses);

// ════════════════════════════════════════════════════════════════
// EXPORT MODULE
// ════════════════════════════════════════════════════════════════

module.exports = router;
