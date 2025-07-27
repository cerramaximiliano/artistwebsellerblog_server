const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');
const {
  getDigitalArtworks,
  getDigitalArtwork,
  createDigitalArtwork,
  updateDigitalArtwork,
  deleteDigitalArtwork,
  getDigitalArtworksByOriginal,
  updateAvailability,
  updateSizeAvailability
} = require('../controllers/digitalArtController');

// Public routes
// GET - Get all digital artworks with filters
router.get('/', getDigitalArtworks);

// GET - Get single digital artwork
router.get('/:id', getDigitalArtwork);

// GET - Get digital artworks by original artwork ID
router.get('/by-original/:originalId', getDigitalArtworksByOriginal);

// Protected routes (admin only)
// POST - Create new digital artwork
router.post('/', auth, adminAuth, createDigitalArtwork);

// PUT - Update digital artwork
router.put('/:id', auth, adminAuth, updateDigitalArtwork);

// DELETE - Delete digital artwork
router.delete('/:id', auth, adminAuth, deleteDigitalArtwork);

// PATCH - Update availability status
router.patch('/:id/availability', auth, adminAuth, updateAvailability);

// PATCH - Update size availability
router.patch('/:id/size-availability', auth, adminAuth, updateSizeAvailability);

module.exports = router;