import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getDatabase(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env['NODE_ENV'] === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

export async function connectDatabase(): Promise<void> {
  const db = getDatabase();
  await db.$connect();
}

export type { PrismaClient } from '@prisma/client';
