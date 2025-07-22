const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Datos al momento de la compra
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    dni: String
  },

  // Items del pedido
  items: [{
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      required: true
    },
    // Snapshot de datos al momento de la compra
    title: String,
    artist: String,
    price: {
      type: Number,
      required: true
    },
    discount: Number,
    finalPrice: {
      type: Number,
      required: true
    }
  }],

  // Totales
  subtotal: {
    type: Number,
    required: true
  },
  discountTotal: {
    type: Number,
    default: 0
  },
  shipping: {
    method: {
      type: String,
      enum: ['pickup', 'delivery', 'shipping'],
      required: true
    },
    cost: {
      type: Number,
      default: 0
    },
    address: String,
    city: String,
    province: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Argentina'
    },
    notes: String,
    trackingNumber: String,
    carrier: String
  },
  
  // Billing information
  billing: {
    type: {
      type: String,
      enum: ['consumer', 'business'],
      default: 'consumer'
    },
    businessName: String,
    cuit: String
  },
  total: {
    type: Number,
    required: true
  },

  // Estado del pedido
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: String,
    date: {
      type: Date,
      default: Date.now
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Información de pago
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'transfer', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    paymentIntentId: String, // Stripe payment intent
    preferenceId: String, // MercadoPago preference
    paymentId: String, // MercadoPago payment ID
    paymentDetails: Object, // Store full payment details
    paidAt: Date,
    amount: Number,
    currency: {
      type: String,
      default: 'ARS'
    }
  },

  // Notas y comunicación
  notes: {
    customer: String,
    internal: String
  },

  // Facturación
  invoice: {
    number: String,
    issuedAt: Date,
    url: String
  }
}, {
  timestamps: true
});

// Middleware para generar número de orden
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, date.getMonth(), 1),
        $lt: new Date(year, date.getMonth() + 1, 1)
      }
    });
    this.orderNumber = `ORD-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Índices
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const count = await this.countDocuments({
    createdAt: {
      $gte: new Date(year, date.getMonth(), 1),
      $lt: new Date(year, date.getMonth() + 1, 1)
    }
  });
  return `ORD-${year}${month}-${String(count + 1).padStart(4, '0')}`;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;