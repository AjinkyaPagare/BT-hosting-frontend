import api from "./api";

export type WSHandlers = {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
};

/** Convert API base URL to WebSocket URL */
const getWsBase = () => {
  // 1️⃣ Use frontend environment variable (works in Next.js/Vite)
  const envBase =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL
      : import.meta?.env?.VITE_API_URL ?? import.meta?.env?.NEXT_PUBLIC_API_URL;

  if (envBase) {
    if (envBase.startsWith("https:")) return envBase.replace("https:", "wss:");
    if (envBase.startsWith("http:")) return envBase.replace("http:", "ws:");
  }

  // 2️⃣ Fallback to axios base URL (DEV)
  const axiosBase = (api.defaults as any)?.baseURL;
  if (axiosBase) {
    if (axiosBase.startsWith("https:")) return axiosBase.replace("https:", "wss:");
    if (axiosBase.startsWith("http:")) return axiosBase.replace("http:", "ws:");
  }

  // 3️⃣ Final fallback: the browser origin
  const origin = window.location.origin;
  return origin.startsWith("https:")
    ? origin.replace("https:", "wss:")
    : origin.replace("http:", "ws:");
};

const connect = (path: string, handlers: WSHandlers = {}, retry = true) => {
  let socket: WebSocket | null = null;
  let closedByUser = false;
  let retryDelay = 500; // exponential backoff up to 5s

  const open = () => {
    const base = getWsBase().replace(/\/+$/, "");  // remove trailing slash
    const url = `${base}${path}`;

    socket = new WebSocket(url);

    socket.onopen = () => {
      handlers.onOpen?.();
      retryDelay = 500;
    };

    socket.onmessage = (evt) => {
      try {
        handlers.onMessage?.(JSON.parse(evt.data));
      } catch {
        console.warn("Invalid WS frame:", evt.data);
      }
    };

    socket.onclose = (ev) => {
      handlers.onClose?.(ev);
      socket = null;

      if (!closedByUser && retry) {
        setTimeout(open, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 5000);
      }
    };

    socket.onerror = (ev) => handlers.onError?.(ev);
  };

  open();

  return {
    send: (msg: any) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
    close: () => {
      closedByUser = true;
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
      socket = null;
    },
    isOpen: () => !!socket && socket.readyState === WebSocket.OPEN,
  };
};

export const wsService = {
  connectDirect: (userId: string, handlers: WSHandlers = {}) =>
    connect(`/ws/chat/${encodeURIComponent(userId)}`, handlers, true),

  connectGroup: (groupId: string, userId: string, handlers: WSHandlers = {}) =>
    connect(
      `/ws/groups/${encodeURIComponent(groupId)}/${encodeURIComponent(userId)}`,
      handlers,
      true
    ),
};
