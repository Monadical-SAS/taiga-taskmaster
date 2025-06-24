/* eslint-disable functional/no-expression-statements */
import type { WorkerResult, GooseWorkerConfig } from '../core/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runGooseWithLiveExecutor } from '@taiga-task-master/worker-interface';

const execAsync = promisify(exec);

export const makeGooseWorker = (config: GooseWorkerConfig) => {
  const {
    workingDirectory,
    goose,
  } = config;
  
  return async (task: { description: string }, options?: { signal?: AbortSignal }): Promise<WorkerResult> => {
    const instructionsFile = goose.instructionsFile || path.join(workingDirectory, 'instructions.md');
    await fs.writeFile(instructionsFile, task.description, 'utf-8');
    console.log(`📝 Created instructions file: ${instructionsFile}`);
    console.log(`📋 Instructions content: ${task.description}`);

    const r = await runGooseWithLiveExecutor({
      model: goose.model,
      provider: goose.provider,
      processTimeout: 30000,
      workingDirectory,
      instructionsFile,
    }, {
      ...options,
      onLine: (l => {
        // wherever we want to log
        console.log(`${l.timestamp}: ${l.line}`);
      })
    });

    const branchResult = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workingDirectory });
    const branchName = branchResult.stdout.trim();

    // Get list of modified files, excluding the instructions file
    const status = await execAsync('git status --porcelain', { cwd: workingDirectory });
    const instructionsFileName = path.basename(instructionsFile);
    const modifiedFiles = status.stdout
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.substring(3).trim())
      .filter(file => file !== instructionsFileName);

    return {
      success: true,
      artifacts: modifiedFiles,
      branchName,
      output: r.output,
    };
  };
};