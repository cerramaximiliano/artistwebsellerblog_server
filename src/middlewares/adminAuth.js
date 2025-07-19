const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acceso denegado. Se requieren permisos de administrador.'
        }
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al verificar permisos'
      }
    });
  }
};

module.exports = adminAuth;