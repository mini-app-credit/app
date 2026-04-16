# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/src/shared/core/infrastructure/drizzle/schema ./src/shared/core/infrastructure/drizzle/schema
COPY package.json package-lock.json ./
COPY drizzle.config.ts ./

RUN npm ci --omit=dev && npm cache clean --force
USER node
CMD ["node", "dist/apps/api/apps/api/src/main.js"]
