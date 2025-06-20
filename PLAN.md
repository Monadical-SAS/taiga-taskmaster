# Worker Package Implementation Plan

## Context and Background

This project is building a **Task Master Machine** - an automated system that processes tasks using AI agents (specifically Goose AI) and Git workflows. The core concept is a state machine that:

1. **Pulls tasks** from a queue
2. **Executes tasks** using AI workers (Goose) or file system workers  
3. **Manages Git branches** for each task execution
4. **Creates artifacts** (completed work) and commits them
5. **Handles failures** with retry logic and cleanup

The central part of the machine would be the Worker loop. The machine itself provides lifecycle and queue management for the loop etc
Currently, the worker loop implementation exists only as **integration test code** in two test files. The goal is to extract these implementations into a reusable **"worker" package** that provides real, production-ready implementations of the worker interface.

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

### Core Interface: `LooperDeps`

```typescript
type LooperDeps = {
  runWorker: (task: { description: string }, options?: { signal?: AbortSignal }) => Promise<WorkerResult>,
  pullTask: (options?: { signal?: AbortSignal }) => Promise<{ type: 'task', description: NonEmptyString } | { type: 'aborted' }>,
  ackTask: (result: Option<{ branch: string }>, options?: { signal?: AbortSignal }) => Promise<void>,
  git: GitOperations,
  log: Logger,
  sleep: (ms: number) => Promise<void>,
};
```

### Loop Execution Flow

```
1. pullTask() → Get next task from queue
2. git.isClean() → Verify repository state
3. git.branch() → Create task-specific branch
4. runWorker() → Execute task (AI or file system)
5. git.commitAndPush() → Save work
6. ackTask(success) → Acknowledge completion
   
   On Error:
   - git.cleanup() → Clean failed branch
   - ackTask(failure) → Mark task as failed
   - Retry logic decides next action
```

### Error Handling Strategy

1. **Command Execution Errors**: Timeout, process failures, invalid commands
2. **Git Operation Errors**: Branch conflicts, merge issues, dirty repository
3. **Task Processing Errors**: AI failures, file system issues, timeout
4. **Network Errors**: API failures, connectivity issues

## Implementation Extraction Plan

### Phase 1: Extract Core Components

#### 1. **TaskQueue Management**
```typescript
// From both tests: taskQueueRef, acknowledgedTasksRef, currentTaskRef
// in implementation, add a note that the queue is going to be persisted soon: it'll initialize from a database/redis/whatever and persist its state into it during its steps
export const createTaskQueue = (): {
  pullTask: (options?: { signal?: AbortSignal }) => Promise<TaskPullResult>;
  ackTask: (result: Option<{ branch: string }>) => Promise<void>;
  addTasks: (tasks: string[]) => void;
  getRemainingCount: () => number;
} => {
  const state = {
    tasks: [] as string[],
    acknowledged: [] as Array<{ task: string; success: boolean; branch?: string }>,
    current: null as string | null,
  };
  
  return {
    async pullTask(options) { /* implementation */ },
    async ackTask(result) { /* implementation */ },
    addTasks(tasks) { state.tasks.push(...tasks); },
    getRemainingCount() { return state.tasks.length; },
  };
};
```

#### 2. **Git Operations**
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

#### 3. **Worker Factory Function**

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

#### 1. **BaseWorkerDeps Factory**
```typescript
export const createBaseWorkerDeps = (config: BaseWorkerConfig): Partial<LooperDeps> => ({
  log: createStructuredLogger(config.logLevel),
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  git: createGitDeps(config.git, config.workingDirectory),
});
```

#### 2. **GooseWorkerDeps Factory** (The Only Production Factory)
```typescript
export const createGooseWorkerDeps = (config: GooseWorkerConfig): LooperDeps => {
  const queue = createTaskQueue(); // Single queue instance
  
  return {
    ...createBaseWorkerDeps(config),
    runWorker: makeGooseWorker(config.goose),
    pullTask: queue.pullTask,
    ackTask: queue.ackTask,
  };
};
```

## Package Structure

```
packages/worker/
├── src/
│   ├── index.ts                 # Main exports
│   ├── core/                    # Core functional components
│   │   ├── task-queue.ts        # createTaskQueue() factory
│   │   ├── git-operations.ts    # createGitDeps() factory
│   │   ├── logging.ts           # createStructuredLogger() factory
│   │   └── types.ts             # Common types and interfaces
│   ├── workers/                 # Worker factory functions
│   │   ├── goose.ts             # makeGooseWorker() factory (ONLY production worker)
│   │   └── utils.ts             # Common worker utilities
│   ├── deps/                    # LooperDeps factory functions
│   │   ├── goose-deps.ts        # createGooseWorkerDeps() (ONLY production deps)
│   │   └── base-deps.ts         # createBaseWorkerDeps()
│   ├── testing/                 # Test utilities only
│   │   └── filesystem-mock.ts   # makeFileSystemWorker() for mocking expensive Goose calls
│   └── debugging/               # Debug utilities (from tests)
│       ├── git-debugger.ts      # createGitDebugger() factory
│       ├── goose-debugger.ts    # createGooseDebugger() factory
│       └── work-verifier.ts     # Work artifact verification functions
├── tests/
│   ├── unit/                    # Unit tests for functions
│   └── integration/             # Integration tests
│       ├── goose-worker.test.ts # Test goose worker with real integration
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
The extracted implementation must pass the same test scenarios as the original integration tests:

**Git Functionality Test** (using filesystem mock to avoid expensive Goose calls):
```typescript
it("processes chain of 2 tasks with real git workflow", async () => {
  const queue = createTaskQueue();
  queue.addTasks(["implement login", "add validation"]);
  
  // Use filesystem mock for testing git without expensive Goose calls
  const deps = createGooseWorkerDeps({
    workingDirectory: tempDir,
    logLevel: "debug",
    queue: queue,
    worker: makeFileSystemWorker(tempDir) // Test-only mock
  });
  
  // Run the loop and verify:
  // 1. Both tasks complete successfully
  // 2. Proper branch creation and chaining  
  // 3. File artifacts are created
  // 4. Git history is correct
});
```

**Real Goose Integration Test**:
```typescript
it("runs sequential tasks with real Goose AI", async () => {
  const queue = createTaskQueue();
  queue.addTasks([
    "create a simple hello.txt file with greeting",
    "read hello.txt and create a response.txt file"
  ]);
  
  const deps = createGooseWorkerDeps({
    workingDirectory: tempDir,
    goose: { model: "anthropic/claude-sonnet-4", provider: "openrouter" },
    timeouts: { process: 30000, hard: 35000 },
    queue: queue
  });
  
  // Verify real Goose execution and proper branch management
});
```

### 3. **Compatibility Testing**
Ensure the extracted worker implementations can be used as drop-in replacements in the original loop function without any changes to the interface.

## Integration Points

### 1. **Connection to Application Layer**
The worker package implementations will be used by **application code**, not directly by the core task machine. The core machine (`packages/core/src/core.ts`) is technology-agnostic and only manages task state:

```typescript
// In application code (not core machine)
import { createGooseWorkerDeps } from '@taiga-task-master/worker';
import { loop } from '@taiga-task-master/worker-interface';

// Core machine provides task management through abstract interfaces
const taskManager = new TaskMachine();

// Worker package provides execution implementation  
const workerDeps = createGooseWorkerDeps({
  pullTask: () => taskManager.pullNext(),
  ackTask: (result) => taskManager.acknowledge(result),
  // Git and worker implementations from worker package
});

// Worker interface coordinates everything
await loop(workerDeps)({ signal: abortController.signal });
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
- Extract TaskQueue from both tests (for testing/simple applications)
- Extract GitManager from git operations
- Extract common utilities (logging, sleep, etc.)
- Extract command-level retry utilities (for transient failures)

### Step 3: Create Worker Implementation
- Create GooseWorker (the only production worker)
- Create FileSystemWorker mock (for testing git without expensive Goose calls)
- Implement worker utilities and command-level retry

### Step 4: Create Factory Functions
- Implement createGooseWorkerDeps() (the only production factory)
- Add configuration management
- Create testing utilities and mocks

### Step 5: Write Tests
- Unit tests for all extracted components
- Git functionality tests (using FileSystemWorker mock)
- Real Goose integration tests (2-task sequences)
- Performance and compatibility tests
- Verify worker-level retry for transient failures

### Step 6: Documentation and Examples
- API documentation
- Usage examples
- Migration guide from test implementations

## Summary

This plan provides a complete roadmap for extracting the integration test implementations into a production-ready worker package. Key architectural clarifications:

**Scope**: Worker package provides execution components (GitDeps, GooseWorker) and utility implementations, **not** task lifecycle management. FileSystemWorker is a test-only mock.

**Responsibilities**:
- **Core Machine**: Task state management, business-level retry policies, task lifecycle
- **Worker Interface**: Coordination layer providing `LooperDeps` interface and `loop()` function  
- **Worker Package**: Concrete GooseWorker execution implementation with command-level retry for transient failures
- **Application Layer**: Composes core machine + worker implementations via worker interface

**No Task-Level Retry**: The "retry logic" from integration tests was simulating core machine behavior. Real production systems will have the core machine manage task retry policies.

The package maintains full compatibility with the existing `LooperDeps` interface while providing enhanced functionality and maintainability for execution-level concerns.