import axios from "axios";
import {
  clearAuthSession,
  getAccessToken,
  getAuthenticatedUser,
  updateAuthSession,
} from "./authSession";

const API_ROOT = "http://localhost:3000";

const publicApi = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
});

const apiClient = axios.create({
  baseURL: API_ROOT,
  withCredentials: true,
});

let refreshRequestPromise = null;

async function performRefresh() {
  const user = getAuthenticatedUser();
  const endpoint =
    user?.role === 'tpc'
      ? '/tpc/refresh'
      : user?.role === 'tpo'
        ? '/tpo/refresh'
        : '/student/refresh';
  const response = await publicApi.post(endpoint, {}, { skipAuthRefresh: true });

  updateAuthSession(response.data);
  return response.data;
}

export async function refreshAuthSession() {
  if (!refreshRequestPromise) {
    refreshRequestPromise = performRefresh().finally(() => {
      refreshRequestPromise = null;
    });
  }

  return refreshRequestPromise;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error?.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshedSession = await refreshAuthSession();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAuthSession();
      return Promise.reject(refreshError);
    }
  },
);

export { apiClient, publicApi };
