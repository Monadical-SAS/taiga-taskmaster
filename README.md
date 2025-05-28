# Taiga Task Master

Automated PRD-to-Taiga pipeline system that converts Product Requirement Documents into tracked Taiga tasks

## Quick Start

```bash
pnpm install
pnpm build
pnpm test
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

### Manual Taskmaster Integration Test

Test the complete taskmaster CLI workflow in isolation:

```bash
cd packages/taskmaster-test
pnpm test:isolated
```

This test:

- Creates an isolated temp directory
- Generates a sample PRD file
- Runs `npx task-master parse-prd` with environment variables
- Validates the generated tasks.json structure
- Cleans up temporary files

Requires `ANTHROPIC_API_KEY` and `PERPLEXITY_API_KEY` in the root `.env` file.
