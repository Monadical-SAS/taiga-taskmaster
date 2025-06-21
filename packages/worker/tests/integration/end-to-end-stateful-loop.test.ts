// @vibe-generated: conforms to worker-interface
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTempDir } from "../../src/utils/temp-utils";
import { createGooseStatefulLoop } from "../../src/stateful/goose-stateful";
import type { TasksMachine } from "@taiga-task-master/core";
// import { castNonEmptyString } from "@taiga-task-master/common";
import { HashMap, Option } from "effect";
import * as fs from "fs/promises";
import * as path from "path";

interface TestTask {
  id: string;
  description: string;
  dependencies?: string[];
}

describe("End-to-End Stateful Loop Integration", () => {
  const state = {
    tempDir: "",
    cleanup: (() => {}) as () => void
  };

  beforeEach(async () => {
    const temp = await createTempDir();
    state.tempDir = temp.path;
    state.cleanup = temp.cleanup;
  });

  afterEach(() => {
    state.cleanup();
  });

  it("should execute a complete task workflow with git integration", async () => {
    // Create simple test tasks
    const tasks: TestTask[] = [
      { id: "1", description: "Create a simple JavaScript function to add two numbers" },
      { id: "2", description: "Write tests for the add function", dependencies: ["1"] },
      { id: "3", description: "Create documentation for the project", dependencies: ["1", "2"] }
    ];

    // Convert to TasksMachine format
    const taskMap = HashMap.fromIterable(
      tasks.map(task => [task.id, task as TasksMachine.Task])
    );

    // Mock next task function that respects dependencies
    const completedTasks = new Set<string>();
    const nextTask: TasksMachine.NextTaskF = (tasks) => {
      for (const [id, task] of HashMap.toIterable(tasks)) {
        const testTask = task as TestTask;
        const canRun = !completedTasks.has(id) && 
          (testTask.dependencies?.every(dep => completedTasks.has(dep)) ?? true);
        
        if (canRun) {
          return Option.some([id, task]);
        }
      }
      return Option.none();
    };

    // Create stateful loop with real git operations
    const statefulLoop = createGooseStatefulLoop({
      workingDir: state.tempDir,
      sessionId: "test-session",
      gooseConfigDir: path.join(state.tempDir, ".goose"),
      gooseBinary: "echo", // Use echo instead of real goose for testing
      timeout: 30000
    });

    const maxIterations = 5;

    // Execute the loop
    const result = await statefulLoop({
      taskMap,
      next: nextTask,
      onTaskComplete: (taskId, result) => {
        console.log(`Task ${taskId} completed:`, result);
        completedTasks.add(taskId);
      },
      maxIterations
    });

    // Verify results
    expect(result.completedTasks).toHaveLength(3);
    expect(completedTasks.size).toBe(3);
    
    // Verify git operations were performed
    const gitDir = path.join(state.tempDir, ".git");
    await expect(fs.access(gitDir)).resolves.not.toThrow();

    // Verify branch was created
    const branchFile = path.join(gitDir, "HEAD");
    const branchContent = await fs.readFile(branchFile, "utf-8");
    expect(branchContent).toContain("refs/heads/");
  }, 60000);

  it("should handle task failures gracefully", async () => {
    const failingTask: TestTask = {
      id: "fail",
      description: "This task will fail intentionally"
    };

    const taskMap = HashMap.make(["fail", failingTask as TasksMachine.Task]);

    const nextTask: TasksMachine.NextTaskF = (tasks) => {
      const entry = HashMap.toIterable(tasks).next().value;
      return entry ? Option.some(entry) : Option.none();
    };

    const statefulLoop = createGooseStatefulLoop({
      workingDir: state.tempDir,
      sessionId: "fail-test",
      gooseConfigDir: path.join(state.tempDir, ".goose"),
      gooseBinary: "false", // Command that always fails
      timeout: 5000
    });

    const result = await statefulLoop({
      taskMap,
      next: nextTask,
      onTaskComplete: () => {},
      maxIterations: 1
    });

    // Should handle failure without crashing
    expect(result.failedTasks).toHaveLength(1);
    expect(result.completedTasks).toHaveLength(0);
  });

  it("should respect task dependencies", async () => {
    const executionOrder: string[] = [];
    
    const dependentTasks: TestTask[] = [
      { id: "base", description: "Base task with no dependencies" },
      { id: "mid", description: "Middle task depends on base", dependencies: ["base"] },
      { id: "top", description: "Top task depends on middle", dependencies: ["mid"] }
    ];

    const taskMap = HashMap.fromIterable(
      dependentTasks.map(task => [task.id, task as TasksMachine.Task])
    );

    const completedTasks = new Set<string>();
    const nextTask: TasksMachine.NextTaskF = (tasks) => {
      for (const [id, task] of HashMap.toIterable(tasks)) {
        const testTask = task as TestTask;
        const canRun = !completedTasks.has(id) && 
          (testTask.dependencies?.every(dep => completedTasks.has(dep)) ?? true);
        
        if (canRun) {
          return Option.some([id, task]);
        }
      }
      return Option.none();
    };

    const statefulLoop = createGooseStatefulLoop({
      workingDir: state.tempDir,
      sessionId: "dependency-test",
      gooseConfigDir: path.join(state.tempDir, ".goose"),
      gooseBinary: "echo",
      timeout: 10000
    });

    await statefulLoop({
      taskMap,
      next: nextTask,
      onTaskComplete: (taskId) => {
        executionOrder.push(taskId);
        completedTasks.add(taskId);
      },
      maxIterations: 3
    });

    // Verify execution order respects dependencies
    expect(executionOrder).toEqual(["base", "mid", "top"]);
  });

  it("should create proper git artifacts for each task", async () => {
    const task: TestTask = {
      id: "artifact-test",
      description: "Create a simple README file"
    };

    const taskMap = HashMap.make(["artifact-test", task as TasksMachine.Task]);

    const nextTask: TasksMachine.NextTaskF = (tasks) => {
      const entry = HashMap.toIterable(tasks).next().value;
      return entry ? Option.some(entry) : Option.none();
    };

    const statefulLoop = createGooseStatefulLoop({
      workingDir: state.tempDir,
      sessionId: "artifact-test",
      gooseConfigDir: path.join(state.tempDir, ".goose"),
      gooseBinary: "echo",
      timeout: 10000
    });

    await statefulLoop({
      taskMap,
      next: nextTask,
      onTaskComplete: () => {},
      maxIterations: 1
    });

    // Verify git repository was initialized
    const gitDir = path.join(state.tempDir, ".git");
    await expect(fs.access(gitDir)).resolves.not.toThrow();

    // Verify Goose instruction file was created
    const gooseDir = path.join(state.tempDir, ".goose");
    const sessionDir = path.join(gooseDir, "artifact-test");
    await expect(fs.access(sessionDir)).resolves.not.toThrow();
  });
});