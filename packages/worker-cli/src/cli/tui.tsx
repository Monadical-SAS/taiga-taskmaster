#!/usr/bin/env node
// @vibe-generated: conforms to worker-interface
/* eslint-disable functional/no-classes, functional/immutable-data, functional/no-expression-statements */
import { createTempDir, createMetadataDirectories } from "@taiga-task-master/worker";
import { TasksMachine } from "@taiga-task-master/core";
import { HashMap, Option, pipe } from 'effect';
import {
  type TaskId,
  castNonEmptyString,
  castNonNegativeInteger,
  type NonNegativeInteger, 
  castTaskId, 
  type NonEmptyString
} from '@taiga-task-master/common';
import { statefulLoop } from "@taiga-task-master/worker-interface";
import * as path from "path";
import * as fs from "fs/promises";
import { createNextTaskStrategies } from '@taiga-task-master/worker';
import { startTUI } from './tui/index.js';
import { startFallbackCLI } from './fallback-cli.js';
import { setupGlobalLogger, cleanupGlobalLogger, getGlobalLogger } from '../utils/file-logger.js';

interface UserTask {
  description: string;
}

class TasksMachineMemoryPersistence {
  private state = TasksMachine.state0;
  private nextTaskId = 1; // Monotonic counter for unique task IDs

  getState(): TasksMachine.State {
    return this.state;
  }

  saveState = async (s: TasksMachine.State) => {
    this.state = s;
  }

  getQueueSize(): NonNegativeInteger {
    return castNonNegativeInteger(HashMap.size(this.state.tasks));
  }
  
  getNextTaskId(): TaskId {
    return castTaskId(this.nextTaskId++);
  }

  getTaskMap(): TasksMachine.Tasks {
    return this.state.tasks;
  }

  markCompleted(taskId: TaskId): void {
    if (this.state.taskExecutionState.step !== 'running') {
      throw new Error(`Cannot mark task ${taskId} as completed - it is not running`);
    }
    if (this.state.taskExecutionState.task[0] !== taskId) {
      throw new Error(`Cannot mark task ${taskId} as completed - another task ${this.state.taskExecutionState.task[0]} is running`);
    }
    this.state = TasksMachine.endTaskExecution(this.state);
  }

  hasPendingTasks(): boolean {
    return this.getQueueSize() > 0;
  }

  getTaskDescription(taskId: TaskId): Option.Option<string> {
    return pipe(this.state, TasksMachine.Utils.getTask(taskId), Option.map(assumeTaskDescription));
  }

  fetchTaskDescription(taskId: TaskId): string {
    return Option.getOrThrow(this.getTaskDescription(taskId));
  }
}

const assumeTaskDescription = (t: unknown): NonEmptyString => {
  const desc = (t as UserTask).description;
  if (typeof desc === 'string') {
    return castNonEmptyString(desc);
  }
  throw new Error(`Task description must be a string, got task ${JSON.stringify(t)}`);
}

async function processTaskQueue(
  queue: TasksMachineMemoryPersistence, 
  workingDir: string,
  onWorkerOutput?: (line: { timestamp: number; line: string; level?: string }) => void
) {
  const { makeGooseWorker } = await import("@taiga-task-master/worker");
  const { simpleGit } = await import("simple-git");
  
  const git = simpleGit(workingDir);

  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    await git.init();
    await git.addConfig('user.name', 'Goose Worker');
    await git.addConfig('user.email', 'worker@goose.ai');
    await git.addConfig('commit.gpgsign', 'false');

    // Create initial commit to establish HEAD
    await fs.writeFile(path.join(workingDir, '.gitkeep'), '', 'utf-8');
    await git.add('.gitkeep');
    await git.commit('Initial commit');
  }
  
  // Create metadata directories for execution metadata (separate from git repo)
  const metadataDirs = await createMetadataDirectories(`task-session-${Date.now()}-`);

  const gooseWorker = makeGooseWorker({
    workingDirectory: workingDir,
    goose: {
      model: "anthropic/claude-sonnet-4",
      provider: "openrouter"
      // No instructionsFile specified - will use metadata directory
    },
    metadataDirectory: metadataDirs.metadataDir,
    timeouts: {
      process: 300000, // 5 minutes per task
    },
    onLiveOutput: onWorkerOutput
  });

  // Set up the statefulLoop dependencies 
  const deps = {
    runWorker: async (task: { description: string }, options?: { signal?: AbortSignal }) => {
      onWorkerOutput?.({
        timestamp: Date.now(),
        line: `🔄 Running goose for: "${task.description}"`,
        level: 'info'
      });
      
      const result = await gooseWorker(task, options);
      
      // Show the goose output log for tail -f
      if (result.logFiles?.gooseOutput) {
        onWorkerOutput?.({
          timestamp: Date.now(),
          line: `📋 Goose output log (tail -f): ${result.logFiles.gooseOutput}`,
          level: 'info'
        });
      }
      
      return {
        output: result.output
      };
    },
    
    next: createNextTaskStrategies().fifo,
    
    description: assumeTaskDescription,
    
    git: {
      isClean: async () => {
        const status = await git.status();
        return status.files.length === 0;
      },

      dropBranch: async (branchName: NonEmptyString) => {
        await git.reset(['--hard']);
        await git.clean('f', ['-d']);
        await git.deleteLocalBranch(branchName, true);
      },
      
      branch: async (name: Option.Option<NonEmptyString>) => {
        // Capture current branch before switching
        const currentBranch = await git.branchLocal();
        const previousBranch = currentBranch.current;
        
        const branchName = pipe(
          name,
          Option.getOrElse(() => `master`),
        );
        await git.checkoutLocalBranch(branchName);
        
        // Return the previous branch name for cleanup
        return castNonEmptyString(previousBranch);
      },
      
      commitAndPush: async () => {
        const status = await git.status();
        if (status.files.length > 0) {
          await git.add('.');
          await git.commit(`Task execution completed at ${new Date().toISOString()}`);
        }
      },

      cleanup: async (previousBranch: Option.Option<NonEmptyString>) => {
        const logMessage = `🧹 Resetting to branch: ${previousBranch}`;
        onWorkerOutput?.({
          timestamp: Date.now(),
          line: logMessage,
          level: 'info'
        });
        
        // Log git operations to file
        const logger = getGlobalLogger();
        if (logger) {
          logger.logFromSource('git', 'info', logMessage).catch(() => {});
        }
        try {
          const currentBranch = await git.branchLocal();
          const branchToDelete = currentBranch.current;

          
          // Discard uncommitted changes from failed task execution
          const resetMessage = `   🧽 Discarding uncommitted changes with git reset --hard`;
          onWorkerOutput?.({
            timestamp: Date.now(),
            line: resetMessage,
            level: 'info'
          });
          
          if (logger) {
            logger.logFromSource('git', 'info', resetMessage).catch(() => {});
          }
          await git.reset(['--hard']);
          await git.clean('f', ['-d']);
          await git.checkout(pipe(
            previousBranch,
            Option.getOrElse(() => 'master')
          ));
          const deleteMessage = `   🗑️  Attempting to delete branch '${branchToDelete}'`;
          onWorkerOutput?.({
            timestamp: Date.now(),
            line: deleteMessage,
            level: 'info'
          });
          
          if (logger) {
            logger.logFromSource('git', 'info', deleteMessage).catch(() => {});
          }
          await git.deleteLocalBranch(branchToDelete, true);
          const successMessage = `   ✅ Successfully deleted branch '${branchToDelete}'`;
          onWorkerOutput?.({
            timestamp: Date.now(),
            line: successMessage,
            level: 'info'
          });
          
          if (logger) {
            logger.logFromSource('git', 'info', successMessage).catch(() => {});
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const warningMessage = `   ⚠️  Cleanup warning: Failed to delete branch`;
          const detailsMessage = `   📝 Error details: ${errorMessage}`;
          
          onWorkerOutput?.({
            timestamp: Date.now(),
            line: warningMessage,
            level: 'error'
          });
          onWorkerOutput?.({
            timestamp: Date.now(),
            line: detailsMessage,
            level: 'error'
          });
          
          if (logger) {
            logger.logFromSource('git', 'error', warningMessage).catch(() => {});
            logger.logFromSource('git', 'error', detailsMessage).catch(() => {});
          }
          
          // If branch deletion fails due to worktree usage, provide helpful info
          if (errorMessage.includes('used by worktree')) {
            const infoMessage = `   💡 This may be due to active worktree usage. The branch will remain but is no longer checked out.`;
            onWorkerOutput?.({
              timestamp: Date.now(),
              line: infoMessage,
              level: 'info'
            });
            
            if (logger) {
              logger.logFromSource('git', 'info', infoMessage).catch(() => {});
            }
          }
        }
      }
    },
    
    log: {
      info: (message: string, ...args: unknown[]) => {
        onWorkerOutput?.({
          timestamp: Date.now(),
          line: message + (args.length > 0 ? ` ${args.join(' ')}` : ''),
          level: 'info'
        });
      },
      error: (message: string, ...args: unknown[]) => {
        onWorkerOutput?.({
          timestamp: Date.now(),
          line: message + (args.length > 0 ? ` ${args.join(' ')}` : ''),
          level: 'error'
        });
      }
    },
    
    sleep: (ms: number, _options?: { signal?: AbortSignal }) => 
      new Promise<void>(resolve => setTimeout(resolve, ms))
  };

  return statefulLoop(deps)(queue.getState(), queue.saveState.bind(queue));
}

async function main(options?: { 
  workingDir?: string; 
  useTUI?: boolean;
}) {
  try {
    // Create or use provided working directory
    const workingDir = options?.workingDir || (await createTempDir("task-runner-")).path;
    
    // Setup comprehensive logging to capture all console output in package directory
    const currentFileDir = path.dirname(new URL(import.meta.url).pathname);
    const packageDir = path.resolve(currentFileDir, '../..');  // Go up to worker-cli package root
    const logger = await setupGlobalLogger(packageDir);
    console.log(`🔍 Logging all output to: ${logger.getLogFilePath()}`);
    
    // Setup process signal handlers for proper cleanup
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      await cleanupGlobalLogger();
      process.exit(0);
    };
    
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      cleanupGlobalLogger().finally(() => process.exit(1));
    });
    process.on('unhandledRejection', (reason) => {
      console.error('💥 Unhandled Rejection:', reason);
      cleanupGlobalLogger().finally(() => process.exit(1));
    });
    
    const queue = new TasksMachineMemoryPersistence();
    
    // Create a shared worker output handler that will be connected to TUI
    const workerOutputHandler: { current?: (line: { timestamp: number; line: string; level?: string }) => void } = {};
    
    const { stop, appendTasks, editTask } = await processTaskQueue(queue, workingDir, (line) => {
      // Log worker output to file
      const logger = getGlobalLogger();
      if (logger) {
        logger.logFromSource('worker', (line.level as 'info' | 'error' | 'warn' | 'debug') || 'info', line.line).catch(() => {
          // Ignore logging errors to avoid infinite loops
        });
      }
      
      if (workerOutputHandler.current) {
        workerOutputHandler.current(line);
      }
    });

    // TUI interface options with output handler connection
    const interfaceOptions = {
      persistence: queue,
      workingDir,
      onAddTask: async (desc: string) => {
        const nextId = queue.getNextTaskId();
        await appendTasks(TasksMachine.Utils.liftTasks(nextId, {
          description: castNonEmptyString(desc)
        } satisfies UserTask));
      },
      onEditTask: async (taskIdStr: string, description: string) => {
        const taskId = castTaskId(parseInt(taskIdStr, 10));
        const desc = castNonEmptyString(description);
        await editTask(taskId, desc);
      },
      onStop: async () => {
        console.log('🛑 Shutting down...');
        stop();
        await cleanupGlobalLogger();
        process.exit(0);
      },
      // Connect the worker output handler
      onWorkerOutput: (handler: (line: { timestamp: number; line: string; level?: string }) => void) => {
        workerOutputHandler.current = handler;
      }
    };

    // Try TUI first, fallback to simple CLI if it fails
    const useFallback = process.env.USE_FALLBACK_CLI === 'true' || process.argv.includes('--fallback');
    
    try {
      if (useFallback) {
        console.log("Using fallback CLI mode");
        await startFallbackCLI(interfaceOptions);
      } else {
        await startTUI(interfaceOptions);
      }
    } catch (error) {
      console.error("TUI failed, falling back to simple CLI:", error);
      await startFallbackCLI(interfaceOptions);
    } finally {
      // Show log file location before exiting
      const logger = getGlobalLogger();
      if (logger) {
        console.log(`\n📋 All logs saved to: ${logger.getLogFilePath()}`);
      }
    }
    
  } catch (error) {
    console.error(`\n🚨 Error: ${error}`);
    const logger = getGlobalLogger();
    if (logger) {
      console.log(`\n📋 Error logs saved to: ${logger.getLogFilePath()}`);
      await cleanupGlobalLogger();
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main({ useTUI: true }).catch(console.error);
}

export { main };