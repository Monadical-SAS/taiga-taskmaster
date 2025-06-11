# TasksMachine Simulator Frontend

A React-based frontend for visualizing and interacting with the TasksMachine simulator.

## Features

- **Interactive State Visualization**: See tasks, artifacts, and agent status in real-time
- **History Navigation**: Go forward/back through simulation states
- **Custom Event Creation**: Create and execute your own simulation commands
- **Full TypeScript Support**: Type-safe interactions with the simulator

## Quick Start

```bash
# Install dependencies (from project root)
pnpm install

# Start development server
cd packages/tasks-machine-simulator-frontend
pnpm run dev
```

Visit http://localhost:3000 to use the simulator.

## Available Commands

- **Take Next Task**: Agent picks up the next pending task
- **Agent Step**: Simulate work progress on current task
- **Complete Task**: Finish the currently running task
- **Commit Artifact**: Commit completed work to repository
- **+ Add 2 Tasks**: Quick button to add 2 new mock tasks
- **Add More Tasks**: Custom command to add N new tasks (via Event Creator)
- **Agent Fail**: Simulate agent failure with custom error message

## Navigation

- **← Back / Forward →**: Navigate through simulation history
- **Reset Simulation**: Start fresh with new tasks

## Custom Events

Use the Event Creator to build and execute custom commands:

1. **Take Next Task / Agent Step / Complete Task**: No additional parameters
2. **Commit Artifact**: Select from available artifacts or enter ID
3. **Add More Tasks**: Specify number of tasks to generate (1-10)
4. **Agent Fail**: Provide custom error message

Click "Execute Command" to run the selected command.

## Architecture

- Built with React 18 + TypeScript
- Uses Vite for development and build
- Integrates with `@taiga-task-master/tasks-machine-simulator` package
- Follows Effect-TS patterns for type safety

## Components

- **App**: Main application container
- **TasksVisualizer**: Grid view of all tasks with status
- **ArtifactsDisplay**: List of created artifacts
- **EventCreator**: Form for creating custom simulation commands