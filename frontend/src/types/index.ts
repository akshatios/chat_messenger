export interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture?: string;
  status?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface Message {
  _id: string;
  sender: User;
  recipient: User;
  content?: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  isDelivered: boolean;
  readAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  contact: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface ChatState {
  currentChat: User | null;
  messages: Message[];
  conversations: Conversation[];
  onlineUsers: string[];
  typingUsers: Map<string, boolean>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface MessageFormData {
  content: string;
  recipientId: string;
}

export interface FileMessageData {
  file: File;
  recipientId: string;
}
