const { AgendaEvent, Task } = require('../../models/admin');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../../utils/responseHandler');

// ============ EVENTOS ============

// Obtener eventos con filtros
const getEvents = async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      search,
      limit = 50,
      offset = 0
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.$or = [];
      const dateQuery = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) dateQuery.$lte = new Date(endDate);

      query.$or.push({ startDate: dateQuery });
      if (endDate) {
        query.$or.push({
          startDate: { $lte: new Date(startDate || endDate) },
          endDate: { $gte: new Date(startDate || endDate) }
        });
      }
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const [events, total] = await Promise.all([
      AgendaEvent.find(query)
        .sort({ startDate: 1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('relatedContact', 'name')
        .populate('relatedArtwork', 'title'),
      AgendaEvent.countDocuments(query)
    ]);

    sendPaginatedResponse(res, events, {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener evento por ID
const getEvent = async (req, res) => {
  try {
    const event = await AgendaEvent.findById(req.params.id)
      .populate('relatedContact', 'name email phone')
      .populate('relatedArtwork', 'title')
      .populate('participants.contact', 'name email')
      .populate('createdBy', 'name email');

    if (!event) {
      return sendError(res, { message: 'Evento no encontrado' }, 404);
    }

    sendSuccess(res, event);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Crear evento
const createEvent = async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      createdBy: req.userId
    };

    const event = await AgendaEvent.create(eventData);
    sendSuccess(res, event, 'Evento creado exitosamente', 201);
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Actualizar evento
const updateEvent = async (req, res) => {
  try {
    const event = await AgendaEvent.findById(req.params.id);

    if (!event) {
      return sendError(res, { message: 'Evento no encontrado' }, 404);
    }

    const updatedEvent = await AgendaEvent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    sendSuccess(res, updatedEvent, 'Evento actualizado exitosamente');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Eliminar evento
const deleteEvent = async (req, res) => {
  try {
    const event = await AgendaEvent.findById(req.params.id);

    if (!event) {
      return sendError(res, { message: 'Evento no encontrado' }, 404);
    }

    await AgendaEvent.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Evento eliminado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Cambiar estado del evento
const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const event = await AgendaEvent.findById(req.params.id);

    if (!event) {
      return sendError(res, { message: 'Evento no encontrado' }, 404);
    }

    event.status = status;
    await event.save();

    sendSuccess(res, event, `Evento marcado como ${status}`);
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Obtener eventos del mes para calendario
const getCalendarMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const events = await AgendaEvent.findByMonth(parseInt(year), parseInt(month));

    // Formatear para calendario
    const calendarEvents = events.map(event => ({
      id: event._id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      allDay: event.allDay,
      type: event.type,
      color: event.color,
      status: event.status
    }));

    sendSuccess(res, calendarEvents);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener próximos eventos
const getUpcomingEvents = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const events = await AgendaEvent.findUpcoming(parseInt(limit));
    sendSuccess(res, events);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener eventos de hoy
const getTodayEvents = async (req, res) => {
  try {
    const events = await AgendaEvent.findToday();
    sendSuccess(res, events);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// ============ TAREAS ============

// Obtener tareas con filtros
const getTasks = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      dueDate,
      overdue,
      search,
      limit = 50,
      offset = 0,
      sort = 'dueDate'
    } = req.query;

    const query = {};

    if (status) {
      if (status === 'active') {
        query.status = { $in: ['pending', 'in_progress'] };
      } else {
        query.status = status;
      }
    }
    if (priority) query.priority = priority;
    if (category) query.category = category;

    if (dueDate === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (dueDate === 'week') {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      query.dueDate = { $gte: now, $lte: endOfWeek };
    }

    if (overdue === 'true') {
      query.status = { $in: ['pending', 'in_progress'] };
      query.dueDate = { $lt: new Date() };
    }

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Ordenamiento
    let sortOption = {};
    switch (sort) {
      case 'priority':
        sortOption = { priority: -1, dueDate: 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default: // dueDate
        sortOption = { dueDate: 1, priority: -1 };
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort(sortOption)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('relatedEvent', 'title startDate')
        .populate('relatedContact', 'name'),
      Task.countDocuments(query)
    ]);

    sendPaginatedResponse(res, tasks, {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener tarea por ID
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('relatedEvent', 'title startDate')
      .populate('relatedContact', 'name email')
      .populate('relatedArtwork', 'title')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!task) {
      return sendError(res, { message: 'Tarea no encontrada' }, 404);
    }

    sendSuccess(res, task);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Crear tarea
const createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      createdBy: req.userId
    };

    const task = await Task.create(taskData);
    sendSuccess(res, task, 'Tarea creada exitosamente', 201);
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Actualizar tarea
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return sendError(res, { message: 'Tarea no encontrada' }, 404);
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    sendSuccess(res, updatedTask, 'Tarea actualizada exitosamente');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Eliminar tarea
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return sendError(res, { message: 'Tarea no encontrada' }, 404);
    }

    await Task.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Tarea eliminada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Cambiar estado de tarea
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return sendError(res, { message: 'Tarea no encontrada' }, 404);
    }

    task.status = status;
    if (status === 'completed') {
      task.completedAt = new Date();
    }
    await task.save();

    sendSuccess(res, task, `Tarea marcada como ${status}`);
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Toggle checklist item
const toggleChecklistItem = async (req, res) => {
  try {
    const { taskId, itemIndex } = req.params;
    const task = await Task.findById(taskId);

    if (!task) {
      return sendError(res, { message: 'Tarea no encontrada' }, 404);
    }

    if (!task.checklist[itemIndex]) {
      return sendError(res, { message: 'Item no encontrado' }, 404);
    }

    task.checklist[itemIndex].isCompleted = !task.checklist[itemIndex].isCompleted;
    if (task.checklist[itemIndex].isCompleted) {
      task.checklist[itemIndex].completedAt = new Date();
    }
    await task.save();

    sendSuccess(res, task, 'Checklist actualizado');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener estadísticas de tareas
const getTaskStats = async (req, res) => {
  try {
    const stats = await Task.getStats();
    sendSuccess(res, stats);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener tareas pendientes (para widget)
const getPendingTasks = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const tasks = await Task.findPending().limit(parseInt(limit));
    const overdue = await Task.findOverdue().countDocuments();
    const today = await Task.findToday().countDocuments();

    sendSuccess(res, {
      tasks,
      overdue,
      today
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  // Eventos
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getCalendarMonth,
  getUpcomingEvents,
  getTodayEvents,
  // Tareas
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  toggleChecklistItem,
  getTaskStats,
  getPendingTasks
};
