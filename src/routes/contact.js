const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const contactController = require('../controllers/contactController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Public route - Send contact message
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('subject').isIn(['compra', 'info', 'exposicion', 'encargo', 'otro']),
  body('message').notEmpty().trim()
], validate, contactController.sendContactMessage);

// Admin routes
router.get('/', auth, adminAuth, contactController.getContactMessages);
router.get('/:id', auth, adminAuth, contactController.getContactMessage);
router.patch('/:id/status', auth, adminAuth, [
  body('status').isIn(['new', 'read', 'replied', 'archived'])
], validate, contactController.updateContactStatus);
router.delete('/:id', auth, adminAuth, contactController.deleteContactMessage);

module.exports = router;