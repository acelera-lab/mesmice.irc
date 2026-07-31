import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ClientConfig } from './types.js';

export function getConfigDir(): string {
  const envDir = process.env['MESMICE_CONFIG_DIR'];
  const dir = envDir || join(homedir(), '.mesmice');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.toml');
}

export function loadConfig(): ClientConfig {
  const configPath = getConfigPath();

  const defaults: ClientConfig = {
    nickname: 'user',
    theme: 'dark',
    server: 'localhost',
    history: true,
  };

  if (!existsSync(configPath)) {
    return defaults;
  }

  try {
    const raw = readFileSync(configPath, 'utf-8');
    const config = parseToml(raw);
    return { ...defaults, ...config };
  } catch {
    return defaults;
  }
}

export function saveConfig(config: Partial<ClientConfig>): void {
  const current = loadConfig();
  const merged = { ...current, ...config };
  const toml = stringifyToml(merged);
  writeFileSync(getConfigPath(), toml, 'utf-8');
}

function parseToml(raw: string): Partial<ClientConfig> {
  const config: Partial<ClientConfig> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value: string = trimmed.slice(eqIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (value === 'true') {
      (config as Record<string, unknown>)[key] = true;
    } else if (value === 'false') {
      (config as Record<string, unknown>)[key] = false;
    } else {
      (config as Record<string, unknown>)[key] = value;
    }
  }
  return config;
}

function stringifyToml(config: ClientConfig): string {
  const lines = [
    `nickname="${config.nickname}"`,
    `theme="${config.theme}"`,
    `server="${config.server}"`,
    ...(config.port !== undefined ? [`port=${config.port}`] : []),
    `history=${config.history}`,
  ];
  return lines.join('\n') + '\n';
}
