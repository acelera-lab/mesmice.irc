import { EventEmitter } from 'node:events';
import type { User, Channel, Member } from '@mesmice/common';

export interface ServerState {
  users: Map<string, User>;
  channels: Map<string, Channel>;
  members: Map<string, Map<string, Member>>;
  connections: Map<string, ConnectionState>;
}

export interface ConnectionState {
  userId: string | null;
  nickname: string | null;
  authenticated: boolean;
  currentChannel: string | null;
  channels: Set<string>;
}

export class ShadowServer extends EventEmitter {
  public state: ServerState;

  constructor() {
    super();
    this.state = {
      users: new Map(),
      channels: new Map(),
      members: new Map(),
      connections: new Map(),
    };
  }

  getConnection(connectionId: string): ConnectionState | undefined {
    return this.state.connections.get(connectionId);
  }

  registerConnection(connectionId: string): ConnectionState {
    const state: ConnectionState = {
      userId: null,
      nickname: null,
      authenticated: false,
      currentChannel: null,
      channels: new Set(),
    };
    this.state.connections.set(connectionId, state);
    return state;
  }

  removeConnection(connectionId: string): void {
    const conn = this.state.connections.get(connectionId);
    if (conn) {
      for (const channel of conn.channels) {
        this.leaveChannel(connectionId, channel);
      }
      this.state.connections.delete(connectionId);
    }
  }

  authenticateConnection(connectionId: string, userId: string, nickname: string): void {
    const conn = this.state.connections.get(connectionId);
    if (conn) {
      conn.userId = userId;
      conn.nickname = nickname;
      conn.authenticated = true;
    }
  }

  joinChannel(connectionId: string, channelName: string): void {
    const conn = this.state.connections.get(connectionId);
    if (conn) {
      conn.channels.add(channelName);
      conn.currentChannel = channelName;
    }
  }

  leaveChannel(connectionId: string, channelName: string): void {
    const conn = this.state.connections.get(connectionId);
    if (conn) {
      conn.channels.delete(channelName);
      if (conn.currentChannel === channelName) {
        conn.currentChannel = conn.channels.values().next().value || null;
      }
    }
  }
}

export function createServer(): ShadowServer {
  return new ShadowServer();
}
