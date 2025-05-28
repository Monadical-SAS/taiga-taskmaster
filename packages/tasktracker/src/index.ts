// @vibe-generated: conforms to tasktracker-interface
import {
  syncTasks as syncTasksInterface,
  type SyncTasksDeps,
  type TaskText,
  type TaskTrackerTasksResult,
} from "@taiga-task-master/tasktracker-interface";
// Re-export common types for convenience

// Re-export the interface function with proper dependency injection
export const syncTasks = syncTasksInterface;

// Export types for consumers
export type {
  SyncTasksDeps,
  TaskText,
  TaskTrackerTasksResult,
};
