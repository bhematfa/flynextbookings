FROM node:18 AS builder
WORKDIR /app
# Install minimal dependencies for Prisma, bcrypt, and Puppeteer
RUN apt-get update && apt-get install -y \
    openssl \
    build-essential \
    python3 \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18 AS runner
WORKDIR /app
# Install minimal runtime dependencies for Prisma and Puppeteer
RUN apt-get update && apt-get install -y \
    openssl \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]