// src/services/api.ts

import axios, {

  AxiosHeaders,

  type AxiosError,

  type AxiosRequestConfig,

  type RawAxiosRequestHeaders

} from "axios";
 
/** PRODUCTION-SAFE API URL (set this in .env as VITE_API_BASE) */

export const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";
 
/** Optionally enable withCredentials via env (set VITE_API_WITH_CREDENTIALS=true) */

const USE_CREDENTIALS = (import.meta.env.VITE_API_WITH_CREDENTIALS || "false") === "true";
 
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

    window.localStorage.setItem(key, value);

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
 
/** Extend AxiosRequestConfig with retry flag */

interface AuthenticatedRequestConfig extends AxiosRequestConfig {

  _retry?: boolean;
}
 
/** Axios for API */

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: USE_CREDENTIALS,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});
 
/** Axios for refresh token */

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: USE_CREDENTIALS,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});
 
/** Helper to safely set Authorization header */

function setAuthHeader(headers: AxiosRequestConfig["headers"], token: string) {

  const newHeaders =

    headers instanceof AxiosHeaders

      ? headers

      : new AxiosHeaders(headers as RawAxiosRequestHeaders);

  newHeaders.set("Authorization", `Bearer ${token}`);

  return newHeaders;

}
 
/** Add authorization token to outgoing requests */

api.interceptors.request.use((config) => {

  try {

    const token = tokenStorage.get(ACCESS_TOKEN_KEY);

    if (token) {

      config.headers = setAuthHeader(config.headers, token);

    }

  } catch (e) {

    // ignore header set errors

  }

  return config;

});
 
/** Robust response interceptor with refresh-token handling */

api.interceptors.response.use(

  (response) => response,

  async (error: AxiosError) => {

    const originalRequest = (error.config as AuthenticatedRequestConfig) || undefined;

    if (!originalRequest) return Promise.reject(error);
 
    // Helper: get pathname from url (handles absolute and relative)

    const getPath = (url?: string | null) => {

      if (!url) return "";

      try {

        // If url is absolute, new URL parses directly; if relative, use BASE_URL as base

        const parsed = new URL(url, BASE_URL);

        return parsed.pathname || "";

      } catch {

        return url || "";

      }

    };
 
    const path = getPath(originalRequest.url);

    const isAuthEndpoint = path.includes("/login") || path.includes("/signup") || path.includes("/auth");

    const isRefreshEndpoint = path.includes("/refresh");
 
    // Only attempt refresh on 401 and when we haven't retried yet

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint && !isRefreshEndpoint) {

      const refreshToken = tokenStorage.get(REFRESH_TOKEN_KEY);
 
      if (refreshToken) {

        originalRequest._retry = true;
 
        try {

          const resp = await refreshClient.post("/refresh", {

            refresh_token: refreshToken,

          });
 
          const data = resp.data as {

            access_token?: string;

            refresh_token?: string;

            [key: string]: any;

          };
 
          const access_token = data.access_token || data.accessToken || data.token;

          const refresh_token = data.refresh_token || data.refreshToken;
 
          if (!access_token) {

            // If refresh response doesn't contain token, fallthrough to logout

            throw new Error("No access token in refresh response");

          }
 
          // save tokens (if provided)

          tokenStorage.set(ACCESS_TOKEN_KEY, access_token);

          if (refresh_token) {

            tokenStorage.set(REFRESH_TOKEN_KEY, refresh_token);

          }
 
          // update original request header and retry

          originalRequest.headers = setAuthHeader(originalRequest.headers, access_token);
 
          return api(originalRequest);

        } catch (refreshError) {

          // refresh failed -> clear auth and fallthrough to redirect/logout below

          console.warn("Token refresh failed:", refreshError);

        }

      }
 
      // If we reach here, either no refresh token or refresh failed

      tokenStorage.clearAuth();

      if (isBrowser) {

        // redirect to login page

        try {

          // preserve current location if you want: window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;

          window.location.href = "/login";

        } catch {

          // ignore redirect errors (non-browser)

        }

      }

    }
 
    return Promise.reject(error);

  }

);
 
export default api;

 