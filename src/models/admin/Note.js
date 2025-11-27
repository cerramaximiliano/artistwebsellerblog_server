const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  content: {
    type: String,
    required: [true, 'El contenido es requerido']
  },
  category: {
    type: String,
    enum: ['general', 'artwork', 'client', 'supplier', 'exhibition', 'sales', 'other'],
    default: 'general',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  reminders: [{
    date: {
      type: Date,
      required: true
    },
    notified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedTo: {
    type: {
      type: String,
      enum: ['artwork', 'contact', 'event', 'order', null]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para búsqueda de texto
noteSchema.index({ title: 'text', content: 'text' });

// Índice para recordatorios pendientes
noteSchema.index({ 'reminders.date': 1, 'reminders.notified': 1 });

// Métodos estáticos
noteSchema.statics.findByCategory = function(category) {
  return this.find({ category, isArchived: false }).sort({ isPinned: -1, createdAt: -1 });
};

noteSchema.statics.findUrgent = function() {
  return this.find({
    priority: { $in: ['high', 'urgent'] },
    isArchived: false
  }).sort({ priority: -1, createdAt: -1 });
};

noteSchema.statics.findPendingReminders = function() {
  const now = new Date();
  return this.find({
    'reminders.date': { $lte: now },
    'reminders.notified': false,
    isArchived: false
  });
};

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
