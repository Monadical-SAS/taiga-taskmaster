# @taiga-task-master/worker-cli

Command line interfaces for the Taiga Task Master worker system.

## Overview

This package provides both traditional CLI and modern TUI (Terminal User Interface) for managing task execution with the Taiga Task Master system.

## Interfaces

### 1. Traditional CLI (`task-runner`)
Simple readline-based interface with basic prompts and status information.

```bash
# Run traditional CLI (from monorepo root)
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/worker-cli run cli

# Or from within the package
pnpm cli

# Or using the binary (after build)
taiga-task-runner
```

### 2. TUI Interface (`tui`)
Rich, multi-pane terminal interface built with React Ink providing real-time visibility.

```bash
# Run TUI interface (from monorepo root)
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/worker-cli run tui

# Or from within the package
pnpm tui

# Or using the binary (after build)
taiga-tui

# Use fallback CLI mode if TUI has display issues
USE_FALLBACK_CLI=true pnpm tui
# or
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/worker-cli run tui -- --fallback
```

## Features

### TUI Features
- **Multi-pane layout** with task queue, worker output, git status, and artifacts
- **Real-time updates** for task execution and git operations
- **Keyboard navigation** with shortcuts and commands
- **Status indicators** for tasks, git repository, and worker state
- **Log file integration** with tail -f support

### CLI Features
- **Task queue management** with simple commands
- **Status monitoring** with queue size and task information
- **Git integration** for branch management and commits
- **Worker execution** with Goose AI integration

## Environment Variables

Both CLI interfaces require the following environment variables for Goose AI integration:

```bash
# Required: OpenRouter API key for Goose AI
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional: Model configuration (defaults shown)
GOOSE_MODEL=anthropic/claude-sonnet-4
GOOSE_PROVIDER=openrouter
```

Create a `.env` file in the project root with these variables.

## Usage

### Getting Started

1. **Set up environment variables** in `.env` file (see above)
2. **Build the package**: `pnpm build` 
3. **Run the interface**:
   - Traditional CLI: `npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/worker-cli run cli`
   - Modern TUI: `npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/worker-cli run tui`

### CLI Commands

Both interfaces support these commands:
- **Task descriptions**: Enter any text to add a task to the queue
- **`status`**: Show current queue status and task count
- **`quit`** or **`exit`**: Exit the application
- **Ctrl+C**: Force exit

### TUI-Specific Commands
- **`/clear`**: Clear worker output panel
- **`/stop`**: Stop current task execution  
- **Tab navigation**: Navigate between panels (future enhancement)

### TUI Interface Layout

```
┌─ Taiga Task Master ─────────────────────────────────────────────────┐
│ 📁 /path/to/workdir | 🌿 branch: main | 🔄 Worker: RUNNING          │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ Task Queue (3) ─┐ ┌─ Worker Output ──────────────────────────────┐ │
│ │ 1. [RUNNING] Fix… │ │ 🔄 Running: "Fix user authentication bug"   │ │
│ │ 2. [PENDING] Add… │ │ > goose run -i instructions.md             │ │
│ │ 3. [PENDING] Ref… │ │ [12:34:56] Analyzing codebase...           │ │
│ │                   │ │ [12:35:12] Found auth module               │ │
│ │ ➕ Add new task   │ │ [12:35:20] Creating fix...                 │ │
│ │                   │ │                                            │ │
│ │                   │ │ 📋 Logs: tail -f /tmp/goose-xxx.log        │ │
│ └───────────────────┘ └────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─ Git Status ──────┐ ┌─ Artifacts (2) ─────────────────────────────┐ │
│ │ 📊 Status: Clean  │ │ 1. user-auth-fix      (branch: task-abc123) │ │
│ │ 📈 Changes: 0     │ │ 2. api-refactor       (branch: task-def456) │ │
│ │ 🌿 Branch: main   │ │                                             │ │
│ └───────────────────┘ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│ > Enter task description or command:                                │
│ ❯ _                                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

- **Ctrl+C**: Exit application
- **Enter**: Submit task or command
- **Tab/Shift+Tab**: Navigate between panels (future)
- **↑/↓**: Scroll within panels (future)

### Commands

- `/status` - Show detailed status
- `/clear` - Clear worker output
- `/stop` - Stop current task
- `/quit` - Exit application

## Dependencies

- **@taiga-task-master/worker**: Worker implementations and utilities
- **@taiga-task-master/worker-interface**: Core worker interface definitions
- **@taiga-task-master/core**: Task machine state management
- **@taiga-task-master/common**: Shared types and utilities
- **ink**: React-based CLI framework for TUI
- **react**: React framework for component-based UI
- **simple-git**: Git operations integration
- **effect**: Functional programming utilities

## Development

```bash
# Build the package
pnpm build

# Run in development mode
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm type-check
```

## Integration

This package integrates with:
- **TasksMachine**: Core state management for task queues and execution
- **Worker system**: Task execution with Goose AI and git operations
- **Git repositories**: Branch management and artifact creation
- **File system**: Metadata directories and log file management