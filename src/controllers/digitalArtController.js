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
    const digitalArt = new DigitalArt(req.body);
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
    const digitalArt = await DigitalArt.findByIdAndUpdate(
      req.params.id,
      req.body,
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