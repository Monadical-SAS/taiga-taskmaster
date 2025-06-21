#!/usr/bin/env node
// @vibe-generated: conforms to worker-interface
/* eslint-disable functional/no-classes, functional/immutable-data, functional/no-expression-statements */
import * as readline from "readline";
import { createTempDir } from "../utils/temp-utils.js";
import type { TasksMachine } from "@taiga-task-master/core";
import { HashMap, Option } from "effect";
import { castPositiveInteger, type TaskId, castNonEmptyString, castNonNegativeInteger } from "@taiga-task-master/common";
import { statefulLoop } from "@taiga-task-master/worker-interface";
import * as path from "path";
import * as fs from "fs/promises";

interface UserTask {
  id: TaskId;
  description: string;
  timestamp: number;
}

class TaskQueue {
  private readonly tasks: Map<TaskId, UserTask> = new Map();
  private readonly completedTasks: Set<TaskId> = new Set();
  private taskCounter = 0;

  addTask(description: string): TaskId {
    this.taskCounter++;
    const id = castPositiveInteger(this.taskCounter) as TaskId;
    const task: UserTask = {
      id,
      description: description.trim(),
      timestamp: Date.now()
    };
    this.tasks.set(id, task);
    return id;
  }

  getTaskMap(): TasksMachine.Tasks {
    const taskEntries = Array.from(this.tasks.entries())
      .filter(([id]) => !this.completedTasks.has(id))
      .map(([id, task]) => [id, task.description as TasksMachine.Task] as const);
    
    return HashMap.fromIterable(taskEntries);
  }

  markCompleted(taskId: TaskId): void {
    this.completedTasks.add(taskId);
  }

  hasPendingTasks(): boolean {
    return this.tasks.size > this.completedTasks.size;
  }

  getPendingCount(): number {
    return this.tasks.size - this.completedTasks.size;
  }

  getTaskDescription(taskId: TaskId): string {
    return this.tasks.get(taskId)?.description || "Unknown task";
  }
}

const createNextTaskStrategy = (): TasksMachine.NextTaskF => {
  return (tasks: TasksMachine.Tasks) => {
    const entries = HashMap.toEntries(tasks);
    if (entries.length === 0) return Option.none();
    
    // Simple FIFO - return first available task
    const entry = entries[0];
    if (entry) {
      return Option.some(entry);
    }
    return Option.none();
  };
};

async function createUserInterface(queue: TaskQueue, workingDir: string) {
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
        console.log(`📊 Queue status: ${queue.getPendingCount()} pending tasks`);
        rl.prompt();
        return;
      }
      
      if (input.length === 0) {
        rl.prompt();
        return;
      }

      const taskId = queue.addTask(input);
      console.log(`✅ Added task ${taskId}: "${input}"`);
      rl.prompt();
    });

    rl.on("close", () => {
      resolve();
    });
  });
}

async function processTaskQueue(queue: TaskQueue, workingDir: string) {
  const { makeGooseWorker } = await import("../workers/goose.js");
  const { simpleGit } = await import("simple-git");
  
  const git = simpleGit(workingDir);
  
  // Initialize git repository if needed (same as in goose worker)
  try {
    await git.raw(['rev-parse', '--git-dir']);
  } catch {
    // Not a git repository, initialize one
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
      hard: 330000 // 5.5 minutes hard limit
    }
  });

  // Prepare initial state for TasksMachine
  const initialState: TasksMachine.State = {
    tasks: queue.getTaskMap(),
    timestamp: castNonNegativeInteger(Date.now()),
    taskExecutionState: {
      step: "stopped"
    },
    outputTasks: [],
    artifacts: []
  };

  // State persistence function  
  const saveState = async (state: TasksMachine.State) => {
    // Simple state persistence - in CLI we don't need complex state management
    // Just sync the queue completion status with the state changes
    console.log(`💾 State saved: ${HashMap.size(state.tasks)} tasks remaining`);
  };

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
    
    next: createNextTaskStrategy(),
    
    description: (task: TasksMachine.Task) => castNonEmptyString(String(task)),
    
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
      
      cleanup: async (branchName: string) => {
        console.log(`🧹 Cleaning up branch: ${branchName}`);
        try {
          await git.checkout('master');
          await git.deleteLocalBranch(branchName);
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

  // Use statefulLoop from worker-interface
  console.log(`\n🔄 Starting stateful loop for task processing...`);
  
  // Add a completion tracker
  // eslint-disable-next-line functional/no-let
  let processedCount = 0;
  const totalTasks = queue.getPendingCount();
  
  // Enhanced saveState to track completion
  const enhancedSaveState = async (state: TasksMachine.State) => {
    await saveState(state);
    
    // Count completed tasks based on outputTasks
    const completedInState = state.outputTasks.length;
    
    // Update our completion tracking
    if (completedInState > processedCount) {
      processedCount = completedInState;
      const lastTask = state.outputTasks[completedInState - 1];
      if (lastTask) {
        const [taskId] = lastTask;
        queue.markCompleted(taskId);
        console.log(`✅ Task ${taskId} completed (${processedCount}/${totalTasks})`);
      }
    }
  };
  
  const loopController = statefulLoop(deps)(initialState, enhancedSaveState) as { 
    stop: () => void; 
    appendTasks: (tasks: TasksMachine.Tasks) => TasksMachine.State;
  };
  
  // Wait for all tasks to be processed
  return new Promise<number>((resolve) => {
    const checkCompletion = () => {
      if (processedCount >= totalTasks) {
        console.log(`\n✅ All ${processedCount} tasks completed! Stopping loop...`);
        loopController.stop();
        resolve(processedCount);
      } else {
        setTimeout(checkCompletion, 1000); // Check every second
      }
    };
    
    // Start checking for completion
    setTimeout(checkCompletion, 2000); // Start checking after 2 seconds
  });
}

async function main(options?: { tasks?: string[], workingDir?: string }) {
  try {
    // Create or use provided working directory
    const workingDir = options?.workingDir || (await createTempDir("task-runner-")).path;
    
    console.log(`🌟 Task Runner CLI`);
    console.log(`📁 Working directory: ${workingDir}`);
    
    const queue = new TaskQueue();
    
    // If tasks are provided, add them directly (non-interactive mode)
    if (options?.tasks && options.tasks.length > 0) {
      console.log(`\n📝 Adding ${options.tasks.length} tasks to queue...`);
      // eslint-disable-next-line functional/no-loop-statements
      for (const task of options.tasks) {
        const taskId = queue.addTask(task);
        console.log(`✅ Added task ${taskId}: "${task}"`);
      }
      
      // Process all tasks
      await processTaskQueue(queue, workingDir);
      
      console.log(`\n👋 Task Runner finished!`);
      console.log(`📁 Results available in: ${workingDir}`);
      return;
    }
    
    // Interactive mode
    // Start background task processor
    const _processingPromise = (async () => {
      // eslint-disable-next-line functional/no-loop-statements
      while (true) {
        if (queue.hasPendingTasks()) {
          await processTaskQueue(queue, workingDir);
        }
        // Check every 2 seconds for new tasks
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    })();

    // Start user interface
    await createUserInterface(queue, workingDir);
    
    // Process any remaining tasks
    if (queue.hasPendingTasks()) {
      console.log(`\n🔄 Processing remaining tasks...`);
      await processTaskQueue(queue, workingDir);
    }
    
    console.log(`\n👋 Task Runner finished!`);
    console.log(`📁 Results available in: ${workingDir}`);
    
  } catch (error) {
    console.error(`\n🚨 Error: ${error}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main, TaskQueue, createNextTaskStrategy, processTaskQueue };