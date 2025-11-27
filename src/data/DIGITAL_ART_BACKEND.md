# Modelo de Datos para Arte Digital

## MongoDB Schema

```javascript
// models/DigitalArt.js
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
    default: 'Mirta Aguilar'
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices
digitalArtSchema.index({ title: 'text', description: 'text' });
digitalArtSchema.index({ originalArtworkId: 1 });
digitalArtSchema.index({ available: 1, featured: -1 });

const DigitalArt = mongoose.model('DigitalArt', digitalArtSchema);

module.exports = DigitalArt;
```

## API Endpoints

```javascript
// routes/digitalArt.js
const express = require('express');
const router = express.Router();
const DigitalArt = require('../models/DigitalArt');

// GET - Obtener todas las obras digitales
router.get('/digital-art', async (req, res) => {
  try {
    const { limit = 20, available = true } = req.query;
    
    const query = {};
    if (available !== 'all') {
      query.available = available === 'true';
    }
    
    const digitalArtworks = await DigitalArt
      .find(query)
      .populate('originalArtworkId', 'title artist year')
      .sort({ featured: -1, createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: digitalArtworks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET - Obtener una obra digital por ID
router.get('/digital-art/:id', async (req, res) => {
  try {
    const digitalArt = await DigitalArt
      .findById(req.params.id)
      .populate('originalArtworkId');
    
    if (!digitalArt) {
      return res.status(404).json({
        success: false,
        error: 'Obra digital no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: digitalArt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST - Crear nueva obra digital (admin)
router.post('/digital-art', requireAuth, requireAdmin, async (req, res) => {
  try {
    const digitalArt = new DigitalArt(req.body);
    await digitalArt.save();
    
    res.status(201).json({
      success: true,
      data: digitalArt
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT - Actualizar obra digital (admin)
router.put('/digital-art/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const digitalArt = await DigitalArt.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!digitalArt) {
      return res.status(404).json({
        success: false,
        error: 'Obra digital no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: digitalArt
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE - Eliminar obra digital (admin)
router.delete('/digital-art/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const digitalArt = await DigitalArt.findByIdAndDelete(req.params.id);
    
    if (!digitalArt) {
      return res.status(404).json({
        success: false,
        error: 'Obra digital no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Obra digital eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
```

## Datos de ejemplo

```javascript
// seed/digitalArtSeed.js
const digitalArtExample = {
  title: "Los Reyes - Versión Digital",
  originalArtworkId: "ID_DEL_CUADRO_ORIGINAL",
  originalTitle: "Los Reyes",
  artist: "Mirta Aguilar",
  version: "01",
  description: "Reinterpretación digital de la obra original 'Los Reyes'. Esta versión contemporánea mantiene la esencia y el poder visual del cuadro original, adaptado para un público joven que busca arte accesible y moderno para decorar sus espacios.",
  digitalTechnique: "Reinterpretación digital con técnicas mixtas",
  imageUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/v1753545958/Los_Reyes_digital_01_vqbrmz.png",
  thumbnailUrl: "https://res.cloudinary.com/dqyoeolib/image/upload/c_thumb,w_400/v1753545958/Los_Reyes_digital_01_vqbrmz.png",
  mockupUrl: "URL_DEL_MOCKUP_ENMARCADO",
  productType: "lamina",
  sizes: [
    {
      size: "A4",
      dimensions: "21 x 29.7 cm",
      price: 15000,
      currency: "ARS",
      available: true
    },
    {
      size: "A3",
      dimensions: "29.7 x 42 cm",
      price: 25000,
      currency: "ARS",
      available: true
    },
    {
      size: "A2",
      dimensions: "42 x 59.4 cm",
      price: 35000,
      currency: "ARS",
      available: true
    }
  ],
  features: {
    paperType: "Papel fotográfico premium 250g",
    printing: "Impresión giclée de alta calidad",
    edition: "Edición abierta",
    signedAvailable: true
  },
  category: "digital",
  tags: ["reinterpretación", "moderno", "decorativo", "juvenil"],
  available: true,
  featured: true
};
```