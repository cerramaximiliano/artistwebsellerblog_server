const DigitalArt = require('../models/DigitalArt');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHandler');

// Get all digital artworks
const getDigitalArtworks = async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0,
      available,
      featured,
      sort = 'newest',
      search
    } = req.query;
    
    // Build query
    const query = {};
    
    if (available !== undefined && available !== 'all') {
      query.available = available === 'true';
    }
    
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { 'sizes.0.price': 1 };
        break;
      case 'price_desc':
        sortOption = { 'sizes.0.price': -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOption = { featured: -1, createdAt: -1 };
    }
    
    // Execute query
    const [digitalArtworks, total] = await Promise.all([
      DigitalArt.find(query)
        .populate('originalArtworkId', 'title artist year images')
        .sort(sortOption)
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      DigitalArt.countDocuments(query)
    ]);
    
    const pagination = {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    };
    
    sendPaginatedResponse(res, digitalArtworks, pagination);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get single digital artwork
const getDigitalArtwork = async (req, res) => {
  try {
    const digitalArt = await DigitalArt
      .findById(req.params.id)
      .populate('originalArtworkId');
    
    if (!digitalArt) {
      return sendError(res, { message: 'Obra digital no encontrada' }, 404);
    }
    
    // Increment views
    digitalArt.views += 1;
    await digitalArt.save();
    
    sendSuccess(res, digitalArt);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Create digital artwork (admin only)
const createDigitalArtwork = async (req, res) => {
  try {
    const digitalArtData = { ...req.body };
    
    // Si originalArtworkId es un string que no es un ObjectId válido,
    // intentar buscar la obra por título
    if (digitalArtData.originalArtworkId && 
        typeof digitalArtData.originalArtworkId === 'string' && 
        !digitalArtData.originalArtworkId.match(/^[0-9a-fA-F]{24}$/)) {
      
      const Artwork = require('../models/Artwork');
      const originalArtwork = await Artwork.findOne({ 
        title: digitalArtData.originalArtworkId 
      });
      
      if (originalArtwork) {
        digitalArtData.originalArtworkId = originalArtwork._id;
        // Si no se proporciona originalTitle, usar el título de la obra encontrada
        if (!digitalArtData.originalTitle) {
          digitalArtData.originalTitle = originalArtwork.title;
        }
      } else {
        return sendError(res, { 
          message: `No se encontró una obra original con el título: "${digitalArtData.originalArtworkId}"` 
        }, 400);
      }
    }
    
    // Validar que originalTitle esté presente
    if (!digitalArtData.originalTitle) {
      return sendError(res, { 
        message: 'El campo originalTitle es requerido' 
      }, 400);
    }
    
    const digitalArt = new DigitalArt(digitalArtData);
    await digitalArt.save();
    
    sendSuccess(res, digitalArt, 'Obra digital creada exitosamente', 201);
  } catch (error) {
    console.log(error)
    sendError(res, error, 400);
  }
};

// Update digital artwork (admin only)
const updateDigitalArtwork = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Si se está actualizando originalArtworkId y es un título en lugar de ID
    if (updateData.originalArtworkId && 
        typeof updateData.originalArtworkId === 'string' && 
        !updateData.originalArtworkId.match(/^[0-9a-fA-F]{24}$/)) {
      
      const Artwork = require('../models/Artwork');
      const originalArtwork = await Artwork.findOne({ 
        title: updateData.originalArtworkId 
      });
      
      if (originalArtwork) {
        updateData.originalArtworkId = originalArtwork._id;
        // Actualizar también el originalTitle si se encontró la obra
        if (!updateData.originalTitle) {
          updateData.originalTitle = originalArtwork.title;
        }
      } else {
        return sendError(res, { 
          message: `No se encontró una obra original con el título: "${updateData.originalArtworkId}"` 
        }, 400);
      }
    }
    
    const digitalArt = await DigitalArt.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!digitalArt) {
      return sendError(res, { message: 'Obra digital no encontrada' }, 404);
    }
    
    sendSuccess(res, digitalArt, 'Obra digital actualizada exitosamente');
  } catch (error) {
    sendError(res, error, 400);
  }
};

// Delete digital artwork (admin only)
const deleteDigitalArtwork = async (req, res) => {
  try {
    const digitalArt = await DigitalArt.findByIdAndDelete(req.params.id);
    
    if (!digitalArt) {
      return sendError(res, { message: 'Obra digital no encontrada' }, 404);
    }
    
    sendSuccess(res, null, 'Obra digital eliminada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get digital artworks by original artwork
const getDigitalArtworksByOriginal = async (req, res) => {
  try {
    const { originalId } = req.params;
    
    const digitalArtworks = await DigitalArt
      .find({ originalArtworkId: originalId, available: true })
      .sort({ version: 1 });
    
    sendSuccess(res, digitalArtworks);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Update availability status (admin only)
const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;
    
    const digitalArt = await DigitalArt.findByIdAndUpdate(
      id,
      { available },
      { new: true }
    );
    
    if (!digitalArt) {
      return sendError(res, { message: 'Obra digital no encontrada' }, 404);
    }
    
    sendSuccess(res, digitalArt, 'Disponibilidad actualizada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Update size availability (admin only)
const updateSizeAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { sizeIndex, available } = req.body;
    
    const digitalArt = await DigitalArt.findById(id);
    
    if (!digitalArt) {
      return sendError(res, { message: 'Obra digital no encontrada' }, 404);
    }
    
    if (!digitalArt.sizes[sizeIndex]) {
      return sendError(res, { message: 'Tamaño no encontrado' }, 404);
    }
    
    digitalArt.sizes[sizeIndex].available = available;
    await digitalArt.save();
    
    sendSuccess(res, digitalArt, 'Disponibilidad del tamaño actualizada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  getDigitalArtworks,
  getDigitalArtwork,
  createDigitalArtwork,
  updateDigitalArtwork,
  deleteDigitalArtwork,
  getDigitalArtworksByOriginal,
  updateAvailability,
  updateSizeAvailability
};