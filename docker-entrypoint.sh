#!/bin/sh
# @vibe-generated
# Docker entrypoint script for Taiga Task Master Webhook
# Generates .env file from environment variables and starts the webhook server

set -e

echo "🚀 Starting Taiga Task Master Webhook Server..."

# Function to check if a required environment variable is set
check_required_env() {
    eval "value=\$$1"
    if [ -z "$value" ]; then
        echo "❌ Error: Required environment variable $1 is not set"
        exit 1
    fi
}

# Check required environment variables
echo "🔍 Validating required environment variables..."
check_required_env "WEBHOOK_TOKEN"
check_required_env "TAIGA_USERNAME" 
check_required_env "TAIGA_PASSWORD"
check_required_env "TAIGA_PROJECT_ID"
check_required_env "ANTHROPIC_API_KEY"

echo "✅ Required environment variables validated"

# Generate .env file from environment variables
echo "📝 Generating .env file from environment variables..."
cat > /app/.env << EOF
# Generated .env file from Docker environment variables
# Generated at: $(date)

# Taiga API Configuration
TAIGA_BASE_URL=${TAIGA_BASE_URL:-https://api.taiga.io}
TAIGA_USERNAME=${TAIGA_USERNAME}
TAIGA_PASSWORD=${TAIGA_PASSWORD}
TAIGA_PROJECT_ID=${TAIGA_PROJECT_ID}

# AI API Keys
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}

# Webhook Server Configuration
WEBHOOK_TOKEN=${WEBHOOK_TOKEN}
PORT=${PORT:-3000}
EOF

echo "✅ .env file generated successfully"

# Verify CLI tools are available
echo "🔧 Verifying CLI tools..."
if ! command -v dotenv >/dev/null 2>&1; then
    echo "❌ Error: dotenv-cli not found"
    exit 1
fi

if ! command -v task-master >/dev/null 2>&1; then
    echo "❌ Error: task-master-ai not found"
    exit 1
fi

echo "✅ CLI tools verified"

# Show configuration (without sensitive values)
echo "📋 Configuration:"
echo "   Port: ${PORT:-3000}"
echo "   Taiga Base URL: ${TAIGA_BASE_URL:-https://api.taiga.io}"
echo "   Taiga Project ID: ${TAIGA_PROJECT_ID}"
echo "   Working Directory: $(pwd)"

# Execute the provided command or default to webhook server
if [ $# -eq 0 ]; then
    cd /app
    exec node dist/main.js
else
    echo "🚀 Executing custom command: $*"
    exec "$@"
fi