# Multi-stage build for optimized production image
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Only copy over the production node_modules and built dist
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Use non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S expressjs -u 1001
USER expressjs

EXPOSE 3000

CMD ["npm", "start"]
