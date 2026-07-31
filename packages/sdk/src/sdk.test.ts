import { describe, it, expect } from 'vitest';
import { createAuthPacket, parseAuthResponse } from './auth.js';
import { ShadowClient } from './client.js';
import { ShadowConnection } from './connection.js';
import type { ProtocolPacket } from '@mesmice/common';

describe('Auth', () => {
  it('should create auth packet', () => {
    const packet = createAuthPacket({
      username: 'testuser',
      password: 'testpass',
    });
    expect(packet.type).toBe('auth');
    expect(packet.id).toBeTruthy();
    expect(packet.timestamp).toBeGreaterThan(0);
    expect(packet.payload).toHaveProperty('username', 'testuser');
    expect(packet.payload).toHaveProperty('password', 'testpass');
  });

  it('should create auth packet with TOTP', () => {
    const packet = createAuthPacket({
      username: 'test',
      password: 'pass',
      totpCode: '123456',
    });
    expect((packet.payload as any).totpCode).toBe('123456');
  });

  it('should create auth packet without TOTP', () => {
    const packet = createAuthPacket({
      username: 'test',
      password: 'pass',
    });
    expect((packet.payload as any).totpCode).toBeUndefined();
  });

  it('should parse successful auth response', () => {
    const successPacket: ProtocolPacket = {
      type: 'auth_response',
      id: 'test',
      timestamp: Date.now(),
      payload: { success: true, token: 'abc123', refreshToken: 'def456' },
    };
    const result = parseAuthResponse(successPacket);
    expect(result.success).toBe(true);
    expect(result.token).toBe('abc123');
    expect(result.refreshToken).toBe('def456');
    expect(result.error).toBeUndefined();
  });

  it('should parse failed auth response', () => {
    const failPacket: ProtocolPacket = {
      type: 'auth_response',
      id: 'test',
      timestamp: Date.now(),
      payload: { success: false, error: 'Invalid credentials' },
    };
    const result = parseAuthResponse(failPacket);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid credentials');
    expect(result.token).toBeUndefined();
  });

  it('should handle missing fields in response', () => {
    const packet: ProtocolPacket = {
      type: 'auth_response',
      id: 'test',
      timestamp: Date.now(),
      payload: {},
    };
    const result = parseAuthResponse(packet);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication failed');
  });

  it('should handle non-auth response type', () => {
    const packet: ProtocolPacket = {
      type: 'ping',
      id: 'test',
      timestamp: Date.now(),
      payload: { success: true },
    };
    const result = parseAuthResponse(packet);
    expect(result.success).toBe(false);
  });

  it('should generate unique packet IDs', () => {
    const p1 = createAuthPacket({ username: 'a', password: 'b' });
    const p2 = createAuthPacket({ username: 'a', password: 'b' });
    expect(p1.id).not.toBe(p2.id);
  });
});

describe('ShadowClient', () => {
  it('should create client with options', () => {
    const client = new ShadowClient({ host: 'localhost', port: 5002 });
    expect(client).toBeDefined();
    expect(client.isAuthenticated()).toBe(false);
  });

  it('should create client with different ports', () => {
    const client = new ShadowClient({ host: 'example.com', port: 5001 });
    expect(client).toBeDefined();
    expect(client.isAuthenticated()).toBe(false);
  });

  it('should be an event emitter', () => {
    const client = new ShadowClient({ host: 'localhost', port: 5002 });
    expect(typeof client.on).toBe('function');
    expect(typeof client.emit).toBe('function');
  });

  it('should expose send methods', () => {
    const client = new ShadowClient({ host: 'localhost', port: 5002 });
    expect(typeof client.sendMessage).toBe('function');
    expect(typeof client.joinChannel).toBe('function');
    expect(typeof client.leaveChannel).toBe('function');
    expect(typeof client.sendCommand).toBe('function');
  });

  it('should expose connect and disconnect methods', () => {
    const client = new ShadowClient({ host: 'localhost', port: 5002 });
    expect(typeof client.connect).toBe('function');
    expect(typeof client.disconnect).toBe('function');
  });
});

describe('ShadowConnection', () => {
  it('should create connection with options', () => {
    const conn = new ShadowConnection({ host: 'localhost', port: 5002 });
    expect(conn).toBeDefined();
    expect(conn.isConnected()).toBe(false);
  });

  it('should be an event emitter', () => {
    const conn = new ShadowConnection({ host: 'localhost', port: 5002 });
    expect(typeof conn.on).toBe('function');
  });

  it('should reject connect to unreachable host', { timeout: 15000 }, async () => {
    const conn = new ShadowConnection({ host: '192.0.2.1', port: 1 });
    await expect(conn.connect()).rejects.toThrow();
    expect(conn.isConnected()).toBe(false);
  });

  it('should reject sendPacket when not connected', async () => {
    const conn = new ShadowConnection({ host: 'localhost', port: 5002 });
    await expect(conn.sendPacket({} as any)).rejects.toThrow('Not connected');
  });

  it('should expose send method', () => {
    const conn = new ShadowConnection({ host: 'localhost', port: 5002 });
    expect(typeof conn.send).toBe('function');
  });

  it('should create connection with default methods', () => {
    const conn = new ShadowConnection({ host: '127.0.0.1', port: 5002 });
    expect(conn.isConnected()).toBe(false);
    expect(typeof conn.connect).toBe('function');
    expect(typeof conn.disconnect).toBe('function');
  });
});
