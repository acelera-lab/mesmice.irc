export interface ServerEnv {
  httpPort: number;
  tcpPort: number;
  databaseUrl: string;
  logLevel: string;
  historyRetention: string;
  maxMessageLength: number;
  rateLimitMax: number;
  rateLimitWindow: number;
}

export function loadEnv(): ServerEnv {
  return {
    httpPort: parseInt(process.env['HTTP_PORT'] || '5001', 10),
    tcpPort: parseInt(process.env['TCP_PORT'] || '5002', 10),
    databaseUrl:
      process.env['DATABASE_URL'] || 'postgresql://mesmice:mesmice@localhost:5432/mesmice',
    logLevel: process.env['LOG_LEVEL'] || 'info',
    historyRetention: process.env['HISTORY_RETENTION'] || '7d',
    maxMessageLength: parseInt(process.env['MAX_MESSAGE_LENGTH'] || '4096', 10),
    rateLimitMax: parseInt(process.env['RATE_LIMIT_MAX'] || '100', 10),
    rateLimitWindow: parseInt(process.env['RATE_LIMIT_WINDOW'] || '60000', 10),
  };
}
