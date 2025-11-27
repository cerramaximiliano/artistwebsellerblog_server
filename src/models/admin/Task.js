const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  completedAt: Date,
  category: {
    type: String,
    enum: ['artwork', 'sales', 'client', 'supplier', 'exhibition', 'administrative', 'other'],
    default: 'other',
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Lista de verificación
  checklist: [{
    text: {
      type: String,
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  // Referencias
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgendaEvent'
  },
  relatedContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminContact'
  },
  relatedArtwork: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork'
  },
  // Asignación
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Índices
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ status: 1, priority: -1 });

// Virtual para verificar si está vencida
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Virtual para progreso del checklist
taskSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return null;
  const completed = this.checklist.filter(item => item.isCompleted).length;
  return {
    completed,
    total: this.checklist.length,
    percentage: Math.round((completed / this.checklist.length) * 100)
  };
});

// Pre-save hook para manejar completado
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// Métodos estáticos
taskSchema.statics.findPending = function() {
  return this.find({
    status: { $in: ['pending', 'in_progress'] }
  }).sort({ priority: -1, dueDate: 1 }).lean();
};

taskSchema.statics.findOverdue = function() {
  const now = new Date();
  return this.find({
    status: { $in: ['pending', 'in_progress'] },
    dueDate: { $lt: now }
  }).sort({ dueDate: 1 }).lean();
};

taskSchema.statics.findToday = function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return this.find({
    status: { $in: ['pending', 'in_progress'] },
    dueDate: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ priority: -1 }).lean();
};

taskSchema.statics.findThisWeek = function() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return this.find({
    status: { $in: ['pending', 'in_progress'] },
    dueDate: { $gte: startOfWeek, $lte: endOfWeek }
  }).sort({ dueDate: 1, priority: -1 }).lean();
};

taskSchema.statics.getStats = async function() {
  const now = new Date();

  const [stats] = await this.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        byPriority: [
          { $match: { status: { $in: ['pending', 'in_progress'] } } },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ],
        overdue: [
          {
            $match: {
              status: { $in: ['pending', 'in_progress'] },
              dueDate: { $lt: now }
            }
          },
          { $count: 'count' }
        ],
        dueToday: [
          {
            $match: {
              status: { $in: ['pending', 'in_progress'] },
              dueDate: {
                $gte: new Date(now.setHours(0, 0, 0, 0)),
                $lte: new Date(now.setHours(23, 59, 59, 999))
              }
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ]);

  return {
    byStatus: stats.byStatus,
    byPriority: stats.byPriority,
    overdue: stats.overdue[0]?.count || 0,
    dueToday: stats.dueToday[0]?.count || 0
  };
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
