# @taiga-task-master/worker

# @vibe-generated

Worker implementation for executing tasks using various worker strategies (Goose AI, filesystem mock, etc.).

## Overview

This package provides the concrete implementation of workers that can execute tasks from the TasksMachine state. It includes:

- **Git Operations**: Repository management and branch isolation
- **Goose AI Worker**: Executes tasks using the Goose CLI tool
- **Filesystem Worker Mock**: Testing implementation for Git functionality
- **StatefulLoop Integration**: Factory functions for stateful loop architecture
- **Logging and Utilities**: Structured logging and common utilities

## Architecture

The worker package implements the interfaces defined in `@taiga-task-master/worker-interface` and integrates with the core task management system from `@taiga-task-master/core`.

## Dependencies

- `@taiga-task-master/worker-interface`: Interface definitions
- `@taiga-task-master/core`: Core task management system
- `simple-git`: Git operations
- `effect`: Functional programming utilities

## Usage

### CLI Task Runner

The worker package includes an interactive CLI for processing user tasks through the git + goose pipeline:

```bash
# Build the package first
pnpm build

# Run the interactive task runner (from monorepo root)
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/worker run cli
```

The CLI provides:
- **Interactive task input**: Enter task descriptions one by one
- **Queue management**: Tasks are collected and processed sequentially 
- **Git integration**: Each task runs in isolated git branches
- **Goose AI processing**: Uses Goose CLI for task execution
- **Temporary workspace**: Creates temporary directory for safe execution
- **Progress tracking**: Real-time feedback on task completion

**Required Environment Variables:**
```bash
# Goose AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
GOOSE_MODEL=anthropic/claude-sonnet-4  # Optional, defaults to this
GOOSE_PROVIDER=openrouter               # Optional, defaults to this
```

**CLI Commands:**
- Enter task descriptions to add to queue
- `status` - Show current queue status
- `quit` or `exit` - Exit the CLI

### Programmatic Usage

```typescript
import { createGooseWorker, createFilesystemWorker } from '@taiga-task-master/worker';

// Create a Goose AI worker
const gooseWorker = createGooseWorker(config);

// Create a filesystem mock worker for testing
const fsWorker = createFilesystemWorker(config);
```