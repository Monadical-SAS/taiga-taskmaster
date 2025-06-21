# Worker Package Implementation Plan

## Context and Background

This project is building a **Task Master Machine** - an automated system that processes tasks using AI agents (specifically Goose AI) and Git workflows. The core concept is a state machine that:

1. **Pulls tasks** from a queue
2. **Executes tasks** using AI workers (Goose) or file system workers  
3. **Manages Git branches** for each task execution
4. **Creates artifacts** (completed work) and commits them
5. **Handles failures** with retry logic and cleanup

The central part of the machine would be the Worker loop. The machine itself provides lifecycle and queue management for the loop etc
Currently, the worker loop implementation exists only as **integration test code** in two test files. With the introduction of `statefulLoop`, the architecture has evolved to integrate directly with the core TasksMachine state. The goal is to extract these implementations into a reusable **"worker" package** that works with the new stateful architecture.

## Current State Analysis

### Existing Files and Their Roles

#### 1. **Worker Interface** (`packages/worker-interface/src/index.ts`)
- Defines the core `LooperDeps` interface that the worker must implement
- Contains the main `loop()` function that orchestrates task execution
- Provides Effect-based command execution utilities
- Defines error types and configuration patterns

#### 2. **Integration Tests** (Current Implementation Sources)

**Git Integration Test** (`packages/worker-interface/tests/integration/loop-real-git.test.ts`):
- **Focus**: File system based task execution (simulates code generation)
- **Features**: Sophisticated retry logic (2 retries), comprehensive git workflow, detailed debugging
- **Worker Behavior**: Creates/modifies code files, updates README.md, simulates realistic development workflow
- **Git Operations**: Full branch management with conflict recovery and cleanup
- **Retry Strategy**: Failed tasks are retried up to 2 times before permanent failure

**Goose Integration Test** (`packages/worker-interface/tests/integration/loop-real-goose.test.ts`):
- **Focus**: Real AI agent execution using Goose CLI
- **Features**: Lightweight task execution, timeout handling, fallback mechanisms
- **Worker Behavior**: Runs real Goose commands with instruction files, handles AI timeouts
- **Git Operations**: Basic branch management for AI-generated artifacts
- **Retry Strategy**: Minimal retry logic, focused on timeout handling

#### 3. ** State Machine** (`packages/core/src/core.ts`)
- Defines the overall task machine state and operations
- Shows the bigger picture: tasks → artifacts → commits → state transitions
- Provides context for how workers fit into the larger system

### Key Patterns Identified

#### 1. **Common Implementation Patterns**
Both tests implement the same `LooperDeps` interface with similar structures:
- Task queue management with mutable reference objects
- Git operations wrapper around `simple-git` library
- Console-based logging with structured output
- Promise-based sleep utilities
- Task acknowledgment with success/failure tracking

#### 2. **Retry Mechanisms**
- **Git Test**: Sophisticated retry logic with attempt counting and task re-queuing
- **Goose Test**: Basic retry with fallback file creation
- **Pattern**: Failed tasks can be retried up to a configurable limit

#### 3. **Git Workflow Management**
- Branch creation using task description hash (via `cyrb53`)
- Repository cleanliness checks before/after operations
- Cleanup procedures for failed branches
- Commit and push operations with error handling

#### 4. **Task Processing Patterns**
- **Pull → Process → Commit → Acknowledge** cycle
- Error handling with branch cleanup on failure
- Timeout management for long-running operations
- Detailed logging and debugging utilities

## Technical Architecture

### Core Interface: `statefulLoop` Dependencies

With the introduction of `statefulLoop`, the architecture has shifted:

```typescript
// statefulLoop takes these dependencies (no pullTask/ackTask needed)
type StatefulLoopDeps = Omit<LooperDeps, 'pullTask' | 'ackTask'> & {
  next: NextTaskF, // (tasks: Tasks) => Option<[TaskId, Task]>
  description: (task: Task) => NonEmptyString,
  runWorker: (task: { description: string }, options?: { signal?: AbortSignal }) => Promise<WorkerResult>,
  git: GitOperations,
  log: Logger,
  sleep: (ms: number) => Promise<void>,
};

// Returns control interface
type StatefulLoopInterface = {
  stop(): void;
  appendTasks: (tasks: Tasks) => TasksMachine.State;
};
```

### StatefulLoop Execution Flow

```
1. next(state.tasks) → Get next task from TasksMachine state
2. startTaskExecution(taskId) → Move task to execution state
3. description(task) → Convert task to string description
4. git.isClean() → Verify repository state
5. git.branch() → Create task-specific branch
6. runWorker() → Execute task with Goose AI
7. git.commitAndPush() → Save work
8. endTaskExecution() → Move task to outputTasks
9. save(state) → Persist state changes
   
   On Error:
   - git.cleanup() → Clean failed branch
   - endTaskExecution() → Mark task as failed
   - save(state) → Persist failure state
```

### Error Handling Strategy

1. **Command Execution Errors**: Timeout, process failures, invalid commands
2. **Git Operation Errors**: Branch conflicts, merge issues, dirty repository
3. **Task Processing Errors**: AI failures, file system issues, timeout
4. **Network Errors**: API failures, connectivity issues

## Implementation Extraction Plan

### Phase 1: Extract Core Components

#### 1. **NextTask Strategy Functions**
```typescript
// Extract task selection logic from tests 
// These determine which task to execute next from TasksMachine.State
export const createNextTaskStrategies = () => ({
  // Simple FIFO strategy for testing
  fifo: (tasks: Tasks): Option<[TaskId, Task]> => {
    const entries = HashMap.toEntries(tasks);
    return entries.length > 0 ? Option.some(entries[0]) : Option.none();
  },
  
  // Priority-based strategy (for production)
  priority: (tasks: Tasks): Option<[TaskId, Task]> => {
    // Implementation would consider task priority, dependencies, etc.
  },
});
```

#### 2. **Task Description Functions**
```typescript  
// Convert opaque Task objects to descriptions for workers
export const createTaskDescriptionFunctions = () => ({
  // Simple string extraction for testing
  simple: (task: Task): NonEmptyString => {
    // Extract description from task object
    return castNonEmptyString(String(task));
  },
  
  // Rich description extraction (for production)
  detailed: (task: Task): NonEmptyString => {
    // Extract title, context, requirements from task
  },
});
```

#### 3. **Git Operations**
```typescript
// From both tests: comprehensive git operations
// this, at some point, will become a separate package
export const createGitDeps = (gitConfig: GitConfig, workingDirectory: string) => {
  const git = simpleGit({ baseDir: workingDirectory, config: gitConfig });
  
  return {
    async isClean(): Promise<boolean> { /* implementation */ },
    async branch(name: NonEmptyString): Promise<NonEmptyString> { /* implementation */ },
    async commitAndPush(): Promise<void> { /* implementation */ },
    async cleanup(previousBranch: NonEmptyString): Promise<void> { /* implementation */ },
    
    // Advanced features from git test  
    async verifyBranchChain(): Promise<BranchChainInfo> { /* implementation */ },
    async dumpFullState(label: string): Promise<void> { /* implementation */ },
  };
};
```

#### 4. **Worker Factory Function**

There is only ONE real worker:

**Goose AI Worker** (the production worker):
```typescript
export const makeGooseWorker = (config: GooseConfig) => 
  async (task: { description: string }, options?: { signal?: AbortSignal }): Promise<WorkerResult> => {
    // Runs real Goose AI with instruction files
    // Handles timeouts and fallback mechanisms
  };
```

**Note**: The FileSystemWorker from the git test was only a test mock to avoid running expensive Goose calls when testing git functionality. It should NOT be part of the production package.

### Phase 2: Create Configurable Implementations

#### 1. **Base StatefulLoop Dependencies Factory**
```typescript
export const createBaseStatefulLoopDeps = (config: BaseWorkerConfig) => ({
  log: createStructuredLogger(config.logLevel),
  sleep: (ms, options) => new Promise(resolve => {
    const timeout = setTimeout(resolve, ms);
    options?.signal?.addEventListener('abort', () => clearTimeout(timeout));
  }),
  git: createGitDeps(config.git, config.workingDirectory),
});
```

#### 2. **Goose StatefulLoop Factory** (The Only Production Factory)
```typescript
export const createGooseStatefulLoop = (config: GooseWorkerConfig) => {
  const deps = {
    ...createBaseStatefulLoopDeps(config),
    runWorker: makeGooseWorker(config.goose),
    next: createNextTaskStrategies().priority, // Or FIFO for testing
    description: createTaskDescriptionFunctions().detailed, // Or simple for testing
  };
  
  return (initialState: TasksMachine.State, save: (s: TasksMachine.State) => Promise<void>) => 
    statefulLoop(deps)(initialState, save);
};
```

#### 3. **Testing Factory** (For Git Testing Without Expensive Goose Calls)
```typescript
export const createTestingStatefulLoop = (config: TestingWorkerConfig) => {
  const deps = {
    ...createBaseStatefulLoopDeps(config),
    runWorker: makeFileSystemWorker(config.workingDirectory), // Test mock
    next: createNextTaskStrategies().fifo, // Simple FIFO for testing
    description: createTaskDescriptionFunctions().simple,
  };
  
  return (initialState: TasksMachine.State, save: (s: TasksMachine.State) => Promise<void>) => 
    statefulLoop(deps)(initialState, save);
};
```

## Package Structure

```
packages/worker/
├── src/
│   ├── index.ts                 # Main exports
│   ├── core/                    # Core functional components
│   │   ├── git-operations.ts    # createGitDeps() factory
│   │   ├── logging.ts           # createStructuredLogger() factory
│   │   ├── next-task.ts         # createNextTaskStrategies() factory
│   │   ├── task-description.ts  # createTaskDescriptionFunctions() factory
│   │   └── types.ts             # Common types and interfaces
│   ├── workers/                 # Worker factory functions
│   │   ├── goose.ts             # makeGooseWorker() factory (ONLY production worker)
│   │   └── utils.ts             # Common worker utilities
│   ├── stateful/                # StatefulLoop factory functions
│   │   ├── goose-stateful.ts    # createGooseStatefulLoop() (ONLY production)
│   │   ├── testing-stateful.ts  # createTestingStatefulLoop() (for git tests)
│   │   └── base-stateful.ts     # createBaseStatefulLoopDeps()
│   ├── testing/                 # Test utilities only
│   │   └── filesystem-mock.ts   # makeFileSystemWorker() for mocking expensive Goose calls
│   └── debugging/               # Debug utilities (from tests)
│       ├── git-debugger.ts      # createGitDebugger() factory
│       ├── goose-debugger.ts    # createGooseDebugger() factory
│       └── work-verifier.ts     # Work artifact verification functions
├── tests/
│   ├── unit/                    # Unit tests for functions
│   └── integration/             # Integration tests
│       ├── goose-stateful.test.ts # Test real goose with statefulLoop
│       └── git-mock.test.ts     # Test git functionality with filesystem mock
├── package.json
├── tsconfig.json
└── README.md
```

## Testing Strategy

### 1. **Unit Tests**
- Test each extracted component in isolation
- Mock dependencies using Effect's testing utilities when possible
- Verify git operations, task queue management, worker execution
- Test command-level retry for transient failures (within workers)

### 2. **Integration Tests**
The extracted implementation must integrate with the new statefulLoop architecture:

**Git Functionality Test** (using filesystem mock to avoid expensive Goose calls):
```typescript
it("processes chain of 2 tasks with real git workflow using statefulLoop", async () => {
  // Create initial state with 2 tasks
  const initialState: TasksMachine.State = {
    tasks: HashMap.fromIterable([
      ["task1", { description: "implement login" }],
      ["task2", { description: "add validation" }]
    ]),
    taskExecutionState: { step: "stopped" },
    outputTasks: [],
    artifacts: [],
    timestamp: 0
  };
  
  // Use testing factory with filesystem mock
  const createLoop = createTestingStatefulLoop({
    workingDirectory: tempDir,
    logLevel: "debug"
  });
  
  const machine = createLoop(initialState, async (state) => {
    // Mock save function for testing
    console.log("State saved:", state);
  });
  
  // Run for some time, then stop
  setTimeout(() => machine.stop(), 10000);
  
  // Verify:
  // 1. Both tasks complete successfully
  // 2. Proper branch creation and chaining  
  // 3. File artifacts are created
  // 4. Git history is correct
});
```

**Real Goose Integration Test**:
```typescript
it("runs sequential tasks with real Goose AI using statefulLoop", async () => {
  const initialState: TasksMachine.State = {
    tasks: HashMap.fromIterable([
      ["task1", { description: "create a simple hello.txt file with greeting" }],
      ["task2", { description: "read hello.txt and create a response.txt file" }]
    ]),
    taskExecutionState: { step: "stopped" },
    outputTasks: [],
    artifacts: [],
    timestamp: 0
  };
  
  const createLoop = createGooseStatefulLoop({
    workingDirectory: tempDir,
    goose: { model: "anthropic/claude-sonnet-4", provider: "openrouter" },
    timeouts: { process: 30000, hard: 35000 }
  });
  
  const machine = createLoop(initialState, async (state) => {
    // Real state persistence would go here
    await fs.writeFile(join(tempDir, "state.json"), JSON.stringify(state));
  });
  
  // Test with timeout
  setTimeout(() => machine.stop(), 120000);
  
  // Verify real Goose execution and proper branch management
});
```

### 3. **Compatibility Testing**
Ensure the extracted worker implementations can be used as drop-in replacements in the original loop function without any changes to the interface.

## Integration Points

### 1. **Connection to Application Layer**
The worker package now integrates directly with the `statefulLoop` and `TasksMachine.State`:

```typescript
// In application code
import { createGooseStatefulLoop } from '@taiga-task-master/worker';
import { TasksMachine } from '@taiga-task-master/core';

// Load or create initial state
const initialState: TasksMachine.State = await loadStateFromDatabase();

// Create the stateful loop machine
const createLoop = createGooseStatefulLoop({
  workingDirectory: "/path/to/work",
  goose: { model: "anthropic/claude-sonnet-4", provider: "openrouter" },
  logLevel: "info"
});

// Start the machine with state persistence
const machine = createLoop(initialState, async (state) => {
  await saveStateToDatabase(state);
});

// Control the machine
machine.appendTasks(newTasks); // Add tasks dynamically
machine.stop(); // Graceful shutdown
```

### 2. **Configuration Integration**
Workers should integrate with the project's configuration system:
- Environment variables (API keys, model settings)
- Configuration files
- Runtime configuration options

### 3. **Monitoring and Observability**
Extract and enhance the debugging utilities from tests:
- Structured logging for production monitoring
- Git state verification and reporting
- Task execution metrics and timing
- Error reporting and diagnostics

## Implementation Details

### 1. **Branch Naming Strategy**
Both tests use the same pattern - extract and standardize:
```typescript
const createBranchName = (task: NonEmptyString): NonEmptyString => {
  const hash = cyrb53(task);
  return castNonEmptyString(hash.toString());
};
```

### 2. **Error Handling Patterns**
Extract common error handling from both tests:
- Command execution errors with timeout handling (worker-level retry)
- Git operation failures with cleanup procedures  
- Network/API failures with retry mechanisms (worker-level retry)
- Abort signal handling for graceful cancellation
- **No task-level retry** - that's core machine responsibility

### 3. **Debugging and Verification**
Extract the comprehensive debugging utilities:
- Git state dumping with branch verification
- Work artifact verification
- Branch chain validation
- Performance timing and metrics

### 4. **Configuration Management**
Create a unified configuration system:
```typescript
export interface WorkerConfig {
  workingDirectory: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxRetries: number;
  git: {
    userConfig: { name: string; email: string };
    isolation: boolean;
  };
}

export interface GooseWorkerConfig extends WorkerConfig {
  goose: {
    model: string;
    provider: string;
    processTimeout: number;
    instructionsFile?: string;
  };
  apiKeys: {
    openrouter?: string;
  };
}
```

## Success Criteria

### 1. **Functional Requirements**
- [ ] Extracted worker implementations can process 2 sequential tasks successfully
- [ ] Proper Git branch creation and management
- [ ] Retry logic works for failed tasks
- [ ] Real Goose integration functions correctly
- [ ] All original integration test scenarios pass

### 2. **Non-Functional Requirements**
- [ ] Code is well-organized and maintainable
- [ ] Comprehensive test coverage (>90%)
- [ ] Clear documentation and examples
- [ ] Performance matches or exceeds original implementations
- [ ] Memory usage is optimized (no memory leaks)

### 3. **Integration Requirements**
- [ ] Drop-in compatibility with existing worker interface
- [ ] Configuration system integration
- [ ] Monitoring and logging capabilities
- [ ] Error handling and recovery mechanisms

## Implementation Sequence

### Step 1: Create Package Structure
- Set up package.json with proper dependencies
- Configure TypeScript and ESLint
- Set up testing framework (Vitest)

### Step 2: Extract Core Components
- Extract NextTask strategy functions from tests
- Extract Task description functions for converting Task objects to strings
- Extract GitManager from git operations
- Extract common utilities (logging, sleep, etc.)
- Extract command-level retry utilities (for transient failures)

### Step 3: Create Worker Implementation
- Create GooseWorker (the only production worker)
- Create FileSystemWorker mock (for testing git without expensive Goose calls)
- Implement worker utilities and command-level retry

### Step 4: Create StatefulLoop Factory Functions
- Implement createGooseStatefulLoop() (the only production factory)
- Implement createTestingStatefulLoop() (for git testing with FileSystemWorker mock)
- Add configuration management
- Create base factory for common dependencies

### Step 5: Write Tests
- Unit tests for all extracted components
- NextTask strategy and task description function tests
- Git functionality tests (using createTestingStatefulLoop with FileSystemWorker mock)
- Real Goose integration tests (using createGooseStatefulLoop with 2-task sequences)
- StatefulLoop state management and persistence tests
- Performance and compatibility tests
- Verify worker-level retry for transient failures

### Step 6: Documentation and Examples
- API documentation
- Usage examples
- Migration guide from test implementations

## Summary

This plan provides a complete roadmap for extracting the integration test implementations into a production-ready worker package that integrates with the new `statefulLoop` architecture. Key architectural changes:

**StatefulLoop Integration**: The worker package now works directly with `TasksMachine.State` and `statefulLoop` instead of external task queues, providing true state persistence and sophisticated task management.

**Scope**: Worker package provides:
- **Execution components** (GitDeps, GooseWorker) with command-level retry
- **NextTask strategies** for determining task execution order
- **Task description functions** for converting Task objects to worker-friendly strings
- **StatefulLoop factories** that integrate everything with core machine state
- **FileSystemWorker mock** for testing git functionality without expensive Goose calls

**Architecture**:
- **Core Machine**: Task state management, business-level retry policies, task lifecycle via `TasksMachine.State`
- **Worker Interface**: Provides `statefulLoop` function that bridges core state with execution
- **Worker Package**: Concrete factories for creating production-ready stateful loops
- **Application Layer**: Uses stateful loop factories with real state persistence

**Key Benefits**:
- **State Persistence**: Tasks and execution state survive crashes and restarts
- **Real Task Management**: Integration with sophisticated task scheduling via `NextTaskF`
- **Control Interface**: `stop()` and `appendTasks()` methods for runtime control
- **Flexible Strategies**: Pluggable task selection and description extraction
- **Production Ready**: Real state persistence, proper error handling, comprehensive monitoring

The package provides factories that create stateful loops integrating core machine state with worker execution, enabling robust production task automation systems.