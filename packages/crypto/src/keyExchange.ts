import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from './utils.js';
import { randomBytes } from 'node:crypto';

export interface KeyExchangeResult {
  publicKey: string;
  privateKey: string;
}

export interface SharedSecret {
  sharedKey: string;
}

export function generateX25519KeyPair(): KeyExchangeResult {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    privateKey: encodeBase64(kp.secretKey),
  };
}

export function computeSharedSecret(privateKey: string, publicKey: string): SharedSecret {
  const priv = decodeBase64(privateKey);
  const pub = decodeBase64(publicKey);
  const shared = nacl.box.before(pub, priv);
  return {
    sharedKey: encodeBase64(shared),
  };
}

export function encryptWithSharedKey(
  message: string,
  sharedKey: string,
): { ciphertext: string; nonce: string } {
  const key = decodeBase64(sharedKey);
  const nonce = randomBytes(nacl.box.nonceLength);
  const msgBytes = new TextEncoder().encode(message);
  const encrypted = nacl.box.after(msgBytes, nonce, key);

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

export function decryptWithSharedKey(ciphertext: string, nonce: string, sharedKey: string): string {
  const key = decodeBase64(sharedKey);
  const nonceBytes = decodeBase64(nonce);
  const cipherBytes = decodeBase64(ciphertext);
  const decrypted = nacl.box.open.after(cipherBytes, nonceBytes, key);

  if (!decrypted) {
    throw new Error('Failed to decrypt message');
  }

  return new TextDecoder().decode(decrypted);
}
