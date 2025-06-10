/* eslint-disable functional/no-expression-statements */
// @vibe-generated: conforms to tasktracker-interface
import { Schema } from "effect";
import { TaskId, ProjectId, TaskFileContent } from "@taiga-task-master/common";
import {
  syncTasks as syncTasksInterface,
  type SyncTasksDeps,
  type TaskText,
  TaskText as TaskTextSchema,
  encodeTaskIdToTag,
  encodeProjectIdToTag,
  filterTasks,
} from "@taiga-task-master/tasktracker-interface";
import {
  type TaigaApi,
  ProjectId as TaigaProjectId,
  type CreateUserStoryRequest,
  type UpdateUserStoryRequest,
} from "@taiga-task-master/taiga-api-interface";

type TaskTrackerTasksResult = Set<TaskId>;

// Re-export the interface function with proper dependency injection
export const syncTasks = syncTasksInterface;

// TaskTracker implementation using Taiga API
export const createTaskTrackerDeps = (
  api: TaigaApi,
  taigaProjectId: TaigaProjectId
): SyncTasksDeps => {
  const addTasks = async (
    tasks: Map<TaskId, TaskText>,
    projectId: ProjectId
  ): Promise<void> => {
    console.log(`➕ Adding ${tasks.size} new tasks to Taiga...`);

    const projectTag = encodeProjectIdToTag(projectId);

    const createTasks = Array.from(tasks.entries()).map(
      async ([taskId, taskText]) => {
        const taskIdTag = encodeTaskIdToTag(taskId);

        const createRequest: CreateUserStoryRequest = {
          project: taigaProjectId,
          subject: `TaskMaster Task ${taskId}`,
          description: taskText,
          tags: [projectTag, taskIdTag],
        };

        try {
          const createdTask = await api.userStories.create(createRequest);
          console.log(
            `  ✅ Created task ${taskId} (Taiga ID: ${createdTask.id})`
          );
          return createdTask;
        } catch (error) {
          console.error(`  ❌ Failed to create task ${taskId}:`, error);
          throw error;
        }
      }
    );

    await Promise.all(createTasks);
  };

  const updateTasks = async (
    tasks: Map<TaskId, TaskText>,
    projectId: ProjectId
  ): Promise<void> => {
    console.log(`🔄 Updating ${tasks.size} existing tasks in Taiga...`);

    // Use the robust filtering logic from tasktracker-interface
    const allTasks = await api.userStories.list({ project: taigaProjectId });
    const expectedTaskIds = new Set(tasks.keys());
    const filteredResult = filterTasks(expectedTaskIds, allTasks, projectId);

    // Log warnings for any issues found
    if (filteredResult.warnings.length > 0) {
      console.warn(
        `⚠️  Found ${filteredResult.warnings.length} task parsing warnings`
      );
    }
    if (filteredResult.missing.size > 0) {
      console.warn(
        `⚠️  Missing tasks in Taiga: ${Array.from(filteredResult.missing).join(", ")}`
      );
    }
    if (filteredResult.dupes.size > 0) {
      console.warn(
        `⚠️  Duplicate tasks found: ${Array.from(filteredResult.dupes).join(", ")}`
      );
    }

    const updatePromises = Array.from(filteredResult.valid.entries()).map(
      async ([taskId, validTask]) => {
        const taskText = tasks.get(taskId);
        if (!taskText) {
          console.warn(`⚠️  No text provided for task ${taskId}`);
          return;
        }

        const updateRequest: UpdateUserStoryRequest = {
          description: taskText,
          version: validTask.version,
        };

        try {
          await api.userStories.update(validTask.id, updateRequest);
          console.log(
            `  ✅ Updated task ${taskId} (Taiga ID: ${validTask.id})`
          );
        } catch (error) {
          console.error(`  ❌ Failed to update task ${taskId}:`, error);
          throw error;
        }
      }
    );

    await Promise.all(updatePromises);
  };

  const renderTask = (task: TaskFileContent): TaskText => {
    // Render task into a comprehensive text format
    const baseLines = [
      `# ${task.title}\n`,
      `**Status:** ${task.status}\n`,
      `**Description:** ${task.description}\n\n`,
    ];

    const priorityLines = task.priority
      ? [`**Priority:** ${task.priority}\n`]
      : [];

    const dependencyLines =
      task.dependencies.length > 0
        ? [`**Dependencies:** ${task.dependencies.join(", ")}\n`]
        : [];

    const detailLines = [
      `## Details\n${task.details}\n\n`,
      `## Test Strategy\n${task.testStrategy}\n`,
    ];

    const subtaskLines =
      task.subtasks.length > 0
        ? [
            `\n## Subtasks\n`,
            ...task.subtasks.map((subtask) => {
              const subtaskLine = `- **${subtask.title}** (${subtask.status})\n`;
              const descLine = subtask.description
                ? `  ${subtask.description}\n`
                : "";
              return subtaskLine + descLine;
            }),
          ]
        : [];

    const allLines = [
      ...baseLines,
      ...priorityLines,
      ...dependencyLines,
      ...detailLines,
      ...subtaskLines,
    ];

    const text = allLines.join("");
    return Schema.decodeSync(TaskTextSchema)(text);
  };

  return {
    getTasks: {
      // limits are not specified https://docs.taiga.io/api.html#tasks-list
      apiList: (projectId: ProjectId) => {
        const projectTag = encodeProjectIdToTag(projectId);
        return api.userStories.list({
          project: taigaProjectId,
          tags: [projectTag],
        });
      },
    },
    addTasks,
    updateTasks,
    renderTask,
  };
};

// Export types for consumers
export type { SyncTasksDeps, TaskText, TaskTrackerTasksResult };
