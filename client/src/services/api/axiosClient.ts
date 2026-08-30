import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { RefreshResponse } from '../../types/auth.types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// In-memory access token storage
let currentAccessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;
let onAuthFailureCallback: (() => void) | null = null;

export const setAuthToken = (token: string | null): void => {
  currentAccessToken = token;
};

export const getAuthToken = (): string | null => {
  return currentAccessToken;
};

export const setOnAuthFailure = (callback: () => void): void => {
  onAuthFailureCallback = callback;
};

export const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 45000, // 45-second client timeout to accommodate Render free-tier cold starts
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send httpOnly cookies with requests
});

// Request Interceptor: Attach Access Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (currentAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 with Automatic Token Refresh & Retry
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If unauthorized and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh') ||
        originalRequest.url?.includes('/auth/register');

      // Do not try to refresh on login/register failures or refresh failures
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Shared in-flight promise to prevent concurrent refresh races
        if (!refreshPromise) {
          refreshPromise = axios
            .post<RefreshResponse>(
              `${apiBaseUrl}/auth/refresh`,
              {},
              { withCredentials: true }
            )
            .then((res) => {
              const newToken = res.data.data.accessToken;
              setAuthToken(newToken);
              return newToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newToken = await refreshPromise;

        // Update headers and retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Refresh token invalid or expired
        setAuthToken(null);
        if (onAuthFailureCallback) {
          onAuthFailureCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
