import axios, { AxiosHeaders, type AxiosError, type AxiosRequestConfig, type RawAxiosRequestHeaders } from "axios";

const BASE_URL = "http://localhost:8000";

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
  const token = localStorage.getItem("authToken");
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
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken && !originalRequest._retry && !isAuthEndpoint && !isRefreshEndpoint) {
        originalRequest._retry = true;
        try {
          const { data } = await refreshClient.post("/refresh", { refresh_token: refreshToken });
          const { access_token, refresh_token } = data as { access_token: string; refresh_token: string };
          localStorage.setItem("authToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);

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

      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
