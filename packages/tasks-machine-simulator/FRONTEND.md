# TasksMachine Simulator - Frontend Integration Guide

This guide shows how to integrate the TasksMachine simulator into React, Vue, or any frontend framework for visualizing and testing TasksMachine workflows.

## 📦 Installation & Setup

```bash
# Install the simulator package
pnpm add @taiga-task-master/tasks-machine-simulator

# Or with npm
npm install @taiga-task-master/tasks-machine-simulator
```

## 🔑 Core Concepts

### State Management

- **Immutable State**: Each operation returns a new simulator instance
- **History Navigation**: Built-in rollback/forward capabilities
- **Type Safety**: Full TypeScript support with Effect Schema validation

### TasksMachine Workflow

```
Tasks Queue → Agent Takes Task → Agent Works → Task Completed → Artifact Created → Artifact Committed
```

## 🚀 Quick Start Example (React)

```tsx
import React, { useState } from "react";
import {
  createSimulator,
  step,
  back,
  forward,
  getCurrentState,
  getStateSummary,
  resetCounters,
  type Simulator,
  type SimulationCommand,
} from "@taiga-task-master/tasks-machine-simulator";

function TasksMachineSimulator() {
  const [simulator, setSimulator] = useState(() => {
    resetCounters(); // Reset for clean state
    return createSimulator(5); // Start with 5 tasks
  });

  const executeCommand = (command: SimulationCommand) => {
    try {
      const newSimulator = step(simulator, command);
      setSimulator(newSimulator);
    } catch (error) {
      console.error("Command failed:", error);
    }
  };

  const currentState = getCurrentState(simulator);
  const summary = getStateSummary(currentState);

  return (
    <div className="simulator">
      <h2>TasksMachine Simulator</h2>

      {/* State Display */}
      <div className="state-info">
        <h3>Current State</h3>
        <p>Agent: {summary.agentStatus}</p>
        <p>
          Tasks: {summary.taskCounts.pending} pending,{" "}
          {summary.taskCounts["in-progress"]} running
        </p>
        <p>Artifacts: {summary.artifactCount}</p>
        {summary.currentTask && <p>Working on: Task {summary.currentTask}</p>}
        {summary.progressText && <p>Progress: {summary.progressText}</p>}
      </div>

      {/* Controls */}
      <div className="controls">
        <button
          onClick={() => executeCommand({ type: "take_next_task" })}
          disabled={summary.agentStatus === "running"}
        >
          Take Next Task
        </button>

        <button
          onClick={() => executeCommand({ type: "agent_step" })}
          disabled={summary.agentStatus !== "running"}
        >
          Agent Step
        </button>

        <button
          onClick={() => executeCommand({ type: "complete_current_task" })}
          disabled={summary.agentStatus !== "running"}
        >
          Complete Task
        </button>

        {currentState.artifacts.length > 0 && (
          <button
            onClick={() =>
              executeCommand({
                type: "commit_artifact",
                artifactId: currentState.artifacts[0]!.id,
              })
            }
          >
            Commit Artifact
          </button>
        )}
      </div>

      {/* History Navigation */}
      <div className="history-controls">
        <button onClick={() => setSimulator(back(simulator))}>← Back</button>
        <button onClick={() => setSimulator(forward(simulator))}>
          Forward →
        </button>
      </div>
    </div>
  );
}
```

## 🎯 Advanced Integration Patterns

### 1. State Visualization Component

```tsx
import { HashMap, Array } from "effect";

interface TasksVisualizerProps {
  simulator: Simulator;
}

function TasksVisualizer({ simulator }: TasksVisualizerProps) {
  const state = getCurrentState(simulator);
  const taskEntries = Array.fromIterable(HashMap.toEntries(state.tasks));

  return (
    <div className="tasks-grid">
      {taskEntries.map(([taskId, task]) => (
        <div key={taskId} className={`task task--${task.status}`}>
          <h4>Task {taskId}</h4>
          <p>{task.title}</p>
          <span className="status">{task.status}</span>
        </div>
      ))}
    </div>
  );
}
```

### 2. Artifacts Display Component

```tsx
interface ArtifactsDisplayProps {
  artifacts: Artifact[];
}

function ArtifactsDisplay({ artifacts }: ArtifactsDisplayProps) {
  return (
    <div className="artifacts">
      <h3>Completed Work (Artifacts)</h3>
      {artifacts.map((artifact) => (
        <div key={artifact.id} className="artifact">
          <h4>{artifact.id}</h4>
          <p>Branch: {artifact.branchName}</p>
          <a href={artifact.prUrl}>View PR</a>
          <a href={artifact.deploymentUrl}>View Deployment</a>
          <p>Tasks completed: {HashMap.size(artifact.tasks)}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Command Validation Hook

```tsx
import {
  validateCommand,
  type SimulationCommand,
} from "@taiga-task-master/tasks-machine-simulator";
import { Either } from "effect";

function useValidatedCommand(simulator: Simulator) {
  const executeCommand = useCallback(
    (command: unknown) => {
      const validation = validateCommand(command);

      if (Either.isLeft(validation)) {
        console.error("Invalid command:", validation.left);
        return simulator; // Return unchanged
      }

      try {
        return step(simulator, validation.right);
      } catch (error) {
        console.error("Execution error:", error);
        return simulator;
      }
    },
    [simulator]
  );

  return executeCommand;
}
```

### 4. History Navigation Hook

```tsx
function useSimulatorHistory(initialTaskCount = 5) {
  const [simulator, setSimulator] = useState(() => {
    resetCounters();
    return createSimulator(initialTaskCount);
  });

  const canGoBack = getHistoryInfo(simulator).canGoBack;
  const canGoForward = getHistoryInfo(simulator).canGoForward;

  const executeCommand = useCallback((command: SimulationCommand) => {
    setSimulator((prev) => step(prev, command));
  }, []);

  const goBack = useCallback(() => {
    if (canGoBack) setSimulator((prev) => back(prev));
  }, [canGoBack]);

  const goForward = useCallback(() => {
    if (canGoForward) setSimulator((prev) => forward(prev));
  }, [canGoForward]);

  const reset = useCallback(() => {
    resetCounters();
    setSimulator(createSimulator(initialTaskCount));
  }, [initialTaskCount]);

  return {
    simulator,
    executeCommand,
    goBack,
    goForward,
    reset,
    canGoBack,
    canGoForward,
    state: getCurrentState(simulator),
    summary: getStateSummary(getCurrentState(simulator)),
  };
}
```

## 🎨 Vue.js Integration

```vue
<template>
  <div class="simulator">
    <h2>TasksMachine Simulator</h2>

    <div class="state-display">
      <p>Agent Status: {{ summary.agentStatus }}</p>
      <p>Pending Tasks: {{ summary.taskCounts.pending }}</p>
      <p>Artifacts: {{ summary.artifactCount }}</p>
    </div>

    <div class="controls">
      <button
        @click="executeCommand({ type: 'take_next_task' })"
        :disabled="summary.agentStatus === 'running'"
      >
        Take Next Task
      </button>

      <button
        @click="executeCommand({ type: 'complete_current_task' })"
        :disabled="summary.agentStatus !== 'running'"
      >
        Complete Task
      </button>
    </div>

    <div class="history">
      <button @click="goBack" :disabled="!canGoBack">← Back</button>
      <button @click="goForward" :disabled="!canGoForward">Forward →</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  createSimulator,
  step,
  back,
  forward,
  getCurrentState,
  getStateSummary,
  getHistoryInfo,
  resetCounters,
  type Simulator,
  type SimulationCommand,
} from "@taiga-task-master/tasks-machine-simulator";

resetCounters();
const simulator = ref<Simulator>(createSimulator(5));

const currentState = computed(() => getCurrentState(simulator.value));
const summary = computed(() => getStateSummary(currentState.value));
const historyInfo = computed(() => getHistoryInfo(simulator.value));

const canGoBack = computed(() => historyInfo.value.canGoBack);
const canGoForward = computed(() => historyInfo.value.canGoForward);

function executeCommand(command: SimulationCommand) {
  try {
    simulator.value = step(simulator.value, command);
  } catch (error) {
    console.error("Command failed:", error);
  }
}

function goBack() {
  if (canGoBack.value) {
    simulator.value = back(simulator.value);
  }
}

function goForward() {
  if (canGoForward.value) {
    simulator.value = forward(simulator.value);
  }
}
</script>
```

## 🔍 Debugging & Development Tools

### 1. State Inspector Component

```tsx
function StateInspector({ simulator }: { simulator: Simulator }) {
  const state = getCurrentState(simulator);
  const history = getHistoryInfo(simulator);

  return (
    <details className="state-inspector">
      <summary>🔍 State Inspector</summary>
      <pre>
        {JSON.stringify(
          {
            timestamp: state.timestamp,
            taskCount: HashMap.size(state.tasks),
            artifactCount: state.artifacts.length,
            agentState: state.taskExecutionState.agentExecutionState,
            historyLength: history.totalStates,
            currentIndex: history.currentIndex,
          },
          null,
          2
        )}
      </pre>
    </details>
  );
}
```

### 2. Command Logger

```tsx
function useCommandLogger(simulator: Simulator) {
  const [commandLog, setCommandLog] = useState<
    Array<{
      command: SimulationCommand;
      timestamp: number;
      success: boolean;
    }>
  >([]);

  const loggedExecute = useCallback(
    (command: SimulationCommand) => {
      const timestamp = Date.now();
      try {
        const newSimulator = step(simulator, command);
        setCommandLog((prev) => [
          ...prev,
          { command, timestamp, success: true },
        ]);
        return newSimulator;
      } catch (error) {
        setCommandLog((prev) => [
          ...prev,
          { command, timestamp, success: false },
        ]);
        throw error;
      }
    },
    [simulator]
  );

  return { commandLog, executeCommand: loggedExecute };
}
```

## 🎯 Common Patterns & Best Practices

### 1. Auto-Play Simulation

```tsx
function useAutoPlay(simulator: Simulator, interval = 2000) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      const summary = getStateSummary(getCurrentState(simulator));

      if (summary.agentStatus === "stopped" && summary.taskCounts.pending > 0) {
        // Take next task
        setSimulator((prev) => step(prev, { type: "take_next_task" }));
      } else if (summary.agentStatus === "running") {
        // Simulate progress or complete
        const action =
          Math.random() > 0.7 ? "complete_current_task" : "agent_step";
        setSimulator((prev) => step(prev, { type: action }));
      } else if (summary.artifactCount > 0) {
        // Commit artifacts
        const artifacts = getCurrentState(simulator).artifacts;
        setSimulator((prev) =>
          step(prev, {
            type: "commit_artifact",
            artifactId: artifacts[0]!.id,
          })
        );
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, simulator, interval]);

  return { isPlaying, setIsPlaying };
}
```

### 2. Keyboard Shortcuts

```tsx
function useKeyboardShortcuts(
  simulator: Simulator,
  onUpdate: (sim: Simulator) => void
) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case "n": // Next task
          try {
            onUpdate(step(simulator, { type: "take_next_task" }));
          } catch {}
          break;
        case "s": // Step
          try {
            onUpdate(step(simulator, { type: "agent_step" }));
          } catch {}
          break;
        case "c": // Complete
          try {
            onUpdate(step(simulator, { type: "complete_current_task" }));
          } catch {}
          break;
        case "ArrowLeft": // Back
          try {
            onUpdate(back(simulator));
          } catch {}
          break;
        case "ArrowRight": // Forward
          try {
            onUpdate(forward(simulator));
          } catch {}
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [simulator, onUpdate]);
}
```

## 📱 Mobile-Friendly Components

```tsx
function MobileSimulator({
  simulator,
  onUpdate,
}: {
  simulator: Simulator;
  onUpdate: (sim: Simulator) => void;
}) {
  const summary = getStateSummary(getCurrentState(simulator));

  return (
    <div className="mobile-simulator">
      {/* Swipe gestures for history navigation */}
      <div
        className="swipe-area"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <TasksVisualizer simulator={simulator} />
      </div>

      {/* Bottom action sheet */}
      <div className="action-sheet">
        {summary.agentStatus === "stopped" &&
          summary.taskCounts.pending > 0 && (
            <button
              className="primary"
              onClick={() => executeCommand("take_next_task")}
            >
              Start Next Task
            </button>
          )}

        {summary.agentStatus === "running" && (
          <>
            <button onClick={() => executeCommand("agent_step")}>
              Step Progress
            </button>
            <button
              className="success"
              onClick={() => executeCommand("complete_current_task")}
            >
              Complete Task
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

## 🎨 Styling Examples

```css
/* Task States */
.task {
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid;
  margin: 0.5rem;
}

.task--pending {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.task--in-progress {
  border-color: #fbbf24;
  background: #fffbeb;
  animation: pulse 2s infinite;
}

.task--completed {
  border-color: #10b981;
  background: #ecfdf5;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Agent Status */
.agent-status--running {
  color: #f59e0b;
}

.agent-status--stopped {
  color: #6b7280;
}

/* Artifacts */
.artifact {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 1rem;
  margin: 0.5rem 0;
  background: linear-gradient(45deg, #f0f9ff, #e0f2fe);
}
```

## 🔒 Type Safety Tips

```tsx
// Always use the provided types
import type {
  Simulator,
  SimulationCommand,
  SimulationState,
  MockTask,
  Artifact,
} from "@taiga-task-master/tasks-machine-simulator";

// Validate commands before execution
function safeExecuteCommand(simulator: Simulator, command: unknown): Simulator {
  const validation = validateCommand(command);

  if (Either.isLeft(validation)) {
    console.warn("Invalid command:", validation.left);
    return simulator;
  }

  return step(simulator, validation.right);
}

// Use discriminated unions for command handling
function handleCommand(command: SimulationCommand) {
  switch (command.type) {
    case "take_next_task":
      // TypeScript knows this has no additional properties
      break;
    case "commit_artifact":
      // TypeScript knows this has artifactId: string
      console.log(`Committing ${command.artifactId}`);
      break;
    case "agent_step":
      // TypeScript knows progressText is optional
      if (command.progressText) {
        console.log(command.progressText);
      }
      break;
  }
}
```

## 🚀 Performance Considerations

1. **Memoization**: Use `useMemo` for expensive computations like task filtering
2. **State Isolation**: Call `resetCounters()` when creating new simulators
3. **History Limits**: Consider limiting history depth for long-running sessions
4. **Batch Updates**: Group multiple commands when possible

## 🧪 Testing Your Integration

```tsx
import { render, fireEvent } from "@testing-library/react";
import { resetCounters } from "@taiga-task-master/tasks-machine-simulator";

describe("TasksMachine Simulator", () => {
  beforeEach(() => {
    resetCounters(); // Ensure clean state
  });

  it("should start with pending tasks", () => {
    const { getByText } = render(<TasksMachineSimulator />);
    expect(getByText(/5.*pending/)).toBeInTheDocument();
  });

  it("should allow taking next task", () => {
    const { getByText } = render(<TasksMachineSimulator />);
    fireEvent.click(getByText("Take Next Task"));
    expect(getByText(/Agent.*running/)).toBeInTheDocument();
  });
});
```

---

This simulator provides a complete foundation for building TasksMachine visualizations, testing workflows, and demonstrating the system's behavior to stakeholders. The immutable state management and comprehensive type safety make it ideal for complex frontend applications.
