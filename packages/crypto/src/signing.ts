import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from './utils.js';

export interface SigningKeyPair {
  publicKey: string;
  secretKey: string;
}

export function generateEd25519KeyPair(): SigningKeyPair {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

export function signMessage(message: string, secretKey: string): string {
  const sk = decodeBase64(secretKey);
  const msgBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(msgBytes, sk);
  return encodeBase64(signature);
}

export function verifySignature(message: string, signature: string, publicKey: string): boolean {
  const pk = decodeBase64(publicKey);
  const sig = decodeBase64(signature);
  const msgBytes = new TextEncoder().encode(message);

  return nacl.sign.detached.verify(msgBytes, sig, pk);
}

export function generateJwtSignature(payload: string, secretKey: string): string {
  return signMessage(payload, secretKey);
}

export function verifyJwtSignature(payload: string, signature: string, publicKey: string): boolean {
  return verifySignature(payload, signature, publicKey);
}
