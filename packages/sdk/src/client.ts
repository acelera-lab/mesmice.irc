import { ShadowConnection } from './connection.js';
import { createAuthPacket, parseAuthResponse, type AuthCredentials } from './auth.js';
import type { ProtocolPacket } from '@mesmice/common';
import { EventEmitter } from 'node:events';

export interface ShadowClientOptions {
  host: string;
  port?: number;
}

export class ShadowClient extends EventEmitter {
  private connection: ShadowConnection;
  private token: string | null = null;
  private authenticated = false;

  constructor(options: ShadowClientOptions) {
    super();
    this.connection = new ShadowConnection({
      host: options.host,
      port: options.port,
    });

    this.connection.on('packet', (packet: ProtocolPacket) => {
      this.emit('packet', packet);
      this.emit(packet.type, packet);
    });

    this.connection.on('packet_error', (packet: ProtocolPacket) => {
      this.emit('packet_error', packet);
    });

    this.connection.on('disconnect', () => {
      this.authenticated = false;
      this.emit('disconnect');
    });

    this.connection.on('error', (err) => {
      this.emit('error', err);
    });
  }

  async connect(): Promise<void> {
    await this.connection.connect();
    this.emit('connect');
  }

  async disconnect(): Promise<void> {
    await this.connection.disconnect();
  }

  async authenticate(credentials: AuthCredentials): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);

      this.connection.once('auth_response', (packet: ProtocolPacket) => {
        clearTimeout(timeout);
        const result = parseAuthResponse(packet);
        if (result.success) {
          this.token = result.token!;
          this.authenticated = true;
          resolve(true);
        } else {
          reject(new Error(result.error));
        }
      });

      this.connection.sendPacket(createAuthPacket(credentials)).catch(reject);
    });
  }

  sendMessage(channel: string, content: string): void {
    this.connection.send('command', {
      command: 'msg',
      args: [channel, content],
      token: this.token,
    });
  }

  joinChannel(channel: string, password?: string): void {
    this.connection.send('command', {
      command: 'join',
      args: password ? [channel, password] : [channel],
      token: this.token,
    });
  }

  leaveChannel(channel: string): void {
    this.connection.send('command', {
      command: 'leave',
      args: [channel],
      token: this.token,
    });
  }

  sendCommand(command: string, args: string[]): void {
    this.connection.send('command', {
      command,
      args,
      token: this.token,
    });
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }
}
