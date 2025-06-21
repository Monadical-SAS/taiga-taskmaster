/* eslint-disable functional/no-expression-statements, functional/no-let */
import type { WorkerResult, TestingWorkerConfig } from '../core/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { sleep } from '../utils/sleep.js';

export const makeFileSystemWorker = (config: TestingWorkerConfig) => {
  const {
    workingDirectory,
    mockFailures = false,
    mockDelay = 100
  } = config;
  
  return async (task: { description: string }, options?: { signal?: AbortSignal }): Promise<WorkerResult> => {
    // Simulate processing delay
    if (mockDelay > 0) {
      await sleep(mockDelay, { signal: options?.signal });
    }
    
    // Simulate random failures if configured
    if (mockFailures && Math.random() < 0.2) {
      await fs.writeFile(
        path.join(workingDirectory, 'mock-failure.md'),
        `# Mock Failure\n\nSimulated failure for testing purposes.\n\nTask: ${task.description}`,
        'utf-8'
      );
      
      return {
        success: false,
        artifacts: ['mock-failure.md'],
        error: new Error('Simulated worker failure')
      };
    }
    
    try {
      // Parse task description to determine what files to create
      const description = task.description.toLowerCase();
      
      // Create README.md with task description
      const readmePath = path.join(workingDirectory, 'README.md');
      await fs.writeFile(
        readmePath,
        `# Task Execution\n\n${task.description}\n\nCompleted at: ${new Date().toISOString()}`,
        'utf-8'
      );
      let artifactsList: readonly string[] = ['README.md'];
      
      // Create additional files based on task description keywords
      if (description.includes('javascript') || description.includes('js')) {
        const jsPath = path.join(workingDirectory, 'index.js');
        await fs.writeFile(
          jsPath,
          `// Generated for task: ${task.description}\n\nconsole.log('Task completed');`,
          'utf-8'
        );
        artifactsList = [...artifactsList, 'index.js'];
      }
      
      if (description.includes('typescript') || description.includes('ts')) {
        const tsPath = path.join(workingDirectory, 'index.ts');
        await fs.writeFile(
          tsPath,
          `// Generated for task: ${task.description}\n\nconst message: string = 'Task completed';\nconsole.log(message);`,
          'utf-8'
        );
        artifactsList = [...artifactsList, 'index.ts'];
      }
      
      if (description.includes('html')) {
        const htmlPath = path.join(workingDirectory, 'index.html');
        await fs.writeFile(
          htmlPath,
          `<!DOCTYPE html>\n<html>\n<head>\n  <title>Task Result</title>\n</head>\n<body>\n  <h1>Task Completed</h1>\n  <p>${task.description}</p>\n</body>\n</html>`,
          'utf-8'
        );
        artifactsList = [...artifactsList, 'index.html'];
      }
      
      // Always create a completion marker file
      const completionPath = path.join(workingDirectory, 'task-completed.json');
      const finalArtifacts = [...artifactsList, 'task-completed.json'];
      await fs.writeFile(
        completionPath,
        JSON.stringify({
          task: task.description,
          completedAt: new Date().toISOString(),
          artifacts: finalArtifacts
        }, null, 2),
        'utf-8'
      );
      
      return {
        success: true,
        artifacts: finalArtifacts
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorObject = error instanceof Error ? error : new Error(String(error));
      console.error('FileSystem worker failed:', errorMessage);
      
      // Try to create error file, but handle case where directory doesn't exist
      try {
        await fs.writeFile(
          path.join(workingDirectory, 'fs-error.md'),
          `# Task Execution Failed\n\nError: ${errorMessage}\n\nTask: ${task.description}`,
          'utf-8'
        );
        
        return {
          success: false,
          artifacts: ['fs-error.md'],
          error: errorObject
        };
      } catch {
        // If we can't even write error file, return without artifacts
        return {
          success: false,
          artifacts: [],
          error: errorObject
        };
      }
    }
  };
};