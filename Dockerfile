# MorroBlog 的 fnos 容器镜像：在镜像内构建前端与 Express 服务，运行时保留外部依赖。
FROM node:22-slim

WORKDIR /app

# 复制完整源码，确保 pnpm patches 在依赖安装前已进入构建上下文。
COPY . .

RUN npm install -g corepack@latest \
  && corepack pnpm install --frozen-lockfile \
  && corepack pnpm run build

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
