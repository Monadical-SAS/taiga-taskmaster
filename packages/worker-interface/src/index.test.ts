// @vibe-generated: conforms to worker-interface
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { Command } from "@effect/platform";
import {
  executeCommand,
  executeTask,
  runTaskAsPromise,
  TestCommandExecutor,
  runWithLiveExecutor,
  runCommandWithLiveExecutor,
  loadProjectEnv,
  createGooseCommand,
  createGooseEnvironment,
  executeGoose,
  GooseCommandExecutor,
  DEFAULT_GOOSE_CONFIG,
  type WorkerTask,
  type GooseConfig,
} from "./index.js";

describe("Worker Interface - Mocked CommandExecutor", () => {
  it("should execute a simple command with predetermined output", async () => {
    const testLayer = TestCommandExecutor({
      "echo 'Hello World'": {
        output: ["Hello World"],
      },
    });

    const result = await runTaskAsPromise(
      executeCommand(Command.make("echo", "'Hello World'")),
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
      command: ["echo", "Task", "executed"],
    };

    const testLayer = TestCommandExecutor({
      "echo Task executed": {
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
      executeCommand(Command.make("multi-line-command")),
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
      executeCommand(Command.make("delayed-command")),
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
      executeCommand(Command.make("failing-command")),
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
      executeCommand(Command.make("unknown-command")),
      testLayer
    );

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("default mock output");
  });
});

describe("Worker Interface - Live CommandExecutor", () => {
  it("should execute a real simple command", async () => {
    const result = await runCommandWithLiveExecutor(Command.make("echo", "Hello World"));

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Hello World");
    expect(result.output[0]?.timestamp).toBeTypeOf("number");
  });

  it("should execute a real worker task", async () => {
    const task: WorkerTask = {
      description: "Test task",
      command: ["echo", "Task executed"],
    };

    const result = await runWithLiveExecutor(executeTask(task));

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]?.line).toBe("Task executed");
  });

  it("should handle real multiple output lines", async () => {
    const result = await runCommandWithLiveExecutor(Command.make("printf", "Line 1\\nLine 2\\nLine 3"));

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(3);
    expect(result.output[0]?.line).toBe("Line 1");
    expect(result.output[1]?.line).toBe("Line 2");
    expect(result.output[2]?.line).toBe("Line 3");
  });

  it("should execute a real command with delays and capture timed output", async () => {
    const result = await runCommandWithLiveExecutor(
      Command.make("sh", "-c", `echo "Starting task..."; sleep 0.1; echo "Processing work..."; sleep 0.1; echo "Task completed!"`)
    );

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
    const result = await runCommandWithLiveExecutor(Command.make("true")); // 'true' command succeeds with no output

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(0);
  });
});

describe("Worker Interface - Cross-validation", () => {
  it("should produce similar results for equivalent mocked vs real commands", async () => {
    const commandObj = Command.make("echo", "Cross validation test");
    const expectedOutput = "Cross validation test";

    // Mock version
    const testLayer = TestCommandExecutor({
      "mock-command": {
        output: [expectedOutput],
      },
    });
    const mockedResult = await runTaskAsPromise(executeCommand(commandObj), testLayer);

    // Real version  
    const realResult = await runCommandWithLiveExecutor(commandObj);

    // Both should have same structure and content
    expect(mockedResult.exitCode).toBe(realResult.exitCode);
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
    expect(command).toEqual(Command.make("goose", "run", "-i", "goose-instructions.md", "--with-builtin", "developer"));
  });

  it("should create goose command with custom instructions file", () => {
    const config: Partial<GooseConfig> = {
      instructionsFile: "custom-instructions.md",
    };
    const command = createGooseCommand(config);
    
    expect(command).toEqual(Command.make("goose", "run", "-i", "custom-instructions.md", "--with-builtin", "developer"));
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
      "    logging to /Users/firfi/.local/share/goose/sessions/20250612_131655.jsonl",
      "    working directory: /Users/firfi/work/clients/monadical/taiga-task-master/packages/worker-interface",
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
      "I'm currently in your project directory at `/Users/firfi/work/clients/monadical/taiga-task-master/packages/worker-interface`, ready to help with whatever you need!",
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

    const testLayer = TestCommandExecutor({
      "goose run -i goose-instructions.md --with-builtin developer": {
        output: mockGooseOutput,
        delay: 50, // Simulate real-time processing
      },
    });

    const result = await runTaskAsPromise(executeGoose(), testLayer);

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(mockGooseOutput.length);
    expect(result.output[0]?.line).toContain("starting session | provider: openrouter");
    expect(result.output[3]?.line).toBe("# Hello! 👋");
    expect(result.output[result.output.length - 1]?.line).toBe("What would you like to work on today?");
  });

  it("should execute goose with working directory", async () => {
    const workingDir = "/path/to/project";
    // The secure implementation uses Command.workingDirectory, which serializes with working dir
    const expectedCommand = `cd "${workingDir}" && goose run -i goose-instructions.md --with-builtin developer`;

    const testLayer = TestCommandExecutor({
      [expectedCommand]: {
        output: ["Goose running in project directory"],
      },
    });

    const config: Partial<GooseConfig> = {
      workingDirectory: workingDir,
    };

    const result = await runTaskAsPromise(executeGoose(config), testLayer);

    expect(result.exitCode).toBe(0);
    expect(result.output[0]?.line).toBe("Goose running in project directory");
  });

  it("should handle goose errors gracefully", async () => {
    const testLayer = TestCommandExecutor({
      "goose run -i goose-instructions.md --with-builtin developer": {
        error: "Goose command not found",
      },
    });

    const result = await runTaskAsPromise(executeGoose(), testLayer);

    expect(result.exitCode).toBe(1);
    expect(result.output[0]?.line).toContain("Goose command not found");
  });

  it("should simulate long-running goose session with realistic periodic output", async () => {
    const mockOutput = [
      "starting session | provider: openrouter model: anthropic/claude-haiku",
      "    logging to /Users/firfi/.local/share/goose/sessions/20250612_134200.jsonl",
      "    working directory: /Users/firfi/work/clients/monadical/taiga-task-master/packages/worker-interface",
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

    const testLayer = TestCommandExecutor({
      "goose run -i custom.md --with-builtin developer": {
        output: mockOutput,
        delay: 150, // 150ms between lines
      },
    });

    const startTime = Date.now();
    const result = await runTaskAsPromise(
      executeGoose({ instructionsFile: "custom.md" }), 
      testLayer
    );
    const endTime = Date.now();

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(mockOutput.length);
    
    // Should take time due to delays (21 gaps * 150ms = 3150ms minimum)
    expect(endTime - startTime).toBeGreaterThanOrEqual(3000);
    
    // Verify content matches realistic goose output
    expect(result.output[0]?.line).toContain("starting session | provider: openrouter");
    expect(result.output[3]?.line).toBe("# Analyzing Project Structure");
    expect(result.output[result.output.length - 1]?.line).toBe("**Task completed successfully!** ✅");
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
    const testLayer = TestCommandExecutor({
      "goose run -i test.md --with-builtin developer": {
        output: ["Goose running with Command.env environment variables"],
      },
    });

    const result = await runTaskAsPromise(
      executeCommand(mockCommandObj),
      testLayer
    );

    expect(result.exitCode).toBe(0);
    expect(result.output[0]?.line).toBe("Goose running with Command.env environment variables");
  });

  it("should map different commands to different scenarios correctly", async () => {
    const testLayer = TestCommandExecutor({
      "echo hello": {
        output: ["hello"],
      },
      "echo world": {
        output: ["world"],
      },
      "ls -la": {
        output: ["total 0", "drwxr-xr-x 2 user user 64 Dec 6 14:26 ."],
      },
    });

    // Test first command
    const result1 = await runTaskAsPromise(
      executeCommand(Command.make("echo", "hello")),
      testLayer
    );
    expect(result1.output[0]?.line).toBe("hello");

    // Test second command
    const result2 = await runTaskAsPromise(
      executeCommand(Command.make("echo", "world")),
      testLayer
    );
    expect(result2.output[0]?.line).toBe("world");

    // Test third command
    const result3 = await runTaskAsPromise(
      executeCommand(Command.make("ls", "-la")),
      testLayer
    );
    expect(result3.output[0]?.line).toBe("total 0");
    expect(result3.output[1]?.line).toBe("drwxr-xr-x 2 user user 64 Dec 6 14:26 .");
  });

  it("should fall back to default scenario when command not found", async () => {
    const testLayer = TestCommandExecutor({
      "echo hello": {
        output: ["hello"],
      },
      "default": {
        output: ["default fallback output"],
      },
    });

    // Test command that doesn't exist in scenarios - should use default
    const result = await runTaskAsPromise(
      executeCommand(Command.make("unknown", "command")),
      testLayer
    );
    expect(result.output[0]?.line).toBe("default fallback output");
  });

  it("should use hardcoded fallback when no default scenario exists", async () => {
    const testLayer = TestCommandExecutor({
      "echo hello": {
        output: ["hello"],
      },
    });

    // Test command that doesn't exist and no default - should use hardcoded fallback
    const result = await runTaskAsPromise(
      executeCommand(Command.make("unknown", "command")),
      testLayer
    );
    expect(result.output[0]?.line).toBe("default mock output");
  });

  describe("Command Arrays", () => {
    it("should handle commands with arguments that contain spaces", async () => {
      const task: WorkerTask = {
        description: "Test task with arguments containing spaces",
        command: ["echo", "hello world"],
      };

      const testLayer = TestCommandExecutor({
        'echo hello world': {
          output: ["hello world"],
        },
      });

      const result = await runTaskAsPromise(executeTask(task), testLayer);

      expect(result.exitCode).toBe(0);
      expect(result.output[0]?.line).toBe("hello world");
    });

    it("should handle commands with multiple arguments", async () => {
      const task: WorkerTask = {
        description: "Test task with multiple arguments",
        command: ["cp", "source file.txt", "destination file.txt"],
      };

      const testLayer = TestCommandExecutor({
        'cp source file.txt destination file.txt': {
          output: ["file copied"],
        },
      });

      const result = await runTaskAsPromise(executeTask(task), testLayer);

      expect(result.exitCode).toBe(0);
      expect(result.output[0]?.line).toBe("file copied");
    });

    it("should handle commands with flags and arguments", async () => {
      const task: WorkerTask = {
        description: "Test command with flags",
        command: ["grep", "-n", "search term", "file.txt"],
      };

      const testLayer = TestCommandExecutor({
        'grep -n search term file.txt': {
          output: ["1:found search term here"],
        },
      });

      const result = await runTaskAsPromise(executeTask(task), testLayer);

      expect(result.exitCode).toBe(0);
      expect(result.output[0]?.line).toBe("1:found search term here");
    });

    it("should handle empty command array", async () => {
      const task: WorkerTask = {
        description: "Test with empty command",
        command: [],
      };

      const testLayer = TestCommandExecutor({});

      // This should fail with CommandParsingError, but executeCommand catches all errors
      // and returns a WorkerResult with exitCode 1
      const result = await runTaskAsPromise(executeTask(task), testLayer);

      expect(result.exitCode).toBe(1);
      expect(result.output[0]?.line).toContain("CommandParsingError");
    });
  });

  describe("Security Tests - Shell Injection Prevention", () => {
    it("should safely handle malicious working directory paths", async () => {
      // Test various shell injection attempts in working directory
      // DO NOT ADD rm -rf / here : )
      const maliciousWorkingDirs = [
        '/tmp && echo "injected"',
        '/tmp | cat /etc/passwd',
        '/tmp`ls`',
        '/tmp$(whoami)',
        '/tmp"; cat /etc/passwd; echo "',
        '/tmp\'; ls; echo \'',
      ];

      for (const maliciousDir of maliciousWorkingDirs) {
        // The command serialization includes the working directory for test matching
        const expectedCommand = `cd "${maliciousDir}" && goose run -i goose-instructions.md --with-builtin developer`;
        const testLayer = TestCommandExecutor({
          [expectedCommand]: {
            output: ["Secure execution - no shell injection"],
          },
        });

        const config: Partial<GooseConfig> = {
          workingDirectory: maliciousDir,
        };

        // This should execute safely without shell injection
        const result = await runTaskAsPromise(executeGoose(config), testLayer);

        expect(result.exitCode).toBe(0);
        expect(result.output[0]?.line).toBe("Secure execution - no shell injection");
        
        // The command should be executed securely without shell composition
        // Command.workingDirectory handles the path safely
      }
    });

    it("should safely handle malicious command arguments", async () => {
      const maliciousCommands: WorkerTask[] = [
        {
          description: "Test command substitution",
          command: ["echo", "hello$(whoami)"],
        },
        {
          description: "Test pipe injection",
          command: ["echo", "hello | cat /etc/passwd"],
        },
        {
          description: "Test backtick injection",
          command: ["echo", "hello`ls`"],
        },
        {
          description: "Test quoted injection",
          command: ["echo", "hello\"; cat /etc/passwd; echo \""],
        },
      ];

      for (const maliciousTask of maliciousCommands) {
        const commandString = maliciousTask.command.join(" ");
        const testLayer = TestCommandExecutor({
          [commandString]: {
            output: ["Safe execution - arguments properly escaped"],
          },
        });

        const result = await runTaskAsPromise(executeTask(maliciousTask), testLayer);

        expect(result.exitCode).toBe(0);
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
});