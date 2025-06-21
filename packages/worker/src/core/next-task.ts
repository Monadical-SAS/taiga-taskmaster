import { TasksMachine } from '@taiga-task-master/core';
import { Option, HashMap } from 'effect';
import type { TaskId, NextTaskF } from './types.js';

// Type guard to check if a task has metadata with priority
const hasMetadata = (task: unknown): task is { metadata?: { priority?: string; dependencies?: TaskId[] } } => {
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
    
    // Sort entries by priority if available
    const sortedEntries = [...entries].sort((a, b) => {
      const aPriority = hasMetadata(a[1]) ? a[1].metadata?.priority : undefined;
      const bPriority = hasMetadata(b[1]) ? b[1].metadata?.priority : undefined;
      
      // Priority mapping (higher number = higher priority)
      const priorityMap: Record<string, number> = {
        high: 3,
        medium: 2,
        low: 1
      };
      
      // Default to medium priority if not specified
      const aPriorityValue = aPriority ? priorityMap[aPriority] || 2 : 2;
      const bPriorityValue = bPriority ? priorityMap[bPriority] || 2 : 2;
      
      // Sort by priority (descending)
      return bPriorityValue - aPriorityValue;
    });
    
    return Option.some(sortedEntries[0] as [TaskId, TasksMachine.Task]);
  }) as NextTaskF,
  
  /**
   * Dependency-aware task selection strategy
   * Selects tasks with no unresolved dependencies first
   */
  dependencies: ((tasks: TasksMachine.Tasks, completedTaskIds?: Set<TaskId>) => {
    const completedSet = completedTaskIds || new Set<TaskId>();
    const entries = HashMap.toEntries(tasks);
    if (entries.length === 0) return Option.none();
    
    // Find tasks with no unresolved dependencies
    const availableTasks = entries.filter(([_, task]) => {
      const dependencies = hasMetadata(task) ? task.metadata?.dependencies || [] : [];
      return dependencies.every(depId => completedSet.has(depId));
    });
    
    if (availableTasks.length === 0) return Option.none();
    
    // Sort available tasks by priority
    const sortedTasks = [...availableTasks].sort((a, b) => {
      const aPriority = hasMetadata(a[1]) ? a[1].metadata?.priority : undefined;
      const bPriority = hasMetadata(b[1]) ? b[1].metadata?.priority : undefined;
      
      const priorityMap: Record<string, number> = {
        high: 3,
        medium: 2,
        low: 1
      };
      
      const aPriorityValue = aPriority ? priorityMap[aPriority] || 2 : 2;
      const bPriorityValue = bPriority ? priorityMap[bPriority] || 2 : 2;
      
      return bPriorityValue - aPriorityValue;
    });
    
    return Option.some(sortedTasks[0] as [TaskId, TasksMachine.Task]);
  }) as NextTaskF
});