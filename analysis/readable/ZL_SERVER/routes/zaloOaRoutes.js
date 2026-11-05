// Derived analysis copy. Original: recovered/ZL_SERVER/routes/zaloOaRoutes.js
const express = require('express');
const router = express.Router();
const zaloOaController = require('../controllers/zaloOaController');

// Quản lý Token
router.get('/token', zaloOaController.getToken);
router.post('/token/refresh', zaloOaController.refreshToken);

// Quản lý Template
router.get('/templates', zaloOaController.getTemplates);
router.post('/templates', zaloOaController.addTemplate);
router.put('/templates/:id', zaloOaController.updateTemplate);
router.delete('/templates/:id', zaloOaController.deleteTemplate);

// Gửi tin nhắn OA và lấy kết quả
router.post('/send-template', zaloOaController.sendTemplate);
router.post('/send-template-uid', zaloOaController.sendTemplateUid);
router.get('/results', zaloOaController.getResults);
router.get('/preview-data', zaloOaController.previewData);
router.get('/message-status', zaloOaController.getMessageStatus);
router.get('/fetch-new-templates', zaloOaController.fetchNewTemplates);
module.exports = router;
