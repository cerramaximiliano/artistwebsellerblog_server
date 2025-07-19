const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', artworkController.getArtworks);
router.get('/:id', artworkController.getArtwork);

// Admin only routes
// Create artwork with optional image upload
router.post('/', auth, adminAuth, upload.single('image'), artworkController.createArtwork);
router.put('/:id', auth, adminAuth, upload.single('image'), artworkController.updateArtwork);
router.delete('/:id', auth, adminAuth, artworkController.deleteArtwork);
router.patch('/:id/status', auth, adminAuth, artworkController.updateArtworkStatus);

module.exports = router;