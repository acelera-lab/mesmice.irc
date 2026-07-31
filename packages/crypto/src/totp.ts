import { createHmac, randomBytes } from 'node:crypto';

const TOTP_INTERVAL = 30;
const TOTP_DIGITS = 6;

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const hmac = createHmac('sha1', Buffer.from(key));
  hmac.update(Buffer.from(message));
  return new Uint8Array(hmac.digest());
}

function truncate(hs: Uint8Array): number {
  const offset = hs[hs.length - 1]! & 0xf;
  const binary =
    ((hs[offset]! & 0x7f) << 24) |
    ((hs[offset + 1]! & 0xff) << 16) |
    ((hs[offset + 2]! & 0xff) << 8) |
    (hs[offset + 3]! & 0xff);
  return binary % 10 ** TOTP_DIGITS;
}

export function generateTotpSecret(): string {
  return randomBytes(20).toString('hex');
}

export function generateTotpCode(secretHex: string, timestamp: number = Date.now()): string {
  const secret = Buffer.from(secretHex, 'hex');
  let counter = Math.floor(timestamp / 1000 / TOTP_INTERVAL);
  const counterBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = counter & 0xff;
    counter >>= 8;
  }
  const hs = hmacSha1(new Uint8Array(secret), counterBytes);
  const code = truncate(hs);
  return code.toString().padStart(TOTP_DIGITS, '0');
}

export function verifyTotpCode(secretHex: string, code: string): boolean {
  const expected = generateTotpCode(secretHex);
  if (expected === code) return true;

  for (const offset of [-1, 1]) {
    const adjusted = generateTotpCode(secretHex, Date.now() + offset * TOTP_INTERVAL * 1000);
    if (adjusted === code) return true;
  }

  return false;
}
