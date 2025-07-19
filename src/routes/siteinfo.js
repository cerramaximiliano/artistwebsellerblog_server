const express = require('express');
const router = express.Router();
const siteInfoController = require('../controllers/siteInfoController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', siteInfoController.getSiteInfo);
router.get('/biography', siteInfoController.getBiography);
router.get('/contact', siteInfoController.getContactInfo);

// Admin only route - Update site info with optional profile image
router.put('/', auth, adminAuth, upload.single('profileImage'), siteInfoController.updateSiteInfo);

module.exports = router;