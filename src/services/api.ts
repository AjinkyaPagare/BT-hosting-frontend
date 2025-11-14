import axios, { AxiosHeaders, type AxiosError, type AxiosRequestConfig, type RawAxiosRequestHeaders } from "axios";

const BASE_URL = "http://localhost:8000";

export const ACCESS_TOKEN_KEY = "authToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

const isBrowser = typeof window !== "undefined";

export const tokenStorage = {
  get: (key: string): string | null => {
    if (!isBrowser) return null;
    const sessionValue = window.sessionStorage.getItem(key);
    if (sessionValue) {
      return sessionValue;
    }
    return window.localStorage.getItem(key);
  },
  set: (key: string, value: string) => {
    if (!isBrowser) return;
    window.sessionStorage.setItem(key, value);
    window.localStorage.removeItem(key);
  },
  remove: (key: string) => {
    if (!isBrowser) return;
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  },
  clearAuth: () => {
    if (!isBrowser) return;
    tokenStorage.remove(ACCESS_TOKEN_KEY);
    tokenStorage.remove(REFRESH_TOKEN_KEY);
  },
};

interface AuthenticatedRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get(ACCESS_TOKEN_KEY);
  if (token) {
    const headers = config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers as RawAxiosRequestHeaders);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AuthenticatedRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest) {
      const isAuthEndpoint = originalRequest.url?.includes("/login") || originalRequest.url?.includes("/signup");
      const isRefreshEndpoint = originalRequest.url?.includes("/refresh");
      const refreshToken = tokenStorage.get(REFRESH_TOKEN_KEY);

      if (refreshToken && !originalRequest._retry && !isAuthEndpoint && !isRefreshEndpoint) {
        originalRequest._retry = true;
        try {
          const { data } = await refreshClient.post("/refresh", { refresh_token: refreshToken });
          const { access_token, refresh_token } = data as { access_token: string; refresh_token: string };
          tokenStorage.set(ACCESS_TOKEN_KEY, access_token);
          tokenStorage.set(REFRESH_TOKEN_KEY, refresh_token);

          const headers = originalRequest.headers instanceof AxiosHeaders
            ? originalRequest.headers
            : new AxiosHeaders(originalRequest.headers as RawAxiosRequestHeaders);
          headers.set("Authorization", `Bearer ${access_token}`);
          originalRequest.headers = headers;

          return api(originalRequest);
        } catch (refreshError) {
          // fall through to logout behaviour
        }
      }

      tokenStorage.clearAuth();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
