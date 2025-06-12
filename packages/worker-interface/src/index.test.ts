// @vibe-generated: conforms to worker-interface
import { describe, it, expect } from "vitest";
import {
  executeCommand,
  executeTask,
  runTaskAsPromise,
  TestCommandExecutor,
  runWithLiveExecutor,
  type WorkerTask,
} from "./index.js";

describe("Worker Interface - Mocked CommandExecutor", () => {
  it("should execute a simple command with predetermined output", async () => {
    const testLayer = TestCommandExecutor({
      "echo 'Hello World'": {
        output: ["Hello World"],
      },
    });

    const result = await runTaskAsPromise(
      executeCommand("echo 'Hello World'"),
      testLayer
    );

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Hello World");
    expect(result.output[0]?.timestamp).toBeTypeOf("number");
  });

  it("should execute a worker task with mocked command", async () => {
    const task: WorkerTask = {
      description: "Test task",
      command: "echo 'Task executed'",
    };

    const testLayer = TestCommandExecutor({
      "echo 'Task executed'": {
        output: ["Task executed"],
      },
    });

    const result = await runTaskAsPromise(executeTask(task), testLayer);

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Task executed");
  });

  it("should handle multiple output lines with controlled responses", async () => {
    const testLayer = TestCommandExecutor({
      "multi-line-command": {
        output: ["Line 1", "Line 2", "Line 3"],
      },
    });

    const result = await runTaskAsPromise(
      executeCommand("multi-line-command"),
      testLayer
    );

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("Line 1");
    expect(result.output[1]?.line).toBe("Line 2");
    expect(result.output[2]?.line).toBe("Line 3");
  });

  it("should simulate delayed output lines", async () => {
    const testLayer = TestCommandExecutor({
      "delayed-command": {
        output: ["First", "Second", "Third"],
        delay: 50, // 50ms delay between lines
      },
    });

    const startTime = Date.now();
    const result = await runTaskAsPromise(
      executeCommand("delayed-command"),
      testLayer
    );
    const endTime = Date.now();

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("First");
    expect(result.output[1]?.line).toBe("Second");
    expect(result.output[2]?.line).toBe("Third");

    // Should take at least 100ms for the delays (2 delays between 3 lines)
    expect(endTime - startTime).toBeGreaterThanOrEqual(100);

    // Verify timestamps are increasing with proper gaps
    const firstTimestamp = result.output[0]?.timestamp ?? 0;
    const secondTimestamp = result.output[1]?.timestamp ?? 0;
    const thirdTimestamp = result.output[2]?.timestamp ?? 0;
    expect(secondTimestamp).toBeGreaterThan(firstTimestamp);
    expect(thirdTimestamp).toBeGreaterThan(secondTimestamp);
  });

  it("should simulate command errors", async () => {
    const testLayer = TestCommandExecutor({
      "failing-command": {
        error: "Command not found",
      },
    });

    const result = await runTaskAsPromise(
      executeCommand("failing-command"),
      testLayer
    );

    expect(result.exitCode).toBe(1);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toContain("Command not found");
  });

  it("should use default mock output for unspecified commands", async () => {
    const testLayer = TestCommandExecutor({
      // No scenario defined for "unknown-command"
    });

    const result = await runTaskAsPromise(
      executeCommand("unknown-command"),
      testLayer
    );

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("default mock output");
  });
});

describe("Worker Interface - Live CommandExecutor", () => {
  it("should execute a real simple command", async () => {
    const result = await runWithLiveExecutor(executeCommand("echo 'Hello World'"));

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Hello World");
    expect(result.output[0]?.timestamp).toBeTypeOf("number");
  });

  it("should execute a real worker task", async () => {
    const task: WorkerTask = {
      description: "Test task",
      command: "echo 'Task executed'",
    };

    const result = await runWithLiveExecutor(executeTask(task));

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Task executed");
  });

  it("should handle real multiple output lines", async () => {
    const command = `printf "Line 1\\nLine 2\\nLine 3"`;
    const result = await runWithLiveExecutor(executeCommand(command));

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("Line 1");
    expect(result.output[1]?.line).toBe("Line 2");
    expect(result.output[2]?.line).toBe("Line 3");
  });

  it("should execute a real command with delays and capture timed output", async () => {
    const command = `echo "Starting task..."; sleep 0.1; echo "Processing work..."; sleep 0.1; echo "Task completed!"`;
    const result = await runWithLiveExecutor(executeCommand(command));

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("Starting task...");
    expect(result.output[1]?.line).toBe("Processing work...");
    expect(result.output[2]?.line).toBe("Task completed!");

    // Verify timestamps are increasing
    const firstTimestamp = result.output[0]?.timestamp ?? 0;
    const secondTimestamp = result.output[1]?.timestamp ?? 0;
    const thirdTimestamp = result.output[2]?.timestamp ?? 0;
    expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp);
    expect(thirdTimestamp).toBeGreaterThanOrEqual(secondTimestamp);
  });

  it("should handle real command that produces no output", async () => {
    const result = await runWithLiveExecutor(executeCommand("true")); // 'true' command succeeds with no output

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(0);
  });
});

describe("Worker Interface - Cross-validation", () => {
  it("should produce similar results for equivalent mocked vs real commands", async () => {
    const command = "echo 'Cross validation test'";
    const expectedOutput = "Cross validation test";

    // Mock version
    const testLayer = TestCommandExecutor({
      [command]: {
        output: [expectedOutput],
      },
    });
    const mockedResult = await runTaskAsPromise(executeCommand(command), testLayer);

    // Real version  
    const realResult = await runWithLiveExecutor(executeCommand(command));

    // Both should have same structure and content
    expect(mockedResult.exitCode).toBe(realResult.exitCode);
    expect(mockedResult.output).toHaveLength(realResult.output.length);
    expect(mockedResult.output[0]?.line).toBe(realResult.output[0]?.line);
    expect(mockedResult.output[0]?.line).toBe(expectedOutput);
  });
});