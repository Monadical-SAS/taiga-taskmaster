# Requirements

- mock goose executions / testability
- mock timeouts and execution time flow
- retries
- telemetry
- resource management
- streaming
- pause-ability

# @vibe-generated

# Worker Interface

Worker interface definitions and schemas for command execution and Goose AI integration.

## Usage

### Unit Tests

```bash
# Run unit tests
pnpm test
```

### Integration Tests

```bash
# Run all integration tests (may be flaky due to external dependencies)
pnpm test:integration

# Run git integration tests only
pnpm test:integration tests/integration/loop-real-git.test.ts

# Run goose integration tests (requires API keys, can be flaky due to AI service)
dotenv -e ../../.env -- pnpm test:integration tests/integration/loop-real-goose.test.ts

# Run goose tests and keep test directories for inspection (useful for debugging flaky runs)
KEEP_TEST_DIRS=true dotenv -e ../../.env -- pnpm test:integration tests/integration/loop-real-goose.test.ts
```

## Environment Variables

For Goose integration functionality, requires these variables in `.env` file at project root:
- `OPENROUTER_API_KEY` - API key for OpenRouter/Goose AI
- `GOOSE_MODEL` - AI model to use (default: "anthropic/claude-sonnet-4")  
- `GOOSE_PROVIDER` - Provider to use (default: "openrouter")