# CLI Reference

## Installation

```bash
npm install -g mesmice
```

Requires Node.js >= 22.

## Commands

### `mesmice help [command]`

Show help for all commands or a specific command.

```
mesmice help
mesmice help connect
```

### `mesmice connect <host> [--port <port>]`

Connect to a Mesmice.IRC server and start the TUI. You will be prompted for
your username and password; if the account does not exist, you can register
one inline.

Omit `--port` when the server is behind a reverse proxy or on the default
port (80). Use `--port` for direct connections.

If the given port does not answer the chat protocol (e.g. you passed the HTTP
API port 5001), the CLI automatically retries on the paired port (5001 ↔ 5002)
and saves the working one to the config.

```
mesmice connect chat.example.com
mesmice connect localhost --port 5002
```

### `mesmice register [host] [--port <port>]`

Register a new account on the HTTP API. If no host is given, the configured
server is used. Omit `--port` when the server is behind a reverse proxy or on
the default port (80).

```
mesmice register
Username: flavio
Password (min 8 chars):
Nickname: Flavio
```

```
mesmice register myserver.com --port 5001
```

### `mesmice login`

Login to the configured server (validates credentials and saves the session).

```
mesmice login
Username: flavio
Password:
```

### `mesmice disconnect`

Clear the current session.

### `mesmice config [key] [value]`

View or modify configuration.

```
mesmice config
mesmice config nickname Flavio
mesmice config server
```

### `mesmice keys [--export] [--import <file>]`

Manage cryptographic keys.

```
mesmice keys
mesmice keys --export
mesmice keys --import ./mykey.pub
```

### `mesmice doctor`

Run system diagnostics.

### `mesmice version`

Show version information.

## In-Chat Commands

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `/join #channel`   | Join a channel                                   |
| `/msg user text`   | Send private message                             |
| `/me action`       | Send action message                              |
| `/list`            | List channels                                    |
| `/leave [channel]` | Leave channel                                    |
| `/nick name`       | Change nickname                                  |
| `/who`             | List users in current channel                    |
| `/whois user`      | User info                                        |
| `/topic [text]`    | View or set topic                                |
| `/create name`     | Create channel                                   |
| `/invite user ch`  | Invite user                                      |
| `/ask question`    | Ask the AI assistant (requires server AI config) |
| `/ai`              | AI settings                                      |
| `/clear`           | Clear screen                                     |
| `/help`            | Show this help                                   |

## Keyboard Shortcuts

| Key                   | Action                                      |
| --------------------- | ------------------------------------------- |
| `Tab`                 | Toggle focus between input and channel list |
| `↑` / `↓`             | Navigate input history                      |
| `PageUp` / `PageDown` | Scroll messages                             |
| `Ctrl+L`              | Clear messages                              |
| `Ctrl+C`              | Disconnect and exit                         |

## Configuration File

Stored at `~/.mesmice/config.toml` (override with the `MESMICE_CONFIG_DIR`
environment variable):

```toml
nickname="Flavio"
theme="dark"
server="localhost"
port=5002
history=true
```

`port` is only written when you connect with `--port`; omit it for
proxy/default connections. `theme` and `history` are reserved for future use.
