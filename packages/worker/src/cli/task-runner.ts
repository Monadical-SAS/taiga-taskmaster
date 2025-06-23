#!/usr/bin/env node
// @vibe-generated: conforms to worker-interface
/* eslint-disable functional/no-classes, functional/immutable-data, functional/no-expression-statements */
import * as readline from "readline";
import { createTempDir } from "../utils/temp-utils.js";
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
import { createNextTaskStrategies } from '../core/next-task.js';

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

async function createUserInterface(queue: TasksMachineMemoryPersistence, addTask: (t: string) => Promise<void>, workingDir: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "\n📝 Enter task (or 'quit' to exit, 'status' for info): "
  });

  console.log(`\n🚀 Task Runner Started`);
  console.log(`📁 Working directory: ${workingDir}`);
  console.log(`💡 Enter task descriptions to add them to the queue`);
  console.log(`⚡ Tasks will be processed automatically through git + goose`);

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
        console.log(`📊 Queue status: ${queue.getQueueSize()} pending tasks`);
        rl.prompt();
        return;
      }
      
      if (input.length === 0) {
        rl.prompt();
        return;
      }

      addTask(input);
      console.log(`✅ Added task: "${input}"`);
      rl.prompt();
    });

    rl.on("close", () => {
      resolve();
    });
  });
}

async function processTaskQueue(queue: TasksMachineMemoryPersistence, workingDir: string) {
  const { makeGooseWorker } = await import("../workers/goose.js");
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

  const gooseWorker = makeGooseWorker({
    workingDirectory: workingDir,
    goose: {
      model: "anthropic/claude-sonnet-4",
      provider: "openrouter",
      instructionsFile: path.join(workingDir, "instructions.md")
    },
    timeouts: {
      process: 300000, // 5 minutes per task
    }
  });

  // Set up the statefulLoop dependencies 
  const deps = {
    runWorker: async (task: { description: string }, options?: { signal?: AbortSignal }) => {
      console.log(`🔄 Running goose for: "${task.description}"`);
      const result = await gooseWorker(task, options);
      // Convert WorkerResult to the expected format
      return {
        output: [
          {
            timestamp: Date.now(),
            line: `Task completed with result: ${JSON.stringify({ success: result.success, artifacts: result.artifacts, branchName: result.branchName })}`
          }
        ]
      };
    },
    
    next: createNextTaskStrategies().fifo,
    
    description: assumeTaskDescription,
    
    git: {
      isClean: async () => {
        const status = await git.status();
        return status.files.length === 0;
      },
      
      branch: async (name: string) => {
        const branchName = `task-${name}`;
        console.log(`🌿 Creating branch: ${branchName}`);
        await git.checkoutLocalBranch(branchName);
        return castNonEmptyString(branchName);
      },
      
      commitAndPush: async () => {
        console.log(`📝 Committing and pushing changes...`);
        const status = await git.status();
        if (status.files.length > 0) {
          await git.add('.');
          await git.commit(`Task execution completed at ${new Date().toISOString()}`);
          console.log(`   ✅ Committed ${status.files.length} files`);
        } else {
          console.log(`   ℹ️  No changes to commit`);
        }
      },

      cleanup: async (previousBranch: NonEmptyString) => {
        console.log(`🧹 Resetting to branch: ${previousBranch}`);
        try {
          const currentBranch = await git.branchLocal();
          await git.checkout(previousBranch);
          await git.deleteLocalBranch(currentBranch.current);
        } catch (error) {
          console.log(`   ⚠️  Cleanup warning: ${error}`);
        }
      }
    },
    
    log: {
      info: (message: string, ...args: unknown[]) => console.log(message, ...args),
      error: (message: string, ...args: unknown[]) => console.error(message, ...args)
    },
    
    sleep: (ms: number, _options?: { signal?: AbortSignal }) => 
      new Promise<void>(resolve => setTimeout(resolve, ms))
  };

  return statefulLoop(deps)(queue.getState(), queue.saveState.bind(queue));

}

async function main(options?: { workingDir?: string }) {
  try {
    // Create or use provided working directory
    const workingDir = options?.workingDir || (await createTempDir("task-runner-")).path;
    
    console.log(`🌟 Task Runner CLI`);
    console.log(`📁 Working directory: ${workingDir}`);
    
    const queue = new TasksMachineMemoryPersistence();

    const { stop, appendTasks } = await processTaskQueue(queue, workingDir);

    // Start user interface
    await createUserInterface(queue, async (desc) => {
      const nextId = castTaskId(queue.getQueueSize() + 1);
      await appendTasks(TasksMachine.Utils.liftTasks(nextId, {
        description: desc
      } satisfies UserTask))
    }, workingDir);
    
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