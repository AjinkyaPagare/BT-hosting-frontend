import api from "./api";
 
export type WSHandlers = {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
};
 
const getWsBase = () => {
  const base = (api.defaults as any)?.baseURL || window.location.origin;
  if (base.startsWith("https:")) return base.replace(/^https:/, "wss:");
  if (base.startsWith("http:")) return base.replace(/^http:/, "ws:");
  // fallback to current origin
  const origin = window.location.origin;
  return origin.startsWith("https:") ? origin.replace(/^https:/, "wss:") : origin.replace(/^http:/, "ws:");
};
 
const connect = (path: string, handlers: WSHandlers = {}, retry = true) => {
  let socket: WebSocket | null = null;
  let closedByUser = false;
  let retryDelay = 500; // backoff up to 5s
 
  const open = () => {
    const url = `${getWsBase()}${path}`;
    socket = new WebSocket(url);
 
    socket.onopen = () => {
      handlers.onOpen?.();
      retryDelay = 500;
    };
 
    socket.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        handlers.onMessage?.(data);
      } catch {
        // ignore malformed frames
      }
    };
 
    socket.onclose = (ev) => {
      handlers.onClose?.(ev);
      socket = null;
      if (!closedByUser && retry) {
        setTimeout(open, Math.min(retryDelay, 5000));
        retryDelay = Math.min(retryDelay * 2, 5000);
      }
    };
 
    socket.onerror = (ev) => {
      handlers.onError?.(ev);
    };
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
    connect(`/ws/groups/${encodeURIComponent(groupId)}/${encodeURIComponent(userId)}`, handlers, true),
};
 
 