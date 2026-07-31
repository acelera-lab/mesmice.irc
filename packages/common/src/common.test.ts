import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { hasMinRole, canManageRole, getDefaultRole } from './permissions.js';
import {
  PROTOCOL_MAGIC,
  MESMICE_VERSION,
  MAX_NICKNAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  SESSION_DURATION_HOURS,
  DEFAULT_CHANNELS,
  MAX_MESSAGE_LENGTH,
  MAX_CHANNEL_NAME_LENGTH,
  HISTORY_OPTIONS,
  TOTP_ISSUER,
} from './constants.js';
import { getConfigDir, getConfigPath, loadConfig, saveConfig } from './config.js';

describe('Permissions', () => {
  it('should check minimum role', () => {
    expect(hasMinRole('owner', 'member')).toBe(true);
    expect(hasMinRole('guest', 'member')).toBe(false);
    expect(hasMinRole('admin', 'moderator')).toBe(true);
    expect(hasMinRole('member', 'guest')).toBe(true);
    expect(hasMinRole('guest', 'owner')).toBe(false);
    expect(hasMinRole('owner', 'owner')).toBe(true);
    expect(hasMinRole('member', 'admin')).toBe(false);
  });

  it('should check role management', () => {
    expect(canManageRole('owner', 'admin')).toBe(true);
    expect(canManageRole('moderator', 'admin')).toBe(false);
    expect(canManageRole('admin', 'admin')).toBe(false);
    expect(canManageRole('owner', 'guest')).toBe(true);
    expect(canManageRole('member', 'moderator')).toBe(false);
    expect(canManageRole('owner', 'member')).toBe(true);
    expect(canManageRole('moderator', 'moderator')).toBe(false);
  });

  it('should get default roles', () => {
    expect(getDefaultRole(true)).toBe('owner');
    expect(getDefaultRole(false)).toBe('member');
  });
});

describe('Constants', () => {
  it('should have valid version', () => {
    expect(MESMICE_VERSION).toBe('0.1.10');
  });

  it('should have correct protocol magic', () => {
    expect(PROTOCOL_MAGIC).toBe(0x4d45534d);
  });

  it('should have valid constraints', () => {
    expect(MAX_NICKNAME_LENGTH).toBeGreaterThan(0);
    expect(MAX_NICKNAME_LENGTH).toBe(32);
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8);
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(SESSION_DURATION_HOURS).toBe(24);
    expect(MAX_MESSAGE_LENGTH).toBe(4096);
    expect(MAX_CHANNEL_NAME_LENGTH).toBe(64);
    expect(DEFAULT_CHANNELS).toContain('general');
    expect(DEFAULT_CHANNELS).toContain('random');
    expect(DEFAULT_CHANNELS.length).toBe(2);
    expect(HISTORY_OPTIONS).toContain('24h');
    expect(HISTORY_OPTIONS).toContain('never');
    expect(TOTP_ISSUER).toBe('Mesmice.IRC');
  });
});

describe('Config', () => {
  beforeEach(() => {
    process.env['MESMICE_CONFIG_DIR'] = join(tmpdir(), 'mesmice-test-config');
    rmSync(process.env['MESMICE_CONFIG_DIR']!, { recursive: true, force: true });
  });

  afterEach(() => {
    delete process.env['MESMICE_CONFIG_DIR'];
  });

  it('should return config directory path', () => {
    const dir = getConfigDir();
    expect(dir).toContain('mesmice');
  });

  it('should return config file path', () => {
    const path = getConfigPath();
    expect(path).toContain('config.toml');
    expect(path).toContain('mesmice');
  });

  it('should load config with defaults', () => {
    const config = loadConfig();
    expect(config.nickname).toBeDefined();
    expect(config.nickname).toBe('user');
    expect(config.theme).toBe('dark');
    expect(config.history).toBe(true);
    expect(config.server).toBe('localhost');
  });

  it('should save and reload config', () => {
    saveConfig({ nickname: 'test-user' });
    const config = loadConfig();
    expect(config.nickname).toBe('test-user');
    expect(config.theme).toBe('dark');
    saveConfig({ nickname: 'user' });
  });
});
