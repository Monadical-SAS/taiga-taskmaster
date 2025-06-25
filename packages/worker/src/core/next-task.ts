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
    if (!tasks) return Option.none();
    const entries = HashMap.toEntries(tasks);
    return entries.length > 0 ? Option.some(entries[0] as [TaskId, TasksMachine.Task]) : Option.none();
  }) satisfies NextTaskF,
  
  /**
   * Priority-based task selection strategy
   * Selects tasks based on priority metadata if available
   */
  priority: ((tasks: TasksMachine.Tasks) => {
    if (!tasks) return Option.none();
    const entries = HashMap.toEntries(tasks);
    if (entries.length === 0) return Option.none();
    
    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const sortedEntries = [...entries].sort(([_aId, aTask], [_bId, bTask]) => {
      const aPriority = _hasMetadata(aTask) ? aTask.metadata?.priority || 'medium' : 'medium';
      const bPriority = _hasMetadata(bTask) ? bTask.metadata?.priority || 'medium' : 'medium';
      const aValue = priorityOrder[aPriority as keyof typeof priorityOrder] || 2;
      const bValue = priorityOrder[bPriority as keyof typeof priorityOrder] || 2;
      return bValue - aValue; // Higher priority first
    });
    
    return Option.some(sortedEntries[0] as [TaskId, TasksMachine.Task]);
  }) as NextTaskF,
  
  /**
   * Dependency-aware task selection strategy
   * Selects tasks with no unresolved dependencies first
   */
  dependencies: ((tasks: TasksMachine.Tasks, completedTaskIds?: Set<TaskId>) => {
    if (!tasks) return Option.none();
    const entries = HashMap.toEntries(tasks);
    if (entries.length === 0) return Option.none();
    
    const completed = completedTaskIds || new Set<TaskId>();
    
    // Find tasks with no unresolved dependencies
    const availableTasks = entries.filter(([_taskId, task]) => {
      if (!_hasMetadata(task) || !task.metadata?.dependencies) {
        return true; // Task has no dependencies
      }
      
      // Check if all dependencies are completed
      return task.metadata.dependencies.every(depId => completed.has(depId));
    });
    
    if (availableTasks.length === 0) {
      return Option.none(); // All tasks have unresolved dependencies
    }
    
    // Sort available tasks by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const sortedTasks = [...availableTasks].sort(([_aId, aTask], [_bId, bTask]) => {
      const aPriority = _hasMetadata(aTask) ? aTask.metadata?.priority || 'medium' : 'medium';
      const bPriority = _hasMetadata(bTask) ? bTask.metadata?.priority || 'medium' : 'medium';
      const aValue = priorityOrder[aPriority as keyof typeof priorityOrder] || 2;
      const bValue = priorityOrder[bPriority as keyof typeof priorityOrder] || 2;
      return bValue - aValue; // Higher priority first
    });
    
    return Option.some(sortedTasks[0] as [TaskId, TasksMachine.Task]);
  }) as NextTaskF
});