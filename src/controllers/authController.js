const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' }, 401);
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return sendError(res, { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' }, 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Update user refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    sendSuccess(res, {
      user: user.toJSON(),
      token: accessToken,
      refreshToken
    }, 'Login exitoso');
  } catch (error) {
    sendError(res, error, 500);
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    sendSuccess(res, null, 'Logout exitoso');
  } catch (error) {
    sendError(res, error, 500);
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, { message: 'Refresh token requerido' }, 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    
    // Find user and check refresh token
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, { message: 'Invalid refresh token' }, 401);
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

    sendSuccess(res, {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    sendError(res, error, 401);
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return sendError(res, { message: 'Usuario no encontrado' }, 404);
    }
    sendSuccess(res, { user: user.toJSON() });
  } catch (error) {
    sendError(res, error, 500);
  }
};

module.exports = {
  login,
  logout,
  refresh,
  me
};