const express = require('express');
const {
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
  createAuthResponse,
  getRefreshTokenFromRequest,
  verifyRefreshToken,
} = require('../../utils/tokenService');

const router = express.Router();

const STATIC_TPO_ACCOUNT = {
  PRN: process.env.TPO_PRN || 'TPO001',
  email: String(process.env.TPO_EMAIL || 'tpo@ritindia.edu').trim().toLowerCase(),
  password: String(process.env.TPO_PASSWORD || 'TPO').trim(),
  role: 'tpo',
  is_profile_verified: 1,
  is_profile_form_submitted: true,
  is_active: 1,
};

function normalizeEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function buildLoginResponse(res, user, message = 'Login successful.') {
  const authPayload = createAuthResponse(user);
  const refreshToken = authPayload.refreshToken || '';

  attachRefreshTokenCookie(res, refreshToken);

  const { refreshToken: _refreshToken, ...publicAuthPayload } = authPayload;
  return {
    success: true,
    message,
    ...publicAuthPayload,
  };
}

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || '').trim();
  const normalizedRole = String(role || 'tpo').trim().toLowerCase();

  if (normalizedRole !== 'tpo') {
    return res.status(403).json({
      success: false,
      message: 'Selected role is not allowed for TPO login.',
    });
  }

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
    });
  }

  if (
    normalizedEmail !== STATIC_TPO_ACCOUNT.email ||
    normalizedPassword !== STATIC_TPO_ACCOUNT.password
  ) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  return res.json(buildLoginResponse(res, STATIC_TPO_ACCOUNT));
});

router.post('/refresh', async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required.',
    });
  }

  try {
    const decodedToken = verifyRefreshToken(refreshToken);

    if (
      decodedToken.role !== 'tpo' ||
      normalizeEmail(decodedToken.email) !== STATIC_TPO_ACCOUNT.email ||
      String(decodedToken.prn || '') !== String(STATIC_TPO_ACCOUNT.PRN)
    ) {
      clearRefreshTokenCookie(res);
      return res.status(403).json({
        success: false,
        message: 'Invalid token for TPO.',
      });
    }

    return res.json(buildLoginResponse(res, STATIC_TPO_ACCOUNT, 'Session refreshed successfully.'));
  } catch (error) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Refresh token expired.' : 'Invalid refresh token.',
    });
  }
});

router.post('/logout', (req, res) => {
  clearRefreshTokenCookie(res);

  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

module.exports = router;
