const mongoose = require('mongoose');

const digitalArtSchema = new mongoose.Schema({
  // Información básica
  title: {
    type: String,
    required: true,
    trim: true
  },
  originalArtworkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
    required: true
  },
  originalTitle: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    default: 'Mirta Susana Aguilar'
  },
  
  // Información de la versión digital
  version: {
    type: String,
    required: true,
    default: '01'
  },
  description: {
    type: String,
    required: true
  },
  digitalTechnique: {
    type: String,
    required: true,
    default: 'Reinterpretación digital'
  },
  
  // URLs de imágenes
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  mockupUrl: String, // Imagen del mockup de la lámina enmarcada
  
  // Información de producto
  productType: {
    type: String,
    enum: ['lamina', 'poster', 'canvas'],
    default: 'lamina'
  },
  sizes: [{
    size: String, // "A4", "A3", "A2", etc.
    dimensions: String, // "21 x 29.7 cm"
    price: Number,
    currency: {
      type: String,
      default: 'ARS'
    },
    available: {
      type: Boolean,
      default: true
    }
  }],
  
  // Características del producto
  features: {
    paperType: {
      type: String,
      default: 'Papel fotográfico premium 250g'
    },
    printing: {
      type: String,
      default: 'Impresión giclée de alta calidad'
    },
    edition: {
      type: String,
      default: 'Edición abierta'
    },
    signedAvailable: {
      type: Boolean,
      default: true
    }
  },
  
  // Categorización
  category: {
    type: String,
    default: 'digital'
  },
  tags: [String],
  
  // Control
  available: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices
digitalArtSchema.index({ title: 'text', description: 'text' });
digitalArtSchema.index({ originalArtworkId: 1 });
digitalArtSchema.index({ available: 1, featured: -1 });

const DigitalArt = mongoose.model('DigitalArt', digitalArtSchema);

module.exports = DigitalArt;