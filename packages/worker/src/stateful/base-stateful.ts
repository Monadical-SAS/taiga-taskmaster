import type { BaseWorkerConfig } from '../core/types.js';
import { createStructuredLogger } from '../core/logging.js';
import { createGitDeps } from '../core/git-operations.js';
import { sleep } from '../utils/sleep.js';

export const createBaseStatefulLoopDeps = (config: BaseWorkerConfig) => ({
  log: createStructuredLogger(config.logLevel || 'info'),
  sleep,
  git: createGitDeps(config.git || {}, config.workingDirectory)
});