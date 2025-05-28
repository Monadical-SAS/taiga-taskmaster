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

// Environment validation
const validateEnvironment = () => {
  const required = ['TAIGA_USERNAME', 'TAIGA_PASSWORD', 'TAIGA_PROJECT_ID'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    console.error('Please set them in your .env file');
    process.exit(1);
  }
  
  return {
    username: process.env.TAIGA_USERNAME!,
    password: process.env.TAIGA_PASSWORD!,
    projectId: parseInt(process.env.TAIGA_PROJECT_ID!, 10),
  };
};

// TaskTracker implementation using Taiga API
const createTaskTrackerDeps = (api: TaigaApi, taigaProjectId: TaigaProjectId): SyncTasksDeps => {
  const getTasks = async (
    ids: Set<TaskId>,
    projectId: ProjectId
  ): Promise<TaskTrackerTasksResult> => {
    console.log(`🔍 Getting tasks for project ${projectId}, checking ${ids.size} IDs...`);
    
    // Get all tasks from the Taiga project
    const allTasks = await api.tasks.list({ project: taigaProjectId });
    console.log(`📋 Found ${allTasks.length} total tasks in Taiga project`);
    
    // Filter tasks that have our tags and match the requested IDs
    const projectTag = encodeProjectIdToTag(projectId);
    const relevantTasks = allTasks.filter(task => {
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
          console.warn(`⚠️  Failed to decode task ID from tag: ${taskIdTag[0]}`);
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
        console.log(`  ✅ Created task ${taskId} (Taiga ID: ${createdTask.id})`);
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
      const taigaTask = allTasks.find(task => {
        const hasProjectTag = task.tags.some(([tag]) => tag === projectTag);
        const hasTaskIdTag = task.tags.some(([tag]) => tag === taskIdTag);
        return hasProjectTag && hasTaskIdTag;
      });
      
      if (!taigaTask) {
        console.warn(`⚠️  Could not find Taiga task for TaskMaster ID ${taskId}`);
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
      text += `**Dependencies:** ${task.dependencies.join(', ')}\n`;
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

// Test data creation
const createTestTasks = (): UniqTaskFileContentList => {
  const tasks = [
    {
      id: 1,
      title: "Setup Project Infrastructure",
      description: "Initialize the project with proper tooling and structure",
      status: "pending" as const,
      dependencies: [],
      details: "This task involves setting up the basic project infrastructure including build tools, linting, testing framework, and CI/CD pipeline.",
      testStrategy: "Verify that all build commands work correctly and tests pass",
      subtasks: [],
    },
    {
      id: 2,
      title: "Implement Core API",
      description: "Create the main API endpoints for the application",
      status: "in-progress" as const,
      dependencies: [1],
      details: "Implement RESTful API endpoints with proper error handling, validation, and documentation.",
      testStrategy: "Unit tests for each endpoint, integration tests for API workflows",
      subtasks: [],
    },
    {
      id: 3,
      title: "Add Authentication System",
      description: "Implement user authentication and authorization",
      status: "pending" as const,
      dependencies: [2],
      details: "Add JWT-based authentication with refresh tokens, role-based access control, and session management.",
      testStrategy: "Test authentication flows, token validation, and access control scenarios",
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
    console.log(`✅ Authenticated as: ${authResponse.full_name} (${authResponse.email})\n`);
    
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
        description: "Updated: Initialize the project with proper tooling and structure",
        status: "pending" as const,
        dependencies: [],
        details: "This task involves setting up the basic project infrastructure including build tools, linting, testing framework, and CI/CD pipeline.",
        testStrategy: "Verify that all build commands work correctly and tests pass",
        subtasks: [],
      },
      {
        id: 2,
        title: "Implement Core API",
        description: "Create the main API endpoints for the application",
        status: "in-progress" as const,
        dependencies: [1],
        details: "Implement RESTful API endpoints with proper error handling, validation, and documentation.",
        testStrategy: "Unit tests for each endpoint, integration tests for API workflows",
        subtasks: [],
      },
      {
        id: 3,
        title: "Add Authentication System",
        description: "Implement user authentication and authorization",
        status: "pending" as const,
        dependencies: [2],
        details: "Add JWT-based authentication with refresh tokens, role-based access control, and session management.",
        testStrategy: "Test authentication flows, token validation, and access control scenarios",
        subtasks: [],
      },
    ];
    const updatedUniqTasks = Schema.decodeSync(UniqTaskFileContentList)(updatedTasks);
    
    await syncTasks(taskTrackerDeps)(updatedUniqTasks, projectId);
    console.log("✅ Second sync completed");
    
    console.log("\n🎉 TaskTracker test completed successfully!");
    console.log("✨ Tasks have been synchronized with Taiga");
    
  } catch (error) {
    console.error("❌ Test failed:", error instanceof Error ? error.message : error);
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