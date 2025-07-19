const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], validate, authController.login);

// Logout
router.post('/logout', auth, authController.logout);

// Refresh token
router.post('/refresh', [
  body('refreshToken').notEmpty()
], validate, authController.refresh);

// Get current user
router.get('/me', auth, authController.me);

module.exports = router;