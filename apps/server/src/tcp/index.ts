import { createServer as createNetServer, Socket } from 'node:net';
import type { ShadowServer } from '../server.js';
import { handleConnection } from './handler.js';

export function createTcpServer(
  server: ShadowServer,
  port: number,
): ReturnType<typeof createNetServer> {
  const tcpServer = createNetServer((socket: Socket) => {
    console.log(`[TCP] New connection from ${socket.remoteAddress}`);

    socket.once('close', () => {
      console.log(`[TCP] Connection closed`);
    });

    socket.on('error', (err) => {
      console.error(`[TCP] Socket error:`, err.message);
    });

    handleConnection(server, socket);
  });

  tcpServer.listen(port, '0.0.0.0', () => {
    console.log(`[TCP] Listening on 0.0.0.0:${port}`);
  });

  tcpServer.on('error', (err) => {
    console.error('[TCP] Server error:', err);
  });

  return tcpServer;
}
