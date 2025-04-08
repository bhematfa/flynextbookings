# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
