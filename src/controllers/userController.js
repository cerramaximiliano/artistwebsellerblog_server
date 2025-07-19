const User = require('../models/User');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHandler');

// Get all users (admin)
const getUsers = async (req, res) => {
  try {
    const { role, limit = 20, offset = 0 } = req.query;
    
    let query = {};
    if (role) {
      query.role = role;
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset)),
      User.countDocuments(query)
    ]);
    
    const pagination = {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1
    };
    
    sendPaginatedResponse(res, users, pagination);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken');
    
    if (!user) {
      return sendError(res, { message: 'Usuario no encontrado' }, 404);
    }
    
    sendSuccess(res, user);
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const userId = req.params.id;
    
    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.userId !== userId) {
      return sendError(res, { message: 'No autorizado' }, 403);
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { name, phone, address },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');
    
    if (!user) {
      return sendError(res, { message: 'Usuario no encontrado' }, 404);
    }
    
    sendSuccess(res, user, 'Usuario actualizado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Delete user (admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return sendError(res, { message: 'Usuario no encontrado' }, 404);
    }
    
    sendSuccess(res, null, 'Usuario desactivado exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, { message: 'Usuario no encontrado' }, 404);
    }
    
    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return sendError(res, { message: 'Contraseña actual incorrecta' }, 400);
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    sendSuccess(res, null, 'Contraseña actualizada exitosamente');
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword
};