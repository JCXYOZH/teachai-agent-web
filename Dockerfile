# syntax=docker/dockerfile:1.4
# Production image for the TeachAI Agent web app.
# Node 16.16.0 matches the pinned runtime; Next.js 13.5.11 builds a standalone server.
#
# Rebuild speed comes from BuildKit cache mounts: the npm cache survives between
# builds, and Next.js reuses its webpack cache instead of recompiling everything.
# If the builder cannot enable BuildKit (DOCKER_BUILDKIT=0), delete the two
# `--mount=type=cache` lines; the resulting image is identical, just slower.
FROM node:16.16.0-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

FROM node:16.16.0-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Inlined at build time: changing it requires rebuilding the image.
ARG NEXT_PUBLIC_API_BASE_URL=/api/v1
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM node:16.16.0-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=49153 \
    HOSTNAME=0.0.0.0
RUN groupadd --gid 10001 nextjs \
 && useradd --uid 10001 --gid 10001 --create-home --shell /usr/sbin/nologin nextjs
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
USER nextjs
EXPOSE 49153
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:49153/login', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "server.js"]
