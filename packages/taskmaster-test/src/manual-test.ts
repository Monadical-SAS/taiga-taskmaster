// @vibe-generated: conforms to taskmaster-interface
import {
  generateTasks,
  type GenerateTasksDeps,
} from "@taiga-task-master/taskmaster";
import {
  type TasksFileContent,
  type NonEmptyString,
  type PrdText,
} from "@taiga-task-master/common";
import { Option } from "effect";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration - safe isolated directory
const TEST_PREFIX = "packages/taskmaster-test/test";
const TEMP_DIR = join(__dirname, "..", "test");
const TEST_PRD = `# Sample PRD for Testing

## Project Overview
Build a simple task management application with the following features:

## Core Features
1. Create new tasks with title and description
2. Mark tasks as complete/incomplete
3. Delete tasks
4. List all tasks
5. Filter tasks by status (completed/pending)

## Technical Requirements
- Use TypeScript
- Implement proper error handling
- Include unit tests
- Follow functional programming principles

## Acceptance Criteria
- Users can add tasks with validation
- Task status can be toggled
- Tasks can be removed from the list
- Application handles edge cases gracefully
` as PrdText;

/**
 * Setup test environment with isolated safe directory
 */
async function setupTestEnvironment(): Promise<void> {
  try {
    // Clean up any existing test directory
    await fs.rm(TEMP_DIR, { recursive: true, force: true });

    // Create fresh test directory structure
    await fs.mkdir(join(TEMP_DIR, "scripts"), { recursive: true });
    await fs.mkdir(join(TEMP_DIR, "tasks"), { recursive: true });

    // Also create the safe prefixed directory structure
    await fs.mkdir(join(TEST_PREFIX, "scripts"), { recursive: true });
    await fs.mkdir(join(TEST_PREFIX, "tasks"), { recursive: true });

    // Write PRD file to both locations for compatibility
    const localPrdPath = join(TEMP_DIR, "scripts", "prd.txt");
    const safePrdPath = join(TEST_PREFIX, "scripts", "prd.txt");
    
    await fs.writeFile(localPrdPath, TEST_PRD, "utf8");
    await fs.writeFile(safePrdPath, TEST_PRD, "utf8");

    console.log("✅ Test environment setup complete");
    console.log(`📝 PRD file created at: ${localPrdPath}`);
    console.log(`🔒 Safe PRD file created at: ${safePrdPath}`);
  } catch (error) {
    throw new Error(`Failed to setup test environment: ${error}`);
  }
}

/**
 * Cleanup test environment - clean both local and safe directories
 */
async function cleanupTestEnvironment(): Promise<void> {
  try {
    // Clean up local test directory
    try {
      const taskFiles = await fs.readdir(join(TEMP_DIR, "tasks"));
      const taskTxtFiles = taskFiles.filter(
        (file) => file.startsWith("task_") && file.endsWith(".txt")
      );

      for (const file of taskTxtFiles) {
        await fs.unlink(join(TEMP_DIR, "tasks", file));
      }

      await fs.unlink(join(TEMP_DIR, "scripts", "prd.txt"));
      console.log("🧹 Cleaned up local test files");
    } catch {
      // Files might not exist
    }

    // Clean up safe test directory  
    try {
      await fs.rm(TEST_PREFIX, { recursive: true, force: true });
      console.log("🧹 Cleaned up safe test directory");
    } catch {
      // Directory might not exist
    }

    console.log("🧹 Cleanup completed");
  } catch (error) {
    console.warn(`Warning: Failed to cleanup some files: ${error}`);
  }
}

/**
 * Create custom dependencies that work in the safe test directory with proper prefixing
 */
function createTestDependencies(): GenerateTasksDeps {
  // Save PRD with safe prefix to prevent overwriting project files
  const savePrd = async (
    path: NonEmptyString,
    prd: PrdText
  ): Promise<AsyncDisposable> => {
    // Always prefix paths to ensure they go to safe test directory
    const safePath = join(TEST_PREFIX, path);
    await fs.mkdir(dirname(safePath), { recursive: true });
    await fs.writeFile(safePath, prd, "utf8");
    
    console.log(`📝 Saved PRD to safe path: ${safePath}`);
    
    return {
      async [Symbol.asyncDispose]() {
        try {
          await fs.unlink(safePath);
          console.log(`🧹 Cleaned up PRD file: ${safePath}`);
        } catch {
          // File already deleted or doesn't exist
        }
      },
    };
  };

  const readTasksJson = async (
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    // Use safe prefixed path
    const safePath = join(TEST_PREFIX, tasksJsonPath);
    const content = await fs.readFile(safePath, "utf8");
    console.log(`📖 Read tasks from safe path: ${safePath}`);
    return JSON.parse(content);
  };

  const generate = async (
    prdPath: NonEmptyString,
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    try {
      // Use safe prefixed paths to prevent overwriting project files
      const safePrdPath = join(TEST_PREFIX, prdPath);
      const safeTasksPath = join(TEST_PREFIX, tasksJsonPath);
      
      // Ensure target directory exists
      await fs.mkdir(dirname(safeTasksPath), { recursive: true });

      // Execute the task-master CLI tool with safe paths
      const command = `npx dotenv -e .env -- npx task-master parse-prd --input "${safePrdPath}" --output "${safeTasksPath}" --force`;

      console.log(`🚀 Executing: ${command}`);
      console.log(`📁 Safe PRD path: ${safePrdPath}`);
      console.log(`📁 Safe tasks path: ${safeTasksPath}`);
      console.log(`📁 Working directory: ${process.cwd()}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(), // Run from project root for proper .env access
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || "production",
        },
      });

      // Log outputs for debugging
      if (stdout) {
        console.log("📝 CLI stdout:", stdout);
      }
      if (stderr) {
        console.warn("⚠️ CLI stderr:", stderr);
      }

      // Verify the output file was created
      try {
        await fs.access(safeTasksPath);
        console.log(`✅ tasks.json file created successfully at: ${safeTasksPath}`);
      } catch {
        throw new Error(`Output file not created: ${safeTasksPath}`);
      }

      // Read and return the generated tasks
      const content = await fs.readFile(safeTasksPath, "utf8");
      const tasks = JSON.parse(content);

      console.log(`📊 Generated ${tasks.tasks?.length || 0} tasks`);

      return tasks;
    } catch (error) {
      if (error instanceof Error) {
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

  return {
    savePrd,
    cli: { generate },
    readTasksJson,
  };
}

/**
 * Main test function
 */
async function runManualTest(): Promise<void> {
  console.log("🧪 Starting taskmaster manual test...");
  console.log("=".repeat(50));

  try {
    // Setup
    await setupTestEnvironment();

    // Create test dependencies
    const deps = createTestDependencies();
    const generateTasksWithDeps = generateTasks(deps);

    // Run the test
    console.log("📋 Generating tasks from PRD...");
    const result = await generateTasksWithDeps(TEST_PRD, Option.none());

    // Validate results
    if (!result || !result.tasks || result.tasks.length === 0) {
      throw new Error("No tasks were generated");
    }

    console.log("✅ Test completed successfully!");
    console.log(`📊 Generated ${result.tasks.length} tasks:`);

    result.tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.title} (${task.status})`);
    });

    // Show location of generated files
    console.log("📂 Generated files location:");
    console.log(`  - Local: ${join(TEMP_DIR, "tasks", "tasks.json")}`);
    console.log(`  - Safe: ${join(TEST_PREFIX, "tasks", "tasks.json")}`);

    // Cleanup
    await cleanupTestEnvironment();

    console.log("=".repeat(50));
    console.log("🎉 Manual test passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("=".repeat(50));

    // Attempt cleanup even on failure
    try {
      await cleanupTestEnvironment();
    } catch (cleanupError) {
      console.warn("Failed to cleanup after error:", cleanupError);
    }

    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runManualTest().catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
}
