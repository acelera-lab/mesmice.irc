# Mesmice.IRC Protocol

## Overview

Mesmice.IRC uses a custom binary protocol over TCP.
Packets are length-prefixed and contain structured data.

## Packet Format

```
┌─────────────────────────────────┐
│ Magic      (4 bytes) 0x4D45534D │  'MESM'
│ Version    (4 bytes)            │
│ Type Len   (2 bytes)            │
│ ID Len     (2 bytes)            │
│ Type       (variable)           │
│ ID         (variable)           │
│ Payload Len (4 bytes)           │
│ Sig Len    (2 bytes)            │
│ Payload    (variable)           │
│ Signature  (variable)           │
└─────────────────────────────────┘
```

## Packet Types

| Type               | Direction | Description            |
| ------------------ | --------- | ---------------------- |
| `auth`             | C→S       | Authentication request |
| `auth_response`    | S→C       | Authentication result  |
| `message`          | S→C       | Chat message           |
| `command`          | C→S       | Execute command        |
| `command_response` | S→C       | Command result         |
| `error`            | S→C       | Error notification     |
| `ping`             | Both      | Keepalive ping         |
| `pong`             | Both      | Keepalive pong         |

## Authentication

```json
{
  "type": "auth",
  "payload": {
    "username": "flavio",
    "password": "...",
    "totpCode": "123456"
  }
}
```

## Commands

Commands are sent as `command` packets and processed server-side.

Supported commands: `join`, `msg`, `me`, `list`, `leave`, `nick`, `help`, `who`, `whois`, `topic`, `create`, `invite`, `ask`, `ai`

## Error Codes

| Code                 | Description                    |
| -------------------- | ------------------------------ |
| `INVALID_PACKET`     | Malformed packet               |
| `AUTH_FAILED`        | Authentication failed          |
| `NOT_AUTHENTICATED`  | Action requires authentication |
| `NOT_AUTHORIZED`     | Insufficient permissions       |
| `CHANNEL_NOT_FOUND`  | Channel does not exist         |
| `USER_NOT_FOUND`     | User does not exist            |
| `ALREADY_IN_CHANNEL` | User is already in the channel |
| `NICKNAME_TAKEN`     | Nickname already in use        |
| `CHANNEL_LIMIT`      | Channel limit reached          |
| `RATE_LIMITED`       | Too many requests              |
| `INVALID_NICKNAME`   | Nickname is not allowed        |
| `MESSAGE_TOO_LONG`   | Message exceeds max length     |
| `INTERNAL_ERROR`     | Server error                   |
