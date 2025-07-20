const Artwork = require('../models/Artwork');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHandler');
const { cloudinary } = require('../config/cloudinary');

// Get all artworks with filters
const getArtworks = async (req, res) => {
  try {
    const {
      category,
      search,
      available,
      limit = 20,
      offset = 0,
      sort = 'newest'
    } = req.query;

    // Build query
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (available !== undefined) {
      query['status.isAvailable'] = available === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price_asc':
        sortOption = { 'pricing.finalPrice': 1 };
        break;
      case 'price_desc':
        sortOption = { 'pricing.finalPrice': -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query with pagination
    const [artworks, total] = await Promise.all([
      Artwork.find(query)
        .sort(sortOption)
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      Artwork.countDocuments(query)
    ]);

    const pagination = {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    };

    sendPaginatedResponse(res, artworks, pagination);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get single artwork
const getArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return sendError(res, { message: 'Obra no encontrada' }, 404);
    }

    // Increment views
    artwork.views += 1;
    await artwork.save();

    sendSuccess(res, artwork);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Create artwork (admin only)
const createArtwork = async (req, res) => {
  try {
    // Validate Cloudinary configuration if image is being uploaded
    if (req.file && !process.env.CLOUDINARY_CLOUD_NAME) {
      return sendError(res, { 
        message: 'Cloudinary no está configurado correctamente. Verifica las variables de entorno.' 
      }, 500);
    }
    
    const artworkData = { ...req.body };
    
    // If an image was uploaded via multer
    if (req.file) {
      // The image is already uploaded to Cloudinary by multer
      artworkData.images = {
        main: {
          url: req.file.path, // Cloudinary URL
          publicId: req.file.filename // Cloudinary public ID
        },
        thumbnail: {
          url: req.file.path.replace('/upload/', '/upload/c_thumb,w_300,h_300/'),
          publicId: req.file.filename
        },
        gallery: []
      };
    } else if (req.body.imageUrl) {
      // If image URL is provided directly (for compatibility)
      artworkData.images = {
        main: {
          url: req.body.imageUrl,
          publicId: extractCloudinaryPublicId(req.body.imageUrl)
        },
        thumbnail: {
          url: req.body.thumbnailUrl || req.body.imageUrl.replace('/upload/', '/upload/c_thumb,w_300,h_300/'),
          publicId: extractCloudinaryPublicId(req.body.imageUrl)
        },
        gallery: []
      };
    }
    
    // Generate SEO slug if not provided
    if (!artworkData.seo?.slug) {
      const baseSlug = generateSlug(artworkData.title);
      const uniqueSlug = await generateUniqueSlug(baseSlug);
      
      artworkData.seo = {
        ...artworkData.seo,
        slug: uniqueSlug,
        metaTitle: artworkData.title,
        metaDescription: artworkData.description
      };
    } else {
      // If slug is provided, ensure it's unique
      artworkData.seo.slug = await generateUniqueSlug(artworkData.seo.slug);
    }
    
    const artwork = new Artwork(artworkData);
    await artwork.save();
    sendSuccess(res, artwork, 'Obra creada exitosamente', 201);
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error('Error deleting image after failed artwork creation:', deleteError);
      }
    }
    sendError(res, error, 500);
  }
};

// Helper function to extract Cloudinary public ID
function extractCloudinaryPublicId(url) {
  if (!url) return null;
  const matches = url.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : null;
}

// Helper function to generate slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

// Helper function to ensure unique slug
async function generateUniqueSlug(baseSlug, artworkId = null) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    // Check if slug exists (excluding current artwork if updating)
    const query = { 'seo.slug': slug };
    if (artworkId) {
      query._id = { $ne: artworkId };
    }
    
    const existing = await Artwork.findOne(query);
    if (!existing) {
      return slug;
    }
    
    // Generate new slug with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 100) {
      // Use timestamp as last resort
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  
  return slug;
}

// Update artwork (admin only)
const updateArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return sendError(res, { message: 'Obra no encontrada' }, 404);
    }
    
    const updateData = { ...req.body };
    
    // If a new image was uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (artwork.images?.main?.publicId) {
        try {
          await cloudinary.uploader.destroy(artwork.images.main.publicId);
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }
      
      // Set new image data
      updateData.images = {
        main: {
          url: req.file.path,
          publicId: req.file.filename
        },
        thumbnail: {
          url: req.file.path.replace('/upload/', '/upload/c_thumb,w_300,h_300/'),
          publicId: req.file.filename
        },
        gallery: artwork.images?.gallery || []
      };
    }
    
    // Check if SEO slug is being updated
    if (updateData.seo?.slug) {
      // Ensure the new slug is unique (excluding current artwork)
      updateData.seo.slug = await generateUniqueSlug(updateData.seo.slug, req.params.id);
    }
    
    // Update the artwork
    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    sendSuccess(res, updatedArtwork, 'Obra actualizada exitosamente');
  } catch (error) {
    // If there was an error and we uploaded a new image, delete it
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error('Error deleting image after failed update:', deleteError);
      }
    }
    sendError(res, error, 500);
  }
};

// Delete artwork (admin only)
const deleteArtwork = async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);

    if (!artwork) {
      return sendError(res, { message: 'Obra no encontrada' }, 404);
    }

    // Delete images from Cloudinary
    if (artwork.images?.main?.publicId) {
      try {
        await cloudinary.uploader.destroy(artwork.images.main.publicId);
      } catch (deleteError) {
        console.error('Error deleting main image:', deleteError);
      }
    }
    
    // Delete gallery images if any
    if (artwork.images?.gallery?.length > 0) {
      for (const image of artwork.images.gallery) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (deleteError) {
            console.error('Error deleting gallery image:', deleteError);
          }
        }
      }
    }

    // Delete the artwork from database
    await artwork.deleteOne();

    sendSuccess(res, null, 'Obra eliminada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Update artwork status (admin only)
const updateArtworkStatus = async (req, res) => {
  try {
    const { isAvailable, isSold, isReserved } = req.body;
    
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return sendError(res, { message: 'Obra no encontrada' }, 404);
    }

    // Update status
    if (isAvailable !== undefined) artwork.status.isAvailable = isAvailable;
    if (isSold !== undefined) artwork.status.isSold = isSold;
    if (isReserved !== undefined) artwork.status.isReserved = isReserved;

    await artwork.save();
    
    sendSuccess(res, artwork, 'Estado actualizado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  getArtworks,
  getArtwork,
  createArtwork,
  updateArtwork,
  deleteArtwork,
  updateArtworkStatus
};