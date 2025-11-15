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
  timestamp?: string; // iso
}
 
const isImage = (mime?: string | null) => {
  if (!mime) return false;
  return mime.startsWith("image/");
};
 
const lastSegment = (p?: string | null) => {
  if (!p) return "";
  const parts = p.split(/\\\\|\//g);
  return parts[parts.length - 1] || "";
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
    chatId: String(m.group_id || m.receiver_id || m.sender_id || ""),
    senderId: String(m.sender_id),
    content: m.content || "",
    type,
    fileUrl: viewUrl,
    fileName: m.file_name || undefined,
    timestamp: m.timestamp || new Date().toISOString(),
    isRead: false,
    isDelivered: true,
  };
};
 
export const chatService = {
  // Direct messages
  listDirectMessages: async (otherUserId: string, limit = 200, offset = 0): Promise<Message[]> => {
    const { data } = await api.get<BackendMessage[] | { data?: BackendMessage[] }>(
      `/chat/direct/${otherUserId}`,
      { params: { limit, offset } }
    );
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    return list.map(mapBackendToUi);
  },
 
  sendDirectMessage: async (payload: SendDirectMessageRequest): Promise<Message> => {
    const { data } = await api.post<BackendMessage>(`/chat/messages`, payload);
    return mapBackendToUi(data as any);
  },
 
  updateDirectMessage: async (messageId: string, content: string): Promise<Message> => {
    const { data } = await api.patch<BackendMessage>(`/chat/messages/${messageId}`, { content });
    return mapBackendToUi(data as any);
  },
 
  deleteDirectMessage: async (messageId: string): Promise<{ success: boolean }> => {
    await api.delete(`/chat/messages/${messageId}`);
    return { success: true };
  },
 
  // Group messages
  listGroupMessages: async (groupId: string, limit = 500, offset = 0): Promise<Message[]> => {
    const { data } = await api.get<BackendMessage[] | { data?: BackendMessage[] }>(
      `/chat/groups/${groupId}/messages`,
      { params: { limit, offset } }
    );
    const list = Array.isArray(data) ? data : (data?.data ?? []);
    return list.map(mapBackendToUi);
  },
 
  sendGroupMessage: async (payload: SendGroupMessageRequest): Promise<Message> => {
    const { data } = await api.post<BackendMessage>(`/chat/groups/messages`, payload);
    return mapBackendToUi(data as any);
  },
 
  updateGroupMessage: async (messageId: string, content: string): Promise<Message> => {
    const { data } = await api.patch<BackendMessage>(`/chat/groups/messages/${messageId}`, { content });
    return mapBackendToUi(data as any);
  },
 
  deleteGroupMessage: async (messageId: string): Promise<{ success: boolean }> => {
    await api.delete(`/chat/groups/messages/${messageId}`);
    return { success: true };
  },
};
 
 