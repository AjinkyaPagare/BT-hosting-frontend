import api from "./api";
import type { FriendRequest, FriendListItem, BlockedUser } from "@/types";

interface RawFriendRequest {
  id: string;
  requester_id?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  receiver_id?: string | null;
  receiver_name?: string | null;
  receiver_email?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface RawFriendListItem {
  friend_id: string;
  friend_public_id?: string | null;
  name?: string | null;
  email?: string | null;
}

interface RawBlockedListItem {
  user_id: string;
  user_public_id?: string | null;
  name?: string | null;
  email?: string | null;
}

const normalizeFriendRequest = (item: RawFriendRequest): FriendRequest => ({
  id: item.id,
  requesterId: item.requester_id ?? null,
  requesterName: item.requester_name ?? null,
  requesterEmail: item.requester_email ?? null,
  receiverId: item.receiver_id ?? null,
  receiverName: item.receiver_name ?? null,
  receiverEmail: item.receiver_email ?? null,
  status: item.status as FriendRequest["status"],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const normalizeFriend = (item: RawFriendListItem): FriendListItem => ({
  id: item.friend_id,
  name: item.name ?? null,
  email: item.email ?? null,
});

const normalizeBlocked = (item: RawBlockedListItem): BlockedUser => ({
  id: item.user_id,
  name: item.name ?? null,
  email: item.email ?? null,
});

export const friendsService = {
  getFriendList: async (): Promise<FriendListItem[]> => {
    const { data } = await api.get<RawFriendListItem[]>("/friends/list");
    return Array.isArray(data) ? data.map(normalizeFriend) : [];
  },

  getBlockedList: async (): Promise<BlockedUser[]> => {
    const { data } = await api.get<RawBlockedListItem[]>("/friends/blocked");
    return Array.isArray(data) ? data.map(normalizeBlocked) : [];
  },

  getPendingRequests: async (): Promise<FriendRequest[]> => {
    const { data } = await api.get<RawFriendRequest[]>("/friends/requests/pending");
    return Array.isArray(data) ? data.map(normalizeFriendRequest) : [];
  },

  getSentRequests: async (): Promise<FriendRequest[]> => {
    const { data } = await api.get<RawFriendRequest[]>("/friends/requests/sent");
    return Array.isArray(data) ? data.map(normalizeFriendRequest) : [];
  },

  sendRequest: async (receiverId: string): Promise<FriendRequest> => {
    const { data } = await api.post<RawFriendRequest>("/friends/requests", {
      receiver_id: receiverId,
    });
    return normalizeFriendRequest(data);
  },

  acceptRequest: async (requestId: string): Promise<FriendRequest> => {
    const { data } = await api.post<RawFriendRequest>(`/friends/requests/${requestId}/accept`);
    return normalizeFriendRequest(data);
  },

  blockRequest: async (requestId: string): Promise<FriendRequest> => {
    const { data } = await api.post<RawFriendRequest>(`/friends/requests/${requestId}/block`);
    return normalizeFriendRequest(data);
  },

  rejectRequest: async (requestId: string): Promise<FriendRequest> => {
    const { data } = await api.post<RawFriendRequest>(`/friends/requests/${requestId}/reject`);
    return normalizeFriendRequest(data);
  },

  blockFriend: async (friendId: string): Promise<FriendRequest> => {
    const { data } = await api.post<RawFriendRequest>(`/friends/${friendId}/block`);
    return normalizeFriendRequest(data);
  },
};
