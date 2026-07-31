import { generateEd25519KeyPair, generateX25519KeyPair } from '@mesmice/crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const KEY_DIR = join(homedir(), '.mesmice', 'keys');

export function keysCommand(options: { export?: boolean; import?: string }): void {
  if (options.export) {
    exportPublicKey();
  } else if (options.import) {
    importKey(options.import);
  } else {
    generateKeys();
  }
}

function generateKeys(): void {
  const ed25519 = generateEd25519KeyPair();
  const x25519 = generateX25519KeyPair();

  if (!existsSync(KEY_DIR)) {
    mkdirSync(KEY_DIR, { recursive: true });
  }

  writeFileSync(join(KEY_DIR, 'ed25519_private.key'), ed25519.secretKey, 'utf-8');
  writeFileSync(join(KEY_DIR, 'ed25519_public.key'), ed25519.publicKey, 'utf-8');
  writeFileSync(join(KEY_DIR, 'x25519_private.key'), x25519.privateKey, 'utf-8');
  writeFileSync(join(KEY_DIR, 'x25519_public.key'), x25519.publicKey, 'utf-8');

  console.log('Keys generated and saved to ~/.mesmice/keys/');
  console.log(`  Ed25519 Public: ${ed25519.publicKey.slice(0, 32)}...`);
  console.log(`  X25519 Public:  ${x25519.publicKey.slice(0, 32)}...`);
}

function exportPublicKey(): void {
  const pubKeyPath = join(KEY_DIR, 'ed25519_public.key');
  if (!existsSync(pubKeyPath)) {
    console.log('No keys found. Run "mesmice keys" to generate them first.');
    return;
  }
  const pubKey = readFileSync(pubKeyPath, 'utf-8').trim();
  console.log('Your Ed25519 Public Key:');
  console.log(pubKey);
}

function importKey(filePath: string): void {
  if (!existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  if (!existsSync(KEY_DIR)) {
    mkdirSync(KEY_DIR, { recursive: true });
  }

  const content = readFileSync(filePath, 'utf-8').trim();
  const destName = filePath.includes('private') ? 'ed25519_private.key' : 'ed25519_public.key';
  writeFileSync(join(KEY_DIR, destName), content, 'utf-8');
  console.log(`Key imported to ~/.mesmice/keys/${destName}`);
}
