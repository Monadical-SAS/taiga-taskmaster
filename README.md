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

### Manual Testing

Each package includes its own testing documentation:

- **[Taiga API Test](packages/taiga-api-test/README.md)** - Test Taiga API functionality, authentication, and token refresh
- **[Taskmaster Test](packages/taskmaster-test/README.md)** - Test the complete taskmaster CLI workflow in isolation
- **[TaskTracker Test](packages/tasktracker-test/README.md)** - Test task synchronization with Taiga using dependency injection
- **[Core Test](packages/core-test/README.md)** - Whole integration together

See individual package READMEs for detailed usage instructions and environment requirements.
