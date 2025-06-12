# @vibe-generated

# Worker Interface

Worker interface definitions and schemas for command execution and Goose AI integration.

## Usage

```bash
# Run tests with environment variables
npx dotenv -e ./.env -- pnpm --filter worker-interface test
```

## Environment Variables

For Goose integration functionality, requires these variables in `.env` file at project root:
- `OPENROUTER_API_KEY` - API key for OpenRouter/Goose AI
- `GOOSE_MODEL` - AI model to use (default: "anthropic/claude-sonnet-4")  
- `GOOSE_PROVIDER` - Provider to use (default: "openrouter")