const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const adminAuth = require('../../middlewares/adminAuth');
const { agendaController } = require('../../controllers/admin');

// Todas las rutas requieren autenticación de admin
router.use(auth, adminAuth);

// ============ EVENTOS ============

// Rutas especiales (deben ir antes de :id)
router.get('/events/upcoming', agendaController.getUpcomingEvents);
router.get('/events/today', agendaController.getTodayEvents);
router.get('/calendar/:year/:month', agendaController.getCalendarMonth);

// CRUD de eventos
router.get('/events', agendaController.getEvents);
router.get('/events/:id', agendaController.getEvent);
router.post('/events', agendaController.createEvent);
router.put('/events/:id', agendaController.updateEvent);
router.delete('/events/:id', agendaController.deleteEvent);
router.patch('/events/:id/status', agendaController.updateEventStatus);

// ============ TAREAS ============

// Rutas especiales (deben ir antes de :id)
router.get('/tasks/stats', agendaController.getTaskStats);
router.get('/tasks/pending', agendaController.getPendingTasks);

// CRUD de tareas
router.get('/tasks', agendaController.getTasks);
router.get('/tasks/:id', agendaController.getTask);
router.post('/tasks', agendaController.createTask);
router.put('/tasks/:id', agendaController.updateTask);
router.delete('/tasks/:id', agendaController.deleteTask);
router.patch('/tasks/:id/status', agendaController.updateTaskStatus);
router.patch('/tasks/:taskId/checklist/:itemIndex', agendaController.toggleChecklistItem);

module.exports = router;
