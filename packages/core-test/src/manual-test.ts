// @vibe-generated: conforms to taskmaster-interface and tasktracker-interface
import { Schema } from "effect";
import {
  TaskId,
  ProjectId,
  TaskFileContent,
  UniqTaskFileContentList,
  SINGLETON_PROJECT_ID,
  Url,
  type TasksFileContent,
  type NonEmptyString,
  type PrdText,
} from "@taiga-task-master/common";
import {
  generateTasks,
  type GenerateTasksDeps,
  createDependencies,
} from "@taiga-task-master/taskmaster";
import {
  syncTasks,
  type SyncTasksDeps,
  type TaskText,
  type TaskTrackerTasksResult,
  createTaskTrackerDeps,
} from "@taiga-task-master/tasktracker";
import { Option } from "effect";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration - safe isolated directory
const TEMP_DIR = join(__dirname, "..", "temp");
const TEST_PREFIX = TEMP_DIR;

// Sample PRD for testing
const TEST_PRD = `# E-commerce Platform PRD

## Project Overview
Build a comprehensive e-commerce platform with user management, product catalog, shopping cart, and order processing.

## Core Features
1. User registration and authentication system
2. Product catalog with search and filtering
3. Shopping cart functionality
4. Order processing and payment integration
5. Admin dashboard for inventory management
6. Email notifications for order updates
7. Customer reviews and ratings system

## Technical Requirements
- Use TypeScript and Node.js backend
- Implement RESTful API design
- Use PostgreSQL for data persistence
- Implement proper error handling and validation
- Include comprehensive unit and integration tests
- Follow functional programming principles
- Implement proper security measures

## Acceptance Criteria
- Users can register, login, and manage their profiles
- Products can be browsed, searched, and filtered efficiently
- Shopping cart maintains state across sessions
- Orders are processed securely with payment integration
- Admin can manage inventory and view analytics
- System handles high concurrent user loads
- All user data is protected and compliant with privacy regulations
` as PrdText;

// Environment validation
const validateEnvironment = () => {
  const required = ["TAIGA_USERNAME", "TAIGA_PASSWORD", "TAIGA_PROJECT_ID"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(", ")}`);
    console.error("Please set them in your .env file");
    process.exit(1);
  }

  return {
    username: process.env.TAIGA_USERNAME!,
    password: process.env.TAIGA_PASSWORD!,
    projectId: parseInt(process.env.TAIGA_PROJECT_ID!, 10),
  };
};

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
 * Cleanup test environment
 */
async function cleanupTestEnvironment(): Promise<void> {
  try {
    // Clean up test directory
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
    console.log("🧹 Cleanup completed");
  } catch (error) {
    console.warn(`Warning: Failed to cleanup some files: ${error}`);
  }
}

/**
 * Create taskmaster dependencies using the shared factory with TEST_PREFIX
 */
function createTaskmasterDependencies(): GenerateTasksDeps {
  return createDependencies(TEST_PREFIX);
}

// Use shared TaskTracker implementation from main package

const main = async (): Promise<void> => {
  console.log("🧪 Core Test - Complete PRD to Taiga Pipeline");
  console.log("==============================================\n");

  const env = validateEnvironment();
  console.log(`🌐 Using Taiga project ID: ${env.projectId}`);
  console.log(`👤 Username: ${env.username}\n`);

  try {
    // === PHASE 1: Task Generation (from taskmaster-test) ===
    console.log("📋 PHASE 1: Task Generation");
    console.log("==========================");

    // Setup test environment
    await setupTestEnvironment();

    // Create taskmaster dependencies and generate tasks
    const taskmasterDeps = createTaskmasterDependencies();
    const generateTasksWithDeps = generateTasks(taskmasterDeps);

    console.log("📋 Generating tasks from PRD...");
    const generatedTasks = await generateTasksWithDeps(TEST_PRD, Option.none());

    if (
      !generatedTasks ||
      !generatedTasks.tasks ||
      generatedTasks.tasks.length === 0
    ) {
      throw new Error("No tasks were generated");
    }

    console.log(`✅ Generated ${generatedTasks.tasks.length} tasks from PRD`);
    generatedTasks.tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.title} (${task.status})`);
    });

    // Convert to UniqTaskFileContentList for syncing using the type schema
    const tasksForSync = Schema.decodeSync(UniqTaskFileContentList)(
      generatedTasks.tasks as any
    );

    // === PHASE 2: Task Synchronization (from tasktracker-test) ===
    console.log("\n🔄 PHASE 2: Task Synchronization");
    console.log("================================");

    // Initialize Taiga API
    console.log("🔌 Initializing Taiga API...");
    const { taigaApiFactory } = await import("../../taiga-api/dist/index.js");

    // Get Taiga base URL from environment or use default
    const taigaBaseUrl = process.env.TAIGA_BASE_URL || "https://api.taiga.io";
    console.log(`🌐 Using Taiga base URL: ${taigaBaseUrl}`);

    const api = taigaApiFactory.create({
      baseUrl: Schema.decodeSync(Url)(taigaBaseUrl),
      credentials: {
        username: env.username,
        password: env.password,
        type: "normal",
      },
    });

    // Test authentication
    console.log("🔐 Testing authentication...");
    const authResponse = await api.auth.login({
      username: env.username,
      password: env.password,
      type: "normal",
    });
    console.log(
      `✅ Authenticated as: ${authResponse.full_name} (${authResponse.email})\n`
    );

    // Create tasktracker dependencies
    const tasktrackerDeps = createTaskTrackerDeps(api, env.projectId);

    // Test syncTasks functionality
    console.log("🔄 Testing syncTasks with generated tasks...");
    const projectId = SINGLETON_PROJECT_ID;

    console.log("\n--- First sync (add generated tasks to Taiga) ---");
    await syncTasks(tasktrackerDeps)(tasksForSync, projectId);
    console.log("✅ First sync completed - tasks added to Taiga");

    console.log("\n--- Second sync (update existing tasks) ---");
    // Modify the generated tasks slightly to test updates
    const updatedTasks = generatedTasks.tasks.map((task) => ({
      ...task,
      description: `Updated: ${task.description}`,
    }));
    const updatedTasksForSync = Schema.decodeSync(UniqTaskFileContentList)(
      updatedTasks as any
    );

    await syncTasks(tasktrackerDeps)(updatedTasksForSync, projectId);
    console.log("✅ Second sync completed - tasks updated in Taiga");

    console.log("\n🎉 Core test completed successfully!");
    console.log("✨ Complete PRD-to-Taiga pipeline has been tested");
    console.log(`📊 Processed ${generatedTasks.tasks.length} tasks end-to-end`);

    // Cleanup
    await cleanupTestEnvironment();
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error instanceof Error ? error.message : error
    );
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }

    // Attempt cleanup even on failure
    try {
      await cleanupTestEnvironment();
    } catch (cleanupError) {
      console.warn("Failed to cleanup after error:", cleanupError);
    }

    process.exit(1);
  }
};

main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
