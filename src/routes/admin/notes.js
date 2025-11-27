const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const adminAuth = require('../../middlewares/adminAuth');
const { notesController } = require('../../controllers/admin');
const { cloudinaryStorage } = require('../../config/cloudinary');
const multer = require('multer');

// Configuración de multer para archivos adjuntos
const upload = multer({
  storage: cloudinaryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Permitir imágenes y documentos
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// Todas las rutas requieren autenticación de admin
router.use(auth, adminAuth);

// Rutas CRUD
router.get('/', notesController.getNotes);
router.get('/urgent', notesController.getUrgentNotes);
router.get('/:id', notesController.getNote);
router.post('/', notesController.createNote);
router.put('/:id', notesController.updateNote);
router.delete('/:id', notesController.deleteNote);

// Acciones especiales
router.patch('/:id/pin', notesController.togglePin);
router.patch('/:id/archive', notesController.toggleArchive);

// Archivos adjuntos
router.post('/:id/attachments', upload.single('file'), notesController.addAttachment);
router.delete('/:id/attachments/:attachmentId', notesController.removeAttachment);

module.exports = router;
