import Fastify from 'fastify';
import { createAuthRoutes } from './routes/auth.js';
import { createChannelRoutes } from './routes/channels.js';
import { createUserRoutes } from './routes/users.js';
import { createHealthRoute } from './routes/health.js';

export async function createHttpServer(port: number): Promise<ReturnType<typeof Fastify>> {
  const app = Fastify({
    logger: process.env['NODE_ENV'] !== 'production',
  });

  app.register(import('@fastify/cors'), { origin: false });

  app.register(import('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
  });

  createAuthRoutes(app);
  createChannelRoutes(app);
  createUserRoutes(app);
  createHealthRoute(app);

  await app.listen({ port, host: '0.0.0.0' });

  return app;
}
