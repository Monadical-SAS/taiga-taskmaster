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
    const instructionsFile = goose.instructionsFile || path.join(workingDirectory, 'instructions.md');
    await fs.writeFile(instructionsFile, task.description, 'utf-8');
    console.log(`📝 Created instructions file: ${instructionsFile}`);
    console.log(`📋 Instructions content: ${task.description}`);
    
    // Prepare environment variables for API keys and goose configuration
    const env = { 
      ...process.env,
      ...(apiKeys.openrouter ? { OPENROUTER_API_KEY: apiKeys.openrouter } : {}),
      GOOSE_MODEL: goose.model,
      GOOSE_PROVIDER: goose.provider
    };

    // runGooseWithLiveExecutor
    
    // Prepare Goose command (model and provider are set via environment variables)
    const gooseCommand = `goose run -i "${instructionsFile}" --with-builtin developer --no-session`;
    
    try {
      // Create abort controller for timeout
      const abortController = new AbortController();
      const { signal } = abortController;
      
      // Set timeout
      const timeout = setTimeout(() => {
        abortController.abort('Goose execution timed out');
      }, timeouts.hard || 35000);
      
      console.log(`🔧 Executing goose command: ${gooseCommand}`);
      console.log(`📂 Working directory: ${workingDirectory}`);
      console.log(`🌍 Environment: GOOSE_MODEL=${env.GOOSE_MODEL}, GOOSE_PROVIDER=${env.GOOSE_PROVIDER}`);
      
      const { stdout, stderr } = await execAsync(gooseCommand, {
        cwd: workingDirectory,
        env,
        signal,
        timeout: timeouts.process || 30000
      });
      
      clearTimeout(timeout);
      
      console.log(`📤 Goose stdout:`, stdout);
      if (stderr) {
        console.log(`📤 Goose stderr:`, stderr);
      }
      
      // Check for execution errors
      if (stderr) {
        throw new Error(`Goose execution failed: ${stderr}`);
      }
      
      // Get current branch name
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
        branchName
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
        
        // Get branch name for timeout error
        // eslint-disable-next-line functional/no-let
        let branchName: string | undefined;
        try {
          const branchResult = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workingDirectory });
          branchName = branchResult.stdout.trim();
        } catch {
          // Ignore branch name error
        }
        
        // Create fallback file to indicate timeout
        await fs.writeFile(
          path.join(workingDirectory, 'timeout-error.md'),
          `# Task Execution Timed Out\n\nThe Goose AI worker timed out while processing the following task:\n\n${task.description}`,
          'utf-8'
        );
        
        return {
          success: false,
          artifacts: ['timeout-error.md'],
          error: new Error('Goose execution timed out'),
          branchName
        };
      }
      
      // Handle other execution errors
      console.error('Goose execution failed:', errorMessage);
      
      // Get branch name for error
      // eslint-disable-next-line functional/no-let
      let branchName: string | undefined;
      try {
        const branchResult = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workingDirectory });
        branchName = branchResult.stdout.trim();
      } catch {
        // Ignore branch name error
      }
      
      return {
        success: false,
        artifacts: [],
        error: errorObject,
        branchName
      };
    }
  };
};