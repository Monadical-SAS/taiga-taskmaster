// @vibe-generated: conforms to taskmaster-interface
import {
  generateTasks,
  type GenerateTasksDeps,
  createDependencies,
} from "@taiga-task-master/taskmaster";
import {
  type TasksFileContent,
  type NonEmptyString,
  type PrdText,
} from "@taiga-task-master/common";
import { Option } from "effect";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration - safe isolated directory
const TEMP_DIR = join(__dirname, "..", "temp");
const TEST_PREFIX = TEMP_DIR;
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

    // Write PRD file to temp directory
    const prdPath = join(TEMP_DIR, "scripts", "prd.txt");
    await fs.writeFile(prdPath, TEST_PRD, "utf8");

    console.log("✅ Test environment setup complete");
    console.log(`📝 PRD file created at: ${prdPath}`);
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
      console.log("🧹 Cleaned up test files");
    } catch {
      // Files might not exist
    }

    console.log("🧹 Cleanup completed");
  } catch (error) {
    console.warn(`Warning: Failed to cleanup some files: ${error}`);
  }
}

/**
 * Create test dependencies using the shared factory with TEST_PREFIX
 */
function createTestDependencies(): GenerateTasksDeps {
  return createDependencies(TEST_PREFIX);
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
    console.log(`  - Temp: ${join(TEMP_DIR, "tasks", "tasks.json")}`);

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
