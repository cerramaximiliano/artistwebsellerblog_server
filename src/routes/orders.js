const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');

// Create order (public or authenticated)
router.post('/', orderController.createOrder);

// Get all orders (admin only)
router.get('/', auth, adminAuth, orderController.getOrders);

// Get single order (owner or admin)
router.get('/:id', auth, orderController.getOrder);

// Update order status (admin only)
router.patch('/:id/status', auth, adminAuth, orderController.updateOrderStatus);

module.exports = router;