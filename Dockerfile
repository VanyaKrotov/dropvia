ARG NODE_VERSION=22.22.3

FROM node:${NODE_VERSION}-bookworm-slim AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json .npmrc ./
RUN npm ci --include=dev

FROM dependencies AS build
COPY . .
RUN npm run build

FROM base AS production-dependencies
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node package.json ./package.json
USER node
EXPOSE 3000
CMD ["node", "node_modules/@react-router/serve/dist/cli.js", "./build/server/index.js"]
