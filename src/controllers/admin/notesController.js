const { Note } = require('../../models/admin');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../../utils/responseHandler');
const cloudinary = require('cloudinary').v2;

// Obtener todas las notas con filtros
const getNotes = async (req, res) => {
  try {
    const {
      category,
      priority,
      search,
      archived = 'false',
      pinned,
      limit = 20,
      offset = 0,
      sort = 'newest'
    } = req.query;

    // Construir query
    const query = { isArchived: archived === 'true' };

    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (pinned === 'true') query.isPinned = true;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Ordenamiento
    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { isPinned: -1, createdAt: 1 };
        break;
      case 'priority':
        sortOption = { isPinned: -1, priority: -1, createdAt: -1 };
        break;
      case 'title':
        sortOption = { isPinned: -1, title: 1 };
        break;
      default: // newest
        sortOption = { isPinned: -1, createdAt: -1 };
    }

    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort(sortOption)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .populate('createdBy', 'name email'),
      Note.countDocuments(query)
    ]);

    sendPaginatedResponse(res, notes, {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener una nota por ID
const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!note) {
      return sendError(res, { message: 'Nota no encontrada' }, 404);
    }

    sendSuccess(res, note);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Crear nota
const createNote = async (req, res) => {
  try {
    const noteData = {
      ...req.body,
      createdBy: req.userId
    };

    const note = await Note.create(noteData);
    sendSuccess(res, note, 'Nota creada exitosamente', 201);
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Actualizar nota
const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return sendError(res, { message: 'Nota no encontrada' }, 404);
    }

    const updateData = {
      ...req.body,
      lastModifiedBy: req.userId
    };

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    sendSuccess(res, updatedNote, 'Nota actualizada exitosamente');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Eliminar nota
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return sendError(res, { message: 'Nota no encontrada' }, 404);
    }

    // Eliminar archivos adjuntos de Cloudinary
    if (note.attachments && note.attachments.length > 0) {
      for (const attachment of note.attachments) {
        if (attachment.publicId) {
          try {
            await cloudinary.uploader.destroy(attachment.publicId);
          } catch (err) {
            console.error('Error deleting attachment from Cloudinary:', err);
          }
        }
      }
    }

    await Note.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Nota eliminada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Toggle pin
const togglePin = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return sendError(res, { message: 'Nota no encontrada' }, 404);
    }

    note.isPinned = !note.isPinned;
    note.lastModifiedBy = req.userId;
    await note.save();

    sendSuccess(res, note, note.isPinned ? 'Nota fijada' : 'Nota desfijada');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Toggle archive
const toggleArchive = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return sendError(res, { message: 'Nota no encontrada' }, 404);
    }

    note.isArchived = !note.isArchived;
    note.lastModifiedBy = req.userId;
    await note.save();

    sendSuccess(res, note, note.isArchived ? 'Nota archivada' : 'Nota restaurada');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Agregar archivo adjunto
const addAttachment = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return sendError(res, { message: 'Nota no encontrada' }, 404);
    }

    if (!req.file) {
      return sendError(res, { message: 'No se proporcionó archivo' }, 400);
    }

    const attachment = {
      filename: req.file.originalname,
      url: req.file.path,
      publicId: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size
    };

    note.attachments.push(attachment);
    note.lastModifiedBy = req.userId;
    await note.save();

    sendSuccess(res, note, 'Archivo adjuntado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Eliminar archivo adjunto
const removeAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return sendError(res, { message: 'Nota no encontrada' }, 404);
    }

    const attachment = note.attachments.id(attachmentId);
    if (!attachment) {
      return sendError(res, { message: 'Archivo no encontrado' }, 404);
    }

    // Eliminar de Cloudinary
    if (attachment.publicId) {
      try {
        await cloudinary.uploader.destroy(attachment.publicId);
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
    }

    note.attachments.pull(attachmentId);
    note.lastModifiedBy = req.userId;
    await note.save();

    sendSuccess(res, note, 'Archivo eliminado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener notas urgentes (para widget)
const getUrgentNotes = async (req, res) => {
  try {
    const notes = await Note.findUrgent().limit(5);
    sendSuccess(res, notes);
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  togglePin,
  toggleArchive,
  addAttachment,
  removeAttachment,
  getUrgentNotes
};
