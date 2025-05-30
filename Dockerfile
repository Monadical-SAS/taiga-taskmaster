# Multi-stage build for Taiga Task Master Webhook Service
# Stage 1: Build stage  
FROM node:20-alpine AS builder

# Enable pnpm via corepack (recommended by pnpm docs)
RUN corepack enable

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY tsconfig.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build all packages
RUN pnpm run build

# Deploy webhook package with all its dependencies using pnpm deploy
# This will include the built dist files
RUN pnpm --filter @taiga-task-master/webhook --prod deploy /app/deployed --legacy

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install global CLI dependencies
RUN npm install -g dotenv-cli@latest task-master-ai@latest

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webapp -u 1001

# Set working directory
WORKDIR /app

# Copy deployed package from builder stage (self-contained with all dependencies)
COPY --from=builder /app/deployed ./

# Copy docker entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create temp directory for webhook operations
RUN mkdir -p /app/temp

# Change ownership to non-root user
RUN chown -R webapp:nodejs /app

# Switch to non-root user
USER webapp

# Expose the webhook port
EXPOSE 3000

# Health check to ensure the service is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Set entrypoint to our script
ENTRYPOINT ["/docker-entrypoint.sh"]

# Default command
CMD []