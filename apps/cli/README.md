# Mesmice.IRC Client

Terminal client for Mesmice.IRC — a modern, secure, IRC-inspired chat platform.

## Install

Requires Node.js >= 22.

```bash
npm install -g mesmice
```

## Quick Start

```bash
# Register an account on a server (HTTP API)
mesmice register localhost --port 5001

# Connect and start chatting (TCP protocol)
mesmice connect localhost --port 5002
```

Omit `--port` when the server is behind a reverse proxy or on the default port (80).

## Commands

| Command                        | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| `mesmice connect <host>`       | Connect to a Mesmice server and start the TUI      |
| `mesmice register [host]`      | Register a new account                             |
| `mesmice login`                | Validate credentials against the configured server |
| `mesmice disconnect`           | Clear the session                                  |
| `mesmice config [key] [value]` | View or edit configuration                         |
| `mesmice keys`                 | Manage cryptographic keys                          |
| `mesmice doctor`               | Check system dependencies                          |
| `mesmice version`              | Show version                                       |
| `mesmice help [command]`       | Show help                                          |

## In-Chat Commands

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `/join #channel`   | Join a channel                                   |
| `/msg user text`   | Send a private message                           |
| `/me action`       | Send an action message                           |
| `/list`            | List channels                                    |
| `/leave [channel]` | Leave a channel                                  |
| `/nick name`       | Change nickname                                  |
| `/who`             | List users in the current channel                |
| `/whois user`      | Show user info                                   |
| `/topic [text]`    | View or set channel topic                        |
| `/create name`     | Create a channel                                 |
| `/invite user ch`  | Invite a user to a channel                       |
| `/ask question`    | Ask the AI assistant (server must be configured) |
| `/ai`              | AI settings                                      |
| `/clear`           | Clear the screen                                 |
| `/help`            | Show in-chat help                                |

## Configuration

Stored at `~/.mesmice/config.toml` (override with `MESMICE_CONFIG_DIR`):

```toml
nickname="user"
theme="dark"
server="localhost"
history=true
```

`port` is only written when you connect with `--port`; omit it for proxy/default connections.

See [docs/CLI.md](../../docs/CLI.md) for the full reference.

## License

[MIT](../../LICENSE)
