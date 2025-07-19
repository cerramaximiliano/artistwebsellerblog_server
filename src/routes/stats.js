const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');

// All stats routes require admin authentication
router.use(auth, adminAuth);

// Dashboard statistics
router.get('/dashboard', statsController.getDashboardStats);

// Sales statistics
router.get('/sales', statsController.getSalesStats);

// Artwork statistics
router.get('/artworks', statsController.getArtworkStats);

module.exports = router;