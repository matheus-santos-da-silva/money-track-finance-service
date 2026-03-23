FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install
COPY . .

RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" yarn prisma generate
RUN yarn build

# Stage 2: Produção
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

RUN yarn prisma generate

EXPOSE 3001

CMD ["yarn", "start:prod"]
