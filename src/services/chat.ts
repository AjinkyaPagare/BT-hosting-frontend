import api from "./api";
import { filesService } from "./files";
import type { Message } from "@/types";

export interface SendDirectMessageRequest {
  user_id: string;
  receiver_id: string;
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
}

export interface SendGroupMessageRequest {
  user_id: string;
  group_id: string;
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
}

export interface BackendMessage {
  id: string;
  sender_id: string;
  receiver_id?: string | null;
  group_id?: string | null;
  content?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  timestamp?: string;
}

const isImage = (mime?: string | null) => {
  if (!mime) return false;
  return mime.startsWith("image/");
};

const lastSegment = (p?: string | null) => {
  if (!p) return "";
  return p.split(/\/|\\/g).pop() || "";
};

export const mapBackendToUi = (m: BackendMessage): Message => {
  const hasFile = Boolean(m.file_url);
  const stored = lastSegment(m.file_url || undefined);
  const viewUrl = stored ? filesService.viewUrl(stored) : undefined;

  let type: Message["type"] = "text";
  if (hasFile) {
    type = isImage(m.file_type) ? "image" : "file";
  }

  return {
    id: String(m.id),
    chatId: m.group_id
      ? String(m.group_id)
      : String(m.receiver_id), // direct chat fallback
    senderId: String(m.sender_id),
    content: m.content ?? "",
    type,
    fileUrl: viewUrl,
    fileName: m.file_name ?? stored,
    timestamp: m.timestamp ?? new Date().toISOString(),
    isRead: false,
    isDelivered: true,
  };
};

export const chatService = {
  /** Fetch direct chat messages */
  listDirectMessages: async (receiverId: string): Promise<Message[]> => {
    const { data } = await api.get<BackendMessage[]>(`/chat/direct/${receiverId}`);
    return data.map(mapBackendToUi);
  },

  /** Send direct chat message */
  sendDirectMessage: async (payload: SendDirectMessageRequest): Promise<Message> => {
    const { data } = await api.post<BackendMessage>(`/chat/messages`, payload);
    return mapBackendToUi(data);
  },

  /** Edit direct chat */
  updateDirectMessage: async (messageId: string, content: string): Promise<Message> => {
    const { data } = await api.patch<BackendMessage>(`/chat/messages/${messageId}`, { content });
    return mapBackendToUi(data);
  },

  /** Delete direct */
  deleteDirectMessage: async (messageId: string): Promise<{ success: boolean }> => {
    await api.delete(`/chat/messages/${messageId}`);
    return { success: true };
  },

  /** Fetch group chat */
  listGroupMessages: async (groupId: string): Promise<Message[]> => {
    const { data } = await api.get<BackendMessage[]>(`/chat/groups/${groupId}/messages`);
    return data.map(mapBackendToUi);
  },

  /** Send group chat */
  sendGroupMessage: async (payload: SendGroupMessageRequest): Promise<Message> => {
    const { data } = await api.post<BackendMessage>(`/chat/groups/messages`, payload);
    return mapBackendToUi(data);
  },

  /** Edit group */
  updateGroupMessage: async (messageId: string, content: string): Promise<Message> => {
    const { data } = await api.patch<BackendMessage>(`/chat/groups/messages/${messageId}`, { content });
    return mapBackendToUi(data);
  },

  /** Delete group */
  deleteGroupMessage: async (messageId: string): Promise<{ success: boolean }> => {
    await api.delete(`/chat/groups/messages/${messageId}`);
    return { success: true };
  },
};
