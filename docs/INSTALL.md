# Installation

## Server

### Requirements

- Node.js >= 22
- Docker & Docker Compose (recommended)
- PostgreSQL 16 (if not using Docker)

### Docker Compose (Recommended)

```bash
git clone https://github.com/acelera-lab/mesmice.irc
cd mesmice.irc

cp .env.example .env
# Edit .env with secure passwords

docker compose up -d
```

### Manual

```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate --schema=packages/database/schema.prisma

# Build
npm run build

# Run database migrations
npx prisma db push --schema=packages/database/schema.prisma

# Start
NODE_ENV=production node apps/server/dist/index.js
```

## Client

### npm (Recommended)

```bash
npm install -g mesmice
```

### Build from source

```bash
git clone https://github.com/acelera-lab/mesmice.irc
cd mesmice.irc
npm ci
npm run build
npm start -w apps/cli
```
