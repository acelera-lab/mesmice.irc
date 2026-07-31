import { createConnection, Socket } from 'node:net';
import { EventEmitter } from 'node:events';
import { encodePacket, decodePacket } from '@mesmice/protocol';
import type { ProtocolPacket } from '@mesmice/common';
import { createPacket } from '@mesmice/protocol';

export interface ConnectionOptions {
  host: string;
  port?: number;
}

const CONNECT_TIMEOUT_MS = 10000;

export class ShadowConnection extends EventEmitter {
  private socket: Socket | null = null;
  private buffer = Buffer.alloc(0);
  private connected = false;

  constructor(private options: ConnectionOptions) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { host, port } = this.options;

      const socket = createConnection({ host, port: port ?? 80 });

      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      }, CONNECT_TIMEOUT_MS);

      socket.once('connect', () => {
        clearTimeout(timeout);
        this.socket = socket;
        this.connected = true;

        socket.on('data', (data) => this.handleData(data));
        socket.on('close', () => {
          this.connected = false;
          this.emit('disconnect');
        });
        socket.on('error', (err) => this.emit('error', err));

        resolve();
      });

      socket.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    this.connected = false;
  }

  async sendPacket(packet: ProtocolPacket): Promise<void> {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected');
    }
    const data = encodePacket(packet);
    return new Promise((resolve, reject) => {
      this.socket!.write(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  send(type: string, payload: unknown): void {
    const packet = createPacket(type as ProtocolPacket['type'], payload);
    this.sendPacket(packet).catch((err) => this.emit('error', err));
  }

  private handleData(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.buffer.length >= 12) {
      const packet = decodePacket(this.buffer);
      if (!packet) break;

      const encoded = encodePacket(packet);
      this.buffer = this.buffer.subarray(encoded.length);

      if (packet.type === 'error') {
        this.emit('packet_error', packet);
      } else {
        this.emit('packet', packet);
        this.emit(packet.type, packet);
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
