# @taiga-task-master/webhook

# @vibe-generated

Webhook receiver implementation that conforms to webhook-interface.

## Features

- HTTP server for receiving PRD update webhooks from Taiga
- Authorization validation using Bearer tokens
- Payload validation and processing
- Integration with task generation services
- Error handling and logging
- Graceful shutdown handling

## Quick Start

### Environment Variables

Requires the following in the root `.env` file:

- `WEBHOOK_TOKEN` - Bearer token for webhook authentication (required)
- `PORT` - Server port (optional, defaults to 3000)

Add these to your root `.env` file:

```bash
WEBHOOK_TOKEN=your-secret-token-here
PORT=3000
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

```bash
# Build all packages (from project root)
pnpm run build

# Start webhook server with environment loading
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/webhook run start
```

### API Endpoint

**POST** `/api/prd-webhook`

Headers:

```
Authorization: Bearer your-secret-token
Content-Type: application/json
```

Payload:

```json
{
  "type": "prd_update",
  "prd": "Your PRD content here...",
  "project_id": "taiga-project-id"
}
```

Success Response (200):

```json
{
  "message": "Successfully processed PRD update for project taiga-project-id",
  "tasks_generated": 5
}
```

Error Responses:

- `401`: `{"error": "Unauthorized"}`
- `400`: `{"error": "Invalid payload"}`
- `500`: `{"error": "Internal server error"}`

### Testing the Webhook

Once the server is running, you can test it with curl:

```bash
# Test with valid payload
curl -X POST http://localhost:3000/api/prd-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{
    "type": "prd_update",
    "prd": "Create a simple web application with user authentication and dashboard functionality. The app should have a login page, registration, and a main dashboard showing user statistics.",
    "project_id": "test-project-123"
  }'

# Expected success response:
# {
#   "message": "Successfully processed PRD update for project test-project-123",
#   "tasks_generated": 5
# }
```

**Test Scenarios:**

```bash
# Test unauthorized access
curl -X POST http://localhost:3000/api/prd-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong-token" \
  -d '{"type": "prd_update", "prd": "test", "project_id": "123"}'
# Returns: 401 {"error": "Unauthorized"}

# Test invalid payload
curl -X POST http://localhost:3000/api/prd-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here" \
  -d '{"type": "invalid", "prd": "test"}'
# Returns: 400 {"error": "...validation error..."}

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
