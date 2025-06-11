// @vibe-generated: main exports for tasks-machine-simulator

// Types
export type {
  SimulationState,
  SimulationCommand,
  SimulationHistory,
  Simulator,
  MockTask,
  Tasks,
  Artifact,
  AgentExecutionState,
  TaskExecutionState,
} from "./types.js";

export { getCurrentState } from "./types.js";

// Validation
export {
  SimulationCommandSchema,
  validateCommand,
  validateCommandSync,
  type ValidatedSimulationCommand,
} from "./validation.js";

// Core simulation logic
export { executeCommand, findNextTask } from "./simulation.js";

// Simulator API
export {
  createSimulator,
  step,
  reset,
  getStateSummary,
} from "./simulator.js";

// Mock data generators
export {
  generateMockTask,
  generateMockTasks,
  generateMockArtifact,
  createInitialState,
  mockAgentProgressTexts,
  resetCounters,
} from "./mock-data.js";
