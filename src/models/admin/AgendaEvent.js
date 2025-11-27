const mongoose = require('mongoose');

const agendaEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [200, 'El título no puede exceder 200 caracteres']
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['meeting', 'exhibition', 'delivery', 'pickup', 'deadline', 'workshop', 'personal', 'other'],
    default: 'other',
    index: true
  },
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
    index: true
  },
  endDate: {
    type: Date,
    required: [true, 'La fecha de fin es requerida']
  },
  allDay: {
    type: Boolean,
    default: false
  },
  // Recurrencia
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    exceptions: [Date]
  },
  // Ubicación
  location: {
    name: String,
    address: String,
    isVirtual: {
      type: Boolean,
      default: false
    },
    virtualLink: String
  },
  // Participantes
  participants: [{
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminContact'
    },
    name: String,
    email: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined'],
      default: 'pending'
    }
  }],
  // Referencias
  relatedArtwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  },
  relatedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminContact'
  },
  // Recordatorios
  reminders: [{
    minutesBefore: {
      type: Number,
      required: true
    },
    notified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date
  }],
  // Visualización
  color: {
    type: String,
    default: '#d4af37'
  },
  // Estado
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índices
agendaEventSchema.index({ startDate: 1, endDate: 1 });
agendaEventSchema.index({ status: 1, startDate: 1 });

// Colores por defecto según tipo
const eventColors = {
  meeting: '#3B82F6',      // blue
  exhibition: '#8B5CF6',   // purple
  delivery: '#10B981',     // green
  pickup: '#14B8A6',       // teal
  deadline: '#EF4444',     // red
  workshop: '#F97316',     // orange
  personal: '#6B7280',     // gray
  other: '#d4af37'         // gold (accent)
};

// Pre-save hook para asignar color por defecto según tipo
agendaEventSchema.pre('save', function(next) {
  if (this.isNew && !this.color) {
    this.color = eventColors[this.type] || eventColors.other;
  }
  next();
});

// Métodos estáticos
agendaEventSchema.statics.findByMonth = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return this.find({
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      {
        startDate: { $lte: startDate },
        endDate: { $gte: endDate }
      }
    ],
    status: { $ne: 'cancelled' }
  }).sort({ startDate: 1 });
};

agendaEventSchema.statics.findUpcoming = function(limit = 5) {
  const now = new Date();
  return this.find({
    startDate: { $gte: now },
    status: 'scheduled'
  })
    .sort({ startDate: 1 })
    .limit(limit);
};

agendaEventSchema.statics.findToday = function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    $or: [
      { startDate: { $gte: startOfDay, $lte: endOfDay } },
      {
        startDate: { $lte: startOfDay },
        endDate: { $gte: startOfDay }
      }
    ],
    status: 'scheduled'
  }).sort({ startDate: 1 });
};

agendaEventSchema.statics.findPendingReminders = function() {
  const now = new Date();
  return this.find({
    status: 'scheduled',
    startDate: { $gte: now },
    'reminders.notified': false
  });
};

const AgendaEvent = mongoose.model('AgendaEvent', agendaEventSchema);

module.exports = AgendaEvent;
