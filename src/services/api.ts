// src/services/api.ts

import axios, {

  AxiosHeaders,

  type AxiosError,

  type AxiosRequestConfig,

  type RawAxiosRequestHeaders

} from "axios";

/** PRODUCTION-SAFE API URL (set this in .env as VITE_API_BASE) */

// In api.ts
export const BASE_URL = import.meta.env.VITE_API_BASE || "https://c3f7b91ddbcb.ngrok-free.app";
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

    const isAuthEndpoint = path.includes("/auth/login") || path.includes("/auth/signup") || path.includes("/auth");

    const isRefreshEndpoint = path.includes("/auth/refresh");

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

// ==================== Friend Requests ====================

export const friendsApi = {
  // Send friend request
  sendRequest: (receiverId: string) =>
    api.post('/friends/requests', { receiver_id: receiverId }),

  // Get pending friend requests
  getPendingRequests: () =>
    api.get('/friends/requests/pending'),

  // Get sent friend requests
  getSentRequests: () =>
    api.get('/friends/requests/sent'),

  // Accept friend request
  acceptRequest: (requestId: string) =>
    api.post(`/friends/requests/${requestId}/accept`),

  // Reject friend request
  rejectRequest: (requestId: string) =>
    api.post(`/friends/requests/${requestId}/reject`),

  // Block user
  blockUser: (requestId: string) =>
    api.post(`/friends/requests/${requestId}/block`),

  // Get friends list
  getFriendsList: () =>
    api.get('/friends/list'),

  // Get blocked users list
  getBlockedList: () =>
    api.get('/friends/blocked'),
};

// ==================== Video Calls ====================

export interface InitiateCallRequest {
  receiver_id: string;
  call_type: 'audio' | 'video';
}

export interface CallResponse {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'initiated' | 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed';
  duration_seconds?: number;
  initiated_at: string;
  answered_at?: string;
  ended_at?: string;
  is_missed: boolean;
  is_rejected: boolean;
}

export const videoCallsApi = {
  // Initiate a video/audio call
  initiateCall: (data: InitiateCallRequest) =>
    api.post('/calls/initiate', data),

  // Get call details
  getCallDetails: (callId: string) =>
    api.get(`/calls/${callId}`),

  // Accept incoming call
  acceptCall: (callId: string) =>
    api.post(`/calls/${callId}/accept`),

  // Decline incoming call
  declineCall: (callId: string) =>
    api.post(`/calls/${callId}/decline`),

  // End active call
  endCall: (callId: string) =>
    api.post(`/calls/${callId}/end`),

  // Get call history
  getCallHistory: (params?: { limit?: number; offset?: number }) =>
    api.get('/calls/history', { params }),

  // Record WebRTC stats (optional)
  recordCallStats: (callId: string, stats: any) =>
    api.post(`/calls/${callId}/stats`, stats),
};

export default api;