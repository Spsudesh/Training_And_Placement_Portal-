const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || 'development-access-secret-change-me';
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || 'development-refresh-secret-change-me';
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '6h';
const REFRESH_COOKIE_NAME = 'training_placement_refresh_token';
const REFRESH_TOKEN_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function createTokenPayload(user) {
  const payload = {
    prn: String(user.PRN || user.prn || ''),
    email: user.email,
    role: user.role,
  };

  // Include department for TPC users
  if (user.role === 'tpc' && user.department) {
    payload.department = String(user.department || '');
  }

  return payload;
}

function createAccessToken(user) {
  return jwt.sign(createTokenPayload(user), ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

function createRefreshToken(user) {
  return jwt.sign(createTokenPayload(user), REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function decodeExpiry(token) {
  const decodedToken = jwt.decode(token);
  return decodedToken?.exp ? decodedToken.exp * 1000 : null;
}

function createAuthResponse(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  const responseUser = {
    PRN: String(user.PRN || user.prn || ''),
    email: user.email,
    role: user.role,
    isProfileVerified: Boolean(user.is_profile_verified),
    isProfileFormSubmitted: Boolean(user.is_profile_form_submitted),
    profileFormLastCompletedStep: user.profileFormLastCompletedStep || null,
    profileFormNextStep: user.profileFormNextStep || null,
  };

  // Include department for TPC users
  if (user.role === 'tpc' && user.department) {
    responseUser.department = String(user.department || '');
  }

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: decodeExpiry(accessToken),
    refreshTokenExpiresAt: decodeExpiry(refreshToken),
    user: responseUser,
  };
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

function getRefreshCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/',
  };
}

function attachRefreshTokenCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...getRefreshCookieOptions(),
    maxAge: undefined,
  });
}

function getRefreshTokenFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';

  if (!cookieHeader) {
    return '';
  }

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split('=');

    if (name === REFRESH_COOKIE_NAME) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return '';
}

module.exports = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
  createAuthResponse,
  getRefreshTokenFromRequest,
  verifyRefreshToken,
};
