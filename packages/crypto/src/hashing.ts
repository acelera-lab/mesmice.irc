import { randomBytes, timingSafeEqual } from 'node:crypto';

const MEMLIMIT = 256 * 1024 * 1024; // 256 MiB
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const saltHex = salt.toString('hex');

  // Using scrypt — Argon2id requires native bindings (libsodium)
  const { scrypt } = await import('node:crypto');
  const { promisify } = await import('node:util');
  const scryptAsync = promisify(scrypt) as (
    password: string,
    salt: Buffer,
    keylen: number,
    options: object,
  ) => Promise<Buffer>;

  const derivedKey = (await scryptAsync(password, salt, HASH_LENGTH, {
    N: 1 << 17,
    r: 8,
    p: 1,
    maxmem: MEMLIMIT,
  })) as Buffer;

  return `$shadow$scrypt$N=${1 << 17},r=8,p=1$` + saltHex + '$' + derivedKey.toString('hex');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split('$');
  if (parts.length < 6 || parts[1] !== 'shadow') {
    throw new Error('Invalid hash format');
  }

  const algorithm = parts[2]!;
  const params = parts[3]!;
  const saltHex = parts[4]!;
  const storedHash = parts[5]!;

  const salt = Buffer.from(saltHex, 'hex');

  if (algorithm !== 'scrypt') {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const paramParts = params.split(',');
  const n = Number(paramParts[0]!.split('=')[1]) || 1 << 17;
  const r = Number(paramParts[1]!.split('=')[1]) || 8;
  const p = Number(paramParts[2]!.split('=')[1]) || 1;

  const { scrypt } = await import('node:crypto');
  const { promisify } = await import('node:util');
  const scryptAsync = promisify(scrypt) as (
    password: string,
    salt: Buffer,
    keylen: number,
    options: object,
  ) => Promise<Buffer>;

  const derivedKey = (await scryptAsync(password, salt, storedHash.length / 2, {
    N: n,
    r,
    p,
    maxmem: MEMLIMIT,
  })) as Buffer;

  if (derivedKey.length !== Buffer.from(storedHash, 'hex').length) {
    return false;
  }

  return timingSafeEqual(derivedKey, Buffer.from(storedHash, 'hex'));
}

export function generateSalt(length = 16): string {
  return randomBytes(length).toString('hex');
}
