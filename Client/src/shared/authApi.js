import { apiClient, publicApi, refreshAuthSession } from "./apiClient";
import { clearAuthSession, updateAuthSession } from "./authSession";

export async function signupUser(payload) {
  const response = await publicApi.post("/student/signup", payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await publicApi.post("/student/login", payload);
  updateAuthSession(response.data);
  return response.data;
}

export async function continueUserSession() {
  return refreshAuthSession();
}

export async function logoutUser() {
  try {
    await apiClient.post("/student/logout", {}, { skipAuthRefresh: true });
  } finally {
    clearAuthSession();
  }
}
