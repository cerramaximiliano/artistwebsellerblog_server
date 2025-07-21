const Order = require('../models/Order');
const Artwork = require('../models/Artwork');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Initialize MercadoPago only if configured
let mercadopago;
try {
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    mercadopago = require('mercadopago');
    if (mercadopago && mercadopago.configurations) {
      mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN);
      console.log('✓ MercadoPago configurado correctamente');
    }
  } else {
    console.warn('⚠️  MercadoPago no está configurado - MERCADOPAGO_ACCESS_TOKEN no encontrado');
  }
} catch (error) {
  console.warn('⚠️  MercadoPago no pudo ser inicializado:', error.message);
  mercadopago = null;
}

// Create preference for MercadoPago checkout
const createPreference = async (req, res) => {
  try {
    if (!mercadopago || !process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return sendError(res, { message: 'MercadoPago no está configurado. Por favor, configure las credenciales de MercadoPago.' }, 503);
    }

    const { items, customer, shipping, billing, total } = req.body;

    // Validate required fields
    if (!items || !items.length || !customer || !shipping || !total) {
      return sendError(res, { message: 'Datos incompletos para crear la preferencia' }, 400);
    }

    // Create the preference
    const preference = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: 1,
        unit_price: parseFloat(item.price),
        currency_id: item.currency || 'ARS',
        description: item.description || ''
      })),
      
      payer: {
        name: customer.firstName,
        surname: customer.lastName,
        email: customer.email,
        phone: {
          number: customer.phone || ''
        },
        identification: customer.dni ? {
          type: 'DNI',
          number: customer.dni
        } : undefined
      },
      
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment-success`,
        failure: `${process.env.FRONTEND_URL}/payment-failure`,
        pending: `${process.env.FRONTEND_URL}/payment-success`
      },
      
      auto_return: 'approved',
      
      shipments: shipping.method === 'delivery' ? {
        mode: 'not_specified',
        receiver_address: {
          street_name: shipping.address || '',
          city_name: shipping.city || '',
          state_name: shipping.province || '',
          zip_code: shipping.postalCode || ''
        }
      } : undefined,
      
      statement_descriptor: 'Galería Mirta Aguilar',
      
      notification_url: `${process.env.BACKEND_URL || process.env.SERVER_URL}/api/webhook/mercadopago`,
      
      metadata: {
        customer_email: customer.email,
        shipping_method: shipping.method,
        billing_type: billing?.type || 'consumer'
      }
    };

    const response = await mercadopago.preferences.create(preference);
    
    // Create order in database
    const order = new Order({
      orderNumber: await Order.generateOrderNumber(),
      customer: {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone || '',
        dni: customer.dni || ''
      },
      shipping: {
        method: shipping.method,
        address: shipping.address || '',
        city: shipping.city || '',
        province: shipping.province || '',
        postalCode: shipping.postalCode || '',
        notes: shipping.notes || ''
      },
      billing: billing || {},
      items: items.map(item => ({
        artwork: item.id,
        title: item.title,
        price: item.price,
        finalPrice: item.price,
        quantity: 1
      })),
      total,
      subtotal: total,
      payment: {
        method: 'mercadopago',
        status: 'pending',
        preferenceId: response.body.id
      },
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        date: new Date(),
        notes: 'Orden creada, esperando pago'
      }]
    });
    
    await order.save();
    
    sendSuccess(res, {
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      orderId: order._id,
      orderNumber: order.orderNumber
    }, 'Preferencia creada exitosamente');
    
  } catch (error) {
    console.error('Error creating preference:', error);
    sendError(res, error, 500);
  }
};

// Handle MercadoPago webhook notifications
const handleMercadoPagoWebhook = async (req, res) => {
  try {
    if (!mercadopago) {
      console.warn('⚠️  Webhook recibido pero MercadoPago no está configurado');
      return res.status(200).send('OK');
    }
    
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Get payment details from MercadoPago
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (!payment || !payment.body) {
        console.error('Payment not found:', paymentId);
        return res.status(200).send('OK');
      }

      const paymentData = payment.body;
      
      // Find order by preference ID or external reference
      const order = await Order.findOne({
        $or: [
          { 'payment.preferenceId': paymentData.preference_id },
          { 'payment.paymentId': paymentId }
        ]
      });
      
      if (order) {
        // Update order payment details
        order.payment.paymentId = paymentId;
        order.payment.transactionId = paymentData.id;
        order.payment.paymentDetails = {
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          payment_method_id: paymentData.payment_method_id,
          payment_type_id: paymentData.payment_type_id,
          date_approved: paymentData.date_approved,
          transaction_amount: paymentData.transaction_amount,
          net_received_amount: paymentData.transaction_details?.net_received_amount
        };
        
        // Update order status based on payment status
        if (paymentData.status === 'approved') {
          order.payment.status = 'completed';
          order.payment.paidAt = new Date(paymentData.date_approved);
          order.status = 'paid';
          
          order.statusHistory.push({
            status: 'paid',
            date: new Date(),
            notes: `Pago aprobado via MercadoPago. ID: ${paymentId}`
          });
          
          // Mark artworks as sold
          for (const item of order.items) {
            await Artwork.findByIdAndUpdate(item.artwork, {
              'status.isAvailable': false,
              'status.isSold': true,
              'status.soldDate': new Date(),
              'status.soldTo': order.customer.email
            });
          }
          
          // TODO: Send confirmation email
          // await sendOrderConfirmationEmail(order);
          
        } else if (paymentData.status === 'pending' || paymentData.status === 'in_process') {
          order.payment.status = 'pending';
          order.statusHistory.push({
            status: 'pending',
            date: new Date(),
            notes: `Pago pendiente. Estado: ${paymentData.status_detail}`
          });
          
        } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
          order.payment.status = 'failed';
          order.status = 'cancelled';
          order.statusHistory.push({
            status: 'cancelled',
            date: new Date(),
            notes: `Pago rechazado/cancelado. Razón: ${paymentData.status_detail}`
          });
        }
        
        await order.save();
        console.log(`Order ${order.orderNumber} updated with payment status: ${paymentData.status}`);
      } else {
        console.log('Order not found for payment:', paymentId);
      }
    }
    
    // Always respond 200 to MercadoPago
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    // Still respond 200 to avoid retries
    res.status(200).send('OK');
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    if (!mercadopago) {
      return sendError(res, { message: 'MercadoPago no está configurado' }, 503);
    }
    
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return sendError(res, { message: 'ID de pago requerido' }, 400);
    }
    
    const payment = await mercadopago.payment.findById(paymentId);
    
    if (!payment || !payment.body) {
      return sendError(res, { message: 'Pago no encontrado' }, 404);
    }
    
    sendSuccess(res, {
      status: payment.body.status,
      status_detail: payment.body.status_detail,
      payment_method: payment.body.payment_method_id,
      amount: payment.body.transaction_amount,
      date_approved: payment.body.date_approved
    });
    
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  createPreference,
  handleMercadoPagoWebhook,
  getPaymentStatus
};