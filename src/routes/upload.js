const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');
const { upload } = require('../config/cloudinary');

// Upload image (admin only)
router.post('/image', auth, adminAuth, upload.single('image'), uploadController.uploadImage);

// Delete image (admin only)
router.delete('/image/:id', auth, adminAuth, uploadController.deleteImage);

module.exports = router;