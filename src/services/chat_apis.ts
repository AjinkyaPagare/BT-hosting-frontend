import api from "@/services/api";

export interface RawChatMessage {
  id: string;
  sender_id: string;
  receiver_id?: string | null;
  group_id?: string | null;
  content: string;
  timestamp: string;
  updated_at: string;
  edited: boolean;
  status: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  is_deleted: boolean;
}

export interface GroupAttachment {
  id: string;
  senderId: string;
  groupId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

/** Normalize and extract group file attachments */
const normalizeGroupAttachments = (messages: RawChatMessage[]): GroupAttachment[] => {
  return messages
    .filter(msg => msg.file_url && !msg.is_deleted)
    .map(msg => {
      const fallbackName = msg.file_url?.split("/").pop() || "unknown_file";

      const fileName = msg.file_name || fallbackName;
      const fileType =
        msg.file_type ||
        fileName.split(".").pop() ||
        "unknown";

      return {
        id: msg.id,
        senderId: msg.sender_id,
        groupId: msg.group_id ?? "",
        fileUrl: msg.file_url!,
        fileName,
        fileType: fileType.toLowerCase(),
        createdAt: msg.timestamp,
      };
    });
};

export const chatApi = {
  /** Fetch group files / media */
  async getGroupAttachments(groupId: string): Promise<GroupAttachment[]> {
    try {
      const res = await api.get<RawChatMessage[]>(`/chat/groups/${groupId}/messages`);
      return normalizeGroupAttachments(res.data ?? []);
    } catch (error) {
      console.error("❌ Failed to load group attachments:", error);
      return [];
    }
  },
};
