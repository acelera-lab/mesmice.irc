FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json tsconfig.json vitest.workspace.ts ./
COPY apps/ apps/
COPY packages/ packages/

RUN npm ci
RUN npx prisma generate --schema=packages/database/schema.prisma
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/server/dist/ ./apps/server/dist/

COPY --from=builder /app/node_modules/ ./node_modules/

RUN chown -R node:node /app
USER node

EXPOSE 5001
EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5001/health || exit 1

CMD ["sh", "-c", "./node_modules/.bin/prisma db push --schema=packages/database/schema.prisma --skip-generate && node apps/server/dist/index.js"]
