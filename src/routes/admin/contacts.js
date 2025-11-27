const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const adminAuth = require('../../middlewares/adminAuth');
const { contactsController } = require('../../controllers/admin');

// Todas las rutas requieren autenticación de admin
router.use(auth, adminAuth);

// Estadísticas (debe ir antes de :id para evitar conflictos)
router.get('/stats', contactsController.getStats);

// Rutas CRUD
router.get('/', contactsController.getContacts);
router.get('/:id', contactsController.getContact);
router.post('/', contactsController.createContact);
router.put('/:id', contactsController.updateContact);
router.delete('/:id', contactsController.deleteContact);

// Acciones especiales
router.patch('/:id/favorite', contactsController.toggleFavorite);
router.patch('/:id/active', contactsController.toggleActive);

// Historial
router.post('/:id/history', contactsController.addToHistory);
router.delete('/:id/history/:historyId', contactsController.removeFromHistory);

module.exports = router;
