# TUI Enhancement Plan: Ink-based Task Master CLI

## Overview
Transform the current readline-based CLI into a rich, multi-pane TUI using React Ink, providing real-time visibility into task execution, git operations, and worker status.

## Current State Analysis

### Current CLI Limitations
- Single-line text input with basic prompts
- Minimal status information (only queue size)
- No real-time execution visibility
- No git status or branch information
- Log output mixed with interface
- No artifact management visibility

### Available Data Sources
1. **TasksMachine State**: Queue, execution status, artifacts
2. **Real-time Worker Output**: Streaming goose execution
3. **Git Operations**: Branch status, commit info, cleanliness
4. **File System**: Log files, metadata directories
5. **Error States**: Command failures, timeouts, retry counts

## TUI Layout Design

### Multi-Pane Interface (Terminal Full-Screen)
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

## Implementation Plan

### Phase 1: Infrastructure Setup
1. **Dependencies**
   ```bash
   pnpm add ink react @types/react
   pnpm add -D @types/ink
   ```

2. **Project Structure**
   ```
   packages/worker/src/cli/
   ├── task-runner.ts           # Current CLI (kept for fallback)
   ├── tui/
   │   ├── index.tsx           # Main TUI entry point
   │   ├── components/
   │   │   ├── App.tsx         # Root TUI component
   │   │   ├── TaskQueue.tsx   # Task list panel
   │   │   ├── WorkerOutput.tsx # Real-time execution panel
   │   │   ├── GitStatus.tsx   # Git information panel
   │   │   ├── Artifacts.tsx   # Artifacts list panel
   │   │   ├── InputPanel.tsx  # Command input area
   │   │   └── StatusBar.tsx   # Top status bar
   │   ├── hooks/
   │   │   ├── useTaskMachine.ts  # TasksMachine state management
   │   │   ├── useWorkerOutput.ts # Real-time output streaming
   │   │   ├── useGitStatus.ts    # Git status monitoring
   │   │   └── useKeyboard.ts     # Keyboard navigation
   │   └── types/
   │       └── tui.ts          # TUI-specific types
   ```

### Phase 2: Core Components

#### 2.1 State Management Hooks

**`useTaskMachine.ts`**
```typescript
export const useTaskMachine = (persistence: TasksMachineMemoryPersistence) => {
  const [state, setState] = useState(persistence.getState());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setState(persistence.getState());
    }, 500); // 2x faster updates for responsive UI
    
    return () => clearInterval(interval);
  }, [persistence]);
  
  return {
    tasks: state.tasks,
    queueSize: persistence.getQueueSize(),
    currentTask: state.taskExecutionState,
    artifacts: state.artifacts,
    hasPendingTasks: persistence.hasPendingTasks()
  };
};
```

**`useWorkerOutput.ts`**
```typescript
export const useWorkerOutput = () => {
  const [output, setOutput] = useState<WorkerOutputLine[]>([]);
  const [currentLogFile, setCurrentLogFile] = useState<string>('');
  
  const addLine = useCallback((line: WorkerOutputLine) => {
    setOutput(prev => [...prev.slice(-50), line]); // Keep last 50 lines
  }, []);
  
  return { output, currentLogFile, addLine, setCurrentLogFile };
};
```

#### 2.2 Layout Components

**`App.tsx` - Root Layout**
```typescript
export const App: React.FC<AppProps> = ({ persistence, workingDir }) => {
  const taskMachine = useTaskMachine(persistence);
  const workerOutput = useWorkerOutput();
  const gitStatus = useGitStatus(workingDir);
  
  return (
    <Box flexDirection="column" height="100%">
      <StatusBar 
        workingDir={workingDir}
        currentBranch={gitStatus.branch}
        workerStatus={taskMachine.currentTask}
      />
      
      <Box flex={1} flexDirection="row">
        <Box width="30%" flexDirection="column">
          <TaskQueue 
            tasks={taskMachine.tasks}
            currentTask={taskMachine.currentTask}
            queueSize={taskMachine.queueSize}
          />
          <Box flex={1}>
            <GitStatus status={gitStatus} />
          </Box>
        </Box>
        
        <Box flex={1} flexDirection="column">
          <WorkerOutput 
            output={workerOutput.output}
            logFile={workerOutput.currentLogFile}
            currentTask={taskMachine.currentTask}
          />
          <Artifacts artifacts={taskMachine.artifacts} />
        </Box>
      </Box>
      
      <InputPanel onAddTask={handleAddTask} />
    </Box>
  );
};
```

#### 2.3 Panel Components

**`TaskQueue.tsx`**
- Display pending/running tasks with status indicators
- Truncate long descriptions (show first 40 chars + "...")
- Highlight currently executing task
- Show retry counts for failed tasks
- Color coding: 🔄 Running (yellow), ⏳ Pending (blue), ❌ Failed (red)

**`WorkerOutput.tsx`**
- Real-time scrolling output from goose execution
- Timestamp formatting for readability
- Log file path display with copy functionality
- Auto-scroll to bottom with manual scroll override
- Clear/pause output controls

**`GitStatus.tsx`**
- Current branch name with branch icon
- Repository cleanliness indicator
- Number of uncommitted changes
- Last commit information
- Branch switching history

**`Artifacts.tsx`**
- List completed tasks with their branches
- Branch names with creation timestamps
- Quick actions: checkout, view diff, cleanup
- Artifact categorization (successful/failed)

### Phase 3: Advanced Features

#### 3.1 Keyboard Navigation
- **Tab/Shift+Tab**: Navigate between panels
- **Enter**: Activate focused panel
- **Esc**: Return to input mode
- **↑/↓**: Scroll within panels
- **Ctrl+C**: Graceful shutdown
- **F1-F4**: Quick panel focus

#### 3.2 Real-time Updates Integration
```typescript
// Integrate with existing statefulLoop
const tui = statefulLoop({
  ...deps,
  log: {
    info: (message, ...args) => {
      tuiLogger.addLine({ 
        timestamp: Date.now(), 
        line: `[INFO] ${message}`,
        level: 'info' 
      });
    },
    error: (message, ...args) => {
      tuiLogger.addLine({ 
        timestamp: Date.now(), 
        line: `[ERROR] ${message}`,
        level: 'error' 
      });
    }
  }
});
```

#### 3.3 Enhanced Input Panel
- Command history (↑/↓ arrows)
- Auto-completion for common tasks
- Multi-line task descriptions
- Command shortcuts:
  - `/status` - Show detailed status
  - `/clear` - Clear worker output
  - `/stop` - Stop current task
  - `/quit` - Exit application

### Phase 4: Error Handling & Polish

#### 4.1 Error States
- Network connectivity issues
- Git operation failures
- Goose execution timeouts
- File system errors
- API key issues

#### 4.2 Performance Optimizations
- Virtualized scrolling for large outputs
- Debounced state updates
- Memory management for long-running sessions
- Efficient re-rendering with React.memo

#### 4.3 Accessibility
- Screen reader compatibility
- High contrast mode support
- Configurable update intervals
- Keyboard-only navigation

## Migration Strategy

### Backward Compatibility
1. Keep existing `task-runner.ts` as fallback
2. Add `--tui` flag to enable new interface
3. Environment variable `TASK_MASTER_UI=tui` for default
4. Graceful fallback on Ink initialization failures

### Rollout Plan
1. **Phase 1**: Basic TUI with feature parity
2. **Phase 2**: Enhanced features and real-time updates
3. **Phase 3**: Advanced navigation and shortcuts
4. **Phase 4**: Performance optimization and polish
5. **Phase 5**: Make TUI the default interface

## Testing Strategy

### Unit Tests
- Component rendering with mock data
- Hook behavior with state changes
- Keyboard input handling
- Error boundary scenarios

### Integration Tests
- Full TUI with real TasksMachine
- Mock git operations
- Simulated worker execution
- Performance under load

### Manual Testing
- Various terminal sizes
- Different terminal emulators
- Extended session stability
- Memory usage monitoring

## Dependencies

### New Dependencies
```json
{
  "dependencies": {
    "ink": "^4.4.1",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/ink": "^4.0.0"
  }
}
```

### Build Configuration
- Update tsconfig.json for JSX support
- Add React/Ink to externals if needed
- Bundle size optimization for CLI distribution

## Success Metrics

1. **User Experience**
   - Reduced time to understand system state
   - Faster task management workflow
   - Fewer context switches to external tools

2. **Functionality**
   - Feature parity with readline interface
   - Real-time updates without polling
   - Stable performance over long sessions

3. **Technical**
   - <100ms UI update latency
   - <50MB memory usage for typical sessions
   - Zero data loss during state transitions

This plan provides a comprehensive roadmap for transforming the CLI into a rich, interactive TUI while maintaining backward compatibility and ensuring a smooth migration path.

---

# Worker Package Dependency Injection Consolidation Plan

## Current State Analysis

### Problem
- `worker-cli` package reimplements ~150 lines of dependency injection logic that already exists in `@taiga-task-master/worker`
- Custom git operations, worker setup, and LooperDeps implementation in `worker-cli/src/cli/tui.tsx` (lines 149-250+)
- Duplication leads to inconsistent behavior, harder maintenance, and untested code paths

### Existing Infrastructure
- `@taiga-task-master/worker` already provides complete abstractions:
  - `createGitDeps()` - Git operations factory
  - `createBaseStatefulLoopDeps()` - Base LooperDeps factory
  - `createGooseStatefulLoop()` - Complete stateful loop with Goose worker
  - Proper TypeScript interfaces: `GitOperations`, `GooseWorkerConfig`, `Logger`

## Target Architecture

### After Consolidation
```typescript
// worker-cli/src/cli/tui.tsx - AFTER
import { createGooseStatefulLoop, type GooseWorkerConfig } from '@taiga-task-master/worker';

const config: GooseWorkerConfig = {
  workingDirectory: workingDir,
  goose: { model: "anthropic/claude-sonnet-4", provider: "openrouter" },
  metadataDirectory: metadataDirs.metadataDir,
  timeouts: { process: 300000 }
};

const { stop, appendTasks, editTask } = createGooseStatefulLoop(config)(queue.getState(), queue.saveState);
```

## Implementation Steps

### Phase 1: Interface Alignment
**Objective**: Ensure worker package interfaces support CLI requirements

1. **Extend GooseWorkerConfig interface** in `packages/worker/src/core/types.ts`:
   ```typescript
   export interface GooseWorkerConfig extends BaseWorkerConfig {
     goose: {
       model: string;
       provider: string;
       instructionsFile?: string;
     };
     metadataDirectory?: string;
     // Add CLI-specific needs:
     onWorkerOutput?: (line: { timestamp: number; line: string; level?: string }) => void;
   }
   ```

2. **Extend createGooseStatefulLoop** in `packages/worker/src/stateful/goose-stateful.ts`:
   - Add support for `onWorkerOutput` callback
   - Pass callback through to `makeGooseWorker`

3. **Update makeGooseWorker** in `packages/worker/src/workers/goose.ts`:
   - Accept and use `onWorkerOutput` callback for real-time streaming

### Phase 2: Git Operations Integration
**Objective**: Ensure worker package git operations match CLI needs

1. **Review GitOperations interface** in `packages/worker/src/core/types.ts`:
   - Verify `dropBranch` method signature matches CLI usage
   - Confirm all required methods exist

2. **Test git operations compatibility**:
   ```bash
   cd packages/worker
   npm test -- --grep "git-operations"
   ```

3. **Add missing methods if needed** to `packages/worker/src/core/git-operations.ts`

### Phase 3: Worker-CLI Refactoring
**Objective**: Replace custom implementation with worker package

1. **Update dependencies** in `packages/worker-cli/package.json`:
   ```json
   {
     "dependencies": {
       "@taiga-task-master/worker": "workspace:*"
     }
   }
   ```

2. **Replace processTaskQueue function** in `packages/worker-cli/src/cli/tui.tsx`:

   **BEFORE** (lines 80-277):
   ```typescript
   async function processTaskQueue(
     queue: TasksMachineMemoryPersistence,
     workingDir: string,
     onWorkerOutput?: (line: { timestamp: number; line: string; level?: string }) => void
   ) {
     // 150+ lines of custom implementation
   }
   ```

   **AFTER**:
   ```typescript
   import { createGooseStatefulLoop, type GooseWorkerConfig } from '@taiga-task-master/worker';

   async function processTaskQueue(
     queue: TasksMachineMemoryPersistence,
     workingDir: string,
     onWorkerOutput?: (line: { timestamp: number; line: string; level?: string }) => void
   ) {
     const metadataDirs = await createMetadataDirectories(workingDir);
     
     const config: GooseWorkerConfig = {
       workingDirectory: workingDir,
       goose: {
         model: "anthropic/claude-sonnet-4",
         provider: "openrouter"
       },
       metadataDirectory: metadataDirs.metadataDir,
       timeouts: {
         process: 300000, // 5 minutes per task
       },
       onWorkerOutput
     };

     return createGooseStatefulLoop(config)(queue.getState(), queue.saveState.bind(queue));
   }
   ```

3. **Remove custom implementations**:
   - Delete custom git operations (lines ~149-250)
   - Delete custom goose worker setup
   - Delete custom LooperDeps implementation
   - Keep only TUI-specific logic

### Phase 4: Testing & Validation
**Objective**: Ensure functionality parity and no regressions

1. **Unit tests for worker package changes**:
   ```bash
   cd packages/worker
   npm test
   ```

2. **Integration testing**:
   ```bash
   cd packages/worker-cli  
   npm run build
   npm test
   ```

3. **Manual testing**:
   ```bash
   # Test TUI functionality
   npm run taiga-tui
   
   # Test task operations
   # - Add tasks
   # - Edit tasks with /edit command
   # - Verify git operations work correctly
   # - Verify output streaming works
   ```

## Technical Considerations

### Logging Integration
- Worker package uses structured logging via `createStructuredLogger()`
- CLI needs real-time output streaming to TUI components
- Solution: Pass `onWorkerOutput` callback through config chain

### Error Handling
- Worker package may have different error handling patterns
- CLI needs graceful error display in TUI
- Solution: Wrap worker operations with CLI-specific error handling

### Configuration Management
- Worker package uses standardized config interfaces
- CLI has custom environment variable handling
- Solution: Transform CLI env vars to worker config format

### State Management
- Worker package expects specific state persistence patterns
- CLI uses custom `TasksMachineMemoryPersistence` class
- Solution: Ensure persistence interface compatibility

## Potential Issues & Mitigations

### Issue: Breaking Changes in Worker Package
**Risk**: Worker package interfaces might not support all CLI needs
**Mitigation**: Extend interfaces in Phase 1 before refactoring CLI

### Issue: Different Git Behavior
**Risk**: Worker package git operations might behave differently than CLI custom implementation
**Mitigation**: Thorough testing, add CLI-specific git config if needed

### Issue: Missing Callback Support
**Risk**: Worker package might not support real-time output streaming
**Mitigation**: Add callback support to worker package first

### Issue: State Synchronization
**Risk**: State updates might not propagate correctly through worker package
**Mitigation**: Verify state persistence interface compatibility

## Success Criteria

1. **Code Reduction**: ~150 lines removed from worker-cli
2. **Functional Parity**: All TUI features work identically
3. **Test Coverage**: All tests pass in both packages
4. **Performance**: No degradation in task execution speed
5. **Maintainability**: Single source of truth for worker operations

## Rollback Plan

If issues arise during implementation:
1. Revert worker-cli changes
2. Keep worker package extensions (they're additive)
3. File issues for worker package improvements
4. Implement consolidation in future iteration

This consolidation plan maintains backwards compatibility while achieving DRY principles and centralizing worker operations in the appropriate package.