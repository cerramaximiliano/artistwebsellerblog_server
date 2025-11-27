const mongoose = require('mongoose');

const adminContactSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['client', 'supplier', 'both'],
    required: [true, 'El tipo de contacto es requerido'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Argentina'
    }
  },
  category: {
    type: String,
    enum: ['collector', 'gallery', 'museum', 'corporate', 'individual', 'art_dealer', 'materials', 'services', 'framing', 'printing', 'shipping', 'other'],
    default: 'other',
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Información específica para proveedores
  supplierInfo: {
    cuit: String,
    paymentTerms: String,
    products: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    bankInfo: {
      bank: String,
      cbu: String,
      alias: String
    }
  },
  // Información específica para clientes
  clientInfo: {
    preferredArtStyles: [String],
    budget: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'ARS'
      }
    },
    acquisitionDate: Date,
    source: String,
    interests: [String]
  },
  // Historial de compras (para clientes)
  purchaseHistory: [{
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    },
    artworkTitle: String,
    amount: Number,
    currency: {
      type: String,
      default: 'ARS'
    },
    date: Date,
    notes: String
  }],
  // Historial de suministros (para proveedores)
  supplyHistory: [{
    description: String,
    amount: Number,
    currency: {
      type: String,
      default: 'ARS'
    },
    date: Date,
    invoiceNumber: String,
    notes: String
  }],
  lastContactDate: Date,
  nextFollowUp: Date,
  preferredContactMethod: {
    type: String,
    enum: ['email', 'phone', 'whatsapp', 'in-person'],
    default: 'email'
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice de texto para búsqueda
adminContactSchema.index({ name: 'text', company: 'text', email: 'text' });

// Virtuals para totales
adminContactSchema.virtual('totalPurchases').get(function() {
  if (!this.purchaseHistory || this.purchaseHistory.length === 0) return 0;
  return this.purchaseHistory.reduce((sum, p) => sum + (p.amount || 0), 0);
});

adminContactSchema.virtual('totalSupplies').get(function() {
  if (!this.supplyHistory || this.supplyHistory.length === 0) return 0;
  return this.supplyHistory.reduce((sum, s) => sum + (s.amount || 0), 0);
});

adminContactSchema.virtual('purchaseCount').get(function() {
  return this.purchaseHistory ? this.purchaseHistory.length : 0;
});

// Métodos estáticos
adminContactSchema.statics.findClients = function() {
  return this.find({ type: 'client', isActive: true }).sort({ name: 1 });
};

adminContactSchema.statics.findSuppliers = function() {
  return this.find({ type: 'supplier', isActive: true }).sort({ name: 1 });
};

adminContactSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

const AdminContact = mongoose.model('AdminContact', adminContactSchema);

module.exports = AdminContact;
