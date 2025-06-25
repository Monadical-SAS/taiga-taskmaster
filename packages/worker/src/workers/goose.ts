/* eslint-disable functional/no-expression-statements */
import type { WorkerResult, GooseWorkerConfig } from '../core/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { runGooseWithLiveExecutor } from '@taiga-task-master/worker-interface';
import { createMetadataDirectories, getMetadataPaths } from '../utils/metadata-dirs.js';

const execAsync = promisify(exec);

export const makeGooseWorker = (config: GooseWorkerConfig) => {
  const {
    workingDirectory,
    goose,
    metadataDirectory
  } = config;
  
  return async (task: { description: string }, options?: { signal?: AbortSignal }): Promise<WorkerResult> => {
    // Create or use provided metadata directory
    const metadataDirs = metadataDirectory ? 
      {
        metadataDir: metadataDirectory,
        instructionsDir: path.join(metadataDirectory, 'instructions'),
        logsDir: path.join(metadataDirectory, 'logs'),
        cleanup: async () => {}
      } : 
      await createMetadataDirectories(`goose-task-${Date.now()}-`);
    
    const metadataPaths = getMetadataPaths(metadataDirs);
    
    // Use custom instructions file or default to metadata directory
    const instructionsFile = goose.instructionsFile || metadataPaths.instructionsFile;
    
    // Ensure instructions directory exists
    await fs.mkdir(path.dirname(instructionsFile), { recursive: true });
    await fs.writeFile(instructionsFile, task.description, 'utf-8');
    
    console.log(`📝 Created instructions file: ${instructionsFile}`);
    console.log(`📋 Instructions content: ${task.description}`);
    console.log(`📁 Metadata directory: ${metadataDirs.metadataDir}`);

    // Single log file for all goose output - perfect for tail -f
    const gooseOutputFile = metadataPaths.gooseOutput;
    
    const r = await runGooseWithLiveExecutor({
      model: goose.model,
      provider: goose.provider,
      workingDirectory,
      instructionsFile,
    }, {
      ...options,
      onLine: async (l) => {
        // Log to console (existing behavior)
        console.log(`${l.timestamp}: ${l.line}`);
        
        // Log to file - simple format for tail -f
        const logEntry = `[${new Date(l.timestamp).toISOString()}] ${l.line}\n`;
        await fs.appendFile(gooseOutputFile, logEntry, 'utf-8').catch(error => {
          console.error('Failed to write to goose output log:', error);
        });
      }
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
      metadataDirectory: metadataDirs.metadataDir,
      logFiles: {
        gooseOutput: gooseOutputFile
      }
    };
  };
};