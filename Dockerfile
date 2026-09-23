FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run build

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

EXPOSE 3000

CMD ["sh", "-c", "NODE_ENV=production PORT=${PORT:-3000} node dist/server/index.js"]
