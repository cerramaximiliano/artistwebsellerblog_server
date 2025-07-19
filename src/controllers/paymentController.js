const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Initialize payment providers lazily
let stripe;
let mercadopago;

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

const getMercadoPago = () => {
  if (!mercadopago && process.env.MERCADOPAGO_ACCESS_TOKEN) {
    const { MercadoPagoConfig } = require('mercadopago');
    mercadopago = new MercadoPagoConfig({ 
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
    });
  }
  return mercadopago;
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
    } else if (paymentMethod === 'mercadopago') {
      const mercadopagoInstance = getMercadoPago();
      if (!mercadopagoInstance) {
        return sendError(res, { message: 'MercadoPago no está configurado' }, 500);
      }
      
      // Create MercadoPago preference
      const { Preference } = require('mercadopago');
      const preference = new Preference(mercadopagoInstance);
      
      const preferenceData = {
        items: order.items.map(item => ({
          title: item.title,
          quantity: 1,
          unit_price: item.finalPrice,
          currency_id: 'ARS'
        })),
        payer: {
          name: order.customer.name,
          email: order.customer.email,
          phone: {
            number: order.customer.phone
          }
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`
        },
        auto_return: 'approved',
        external_reference: order._id.toString(),
        notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`
      };

      const response = await preference.create({ body: preferenceData });
      
      // Update order with preference ID
      order.payment.preferenceId = response.id;
      await order.save();

      sendSuccess(res, {
        preferenceId: response.id,
        initPoint: response.init_point
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
    } else {
      // MercadoPago webhook
      const { type, data } = req.body;
      
      if (type === 'payment' && data?.id) {
        // Handle MercadoPago payment notification
        // You would need to verify the payment with MercadoPago API
        // This is a simplified version
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