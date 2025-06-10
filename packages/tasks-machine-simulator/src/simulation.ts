// @vibe-generated: core simulation logic

import type { TaskId } from "@taiga-task-master/common";
import type {
  SimulationState,
  SimulationCommand,
  Tasks,
  MockTask,
  Artifact,
} from "./types.js";
import { HashMap, Array } from "effect";
import { castNonNegativeInteger } from "@taiga-task-master/common";
import { generateMockArtifact, mockAgentProgressTexts } from "./mock-data.js";

// Find next available task (pending status)
export const findNextTask = (tasks: Tasks): TaskId | null => {
  const pendingTasks = HashMap.filter(
    tasks,
    (task) => task.status === "pending"
  );
  const taskEntries = HashMap.toEntries(pendingTasks);
  if (Array.length(taskEntries) === 0) return null;

  const firstEntry = Array.head(taskEntries);
  return firstEntry._tag === "Some" ? firstEntry.value[0] : null;
};

// Find currently running task
export const findRunningTask = (tasks: Tasks): TaskId | null => {
  const runningTasks = HashMap.filter(
    tasks,
    (task) => task.status === "in-progress"
  );
  const taskEntries = HashMap.toEntries(runningTasks);
  if (Array.length(taskEntries) === 0) return null;

  const firstEntry = Array.head(taskEntries);
  return firstEntry._tag === "Some" ? firstEntry.value[0] : null;
};

// Update task status
const updateTaskStatus = (
  tasks: Tasks,
  taskId: TaskId,
  status: MockTask["status"]
): Tasks => {
  const existingTask = HashMap.get(tasks, taskId);
  if (existingTask._tag === "None") {
    throw new Error(`Task ${taskId} not found`);
  }

  const updatedTask: MockTask = {
    ...existingTask.value,
    status,
  };

  return HashMap.set(tasks, taskId, updatedTask);
};

// Move completed tasks to artifact
const createArtifactFromCompletedTasks = (
  tasks: Tasks
): { artifact: Artifact; remainingTasks: Tasks } => {
  const completedTasks = HashMap.filter(
    tasks,
    (task) => task.status === "completed"
  );
  const remainingTasks = HashMap.filter(
    tasks,
    (task) => task.status !== "completed"
  );

  if (HashMap.size(completedTasks) === 0) {
    throw new Error("No completed tasks to create artifact from");
  }

  const artifact = generateMockArtifact(completedTasks);

  return { artifact, remainingTasks };
};

// Append new tasks (from TasksMachine core logic)
const appendTasks = (existingTasks: Tasks, newTasks: Tasks): Tasks => {
  // Check for duplicates (simplified version of core logic)
  const newTaskKeys = Array.fromIterable(HashMap.keys(newTasks));
  const intersection = newTaskKeys.filter((key) =>
    HashMap.has(existingTasks, key)
  );
  if (intersection.length > 0) {
    throw new Error(`Duplicate task IDs: ${intersection.join(", ")}`);
  }

  return HashMap.union(existingTasks, newTasks);
};

// Main command execution function
export const executeCommand = (
  state: SimulationState,
  command: SimulationCommand
): SimulationState => {
  const newTimestamp = castNonNegativeInteger(Date.now());

  switch (command.type) {
    case "take_next_task": {
      // Can only take next task if agent is stopped
      if (state.taskExecutionState.agentExecutionState.step === "running") {
        throw new Error("Cannot take next task: agent is already running");
      }

      const nextTaskId = findNextTask(state.tasks);
      if (!nextTaskId) {
        throw new Error("No pending tasks available");
      }

      const updatedTasks = updateTaskStatus(
        state.tasks,
        nextTaskId,
        "in-progress"
      );

      return {
        ...state,
        tasks: updatedTasks,
        timestamp: newTimestamp,
        taskExecutionState: {
          agentExecutionState: {
            step: "running" as const,
            history: `Started working on task ${nextTaskId}`,
            process: { pid: Math.floor(Math.random() * 10000) },
            currentTaskId: nextTaskId,
            progressText: "Task started...",
          },
        },
      };
    }

    case "agent_step": {
      if (state.taskExecutionState.agentExecutionState.step !== "running") {
        throw new Error("Cannot step agent: not currently running");
      }

      const runningState = state.taskExecutionState.agentExecutionState;
      const randomIndex = Math.floor(
        Math.random() * mockAgentProgressTexts.length
      );
      const randomProgress = mockAgentProgressTexts[randomIndex];
      if (randomProgress === undefined) {
        throw new Error("No progress texts available");
      }
      const progressText = command.progressText || randomProgress;

      return {
        ...state,
        timestamp: newTimestamp,
        taskExecutionState: {
          agentExecutionState: {
            ...runningState,
            progressText,
            history: `${runningState.history}\n${progressText}`,
          },
        },
      };
    }

    case "complete_current_task": {
      if (state.taskExecutionState.agentExecutionState.step !== "running") {
        throw new Error("Cannot complete task: no task currently running");
      }

      const runningTaskId = findRunningTask(state.tasks);
      if (!runningTaskId) {
        throw new Error("No running task found");
      }

      const updatedTasks = updateTaskStatus(
        state.tasks,
        runningTaskId,
        "completed"
      );
      const { artifact, remainingTasks } =
        createArtifactFromCompletedTasks(updatedTasks);

      return {
        ...state,
        tasks: remainingTasks,
        artifacts: [...state.artifacts, artifact],
        timestamp: newTimestamp,
        taskExecutionState: {
          agentExecutionState: { step: "stopped" },
        },
      };
    }

    case "commit_artifact": {
      if (state.artifacts.length === 0) {
        throw new Error("No artifacts to commit");
      }

      const artifactToCommit = state.artifacts[0];
      if (artifactToCommit === undefined) {
        throw new Error("Artifact not found");
      }
      if (artifactToCommit.id !== command.artifactId) {
        throw new Error(
          `Artifact ${command.artifactId} is not next in line for commit`
        );
      }

      return {
        ...state,
        artifacts: state.artifacts.slice(1),
        timestamp: newTimestamp,
      };
    }

    case "append_tasks": {
      const updatedTasks = appendTasks(state.tasks, command.tasks);

      return {
        ...state,
        tasks: updatedTasks,
        timestamp: newTimestamp,
      };
    }

    case "agent_fail": {
      if (state.taskExecutionState.agentExecutionState.step !== "running") {
        throw new Error("Cannot fail agent: not currently running");
      }

      const runningTaskId = findRunningTask(state.tasks);
      if (runningTaskId) {
        const updatedTasks = updateTaskStatus(
          state.tasks,
          runningTaskId,
          "pending"
        );
        return {
          ...state,
          tasks: updatedTasks,
          timestamp: newTimestamp,
          taskExecutionState: {
            agentExecutionState: { step: "stopped" },
          },
        };
      }

      return {
        ...state,
        timestamp: newTimestamp,
        taskExecutionState: {
          agentExecutionState: { step: "stopped" },
        },
      };
    }

    default:
      // Type-safe exhaustive check
      const _exhaustive: never = command;
      throw new Error(`Unknown command type: ${JSON.stringify(command)}`);
  }
};
