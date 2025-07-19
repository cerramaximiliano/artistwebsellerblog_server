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
    return res.status(400).json({ 
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
        details: errors.array()
      }
    });
  }
  next();
};

// Subscribe
router.post('/subscribe', [
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('name').optional().trim()
], validate, contactController.subscribeNewsletter);

// Unsubscribe
router.delete('/unsubscribe/:email', contactController.unsubscribeNewsletter);

// Get subscribers (admin only)
router.get('/subscribers', auth, adminAuth, contactController.getSubscribers);

module.exports = router;