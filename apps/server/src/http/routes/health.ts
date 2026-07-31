import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@mesmice/database';

export function createHealthRoute(app: FastifyInstance): void {
  app.get('/health', async () => {
    try {
      const db = getDatabase();
      await db.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
        database: 'connected',
      };
    } catch {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  });
}
