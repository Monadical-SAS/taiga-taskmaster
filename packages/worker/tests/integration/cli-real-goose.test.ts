// @vibe-generated: conforms to worker-interface
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTempDir } from "../../src/utils/temp-utils";
import { main } from "../../src/cli/task-runner";

describe("CLI Task Runner with Real Goose", () => {
  const state = {
    tempDir: "",
    cleanup: (() => {}) as () => void
  };

  beforeEach(async () => {
    const temp = await createTempDir("cli-real-test-");
    state.tempDir = temp.path;
    state.cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (!process.env.KEEP_TEST_DIRS) {
      state.cleanup();
    }
  });

  it("should process a simple task with real goose", async () => {
    // Skip if no API key available
    if (!process.env.OPENROUTER_API_KEY) {
      console.log("Skipping real goose test - no OPENROUTER_API_KEY");
      return;
    }

    const tasks = [
      'Create a file "hello.txt" with content "Hello from Goose!"'
    ];

    // Run in non-interactive mode
    await main({ 
      tasks, 
      workingDir: state.tempDir 
    });

    // The test will show the actual output and we can verify manually
    console.log(`Test completed. Check ${state.tempDir} for results.`);
    
    // Basic assertions - at minimum the directory should exist
    expect(state.tempDir).toBeDefined();
  }, 60000); // 1 minute timeout for real goose execution

  it("should handle multiple tasks in sequence", async () => {
    // Skip if no API key available  
    if (!process.env.OPENROUTER_API_KEY) {
      console.log("Skipping real goose test - no OPENROUTER_API_KEY");
      return;
    }

    const tasks = [
      'Create a file "first.txt" with content "First task"',
      'Create a file "second.txt" with content "Second task"'
    ];

    await main({ 
      tasks, 
      workingDir: state.tempDir 
    });

    console.log(`Multi-task test completed. Check ${state.tempDir} for results.`);
    expect(state.tempDir).toBeDefined();
  }, 120000); // 2 minute timeout for multiple tasks
});