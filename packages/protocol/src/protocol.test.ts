import { describe, it, expect } from 'vitest';
import { createPacket, createErrorPacket, isPacket } from './packet.js';
import { encodePacket, decodePacket } from './codec.js';
import { COMMAND_DEFINITIONS, getHelpText } from './commands.js';
import { ProtocolError, ErrorCodes } from './errors.js';

describe('Packet', () => {
  it('should create a valid packet', () => {
    const packet = createPacket('message', { content: 'hello' });
    expect(packet.type).toBe('message');
    expect(packet.id).toBeTruthy();
    expect(packet.timestamp).toBeTruthy();
    expect(packet.payload).toEqual({ content: 'hello' });
  });

  it('should create error packet', () => {
    const packet = createErrorPacket('TEST_ERROR', 'Something went wrong');
    expect(packet.type).toBe('error');
    expect(packet.payload).toEqual({ code: 'TEST_ERROR', message: 'Something went wrong' });
  });

  it('should validate packets', () => {
    expect(isPacket(createPacket('ping', {}))).toBe(true);
    expect(isPacket(null)).toBe(false);
    expect(isPacket({})).toBe(false);
    expect(isPacket(undefined)).toBe(false);
    expect(isPacket('string')).toBe(false);
    expect(isPacket(123)).toBe(false);
  });

  it('should generate unique IDs', () => {
    const p1 = createPacket('ping', {});
    const p2 = createPacket('ping', {});
    expect(p1.id).not.toBe(p2.id);
  });

  it('should create packet with signature', () => {
    const packet = createPacket('auth', { token: 'abc' }, 'my-signature');
    expect(packet.signature).toBe('my-signature');
  });

  it('should create packet without signature', () => {
    const packet = createPacket('ping', {});
    expect(packet.signature).toBeUndefined();
  });
});

describe('Codec', () => {
  it('should encode and decode packets', () => {
    const packet = createPacket('message', { content: 'hello world', sender: 'test' });
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.type).toBe(packet.type);
    expect(decoded!.id).toBe(packet.id);
    expect(decoded!.payload).toEqual(packet.payload);
  });

  it('should handle empty payload', () => {
    const packet = createPacket('ping', {});
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.type).toBe('ping');
    expect(decoded!.payload).toEqual({});
  });

  it('should return null for too-short data', () => {
    expect(decodePacket(Buffer.from([0, 0, 0, 0]))).toBeNull();
    expect(decodePacket(Buffer.from([]))).toBeNull();
    expect(decodePacket(Buffer.alloc(2))).toBeNull();
    expect(decodePacket(Buffer.alloc(11))).toBeNull();
  });

  it('should return null for invalid magic', () => {
    const buf = Buffer.alloc(12);
    buf.writeUInt32BE(0xdeadbeef, 0);
    expect(decodePacket(buf)).toBeNull();
  });

  it('should encode and decode packets with signature', () => {
    const packet = createPacket('auth', { username: 'test' }, 'fake-signature');
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.signature).toBe('fake-signature');
  });

  it('should handle large payloads', () => {
    const largeContent = 'x'.repeat(50000);
    const packet = createPacket('message', { content: largeContent });
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    expect(decoded).not.toBeNull();
    expect((decoded!.payload as any).content.length).toBe(50000);
  });

  it('should handle payload with numeric values', () => {
    const packet = createPacket('message', { count: 42, ratio: 3.14 });
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.payload).toEqual({ count: 42, ratio: 3.14 });
  });

  it('should handle payload with nested objects', () => {
    const packet = createPacket('message', { nested: { a: 1, b: [2, 3] } });
    const encoded = encodePacket(packet);
    const decoded = decodePacket(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.payload).toEqual({ nested: { a: 1, b: [2, 3] } });
  });
});

describe('Commands', () => {
  it('should have all commands defined', () => {
    const commands = [
      'join',
      'msg',
      'me',
      'list',
      'leave',
      'ban',
      'kick',
      'nick',
      'help',
      'who',
      'whois',
      'topic',
      'create',
      'delete',
      'invite',
    ];
    for (const cmd of commands) {
      expect(COMMAND_DEFINITIONS[cmd]).toBeDefined();
    }
  });

  it('should return help text', () => {
    const help = getHelpText();
    expect(help).toContain('Available commands:');
    expect(help).toContain('/join');
    expect(help).toContain('/help');
  });

  it('should return specific command help', () => {
    const joinHelp = getHelpText('join');
    expect(joinHelp).toContain('join');
    expect(joinHelp).toContain('Usage:');
    expect(joinHelp).toContain('Required role:');
  });

  it('should return generic help for unknown command', () => {
    const help = getHelpText('unknown');
    expect(help).toContain('Available commands:');
    expect(help).toContain('/join');
  });

  it('should have correct command properties', () => {
    expect(COMMAND_DEFINITIONS['join']!.minRole).toBe('member');
    expect(COMMAND_DEFINITIONS['ban']!.minRole).toBe('moderator');
    expect(COMMAND_DEFINITIONS['delete']!.minRole).toBe('owner');
    expect(COMMAND_DEFINITIONS['list']!.minRole).toBe('guest');
  });

  it('should list all entries in help text', () => {
    const help = getHelpText();
    const entries = Object.keys(COMMAND_DEFINITIONS);
    for (const name of entries) {
      expect(help).toContain(`/${name}`);
    }
  });
});

describe('Errors', () => {
  it('should create protocol error', () => {
    const err = new ProtocolError('TEST', 'test error', 400);
    expect(err.code).toBe('TEST');
    expect(err.message).toBe('test error');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('ProtocolError');
  });

  it('should have default status code', () => {
    const err = new ProtocolError('TEST', 'msg');
    expect(err.statusCode).toBe(400);
  });

  it('should set different status code', () => {
    const err = new ProtocolError('NOT_FOUND', 'not found', 404);
    expect(err.statusCode).toBe(404);
  });

  it('should be instance of Error', () => {
    const err = new ProtocolError('CODE', 'message');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ProtocolError);
  });

  it('should have error codes defined', () => {
    expect(ErrorCodes.AUTH_FAILED).toBe('AUTH_FAILED');
    expect(ErrorCodes.NOT_AUTHORIZED).toBe('NOT_AUTHORIZED');
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ErrorCodes.CHANNEL_NOT_FOUND).toBe('CHANNEL_NOT_FOUND');
    expect(ErrorCodes.INVALID_PACKET).toBe('INVALID_PACKET');
    expect(ErrorCodes.USER_NOT_FOUND).toBe('USER_NOT_FOUND');
    expect(ErrorCodes.NICKNAME_TAKEN).toBe('NICKNAME_TAKEN');
  });

  it('should have all error codes as strings', () => {
    for (const code of Object.values(ErrorCodes)) {
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
    }
  });
});
