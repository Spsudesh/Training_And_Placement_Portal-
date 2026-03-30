const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || 'development-access-secret-change-me';

function extractBearerToken(req) {
  const authorizationHeader = req.headers.authorization || '';

  if (!authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

function requireAuth(req, res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  try {
    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.auth = decodedToken;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Access token expired.' : 'Invalid access token.',
    });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth?.role || !allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this resource.',
      });
    }

    return next();
  };
}

function requireStudentOwnership(req, res, next) {
  if (req.auth?.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can access this resource.',
    });
  }

  const targetPrn =
    req.params.prn ||
    req.body?.prn ||
    req.body?.PRN ||
    req.query?.prn ||
    '';

  if (String(targetPrn || '').trim() !== String(req.auth.prn || '').trim()) {
    return res.status(403).json({
      success: false,
      message: 'You can access only your own records.',
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireStudentOwnership,
};
