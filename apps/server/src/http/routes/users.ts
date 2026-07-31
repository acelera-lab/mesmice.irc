import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@mesmice/database';
import { requireAuth } from '../auth.js';

export function createUserRoutes(app: FastifyInstance): void {
  app.get<{ Params: { id: string } }>(
    '/api/users/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params;

      const db = getDatabase();
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          nickname: true,
          bio: true,
          publicKey: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return { user };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/users/:id/channels',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params;

      const db = getDatabase();
      const memberships = await db.member.findMany({
        where: { userId: id },
        include: {
          channel: { select: { id: true, name: true, topic: true, type: true } },
        },
      });

      return {
        channels: memberships.map((m) => ({
          ...m.channel,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      };
    },
  );

  app.patch<{ Params: { id: string }; Body: { bio?: string; avatarUrl?: string } }>(
    '/api/users/:id/profile',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params;

      if (request.userId !== id) {
        return reply.status(403).send({ error: 'You can only edit your own profile' });
      }

      const { bio, avatarUrl } = request.body;

      const db = getDatabase();
      const user = await db.user.update({
        where: { id },
        data: { ...(bio !== undefined && { bio }), ...(avatarUrl !== undefined && { avatarUrl }) },
        select: { id: true, nickname: true, bio: true, avatarUrl: true },
      });

      return { user };
    },
  );
}
