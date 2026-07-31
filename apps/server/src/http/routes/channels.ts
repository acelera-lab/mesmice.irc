import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@mesmice/database';
import { requireAuth } from '../auth.js';

export function createChannelRoutes(app: FastifyInstance): void {
  app.get('/api/channels', { preHandler: requireAuth }, async () => {
    const db = getDatabase();
    const channels = await db.channel.findMany({
      where: { type: 'public' },
      select: {
        id: true,
        name: true,
        topic: true,
        type: true,
        _count: { select: { members: true } },
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    return { channels };
  });

  app.get<{ Params: { id: string } }>(
    '/api/channels/:id/messages',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params;
      const limit = Math.min(
        Number((request.query as Record<string, string>)['limit']) || 100,
        500,
      );

      const db = getDatabase();
      const channel = await db.channel.findUnique({ where: { id } });
      if (!channel) {
        return reply.status(404).send({ error: 'Channel not found' });
      }

      if (channel.type !== 'public') {
        const member = await db.member.findUnique({
          where: { userId_channelId: { userId: request.userId!, channelId: id } },
        });
        if (!member) {
          return reply.status(403).send({ error: 'You are not a member of this channel' });
        }
      }

      const messages = await db.message.findMany({
        where: { channelId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          sender: { select: { nickname: true } },
        },
      });

      return { messages: messages.reverse() };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/api/channels/:id/members',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params;

      const db = getDatabase();
      const channel = await db.channel.findUnique({ where: { id } });
      if (!channel) {
        return reply.status(404).send({ error: 'Channel not found' });
      }

      if (channel.type !== 'public') {
        const member = await db.member.findUnique({
          where: { userId_channelId: { userId: request.userId!, channelId: id } },
        });
        if (!member) {
          return reply.status(403).send({ error: 'You are not a member of this channel' });
        }
      }

      const members = await db.member.findMany({
        where: { channelId: id },
        include: {
          user: { select: { id: true, nickname: true, bio: true, publicKey: true } },
        },
      });

      return {
        members: members.map((m) => ({
          ...m.user,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      };
    },
  );
}
