import { TasksMachine } from '@taiga-task-master/core';
import { Option, HashMap } from 'effect';
import type { TaskId, NextTaskF } from './types.js';

// Type guard to check if a task has metadata with priority
const _hasMetadata = (task: unknown): task is { metadata?: { priority?: string; dependencies?: TaskId[] } } => {
  return typeof task === 'object' && task !== null && 'metadata' in task;
};

export const createNextTaskStrategies = () => ({
  /**
   * Simple FIFO (First-In-First-Out) strategy for task selection
   * Selects the first available task from the task map
   */
  fifo: ((tasks: TasksMachine.Tasks) => {
    const entries = HashMap.toEntries(tasks);
    return entries.length > 0 ? Option.some(entries[0] as [TaskId, TasksMachine.Task]) : Option.none();
  }) satisfies NextTaskF,
  
  /**
   * Priority-based task selection strategy
   * Selects tasks based on priority metadata if available
   */
  priority: ((tasks: TasksMachine.Tasks) => {
    const entries = HashMap.toEntries(tasks);
    if (entries.length === 0) return Option.none();
    
    // For now, just return first task since TasksMachine.Task is unknown
    // TODO: Implement priority sorting when task structure is defined
    return Option.some(entries[0] as [TaskId, TasksMachine.Task]);
  }) as NextTaskF,
  
  /**
   * Dependency-aware task selection strategy
   * Selects tasks with no unresolved dependencies first
   */
  dependencies: ((tasks: TasksMachine.Tasks, _completedTaskIds?: Set<TaskId>) => {
    const entries = HashMap.toEntries(tasks);
    if (entries.length === 0) return Option.none();
    
    // For now, just return first task since TasksMachine.Task is unknown
    // TODO: Implement dependency checking when task structure is defined
    return Option.some(entries[0] as [TaskId, TasksMachine.Task]);
  }) as NextTaskF
});