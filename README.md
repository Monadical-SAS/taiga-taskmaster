# Taiga Task Master

Automated PRD-to-Taiga pipeline system that converts Product Requirement Documents into tracked Taiga tasks

## Quick Start

### Using Docker (Recommended)

1. **Clone and configure environment:**

   ```bash
   git clone <repository-url>
   cd taiga-task-master
   cp .env.example .env
   # Edit .env with your Taiga credentials and webhook token
   ```

2. **Start with Docker Compose:**

   ```bash
   # Production mode
   docker-compose up -d

   # Or development mode with hot reloading
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f taiga-task-master
   ```

### Manual Installation

```bash
pnpm install
pnpm build
pnpm test
```

## Docker Deployment

### Production

Build and run the containerized webhook service:

```bash
# Build the Docker image
docker build -t taiga-task-master .

# Run with docker-compose (recommended)
docker-compose up -d

# Or run directly
docker run -d \
  --name taiga-task-master \
  --env-file .env \
  -p 3000:3000 \
  taiga-task-master
```

### Development

For development with hot reloading:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Environment Variables

Required environment variables (add to `.env`):

```bash
# Webhook Configuration
WEBHOOK_TOKEN=your-secret-webhook-token
PORT=3000

# Taiga API Configuration
TAIGA_BASE_URL=https://api.taiga.io  # Optional, defaults to api.taiga.io
TAIGA_USERNAME=your-taiga-username
TAIGA_PASSWORD=your-taiga-password
TAIGA_PROJECT_ID=your-taiga-project-id

# AI API Keys (optional)
ANTHROPIC_API_KEY=sk-ant-your-key
PERPLEXITY_API_KEY=pplx-your-key
```

### Docker Commands

```bash
# Build image
docker build -t taiga-task-master .

# Run production
docker-compose up -d

# Run development
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build -d
```

## Core Features

- **PRD Webhook Receiver** - Handles incoming PRD notifications
- **Task Generation** - Converts PRDs to structured tasks using claude-task-master CLI
- **Taiga Synchronizer** - Syncs tasks to Taiga with tag-based identification

## Architecture

The system uses interface/implementation separation with three main modules:

- Module 1: PRD webhook handling with JWT validation
- Module 2: Task generation with atomic file operations
- Module 3: Taiga API integration with tag management

## Development

```bash
pnpm dev       # Start development mode
pnpm lint      # Check code style
pnpm type-check # Verify TypeScript
```

## Testing

### Unit Tests

```bash
pnpm test                                                    # Run all unit tests
```

### Integration Tests

```bash
pnpm --filter @taiga-task-master/worker-interface test:integration  # Worker interface git integration tests
```

### Manual Testing

Each package includes its own testing documentation:

- **[Taiga API Test](packages/taiga-api-test/README.md)** - Test Taiga API functionality, authentication, and token refresh
- **[Taskmaster Test](packages/taskmaster-test/README.md)** - Test the complete taskmaster CLI workflow in isolation
- **[TaskTracker Test](packages/tasktracker-test/README.md)** - Test task synchronization with Taiga using dependency injection
- **[Core Test](packages/core-test/README.md)** - Whole integration together

See individual package READMEs for detailed usage instructions and environment requirements.
