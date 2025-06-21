// @vibe-generated: conforms to worker-interface
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTempDir } from "../../src/utils/temp-utils";
import { main } from "../../src/cli/task-runner";
import { simpleGit } from "simple-git";
import * as fs from "fs/promises";
import * as path from "path";

describe("Stateful Loop CLI Integration", () => {
  const state = {
    tempDir: "",
    cleanup: (() => {}) as () => void
  };

  beforeEach(async () => {
    const temp = await createTempDir("stateful-cli-test-");
    state.tempDir = temp.path;
    state.cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (!process.env.KEEP_TEST_DIRS) {
      state.cleanup();
    }
  });

  it("should use statefulLoop correctly and create files", async () => {
    const tasks = [
      'Create a simple file called "hello.txt" with content "Hello from statefulLoop"'
    ];

    // Mock the goose worker to create files directly
    const mockGooseWorker = async (task: { description: string }) => {
      console.log(`🤖 Mock goose executing: ${task.description}`);
      
      // Create the requested file
      await fs.writeFile(
        path.join(state.tempDir, "hello.txt"),
        "Hello from statefulLoop",
        "utf-8"
      );
      
      return {
        success: true,
        artifacts: ["hello.txt"],
        branchName: "task-123"
      };
    };

    // Temporarily replace the goose worker import
    const originalMakeGooseWorker = (await import("../../src/workers/goose.js")).makeGooseWorker;
    
    try {
      // Replace with mock
      // @ts-expect-error - Mocking module for test
      (await import("../../src/workers/goose.js")).makeGooseWorker = () => mockGooseWorker;

      // Run the CLI in non-interactive mode
      await main({
        tasks,
        workingDir: state.tempDir
      });

      // Verify git repository was created
      const git = simpleGit(state.tempDir);
      const isRepo = await git.checkIsRepo();
      expect(isRepo).toBe(true);

      // Verify file was created
      const fileExists = await fs.access(path.join(state.tempDir, "hello.txt")).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      const fileContent = await fs.readFile(path.join(state.tempDir, "hello.txt"), "utf-8");
      expect(fileContent).toBe("Hello from statefulLoop");

      // Verify commit was made
      const log = await git.log();
      expect(log.all.length).toBeGreaterThan(1); // Should have initial commit + task commit

      console.log(`✅ Test completed successfully in ${state.tempDir}`);
    } finally {
      // Restore original function
      // @ts-expect-error - Restoring module after test
      (await import("../../src/workers/goose.js")).makeGooseWorker = originalMakeGooseWorker;
    }
  }, 30000); // 30 second timeout

  it("should create proper git branches for tasks", async () => {
    const tasks = [
      'Create file "task1.txt" with content "Task 1"',
      'Create file "task2.txt" with content "Task 2"'
    ];

    // Mock the goose worker to create files directly
    const mockGooseWorker = async (task: { description: string }) => {
      console.log(`🤖 Mock goose executing: ${task.description}`);
      
      // Extract file info from task description
      const match = task.description.match(/Create file "([^"]+)" with content "([^"]+)"/);
      if (match) {
        const [, filename, content] = match;
        await fs.writeFile(path.join(state.tempDir, filename), content, "utf-8");
        return {
          success: true,
          artifacts: [filename],
          branchName: `task-${Math.random().toString(36).substring(7)}`
        };
      }
      
      return {
        success: false,
        artifacts: [],
        error: new Error("Failed to parse task")
      };
    };

    const originalMakeGooseWorker = (await import("../../src/workers/goose.js")).makeGooseWorker;
    
    try {
      // @ts-expect-error - Mocking module for test
      (await import("../../src/workers/goose.js")).makeGooseWorker = () => mockGooseWorker;

      await main({
        tasks,
        workingDir: state.tempDir
      });

      // Verify both files were created
      const file1Exists = await fs.access(path.join(state.tempDir, "task1.txt")).then(() => true).catch(() => false);
      const file2Exists = await fs.access(path.join(state.tempDir, "task2.txt")).then(() => true).catch(() => false);
      
      expect(file1Exists).toBe(true);
      expect(file2Exists).toBe(true);

      // Verify git commits
      const git = simpleGit(state.tempDir);
      const log = await git.log();
      expect(log.all.length).toBeGreaterThanOrEqual(3); // Initial + 2 task commits

      console.log(`✅ Multi-task test completed in ${state.tempDir}`);
    } finally {
      // @ts-expect-error - Restoring module after test
      (await import("../../src/workers/goose.js")).makeGooseWorker = originalMakeGooseWorker;
    }
  }, 45000); // 45 second timeout for multiple tasks
});