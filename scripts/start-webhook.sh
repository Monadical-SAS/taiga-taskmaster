#!/bin/bash

# Taiga Task Master Webhook Server Startup Script

set -e

echo "🚀 Starting Taiga Task Master Webhook Server..."

# Check if .env file exists
if [[ ! -f .env ]]; then
    echo "❌ Error: .env file not found in project root"
    echo "📋 Please create .env with the following variables:"
    echo "   WEBHOOK_TOKEN=your-secret-token"
    echo "   PORT=3000  # optional, defaults to 3000"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [[ -z "$WEBHOOK_TOKEN" ]]; then
    echo "❌ Error: WEBHOOK_TOKEN environment variable is required"
    exit 1
fi

echo "✅ Environment variables validated"
echo "📡 Server will listen on port: ${PORT:-3000}"

# Build and start the webhook server
echo "🔨 Building packages..."
pnpm run build

echo "🚀 Starting webhook server..."
cd packages/webhook && pnpm run start