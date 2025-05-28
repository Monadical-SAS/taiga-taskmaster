import { TaskId, NonEmptyString } from "@taiga-task-master/common";
import { pipe, Schema, Tuple } from "effect";
import { partition } from "effect/Array";

export const TaskText = NonEmptyString.pipe(Schema.brand("TaskText"));

export type TaskText = typeof TaskText.Type;

export type TrackerTask = {
  // not "id" because tracker can have their own id; we're to figure out how to have our ids from their API docs
  masterId: TaskId;
};

export type SyncTasksDeps = {
  getTasks: (ids: Set<TaskId>) => Promise<TrackerTask[]>;
  addTasks: (tasks: [TaskId, TaskText][]) => Promise<void>;
  updateTasks: (tasks: [TaskId, TaskText][]) => Promise<void>;
  renderTask: (task: TrackerTask) => TaskText;
};

export type SyncTasksF = (
  di: SyncTasksDeps
) => (tasks: TrackerTask[]) => Promise<void>;

export const syncTasks: SyncTasksF = (di) => async (tasks) => {
  const newIdsS = new Set(tasks.map((t) => t.masterId));
  // note that there's no concurrent modification guarantees
  const currentIdsS = new Set(
    (await di.getTasks(newIdsS)).map((t) => t.masterId)
  );
  const [toAdd, toUpdate] = pipe(
    tasks,
    partition((t) => currentIdsS.has(t.masterId))
  );
  const renderTasks = (tasks: TrackerTask[]) =>
    tasks.map((t) => Tuple.make(t.masterId, di.renderTask(t)));
  await Promise.all([
    di.addTasks(renderTasks(toAdd)),
    di.updateTasks(renderTasks(toUpdate)),
  ]);
};
