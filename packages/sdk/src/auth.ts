import type { ProtocolPacket } from '@mesmice/common';

export interface AuthCredentials {
  username: string;
  password: string;
  totpCode?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
}

export function createAuthPacket(credentials: AuthCredentials): ProtocolPacket {
  return {
    type: 'auth',
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    payload: {
      username: credentials.username,
      password: credentials.password,
      totpCode: credentials.totpCode,
    },
  };
}

export function parseAuthResponse(packet: ProtocolPacket): AuthResult {
  const payload = packet.payload as Record<string, unknown>;

  if (packet.type === 'auth_response' && payload['success']) {
    return {
      success: true,
      token: payload['token'] as string,
      refreshToken: payload['refreshToken'] as string,
    };
  }

  return {
    success: false,
    error: (payload['error'] as string) || 'Authentication failed',
  };
}
