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
    console.log('❌ Auth Middleware: No token provided');
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  try {
    const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    console.log('✅ Auth Middleware: Token valid for user:', decodedToken.userId, 'Role:', decodedToken.role);
    req.auth = decodedToken;
    return next();
  } catch (error) {
    console.log('❌ Auth Middleware: Token verification failed:', error.message);
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

function requireTPCDepartmentAccess(req, res, next) {
  if (req.auth?.role !== 'tpc') {
    return res.status(403).json({
      success: false,
      message: 'Only TPC users can access this resource.',
    });
  }

  // Optional: Check if department from request matches user's department
  const targetDepartment =
    req.params.department ||
    req.body?.department ||
    req.query?.department ||
    '';

  if (targetDepartment && String(targetDepartment).trim() !== String(req.auth.department || '').trim()) {
    return res.status(403).json({
      success: false,
      message: 'You can only access data for your assigned department.',
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireStudentOwnership,
  requireTPCDepartmentAccess,
};
