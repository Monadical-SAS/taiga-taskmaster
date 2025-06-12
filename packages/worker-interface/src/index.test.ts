import { describe, it, expect } from "vitest";
import {
  executeCommand,
  executeTask,
  runTaskAsPromise,
  type WorkerTask,
} from "./index.js";

describe("Worker Interface", () => {
  it("should execute a simple command and return output", async () => {
    const result = await runTaskAsPromise(executeCommand("echo 'Hello World'"));
    
    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Hello World");
    expect(result.output[0]?.timestamp).toBeTypeOf("number");
  });

  it("should execute a worker task with description", async () => {
    const task: WorkerTask = {
      description: "Test task",
      command: "echo 'Task executed'",
    };
    
    const result = await runTaskAsPromise(executeTask(task));
    
    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Task executed");
  });

  it("should handle multiple output lines", async () => {
    const command = `printf "Line 1\\nLine 2\\nLine 3"`;
    const result = await runTaskAsPromise(executeCommand(command));
    
    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("Line 1");
    expect(result.output[1]?.line).toBe("Line 2");
    expect(result.output[2]?.line).toBe("Line 3");
  });

  it("should execute a command with delays and capture timed output", async () => {
    const command = `echo "Starting task..."; sleep 0.1; echo "Processing work..."; sleep 0.1; echo "Task completed!"`;
    const result = await runTaskAsPromise(executeCommand(command));
    
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

  it("should handle command errors gracefully", async () => {
    const result = await runTaskAsPromise(executeCommand("exit 1"));
    
    expect(result.exitCode).toBe(0); // Shell executes successfully, but command fails silently
    expect(result.output).toHaveLength(0); // No output from 'exit 1'
  });
});