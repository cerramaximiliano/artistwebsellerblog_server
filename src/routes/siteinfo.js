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
router.get('/legal/privacy', siteInfoController.getPrivacyPolicy);
router.get('/legal/terms', siteInfoController.getTermsAndConditions);
router.get('/legal', siteInfoController.getLegalPages);

// Admin only routes
router.put('/', auth, adminAuth, upload.single('profileImage'), siteInfoController.updateSiteInfo);
router.put('/legal/privacy', auth, adminAuth, siteInfoController.updatePrivacyPolicy);
router.put('/legal/terms', auth, adminAuth, siteInfoController.updateTermsAndConditions);

module.exports = router;