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
import { HashMap } from "effect";

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
  // Count tasks in outputTasks as completed
  const completedInOutputTasks = state.outputTasks.length;
  
  // Count tasks in artifacts as completed
  const completedInArtifacts = state.artifacts.reduce((count, artifact) => {
    return count + HashMap.size(artifact.tasks);
  }, 0);
  
  const taskCounts = {
    pending: HashMap.size(state.tasks), // Tasks in main queue are "pending"
    "in-progress": state.taskExecutionState.agentExecutionState.step === "running" ? 1 : 0, // One task in execution if running
    completed: completedInOutputTasks + completedInArtifacts, // Tasks in outputTasks + tasks in artifacts
  };

  return {
    timestamp: state.timestamp,
    taskCounts,
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
