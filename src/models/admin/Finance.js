const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'El tipo de transacción es requerido'],
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0, 'El monto debe ser positivo']
  },
  currency: {
    type: String,
    enum: ['ARS', 'USD', 'EUR'],
    default: 'ARS'
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    index: true
    // Income categories: artwork_sale, digital_sale, commission, exhibition, workshop, other_income
    // Expense categories: materials, framing, shipping, marketing, rent, utilities, taxes, insurance, services, other_expense
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'La fecha es requerida'],
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'card', 'mercadopago', 'check', 'other'],
    required: [true, 'El método de pago es requerido']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'completed',
    index: true
  },
  // Referencias opcionales
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminContact'
  },
  relatedArtwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  },
  // Documentación
  invoiceNumber: String,
  receiptNumber: String,
  receiptUrl: String,
  receiptPublicId: String,
  // Notas y etiquetas
  notes: String,
  tags: [{
    type: String,
    trim: true
  }],
  // Transacciones recurrentes
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextDate: Date,
    endDate: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices compuestos
financeSchema.index({ date: -1, type: 1 });
financeSchema.index({ category: 1, date: -1 });

// Métodos estáticos
financeSchema.statics.getMonthlyBalance = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const result = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        paymentStatus: { $in: ['completed', 'pending'] }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const income = result.find(r => r._id === 'income')?.total || 0;
  const expense = result.find(r => r._id === 'expense')?.total || 0;
  const incomeCount = result.find(r => r._id === 'income')?.count || 0;
  const expenseCount = result.find(r => r._id === 'expense')?.count || 0;

  return {
    income,
    expense,
    balance: income - expense,
    incomeCount,
    expenseCount,
    period: { year, month }
  };
};

financeSchema.statics.getCategoryBreakdown = async function(year, month, type) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const match = {
    date: { $gte: startDate, $lte: endDate },
    paymentStatus: 'completed'
  };

  if (type) {
    match.type = type;
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

financeSchema.statics.getYearlyComparison = async function(year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          type: '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.month': 1 }
    }
  ]);
};

const Finance = mongoose.model('Finance', financeSchema);

module.exports = Finance;
