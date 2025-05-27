import { Url, TaskId, NonEmptyString } from '@taiga-task-master/common';
import { pipe, Schema } from 'effect';
import { partition } from 'effect/Array';

export const TaskText = NonEmptyString.pipe(
  Schema.brand("TaskText")
)

export type TaskText = typeof TaskText.Type;

export type TrackerTask = {
  // not "id" because tracker can have their own id; we're to figure out how to have our ids from their API docs
  masterId: TaskId
}

// example that the methods can have their own deps; we'll serve them during their construction
// export type GetTasksDeps = {
//   httpGet: (url: Url/*TODO auth*/) => Promise<unknown>
// }
//
// export type AddTasksDeps = {
//   httpPost: (url: Url/*TODO auth*/, body: unknown/*TODO better typing*/) => Promise<unknown>
// }
//
// export type UpdateTasksDeps = {
//   httpPatch: (url: Url/*TODO auth*/, body: unknown/*TODO better typing*/) => Promise<unknown>
// }

export type SyncTasksDeps = {
  getTasks: (ids: Set<TaskId>) => Promise<TrackerTask[]>,
  addTasks: (tasks: TrackerTask[]) => Promise<void>,
  updateTasks: (tasks: TrackerTask[]) => Promise<void>,
  renderTask: (task: TrackerTask) => TaskText
}

export type SyncTasksF = (di: SyncTasksDeps) => (tasks: TrackerTask[]) => Promise<void>

export const syncTasks: SyncTasksF = (di) => async (tasks) => {
  const newIdsS = new Set(tasks.map(t => t.masterId));
  // note that there's no concurrent modification guarantees
  const currentIdsS = new Set((await di.getTasks(newIdsS)).map(t => t.masterId));
  const [toAdd, toUpdate] = pipe(tasks, partition(t => currentIdsS.has(t.masterId)));
  const _: [void, void] = await Promise.all([di.addTasks(toAdd), di.updateTasks(toUpdate)]);
}