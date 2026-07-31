import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from './utils.js';
import { randomBytes } from 'node:crypto';

export function encryptSecretBox(
  message: string,
  key: string,
): { ciphertext: string; nonce: string } {
  const keyBytes = decodeBase64(key);
  const nonce = randomBytes(nacl.secretbox.nonceLength);
  const msgBytes = new TextEncoder().encode(message);
  const encrypted = nacl.secretbox(msgBytes, nonce, keyBytes);

  if (!encrypted) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

export function decryptSecretBox(ciphertext: string, nonce: string, key: string): string {
  const keyBytes = decodeBase64(key);
  const nonceBytes = decodeBase64(nonce);
  const cipherBytes = decodeBase64(ciphertext);
  const decrypted = nacl.secretbox.open(cipherBytes, nonceBytes, keyBytes);

  if (!decrypted) {
    throw new Error('Decryption failed');
  }

  return new TextDecoder().decode(decrypted);
}

export function generateSymmetricKey(): string {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(key);
}
