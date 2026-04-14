import { apiClient, publicApi, refreshAuthSession } from "./apiClient";
import { clearAuthSession, getAuthenticatedUser, updateAuthSession } from "./authSession";

export async function signupUser(payload) {
  const response = await publicApi.post("/student/signup", payload);
  return response.data;
}

export async function loginUser(payload) {
  const endpoint =
    payload.role === 'tpc'
      ? '/tpc/login'
      : payload.role === 'tpo'
        ? '/tpo/login'
        : '/student/login';
  const response = await publicApi.post(endpoint, payload);
  updateAuthSession(response.data);
  return response.data;
}

export async function continueUserSession() {
  return refreshAuthSession();
}

export async function logoutUser() {
  const user = getAuthenticatedUser();
  const endpoint =
    user?.role === 'tpc'
      ? '/tpc/logout'
      : user?.role === 'tpo'
        ? '/tpo/logout'
        : '/student/logout';

  try {
    await apiClient.post(endpoint, {}, { skipAuthRefresh: true });
  } finally {
    clearAuthSession();
  }
}
