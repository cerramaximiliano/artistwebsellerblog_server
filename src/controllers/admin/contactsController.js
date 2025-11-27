const { AdminContact, Finance } = require('../../models/admin');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../../utils/responseHandler');

// Obtener todos los contactos con filtros
const getContacts = async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      active = 'true',
      favorite,
      limit = 20,
      offset = 0,
      sort = 'name'
    } = req.query;

    // Construir query
    const query = {};

    if (active !== 'all') {
      query.isActive = active === 'true';
    }
    if (type) query.type = type;
    if (category) query.category = category;
    if (favorite === 'true') query.isFavorite = true;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Ordenamiento
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'company':
        sortOption = { company: 1, name: 1 };
        break;
      default: // name
        sortOption = { name: 1 };
    }

    const [contacts, total] = await Promise.all([
      AdminContact.find(query)
        .sort(sortOption)
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .lean(),
      AdminContact.countDocuments(query)
    ]);

    // Obtener totales de transacciones para cada contacto
    const contactIds = contacts.map(c => c._id);
    const transactionTotals = await Finance.aggregate([
      { $match: { relatedContact: { $in: contactIds } } },
      {
        $group: {
          _id: { contactId: '$relatedContact', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Mapear totales a cada contacto
    const contactsWithTotals = contacts.map(contact => {
      const incomeTotals = transactionTotals.find(
        t => t._id.contactId.toString() === contact._id.toString() && t._id.type === 'income'
      );
      const expenseTotals = transactionTotals.find(
        t => t._id.contactId.toString() === contact._id.toString() && t._id.type === 'expense'
      );

      return {
        ...contact,
        transactionTotals: {
          income: incomeTotals?.total || 0,
          incomeCount: incomeTotals?.count || 0,
          expense: expenseTotals?.total || 0,
          expenseCount: expenseTotals?.count || 0
        }
      };
    });

    sendPaginatedResponse(res, contactsWithTotals, {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener un contacto por ID
const getContact = async (req, res) => {
  try {
    const contact = await AdminContact.findById(req.params.id)
      .populate('purchaseHistory.artworkId', 'title')
      .populate('createdBy', 'name email');

    if (!contact) {
      return sendError(res, { message: 'Contacto no encontrado' }, 404);
    }

    sendSuccess(res, contact);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Crear contacto
const createContact = async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      createdBy: req.userId
    };

    const contact = await AdminContact.create(contactData);
    sendSuccess(res, contact, 'Contacto creado exitosamente', 201);
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Actualizar contacto
const updateContact = async (req, res) => {
  try {
    const contact = await AdminContact.findById(req.params.id);

    if (!contact) {
      return sendError(res, { message: 'Contacto no encontrado' }, 404);
    }

    const updatedContact = await AdminContact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    sendSuccess(res, updatedContact, 'Contacto actualizado exitosamente');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Eliminar contacto
const deleteContact = async (req, res) => {
  try {
    const contact = await AdminContact.findById(req.params.id);

    if (!contact) {
      return sendError(res, { message: 'Contacto no encontrado' }, 404);
    }

    await AdminContact.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Contacto eliminado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Toggle favorito
const toggleFavorite = async (req, res) => {
  try {
    const contact = await AdminContact.findById(req.params.id);

    if (!contact) {
      return sendError(res, { message: 'Contacto no encontrado' }, 404);
    }

    contact.isFavorite = !contact.isFavorite;
    await contact.save();

    sendSuccess(res, contact, contact.isFavorite ? 'Contacto marcado como favorito' : 'Contacto desmarcado');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Toggle activo
const toggleActive = async (req, res) => {
  try {
    const contact = await AdminContact.findById(req.params.id);

    if (!contact) {
      return sendError(res, { message: 'Contacto no encontrado' }, 404);
    }

    contact.isActive = !contact.isActive;
    await contact.save();

    sendSuccess(res, contact, contact.isActive ? 'Contacto activado' : 'Contacto desactivado');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Agregar al historial (compras para clientes, suministros para proveedores)
const addToHistory = async (req, res) => {
  try {
    const contact = await AdminContact.findById(req.params.id);

    if (!contact) {
      return sendError(res, { message: 'Contacto no encontrado' }, 404);
    }

    const { historyType, ...historyData } = req.body;

    if (contact.type === 'client') {
      contact.purchaseHistory.push({
        ...historyData,
        date: historyData.date || new Date()
      });
    } else {
      contact.supplyHistory.push({
        ...historyData,
        date: historyData.date || new Date()
      });
    }

    contact.lastContactDate = new Date();
    await contact.save();

    sendSuccess(res, contact, 'Registro agregado al historial');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Eliminar del historial
const removeFromHistory = async (req, res) => {
  try {
    const { id, historyId } = req.params;
    const contact = await AdminContact.findById(id);

    if (!contact) {
      return sendError(res, { message: 'Contacto no encontrado' }, 404);
    }

    if (contact.type === 'client') {
      contact.purchaseHistory.pull(historyId);
    } else {
      contact.supplyHistory.pull(historyId);
    }

    await contact.save();

    sendSuccess(res, contact, 'Registro eliminado del historial');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Obtener estadísticas
const getStats = async (req, res) => {
  try {
    const [stats] = await AdminContact.aggregate([
      {
        $facet: {
          byType: [
            { $match: { isActive: true } },
            { $group: { _id: '$type', count: { $sum: 1 } } }
          ],
          byCategory: [
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          totalClients: [
            { $match: { type: 'client', isActive: true } },
            { $count: 'count' }
          ],
          totalSuppliers: [
            { $match: { type: 'supplier', isActive: true } },
            { $count: 'count' }
          ],
          topClients: [
            { $match: { type: 'client' } },
            { $unwind: { path: '$purchaseHistory', preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: '$_id',
                name: { $first: '$name' },
                totalPurchases: { $sum: '$purchaseHistory.amount' }
              }
            },
            { $sort: { totalPurchases: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    sendSuccess(res, {
      byType: stats.byType,
      byCategory: stats.byCategory,
      totalClients: stats.totalClients[0]?.count || 0,
      totalSuppliers: stats.totalSuppliers[0]?.count || 0,
      topClients: stats.topClients
    });
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  toggleFavorite,
  toggleActive,
  addToHistory,
  removeFromHistory,
  getStats
};
