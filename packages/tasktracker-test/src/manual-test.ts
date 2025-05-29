// @vibe-generated: conforms to tasktracker-interface
import { Schema } from "effect";
import {
  TaskId,
  ProjectId,
  TaskFileContent,
  UniqTaskFileContentList,
  SINGLETON_PROJECT_ID,
  Url,
} from "@taiga-task-master/common";
import {
  syncTasks,
  type SyncTasksDeps,
  type TaskText,
  createTaskTrackerDeps,
} from "@taiga-task-master/tasktracker";
import { TaskText as TaskTextSchema } from "@taiga-task-master/tasktracker-interface";
import {
  type TaigaApi,
  ProjectId as TaigaProjectId,
} from "@taiga-task-master/taiga-api-interface";

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

// Use shared TaskTracker implementation from main package

// Test data creation
const createTestTasks = (): UniqTaskFileContentList => {
  const tasks = [
    {
      id: 1,
      title: "Setup Project Infrastructure",
      description: "Initialize the project with proper tooling and structure",
      status: "pending" as const,
      dependencies: [],
      details:
        "This task involves setting up the basic project infrastructure including build tools, linting, testing framework, and CI/CD pipeline.",
      testStrategy:
        "Verify that all build commands work correctly and tests pass",
      subtasks: [],
    },
    {
      id: 2,
      title: "Implement Core API",
      description: "Create the main API endpoints for the application",
      status: "in-progress" as const,
      dependencies: [1],
      details:
        "Implement RESTful API endpoints with proper error handling, validation, and documentation.",
      testStrategy:
        "Unit tests for each endpoint, integration tests for API workflows",
      subtasks: [],
    },
    {
      id: 3,
      title: "Add Authentication System",
      description: "Implement user authentication and authorization",
      status: "pending" as const,
      dependencies: [2],
      details:
        "Add JWT-based authentication with refresh tokens, role-based access control, and session management.",
      testStrategy:
        "Test authentication flows, token validation, and access control scenarios",
      subtasks: [],
    },
  ];

  return Schema.decodeSync(UniqTaskFileContentList)(tasks);
};

const main = async (): Promise<void> => {
  console.log("🧪 TaskTracker Test - Taiga Integration");
  console.log("=====================================\n");

  const env = validateEnvironment();
  console.log(`🌐 Using Taiga project ID: ${env.projectId}`);
  console.log(`👤 Username: ${env.username}\n`);

  try {
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

    // Create TaskTracker dependencies
    const taskTrackerDeps = createTaskTrackerDeps(api, env.projectId);

    // Create test tasks
    console.log("📝 Creating test tasks...");
    const testTasks = createTestTasks();
    console.log(`Created ${testTasks.length} test tasks\n`);

    // Test syncTasks functionality
    console.log("🔄 Testing syncTasks...");
    const projectId = SINGLETON_PROJECT_ID;

    console.log("\n--- First sync (should add new tasks) ---");
    await syncTasks(taskTrackerDeps)(testTasks, projectId);
    console.log("✅ First sync completed");

    console.log("\n--- Second sync (should update existing tasks) ---");
    // Create updated test tasks with modifications
    const updatedTasks = [
      {
        id: 1,
        title: "Setup Project Infrastructure",
        description:
          "Updated: Initialize the project with proper tooling and structure",
        status: "pending" as const,
        dependencies: [],
        details:
          "This task involves setting up the basic project infrastructure including build tools, linting, testing framework, and CI/CD pipeline.",
        testStrategy:
          "Verify that all build commands work correctly and tests pass",
        subtasks: [],
      },
      {
        id: 2,
        title: "Implement Core API",
        description: "Create the main API endpoints for the application",
        status: "in-progress" as const,
        dependencies: [1],
        details:
          "Implement RESTful API endpoints with proper error handling, validation, and documentation.",
        testStrategy:
          "Unit tests for each endpoint, integration tests for API workflows",
        subtasks: [],
      },
      {
        id: 3,
        title: "Add Authentication System",
        description: "Implement user authentication and authorization",
        status: "pending" as const,
        dependencies: [2],
        details:
          "Add JWT-based authentication with refresh tokens, role-based access control, and session management.",
        testStrategy:
          "Test authentication flows, token validation, and access control scenarios",
        subtasks: [],
      },
    ];
    const updatedUniqTasks = Schema.decodeSync(UniqTaskFileContentList)(
      updatedTasks
    );

    await syncTasks(taskTrackerDeps)(updatedUniqTasks, projectId);
    console.log("✅ Second sync completed");

    console.log("\n🎉 TaskTracker test completed successfully!");
    console.log("✨ Tasks have been synchronized with Taiga");
  } catch (error) {
    console.error(
      "❌ Test failed:",
      error instanceof Error ? error.message : error
    );
    if (error instanceof Error && error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
};

main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
