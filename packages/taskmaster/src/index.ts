/* eslint-disable functional/no-expression-statements */
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
import { dirname, join } from "path";

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
export const createFileOperations = (pathPrefix?: string) => {
  const prefixPath = (path: NonEmptyString): NonEmptyString => {
    if (!pathPrefix) return path;
    return join(pathPrefix, path) as NonEmptyString;
  };

  const savePrd = async (
    path: NonEmptyString,
    prd: PrdText
  ): Promise<AsyncDisposable> => {
    const actualPath = prefixPath(path);
    await fs.mkdir(dirname(actualPath), { recursive: true });
    await fs.writeFile(actualPath, prd, "utf8");

    if (pathPrefix) {
      console.log(`📝 Saved PRD to prefixed path: ${actualPath}`);
    }

    return {
      async [Symbol.asyncDispose]() {
        try {
          await fs.unlink(actualPath);
          if (pathPrefix) {
            console.log(`🧹 Cleaned up PRD file: ${actualPath}`);
          }
        } catch {
          // File already deleted or doesn't exist
        }
      },
    };
  };

  const readTasksJson = async (
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    const actualPath = prefixPath(tasksJsonPath);
    if (pathPrefix) {
      console.log(`📖 Read tasks from prefixed path: ${actualPath}`);
    }
    const content = await fs.readFile(actualPath, "utf8");
    return JSON.parse(content);
  };

  return { savePrd, readTasksJson };
};

// CLI Tool Wrapper with robust execution handling
export const createCliWrapper = (pathPrefix?: string) => {
  const prefixPath = (path: NonEmptyString): NonEmptyString => {
    if (!pathPrefix) return path;
    return join(pathPrefix, path) as NonEmptyString;
  };

  const generate = async (
    prdPath: NonEmptyString,
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    try {
      const actualPrdPath = prefixPath(prdPath);
      const actualTasksPath = prefixPath(tasksJsonPath);

      // Ensure target directory exists when using prefix
      if (pathPrefix) {
        await fs.mkdir(dirname(actualTasksPath), { recursive: true });
      }

      // Always use dotenv for environment loading
      // TODO --research does't work but promised soon https://github.com/eyaltoledano/claude-task-master/issues/608#issuecomment-2910654041
      const command = `npx dotenv -e .env -- npx task-master parse-prd --research --input "${actualPrdPath}" --output "${actualTasksPath}" --force`;

      // When using pathPrefix, assume we're in a test package and need to go up to project root
      const cwd = pathPrefix ? join(process.cwd(), "..", "..") : process.cwd();

      if (pathPrefix) {
        console.log(`🚀 Executing: ${command}`);
        console.log(`📁 Prefixed PRD path: ${actualPrdPath}`);
        console.log(`📁 Prefixed tasks path: ${actualTasksPath}`);
        console.log(`📁 Working directory: ${cwd}`);
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || "production",
        },
      });

      // Log outputs for debugging
      if (stdout) {
        console.log(pathPrefix ? "📝 CLI stdout:" : "CLI stdout:", stdout);
      }
      if (stderr) {
        console.warn(pathPrefix ? "⚠️ CLI stderr:" : "CLI stderr:", stderr);
      }

      // Verify the output file was created
      try {
        await fs.access(actualTasksPath);
        if (pathPrefix) {
          console.log(
            `✅ tasks.json file created successfully at: ${actualTasksPath}`
          );
        }
      } catch {
        throw new Error(`Output file not created: ${actualTasksPath}`);
      }

      // Read, validate, and parse the generated tasks file
      const validation = createValidationUtils();
      const result = await validation.validateTasksFile(actualTasksPath);

      if (pathPrefix) {
        console.log(`📊 Generated ${result.tasks?.length || 0} tasks`);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes("ENOENT")) {
          throw new Error(
            "CLI tool not found. Please ensure taskmaster is installed and available in PATH."
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

// Configurable dependency factory that accepts optional path prefix
export const createDependencies = (pathPrefix?: string): GenerateTasksDeps => {
  const fileOps = createFileOperations(pathPrefix);
  const cli = createCliWrapper(pathPrefix);
  const validation = createValidationUtils();

  return {
    savePrd: fileOps.savePrd,
    cli: {
      generate: cli.generate,
    },
    readTasksJson: async (
      tasksJsonPath: NonEmptyString
    ): Promise<TasksFileContent> => {
      const actualPath = pathPrefix
        ? (join(pathPrefix, tasksJsonPath) as NonEmptyString)
        : tasksJsonPath;
      return validation.validateTasksFile(actualPath);
    },
  };
};

// Default implementation that uses real file system and CLI
export const createDefaultDependencies = (): GenerateTasksDeps => {
  return createDependencies();
};

// Export the default configured function
export const generateTasksDefault = generateTasks(createDefaultDependencies());

export * from "@taiga-task-master/taskmaster-interface";
