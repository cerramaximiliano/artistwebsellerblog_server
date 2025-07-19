const { cloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, { message: 'No se ha proporcionado ninguna imagen' }, 400);
    }

    sendSuccess(res, {
      url: req.file.path,
      publicId: req.file.filename
    }, 'Imagen subida exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    
    await cloudinary.uploader.destroy(id);
    
    sendSuccess(res, null, 'Imagen eliminada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  uploadImage,
  deleteImage
};