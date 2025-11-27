const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: [true, 'El año es requerido'],
    min: [2020, 'Año inválido'],
    max: [2100, 'Año inválido']
  },
  month: {
    type: Number,
    required: [true, 'El mes es requerido'],
    min: [1, 'Mes inválido'],
    max: [12, 'Mes inválido']
  },
  categories: [{
    category: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    budgetedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    actualAmount: {
      type: Number,
      default: 0
    },
    notes: String
  }],
  currency: {
    type: String,
    enum: ['ARS', 'USD', 'EUR'],
    default: 'ARS'
  },
  // Totales calculados
  totalBudgetedIncome: {
    type: Number,
    default: 0
  },
  totalBudgetedExpense: {
    type: Number,
    default: 0
  },
  totalActualIncome: {
    type: Number,
    default: 0
  },
  totalActualExpense: {
    type: Number,
    default: 0
  },
  notes: String,
  isFinalized: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice único para año/mes
budgetSchema.index({ year: 1, month: 1 }, { unique: true });

// Virtual para calcular el balance presupuestado
budgetSchema.virtual('budgetedBalance').get(function() {
  return this.totalBudgetedIncome - this.totalBudgetedExpense;
});

// Virtual para calcular el balance actual
budgetSchema.virtual('actualBalance').get(function() {
  return this.totalActualIncome - this.totalActualExpense;
});

// Virtual para calcular la diferencia
budgetSchema.virtual('variance').get(function() {
  return this.actualBalance - this.budgetedBalance;
});

// Pre-save hook para calcular totales
budgetSchema.pre('save', function(next) {
  if (this.categories && this.categories.length > 0) {
    this.totalBudgetedIncome = this.categories
      .filter(c => c.type === 'income')
      .reduce((sum, c) => sum + (c.budgetedAmount || 0), 0);

    this.totalBudgetedExpense = this.categories
      .filter(c => c.type === 'expense')
      .reduce((sum, c) => sum + (c.budgetedAmount || 0), 0);

    this.totalActualIncome = this.categories
      .filter(c => c.type === 'income')
      .reduce((sum, c) => sum + (c.actualAmount || 0), 0);

    this.totalActualExpense = this.categories
      .filter(c => c.type === 'expense')
      .reduce((sum, c) => sum + (c.actualAmount || 0), 0);
  }
  next();
});

// Métodos estáticos
budgetSchema.statics.findOrCreate = async function(year, month, userId) {
  let budget = await this.findOne({ year, month });

  if (!budget) {
    // Crear presupuesto con categorías por defecto
    const defaultCategories = [
      // Ingresos
      { category: 'artwork_sale', type: 'income', budgetedAmount: 0, actualAmount: 0 },
      { category: 'digital_sale', type: 'income', budgetedAmount: 0, actualAmount: 0 },
      { category: 'commission', type: 'income', budgetedAmount: 0, actualAmount: 0 },
      { category: 'other_income', type: 'income', budgetedAmount: 0, actualAmount: 0 },
      // Gastos
      { category: 'materials', type: 'expense', budgetedAmount: 0, actualAmount: 0 },
      { category: 'framing', type: 'expense', budgetedAmount: 0, actualAmount: 0 },
      { category: 'shipping', type: 'expense', budgetedAmount: 0, actualAmount: 0 },
      { category: 'marketing', type: 'expense', budgetedAmount: 0, actualAmount: 0 },
      { category: 'rent', type: 'expense', budgetedAmount: 0, actualAmount: 0 },
      { category: 'utilities', type: 'expense', budgetedAmount: 0, actualAmount: 0 },
      { category: 'other_expense', type: 'expense', budgetedAmount: 0, actualAmount: 0 }
    ];

    budget = await this.create({
      year,
      month,
      categories: defaultCategories,
      createdBy: userId
    });
  }

  return budget;
};

// Método para actualizar los valores actuales desde Finance
budgetSchema.statics.syncWithFinances = async function(year, month) {
  const Finance = mongoose.model('Finance');
  const budget = await this.findOne({ year, month });

  if (!budget) return null;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const actuals = await Finance.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        paymentStatus: 'completed'
      }
    },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Actualizar cada categoría con su valor actual
  budget.categories.forEach(cat => {
    const actual = actuals.find(
      a => a._id.category === cat.category && a._id.type === cat.type
    );
    cat.actualAmount = actual ? actual.total : 0;
  });

  return budget.save();
};

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
