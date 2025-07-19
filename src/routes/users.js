const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
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

// Get all users (admin only)
router.get('/', auth, adminAuth, userController.getUsers);

// Get single user (admin or self)
router.get('/:id', auth, userController.getUser);

// Update user (admin or self)
router.put('/:id', auth, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', auth, adminAuth, userController.deleteUser);

// Change password (authenticated user)
router.post('/change-password', auth, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validate, userController.changePassword);

module.exports = router;