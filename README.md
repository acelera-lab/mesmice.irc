# Mesmice.IRC

Modern, secure, privacy-focused IRC-inspired chat platform with a terminal client and a self-hostable server.

[![npm version](https://img.shields.io/npm/v/mesmice.svg)](https://www.npmjs.com/package/mesmice)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features

- **Terminal client** — full-featured TUI (blessed) inspired by Irssi
- **Self-hostable server** — full control over your data (Docker Compose)
- **Custom wire protocol** — length-prefixed binary protocol over TCP
- **Security** — scrypt password hashing, TOTP 2FA, Ed25519/X25519 keypairs
- **AI integration** — optional assistant via OpenRouter (`/ask`)

## Quick Start

### Client

```bash
npm install -g mesmice

# Connect to a server (localhost by default)
mesmice connect localhost --port 5002

# Or register an account first
mesmice register localhost --port 5001
mesmice login
```

### Server

```bash
git clone https://github.com/acelera-lab/mesmice.irc
cd mesmice.irc
cp .env.example .env   # set a strong DB_PASSWORD
docker compose up -d
```

The container runs `prisma db push` on first startup, so no manual migrations are needed.

## Architecture

```
┌─────────────┐
│  Client CLI │   npm package `mesmice`
└──────┬──────┘
       │ TCP (default 5002, or 80 behind a proxy)
┌──────▼──────┐
│   Server    │
├─────────────┤
│  TCP        │  chat protocol (commands, messages)
│  HTTP       │  REST API on 5001 (auth, channels, users)
│  PostgreSQL │  persistence (Prisma)
└─────────────┘
```

## Ports and Conventions

| Port | Use               | Notes                           |
| ---- | ----------------- | ------------------------------- |
| 5001 | HTTP API          | register, login, REST endpoints |
| 5002 | TCP chat protocol | connect/login from the CLI      |

When the server sits behind a reverse proxy, clients should **omit** `--port` so they connect on port 80.

## Security

- Passwords hashed with scrypt (N=131072, r=8, p=1, 256 MB memory limit)
- Session tokens stored server-side with 24-hour expiry; refresh tokens included
- All HTTP API routes (except `register`, `login` and `health`) require a valid session
- Optional TOTP two-factor authentication
- Ed25519 identity keypairs generated per user
- Rate limiting on HTTP API endpoints
- Container runs as non-root

See [docs/SECURITY.md](docs/SECURITY.md) for details and known limitations.

## Documentation

| Doc                                          | Description             |
| -------------------------------------------- | ----------------------- |
| [docs/INSTALL.md](docs/INSTALL.md)           | Installation guide      |
| [docs/CLI.md](docs/CLI.md)                   | CLI command reference   |
| [docs/API.md](docs/API.md)                   | HTTP API reference      |
| [docs/PROTOCOL.md](docs/PROTOCOL.md)         | Wire protocol reference |
| [docs/SECURITY.md](docs/SECURITY.md)         | Security policy         |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) | Contributing guide      |
| [docs/ROADMAP.md](docs/ROADMAP.md)           | Project roadmap         |

## License

[MIT](LICENSE)
