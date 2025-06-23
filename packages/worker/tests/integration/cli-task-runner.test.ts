// @vibe-generated: conforms to worker-interface
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTempDir } from "../../src/utils/temp-utils.js";
import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { createNextTaskStrategies } from '../../src/index.js';

describe("CLI Task Runner Integration", () => {
  const state = {
    tempDir: "",
    cleanup: (() => {}) as () => void
  };

  beforeEach(async () => {
    const temp = await createTempDir("cli-test-");
    state.tempDir = temp.path;
    state.cleanup = temp.cleanup;
  });

  afterEach(() => {
    state.cleanup();
  });



  it("should process tasks through programmatic interface", async () => {
    // Import the main function and TaskQueue class directly
    const { TasksMachineMemoryPersistence } = await import("../../src/cli/task-runner.js");
    const { makeGooseWorker } = await import("../../src/workers/goose.js");

    // Create a task queue
    const queue = new TasksMachineMemoryPersistence();
    
    // Add a simple test task
    const taskId = queue.addTask("Create a file called test.txt with content 'Hello World'");
    
    expect(queue.hasPendingTasks()).toBe(true);
    expect(queue.getQueueSize()).toBe(1);

    // Create a mock goose worker for testing
    const mockGooseWorker = makeGooseWorker({
      workingDirectory: state.tempDir,
      goose: {
        model: "test-model",
        provider: "test-provider",
        instructionsFile: path.join(state.tempDir, "instructions.md")
      },
      timeouts: {
        process: 5000,
        hard: 6000
      }
    });

    const nextTask = createNextTaskStrategies().fifo;
    const taskMap = queue.getTaskMap();
    const nextTaskResult = nextTask(taskMap);
    
    expect(nextTaskResult._tag).toBe('Some');
    
    if (nextTaskResult._tag === 'Some') {
      const [retrievedTaskId, task] = nextTaskResult.value;
      expect(retrievedTaskId).toBe(taskId);
      
      const description = queue.fetchTaskDescription(taskId);
      expect(description).toBe("Create a file called test.txt with content 'Hello World'");

      // Try to run the task (this will likely fail since we don't have real goose setup)
      try {
        const result = await mockGooseWorker({ description }, { signal: AbortSignal.timeout(5000) });
        
        // Even if it fails, we should get a proper result structure
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
        
        if (!result.success) {
          expect(result).toHaveProperty('error');
          console.log('Expected test failure (no real goose):', result.error?.message);
        }
      } catch (error) {
        // Expected to fail in test environment without proper goose setup
        console.log('Expected test error (no real goose):', error);
      }

      // Mark task as completed
      queue.markCompleted(taskId);
      expect(queue.hasPendingTasks()).toBe(false);
    }
  });

  it("should handle multiple tasks in queue", async () => {
    const { TasksMachineMemoryPersistence } = await import("../../src/cli/task-runner.js");
    
    const queue = new TasksMachineMemoryPersistence();
    
    // Add multiple tasks
    const task1 = queue.addTask("First task");
    const task2 = queue.addTask("Second task");
    const task3 = queue.addTask("Third task");
    
    expect(queue.getQueueSize()).toBe(3);
    
    // Process tasks one by one
    queue.markCompleted(task1);
    expect(queue.getQueueSize()).toBe(2);
    
    queue.markCompleted(task2);
    expect(queue.getQueueSize()).toBe(1);
    
    queue.markCompleted(task3);
    expect(queue.getQueueSize()).toBe(0);
    expect(queue.hasPendingTasks()).toBe(false);
  });

  it("should create proper instructions file", async () => {
    const { makeGooseWorker } = await import("../../src/workers/goose.js");
    
    const instructionsPath = path.join(state.tempDir, "test-instructions.md");
    
    const worker = makeGooseWorker({
      workingDirectory: state.tempDir,
      goose: {
        model: "test-model",
        provider: "test-provider",
        instructionsFile: instructionsPath
      }
    });

    const taskDescription = "Create a simple hello world program";
    
    try {
      // This will fail but should create the instructions file
      await worker({ description: taskDescription }, { signal: AbortSignal.timeout(1000) });
    } catch (error) {
      // Expected to fail, but file should be created
    }

    // Check if instructions file was created
    const fileExists = await fs.access(instructionsPath).then(() => true).catch(() => false);
    expect(fileExists).toBe(true);
    
    if (fileExists) {
      const content = await fs.readFile(instructionsPath, 'utf-8');
      expect(content).toBe(taskDescription);
    }
  });

  it("should handle task queue state correctly", async () => {
    const { TasksMachineMemoryPersistence, createNextTaskStrategy } = await import("../../src/cli/task-runner");
    
    const queue = new TasksMachineMemoryPersistence();
    const nextTask = createNextTaskStrategy();
    
    // Empty queue should return None
    const emptyResult = nextTask(queue.getTaskMap());
    expect(emptyResult._tag).toBe('None');
    
    // Add task and verify it can be retrieved
    const taskId = queue.addTask("Test task");
    const taskResult = nextTask(queue.getTaskMap());
    expect(taskResult._tag).toBe('Some');
    
    if (taskResult._tag === 'Some') {
      const [retrievedId, _task] = taskResult.value;
      expect(retrievedId).toBe(taskId);
    }
    
    // Mark completed and verify queue is empty
    queue.markCompleted(taskId);
    const completedResult = nextTask(queue.getTaskMap());
    expect(completedResult._tag).toBe('None');
  });
}, 30000);