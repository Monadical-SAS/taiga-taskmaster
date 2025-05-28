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
} from "@taiga-task-master/taskmaster";
import {
  syncTasks,
  type SyncTasksDeps,
  type TaskText,
  type TaskTrackerTasksResult,
} from "@taiga-task-master/tasktracker";
import {
  TaskText as TaskTextSchema,
  TaskTrackerTasksResult as TaskTrackerTasksResultSchema,
  encodeTaskIdToTag,
  decodeTaskIdFromTag,
  encodeProjectIdToTag,
  decodeProjectIdFromTag,
  TASK_ID_TAG_PREFIX,
  PROJECT_ID_TAG_PREFIX,
} from "@taiga-task-master/tasktracker-interface";
import {
  type TaigaApi,
  type TaskDetail,
  type CreateTaskRequest,
  type UpdateTaskRequest,
  ProjectId as TaigaProjectId,
  TaskId as TaigaTaskId,
} from "@taiga-task-master/taiga-api-interface";
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
 * Create taskmaster dependencies for task generation
 */
function createTaskmasterDependencies(): GenerateTasksDeps {
  const savePrd = async (
    path: NonEmptyString,
    prd: PrdText
  ): Promise<AsyncDisposable> => {
    const tempPath = join(TEST_PREFIX, path);
    await fs.mkdir(dirname(tempPath), { recursive: true });
    await fs.writeFile(tempPath, prd, "utf8");

    console.log(`📝 Saved PRD to temp path: ${tempPath}`);

    return {
      async [Symbol.asyncDispose]() {
        try {
          await fs.unlink(tempPath);
          console.log(`🧹 Cleaned up PRD file: ${tempPath}`);
        } catch {
          // File already deleted or doesn't exist
        }
      },
    };
  };

  const readTasksJson = async (
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    const tempPath = join(TEST_PREFIX, tasksJsonPath);
    const content = await fs.readFile(tempPath, "utf8");
    console.log(`📖 Read tasks from temp path: ${tempPath}`);
    return JSON.parse(content);
  };

  const generate = async (
    prdPath: NonEmptyString,
    tasksJsonPath: NonEmptyString
  ): Promise<TasksFileContent> => {
    try {
      const tempPrdPath = join(TEST_PREFIX, prdPath);
      const tempTasksPath = join(TEST_PREFIX, tasksJsonPath);

      // Ensure target directory exists
      await fs.mkdir(dirname(tempTasksPath), { recursive: true });

      // Execute the task-master CLI tool with temp paths
      const command = `npx dotenv -e .env -- npx task-master parse-prd --research --input "${tempPrdPath}" --output "${tempTasksPath}" --force`;

      const projectRoot = join(__dirname, "..", "..", "..");

      console.log(`🚀 Executing: ${command}`);
      console.log(`📁 Temp PRD path: ${tempPrdPath}`);
      console.log(`📁 Temp tasks path: ${tempTasksPath}`);

      const { stdout, stderr } = await execAsync(command, {
        cwd: projectRoot,
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || "production",
        },
      });

      if (stdout) {
        console.log("📝 CLI stdout:", stdout);
      }
      if (stderr) {
        console.warn("⚠️ CLI stderr:", stderr);
      }

      // Verify the output file was created
      try {
        await fs.access(tempTasksPath);
        console.log(
          `✅ tasks.json file created successfully at: ${tempTasksPath}`
        );
      } catch {
        throw new Error(`Output file not created: ${tempTasksPath}`);
      }

      // Read and return the generated tasks
      const content = await fs.readFile(tempTasksPath, "utf8");
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
 * Create tasktracker dependencies for Taiga synchronization
 */
const createTasktrackerDependencies = (
  api: TaigaApi,
  taigaProjectId: TaigaProjectId
): SyncTasksDeps => {
  const getTasks = async (
    ids: Set<TaskId>,
    projectId: ProjectId
  ): Promise<TaskTrackerTasksResult> => {
    console.log(
      `🔍 Getting tasks for project ${projectId}, checking ${ids.size} IDs...`
    );

    // Get all tasks from the Taiga project
    const allTasks = await api.tasks.list({ project: taigaProjectId });
    console.log(`📋 Found ${allTasks.length} total tasks in Taiga project`);

    // Filter tasks that have our tags and match the requested IDs
    const projectTag = encodeProjectIdToTag(projectId);
    const relevantTasks = allTasks.filter((task) => {
      // Check if task has the project tag
      const hasProjectTag = task.tags.some(([tag]) => tag === projectTag);
      if (!hasProjectTag) return false;

      // Extract task ID from task tags
      const taskIdTag = task.tags.find(([tag]) =>
        tag.startsWith(TASK_ID_TAG_PREFIX)
      );

      if (!taskIdTag) return false;

      try {
        const taskId = decodeTaskIdFromTag(taskIdTag[0] as any);
        return ids.has(taskId);
      } catch {
        return false;
      }
    });

    // Extract TaskMaster IDs from the relevant tasks
    const foundIds: TaskId[] = [];
    for (const task of relevantTasks) {
      const taskIdTag = task.tags.find(([tag]) =>
        tag.startsWith(TASK_ID_TAG_PREFIX)
      );
      if (taskIdTag) {
        try {
          const taskId = decodeTaskIdFromTag(taskIdTag[0] as any);
          foundIds.push(taskId);
        } catch (error) {
          console.warn(
            `⚠️  Failed to decode task ID from tag: ${taskIdTag[0]}`
          );
        }
      }
    }

    console.log(`✅ Found ${foundIds.length} existing tasks in Taiga`);
    return Schema.decodeSync(TaskTrackerTasksResultSchema)(foundIds);
  };

  const addTasks = async (
    tasks: Map<TaskId, TaskText>,
    projectId: ProjectId
  ): Promise<void> => {
    console.log(`➕ Adding ${tasks.size} new tasks to Taiga...`);

    const projectTag = encodeProjectIdToTag(projectId);

    for (const [taskId, taskText] of tasks) {
      const taskIdTag = encodeTaskIdToTag(taskId);

      const createRequest: CreateTaskRequest = {
        project: taigaProjectId,
        subject: `TaskMaster Task ${taskId}`,
        description: taskText,
        tags: [projectTag, taskIdTag],
      };

      try {
        const createdTask = await api.tasks.create(createRequest);
        console.log(
          `  ✅ Created task ${taskId} (Taiga ID: ${createdTask.id})`
        );
      } catch (error) {
        console.error(`  ❌ Failed to create task ${taskId}:`, error);
        throw error;
      }
    }
  };

  const updateTasks = async (
    tasks: Map<TaskId, TaskText>,
    projectId: ProjectId
  ): Promise<void> => {
    console.log(`🔄 Updating ${tasks.size} existing tasks in Taiga...`);

    // First, find the Taiga tasks that correspond to our TaskMaster IDs
    const allTasks = await api.tasks.list({ project: taigaProjectId });
    const projectTag = encodeProjectIdToTag(projectId);

    for (const [taskId, taskText] of tasks) {
      const taskIdTag = encodeTaskIdToTag(taskId);

      // Find the Taiga task with this TaskMaster ID
      const taigaTask = allTasks.find((task) => {
        const hasProjectTag = task.tags.some(([tag]) => tag === projectTag);
        const hasTaskIdTag = task.tags.some(([tag]) => tag === taskIdTag);
        return hasProjectTag && hasTaskIdTag;
      });

      if (!taigaTask) {
        console.warn(
          `⚠️  Could not find Taiga task for TaskMaster ID ${taskId}`
        );
        continue;
      }

      const updateRequest: UpdateTaskRequest = {
        description: taskText,
        version: taigaTask.version,
      };

      try {
        await api.tasks.update(taigaTask.id, updateRequest);
        console.log(`  ✅ Updated task ${taskId} (Taiga ID: ${taigaTask.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to update task ${taskId}:`, error);
        throw error;
      }
    }
  };

  const renderTask = (task: TaskFileContent): TaskText => {
    // Render task into a comprehensive text format
    let text = `# ${task.title}\n\n`;
    text += `**Status:** ${task.status}\n`;
    text += `**Description:** ${task.description}\n\n`;

    if (task.priority) {
      text += `**Priority:** ${task.priority}\n`;
    }

    if (task.dependencies.length > 0) {
      text += `**Dependencies:** ${task.dependencies.join(", ")}\n`;
    }

    text += `## Details\n${task.details}\n\n`;
    text += `## Test Strategy\n${task.testStrategy}\n`;

    if (task.subtasks.length > 0) {
      text += `\n## Subtasks\n`;
      for (const subtask of task.subtasks) {
        text += `- **${subtask.title}** (${subtask.status})\n`;
        if (subtask.description) {
          text += `  ${subtask.description}\n`;
        }
      }
    }

    return Schema.decodeSync(TaskTextSchema)(text);
  };

  return {
    getTasks,
    addTasks,
    updateTasks,
    renderTask,
  };
};

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

    const api = taigaApiFactory.create({
      baseUrl: Schema.decodeSync(Url)("https://api.taiga.io"),
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
    const tasktrackerDeps = createTasktrackerDependencies(api, env.projectId);

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
