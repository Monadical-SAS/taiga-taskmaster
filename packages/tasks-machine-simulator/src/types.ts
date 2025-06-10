// @vibe-generated: simulation types for TasksMachine

import type {
  NonEmptyString,
  TaskId,
  NonNegativeInteger,
} from "@taiga-task-master/common";
import { HashMap } from "effect";

// Re-export types from core TasksMachine for simulation
export type Tasks = HashMap.HashMap<TaskId, MockTask>;

export type MockTask = {
  id: TaskId;
  title: string;
  description: string;
  status: TaskStatus;
};

export type TaskStatus = "pending" | "in-progress" | "completed";

export type ArtifactId = NonEmptyString;

export interface CompletedTasksArtifact {
  tasks: Tasks;
  status: "completed";
}

export type Artifact = {
  id: ArtifactId;
  tasks: Tasks;
  branchName: string;
  prUrl: string;
  deploymentUrl: string;
};

export type AgentExecutionState =
  | {
      step: "running";
      history: string;
      process: { pid: number };
      currentTaskId: TaskId;
      progressText: string;
    }
  | {
      step: "stopped";
    };

export type TaskExecutionState = {
  agentExecutionState: AgentExecutionState;
};

export type SimulationState = {
  tasks: Tasks;
  timestamp: NonNegativeInteger;
  artifacts: Artifact[];
  taskExecutionState: TaskExecutionState;
};

// Commands for state transitions
export type SimulationCommand =
  | { type: "take_next_task" }
  | { type: "complete_current_task" }
  | { type: "commit_artifact"; artifactId: ArtifactId }
  | { type: "append_tasks"; tasks: Tasks }
  | { type: "agent_step"; progressText?: string }
  | { type: "agent_fail"; errorMessage: string };

// History management
export type SimulationHistory = {
  states: SimulationState[];
  currentIndex: number;
};

export type Simulator = {
  history: SimulationHistory;
};

export const getCurrentState = (simulator: Simulator): SimulationState => {
  const state = simulator.history.states[simulator.history.currentIndex];
  if (state === undefined) {
    throw new Error("Invalid simulator state: no state at current index");
  }
  return state;
};
