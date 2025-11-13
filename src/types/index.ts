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

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  adminIds: string[];
  memberIds: string[];
  members: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  sender: User;
  receiverId: string;
  receiver: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
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
