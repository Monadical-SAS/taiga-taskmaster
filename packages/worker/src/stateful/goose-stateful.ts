import { TasksMachine } from '@taiga-task-master/core';
import { statefulLoop } from '@taiga-task-master/worker-interface';
import type { GooseWorkerConfig } from '../core/types.js';
import { createBaseStatefulLoopDeps } from './base-stateful.js';
import { makeGooseWorker } from '../workers/goose.js';
import { createNextTaskStrategies } from '../core/next-task.js';
import { castNonEmptyString } from '@taiga-task-master/common';

export const createGooseStatefulLoop = (config: GooseWorkerConfig) => {
  const gooseWorker = makeGooseWorker(config);
  
  const deps = {
    ...createBaseStatefulLoopDeps(config),
    runWorker: async (task: { description: string }, options?: { signal?: AbortSignal }) => {
      const result = await gooseWorker(task, options);
      
      if (result.success && result.artifacts) {
        return {
          output: [{
            timestamp: Date.now(),
            line: `Task completed successfully. Created artifacts: ${result.artifacts.join(', ')}`
          }]
        };
      } else if (result.error) {
        return {
          output: [{
            timestamp: Date.now(),
            line: `Task failed: ${result.error.message}`
          }]
        };
      } else {
        return {
          output: [{
            timestamp: Date.now(),
            line: 'Task completed'
          }]
        };
      }
    },
    next: createNextTaskStrategies().fifo,
    description: (task: unknown) => {
      if (typeof task === 'string') {
        return castNonEmptyString(task);
      }
      return castNonEmptyString(JSON.stringify(task));
    }
  };
  
  return (initialState: TasksMachine.State, save: (s: TasksMachine.State) => Promise<void>) => 
    statefulLoop(deps)(initialState, save);
};