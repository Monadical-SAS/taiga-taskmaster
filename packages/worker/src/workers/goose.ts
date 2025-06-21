/* eslint-disable functional/no-expression-statements */
import type { WorkerResult, GooseWorkerConfig } from '../core/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export const makeGooseWorker = (config: GooseWorkerConfig) => {
  const {
    workingDirectory,
    goose,
    timeouts = { process: 30000, hard: 35000 },
    apiKeys = {}
  } = config;
  
  return async (task: { description: string }, _options?: { signal?: AbortSignal }): Promise<WorkerResult> => {
    // Create instructions file
    const instructionsFile = goose.instructionsFile || path.join(workingDirectory, 'instructions.md');
    await fs.writeFile(instructionsFile, task.description, 'utf-8');
    
    // Prepare environment variables for API keys
    const env = { 
      ...process.env,
      ...(apiKeys.openrouter ? { OPENROUTER_API_KEY: apiKeys.openrouter } : {})
    };
    
    // Prepare Goose command
    const gooseCommand = `goose run --model ${goose.model} --provider ${goose.provider} ${instructionsFile}`;
    
    try {
      // Create abort controller for timeout
      const abortController = new AbortController();
      const { signal } = abortController;
      
      // Set timeout
      const timeout = setTimeout(() => {
        abortController.abort('Goose execution timed out');
      }, timeouts.hard || 35000);
      
      // Execute Goose command with timeout
      const { stdout: _stdout, stderr } = await execAsync(gooseCommand, {
        cwd: workingDirectory,
        env,
        signal,
        timeout: timeouts.process || 30000
      });
      
      // Clear timeout
      clearTimeout(timeout);
      
      // Check for execution errors
      if (stderr && stderr.includes('Error')) {
        throw new Error(`Goose execution failed: ${stderr}`);
      }
      
      // Get list of modified files
      const status = await execAsync('git status --porcelain', { cwd: workingDirectory });
      const modifiedFiles = status.stdout
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => line.substring(3).trim());
      
      return {
        success: true,
        artifacts: modifiedFiles
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorObject = error instanceof Error ? error : new Error(String(error));
      
      // Handle timeout errors
      const isAbortError = (error instanceof Error && error.name === 'AbortError') || 
                          (typeof error === 'object' && error !== null && 
                           'signal' in error && error.signal === 'SIGTERM' && 
                           'killed' in error && error.killed);
      
      if (isAbortError) {
        console.error('Goose execution timed out');
        
        // Create fallback file to indicate timeout
        await fs.writeFile(
          path.join(workingDirectory, 'timeout-error.md'),
          `# Task Execution Timed Out\n\nThe Goose AI worker timed out while processing the following task:\n\n${task.description}`,
          'utf-8'
        );
        
        return {
          success: false,
          artifacts: ['timeout-error.md'],
          error: new Error('Goose execution timed out')
        };
      }
      
      // Handle other execution errors
      console.error('Goose execution failed:', errorMessage);
      
      // Create error file
      await fs.writeFile(
        path.join(workingDirectory, 'execution-error.md'),
        `# Task Execution Failed\n\nError: ${errorMessage}\n\nTask: ${task.description}`,
        'utf-8'
      );
      
      return {
        success: false,
        artifacts: ['execution-error.md'],
        error: errorObject
      };
    }
  };
};