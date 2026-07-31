export const MESMICE_VERSION = '0.1.10';

export const MAX_NICKNAME_LENGTH = 32;
export const MAX_CHANNEL_NAME_LENGTH = 64;
export const MAX_MESSAGE_LENGTH = 4096;
export const MAX_TOPIC_LENGTH = 512;

export const MIN_PASSWORD_LENGTH = 8;

export const SESSION_DURATION_HOURS = 24;
export const REFRESH_TOKEN_DURATION_DAYS = 30;
export const TOTP_ISSUER = 'Mesmice.IRC';

export const HISTORY_OPTIONS = ['24h', '7d', '30d', 'never'] as const;

export const DEFAULT_CHANNELS = ['general', 'random'];

export const PACKET_VERSION = 1;
export const PROTOCOL_MAGIC = 0x4d45534d; // 'MESM'
