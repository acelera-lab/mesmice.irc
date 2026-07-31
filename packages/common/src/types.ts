export type ChannelType = 'public' | 'private' | 'password_protected';

export type UserRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

export type MessageType = 'text' | 'action' | 'system' | 'private';

export interface User {
  id: string;
  nickname: string;
  username: string;
  bio: string | null;
  publicKey: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Channel {
  id: string;
  name: string;
  topic: string | null;
  type: ChannelType;
  passwordHash: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  userId: string;
  channelId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  type: MessageType;
  encrypted: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ClientConfig {
  nickname: string;
  theme: string;
  server: string;
  port?: number;
  history: boolean;
}

export interface ProtocolPacket {
  type: PacketType;
  id: string;
  timestamp: number;
  payload: unknown;
  signature?: string;
}

export type PacketType =
  | 'auth'
  | 'auth_response'
  | 'message'
  | 'message_response'
  | 'join'
  | 'join_response'
  | 'leave'
  | 'leave_response'
  | 'command'
  | 'command_response'
  | 'error'
  | 'ping'
  | 'pong'
  | 'key_exchange'
  | 'key_exchange_response';
