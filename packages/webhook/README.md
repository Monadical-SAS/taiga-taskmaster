# @taiga-task-master/webhook

# @vibe-generated

Webhook receiver implementation that conforms to webhook-interface.

## Features

- HTTP server for receiving Taiga user story webhooks
- HMAC-SHA1 signature validation using webhook tokens
- Payload validation and processing for user stories with "prd" tag
- Integration with task generation and sync services
- Error handling and logging
- Graceful shutdown handling

## Quick Start

### Environment Variables

Requires the following in the root `.env` file:

- `WEBHOOK_TOKEN` - Secret token for HMAC-SHA1 signature validation (required)
- `PORT` - Server port (optional, defaults to 3000)
- `TAIGA_BASE_URL` - Taiga API base URL (optional, defaults to https://api.taiga.io)
- `TAIGA_USERNAME` - Taiga username for API authentication (required)
- `TAIGA_PASSWORD` - Taiga password for API authentication (required)
- `TAIGA_PROJECT_ID` - Taiga project ID for task synchronization (required)

Add these to your root `.env` file:

```bash
WEBHOOK_TOKEN=token
PORT=3004
TAIGA_BASE_URL=https://api.taiga.io
TAIGA_USERNAME=your-taiga-username
TAIGA_PASSWORD=your-taiga-password
TAIGA_PROJECT_ID=123
```

### Running the Server

#### From Project Root (Recommended)

```bash
# Start with environment validation (loads .env automatically)
pnpm run webhook:start

# Or quick start (builds and runs with .env loading)
pnpm run webhook:dev
```

#### From Webhook Package Directory

```bash
# From project root (uses dotenv)
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/webhook run start:dev

# Or manually set environment variables
cd packages/webhook
export WEBHOOK_TOKEN=your-secret-token-here
export PORT=3000
pnpm run start:dev
```

#### Docker/Production Setup

##### Local Development with Docker

```bash
# Build all packages first (from project root)
pnpm --filter="!*-test" --filter="!@taiga-task-master/webhook" run build

# Start webhook server with environment loading
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/webhook run start
```

##### Docker Compose (Recommended)

The webhook can be run in a Docker container using docker-compose, which automatically picks up your `.env` file:

```bash
# 1. Create your .env file (copy from example)
cp .env.example .env

# 2. Edit .env with your actual values
vim .env  # or your preferred editor

# 3. Run with docker-compose
docker-compose up -d
```

**Required .env variables for Docker:**

```bash
# Taiga API Configuration
TAIGA_BASE_URL=https://api.taiga.io
TAIGA_USERNAME=your_username
TAIGA_PASSWORD=your_password
TAIGA_PROJECT_ID=your_project_id

# AI API Keys
ANTHROPIC_API_KEY=sk-ant-
PERPLEXITY_API_KEY=pplx-

# Webhook Server Configuration
WEBHOOK_TOKEN=your-secret-webhook-token
PORT=3000
```

**Docker Compose Commands:**

```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild and start (after code changes)
docker-compose up -d --build

# Check status
docker-compose ps
```

**Access Points:**

- Webhook endpoint: `http://localhost:3004/api/taiga-webhook`
- Health check: `http://localhost:3004/health`

The Docker setup uses `pnpm deploy` for efficient containerization and automatically handles environment variable injection from your `.env` file.

### API Endpoint

**POST** `/api/taiga-webhook`

Headers:

```
x-taiga-webhook-signature: <HMAC-SHA1 hex signature of request body>
Content-Type: application/json
```

Payload (minimal required fields):

```json
{
  "action": "create",
  "data": {
    "description": "Your PRD content here...",
    "project": {
      "id": 123456,
      "permalink": "https://tree.taiga.io/project/your-project",
      "name": "Your Project Name",
      "logo_big_url": null
    }
  }
}
```

Success Response (200):

```json
{
  "message": "Successfully processed Taiga webhook for user story",
  "tasks_generated": 5
}
```

Error Responses:

- `401`: `{"error": "Unauthorized"}`
- `400`: `{"error": "Invalid payload"}`
- `500`: `{"error": "Internal server error"}`

### Testing the Webhook

#### Easy Testing with Built-in Script

The package includes a test script that automatically generates the correct HMAC-SHA1 signature:

```bash
# Set environment variables
export WEBHOOK_TOKEN=token
export WEBHOOK_URL=http://localhost:3004/api/taiga-webhook  # optional, defaults to this

# Run the test script
cd packages/webhook
pnpm run test:webhook
```

This script:

1. Reads the webhook example from `docs/webhook_example.json`
2. Generates the correct HMAC-SHA1 signature using the `WEBHOOK_TOKEN`
3. Sends the request with the `x-taiga-webhook-signature` header
4. Shows the response

#### Manual Testing with curl

If you want to test manually, you need to generate the HMAC-SHA1 signature:

```bash
# 1. Calculate the signature (example using openssl)
WEBHOOK_TOKEN="token"
BODY='{"action":"create","data":{"description":"make me fun todo app with fun effects","project":{"id":1693793,"permalink":"https://tree.taiga.io/project/dearlordylord-tasks","name":"Tasks","logo_big_url":null}}}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha1 -hmac "$WEBHOOK_TOKEN" | cut -d' ' -f2)

# 2. Send the request
curl -X POST http://localhost:3000/api/taiga-webhook \
  -H "Content-Type: application/json" \
  -H "x-taiga-webhook-signature: $SIGNATURE" \
  -d "$BODY"
```

**Test Scenarios:**

```bash
# Test unauthorized access (wrong signature)
curl -X POST http://localhost:3000/api/taiga-webhook \
  -H "Content-Type: application/json" \
  -H "x-taiga-webhook-signature: invalid-signature" \
  -d '{"action":"create","data":{"description":"test","project":{"id":123}}}'
# Returns: 401 {"error": "Unauthorized"}

# Test health check
curl -X GET http://localhost:3000/health
# Returns: 200 {"status":"healthy","timestamp":"..."}

# Test wrong endpoint
curl -X GET http://localhost:3000/api/wrong-endpoint
# Returns: 404 {"error": "Not Found"}
```

## Architecture

The implementation follows the interface/vibe-generated pattern:

- **webhook-interface**: Human-vetted contracts and validation
- **webhook**: @vibe-generated implementation with dependency injection
- **main.ts**: Production startup with real dependencies

## Development

```bash
# Run tests
pnpm run test

# Run with watch mode for development
pnpm run dev

# Check types
pnpm run build
```
