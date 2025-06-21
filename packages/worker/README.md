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

```typescript
import { createGooseWorker, createFilesystemWorker } from '@taiga-task-master/worker';

// Create a Goose AI worker
const gooseWorker = createGooseWorker(config);

// Create a filesystem mock worker for testing
const fsWorker = createFilesystemWorker(config);
```