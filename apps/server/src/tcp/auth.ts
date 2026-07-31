import type { ShadowServer } from '../server.js';
import type { ProtocolPacket } from '@mesmice/common';
import { createPacket } from '@mesmice/protocol';
import { verifyPassword } from '@mesmice/crypto';
import { getDatabase } from '@mesmice/database';
import { verifyTotpCode } from '@mesmice/crypto';
import { randomUUID } from 'node:crypto';
import { SESSION_DURATION_HOURS } from '@mesmice/common';

export async function handleAuth(
  server: ShadowServer,
  connectionId: string,
  packet: ProtocolPacket,
  send: (p: ProtocolPacket) => void,
): Promise<void> {
  const payload = packet.payload as {
    username?: string;
    password?: string;
    totpCode?: string;
  };

  if (!payload.username || !payload.password) {
    send(
      createPacket('auth_response', {
        success: false,
        error: 'Username and password required',
      }),
    );
    return;
  }

  try {
    const db = getDatabase();
    const user = await db.user.findUnique({
      where: { username: payload.username },
    });

    if (!user) {
      send(
        createPacket('auth_response', {
          success: false,
          error: 'Invalid credentials',
        }),
      );
      return;
    }

    const valid = await verifyPassword(payload.password, user.password);
    if (!valid) {
      send(
        createPacket('auth_response', {
          success: false,
          error: 'Invalid credentials',
        }),
      );
      return;
    }

    if (user.totpEnabled) {
      if (!payload.totpCode || !verifyTotpCode(user.totpSecret!, payload.totpCode)) {
        send(
          createPacket('auth_response', {
            success: false,
            error: 'Invalid TOTP code',
            totpRequired: true,
          }),
        );
        return;
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

    server.authenticateConnection(connectionId, user.id, user.nickname);

    send(
      createPacket('auth_response', {
        success: true,
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          bio: user.bio,
          publicKey: user.publicKey,
        },
      }),
    );

    console.log(`[Auth] User '${user.username}' authenticated`);
  } catch (err) {
    console.error('[Auth] Error:', err);
    send(
      createPacket('auth_response', {
        success: false,
        error: 'Internal server error',
      }),
    );
  }
}
