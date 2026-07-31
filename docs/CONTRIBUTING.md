# Contributing

## Development Setup

```bash
# Clone
git clone https://github.com/acelera-lab/mesmice.irc
cd mesmice.irc

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate --schema=packages/database/schema.prisma

# Build all packages
npm run build
```

## Project Structure

```
├── apps/
│   ├── server/          # Server application (HTTP + TCP)
│   └── cli/             # Terminal client
├── packages/
│   ├── ai/              # OpenRouter AI client
│   ├── common/          # Shared types and utilities
│   ├── crypto/          # Cryptographic operations
│   ├── database/        # Prisma schema and client
│   ├── protocol/        # Wire protocol
│   └── sdk/             # Client SDK
├── docs/                # Documentation
```

## Development Workflow

```bash
# Run server in dev mode
npm run dev:server

# Run CLI in dev mode
npm run dev:cli
```

## Testing

```bash
npm run test
npx vitest run          # run all tests
```

Tests live next to the source files (`*.test.ts`).

## Code Style

- TypeScript strict mode
- 2 space indentation
- Prettier for formatting (`npm run format`)

## Pull Request Process

1. Create a feature branch
2. Write tests for new functionality
3. Ensure all tests pass
4. Run `npm run build` and `npm run typecheck`
5. Submit PR with description

## Commit Messages

Follow conventional commits:

```
feat: add channel encryption
fix: resolve connection timeout
docs: update API reference
chore: bump dependencies
```
