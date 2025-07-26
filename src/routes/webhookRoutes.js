const express = require('express');
const router = express.Router();
const { handleMercadoPagoWebhook } = require('../controllers/checkoutController');
const { handleWebhook } = require('../controllers/paymentController');

// MercadoPago webhook - Raw body needed
router.post('/mercadopago', express.raw({ type: 'application/json' }), async (req, res) => {
  // Parse the raw body
  try {
    req.body = JSON.parse(req.body.toString());
    await handleMercadoPagoWebhook(req, res);
  } catch (error) {
    console.error('Error parsing webhook body:', error);
    res.status(200).send('OK');
  }
});

// Stripe webhook (existing)
router.post('/stripe', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;