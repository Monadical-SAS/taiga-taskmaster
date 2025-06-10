// @vibe-generated: main simulator API with history management

import type {
  Simulator,
  SimulationState,
  SimulationCommand,
  SimulationHistory,
} from "./types.js";
import { getCurrentState } from "./types.js";
import { executeCommand } from "./simulation.js";
import { createInitialState } from "./mock-data.js";
import { HashMap, Array } from "effect";

// Create new simulator with initial state
export const createSimulator = (initialTaskCount: number = 5): Simulator => {
  const initialState = createInitialState(initialTaskCount);

  const history: SimulationHistory = {
    states: [initialState],
    currentIndex: 0,
  };

  return {
    history,
  };
};

// Execute command with history management
export const step = (
  simulator: Simulator,
  command: SimulationCommand
): Simulator => {
  try {
    const currentState = getCurrentState(simulator);
    const newState = executeCommand(currentState, command);

    // Create new history entry (note: this is array-based, not event-sourcing)
    // In proper implementation, we'd use event sourcing for cleaner rollback
    const newHistory: SimulationHistory = {
      states: [
        ...simulator.history.states.slice(
          0,
          simulator.history.currentIndex + 1
        ),
        newState,
      ],
      currentIndex: simulator.history.currentIndex + 1,
    };

    return {
      history: newHistory,
    };
  } catch (error) {
    throw new Error(
      `Command execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// Rollback to previous state
export const back = (simulator: Simulator): Simulator => {
  if (simulator.history.currentIndex <= 0) {
    throw new Error("Cannot go back: already at initial state");
  }

  return {
    history: {
      ...simulator.history,
      currentIndex: simulator.history.currentIndex - 1,
    },
  };
};

// Move forward in history (after rollback)
export const forward = (simulator: Simulator): Simulator => {
  if (simulator.history.currentIndex >= simulator.history.states.length - 1) {
    throw new Error("Cannot go forward: already at latest state");
  }

  return {
    history: {
      ...simulator.history,
      currentIndex: simulator.history.currentIndex + 1,
    },
  };
};

// Get history info
export const getHistoryInfo = (simulator: Simulator) => {
  return {
    totalStates: simulator.history.states.length,
    currentIndex: simulator.history.currentIndex,
    canGoBack: simulator.history.currentIndex > 0,
    canGoForward:
      simulator.history.currentIndex < simulator.history.states.length - 1,
  };
};

// Reset to initial state
export const reset = (simulator: Simulator): Simulator => {
  return {
    history: {
      ...simulator.history,
      currentIndex: 0,
    },
  };
};

// Get state summary for debugging/visualization
export const getStateSummary = (state: SimulationState) => {
  const taskCounts = {
    pending: 0,
    "in-progress": 0,
    completed: 0,
  };

  // Count tasks by status using reduce instead of loop
  const taskEntries = Array.fromIterable(HashMap.toEntries(state.tasks));
  const counts = taskEntries.reduce((acc, [_, task]) => {
    if (
      task.status === "pending" ||
      task.status === "in-progress" ||
      task.status === "completed"
    ) {
      return { ...acc, [task.status]: acc[task.status] + 1 };
    }
    return acc;
  }, taskCounts);

  return {
    timestamp: state.timestamp,
    taskCounts: counts,
    artifactCount: state.artifacts.length,
    agentStatus: state.taskExecutionState.agentExecutionState.step,
    currentTask:
      state.taskExecutionState.agentExecutionState.step === "running"
        ? state.taskExecutionState.agentExecutionState.currentTaskId
        : null,
    progressText:
      state.taskExecutionState.agentExecutionState.step === "running"
        ? state.taskExecutionState.agentExecutionState.progressText
        : null,
  };
};
