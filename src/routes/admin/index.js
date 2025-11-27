const express = require('express');
const router = express.Router();

const notesRoutes = require('./notes');
const contactsRoutes = require('./contacts');
const financesRoutes = require('./finances');
const agendaRoutes = require('./agenda');

// Montar rutas
router.use('/notes', notesRoutes);
router.use('/contacts', contactsRoutes);
router.use('/finances', financesRoutes);
router.use('/agenda', agendaRoutes);

module.exports = router;
