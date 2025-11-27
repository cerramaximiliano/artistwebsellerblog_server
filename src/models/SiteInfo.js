const mongoose = require('mongoose');

const siteInfoSchema = new mongoose.Schema({
  // BIOGRAFÍA
  biography: {
    title: {
      type: String,
      required: true,
      default: 'Biografía'
    },
    subtitle: {
      type: String,
      required: false
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    profileImage: {
      url: {
        type: String,
        required: false
      },
      publicId: {
        type: String,
        required: false
      },
      alt: {
        type: String,
        default: 'Foto de perfil del artista'
      }
    },
    highlights: [{
      year: {
        type: Number,
        required: true
      },
      achievement: {
        type: String,
        required: true
      },
      images: [{
        url: String,
        publicId: String,
        alt: String,
        caption: String
      }],
      externalUrl: {
        type: String,
        required: false
      }
    }],
    exhibitions: [{
      year: {
        type: Number,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      location: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: false
      },
      images: [{
        url: String,
        publicId: String,
        alt: String,
        caption: String
      }],
      externalUrl: {
        type: String,
        required: false
      },
      catalogUrl: {
        type: String,
        required: false
      }
    }],
    awards: [{
      year: {
        type: Number,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      organization: {
        type: String,
        required: false
      },
      images: [{
        url: String,
        publicId: String,
        alt: String,
        caption: String
      }],
      externalUrl: {
        type: String,
        required: false
      },
      certificateUrl: {
        type: String,
        required: false
      }
    }]
  },

  // INFORMACIÓN DE CONTACTO
  contact: {
    email: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: 'Email inválido'
      }
    },
    phone: {
      type: String,
      required: false
    },
    whatsapp: {
      type: String,
      required: false
    },
    address: {
      street: String,
      city: String,
      province: String,
      country: {
        type: String,
        default: 'Argentina'
      },
      postalCode: String
    },
    socialMedia: {
      instagram: {
        type: String,
        required: false
      },
      facebook: {
        type: String,
        required: false
      },
      twitter: {
        type: String,
        required: false
      },
      linkedin: {
        type: String,
        required: false
      },
      youtube: {
        type: String,
        required: false
      }
    },
    businessHours: {
      monday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      friday: { open: String, close: String, isClosed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, isClosed: { type: Boolean, default: true } },
      sunday: { open: String, close: String, isClosed: { type: Boolean, default: true } }
    },
    mapLocation: {
      lat: Number,
      lng: Number
    }
  },

  // PÁGINAS LEGALES
  legalPages: {
    privacyPolicy: {
      title: {
        type: String,
        default: 'Política de Privacidad'
      },
      content: {
        type: String,
        default: ''
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    },
    termsAndConditions: {
      title: {
        type: String,
        default: 'Términos y Condiciones'
      },
      content: {
        type: String,
        default: ''
      },
      lastUpdated: {
        type: Date,
        default: Date.now
      }
    }
  },

  // METADATOS
  metadata: {
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: String,
      required: false
    }
  }
}, {
  timestamps: true,
  collection: 'siteinfo'
});

// Asegurar que solo existe un documento
siteInfoSchema.statics.getSiteInfo = async function() {
  let siteInfo = await this.findOne();
  if (!siteInfo) {
    siteInfo = await this.create({
      biography: {
        title: 'Biografía',
        content: 'Información biográfica pendiente de actualizar.'
      },
      contact: {
        email: 'contacto@ejemplo.com'
      }
    });
  }
  return siteInfo;
};

// Método para actualizar la información del sitio
siteInfoSchema.statics.updateSiteInfo = async function(data, updatedBy = null) {
  const siteInfo = await this.getSiteInfo();
  
  // Merge data
  Object.assign(siteInfo, data);
  
  // Update metadata
  siteInfo.metadata.lastUpdated = new Date();
  if (updatedBy) {
    siteInfo.metadata.updatedBy = updatedBy;
  }
  
  return await siteInfo.save();
};

const SiteInfo = mongoose.model('SiteInfo', siteInfoSchema);

module.exports = SiteInfo;