/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { createNextTaskStrategies } from './next-task.js';
import { Option, HashMap } from 'effect';
import { castTaskId } from '@taiga-task-master/common';

describe('NextTask Strategies', () => {
  const strategies = createNextTaskStrategies();

  // Helper to create test tasks - using simple object since Task is unknown
  const createTask = (id: number, priority?: string, dependencies?: number[]) => ({
    id: castTaskId(id),
    name: `Task ${id}`,
    description: `Description for task ${id}`,
    metadata: {
      ...(priority && { priority }),
      ...(dependencies && { dependencies: dependencies.map(castTaskId) })
    }
  }) as any;

  describe('FIFO Strategy', () => {
    it('should return none for empty tasks', () => {
      const emptyTasks = HashMap.empty() as any;
      const result = strategies.fifo(emptyTasks);
      
      expect(Option.isNone(result)).toBe(true);
    });

    it('should return the first task when multiple tasks exist', () => {
      const task1 = createTask(1);
      const task2 = createTask(2);
      const task3 = createTask(3);
      
      const tasks = HashMap.fromIterable([task1, task2, task3].map(task => [task.id, task] as const)) as any;
      const result = strategies.fifo(tasks);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId, task] = result.value;
        expect(taskId).toBe(1);
        expect(task.id).toBe(1);
      }
    });

    it('should return the single task when only one exists', () => {
      const task = createTask(42);
      const tasks = HashMap.fromIterable([task].map(t => [t.id, t] as const)) as any;
      const result = strategies.fifo(tasks);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId, taskObj] = result.value;
        expect(taskId).toBe(42);
        expect(taskObj.id).toBe(42);
      }
    });
  });

  describe('Priority Strategy', () => {
    it('should return none for empty tasks', () => {
      const emptyTasks = HashMap.empty() as any;
      const result = strategies.priority(emptyTasks);
      
      expect(Option.isNone(result)).toBe(true);
    });

    it('should select high priority task over medium and low priority', () => {
      const lowTask = createTask(1, 'low');
      const highTask = createTask(2, 'high');
      const mediumTask = createTask(3, 'medium');
      
      const tasks = HashMap.fromIterable([[lowTask.id, lowTask], [highTask.id, highTask], [mediumTask.id, mediumTask]]);
      const result = strategies.priority(tasks);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId, task] = result.value;
        expect(taskId).toBe(2);
        expect(task.metadata?.priority).toBe('high');
      }
    });

    it('should select medium priority task over low priority', () => {
      const lowTask = createTask(1, 'low');
      const mediumTask = createTask(2, 'medium');
      
      const tasks = HashMap.fromIterable([[lowTask.id, lowTask], [mediumTask.id, mediumTask]]);
      const result = strategies.priority(tasks);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId, task] = result.value;
        expect(taskId).toBe(2);
        expect(task.metadata?.priority).toBe('medium');
      }
    });

    it('should default to medium priority for tasks without priority', () => {
      const noPriorityTask = createTask(1);
      const lowTask = createTask(2, 'low');
      
      const tasks = HashMap.fromIterable([[lowTask.id, lowTask], [noPriorityTask.id, noPriorityTask]]);
      const result = strategies.priority(tasks);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId] = result.value;
        // Should pick the task with default medium priority over low priority
        expect(taskId).toBe(1);
      }
    });

    it('should handle unknown priority values as medium priority', () => {
      const unknownPriorityTask = createTask(1, 'urgent'); // Invalid priority
      const lowTask = createTask(2, 'low');
      
      const tasks = HashMap.fromIterable([[lowTask.id, lowTask], [unknownPriorityTask.id, unknownPriorityTask]]);
      const result = strategies.priority(tasks);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId] = result.value;
        // Should pick the task with unknown priority (treated as medium) over low priority
        expect(taskId).toBe(1);
      }
    });
  });

  describe('Dependencies Strategy', () => {
    it('should return none for empty tasks', () => {
      const emptyTasks = HashMap.empty() as any;
      const completedTaskIds = new Set<number>();
      const result = strategies.dependencies(emptyTasks, completedTaskIds);
      
      expect(Option.isNone(result)).toBe(true);
    });

    it('should select task with no dependencies when all tasks have different dependency states', () => {
      const taskWithNoDeps = createTask(1);
      const taskWithUnresolvedDeps = createTask(2, undefined, [999]);
      
      const tasks = HashMap.fromIterable([[taskWithNoDeps.id, taskWithNoDeps], [taskWithUnresolvedDeps.id, taskWithUnresolvedDeps]]);
      const completedTaskIds = new Set<number>();
      const result = strategies.dependencies(tasks, completedTaskIds);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId, task] = result.value;
        expect(taskId).toBe(1);
        expect(task.metadata?.dependencies || []).toHaveLength(0);
      }
    });

    it('should select task with resolved dependencies', () => {
      const task1 = createTask(1, undefined, [999]);
      const task2 = createTask(2, undefined, [888]);
      
      const tasks = HashMap.fromIterable([[task1.id, task1], [task2.id, task2]]);
      const completedTaskIds = new Set([999]);
      const result = strategies.dependencies(tasks, completedTaskIds);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId] = result.value;
        expect(taskId).toBe(1);
      }
    });

    it('should return none when all tasks have unresolved dependencies', () => {
      const task1 = createTask(1, undefined, [999]);
      const task2 = createTask(2, undefined, [888]);
      
      const tasks = HashMap.fromIterable([[task1.id, task1], [task2.id, task2]]);
      const completedTaskIds = new Set<number>();
      const result = strategies.dependencies(tasks, completedTaskIds);
      
      expect(Option.isNone(result)).toBe(true);
    });

    it('should prioritize high priority tasks among available tasks', () => {
      const lowPriorityTask = createTask(1, 'low', [999]);
      const highPriorityTask = createTask(2, 'high', [999]);
      
      const tasks = HashMap.fromIterable([[lowPriorityTask.id, lowPriorityTask], [highPriorityTask.id, highPriorityTask]]);
      const completedTaskIds = new Set([999]);
      const result = strategies.dependencies(tasks, completedTaskIds);
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId, task] = result.value;
        expect(taskId).toBe(2);
        expect(task.metadata?.priority).toBe('high');
      }
    });

    it('should handle complex dependency chains correctly', () => {
      const task1 = createTask(1); // No dependencies
      const task2 = createTask(2, undefined, [1]); // Depends on task1
      const task3 = createTask(3, undefined, [2]); // Depends on task2
      const task4 = createTask(4, undefined, [1, 3]); // Depends on task1 and task3
      
      const tasks = HashMap.fromIterable([[task1.id, task1], [task2.id, task2], [task3.id, task3], [task4.id, task4]]);
      
      // Initially, only task1 should be available
      const result1 = strategies.dependencies(tasks, new Set());
      expect(Option.isSome(result1)).toBe(true);
      if (Option.isSome(result1)) {
        const [taskId] = result1.value;
        expect(taskId).toBe(1);
      }
      
      // After task1 is completed, task2 should be available (remove task1 from available tasks)
      const tasksAfterTask1 = HashMap.fromIterable([[task2.id, task2], [task3.id, task3], [task4.id, task4]]);
      const result2 = strategies.dependencies(tasksAfterTask1, new Set([1]));
      expect(Option.isSome(result2)).toBe(true);
      if (Option.isSome(result2)) {
        const [taskId] = result2.value;
        expect(taskId).toBe(2);
      }
      
      // After task1 and task2 are completed, task3 should be available
      const tasksAfterTask2 = HashMap.fromIterable([[task3.id, task3], [task4.id, task4]]);
      const result3 = strategies.dependencies(tasksAfterTask2, new Set([1, 2]));
      expect(Option.isSome(result3)).toBe(true);
      if (Option.isSome(result3)) {
        const [taskId] = result3.value;
        expect(taskId).toBe(3);
      }
      
      // After task1, task2, and task3 are completed, task4 should be available
      const tasksAfterTask3 = HashMap.fromIterable([[task4.id, task4]]);
      const result4 = strategies.dependencies(tasksAfterTask3, new Set([1, 2, 3]));
      expect(Option.isSome(result4)).toBe(true);
      if (Option.isSome(result4)) {
        const [taskId] = result4.value;
        expect(taskId).toBe(4);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle tasks with empty dependency arrays', () => {
      const taskWithEmptyDeps = createTask(1, undefined, []);
      const tasks = HashMap.fromIterable([[taskWithEmptyDeps.id, taskWithEmptyDeps]]);
      const result = strategies.dependencies(tasks, new Set());
      
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        const [taskId] = result.value;
        expect(taskId).toBe(1);
      }
    });

    it('should handle tasks with undefined metadata', () => {
      const taskWithoutMetadata = {
        id: castTaskId(1),
        name: 'Task without metadata',
        description: 'A task without metadata'
      };
      
      const tasks = HashMap.fromIterable([[taskWithoutMetadata.id, taskWithoutMetadata]]);
      
      // Should work with all strategies
      expect(Option.isSome(strategies.fifo(tasks))).toBe(true);
      expect(Option.isSome(strategies.priority(tasks))).toBe(true);
      expect(Option.isSome(strategies.dependencies(tasks, new Set()))).toBe(true);
    });
  });
});