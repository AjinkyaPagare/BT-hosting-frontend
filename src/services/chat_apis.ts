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

const normalizeGroupAttachments = (messages: RawChatMessage[]): GroupAttachment[] => {
  return messages
    .filter((message) => Boolean(message.file_url) && !message.is_deleted)
    .map((message) => {
      const fileName = message.file_name ?? message.file_url?.split("/").pop() ?? "Unknown file";
      const fileType = message.file_type ?? fileName.split(".").pop() ?? "unknown";

      return {
        id: message.id,
        senderId: message.sender_id,
        groupId: message.group_id ?? "",
        fileUrl: message.file_url ?? "",
        fileName,
        fileType: fileType.toLowerCase(),
        createdAt: message.timestamp,
      };
    });
};

export const chatApi = {
  async getGroupAttachments(groupId: string): Promise<GroupAttachment[]> {
    const response = await api.get<RawChatMessage[]>(`/chat/groups/${groupId}/messages`);
    return normalizeGroupAttachments(response.data ?? []);
  },
};
