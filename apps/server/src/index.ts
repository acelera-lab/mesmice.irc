import 'dotenv/config';
import { createServer } from './server.js';
import { connectDatabase } from '@mesmice/database';
import { createTcpServer } from './tcp/index.js';
import { createHttpServer } from './http/index.js';
import { loadEnv } from './config.js';

async function main(): Promise<void> {
  const env = loadEnv();

  console.log('╔══════════════════════════════════════╗');
  console.log('║        Mesmice.IRC Server v0.1        ║');
  console.log('╚══════════════════════════════════════╝');
  console.log();

  await connectDatabase();
  console.log('[DB] Database connected');

  const server = createServer();

  const httpServer = await createHttpServer(env.httpPort);
  console.log(`[HTTP] Server listening on port ${env.httpPort}`);

  const tcpServer = createTcpServer(server, env.tcpPort);
  console.log(`[TCP] Server listening on port ${env.tcpPort}`);

  console.log();
  console.log('Servidor iniciado');
  console.log();

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    tcpServer.close();
    await httpServer.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    tcpServer.close();
    await httpServer.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
