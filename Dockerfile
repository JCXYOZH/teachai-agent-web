# syntax=docker/dockerfile:1.4
# TeachAI Agent Web 前端生产镜像。
# Node 16.16.0 与约定的运行时一致；Next.js 13.5.11 构建为独立服务。
#
# 重复构建的速度来自 BuildKit 缓存挂载：npm 缓存可在多次构建间复用，
# Next.js 也会复用 webpack 缓存，避免整体重新编译。
# 若构建环境无法启用 BuildKit（DOCKER_BUILDKIT=0），删除两行
# `--mount=type=cache` 即可，镜像结果完全相同，只是更慢。
FROM node:16.16.0-slim AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

FROM node:16.16.0-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# 该参数在构建期写死，修改后必须重新构建镜像。
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
