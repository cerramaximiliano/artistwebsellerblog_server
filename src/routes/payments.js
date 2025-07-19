const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

// Create payment intent
router.post('/create-intent', paymentController.createPaymentIntent);

// Confirm payment
router.post('/confirm', paymentController.confirmPayment);

// Webhook endpoint (no auth needed)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Get payment info for an order
router.get('/order/:orderId', paymentController.getPaymentInfo);

module.exports = router;