FROM node:20 AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app
# Kita copy file-file config utama dulu biar postinstall fumadocs-mdx jalan lancar
COPY package.json pnpm-lock.yaml* .npmrc source.config.ts next.config.mjs ./
RUN pnpm install --no-frozen-lockfile
# Baru copy sisanya
COPY . .
RUN pnpm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
