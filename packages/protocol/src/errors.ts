export class ProtocolError extends Error {
  public code: string;
  public statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = 'ProtocolError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const ErrorCodes = {
  INVALID_PACKET: 'INVALID_PACKET',
  AUTH_FAILED: 'AUTH_FAILED',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  CHANNEL_NOT_FOUND: 'CHANNEL_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ALREADY_IN_CHANNEL: 'ALREADY_IN_CHANNEL',
  NICKNAME_TAKEN: 'NICKNAME_TAKEN',
  CHANNEL_LIMIT: 'CHANNEL_LIMIT',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_NICKNAME: 'INVALID_NICKNAME',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
