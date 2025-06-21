import { TasksMachine } from '@taiga-task-master/core';
import { statefulLoop } from '@taiga-task-master/worker-interface';
import type { TestingWorkerConfig, NextTaskF } from '../core/types.js';
import { createBaseStatefulLoopDeps } from './base-stateful.js';
import { makeFileSystemWorker } from '../testing/filesystem-mock.js';
import { createNextTaskStrategies } from '../core/next-task.js';
import { castNonEmptyString } from '@taiga-task-master/common';

export const createTestingStatefulLoop = (config: TestingWorkerConfig) => {
  const fileSystemWorker = makeFileSystemWorker(config);
  
  const deps: Parameters<typeof statefulLoop>[0] = {
    ...createBaseStatefulLoopDeps(config),
    runWorker: async (task: { description: string }, options?: { signal?: AbortSignal }) => {
      const result = await fileSystemWorker(task, options);
      
      // Convert WorkerResult to expected format
      const outputLines: Array<{ timestamp: number; line: string }> = [];
      if (result.success && result.artifacts) {
        return {
          output: [...outputLines, {
            timestamp: Date.now(),
            line: `Task completed successfully. Created artifacts: ${result.artifacts.join(', ')}`
          }]
        };
      } else if (result.error) {
        return {
          output: [...outputLines, {
            timestamp: Date.now(),
            line: `Task failed: ${result.error.message}`
          }]
        };
      } else {
        return {
          output: [...outputLines, {
            timestamp: Date.now(),
            line: 'Task completed'
          }]
        };
      }
    },
    next: createNextTaskStrategies().fifo,
    description: (task: unknown) => {
      // The statefulLoop provides tasks as unknown, but we know they're string descriptions
      if (typeof task === 'string') {
        return castNonEmptyString(task);
      }
      return castNonEmptyString(JSON.stringify(task));
    }
  };
  
  return (initialState: TasksMachine.State, save: (s: TasksMachine.State) => Promise<void>) => 
    statefulLoop(deps)(initialState, save);
};