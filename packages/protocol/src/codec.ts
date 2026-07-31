import { PROTOCOL_MAGIC, PACKET_VERSION } from '@mesmice/common';
import type { ProtocolPacket, PacketType } from '@mesmice/common';

const HEADER_SIZE = 12; // magic(4) + version(4) + typeLen(2) + idLen(2)
const UTF8 = new TextEncoder();

export function encodePacket(packet: ProtocolPacket): Buffer {
  const typeBytes = UTF8.encode(packet.type);
  const idBytes = UTF8.encode(packet.id);
  const payloadStr = JSON.stringify(packet.payload);
  const payloadBytes = UTF8.encode(payloadStr);

  const typeLen = typeBytes.length;
  const idLen = idBytes.length;
  const payloadLen = payloadBytes.length;
  const sigLen = packet.signature ? UTF8.encode(packet.signature).length : 0;

  const totalSize =
    HEADER_SIZE +
    typeLen +
    idLen +
    4 + // payloadLen
    2 + // sigLen
    payloadLen +
    sigLen;

  const buf = Buffer.alloc(totalSize);
  let offset = 0;

  buf.writeUInt32BE(PROTOCOL_MAGIC, offset);
  offset += 4;
  buf.writeUInt32BE(PACKET_VERSION, offset);
  offset += 4;
  buf.writeUInt16BE(typeLen, offset);
  offset += 2;
  buf.writeUInt16BE(idLen, offset);
  offset += 2;

  buf.set(typeBytes, offset);
  offset += typeLen;
  buf.set(idBytes, offset);
  offset += idLen;

  buf.writeUInt32BE(payloadLen, offset);
  offset += 4;
  buf.writeUInt16BE(sigLen, offset);
  offset += 2;

  if (payloadLen > 0) {
    buf.set(payloadBytes, offset);
    offset += payloadLen;
  }

  if (sigLen > 0) {
    const sigBytes = UTF8.encode(packet.signature!);
    buf.set(sigBytes, offset);
  }

  return buf;
}

export function decodePacket(buffer: Buffer): ProtocolPacket | null {
  if (buffer.length < HEADER_SIZE) return null;

  let offset = 0;
  const magic = buffer.readUInt32BE(offset);
  offset += 4;

  if (magic !== PROTOCOL_MAGIC) return null;

  const version = buffer.readUInt32BE(offset);
  offset += 4;

  if (version !== PACKET_VERSION) return null;

  const typeLen = buffer.readUInt16BE(offset);
  offset += 2;
  const idLen = buffer.readUInt16BE(offset);
  offset += 2;

  if (buffer.length < offset + typeLen + idLen + 6) return null;

  const type = buffer.toString('utf-8', offset, offset + typeLen);
  offset += typeLen;
  const id = buffer.toString('utf-8', offset, offset + idLen);
  offset += idLen;

  const payloadLen = buffer.readUInt32BE(offset);
  offset += 4;
  const sigLen = buffer.readUInt16BE(offset);
  offset += 2;

  if (buffer.length < offset + payloadLen + sigLen) return null;

  let payload: unknown = null;
  if (payloadLen > 0) {
    const payloadStr = buffer.toString('utf-8', offset, offset + payloadLen);
    offset += payloadLen;
    try {
      payload = JSON.parse(payloadStr);
    } catch {
      return null;
    }
  }

  let signature: string | undefined;
  if (sigLen > 0) {
    signature = buffer.toString('utf-8', offset, offset + sigLen);
  }

  return {
    type: type as PacketType,
    id,
    timestamp: 0,
    payload,
    signature,
  };
}
