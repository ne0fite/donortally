# Stage 1: Build client
FROM node:20-alpine AS client-builder
WORKDIR /build
RUN npm install -g pnpm
COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY client/ ./
RUN pnpm build

# Stage 2: Build API
FROM node:20-alpine AS api-builder
WORKDIR /build
RUN npm install -g pnpm
COPY api/package.json api/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY api/ ./
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm

COPY api/package.json api/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --shamefully-hoist

# copy compiled api
COPY --from=api-builder /build/dist ./dist

# copy migrations + sequelize config
COPY api/.sequelizerc ./.sequelizerc
COPY api/src/config ./src/config
COPY api/src/migrations ./src/migrations
COPY api/src/models ./src/models

# copy built client
COPY --from=client-builder /build/www ./public

EXPOSE 3000

CMD ["node", "dist/main"]
