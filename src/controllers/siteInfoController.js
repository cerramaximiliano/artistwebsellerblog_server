const SiteInfo = require('../models/SiteInfo');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { cloudinary } = require('../config/cloudinary');

// Get site info
const getSiteInfo = async (req, res) => {
  try {
    const siteInfo = await SiteInfo.getSiteInfo();
    sendSuccess(res, siteInfo);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Update site info (admin only)
const updateSiteInfo = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // If a profile image was uploaded
    if (req.file) {
      // Get current site info to check for existing image
      const currentSiteInfo = await SiteInfo.getSiteInfo();
      
      // Delete old profile image from Cloudinary if exists
      if (currentSiteInfo.biography?.profileImage?.publicId) {
        try {
          await cloudinary.uploader.destroy(currentSiteInfo.biography.profileImage.publicId);
        } catch (deleteError) {
          console.error('Error deleting old profile image:', deleteError);
        }
      }
      
      // Set new profile image data
      if (!updateData.biography) {
        updateData.biography = {};
      }
      updateData.biography.profileImage = {
        url: req.file.path,
        publicId: req.file.filename,
        alt: updateData.biography?.profileImage?.alt || 'Foto de perfil del artista'
      };
    }
    
    // Update with user info
    const updatedBy = req.user?.email || 'System';
    const siteInfo = await SiteInfo.updateSiteInfo(updateData, updatedBy);
    
    sendSuccess(res, siteInfo, 'Información del sitio actualizada exitosamente');
  } catch (error) {
    // If there was an error and we uploaded an image, delete it
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

// Get biography only
const getBiography = async (req, res) => {
  try {
    const siteInfo = await SiteInfo.getSiteInfo();
    sendSuccess(res, siteInfo.biography);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get contact info only
const getContactInfo = async (req, res) => {
  try {
    const siteInfo = await SiteInfo.getSiteInfo();
    sendSuccess(res, siteInfo.contact);
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  getSiteInfo,
  updateSiteInfo,
  getBiography,
  getContactInfo
};