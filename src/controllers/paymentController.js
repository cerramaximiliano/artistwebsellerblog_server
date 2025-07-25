const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Initialize payment providers lazily
let stripe;

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// Create payment intent
const createPaymentIntent = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, { message: 'Orden no encontrada' }, 404);
    }

    if (paymentMethod === 'stripe') {
      const stripeInstance = getStripe();
      if (!stripeInstance) {
        return sendError(res, { message: 'Stripe no está configurado' }, 500);
      }
      
      // Create Stripe payment intent
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: Math.round(order.total * 100), // Stripe uses cents
        currency: 'ars',
        metadata: { orderId: order._id.toString() }
      });

      // Update order with payment intent ID
      order.payment.paymentIntentId = paymentIntent.id;
      await order.save();

      sendSuccess(res, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } else {
      sendError(res, { message: 'Método de pago no válido' }, 400);
    }
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Confirm payment
const confirmPayment = async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, { message: 'Orden no encontrada' }, 404);
    }

    // Update payment status
    order.payment.status = 'completed';
    order.payment.transactionId = transactionId;
    order.payment.paidAt = new Date();
    order.status = 'paid';
    
    order.statusHistory.push({
      status: 'paid',
      date: new Date(),
      notes: 'Pago confirmado'
    });

    await order.save();

    sendSuccess(res, order, 'Pago confirmado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Webhook handler
const handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    if (sig) {
      // Stripe webhook
      const stripeInstance = getStripe();
      if (!stripeInstance) {
        return sendError(res, { message: 'Stripe no está configurado' }, 500);
      }
      
      try {
        event = stripeInstance.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        return sendError(res, { message: 'Webhook signature verification failed' }, 400);
      }

      // Handle Stripe events
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata.orderId;
          
          const order = await Order.findById(orderId);
          if (order) {
            order.payment.status = 'completed';
            order.payment.transactionId = paymentIntent.id;
            order.payment.paidAt = new Date();
            order.status = 'paid';
            
            order.statusHistory.push({
              status: 'paid',
              date: new Date(),
              notes: 'Pago confirmado via Stripe webhook'
            });
            
            await order.save();
          }
          break;
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get payment info for order
const getPaymentInfo = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select('payment total orderNumber');
    
    if (!order) {
      return sendError(res, { message: 'Orden no encontrada' }, 404);
    }

    sendSuccess(res, order);
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentInfo
};