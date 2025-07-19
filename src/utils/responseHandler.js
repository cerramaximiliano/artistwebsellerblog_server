const sendSuccess = (res, data, message = 'Operación exitosa', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

const sendError = (res, error, statusCode = 400) => {
  const errorResponse = {
    success: false,
    error: {
      code: error.code || 'ERROR',
      message: error.message || 'Ha ocurrido un error'
    }
  };

  res.status(statusCode).json(errorResponse);
};

const sendPaginatedResponse = (res, data, pagination) => {
  res.status(200).json({
    success: true,
    data,
    pagination
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedResponse
};