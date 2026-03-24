const multer = require('multer');

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 400 : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File size exceeds the 10MB limit.'
          : err.message,
    });
  }

  if (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }

  next();
}

module.exports = errorHandler;
