# HTTP API Reference

The HTTP API is served on port `5001`. All routes are JSON.

## Authentication

The API uses **session tokens**. Log in to obtain a token, then send it in the
`Authorization` header for every protected request:

```
Authorization: Bearer <token>
```

Public routes (no token required): `register`, `login`, `health`.
All other routes return `401` without a valid token.

### Register

```
POST /api/auth/register
```

```json
{
  "username": "flavio",
  "password": "secure_password",
  "nickname": "Flavio",
  "publicKey": "optional_public_key"
}
```

Response `201`:

```json
{
  "id": "cms...",
  "username": "flavio",
  "nickname": "Flavio",
  "publicKey": "..."
}
```

Errors: `400` (missing fields / password < 8 chars), `409` (username or nickname taken).

### Login

```
POST /api/auth/login
```

```json
{
  "username": "flavio",
  "password": "secure_password",
  "totpCode": "123456"
}
```

`totpCode` is only required when the account has TOTP enabled. Response `200`:

```json
{
  "token": "<session_token>",
  "refreshToken": "<refresh_token>",
  "user": {
    "id": "cms...",
    "username": "flavio",
    "nickname": "Flavio",
    "bio": null,
    "publicKey": "...",
    "totpEnabled": false
  }
}
```

Errors: `400` (missing fields / TOTP code required), `401` (invalid credentials or TOTP code).

### Logout

```
POST /api/auth/logout
Authorization: Bearer <token>
```

Deletes the session. Response `200`: `{ "success": true }`.

## TOTP

### Setup

```
POST /api/auth/totp/setup
Authorization: Bearer <token>
```

Response `200` with the secret, a preview code and an otpauth URI:

```json
{
  "secret": "HEX...",
  "code": "123456",
  "uri": "otpauth://totp/Mesmice.IRC:flavio?secret=...&issuer=Mesmice.IRC"
}
```

### Verify

```
POST /api/auth/totp/verify
Authorization: Bearer <token>
```

```json
{
  "code": "123456"
}
```

On success TOTP is enabled for the account. Response `200`: `{ "success": true }`.
Errors: `400` (no secret set up / invalid code), `401` (invalid session).

## Channels

### List Channels

```
GET /api/channels
Authorization: Bearer <token>
```

Lists public channels only. Response `200`:

```json
{
  "channels": [
    {
      "id": "cms...",
      "name": "general",
      "topic": null,
      "type": "public",
      "_count": { "members": 3 },
      "createdAt": "..."
    }
  ]
}
```

### Get Channel Messages

```
GET /api/channels/:id/messages?limit=100
Authorization: Bearer <token>
```

`limit` is capped at 500 (default 100). Messages are returned oldest first.
Accessing a non-public channel requires membership (`403` otherwise).

```json
{
  "messages": [
    {
      "id": "cms...",
      "channelId": "cms...",
      "senderId": "cms...",
      "content": "Hello!",
      "type": "text",
      "encrypted": false,
      "expiresAt": null,
      "createdAt": "...",
      "sender": { "nickname": "Flavio" }
    }
  ]
}
```

### Get Channel Members

```
GET /api/channels/:id/members
Authorization: Bearer <token>
```

Accessing a non-public channel requires membership (`403` otherwise).

## Users

### Get User

```
GET /api/users/:id
Authorization: Bearer <token>
```

### Get User Channels

```
GET /api/users/:id/channels
Authorization: Bearer <token>
```

### Update Profile

```
PATCH /api/users/:id/profile
Authorization: Bearer <token>
```

```json
{
  "bio": "New bio",
  "avatarUrl": "https://..."
}
```

Only the owner of the account can edit its profile (`403` otherwise).

## Health

### Health Check

```
GET /health
```

Public. Response `200`:

```json
{
  "status": "ok",
  "timestamp": "...",
  "version": "0.1.0",
  "database": "connected"
}
```
