# Security Policy

## Encryption

### Password Storage

- Algorithm: scrypt (N=131072, r=8, p=1, memory limit 256 MB)
- Salt: random 16 bytes per password
- Format: `$shadow$scrypt$N=...,r=...,p=...$<salt>$<hash>`

### Authentication

- Session tokens (random UUIDs) stored server-side in PostgreSQL
- Session expiry: 24 hours
- Optional TOTP (time-based one-time password) two-factor authentication
- Tokens are sent via the `Authorization: Bearer <token>` header on the HTTP API

### Identity Keypairs

- Ed25519 keypair generated per user at registration (used for identity and signing)
- X25519 available for future key exchange (see Roadmap)

## Network Security

- Rate limiting on all HTTP API endpoints (100 requests / minute by default)
- TLS: terminate at your reverse proxy (nginx, Caddy, Coolify, etc.)
- The TCP chat protocol is plaintext; TLS for TCP is planned (see Roadmap)

## Server Security

- Docker containers run as non-root (`USER node`)
- PostgreSQL requires authentication (`DB_PASSWORD`)
- No secrets are stored in the repository; use `.env` and keep it out of version control

## Known Limitations

- Message content is stored and transmitted **without end-to-end encryption**.
  End-to-end encryption (X25519 + NaCl SecretBox) is planned — see
  [ROADMAP.md](ROADMAP.md).
- Chat protocol traffic is not encrypted in transit; use a reverse proxy with
  TLS or a VPN when connecting over untrusted networks.

## Responsible Disclosure

If you discover a security vulnerability, please report it privately. Do NOT
disclose vulnerabilities publicly until they have been addressed.

## Reporting Process

1. Open a private security issue in the repository
2. Include steps to reproduce
3. We will acknowledge within 48 hours
4. We aim to fix critical issues within 7 days
