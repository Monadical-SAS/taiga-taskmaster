#!/usr/bin/env node
// @vibe-generated: conforms to worker-interface
/* eslint-disable functional/no-classes, functional/immutable-data, functional/no-expression-statements */
import * as readline from "readline";
import { createTempDir, createMetadataDirectories } from "@taiga-task-master/worker";
import { TasksMachine } from "@taiga-task-master/core";
import { HashMap, Option, pipe } from 'effect';
import {
  type TaskId,
  castNonEmptyString,
  castNonNegativeInteger,
  type NonNegativeInteger, castTaskId, type NonEmptyString
} from '@taiga-task-master/common';
import { statefulLoop } from "@taiga-task-master/worker-interface";
import * as path from "path";
import * as fs from "fs/promises";
import { createNextTaskStrategies } from '@taiga-task-master/worker';

interface UserTask {
  description: string;
}

class TasksMachineMemoryPersistence {
  private state = TasksMachine.state0;

  getState(): TasksMachine.State {
    return this.state;
  }

  saveState = async (s: TasksMachine.State) => {
    this.state = s;
  }

  getQueueSize(): NonNegativeInteger {
    return castNonNegativeInteger(HashMap.size(this.state.tasks));
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

async function createUserInterface(queue: TasksMachineMemoryPersistence, addTask: (t: NonEmptyString) => Promise<void>, workingDir: string, logger?: { info: (msg: string, ...args: unknown[]) => void; error: (msg: string, ...args: unknown[]) => void }) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "\n📝 Enter task (or 'quit' to exit, 'status' for info): "
  });

  const log = logger || { info: console.log, error: console.error };
  
  log.info(`\n🚀 Task Runner Started`);
  log.info(`📁 Working directory: ${workingDir}`);
  log.info(`💡 Enter task descriptions to add them to the queue`);
  log.info(`⚡ Tasks will be processed automatically through git + goose`);

  return new Promise<void>((resolve) => {
    rl.prompt();

    rl.on("line", (line) => {
      const input = line.trim();
      
      if (input === "quit" || input === "exit") {
        rl.close();
        resolve();
        return;
      }
      
      if (input === "status") {
        log.info(`📊 Queue status: ${queue.getQueueSize()} pending tasks`);
        rl.prompt();
        return;
      }
      
      if (input.length === 0) {
        rl.prompt();
        return;
      }

      addTask(castNonEmptyString(input));
      log.info(`✅ Added task: "${input}"`);
      rl.prompt();
    });

    rl.on("close", () => {
      resolve();
    });
  });
}

async function processTaskQueue(queue: TasksMachineMemoryPersistence, workingDir: string, logger?: { info: (msg: string, ...args: unknown[]) => void; error: (msg: string, ...args: unknown[]) => void }) {
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

  const log = logger || { info: console.log, error: console.error };
  
  // Create metadata directories for execution metadata (separate from git repo)
  const metadataDirs = await createMetadataDirectories(`task-session-${Date.now()}-`);
  
  log.info(`📁 Working directory (git): ${workingDir}`);
  log.info(`📊 Metadata directory: ${metadataDirs.metadataDir}`);
  log.info(`📋 Logs will be written to: ${metadataDirs.logsDir}`);

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
    }
  });

  // Set up the statefulLoop dependencies 
  const deps = {
    runWorker: async (task: { description: string }, options?: { signal?: AbortSignal }) => {
      log.info(`🔄 Running goose for: "${task.description}"`);
      const result = await gooseWorker(task, options);
      
      // Show the goose output log for tail -f
      if (result.logFiles?.gooseOutput) {
        log.info(`📋 Goose output log (tail -f): ${result.logFiles.gooseOutput}`);
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
        await git.deleteLocalBranch(branchName);
      },
      
      branch: async (name: Option.Option<NonEmptyString>) => {
        // Capture current branch before switching
        const currentBranch = await git.branchLocal();
        const previousBranch = currentBranch.current;
        
        const branchName = name;
        log.info(`🌿 Creating branch: ${branchName}`);
        await git.checkoutLocalBranch(pipe(
          branchName,
          Option.getOrElse(() => castNonEmptyString('master'))
        ));
        
        // Return the previous branch name for cleanup
        return castNonEmptyString(previousBranch);
      },
      
      commitAndPush: async () => {
        log.info(`📝 Committing and pushing changes...`);
        const status = await git.status();
        if (status.files.length > 0) {
          await git.add('.');
          await git.commit(`Task execution completed at ${new Date().toISOString()}`);
          log.info(`   ✅ Committed ${status.files.length} files`);
        } else {
          log.info(`   ℹ️  No changes to commit`);
        }
      },

      cleanup: async (previousBranch: NonEmptyString) => {
        log.info(`🧹 Resetting to branch: ${previousBranch}`);
        try {
          const currentBranch = await git.branchLocal();
          const branchToDelete = currentBranch.current;
          log.info(`   🔄 Switching from '${branchToDelete}' to '${previousBranch}'`);
          
          // Discard uncommitted changes from failed task execution
          log.info(`   🧽 Discarding uncommitted changes with git reset --hard`);
          await git.reset(['--hard']);
          
          await git.checkout(previousBranch);
          log.info(`   🗑️  Attempting to delete branch '${branchToDelete}'`);
          await git.deleteLocalBranch(branchToDelete);
          log.info(`   ✅ Successfully deleted branch '${branchToDelete}'`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          log.error(`   ⚠️  Cleanup warning: Failed to delete branch`);
          log.error(`   📝 Error details: ${errorMessage}`);
          
          // If branch deletion fails due to worktree usage, provide helpful info
          if (errorMessage.includes('used by worktree')) {
            log.info(`   💡 This may be due to active worktree usage. The branch will remain but is no longer checked out.`);
          }
        }
      }
    },
    
    log: {
      info: (message: string, ...args: unknown[]) => log.info(message, ...args),
      error: (message: string, ...args: unknown[]) => log.error(message, ...args)
    },
    
    sleep: (ms: number, _options?: { signal?: AbortSignal }) => 
      new Promise<void>(resolve => setTimeout(resolve, ms))
  };

  return statefulLoop(deps)(queue.getState(), queue.saveState.bind(queue));

}

async function main(options?: { workingDir?: string; logger?: { info: (msg: string, ...args: unknown[]) => void; error: (msg: string, ...args: unknown[]) => void } }) {
  try {
    const logger = options?.logger || { info: console.log, error: console.error };
    
    // Create or use provided working directory
    const workingDir = options?.workingDir || (await createTempDir("task-runner-")).path;
    
    logger.info(`🌟 Task Runner CLI`);
    logger.info(`📁 Working directory: ${workingDir}`);
    
    const queue = new TasksMachineMemoryPersistence();

    const { stop, appendTasks } = await processTaskQueue(queue, workingDir, logger);

    // Start user interface
    await createUserInterface(queue, async (desc) => {
      const nextId = castTaskId(queue.getQueueSize() + 1);
      await appendTasks(TasksMachine.Utils.liftTasks(nextId, {
        description: desc
      } satisfies UserTask))
    }, workingDir, logger);
    
  } catch (error) {
    console.error(`\n🚨 Error: ${error}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, TasksMachineMemoryPersistence, processTaskQueue };