const AUTH_SESSION_STORAGE_KEY = "training-placement-auth-session";
const AUTH_SESSION_EVENT = "training-placement-auth-session-changed";

function notifySessionChange() {
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

function getAuthSession() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function setAuthSession(session) {
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  notifySessionChange();
}

function clearAuthSession() {
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  notifySessionChange();
}

function updateAuthSession(authPayload) {
  const currentSession = getAuthSession() || {};

  setAuthSession({
    ...currentSession,
    accessToken: authPayload.accessToken,
    accessTokenExpiresAt: authPayload.accessTokenExpiresAt,
    refreshTokenExpiresAt: authPayload.refreshTokenExpiresAt,
    user: authPayload.user,
  });
}

function getAccessToken() {
  return getAuthSession()?.accessToken || "";
}

function getRefreshTokenExpiresAt() {
  return getAuthSession()?.refreshTokenExpiresAt || null;
}

function getAuthenticatedUser() {
  return getAuthSession()?.user || null;
}

function hasActiveSession() {
  return Boolean(getAccessToken() && getRefreshTokenExpiresAt());
}

export {
  AUTH_SESSION_EVENT,
  clearAuthSession,
  getAccessToken,
  getAuthenticatedUser,
  getAuthSession,
  getRefreshTokenExpiresAt,
  hasActiveSession,
  setAuthSession,
  updateAuthSession,
};
