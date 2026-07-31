import { randomUUID } from 'node:crypto';
import type { PacketType, ProtocolPacket } from '@mesmice/common';

export function createPacket(
  type: PacketType,
  payload: unknown,
  signature?: string,
): ProtocolPacket {
  return {
    type,
    id: randomUUID(),
    timestamp: Date.now(),
    payload,
    signature,
  };
}

export function createErrorPacket(code: string, message: string): ProtocolPacket {
  return createPacket('error', { code, message });
}

export function isPacket(data: unknown): data is ProtocolPacket {
  if (typeof data !== 'object' || data === null) return false;
  const pkt = data as Record<string, unknown>;
  return (
    typeof pkt['type'] === 'string' &&
    typeof pkt['id'] === 'string' &&
    typeof pkt['timestamp'] === 'number'
  );
}
