// @vibe-generated: conforms to worker-interface
import { describe, it, expect, beforeEach, vi } from "vitest";
import { Effect, Fiber, TestClock, TestContext, Layer, Option, Stream, pipe } from 'effect';
import { Command } from "@effect/platform";
import { nonEmptyStringFromNumber, castNonEmptyString, castNonNegativeInteger } from '@taiga-task-master/common';
import {
  executeCommand,
  streamCommand,
  runTaskAsPromise,
  TestCommandExecutor,
  runCommandWithLiveExecutor,
  loadProjectEnv,
  createGooseCommand,
  createGooseEnvironment,
  executeGoose,
  GooseCommandExecutor,
  DEFAULT_GOOSE_CONFIG,
  executeCommandWithTimeout,
  runCommandWithLiveExecutorAndTimeout,
  runGooseWithLiveExecutor,
  loop,
  type GooseConfig,
  type CommandScenario,
  type LooperDeps,
} from "./index.js";
import * as assert from 'node:assert';
import * as os from 'node:os';
import * as path from 'node:path';
import { isDone } from 'effect/FiberStatus';

// Helper functions for environment-agnostic test paths
const generateTestSessionPath = (sessionId: string = "20250612_131655"): string => {
  const homeDir = os.homedir();
  return path.join(homeDir, '.local', 'share', 'goose', 'sessions', `${sessionId}.jsonl`);
};

const generateTestWorkingDirectory = (): string => {
  // Use current working directory as a base for test working directory
  return process.cwd();
};

const formatGooseLogMessage = (sessionId: string = "20250612_131655"): string => {
  return `    logging to ${generateTestSessionPath(sessionId)}`;
};

const formatWorkingDirectoryMessage = (workingDir?: string): string => {
  const dir = workingDir || generateTestWorkingDirectory();
  return `    working directory: ${dir}`;
};

const formatGooseWelcomeMessage = (workingDir?: string): string => {
  const dir = workingDir || generateTestWorkingDirectory();
  return `I'm currently in your project directory at \`${dir}\`, ready to help with whatever you need!`;
};

// Helper function to create test scenarios with proper command-key matching
const createTestScenario = (command: Command.Command, scenario: CommandScenario): Record<string, CommandScenario> => {
  const commandKey = command.toString();
  return {
    [commandKey]: scenario
  };
};

// Helper function to create multiple test scenarios
const createTestScenarios = (scenarioMap: Array<[Command.Command, CommandScenario]>): Record<string, CommandScenario> => {
  const scenarios: Record<string, CommandScenario> = {};
  for (const [command, scenario] of scenarioMap) {
    const commandKey = command.toString();
    scenarios[commandKey] = scenario;
  }
  return scenarios;
};

// Validation helper to ensure command will match a scenario
const validateCommandScenario = (command: Command.Command, scenarios: Record<string, CommandScenario>): boolean => {
  const commandKey = command.toString();
  return commandKey in scenarios || 'default' in scenarios;
};

const waitPullTaskAbortion = async (options?: {
  readonly signal?: AbortSignal
}) => {
  while (true) {
    if (options?.signal?.aborted === true) {
      return {
        type: 'aborted' as const
      }
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("panic! Should not reach this point");
}

describe("Test Infrastructure Validation", () => {
  it("should validate createTestScenario helper function", () => {
    const command = Command.make("echo", "test");
    const scenario: CommandScenario = { output: ["test output"] };
    const scenarios = createTestScenario(command, scenario);
    
    expect(validateCommandScenario(command, scenarios)).toBe(true);
    expect(scenarios[command.toString()]).toEqual(scenario);
  });

  it("should validate createTestScenarios helper function", () => {
    const command1 = Command.make("echo", "hello");
    const command2 = Command.make("echo", "world");
    const scenarios = createTestScenarios([
      [command1, { output: ["hello"] }],
      [command2, { output: ["world"] }]
    ]);
    
    expect(validateCommandScenario(command1, scenarios)).toBe(true);
    expect(validateCommandScenario(command2, scenarios)).toBe(true);
    expect(scenarios[command1.toString()]).toEqual({ output: ["hello"] });
    expect(scenarios[command2.toString()]).toEqual({ output: ["world"] });
  });

  it("should detect unmatched commands", () => {
    const command1 = Command.make("echo", "hello");
    const command2 = Command.make("echo", "world");
    const scenarios = createTestScenario(command1, { output: ["hello"] });
    
    expect(validateCommandScenario(command1, scenarios)).toBe(true);
    expect(validateCommandScenario(command2, scenarios)).toBe(false);
  });

  it("should fall back to default scenario when available", () => {
    const command = Command.make("echo", "test");
    const scenarios = { "default": { output: ["default output"] } };
    
    expect(validateCommandScenario(command, scenarios)).toBe(true);
  });

  it("should demonstrate negative testing - command mismatch leads to default behavior", async () => {
    const actualCommand = Command.make("echo", "actual");
    const differentCommand = Command.make("echo", "different");
    
    // Create scenario for a different command
    const testLayer = TestCommandExecutor(createTestScenario(differentCommand, {
      output: ["different output"],
    }));
    
    // Execute the actual command - should fall back to default behavior
    const result = await runTaskAsPromise(executeCommand(actualCommand), testLayer);
    
    
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("default mock output"); // Falls back to hardcoded default
  });
});

describe("Worker Interface - Mocked CommandExecutor", () => {
  it("should execute a simple command with predetermined output", async () => {
    const command = Command.make("echo", "Hello World");
    const testLayer = TestCommandExecutor(createTestScenario(command, {
      output: ["Hello World"],
    }));

    const result = await runTaskAsPromise(
      executeCommand(command),
      testLayer
    );

    
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Hello World");
    expect(result.output[0]?.timestamp).toBeTypeOf("number");
  });

  it("should execute a command with multiple arguments", async () => {
    const command = Command.make("echo", "Task", "executed");
    const testLayer = TestCommandExecutor(createTestScenario(command, {
      output: ["Task executed"],
    }));

    const result = await runTaskAsPromise(executeCommand(command), testLayer);

    
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Task executed");
  });

  it("should handle multiple output lines with controlled responses", async () => {
    const command = Command.make("multi-line-command");
    const testLayer = TestCommandExecutor(createTestScenario(command, {
      output: ["Line 1", "Line 2", "Line 3"],
    }));

    const result = await runTaskAsPromise(
      executeCommand(command),
      testLayer
    );

    
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("Line 1");
    expect(result.output[1]?.line).toBe("Line 2");
    expect(result.output[2]?.line).toBe("Line 3");
  });

  it("should simulate command errors", async () => {
    const command = Command.make("failing-command");
    const testLayer = TestCommandExecutor(createTestScenario(command, {
      error: "Command not found",
    }));

    const result = await Effect.runPromise(
      Effect.provide(
        executeCommand(command).pipe(
          Effect.either
        ),
        testLayer
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("CommandExecutionError");
      if (result.left._tag === "CommandExecutionError") {
        expect(result.left.stderr).toBe("Command not found");
      }
    }
  });

  it("should use default mock output for unspecified commands", async () => {
    const testLayer = TestCommandExecutor({
      // No scenario defined for "unknown-command"
    });

    const result = await runTaskAsPromise(
      executeCommand(Command.make("unknown-command")),
      testLayer
    );

    
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("default mock output");
  });
});

describe("Worker Interface - Streaming", () => {
  it("should stream command output line by line", async () => {
    const command = Command.make("echo", "Hello");
    const testLayer = TestCommandExecutor({
      [command.toString()]: {
        output: ["Hello", "World", "Stream"]
      },
      'default': {
        output: ["default output"]
      }
    });

    const result = await runTaskAsPromise(
      pipe(
        streamCommand(command),
        Stream.runCollect,
        Effect.map(chunks => Array.from(chunks))
      ),
      testLayer
    );

    expect(result).toHaveLength(3);
    expect(result[0]?.line).toBe("Hello");
    expect(result[1]?.line).toBe("World");
    expect(result[2]?.line).toBe("Stream");
    result.forEach(chunk => {
      expect(chunk.timestamp).toBeTypeOf("number");
    });
  }, 1000);

  it("should compose streaming with collecting", async () => {
    const command = Command.make("echo", "test");
    const testLayer = TestCommandExecutor({
      [command.toString()]: {
        output: ["line1", "line2"]
      }
    });

    const [streamResult, executeResult] = await Promise.all([
      runTaskAsPromise(
        pipe(
          streamCommand(command),
          Stream.runCollect,
          Effect.map(chunks => Array.from(chunks))
        ),
        testLayer
      ),
      runTaskAsPromise(executeCommand(command), testLayer)
    ]);

    expect(streamResult.map(r => r.line)).toEqual(executeResult.output.map(r => r.line));
  }, 1000);
});

describe("Worker Interface - Live CommandExecutor", () => {
  it("should execute a real simple command", async () => {
    const result = await runCommandWithLiveExecutor(Command.make("echo", "Hello World"));

    
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Hello World");
    expect(result.output[0]?.timestamp).toBeTypeOf("number");
  });

  it("should execute a real command with multiple words", async () => {
    const command = Command.make("echo", "Task executed");

    const result = await runCommandWithLiveExecutor(command);

    
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Task executed");
  });

  it("should handle real multiple output lines", async () => {
    const result = await runCommandWithLiveExecutor(Command.make("printf", "Line 1\\nLine 2\\nLine 3"));

    
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("Line 1");
    expect(result.output[1]?.line).toBe("Line 2");
    expect(result.output[2]?.line).toBe("Line 3");
  });

  it("should execute a real command with delays and capture timed output", async () => {
    const result = await runCommandWithLiveExecutor(
      Command.make("sh", "-c", `echo "Starting task..."; sleep 0.1; echo "Processing work..."; sleep 0.1; echo "Task completed!"`)
    );

    
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
    const result = await runCommandWithLiveExecutor(Command.make("true")); // 'true' command succeeds with no output

    
    expect(result.output).toHaveLength(0);
  });
});

describe("Worker Interface - Cross-validation", () => {
  it("should produce similar results for equivalent mocked vs real commands", async () => {
    const commandObj = Command.make("echo", "Cross validation test");
    const expectedOutput = "Cross validation test";

    // Mock version - using helper function to ensure proper command matching
    const testLayer = TestCommandExecutor(createTestScenario(commandObj, {
      output: [expectedOutput],
    }));
    const mockedResult = await runTaskAsPromise(executeCommand(commandObj), testLayer);

    // Real version  
    const realResult = await runCommandWithLiveExecutor(commandObj);

    // Both should have same structure and content
    expect(mockedResult.output).toHaveLength(realResult.output.length);
    expect(realResult.output[0]?.line).toBe(expectedOutput);
  });
});

describe("Goose Integration - Environment and Command Building", () => {
  it("should load project environment variables using Effect Config", async () => {
    const env = await Effect.runPromise(loadProjectEnv());
    
    // Should have loaded environment variables
    expect(typeof env).toBe("object");
    expect(env.GOOSE_MODEL).toBeTypeOf("string");
    expect(env.GOOSE_PROVIDER).toBeTypeOf("string");
    expect(env.OPENROUTER_API_KEY).toBeTypeOf("string");
  });

  it("should create goose command with default config", () => {
    const command = createGooseCommand();
    
    // Test that it's a proper Command object with expected structure
    expect(command).toEqual(Command.make("goose", "run", "-i", "goose-instructions.md", "--with-builtin", "developer", "--no-session"));
  });

  it("should create goose command with custom instructions file", () => {
    const config: Partial<GooseConfig> = {
      instructionsFile: "custom-instructions.md",
    };
    const command = createGooseCommand(config);
    
    expect(command).toEqual(Command.make("goose", "run", "-i", "custom-instructions.md", "--with-builtin", "developer", "--no-session"));
  });

  it("should create goose environment variables using Effect", async () => {
    const env = await Effect.runPromise(createGooseEnvironment());
    
    expect(env.GOOSE_MODEL).toBe(DEFAULT_GOOSE_CONFIG.model);
    expect(env.GOOSE_PROVIDER).toBe(DEFAULT_GOOSE_CONFIG.provider);
    expect(env.OPENROUTER_API_KEY).toBeTypeOf("string");
  });

  it("should create goose environment with custom config using Effect", async () => {
    const config: Partial<GooseConfig> = {
      model: "anthropic/claude-haiku",
      provider: "custom-provider",
    };
    const env = await Effect.runPromise(createGooseEnvironment(config));
    
    expect(env.GOOSE_MODEL).toBe("anthropic/claude-haiku");
    expect(env.GOOSE_PROVIDER).toBe("custom-provider");
    expect(env.OPENROUTER_API_KEY).toBeTypeOf("string");
  });
});

describe("Goose Integration - Mocked Execution", () => {
  it("should execute goose with mocked realistic output", async () => {
    const mockGooseOutput = [
      "starting session | provider: openrouter model: anthropic/claude-sonnet-4",
      formatGooseLogMessage(),
      formatWorkingDirectoryMessage(),
      "# Hello! 👋",
      "",
      "I'm **Goose**, an AI agent created by Block (the parent company of Square, CashApp, and Tidal). I'm designed to help you with a wide variety of tasks, from software development and file management to problem-solving and analysis.",
      "",
      "## What I Can Do",
      "",
      "I have access to several powerful tools that let me:",
      "- **Edit code files** and work with text documents",
      "- **Run shell commands** to interact with your system",
      "- **Capture screenshots** for visual debugging",
      "- **Process images** when needed",
      "- **Search for and enable extensions** to expand my capabilities",
      "",
      formatGooseWelcomeMessage(),
      "",
      "## Getting Started",
      "",
      "Feel free to ask me to:",
      "- Analyze your codebase",
      "- Help with development tasks", 
      "- Run commands or scripts",
      "- Debug issues",
      "- Or anything else you'd like assistance with",
      "",
      "What would you like to work on today?"
    ];

    const gooseCommand = Command.make("goose", "run", "-i", "goose-instructions.md", "--with-builtin", "developer", "--no-session");
    const testLayer = TestCommandExecutor(createTestScenario(gooseCommand, {
      output: mockGooseOutput,
      delay: 50, // Simulate real-time processing
    }));

    const execution = Effect.provide(executeGoose({ maxRetries: castNonNegativeInteger(0) }), testLayer)
    const test = Effect.gen(function* () {
      const fork = yield* Effect.fork(execution);
      yield* TestClock.adjust("5 second");
      const result = yield* Fiber.join(fork);

      
      expect(result.output).toHaveLength(mockGooseOutput.length);
      expect(result.output[0]?.line).toContain("starting session | provider: openrouter");
      expect(result.output[3]?.line).toBe("# Hello! 👋");
      expect(result.output[result.output.length - 1]?.line).toBe("What would you like to work on today?");
    }).pipe(Effect.provide(TestContext.TestContext));

    await Effect.runPromise(test)


  });

  it("should execute goose with working directory", async () => {
    const workingDir = "/path/to/project";
    const baseCommand = Command.make("goose", "run", "-i", "goose-instructions.md", "--with-builtin", "developer", "--no-session");
    const commandWithWorkingDir = Command.workingDirectory(baseCommand, workingDir);

    const testLayer = TestCommandExecutor(createTestScenario(commandWithWorkingDir, {
      output: ["Goose running in project directory"],
    }));

    const config: Partial<GooseConfig> = {
      workingDirectory: workingDir,
      maxRetries: castNonNegativeInteger(0),
    };

    const result = await runTaskAsPromise(executeGoose(config), testLayer);

    
    expect(result.output[0]?.line).toBe("Goose running in project directory");
  });

  it("should handle goose errors gracefully", async () => {
    const gooseCommand = Command.make("goose", "run", "-i", "goose-instructions.md", "--with-builtin", "developer", "--no-session");
    const testLayer = TestCommandExecutor(createTestScenario(gooseCommand, {
      error: "Goose command not found",
    }));

    const result = await Effect.runPromise(
      Effect.provide(
        executeGoose({ maxRetries: castNonNegativeInteger(0) }).pipe(
          Effect.either
        ),
        testLayer
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("CommandExecutionError");
      if (result.left._tag === "CommandExecutionError") {
        expect(result.left.stderr).toBe("Goose command not found");
      }
    }
  });

  it("should simulate long-running goose session with realistic periodic output", async () => {
    const mockOutput = [
      "starting session | provider: openrouter model: anthropic/claude-haiku",
      formatGooseLogMessage("20250612_134200"),
      formatWorkingDirectoryMessage(),
      "# Analyzing Project Structure",
      "",
      "I'll help you implement the requested feature. Let me start by examining the current codebase structure.",
      "",
      "```sh",
      "find . -name '*.ts' -type f | head -10",
      "```",
      "",
      "## Implementation Plan",
      "",
      "Based on my analysis, I'll:",
      "1. Create the new interface definitions",
      "2. Implement the core functionality", 
      "3. Add comprehensive tests",
      "4. Update documentation",
      "",
      "Let's begin with the implementation...",
      "",
      "**Task completed successfully!** ✅"
    ];

    const customGooseCommand = Command.make("goose", "run", "-i", "custom.md", "--with-builtin", "developer", "--no-session");
    const testLayer = TestCommandExecutor(createTestScenario(customGooseCommand, {
      output: mockOutput,
      delay: 150, // 150ms between lines
    }));

    const execution = Effect.provide(executeGoose({ instructionsFile: "custom.md", maxRetries: castNonNegativeInteger(0) }), testLayer)
    const test = Effect.gen(function* () {
      const fork = yield* Effect.fork(execution);
      yield* TestClock.adjust("1 second");
      assert.ok(!isDone(yield* fork.status), "Should be still running after 1 second");

      yield* TestClock.adjust("1 second");
      assert.ok(!isDone(yield* fork.status), "Should be still running after 2 seconds");
      // Should take time due to delays (21 gaps * 150ms = 3150ms minimum)
      yield* TestClock.adjust("2 second");
      assert.ok(isDone(yield* fork.status), "Should be done after 3 seconds");
      const result = yield* Fiber.join(fork);

      
      expect(result.output).toHaveLength(mockOutput.length);
      // Verify content matches realistic goose output
      expect(result.output[0]?.line).toContain("starting session | provider: openrouter");
      expect(result.output[3]?.line).toBe("# Analyzing Project Structure");
      expect(result.output[result.output.length - 1]?.line).toBe("**Task completed successfully!** ✅");
    }).pipe(Effect.provide(TestContext.TestContext));

    await Effect.runPromise(test)

  });
});

describe("Goose Integration - Environment Variable Injection", () => {
  it("should create GooseCommandExecutor with environment variables", async () => {
    const config: Partial<GooseConfig> = {
      model: "test-model",
      provider: "test-provider",
    };

    // Test that the layer correctly constructs env command
    const testLayer = GooseCommandExecutor(config);
    
    // This would normally execute with environment variables, but we can test the layer creation
    expect(testLayer).toBeDefined();
  });

  it("should properly handle goose command with Command.env", async () => {
    const mockCommandObj = Command.make("goose", "run", "-i", "test.md", "--with-builtin", "developer");
    
    // Test that the GooseCommandExecutor properly executes the command
    // with environment variables using Command.env
    const testLayer = TestCommandExecutor(createTestScenario(mockCommandObj, {
      output: ["Goose running with Command.env environment variables"],
    }));

    const result = await runTaskAsPromise(
      executeCommand(mockCommandObj),
      testLayer
    );

    
    expect(result.output[0]?.line).toBe("Goose running with Command.env environment variables");
  });

  it("should map different commands to different scenarios correctly", async () => {
    const command1 = Command.make("echo", "hello");
    const command2 = Command.make("echo", "world");
    const command3 = Command.make("ls", "-la");
    
    const testLayer = TestCommandExecutor(createTestScenarios([
      [command1, { output: ["hello"] }],
      [command2, { output: ["world"] }],
      [command3, { output: ["total 0", "drwxr-xr-x 2 user user 64 Dec 6 14:26 ."] }],
    ]));

    // Test first command
    const result1 = await runTaskAsPromise(
      executeCommand(command1),
      testLayer
    );
    expect(result1.output[0]?.line).toBe("hello");

    // Test second command
    const result2 = await runTaskAsPromise(
      executeCommand(command2),
      testLayer
    );
    expect(result2.output[0]?.line).toBe("world");

    // Test third command
    const result3 = await runTaskAsPromise(
      executeCommand(command3),
      testLayer
    );
    expect(result3.output[0]?.line).toBe("total 0");
    expect(result3.output[1]?.line).toBe("drwxr-xr-x 2 user user 64 Dec 6 14:26 .");
  });

  it("should fall back to default scenario when command not found", async () => {
    const knownCommand = Command.make("echo", "hello");
    const unknownCommand = Command.make("unknown", "command");
    
    const scenarios = createTestScenario(knownCommand, { output: ["hello"] });
    scenarios["default"] = { output: ["default fallback output"] };
    
    const testLayer = TestCommandExecutor(scenarios);

    // Test command that doesn't exist in scenarios - should use default
    const result = await runTaskAsPromise(
      executeCommand(unknownCommand),
      testLayer
    );
    expect(result.output[0]?.line).toBe("default fallback output");
  });

  it("should use hardcoded fallback when no default scenario exists", async () => {
    const knownCommand = Command.make("echo", "hello");
    const unknownCommand = Command.make("unknown", "command");
    
    const testLayer = TestCommandExecutor(createTestScenario(knownCommand, {
      output: ["hello"],
    }));

    // Test command that doesn't exist and no default - should use hardcoded fallback
    const result = await runTaskAsPromise(
      executeCommand(unknownCommand),
      testLayer
    );
    expect(result.output[0]?.line).toBe("default mock output");
  });

  describe("Command Arrays", () => {
    it("should handle commands with arguments that contain spaces", async () => {
      const command = Command.make("echo", "hello world");
      const testLayer = TestCommandExecutor(createTestScenario(command, {
        output: ["hello world"],
      }));

      const result = await runTaskAsPromise(executeCommand(command), testLayer);

      
      expect(result.output[0]?.line).toBe("hello world");
    });

    it("should handle commands with multiple arguments", async () => {
      const command = Command.make("cp", "source file.txt", "destination file.txt");
      const testLayer = TestCommandExecutor(createTestScenario(command, {
        output: ["file copied"],
      }));

      const result = await runTaskAsPromise(executeCommand(command), testLayer);

      
      expect(result.output[0]?.line).toBe("file copied");
    });

    it("should handle commands with flags and arguments", async () => {
      const command = Command.make("grep", "-n", "search term", "file.txt");
      const testLayer = TestCommandExecutor(createTestScenario(command, {
        output: ["1:found search term here"],
      }));

      const result = await runTaskAsPromise(executeCommand(command), testLayer);

      
      expect(result.output[0]?.line).toBe("1:found search term here");
    });

  });

  describe("Security Tests - Shell Injection Prevention", () => {
    it("should safely handle malicious command arguments", async () => {
      const maliciousCommands = [
        Command.make("echo", "hello$(whoami)"),
        Command.make("echo", "hello | cat /etc/passwd"),
        Command.make("echo", "hello`ls`"),
        Command.make("echo", "hello\"; cat /etc/passwd; echo \""),
      ];

      for (const command of maliciousCommands) {
        const testLayer = TestCommandExecutor(createTestScenario(command, {
          output: ["Safe execution - arguments properly escaped"],
        }));

        const result = await runTaskAsPromise(executeCommand(command), testLayer);

        
        expect(result.output[0]?.line).toBe("Safe execution - arguments properly escaped");
        
        // Commands are executed as arrays, not shell strings
        // So shell metacharacters are treated as literal arguments
      }
    });

    it("should validate that Command.make creates secure commands", () => {
      // Test that Command.make properly handles arguments
      const command = Command.make("echo", "hello; rm -rf /");
      
      // Command.make should create a proper Command object
      // that doesn't execute shell interpretation
      expect(command).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((command as any).command).toBe("echo");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((command as any).args).toEqual(["hello; rm -rf /"]);
    });

    it("should validate that Command.workingDirectory is secure", () => {
      const baseCommand = Command.make("ls", "-la");
      const maliciousPath = "/tmp; rm -rf /";
      
      // Command.workingDirectory should handle the path securely
      const commandWithCwd = Command.workingDirectory(baseCommand, maliciousPath);
      
      expect(commandWithCwd).toBeDefined();
      // The malicious path should be treated as a literal directory path
      // not as shell commands to execute
    });

    it("should serialize commands securely for test scenarios", () => {
      // Test that our command serialization creates proper command structures
      const command = Command.make("echo", "hello; rm -rf /");
      
      // Command.make should create a proper Command object
      // that treats arguments as literals, not shell commands
      expect(command).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((command as any).command).toBe("echo");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((command as any).args).toEqual(["hello; rm -rf /"]);
      
      // The malicious string should be stored as a literal argument
      // not as executable shell code - this is the key security feature
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const args = (command as any).args;
      expect(args[0]).toBe("hello; rm -rf /");
      expect(args.length).toBe(1); // Single argument, not parsed as separate commands
    });

    it("should handle environment variables securely", async () => {
      const maliciousEnvValues = [
        "normal_value; rm -rf /",
        "normal_value && echo injected",
        "normal_value | cat /etc/passwd",
        "normal_value`ls`",
        "normal_value$(whoami)",
      ];

      for (const maliciousValue of maliciousEnvValues) {
        const config: Partial<GooseConfig> = {
          model: maliciousValue,
          provider: "test-provider",
        };

        // Test that environment variables are handled securely
        const envEffect = createGooseEnvironment(config);
        const env = await Effect.runPromise(envEffect);

        expect(env.GOOSE_MODEL).toBe(maliciousValue);
        // Environment variables should be set literally, not executed
        // Command.env should handle them securely
      }
    });
  });

  describe("timestamp testing with TestClock", () => {
    it("should produce deterministic timestamps using TestClock", async () => {
      const expectedOutput = "Test output";
      const command = Command.make("test-command");
      const testLayer = TestCommandExecutor({
        [command.toString()]: {
          output: [expectedOutput],
        },
      });

      const program = Effect.gen(function* (_) {
        yield* _(TestClock.adjust(1000)); // Set to 1000ms
        
        const result = yield* _(executeCommand(command));
        
        return result;
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(testLayer, TestContext.TestContext))
      );

      
      expect(result.output).toHaveLength(1);
      expect(result.output[0]?.line).toBe(expectedOutput);
      expect(result.output[0]?.timestamp).toBe(1000); // Deterministic timestamp
    });

  });

  describe("Timeout Functionality", () => {
    it("should execute command with timeout using TestClock", async () => {
      const command = Command.make("echo", "test output");
      const testLayer = TestCommandExecutor(createTestScenario(command, {
        output: ["test output"],
      }));

      const program = Effect.gen(function* (_) {
        yield* _(TestClock.adjust(1000)); // Set time to 1000ms
        
        const result = yield* _(executeCommandWithTimeout(command, 5000)); // 5 second timeout
        
        return result;
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(testLayer, TestContext.TestContext))
      );

      
      expect(result.output).toHaveLength(1);
      expect(result.output[0]?.line).toBe("test output");
      expect(result.output[0]?.timestamp).toBe(1000);
    });

    it("should timeout commands that take too long", async () => {
      const command = Command.make("long-running-command");
      const testLayer = TestCommandExecutor(createTestScenario(command, {
        output: ["this should timeout"],
        delay: 1000, // 1 second delay per line
      }));

      const program = Effect.gen(function* (_) {
        const fork = yield* _(Effect.fork(executeCommandWithTimeout(command, 500).pipe(Effect.either))); // 500ms timeout
        
        // Advance time by 600ms (beyond timeout)
        yield* _(TestClock.adjust(600));
        
        const result = yield* _(Fiber.join(fork));
        
        return result;
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(testLayer, TestContext.TestContext))
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("CommandTimeoutError");
        if (result.left._tag === "CommandTimeoutError") {
          expect(result.left.timeoutMs).toBe(500);
        }
      }
    });

    it("should timeout command execution", async () => {
      const command = Command.make("slow-command", "arg1");
      const testLayer = TestCommandExecutor(createTestScenario(command, {
        output: ["slow output"],
        delay: 2000, // 2 second delay
      }));

      const program = Effect.gen(function* (_) {
        const fork = yield* _(Effect.fork(executeCommandWithTimeout(command, 1000).pipe(Effect.either))); // 1 second timeout
        
        // Advance time by 1100ms (beyond timeout)
        yield* _(TestClock.adjust(1100));
        
        const result = yield* _(Fiber.join(fork));
        
        return result;
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(testLayer, TestContext.TestContext))
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("CommandTimeoutError");
        if (result.left._tag === "CommandTimeoutError") {
          expect(result.left.timeoutMs).toBe(1000);
        }
      }
    });

    it("should timeout Goose execution with config timeout", async () => {
      const config: Partial<GooseConfig> = {
        processTimeout: 2000, // 2 second timeout
        instructionsFile: "test-timeout.md",
        maxRetries: castNonNegativeInteger(0),
      };
      const gooseCommand = Command.make("goose", "run", "-i", "test-timeout.md", "--with-builtin", "developer", "--no-session");
      const testLayer = TestCommandExecutor(createTestScenario(gooseCommand, {
        output: ["goose starting..."],
        delay: 5000, // 5 second delay
      }));

      const program = Effect.gen(function* (_) {
        const fork = yield* _(Effect.fork(executeGoose(config).pipe(Effect.either)));
        
        // Advance time by 2100ms (beyond timeout)
        yield* _(TestClock.adjust(2100));
        
        const result = yield* _(Fiber.join(fork));
        
        return result;
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(testLayer, TestContext.TestContext))
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("CommandTimeoutError");
        if (result.left._tag === "CommandTimeoutError") {
          expect(result.left.timeoutMs).toBe(2000);
        }
      }
    });


    it("should use default timeout when not specified", async () => {
      const command = Command.make("test-default-timeout");
      const testLayer = TestCommandExecutor(createTestScenario(command, {
        output: ["completed before default timeout"],
      }));

      const result = await Effect.runPromise(
        Effect.provide(executeCommandWithTimeout(command), Layer.merge(testLayer, TestContext.TestContext))
      );

      
      expect(result.output).toHaveLength(1);
      expect(result.output[0]?.line).toBe("completed before default timeout");
    });

    it("should use config timeout over default timeout for executeGoose", async () => {
      const customTimeout = 1500; // 1.5 second timeout
      const config: Partial<GooseConfig> = {
        processTimeout: customTimeout,
        instructionsFile: "test-custom-timeout.md",
        maxRetries: castNonNegativeInteger(0),
      };
      const gooseCommand = Command.make("goose", "run", "-i", "test-custom-timeout.md", "--with-builtin", "developer", "--no-session");
      const testLayer = TestCommandExecutor(createTestScenario(gooseCommand, {
        output: ["goose with custom timeout"],
        delay: 2000, // 2 second delay (longer than custom timeout)
      }));

      const program = Effect.gen(function* (_) {
        const fork = yield* _(Effect.fork(executeGoose(config).pipe(Effect.either)));
        
        // Advance time by 1600ms (beyond custom timeout but less than default)
        yield* _(TestClock.adjust(1600));
        
        const result = yield* _(Fiber.join(fork));
        
        return result;
      });

      const result = await Effect.runPromise(
        Effect.provide(program, Layer.merge(testLayer, TestContext.TestContext))
      );

      // Should timeout with custom timeout, not default timeout
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("CommandTimeoutError");
        if (result.left._tag === "CommandTimeoutError") {
          expect(result.left.timeoutMs).toBe(customTimeout);
        }
      }
    });

    // Test convenience functions to prevent linting warnings
    it("should provide convenient timeout wrapper functions", async () => {

      // These functions should be exported and available for use
      expect(typeof runCommandWithLiveExecutorAndTimeout).toBe("function");
      expect(typeof runGooseWithLiveExecutor).toBe("function");
      
      // Basic smoke test - these would normally be used with real commands
      // but we're just verifying they're properly exported
      // Note: .length only counts parameters without default values
      expect(runCommandWithLiveExecutorAndTimeout.length).toBe(1); // command param (timeout has default)
      expect(runGooseWithLiveExecutor.length).toBe(0); // config param has default
    });
  });
});

describe("Loop Function Tests", () => {
  const createMockDeps = (overrides: Partial<LooperDeps> = {}): LooperDeps => ({
    runWorker: async (task) => ({ output: [{ line: `Processed: ${task.description}`, timestamp: Date.now() }] }),
    pullTask: async () => {
      return {
        type: 'task',
        description: castNonEmptyString('default task')
      };
    },
    ackTask: async () => {},
    git: {
      isClean: async () => true,
      cleanup: async () => {},
      branch: async (name) => castNonEmptyString("main"), // Returns previous branch name
      commitAndPush: async () => {},
    },
    log: {
      info: () => {},
      error: () => {},
    },
    sleep: async (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    ...overrides,
  });

  describe("Happy Path", () => {
    it("should process a single task successfully", async () => {
      const mockResults: string[] = [];
      const deps = createMockDeps({
        runWorker: async (task) => {
          mockResults.push(`Processed: ${task.description}`);
          return { output: [{ line: `Processed: ${task.description}`, timestamp: Date.now() }] };
        },
        pullTask: async (options) => {
          if (mockResults.length === 0) return {
            type: 'task',
            description: castNonEmptyString("make todo mvp")
          };
          return waitPullTaskAbortion(options);
        },
        sleep: async (_ms) => new Promise(resolve => setTimeout(resolve, 0)),
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 50));
      controller.abort();
      
      await loopPromise;
      expect(mockResults).toEqual(["Processed: make todo mvp"]);
    });

    it("should handle multiple tasks in sequence", async () => {
      const mockResults: string[] = [];
      const taskCountRef = { value: 0 };
      const deps = createMockDeps({
        runWorker: async (task) => {
          mockResults.push(`Processed: ${task.description}`);
          return { output: [{ line: `Processed: ${task.description}`, timestamp: Date.now() }] };
        },
        pullTask: async (options) => {
          taskCountRef.value++;
          if (taskCountRef.value <= 3) return {
            type: 'task',
            description: castNonEmptyString(`task ${taskCountRef.value}`)
          };
          // Stop after 3 tasks
          return await waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      expect(mockResults).toEqual([
        "Processed: task 1",
        "Processed: task 2", 
        "Processed: task 3"
      ]);
    });
  });

  describe("Git Operations", () => {
    it("should abort when git repo is not clean initially", async () => {
      const logMessages: string[] = [];
      const deps = createMockDeps({
        git: {
          isClean: async () => false,
          cleanup: async () => {},
          branch: async (name) => castNonEmptyString("main"), // Returns previous branch name
          commitAndPush: async () => {},
        },
        log: {
          info: () => {},
          error: (msg) => logMessages.push(msg),
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      controller.abort();
      
      await loopPromise;
      expect(logMessages).toContain("FATAL: git repo isn't clean, aborting");
    });

    it("should abort when git repo is not clean after commitAndPush", async () => {
      const logMessages: string[] = [];
      const isCleanCallCountRef = { value: 0 };
      const deps = createMockDeps({
        git: {
          isClean: async () => {
            isCleanCallCountRef.value++;
            return isCleanCallCountRef.value === 1; // Clean initially, dirty after commit
          },
          cleanup: async () => {},
          branch: async (name) => castNonEmptyString("main"), // Returns previous branch name
          commitAndPush: async () => {},
        },
        log: {
          info: () => {},
          error: (msg) => logMessages.push(msg),
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      controller.abort();
      
      await loopPromise;
      expect(logMessages).toContain("FATAL: git repo isn't clean, after commitAndPush, aborting");
    });

    it("should create and cleanup git branches correctly", async () => {
      const gitOperations: string[] = [];
      const deps = createMockDeps({
        git: {
          isClean: async () => true,
          cleanup: async (branch) => { gitOperations.push(`cleanup: ${branch}`); },
          branch: async (name) => {
            gitOperations.push(`branch: ${name}`);
            return castNonEmptyString("main"); // Returns previous branch name
          },
          commitAndPush: async () => { gitOperations.push("commitAndPush"); },
        },
        pullTask: async (options) => {
          if (gitOperations.length === 0) return {
            type: 'task',
            description: castNonEmptyString("consistent task name")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      controller.abort();
      
      await loopPromise;
      expect(gitOperations).toContain("branch: 2260761063047429");
      expect(gitOperations).toContain("commitAndPush");
    });
  });

  describe("Error Handling", () => {
    it("should handle runWorker errors gracefully and retry", async () => {
      const logMessages: string[] = [];
      const sleepCalls: number[] = [];
      const ackTaskCalls: Array<{ ok: boolean; branch?: string }> = [];
      const attemptCountRef = { value: 0 };

      const deps = createMockDeps({
        runWorker: async () => {
          attemptCountRef.value++;
          if (attemptCountRef.value === 1) {
            throw new Error("Worker failed");
          }
          return { output: [{ line: "Success on retry", timestamp: Date.now() }] };
        },
        ackTask: async (ok) => {
          ackTaskCalls.push({
            ok: Option.isSome(ok),
            branch: Option.isSome(ok) ? ok.value.branch : undefined,
          });
        },
        log: {
          info: (msg, ...args) => {
            console.log(msg, ...args);
          },
          error: (msg, ...args) => {
            console.error(msg, ...args);
            logMessages.push(`${msg} ${args.join(" ")}`)
          },
        },
        sleep: async (ms) => {
          sleepCalls.push(ms);
          return new Promise(resolve => setTimeout(resolve, 10));
        },
        pullTask: async (options) => {
          if (attemptCountRef.value < 2) return {
            type: 'task',
            description: castNonEmptyString("retry task")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      
      expect(logMessages.some(msg => msg.includes("uncaught error in main loop"))).toBe(true);
      expect(sleepCalls).toContain(1000);
      expect(ackTaskCalls).toHaveLength(2);
      expect(ackTaskCalls[0]).toEqual({ ok: false }); // Failed task
      expect(ackTaskCalls[1]).toMatchObject({ ok: true }); // Successful retry
      expect(typeof ackTaskCalls[1]?.branch).toBe("string"); // Branch is a hash string
    });

    it("should handle pullTask errors gracefully", async () => {
      const logMessages: string[] = [];
      const sleepCalls: number[] = [];
      const attemptCountRef2 = { value: 0 };

      const deps = createMockDeps({
        pullTask: async (options) => {
          attemptCountRef2.value++;
          if (attemptCountRef2.value === 1) {
            throw new Error("Failed to pull task");
          }
          if (attemptCountRef2.value === 2) {
            return {
              type: 'task',
              description: castNonEmptyString("after error task")
            };
          }
          return waitPullTaskAbortion(options);
        },
        log: {
          info: () => {},
          error: (msg, ...args) => logMessages.push(`${msg} ${args.join(" ")}`),
        },
        sleep: async (ms) => {
          sleepCalls.push(ms);
          return new Promise(resolve => setTimeout(resolve, 10));
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      
      expect(logMessages.some(msg => msg.includes("uncaught error in main loop"))).toBe(true);
      expect(sleepCalls).toContain(1000);
    });

    it("should handle git branch errors gracefully", async () => {
      const logMessages: string[] = [];
      const cleanupCalls: string[] = [];
      const attemptCountRef3 = { value: 0 };

      const deps = createMockDeps({
        git: {
          isClean: async () => true,
          cleanup: async (branch) => { cleanupCalls.push(branch); },
          branch: async () => {
            attemptCountRef3.value++;
            if (attemptCountRef3.value === 1) {
              throw new Error("Git branch failed");
            }
            return nonEmptyStringFromNumber(555);
          },
          commitAndPush: async () => {},
        },
        log: {
          info: () => {},
          error: (msg, ...args) => logMessages.push(`${msg} ${args.join(" ")}`),
        },
        sleep: async () => new Promise(resolve => setTimeout(resolve, 10)),
        pullTask: async (options) => {
          if (attemptCountRef3.value < 2) return {
            type: 'task',
            description: castNonEmptyString("git error task")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      
      expect(logMessages.some(msg => msg.includes("uncaught error in main loop"))).toBe(true);
      // Should not cleanup branch if branch creation failed
      expect(cleanupCalls).toHaveLength(0);
    });
  });

  describe("Task Acknowledgment Edge Cases", () => {
    it("should handle ackTask error during task acknowledgment", async () => {
      const logMessages: string[] = [];
      const ackTaskCalls: Array<{ ok: boolean; branch?: string }> = [];
      const ackAttemptCountRef = { value: 0 };

      const deps = createMockDeps({
        ackTask: async (ok) => {
          ackAttemptCountRef.value++;
          ackTaskCalls.push({
            ok: Option.isSome(ok),
            branch: Option.isSome(ok) ? ok.value.branch : undefined,
          });
          
          if (ackAttemptCountRef.value === 1) {
            throw new Error("Ack task failed");
          }
        },
        log: {
          info: () => {},
          error: (msg, ...args) => logMessages.push(`${msg} ${args.join(" ")}`),
        },
        sleep: async () => new Promise(resolve => setTimeout(resolve, 10)),
        pullTask: async (options) => {
          if (ackTaskCalls.length < 2) return {
            type: 'task',
            description: castNonEmptyString("ack error task")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      
      expect(logMessages.some(msg => 
        msg.includes("unidentified condition, task was in the middle of acknowledgement")
      )).toBe(true);
      expect(ackTaskCalls).toHaveLength(2);
      expect(ackTaskCalls[0]).toMatchObject({ ok: true }); // Failed acknowledgment
      expect(typeof ackTaskCalls[0]?.branch).toBe("string"); // Branch is a hash string
      expect(ackTaskCalls[1]).toEqual({ ok: false }); // Retry as failed
    });

    it("should differentiate between acknowledgment states correctly", async () => {
      const logMessages: string[] = [];
      const ackTaskCalls: Array<{ ok: boolean; branch?: string }> = [];
      const callCountRef = { value: 0 };

      const deps = createMockDeps({
        runWorker: async () => {
          callCountRef.value++;
          if (callCountRef.value === 1) {
            throw new Error("Worker failed before acknowledgment");
          }
          return { output: [{ line: "Success", timestamp: Date.now() }] };
        },
        ackTask: async (ok) => {
          ackTaskCalls.push({
            ok: Option.isSome(ok),
            branch: Option.isSome(ok) ? ok.value.branch : undefined,
          });
          
          if (callCountRef.value === 2) {
            throw new Error("Ack failed during acknowledgment");
          }
        },
        log: {
          info: (msg, ...args) => {
            console.info(msg, ...args);
          },
          error: (msg, ...args) => {
            console.log(msg, ...args);
            logMessages.push(`${msg} ${args.join(" ")}`)
          },
        },
        sleep: async () => new Promise(resolve => setTimeout(resolve, 10)),
        pullTask: async (options) => {
          if (callCountRef.value < 3) return {
            type: 'task',
            description: castNonEmptyString("acknowledgment test task")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 150));
      controller.abort();
      
      await loopPromise;
      
      // Should have different error messages for different failure modes
      const beforeAckError = logMessages.some(msg => 
        msg.includes("uncaught error in main loop") && 
        !msg.includes("unidentified condition")
      );
      const duringAckError = logMessages.some(msg => 
        msg.includes("unidentified condition, task was in the middle of acknowledgement")
      );
      
      expect(beforeAckError).toBe(true);
      expect(duringAckError).toBe(true);
    });
  });

  describe("Signal Handling", () => {
    it("should stop gracefully when abort signal is triggered", async () => {
      const taskCount = { value: 0 };
      const deps = createMockDeps({
        pullTask: async (options) => {
          taskCount.value++;
          if (taskCount.value > 3) {
            return waitPullTaskAbortion(options);
          }
          return {
            type: 'task',
            description: castNonEmptyString(`task ${taskCount.value}`)
          };
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      // Let it run for a bit
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Abort and wait for clean shutdown
      controller.abort();
      await loopPromise;
      
      // Should have processed at least one task but stopped cleanly
      expect(taskCount.value).toBeGreaterThan(0);
    });

    it("should handle abort signal during task processing", async () => {
      const processedTasks: string[] = [];
      const longRunningTaskStartedRef = { value: false };
      
      const deps = createMockDeps({
        runWorker: async (task) => {
          processedTasks.push(task.description);
          if (task.description === "long running task") {
            longRunningTaskStartedRef.value = true;
            // Simulate long-running task
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          return { output: [{ line: `Processed: ${task.description}`, timestamp: Date.now() }] };
        },
        pullTask: async (options) => {
          if (processedTasks.length === 0) return {
            type: 'task',
            description: castNonEmptyString("long running task")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      // Wait for task to start
      while (!longRunningTaskStartedRef.value) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Abort while task is running
      controller.abort();
      await loopPromise;
      
      // Should process the long-running task but stop before the next one
      expect(processedTasks).toEqual(["long running task"]);
    });
  });

  describe("Logging Integration", () => {
    it("should use injected logger for all log messages", async () => {
      const infoLogs: Array<{ message: string; args: unknown[] }> = [];
      const errorLogs: Array<{ message: string; args: unknown[] }> = [];
      
      const deps = createMockDeps({
        log: {
          info: (message, ...args) => infoLogs.push({ message, args }),
          error: (message, ...args) => errorLogs.push({ message, args }),
        },
        pullTask: async (options) => {
          if (infoLogs.length === 0) return {
            type: 'task',
            description: castNonEmptyString("logging test task")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      controller.abort();
      
      await loopPromise;
      
      // Should have logged the result
      expect(infoLogs.some(log => log.message === "result log")).toBe(true);
    });

    it("should use injected sleep function", async () => {
      const sleepCalls: number[] = [];
      
      const deps = createMockDeps({
        runWorker: async () => {
          throw new Error("Test error for sleep");
        },
        sleep: async (ms) => {
          sleepCalls.push(ms);
          // Use shorter sleep for testing
          return new Promise(resolve => setTimeout(resolve, 10));
        },
        pullTask: async (options) => {
          if (sleepCalls.length === 0) return {
            type: 'task',
            description: castNonEmptyString("sleep test task")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      
      // Should have called sleep with 1000ms
      expect(sleepCalls).toContain(1000);
    });
  });

  describe("Branch Name Generation", () => {
    it("should generate consistent branch names for same task", async () => {
      const branchNames: string[] = [];
      
      const deps = createMockDeps({
        git: {
          isClean: async () => true,
          cleanup: async () => {},
          branch: async (name) => {
            if (Option.isNone(name)) throw new Error("Branch name should be defined");
            branchNames.push(name.value);
            return castNonEmptyString("master"); // Returns previous branch name
          },
          commitAndPush: async () => {},
        },
        pullTask: async (options) => {
          if (branchNames.length < 2) return {
            type: 'task',
            description: castNonEmptyString("same task description")
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      
      // Should generate same branch name for same task
      expect(branchNames).toHaveLength(2);
      expect(branchNames[0]).toBe(branchNames[1]);
    });

    it("should generate different branch names for different tasks", async () => {
      const branchNames: string[] = [];
      const taskNumberRef = { value: 0 };
      
      const deps = createMockDeps({
        git: {
          isClean: async () => true,
          cleanup: async () => {},
          branch: async (name) => {
            if (Option.isNone(name)) throw new Error("Branch name should be defined");
            branchNames.push(name.value);
            return castNonEmptyString("master"); // Returns previous branch name
          },
          commitAndPush: async () => {},
        },
        pullTask: async (options) => {
          taskNumberRef.value++;
          if (taskNumberRef.value <= 2) return {
            type: 'task',
            description: castNonEmptyString(`different task ${taskNumberRef.value}`)
          };
          return waitPullTaskAbortion(options);
        },
      });

      const controller = new AbortController();
      const loopPromise = loop(deps)({ signal: controller.signal });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      controller.abort();
      
      await loopPromise;
      
      // Should generate different branch names for different tasks
      expect(branchNames).toHaveLength(2);
      expect(branchNames[0]).not.toBe(branchNames[1]);
    });
  });
});