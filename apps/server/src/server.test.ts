import { describe, it, expect } from 'vitest';
import { createServer } from './server.js';

describe('ShadowServer', () => {
  it('should create server with empty state', () => {
    const server = createServer();
    expect(server.state.users.size).toBe(0);
    expect(server.state.channels.size).toBe(0);
    expect(server.state.connections.size).toBe(0);
    expect(server.state.members.size).toBe(0);
  });

  it('should register and remove connections', () => {
    const server = createServer();
    const conn = server.registerConnection('test-conn-1');
    expect(conn.authenticated).toBe(false);
    expect(conn.userId).toBeNull();
    expect(conn.nickname).toBeNull();
    expect(conn.channels.size).toBe(0);
    expect(conn.currentChannel).toBeNull();
    expect(server.state.connections.size).toBe(1);

    server.removeConnection('test-conn-1');
    expect(server.state.connections.size).toBe(0);
  });

  it('should handle removing non-existent connection', () => {
    const server = createServer();
    expect(() => server.removeConnection('non-existent')).not.toThrow();
    expect(server.state.connections.size).toBe(0);
  });

  it('should authenticate connections', () => {
    const server = createServer();
    server.registerConnection('conn-1');
    server.authenticateConnection('conn-1', 'user-1', 'Flavio');

    const conn = server.getConnection('conn-1');
    expect(conn?.authenticated).toBe(true);
    expect(conn?.userId).toBe('user-1');
    expect(conn?.nickname).toBe('Flavio');
  });

  it('should authenticate without prior registration', () => {
    const server = createServer();
    server.authenticateConnection('ghost', 'u1', 'Ghost');
    expect(server.getConnection('ghost')).toBeUndefined();
  });

  it('should return undefined for unknown connection', () => {
    const server = createServer();
    expect(server.getConnection('unknown')).toBeUndefined();
  });

  it('should manage channel membership', () => {
    const server = createServer();
    server.registerConnection('conn-1');
    server.authenticateConnection('conn-1', 'user-1', 'Flavio');

    server.joinChannel('conn-1', 'general');
    const conn = server.getConnection('conn-1');
    expect(conn?.channels.has('general')).toBe(true);
    expect(conn?.currentChannel).toBe('general');

    server.joinChannel('conn-1', 'random');
    expect(conn?.channels.has('random')).toBe(true);
    expect(conn?.currentChannel).toBe('random');

    server.leaveChannel('conn-1', 'general');
    expect(conn?.channels.has('general')).toBe(false);
    expect(conn?.currentChannel).toBe('random');

    server.leaveChannel('conn-1', 'random');
    expect(conn?.channels.size).toBe(0);
    expect(conn?.currentChannel).toBeNull();
  });

  it('should handle multiple connections', () => {
    const server = createServer();
    const conn1 = server.registerConnection('conn-1');
    const conn2 = server.registerConnection('conn-2');

    server.authenticateConnection('conn-1', 'user-1', 'Alice');
    server.authenticateConnection('conn-2', 'user-2', 'Bob');

    server.joinChannel('conn-1', 'general');
    server.joinChannel('conn-2', 'general');

    expect(server.state.connections.size).toBe(2);
    expect(conn1.currentChannel).toBe('general');
    expect(conn2.currentChannel).toBe('general');
    expect(conn1.nickname).toBe('Alice');
    expect(conn2.nickname).toBe('Bob');
  });

  it('should clean up channels on remove', () => {
    const server = createServer();
    server.registerConnection('conn-1');
    server.authenticateConnection('conn-1', 'user-1', 'User1');
    server.joinChannel('conn-1', 'general');
    server.joinChannel('conn-1', 'random');

    expect(server.state.connections.size).toBe(1);
    const conn = server.getConnection('conn-1');
    expect(conn?.channels.size).toBe(2);

    server.removeConnection('conn-1');
    expect(server.state.connections.size).toBe(0);
  });

  it('should handle duplicate channel joins', () => {
    const server = createServer();
    server.registerConnection('conn-1');
    server.joinChannel('conn-1', 'general');
    server.joinChannel('conn-1', 'general');
    const conn = server.getConnection('conn-1');
    expect(conn?.channels.size).toBe(1);
  });

  it('should handle leaving non-joined channel', () => {
    const server = createServer();
    server.registerConnection('conn-1');
    expect(() => server.leaveChannel('conn-1', 'nonexistent')).not.toThrow();
  });

  it('should handle operations on unknown connection', () => {
    const server = createServer();
    expect(() => server.joinChannel('ghost', 'general')).not.toThrow();
    expect(() => server.leaveChannel('ghost', 'general')).not.toThrow();
  });

  it('should maintain state isolation between servers', () => {
    const server1 = createServer();
    const server2 = createServer();

    server1.registerConnection('conn-1');
    server2.registerConnection('conn-1');

    server1.authenticateConnection('conn-1', 'user-1', 'Alice');
    expect(server1.getConnection('conn-1')?.nickname).toBe('Alice');
    expect(server2.getConnection('conn-1')?.authenticated).toBe(false);
  });

  it('should switch current channel correctly', () => {
    const server = createServer();
    server.registerConnection('conn-1');
    server.joinChannel('conn-1', 'alpha');
    server.joinChannel('conn-1', 'beta');
    server.joinChannel('conn-1', 'gamma');

    const conn = server.getConnection('conn-1');
    expect(conn?.currentChannel).toBe('gamma');
    expect(conn?.channels.size).toBe(3);

    server.leaveChannel('conn-1', 'gamma');
    expect(conn?.currentChannel).toBe('alpha');
  });

  it('should be an event emitter', () => {
    const server = createServer();
    expect(typeof server.on).toBe('function');
    expect(typeof server.emit).toBe('function');
  });
});
