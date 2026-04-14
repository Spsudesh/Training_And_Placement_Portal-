const express = require('express');
const bcrypt = require('bcrypt');
const {
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
  createAuthResponse,
  getRefreshTokenFromRequest,
  verifyRefreshToken,
} = require('../../utils/tokenService');
const router = express.Router();
const db = require('../../config/db').db;

const SALT_ROUNDS = 12;
const ALLOWED_EMAIL_DOMAIN = '@ritindia.edu';

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function isAllowedInstitutionEmail(email) {
  return normalizeEmail(email).endsWith(ALLOWED_EMAIL_DOMAIN);
}

function buildLoginResponse(res, user, message = 'Login successful.') {
  const authPayload = createAuthResponse(user);
  const refreshToken = getRefreshTokenFromAuthPayload(authPayload);

  attachRefreshTokenCookie(res, refreshToken);

  return {
    success: true,
    message,
    ...sanitizeAuthPayload(authPayload),
  };
}

function getRefreshTokenFromAuthPayload(authPayload) {
  return authPayload.refreshToken || '';
}

function sanitizeAuthPayload(authPayload) {
  const { refreshToken, ...publicAuthPayload } = authPayload;
  return publicAuthPayload;
}

// TPC Login endpoint
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '').trim();
  const normalizedRole = String(role || 'tpc').trim().toLowerCase();

  if (normalizedRole !== 'tpc') {
    return res.status(403).json({
      success: false,
      message: 'Selected role is not allowed for TPC login.',
    });
  }

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  if (!isAllowedInstitutionEmail(normalizedEmail)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  try {
    const promiseDb = db.promise();
    const [rows] = await promiseDb.query(
      `SELECT id, email, password, department_name, is_active
       FROM TPC_Credentials
       WHERE LOWER(email) = ?
       LIMIT 1`,
      [normalizedEmail],
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact the administrator.',
      });
    }

    const passwordMatches = await bcrypt.compare(normalizedPassword, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Build response for TPC user with department information
    const tpcUser = {
      PRN: String(user.id || ''),
      email: user.email,
      role: 'tpc',
      department: user.department_name,
      is_profile_verified: 1,
      is_profile_form_submitted: true,
    };

    return res.json(buildLoginResponse(res, tpcUser));
  } catch (error) {
    console.error('TPC Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to login.',
      error: error.message,
    });
  }
});

// Refresh token endpoint for TPC
router.post('/refresh', async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required.',
    });
  }

  try {
    const decodedToken = verifyRefreshToken(refreshToken);

    if (decodedToken.role !== 'tpc') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token for TPC.',
      });
    }

    const promiseDb = db.promise();
    const [rows] = await promiseDb.query(
      `SELECT id, email, department_name, is_active
       FROM TPC_Credentials
       WHERE LOWER(email) = ? AND id = ?
       LIMIT 1`,
      [normalizeEmail(decodedToken.email), decodedToken.prn],
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    const user = rows[0];
    const tpcUser = {
      PRN: String(user.id || ''),
      email: user.email,
      role: 'tpc',
      department: user.department_name,
      is_profile_verified: 1,
      is_profile_form_submitted: true,
    };

    return res.json(buildLoginResponse(res, tpcUser));
  } catch (error) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({
      success: false,
      message: 'Refresh token expired or invalid.',
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  clearRefreshTokenCookie(res);
  return res.json({
    success: true,
    message: 'Logout successful.',
  });
});

module.exports = router;
