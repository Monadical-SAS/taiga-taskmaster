import {
  TaskId,
  NonEmptyString,
  ProjectId,
  TaskFileContent,
  type UniqTaskFileContentList,
} from "@taiga-task-master/common";
import { pipe, Schema, Tuple } from "effect";
import { partition } from "effect/Array";
import { Unexpected } from "effect/ParseResult";
export * from "./tags.js";

export const TaskText = NonEmptyString.pipe(Schema.brand("TaskText"));

export type TaskText = typeof TaskText.Type;

export const TaskTrackerTasksResult = Schema.Array(TaskId).pipe(
  Schema.filter((ids) => {
    const idsS = new Set(ids);
    if (idsS.size !== ids.length) {
      return new Unexpected("tasks in tracker aren't uniq by master id");
    }
    return true;
  }),
  Schema.brand("TaskTrackerTasksResult")
);

export type TaskTrackerTasksResult = typeof TaskTrackerTasksResult.Type;
export type SyncTasksDeps = {
  getTasks: (
    ids: Set<TaskId>,
    projectId: ProjectId
  ) => Promise<TaskTrackerTasksResult>;
  addTasks: (
    tasks: Map<TaskId, TaskText>,
    projectId: ProjectId
  ) => Promise<void>;
  updateTasks: (
    tasks: Map<TaskId, TaskText>,
    projectId: ProjectId
  ) => Promise<void>;
  // renders into a text task; currently not reversable
  renderTask: (task: TaskFileContent) => TaskText;
};

export type SyncTasksF = (
  di: SyncTasksDeps
) => (tasks: UniqTaskFileContentList, projectId: ProjectId) => Promise<void>;

export const syncTasks: SyncTasksF = (di) => async (tasks, projectId) => {
  const newIdsS = new Set(tasks.map((t) => t.id));
  // note that there's no concurrent modification guarantees
  const currentIdsS = new Set(await di.getTasks(newIdsS, projectId));
  const [toAdd, toUpdate] = pipe(
    tasks,
    partition((t) => currentIdsS.has(t.id))
  );
  const renderTasks = (tasks: TaskFileContent[]) => {
    return new Map(tasks.map((t) => Tuple.make(t.id, di.renderTask(t))));
  };
  await Promise.all([
    di.addTasks(renderTasks(toAdd), projectId),
    di.updateTasks(renderTasks(toUpdate), projectId),
  ]);
};
