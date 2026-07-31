import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@mesmice/database';
import {
  hashPassword,
  verifyPassword,
  generateEd25519KeyPair,
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
} from '@mesmice/crypto';
import { randomUUID } from 'node:crypto';
import { SESSION_DURATION_HOURS } from '@mesmice/common';
import { requireAuth } from '../auth.js';

interface RegisterBody {
  username: string;
  password: string;
  nickname: string;
  publicKey?: string;
}

interface LoginBody {
  username: string;
  password: string;
  totpCode?: string;
}

export function createAuthRoutes(app: FastifyInstance): void {
  app.post<{ Body: RegisterBody }>('/api/auth/register', async (request, reply) => {
    const { username, password, nickname, publicKey } = request.body;

    if (!username || !password || !nickname) {
      return reply.status(400).send({ error: 'Username, password, and nickname required' });
    }

    if (password.length < 8) {
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    const db = getDatabase();

    const existingUser = await db.user.findFirst({
      where: { OR: [{ username }, { nickname }] },
    });

    if (existingUser) {
      return reply.status(409).send({ error: 'Username or nickname already taken' });
    }

    const passwordHash = await hashPassword(password);
    const keyPair = generateEd25519KeyPair();

    const user = await db.user.create({
      data: {
        username,
        nickname,
        password: passwordHash,
        publicKey: publicKey || keyPair.publicKey,
      },
    });

    await db.keyPair.create({
      data: {
        userId: user.id,
        algorithm: 'ed25519',
        publicKey: keyPair.publicKey,
        privateKeyEncrypted: keyPair.secretKey,
      },
    });

    return reply.status(201).send({
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      publicKey: user.publicKey,
    });
  });

  app.post<{ Body: LoginBody }>('/api/auth/login', async (request, reply) => {
    const { username, password, totpCode } = request.body;

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password required' });
    }

    const db = getDatabase();
    const user = await db.user.findUnique({ where: { username } });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    if (user.totpEnabled) {
      if (!totpCode) {
        return reply.status(400).send({ error: 'TOTP code required', totpRequired: true });
      }
      if (!verifyTotpCode(user.totpSecret!, totpCode)) {
        return reply.status(401).send({ error: 'Invalid TOTP code' });
      }
    }

    const token = randomUUID() + '-' + randomUUID();
    const refreshToken = randomUUID() + '-' + randomUUID();

    await db.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        expiresAt: new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000),
      },
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        bio: user.bio,
        publicKey: user.publicKey,
        totpEnabled: user.totpEnabled,
      },
    };
  });

  app.post('/api/auth/logout', { preHandler: requireAuth }, async (request, reply) => {
    const db = getDatabase();
    const token = request.headers.authorization?.replace('Bearer ', '')!;
    await db.session.deleteMany({ where: { token } });

    return { success: true };
  });

  app.post('/api/auth/totp/setup', { preHandler: requireAuth }, async (request, reply) => {
    const db = getDatabase();
    const session = await db.session.findFirst({
      where: { userId: request.userId! },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return reply.status(401).send({ error: 'Invalid session' });
    }

    const secret = generateTotpSecret();
    const code = generateTotpCode(secret);

    await db.user.update({
      where: { id: request.userId! },
      data: { totpSecret: secret },
    });

    return {
      secret,
      code,
      uri: `otpauth://totp/${TOTP_ISSUER}:${session.user.username}?secret=${secret}&issuer=${TOTP_ISSUER}`,
    };
  });

  app.post<{ Body: { code: string } }>(
    '/api/auth/totp/verify',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { code } = request.body;

      const db = getDatabase();
      const user = await db.user.findUnique({ where: { id: request.userId! } });

      if (!user) {
        return reply.status(401).send({ error: 'Invalid session' });
      }

      if (!user.totpSecret) {
        return reply.status(400).send({ error: 'TOTP not set up' });
      }

      if (verifyTotpCode(user.totpSecret, code)) {
        await db.user.update({
          where: { id: user.id },
          data: { totpEnabled: true },
        });
        return { success: true };
      }

      return reply.status(400).send({ error: 'Invalid code' });
    },
  );
}

const TOTP_ISSUER = 'Mesmice.IRC';
