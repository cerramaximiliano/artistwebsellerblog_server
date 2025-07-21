# Integración con MercadoPago - Backend

Este documento describe los endpoints y configuraciones necesarias en el backend para integrar MercadoPago.

## Instalación de dependencias

```bash
npm install mercadopago
```

## Configuración

En tu archivo `.env` del backend, agrega:

```env
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_produccion
MERCADOPAGO_PUBLIC_KEY=tu_public_key
FRONTEND_URL=https://tu-dominio.com
```

## Endpoint para crear preferencia de pago

```javascript
// routes/checkout.js
const express = require('express');
const router = express.Router();
const mercadopago = require('mercadopago');

// Configurar MercadoPago
mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_ACCESS_TOKEN);

router.post('/checkout/create-preference', async (req, res) => {
  try {
    const { items, customer, shipping, billing, total } = req.body;

    // Crear la preferencia
    const preference = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: 1,
        unit_price: parseFloat(item.price),
        currency_id: item.currency || 'ARS'
      })),
      
      payer: {
        name: customer.firstName,
        surname: customer.lastName,
        email: customer.email,
        phone: {
          number: customer.phone
        },
        identification: {
          type: 'DNI',
          number: customer.dni
        }
      },
      
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment-success`,
        failure: `${process.env.FRONTEND_URL}/payment-failure`,
        pending: `${process.env.FRONTEND_URL}/payment-success`
      },
      
      auto_return: 'approved',
      
      shipments: {
        mode: shipping.method === 'delivery' ? 'not_specified' : 'pick_up',
        receiver_address: shipping.method === 'delivery' ? {
          street_name: shipping.address,
          city_name: shipping.city,
          state_name: shipping.province,
          zip_code: shipping.postalCode
        } : undefined
      },
      
      statement_descriptor: 'Galería Mirta Aguilar',
      
      notification_url: `${process.env.BACKEND_URL}/api/webhook/mercadopago`,
      
      metadata: {
        customer_email: customer.email,
        shipping_method: shipping.method,
        billing_type: billing.type
      }
    };

    const response = await mercadopago.preferences.create(preference);
    
    // Guardar la orden en la base de datos
    const order = new Order({
      preferenceId: response.body.id,
      customer,
      shipping,
      billing,
      items,
      total,
      status: 'pending'
    });
    
    await order.save();
    
    res.json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
    
  } catch (error) {
    console.error('Error creating preference:', error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
});

module.exports = router;
```

## Webhook para notificaciones de pago

```javascript
// routes/webhook.js
router.post('/webhook/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Obtener información del pago
      const payment = await mercadopago.payment.findById(paymentId);
      
      // Actualizar el estado de la orden
      const order = await Order.findOne({ 
        'metadata.payment_id': paymentId 
      });
      
      if (order) {
        order.paymentStatus = payment.body.status;
        order.paymentDetails = payment.body;
        
        if (payment.body.status === 'approved') {
          order.status = 'paid';
          
          // Enviar email de confirmación
          await sendOrderConfirmationEmail(order);
          
          // Actualizar el estado de las obras como vendidas
          for (const item of order.items) {
            await Artwork.findByIdAndUpdate(item.id, {
              available: false,
              soldDate: new Date()
            });
          }
        }
        
        await order.save();
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});
```

## Modelo de Order (MongoDB)

```javascript
// models/Order.js
const orderSchema = new mongoose.Schema({
  preferenceId: String,
  paymentId: String,
  status: {
    type: String,
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: String,
  customer: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    dni: String
  },
  shipping: {
    method: String,
    address: String,
    city: String,
    province: String,
    postalCode: String,
    notes: String
  },
  billing: {
    type: String,
    businessName: String,
    cuit: String
  },
  items: [{
    id: String,
    title: String,
    price: Number,
    currency: String
  }],
  total: Number,
  paymentDetails: Object,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);
```

## Configuración en el frontend

En el archivo `.env` del frontend:

```env
VITE_MERCADOPAGO_PUBLIC_KEY=tu_public_key
```

## Notas importantes

1. **Modo Sandbox**: Para pruebas, usa las credenciales de sandbox de MercadoPago
2. **Seguridad**: Nunca expongas el Access Token en el frontend
3. **Webhooks**: Configura la URL de webhook en tu panel de MercadoPago
4. **SSL**: MercadoPago requiere HTTPS en producción
5. **Monedas**: Verifica que uses la moneda correcta (ARS, USD, etc.)

## Testing

Tarjetas de prueba para sandbox:
- Mastercard: 5031 7557 3453 0604
- Visa: 4509 9535 6623 3704
- American Express: 3711 803032 57522

CVV: 123
Fecha: Cualquier fecha futura