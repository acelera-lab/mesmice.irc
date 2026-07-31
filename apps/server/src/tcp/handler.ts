import type { Socket } from 'node:net';
import { randomUUID } from 'node:crypto';
import type { ShadowServer } from '../server.js';
import { decodePacket, encodePacket, createErrorPacket } from '@mesmice/protocol';
import { handleAuth } from './auth.js';
import { handleCommand } from './commands.js';
import type { ProtocolPacket } from '@mesmice/common';

export function handleConnection(server: ShadowServer, socket: Socket): void {
  const connectionId = randomUUID();
  const conn = server.registerConnection(connectionId);
  let buffer = Buffer.alloc(0);

  function sendPacket(packet: ProtocolPacket): void {
    try {
      const data = encodePacket(packet);
      socket.write(data);
    } catch (err) {
      console.error('[TCP] Error sending packet:', err);
    }
  }

  socket.on('data', (data: Buffer) => {
    buffer = Buffer.concat([buffer, data]);

    while (buffer.length >= 12) {
      const packet = decodePacket(buffer);
      if (!packet) break;

      const encoded = encodePacket(packet);
      buffer = buffer.subarray(encoded.length);

      handlePacket(packet, sendPacket).catch((err) => {
        console.error('[TCP] Handler error:', err);
        sendPacket(createErrorPacket('INTERNAL_ERROR', err.message));
      });
    }
  });

  socket.on('close', () => {
    server.removeConnection(connectionId);
  });

  async function handlePacket(
    packet: ProtocolPacket,
    send: (p: ProtocolPacket) => void,
  ): Promise<void> {
    switch (packet.type) {
      case 'auth':
        await handleAuth(server, connectionId, packet, send);
        break;
      case 'command':
        if (!conn.authenticated) {
          send(createErrorPacket('NOT_AUTHENTICATED', 'Please authenticate first'));
          return;
        }
        await handleCommand(server, connectionId, packet, send);
        break;
      case 'ping':
        send({
          type: 'pong',
          id: packet.id,
          timestamp: Date.now(),
          payload: {},
        });
        break;
      default:
        send(createErrorPacket('INVALID_PACKET', `Unknown packet type: ${packet.type}`));
    }
  }
}
