# Multi-stage build for React frontend
FROM node:20-alpine AS builder

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json ./

# Copy all packages for workspace resolution
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the frontend package
WORKDIR /app/packages/tasks-machine-simulator-frontend
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/packages/tasks-machine-simulator-frontend/dist /usr/share/nginx/html

# Copy nginx configuration for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]