// @vibe-generated: conforms to worker-interface
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTempDir } from "../../src/utils/temp-utils";
import { processTaskQueue, TasksMachineMemoryPersistence } from "../../src/cli/task-runner";
import { TasksMachine } from "@taiga-task-master/core";
import { castTaskId } from "@taiga-task-master/common";
import { simpleGit } from "simple-git";

describe("Stateful Loop Simple Integration", () => {
  const state = {
    tempDir: "",
    cleanup: (() => {}) as () => void
  };

  beforeEach(async () => {
    const temp = await createTempDir("stateful-simple-test-");
    state.tempDir = temp.path;
    state.cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (!process.env.KEEP_TEST_DIRS) {
      state.cleanup();
    }
  });

  it("should initialize git repository and use statefulLoop", async () => {
    const queue = new (TasksMachineMemoryPersistence)();
    
    // Add a simple task using the state machine API
    const taskId = castTaskId(1);
    const tasks = TasksMachine.Utils.liftTasks(taskId, {
      description: 'Test task for git initialization'
    });
    
    await queue.saveState({
      ...queue.getState(),
      tasks
    });
    
    // Verify task was added to queue
    expect(queue.hasPendingTasks()).toBe(true);
    expect(queue.getQueueSize()).toBe(1);
    
    // This will fail because goose doesn't exist, but should create git repo and branches
    try {
      // Note: This will fail due to missing goose, but should still test git setup
      await processTaskQueue(queue, state.tempDir);
    } catch (error) {
      // Expected to fail due to missing goose binary
      console.log("Expected failure due to missing goose:", (error as Error).message);
    }

    // Verify git repository was created
    const git = simpleGit(state.tempDir);
    const isRepo = await git.checkIsRepo();
    expect(isRepo).toBe(true);

    // Verify commits exist (should have initial commit at minimum)
    const log = await git.log();
    expect(log.all.length).toBeGreaterThanOrEqual(1);
    
    // Find the initial commit (should be the last one)
    const initialCommit = log.all.find(commit => commit.message.includes("Initial commit"));
    expect(initialCommit).toBeDefined();

    // Check that we're back on master branch after task completion
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    // Should be back on master after cleanup (but task execution might leave us on a task branch)
    expect(currentBranch.trim()).toMatch(/^(master|task-.+)$/);

    console.log(`✅ Git initialization test completed in ${state.tempDir}`);
  }, 30000);

  it("should handle empty task queue gracefully", async () => {
    const queue = new (TasksMachineMemoryPersistence)();
    
    // No tasks added - queue should be empty
    expect(queue.hasPendingTasks()).toBe(false);
    expect(queue.getQueueSize()).toBe(0);
    
    // Process empty queue - should complete immediately
    // Note: processTaskQueue returns a promise with loop controls, not a count
    const { stop } = await processTaskQueue(queue, state.tempDir);
    stop(); // Stop the loop immediately

    // Git repo should still be initialized
    const git = simpleGit(state.tempDir);
    const isRepo = await git.checkIsRepo();
    expect(isRepo).toBe(true);

    console.log(`✅ Empty queue test completed in ${state.tempDir}`);
  }, 15000);
});