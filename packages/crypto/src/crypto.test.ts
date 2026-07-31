import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateSalt } from './hashing.js';
import {
  generateEd25519KeyPair,
  signMessage,
  verifySignature,
  generateJwtSignature,
  verifyJwtSignature,
} from './signing.js';
import {
  generateX25519KeyPair,
  computeSharedSecret,
  encryptWithSharedKey,
  decryptWithSharedKey,
} from './keyExchange.js';
import { generateTotpSecret, generateTotpCode, verifyTotpCode } from './totp.js';
import { generateSymmetricKey, encryptSecretBox, decryptSecretBox } from './encryption.js';
import { encodeBase64, decodeBase64, encodeHex, decodeHex } from './utils.js';

describe('Password Hashing', () => {
  it('should hash and verify password', async () => {
    const password = 'test_password_123!@#';
    const hash = await hashPassword(password);
    expect(hash).toBeTruthy();
    expect(hash.startsWith('$shadow$')).toBe(true);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong_password', hash)).toBe(false);
  });

  it('should handle empty password', async () => {
    const hash = await hashPassword('');
    expect(await verifyPassword('', hash)).toBe(true);
  });

  it('should handle special characters', async () => {
    const password = '🔥🔥🔥 🚀🚀🚀 ~!@#$%^&*()_+';
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('should reject tampered hash format', async () => {
    const password = 'test123';
    const hash = await hashPassword(password);
    const tampered = hash.replace('$shadow$', '$hacked$');
    await expect(verifyPassword(password, tampered)).rejects.toThrow('Invalid hash format');
  });

  it('should reject unsupported algorithm', async () => {
    const password = 'test123';
    const hash = await hashPassword(password);
    const tampered = hash.replace('scrypt', 'bcrypt');
    await expect(verifyPassword(password, tampered)).rejects.toThrow(
      'Unsupported algorithm: bcrypt',
    );
  });

  it('should generate unique salts', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toBe(salt2);
    expect(salt1.length).toBe(32);
    expect(salt2.length).toBe(32);
  });

  it('should generate salt with custom length', () => {
    const salt = generateSalt(32);
    expect(salt.length).toBe(64);
  });

  it('should produce different hashes for same password', async () => {
    const password = 'same_password';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  it('should handle very long password', async () => {
    const password = 'a'.repeat(1000);
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });
});

describe('Ed25519 Signing', () => {
  it('should sign and verify messages', () => {
    const kp = generateEd25519KeyPair();
    const message = 'test message';
    const signature = signMessage(message, kp.secretKey);
    expect(verifySignature(message, signature, kp.publicKey)).toBe(true);
    expect(verifySignature('tampered', signature, kp.publicKey)).toBe(false);
  });

  it('should handle empty messages', () => {
    const kp = generateEd25519KeyPair();
    const signature = signMessage('', kp.secretKey);
    expect(verifySignature('', signature, kp.publicKey)).toBe(true);
  });

  it('should reject wrong public key', () => {
    const kp1 = generateEd25519KeyPair();
    const kp2 = generateEd25519KeyPair();
    const message = 'hello';
    const signature = signMessage(message, kp1.secretKey);
    expect(verifySignature(message, signature, kp2.publicKey)).toBe(false);
  });

  it('should generate different key pairs each time', () => {
    const kp1 = generateEd25519KeyPair();
    const kp2 = generateEd25519KeyPair();
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
    expect(kp1.secretKey).not.toBe(kp2.secretKey);
  });

  it('should generate keys in base64 format', () => {
    const kp = generateEd25519KeyPair();
    expect(() => decodeBase64(kp.publicKey)).not.toThrow();
    expect(() => decodeBase64(kp.secretKey)).not.toThrow();
  });

  it('should sign and verify JWT payload', () => {
    const kp = generateEd25519KeyPair();
    const payload = JSON.stringify({ sub: 'user1', iat: 123456 });
    const signature = generateJwtSignature(payload, kp.secretKey);
    expect(verifyJwtSignature(payload, signature, kp.publicKey)).toBe(true);
    expect(verifyJwtSignature('fake', signature, kp.publicKey)).toBe(false);
  });

  it('should handle unicode messages', () => {
    const kp = generateEd25519KeyPair();
    const message = '你好世界 🌍';
    const signature = signMessage(message, kp.secretKey);
    expect(verifySignature(message, signature, kp.publicKey)).toBe(true);
  });
});

describe('X25519 Key Exchange', () => {
  it('should compute shared secret and encrypt/decrypt', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();

    const aliceShared = computeSharedSecret(alice.privateKey, bob.publicKey);
    const bobShared = computeSharedSecret(bob.privateKey, alice.publicKey);

    expect(aliceShared.sharedKey).toBe(bobShared.sharedKey);

    const message = 'secret message for bob';
    const encrypted = encryptWithSharedKey(message, aliceShared.sharedKey);
    const decrypted = decryptWithSharedKey(
      encrypted.ciphertext,
      encrypted.nonce,
      bobShared.sharedKey,
    );
    expect(decrypted).toBe(message);
  });

  it('should fail decryption with wrong key', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    const eve = generateX25519KeyPair();

    const aliceShared = computeSharedSecret(alice.privateKey, bob.publicKey);
    const message = 'secret';
    const encrypted = encryptWithSharedKey(message, aliceShared.sharedKey);

    const eveShared = computeSharedSecret(eve.privateKey, alice.publicKey);
    expect(() => {
      decryptWithSharedKey(encrypted.ciphertext, encrypted.nonce, eveShared.sharedKey);
    }).toThrow('Failed to decrypt message');
  });

  it('should handle large messages', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    const shared = computeSharedSecret(alice.privateKey, bob.publicKey);
    const largeMessage = 'x'.repeat(10000);
    const encrypted = encryptWithSharedKey(largeMessage, shared.sharedKey);
    const decrypted = decryptWithSharedKey(encrypted.ciphertext, encrypted.nonce, shared.sharedKey);
    expect(decrypted).toBe(largeMessage);
  });

  it('should produce different nonces each encryption', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    const shared = computeSharedSecret(alice.privateKey, bob.publicKey);
    const message = 'same message';

    const enc1 = encryptWithSharedKey(message, shared.sharedKey);
    const enc2 = encryptWithSharedKey(message, shared.sharedKey);

    expect(enc1.nonce).not.toBe(enc2.nonce);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
  });

  it('should handle empty message', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    const shared = computeSharedSecret(alice.privateKey, bob.publicKey);
    const encrypted = encryptWithSharedKey('', shared.sharedKey);
    const decrypted = decryptWithSharedKey(encrypted.ciphertext, encrypted.nonce, shared.sharedKey);
    expect(decrypted).toBe('');
  });

  it('should generate different key pairs each time', () => {
    const kp1 = generateX25519KeyPair();
    const kp2 = generateX25519KeyPair();
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
    expect(kp1.privateKey).not.toBe(kp2.privateKey);
  });
});

describe('TOTP', () => {
  it('should generate and verify codes', () => {
    const secret = generateTotpSecret();
    const code = generateTotpCode(secret);
    expect(code.length).toBe(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
    expect(verifyTotpCode(secret, code)).toBe(true);
    expect(verifyTotpCode(secret, '000000')).toBe(false);
  });

  it('should generate different secrets', () => {
    const s1 = generateTotpSecret();
    const s2 = generateTotpSecret();
    expect(s1).not.toBe(s2);
  });

  it('should verify with time drift within window', () => {
    const secret = generateTotpSecret();
    const pastCode = generateTotpCode(secret, Date.now() - 30000);
    expect(verifyTotpCode(secret, pastCode)).toBe(true);
  });

  it('should verify with future time drift', () => {
    const secret = generateTotpSecret();
    const futureCode = generateTotpCode(secret, Date.now() + 30000);
    expect(verifyTotpCode(secret, futureCode)).toBe(true);
  });

  it('should reject code outside drift window', () => {
    const secret = generateTotpSecret();
    const oldCode = generateTotpCode(secret, Date.now() - 120000);
    expect(verifyTotpCode(secret, oldCode)).toBe(false);
  });

  it('should produce different codes for same secret at different times', () => {
    const secret = generateTotpSecret();
    const code1 = generateTotpCode(secret, 1000000);
    const code2 = generateTotpCode(secret, 2000000);
    expect(code1).not.toBe(code2);
  });
});

describe('Symmetric Encryption', () => {
  it('should encrypt and decrypt', () => {
    const key = generateSymmetricKey();
    const message = 'sensitive data';
    const encrypted = encryptSecretBox(message, key);
    const decrypted = decryptSecretBox(encrypted.ciphertext, encrypted.nonce, key);
    expect(decrypted).toBe(message);
  });

  it('should fail with wrong key', () => {
    const key1 = generateSymmetricKey();
    const key2 = generateSymmetricKey();
    const message = 'test';
    const encrypted = encryptSecretBox(message, key1);
    expect(() => decryptSecretBox(encrypted.ciphertext, encrypted.nonce, key2)).toThrow();
  });

  it('should handle empty messages', () => {
    const key = generateSymmetricKey();
    const encrypted = encryptSecretBox('', key);
    const decrypted = decryptSecretBox(encrypted.ciphertext, encrypted.nonce, key);
    expect(decrypted).toBe('');
  });

  it('should produce different nonces each encryption', () => {
    const key = generateSymmetricKey();
    const enc1 = encryptSecretBox('test', key);
    const enc2 = encryptSecretBox('test', key);
    expect(enc1.nonce).not.toBe(enc2.nonce);
  });

  it('should handle large data', () => {
    const key = generateSymmetricKey();
    const message = 'a'.repeat(50000);
    const encrypted = encryptSecretBox(message, key);
    const decrypted = decryptSecretBox(encrypted.ciphertext, encrypted.nonce, key);
    expect(decrypted).toBe(message);
  });

  it('should handle unicode text', () => {
    const key = generateSymmetricKey();
    const message = '🚀 unicode test: 您好, señor, café 🌟';
    const encrypted = encryptSecretBox(message, key);
    const decrypted = decryptSecretBox(encrypted.ciphertext, encrypted.nonce, key);
    expect(decrypted).toBe(message);
  });

  it('should generate unique keys', () => {
    const key1 = generateSymmetricKey();
    const key2 = generateSymmetricKey();
    expect(key1).not.toBe(key2);
  });
});

describe('Utils', () => {
  it('should encode and decode base64', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = encodeBase64(original);
    const decoded = decodeBase64(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should encode and decode hex', () => {
    const original = new Uint8Array([10, 20, 30, 40, 255]);
    const encoded = encodeHex(original);
    const decoded = decodeHex(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should handle empty arrays for base64', () => {
    const original = new Uint8Array([]);
    const encoded = encodeBase64(original);
    const decoded = decodeBase64(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should handle empty arrays for hex', () => {
    const original = new Uint8Array([]);
    const encoded = encodeHex(original);
    const decoded = decodeHex(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should handle full byte range for base64', () => {
    const original = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      original[i] = i;
    }
    const encoded = encodeBase64(original);
    const decoded = decodeBase64(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });

  it('should handle full byte range for hex', () => {
    const original = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      original[i] = i * 17;
    }
    const encoded = encodeHex(original);
    const decoded = decodeHex(encoded);
    expect(new Uint8Array(decoded)).toEqual(original);
  });
});
