// @vibe-generated: conforms to taskmaster-interface
import {
  generateTasks,
  type GenerateTasksDeps,
} from "@taiga-task-master/taskmaster-interface";
import {
  type TasksFileContent,
  type NonEmptyString,
  type PrdText,
  TasksFileContent as TasksFileContentSchema,
} from "@taiga-task-master/common";
import { Schema } from "effect";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Validation utilities for generated tasks
export const createValidationUtils = () => {
  const validateTasksFileContent = (content: unknown): TasksFileContent => {
    try {
      return Schema.decodeUnknownSync(TasksFileContentSchema)(content);
    } catch (error) {
      throw new Error(`Task validation failed: ${error}`);
    }
  };

  const validateTasksFile = async (
    filePath: NonEmptyString
  ): Promise<TasksFileContent> => {
    try {
      const content = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(content);
      return validateTasksFileContent(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in tasks file: ${error.message}`);
      }
      throw error;
    }
  };

  return {
    validateTasksFileContent,
    validateTasksFile,
  };
};

// File System Operations for temporary files
export const createFileOperations = () => {
  const savePrd = async (
    path: NonEmptyString,
    prd: PrdText
  ): Promise<AsyncDisposable> => {
    await fs.writeFile(path, prd, "utf8");
    return {
      async [Symbol.asyncDispose]() {
        try {
          await fs.unlink(path);
        } catch {
          // File already deleted or doesn't exist
        }
      },
    };
  };

  const readTasksJson = async (
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    const content = await fs.readFile(tasksJsonPath, "utf8");
    return JSON.parse(content);
  };

  return { savePrd, readTasksJson };
};

// CLI Tool Wrapper with robust execution handling
export const createCliWrapper = () => {
  const generate = async (
    prdPath: NonEmptyString,
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    try {
      // Execute the taskmaster CLI tool (could be claude-task-master or MCP taskmaster)
      const command = `npx task-master parse-prd --research --input "${prdPath}" --output "${tasksJsonPath}" --force`;

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || "production",
        },
      });

      // Log outputs for debugging
      if (stdout) {
        console.log("CLI stdout:", stdout);
      }
      if (stderr) {
        console.warn("CLI stderr:", stderr);
      }

      // Verify the output file was created
      try {
        await fs.access(tasksJsonPath);
      } catch {
        throw new Error(`Output file not created: ${tasksJsonPath}`);
      }

      // Read, validate, and parse the generated tasks file
      const validation = createValidationUtils();
      return await validation.validateTasksFile(tasksJsonPath);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes("ENOENT")) {
          throw new Error(
            "CLI tool not found. Please ensure taskmaster is installed."
          );
        }
        if (error.message.includes("timeout")) {
          throw new Error("CLI execution timed out after 5 minutes.");
        }
        throw new Error(`CLI execution failed: ${error.message}`);
      }
      throw new Error(`CLI execution failed: ${String(error)}`);
    }
  };

  return { generate };
};

// Default implementation that uses real file system and CLI
export const createDefaultDependencies = (): GenerateTasksDeps => {
  const fileOps = createFileOperations();
  const cli = createCliWrapper();
  const validation = createValidationUtils();

  return {
    savePrd: fileOps.savePrd,
    cli: {
      generate: cli.generate,
    },
    readTasksJson: async (
      tasksJsonPath: NonEmptyString
    ): Promise<TasksFileContent> => {
      return validation.validateTasksFile(tasksJsonPath);
    },
  };
};

// Export the default configured function
export const generateTasksDefault = generateTasks(createDefaultDependencies());

export * from "@taiga-task-master/taskmaster-interface";
