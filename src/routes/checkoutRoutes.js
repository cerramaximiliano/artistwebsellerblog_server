const express = require('express');
const router = express.Router();
const {
  createPreference,
  handleMercadoPagoWebhook,
  getPaymentStatus
} = require('../controllers/checkoutController');

// Create MercadoPago preference
router.post('/create-preference', createPreference);

// Get payment status
router.get('/payment-status/:paymentId', getPaymentStatus);

module.exports = router;