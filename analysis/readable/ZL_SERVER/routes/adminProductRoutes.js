// Derived analysis copy. Original: recovered/ZL_SERVER/routes/adminProductRoutes.js
// ════════════════════════════════════════════════════════════════
// ADMIN PRODUCT ROUTES - ĐỊNH NGHĨA CÁC ROUTE CHO QUẢN LÝ SẢN PHẨM (ADMIN)
// ════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');
const {
  adminMiddleware
} = require('../middleware/auth');

// ════════════════════════════════════════════════════════════════
// ADMIN ROUTES - CẦN QUYỀN ADMIN
// ════════════════════════════════════════════════════════════════

// Lấy danh sách tất cả sản phẩm
router.get('/products', adminMiddleware, adminProductController.getAllProducts);

// Lấy thống kê sản phẩm
router.get('/products/stats', adminMiddleware, adminProductController.getProductStats);

// Lấy chi tiết sản phẩm
router.get('/products/:productID', adminMiddleware, adminProductController.getProductById);

// Tạo sản phẩm mới
router.post('/products', adminMiddleware, adminProductController.createProduct);

// Cập nhật sản phẩm
router.put('/products/:productID', adminMiddleware, adminProductController.updateProduct);

// Xóa sản phẩm (soft delete)
router.delete('/products/:productID', adminMiddleware, adminProductController.deleteProduct);

// ════════════════════════════════════════════════════════════════
// LICENSE MANAGEMENT ROUTES - QUẢN LÝ BẢN QUYỀN
// ════════════════════════════════════════════════════════════════

// Lấy danh sách tất cả licenses (có filter + pagination)
router.get('/licenses', adminMiddleware, adminProductController.getAllLicenses);

// Lấy thống kê licenses
router.get('/licenses/stats', adminMiddleware, adminProductController.getLicenseStats);

// Lấy chi tiết license
router.get('/licenses/:licenseKey', adminMiddleware, adminProductController.getLicenseById);

// Vô hiệu hóa license
router.post('/licenses/:licenseKey/revoke', adminMiddleware, adminProductController.revokeLicense);

// Gia hạn license
router.post('/licenses/:licenseKey/extend', adminMiddleware, adminProductController.extendLicense);

// Xóa license (NGUY HIỂM)
router.delete('/licenses/:licenseKey', adminMiddleware, adminProductController.deleteLicense);

// ════════════════════════════════════════════════════════════════
// EXPORT MODULE
// ════════════════════════════════════════════════════════════════

module.exports = router;
