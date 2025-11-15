export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  isRead: boolean;
  isDelivered: boolean;
}

export interface Chat {
  id: string;
  userId: string;
  user: User;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
}

export interface GroupMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  role: string;
  joinedAt: string;
  isOnline: boolean;
  status?: string | null;
}

export interface Group {
  id: string;
  name: string;
  avatar?: string;
  ownerId: string;
  isOpen: boolean;
  adminIds: string[];
  memberIds: string[];
  members: GroupMember[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FriendRequest {
  id: string;
  requesterId: string | null;
  requesterName: string | null;
  requesterEmail: string | null;
  receiverId: string | null;
  receiverName: string | null;
  receiverEmail: string | null;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface FriendListItem {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface BlockedUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  participantIds: string[];
  participants: User[];
  createdBy: string;
}

export interface File {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'group_invite' | 'event';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}
