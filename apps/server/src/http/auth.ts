import type { FastifyReply, FastifyRequest } from 'fastify';
import { getDatabase } from '@mesmice/database';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string | null;
    user: { id: string; username: string; nickname: string } | null;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply | void> {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const db = getDatabase();
  const session = await db.session.findUnique({
    where: { token },
    include: { user: { select: { id: true, username: true, nickname: true } } },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    return reply.status(401).send({ error: 'Invalid or expired session' });
  }

  request.userId = session.user.id;
  request.user = session.user;
}
