// @vibe-generated: core simulation logic

import type { TaskId } from "@taiga-task-master/common";
import type {
  SimulationState,
  SimulationCommand,
  Tasks,
  MockTask,
} from "./types.js";
import { HashMap, Array } from "effect";
import { castNonNegativeInteger, castNonEmptyString } from "@taiga-task-master/common";
import { generateMockArtifact, mockAgentProgressTexts } from "./mock-data.js";
import { TasksMachine } from "@taiga-task-master/core";

// Type conversion functions to safely convert between core and simulation types
const toMockTask = (coreTask: TasksMachine.Task): MockTask => {
  // Since TasksMachine.Task is `unknown`, we need to safely extract/cast the data
  // In a real implementation, this would use proper schema validation
  const task = coreTask as unknown as MockTask;
  return task;
};

const fromMockTask = (mockTask: MockTask): TasksMachine.Task => {
  return mockTask as unknown as TasksMachine.Task;
};

// Find next available task (first task in pending queue)
export const findNextTask = (tasks: Tasks): TaskId | null => {
  const taskEntries = HashMap.toEntries(tasks);
  if (Array.length(taskEntries) === 0) return null;

  const firstEntry = Array.head(taskEntries);
  return firstEntry._tag === "Some" ? firstEntry.value[0] : null;
};

// This function is no longer needed since core handles artifact creation

// Convert SimulationState to TasksMachine.State for core function compatibility
const toTaskMachineState = (state: SimulationState): TasksMachine.State => ({
  tasks: HashMap.map(state.tasks, fromMockTask),
  timestamp: state.timestamp,
  artifacts: state.artifacts.map(artifact => ({
    id: artifact.id,
    tasks: HashMap.map(artifact.tasks, fromMockTask),
  })),
  outputTasks: state.outputTasks.map(([taskId, task]) => [taskId, fromMockTask(task)]),
  taskExecutionState: state.taskExecutionState.agentExecutionState.step === "running" 
    ? (() => {
        if (!state.taskExecutionState.executingTask) {
          throw new Error("Invalid state: agent is running but no executingTask found");
        }
        return {
          step: "running" as const,
          task: [
            state.taskExecutionState.agentExecutionState.currentTaskId, 
            fromMockTask(state.taskExecutionState.executingTask)
          ],
        };
      })()
    : { 
        step: "stopped" as const
      }
});

// Convert TasksMachine.State back to SimulationState
const fromTaskMachineState = (tmState: TasksMachine.State): SimulationState => ({
  tasks: HashMap.map(tmState.tasks, toMockTask),
  timestamp: tmState.timestamp,
  artifacts: tmState.artifacts.map(artifact => ({
    id: artifact.id,
    tasks: HashMap.map(artifact.tasks, toMockTask),
    branchName: `branch-${artifact.id}`, // Mock branch name
    prUrl: `https://github.com/mock/repo/pull/${artifact.id}`, // Mock PR URL
    deploymentUrl: `https://deploy-${artifact.id}.example.com`, // Mock deployment URL
  })),
  outputTasks: tmState.outputTasks.map(([taskId, task]) => [taskId, toMockTask(task)]),
  taskExecutionState: {
    agentExecutionState: tmState.taskExecutionState.step === "running"
      ? {
          step: "running" as const,
          history: `Running task ${tmState.taskExecutionState.task[0]}`, // Use task ID from core
          process: { pid: Math.floor(Math.random() * 10000) }, // Mock process
          currentTaskId: tmState.taskExecutionState.task[0], // Get task ID from core
          progressText: "Working...", // Mock progress text
        }
      : { step: "stopped" as const },
    executingTask: tmState.taskExecutionState.step === "running" 
      ? toMockTask(tmState.taskExecutionState.task[1]) // Store the executing task from core
      : undefined
  },
});

// Main command execution function
export const executeCommand = (
  state: SimulationState,
  command: SimulationCommand
): SimulationState => {
  const newTimestamp = castNonNegativeInteger(Date.now());

  switch (command.type) {
    case "take_next_task": {
      try {
        // Can only take next task if agent is stopped
        if (state.taskExecutionState.agentExecutionState.step === "running") {
          throw new Error("Cannot take next task: agent is already running");
        }

        const nextTaskId = findNextTask(state.tasks);
        if (!nextTaskId) {
          throw new Error("No pending tasks available");
        }

        // Get the original task before it gets moved to execution
        const originalTask = HashMap.get(state.tasks, nextTaskId);
        if (originalTask._tag === "None") {
          throw new Error(`Task ${nextTaskId} not found in pending tasks`);
        }

        const tmState = toTaskMachineState(state);
        const updatedTmState = TasksMachine.startTaskExecution(nextTaskId)(tmState);
        const updatedState = fromTaskMachineState(updatedTmState);
        
        return {
          ...updatedState,
          timestamp: newTimestamp,
          taskExecutionState: {
            agentExecutionState: {
              step: "running" as const,
              history: `Started working on task ${nextTaskId}`,
              process: { pid: Math.floor(Math.random() * 10000) },
              currentTaskId: nextTaskId,
              progressText: "Task execution started...",
            },
            executingTask: originalTask.value, // Store the original task
          },
        };
      } catch (error) {
        throw new Error(`Failed to take next task: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    case "agent_step": {
      // NOTE: agent_step is a simulation-only feature for demonstrating incremental progress.
      // This command is NOT used in the actual TasksMachine core implementation.
      // It exists purely for UI simulation and testing purposes.
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
          executingTask: state.taskExecutionState.executingTask, // Preserve the executing task
        },
      };
    }

    case "complete_current_task": {
      if (state.taskExecutionState.agentExecutionState.step !== "running") {
        throw new Error("Cannot complete task: no task currently running");
      }

      try {
        const tmState = toTaskMachineState(state);
        const updatedTmState = TasksMachine.endTaskExecution(tmState);
        const updatedState = fromTaskMachineState(updatedTmState);
        
        return {
          ...updatedState,
          timestamp: newTimestamp,
        };
      } catch (error) {
        throw new Error(`Failed to complete current task: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    case "commit_artifact": {
      try {
        const tmState = toTaskMachineState(state);
        const updatedTmState = TasksMachine.commitArtifact(command.artifactId)(tmState);
        const updatedState = fromTaskMachineState(updatedTmState);
        
        return {
          ...updatedState,
          timestamp: newTimestamp,
        };
      } catch (error) {
        throw new Error(`Failed to commit artifact ${command.artifactId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    case "append_tasks": {
      try {
        const tmState = toTaskMachineState(state);
        const updatedTmState = TasksMachine.appendTasks(command.tasks)(tmState);
        const updatedState = fromTaskMachineState(updatedTmState);
        
        return {
          ...updatedState,
          timestamp: newTimestamp,
        };
      } catch (error) {
        throw new Error(`Failed to append tasks: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    case "edit_task": {
      try {
        const tmState = toTaskMachineState(state);
        
        // The core editTask function works with unknown types, so we preserve the MockTask structure
        // by ensuring it gets stored and retrieved correctly through the HashMap operations
        const taskAsUnknown = fromMockTask(command.task);
        
        const [updatedTmState, _removedArtifactIds] = TasksMachine.editTask(
          command.taskId,
          taskAsUnknown
        )(tmState);
        const updatedState = fromTaskMachineState(updatedTmState);
        
        return {
          ...updatedState,
          timestamp: newTimestamp,
        };
      } catch (error) {
        throw new Error(`Failed to edit task ${command.taskId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    case "add_artifact": {
      try {
        const tmState = toTaskMachineState(state);
        const updatedTmState = TasksMachine.outputTaskToArtifact(
          command.artifactId
        )(tmState);
        const updatedState = fromTaskMachineState(updatedTmState);
        
        return {
          ...updatedState,
          timestamp: newTimestamp,
        };
      } catch (error) {
        throw new Error(`Failed to add artifact ${command.artifactId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    case "agent_fail": {
      if (state.taskExecutionState.agentExecutionState.step !== "running") {
        throw new Error("Cannot fail agent: not currently running");
      }

      if (!state.taskExecutionState.executingTask) {
        throw new Error("No task data stored for currently executing task");
      }

      const currentTaskId = state.taskExecutionState.agentExecutionState.currentTaskId;
      const failedTask = state.taskExecutionState.executingTask; // Use the original task data
      
      // Return the failed task back to pending queue (preserving original title and description)
      const updatedTasks = HashMap.set(state.tasks, currentTaskId, failedTask);

      return {
        ...state,
        tasks: updatedTasks,
        timestamp: newTimestamp,
        taskExecutionState: {
          agentExecutionState: { step: "stopped" },
          // Remove executingTask since task is back in queue
        },
      };
    }

    default:
      // Type-safe exhaustive check
      const _exhaustive: never = command;
      throw new Error(`Unknown command type: ${JSON.stringify(command)}`);
  }
};
