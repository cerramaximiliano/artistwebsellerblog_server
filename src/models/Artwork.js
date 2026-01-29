const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  artist: {
    type: String,
    required: true,
    default: 'Mirta Aguilar'
  },
  description: {
    type: String,
    required: true,
    index: 'text'
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear()
  },
  technique: {
    type: String,
    required: true
  },
  dimensions: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['abstracto', 'paisaje', 'retrato', 'naturaleza', 'otros'],
    index: true
  },

  // Imágenes
  images: {
    main: {
      url: {
        type: String,
        required: true
      },
      publicId: String // Cloudinary public ID para eliminar
    },
    thumbnail: {
      url: String,
      publicId: String
    },
    gallery: [{
      url: String,
      publicId: String,
      order: Number
    }]
  },

  // Precio y descuentos
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'ARS'
    },
    hasDiscount: {
      type: Boolean,
      default: false
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    finalPrice: {
      type: Number // Calculado automáticamente
    }
  },

  // Estado y disponibilidad
  status: {
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    isSold: {
      type: Boolean,
      default: false,
      index: true
    },
    isReserved: {
      type: Boolean,
      default: false
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reservedUntil: Date,
    soldDate: Date,
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Información adicional
  tags: [String],
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // SEO
  seo: {
    metaTitle: String,
    metaDescription: String,
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  }
}, {
  timestamps: true
});

// Middleware para calcular precio final
artworkSchema.pre('save', function(next) {
  if (this.pricing.hasDiscount && this.pricing.discount > 0) {
    if (this.pricing.discountType === 'percentage') {
      this.pricing.finalPrice = this.pricing.basePrice * (1 - this.pricing.discount / 100);
    } else {
      this.pricing.finalPrice = this.pricing.basePrice - this.pricing.discount;
    }
  } else {
    this.pricing.finalPrice = this.pricing.basePrice;
  }
  next();
});

// Índices compuestos
artworkSchema.index({ 'status.isAvailable': 1, 'status.isSold': 1 });
artworkSchema.index({ category: 1, 'status.isAvailable': 1 });
artworkSchema.index({ 'pricing.finalPrice': 1 });

// Métodos estáticos

// Genera el siguiente código secuencial disponible (AA001, AA002, ..., ZZ999)
artworkSchema.statics.generateUniqueCode = async function() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Convertir código a índice numérico
  const codeToIndex = (code) => {
    const letter1Index = letters.indexOf(code[0]);
    const letter2Index = letters.indexOf(code[1]);
    const number = parseInt(code.slice(2), 10);
    return (letter1Index * 26 * 1000) + (letter2Index * 1000) + number;
  };

  // Convertir índice a código
  const indexToCode = (index) => {
    const letter1Index = Math.floor(index / (26 * 1000));
    const letter2Index = Math.floor((index % (26 * 1000)) / 1000);
    const number = index % 1000;

    if (letter1Index >= 26) {
      throw new Error('Se agotaron los códigos disponibles (máximo ZZ999)');
    }

    return `${letters[letter1Index]}${letters[letter2Index]}${String(number).padStart(3, '0')}`;
  };

  // Buscar el código más alto existente
  const lastArtwork = await this.findOne({ code: { $exists: true, $ne: null } })
    .sort({ code: -1 })
    .select('code')
    .lean();

  let nextIndex = 1; // Empezar desde AA001

  if (lastArtwork?.code && /^[A-Z]{2}\d{3}$/.test(lastArtwork.code)) {
    nextIndex = codeToIndex(lastArtwork.code) + 1;
  }

  // Generar el siguiente código
  const newCode = indexToCode(nextIndex);

  // Verificar que no exista (por si hay huecos)
  const exists = await this.findOne({ code: newCode });
  if (exists) {
    // Si existe, buscar el siguiente disponible
    let index = nextIndex + 1;
    while (await this.findOne({ code: indexToCode(index) })) {
      index++;
    }
    return indexToCode(index);
  }

  return newCode;
};

artworkSchema.statics.findAvailable = function() {
  return this.find({
    'status.isAvailable': true,
    'status.isSold': false
  });
};

artworkSchema.statics.findByCategory = function(category) {
  return this.find({
    category,
    'status.isAvailable': true
  });
};

// Métodos de instancia
artworkSchema.methods.markAsSold = async function(buyerId) {
  this.status.isSold = true;
  this.status.isAvailable = false;
  this.status.soldDate = new Date();
  this.status.soldTo = buyerId;
  return this.save();
};

artworkSchema.methods.applyDiscount = function(percentage) {
  this.pricing.hasDiscount = true;
  this.pricing.discount = percentage;
  this.pricing.discountType = 'percentage';
  return this.save();
};

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;