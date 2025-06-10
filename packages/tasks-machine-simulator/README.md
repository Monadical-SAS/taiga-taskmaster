# @vibe-generated

# Tasks Machine Simulator

Core logic for simulating TasksMachine operations with rollback/forward capabilities and state visualization.

This package provides pure functions and state management for testing TasksMachine logic without touching real databases, GitHub repos, or external systems.

## Features

- State snapshots with history management
- Mock task and artifact generation
- Command-based state transitions
- Rollback/forward navigation
- Full state validation

## Usage

```typescript
import {
  createSimulator,
  executeCommand,
} from "@taiga-task-master/tasks-machine-simulator";

const simulator = createSimulator();
const newState = executeCommand(simulator.state, { type: "take_next_task" });
```
