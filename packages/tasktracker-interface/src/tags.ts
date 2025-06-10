import { Schema } from "effect";
import {
  type TaskId,
  type ProjectId,
  TaigaTag as TaigaTagSchema,
  TaskId as TaskIdSchema,
  ProjectId as ProjectIdSchema,
  TaskIdFromString,
} from "@taiga-task-master/common";
import { Unexpected } from "effect/ParseResult";

export const PROJECT_ID_TAG_PREFIX = "tm-project-" as const;
export const TASK_ID_TAG_PREFIX = "tm-task-" as const;

export const ProjectIdTag = TaigaTagSchema.pipe(
  Schema.filter((s) => {
    const isProjectIdTagFormat = s.startsWith(PROJECT_ID_TAG_PREFIX);
    if (!isProjectIdTagFormat) {
      return new Unexpected(`doesn't start with ${PROJECT_ID_TAG_PREFIX}`);
    }
  }),
  Schema.brand("ProjectIdTag")
);
export type ProjectIdTag = typeof ProjectIdTag.Type;

export const ProjectIdTagIsomorphism = Schema.transform(
  Schema.typeSchema(ProjectIdTag),
  Schema.typeSchema(ProjectIdSchema),
  {
    strict: true,
    decode: (projectIdTag) => {
      // given that it checks .startsWith, we can slice safely
      const taskIdString = projectIdTag.slice(PROJECT_ID_TAG_PREFIX.length);
      return Schema.decodeSync(ProjectIdSchema)(taskIdString);
    },
    encode: (projectId) => {
      const tagString = `${PROJECT_ID_TAG_PREFIX}${projectId}`;
      return Schema.decodeSync(ProjectIdTag)(tagString);
    },
  }
);

export const TaskIdTag = TaigaTagSchema.pipe(
  Schema.filter((s) => {
    const isTaskIdTagFormat = s.startsWith(TASK_ID_TAG_PREFIX);
    if (!isTaskIdTagFormat) {
      return new Unexpected(`doesn't start with ${TASK_ID_TAG_PREFIX}`);
    }
  }),
  Schema.brand("TaskIdTag")
);
export type TaskIdTag = typeof TaskIdTag.Type;

export const TaskIdTagIsomorphism = Schema.transform(
  Schema.typeSchema(TaskIdTag),
  Schema.typeSchema(TaskIdSchema),
  {
    strict: true,
    decode: (taskIdTag) => {
      // given that it checks .startsWith, we can slice safely
      const taskIdString = taskIdTag.slice(TASK_ID_TAG_PREFIX.length);
      return Schema.decodeSync(TaskIdFromString)(taskIdString);
    },
    encode: (taskId) => {
      const tagString = `${TASK_ID_TAG_PREFIX}${taskId}`;
      return Schema.decodeSync(TaskIdTag)(tagString);
    },
  }
);

export const encodeProjectIdToTag = (projectId: ProjectId): ProjectIdTag => {
  return Schema.encodeSync(ProjectIdTagIsomorphism)(projectId);
};

export const decodeProjectIdFromTag = (tag: ProjectIdTag): ProjectId => {
  return Schema.decodeSync(ProjectIdTagIsomorphism)(tag);
};

export const encodeTaskIdToTag = (taskId: TaskId): TaskIdTag => {
  return Schema.encodeSync(TaskIdTagIsomorphism)(taskId);
};

export const decodeTaskIdFromTag = (tag: TaskIdTag): TaskId => {
  return Schema.decodeSync(TaskIdTagIsomorphism)(tag);
};

export type { TaigaTag } from "@taiga-task-master/common";
