import { Schema } from "effect";
import {
  type TaskId,
  type ProjectId,
  TaigaTag as TaigaTagSchema,
  TaskId as TaskIdSchema,
  ProjectId as ProjectIdSchema,
} from "@taiga-task-master/common";

export const PROJECT_ID_TAG_PREFIX = "tm-project-" as const;
export const TASK_ID_TAG_PREFIX = "tm-task-" as const;

export const ProjectIdTag = TaigaTagSchema.pipe(Schema.brand("ProjectIdTag"));
export type ProjectIdTag = typeof ProjectIdTag.Type;

export const TaskIdTag = TaigaTagSchema.pipe(Schema.brand("TaskIdTag"));
export type TaskIdTag = typeof TaskIdTag.Type;

export const encodeProjectIdToTag = (projectId: ProjectId): ProjectIdTag => {
  const tagString = `${PROJECT_ID_TAG_PREFIX}${projectId}`;
  return Schema.decodeSync(ProjectIdTag)(tagString);
};

export const decodeProjectIdFromTag = (tag: ProjectIdTag): ProjectId => {
  const tagString = tag as string;
  if (!tagString.startsWith(PROJECT_ID_TAG_PREFIX)) {
    throw new Error(`Invalid project ID tag format: ${tagString}`);
  }
  const projectIdString = tagString.slice(PROJECT_ID_TAG_PREFIX.length);
  return Schema.decodeSync(ProjectIdSchema)(projectIdString);
};

export const encodeTaskIdToTag = (taskId: TaskId): TaskIdTag => {
  const tagString = `${TASK_ID_TAG_PREFIX}${taskId}`;
  return Schema.decodeSync(TaskIdTag)(tagString);
};

export const decodeTaskIdFromTag = (tag: TaskIdTag): TaskId => {
  const tagString = tag as string;
  if (!tagString.startsWith(TASK_ID_TAG_PREFIX)) {
    throw new Error(`Invalid task ID tag format: ${tagString}`);
  }
  const taskIdString = tagString.slice(TASK_ID_TAG_PREFIX.length);
  const taskIdNumber = parseInt(taskIdString, 10);
  if (isNaN(taskIdNumber) || taskIdNumber <= 0) {
    throw new Error(`Invalid task ID in tag: ${tagString}`);
  }
  return Schema.decodeSync(TaskIdSchema)(taskIdNumber);
};

export type { TaigaTag } from "@taiga-task-master/common";
