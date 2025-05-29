import {
  TaskId,
  NonEmptyString,
  ProjectId,
  TaskFileContent,
  type UniqTaskFileContentList,
  bang,
} from "@taiga-task-master/common";
import { HashSet, Option, ParseResult, pipe, Schema, Tuple } from "effect";
import { filterMap, partition, partitionMap } from "effect/Array";
import { Unexpected } from "effect/ParseResult";
import {
  decodeProjectIdFromTag,
  decodeTaskIdFromTag,
  encodeProjectIdToTag,
  encodeTaskIdToTag,
  ProjectIdTag,
  TaskIdTag,
} from "./tags.js";
import {
  ProjectId as TaigaProjectId,
  TaskDetail,
  type TasksService,
} from "@taiga-task-master/taiga-api-interface";
import { Either } from "effect";
import { isSome, none, some } from "effect/Option";
import { isLeft, left, right } from "effect/Either";
import { omit } from "effect/Struct";
export * from "./tags.js";

export const TaskText = NonEmptyString.pipe(Schema.brand("TaskText"));

export type TaskText = typeof TaskText.Type;

export type TaskTrackerTasksResult = Set<TaskId>;

export type SyncTasksDeps = {
  getTasks: {
    // let the implementor no choice but use our filtering code
    apiList: () => Promise<readonly TaskDetail[]>;
  };
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
  const idsToUpdateOrCreate = new Set(tasks.map((t) => t.id));
  // note that there's no concurrent modification guarantees
  const currentIds = await getTasks(di.getTasks)(
    idsToUpdateOrCreate,
    projectId
  );
  const [toAdd, toUpdate] = pipe(
    tasks,
    partition((t) => currentIds.has(t.id))
  );
  const renderTasks = (tasks: TaskFileContent[]) => {
    return new Map(tasks.map((t) => Tuple.make(t.id, di.renderTask(t))));
  };
  await Promise.all([
    di.addTasks(renderTasks(toAdd), projectId),
    di.updateTasks(renderTasks(toUpdate), projectId),
  ]);
};

// it's possible to have important stuff from the task deleted or edited out; we can't work with those anymore - so we don't let them into the app and report
export const ValidTask = Schema.extend(
  TaskDetail.pipe(Schema.omit("tags")),
  Schema.Struct({
    masterId: TaskId,
    masterProjectId: ProjectId,
  })
);

export type ValidTask = typeof ValidTask.Type;

export const ValidTaskTransformation = Schema.transformOrFail(
  Schema.typeSchema(TaskDetail),
  Schema.typeSchema(ValidTask),
  {
    strict: true,
    decode: (taigaTask) => {
      const [projectIdTags, taskIdTags] = splitByProjectIdAndTaskIdTags(
        taigaTask.tags
      );
      if (projectIdTags.length !== 1) {
        return ParseResult.fail(
          new Unexpected(
            `projectIdTags length in taiga task ${taigaTask.id} is ${projectIdTags.length}`
          )
        );
      }
      if (taskIdTags.length !== 1) {
        return ParseResult.fail(
          new Unexpected(
            `taskIdTags length in taiga task ${taigaTask.id} is ${taskIdTags.length}`
          )
        );
      }
      const projectId = pipe(bang(projectIdTags[0]), decodeProjectIdFromTag);
      const taskId = pipe(bang(taskIdTags[0]), decodeTaskIdFromTag);
      return ParseResult.succeed({
        ...pipe(taigaTask, omit("tags")),
        masterId: taskId,
        masterProjectId: projectId,
      });
    },
    encode: (validatedTask) => {
      return ParseResult.succeed({
        ...pipe(validatedTask, omit("masterId", "masterProjectId")),
        // we forcefully write null here; in the API terms it means "color". this corrupts data a little bit but we don't care right now
        tags: [
          Tuple.make(encodeProjectIdToTag(validatedTask.masterProjectId), null),
          Tuple.make(encodeTaskIdToTag(validatedTask.masterId), null),
        ],
      });
    },
  }
);

// TODO add tests
export const filterTasks = (
  expected: Set<TaskId>,
  allTasks: readonly TaskDetail[],
  projectId: ProjectId
): {
  valid: Map<TaskId, ValidTask>;
  unrelatedProject: Set<TaskId>;
  extra: Set<TaskId>;
  missing: Set<TaskId>;
  warnings: ParseResult.ParseError[];
  dupes: Set<TaskId>;
} => {
  const decode = (t: TaskDetail, _: number) =>
    Schema.decodeEither(ValidTaskTransformation)(t);
  const filteredTasks = allTasks.map(decode).reduce(
    (
      acc: {
        valid: Map<TaskId, ValidTask>;
        dupes: Set<TaskId>;
        unrelatedProject: Set<TaskId>;
        extra: Set<TaskId>;
        warnings: ParseResult.ParseError[];
      },
      e
    ) => {
      if (isLeft(e)) {
        console.info(
          `a project manager task format was wrong, ignoring: ${ParseResult.TreeFormatter.formatErrorSync(e.left)}`
        );
        return {
          ...acc,
          warnings: [...acc.warnings, e.left],
        };
      }
      const t = e.right;
      if (t.masterProjectId !== projectId) {
        // silently ignore, a TaskManager project can contain bigger variety of tasks than just the managed tasks
        return {
          ...acc,
          unrelatedProject: acc.unrelatedProject.add(t.masterId),
        };
      }
      if (!expected.has(t.masterId)) {
        console.info(
          `a master project ${projectId} has an expected task with master id ${t.masterId}: ${t.id}`
        );
        return {
          ...acc,
          extra: acc.extra.add(t.masterId),
        };
      }
      if (acc.valid.has(t.masterId)) {
        console.info(
          `a task of master project ${projectId} ${t.masterId}: ${t.id} is duped`
        );
        acc.valid.delete(t.masterId);
        return {
          ...acc,
          // valid already mutated
          dupes: acc.dupes.add(t.masterId),
        };
      }
      return {
        ...acc,
        valid: acc.valid.set(t.masterId, t),
      };
    },
    {
      valid: new Map<TaskId, ValidTask>(),

      unrelatedProject: new Set<TaskId>(),
      extra: new Set<TaskId>(),
      warnings: [] as ParseResult.ParseError[],
      dupes: new Set<TaskId>(),
    }
  );
  const found = HashSet.make(...filteredTasks.valid.keys());
  const notFound = pipe(
    HashSet.make(...expected.values()),
    HashSet.difference(found)
  );
  return {
    ...filteredTasks,
    missing: new Set(HashSet.values(notFound)),
  };
};

const getTasks =
  (deps: SyncTasksDeps["getTasks"]) =>
  async (ids: Set<TaskId>, projectId: ProjectId): Promise<Set<TaskId>> => {
    // *all* tasks from the *Taiga* project
    const allTasks = await deps.apiList();
    const relevantTasks = filterTasks(ids, allTasks, projectId).valid;
    return new Set(relevantTasks.keys());
  };

function splitByProjectIdAndTaskIdTags(
  tags: TaskDetail["tags"]
): [ProjectIdTag[], TaskIdTag[]] {
  return pipe(
    tags,
    filterMap(
      ([tt]): Option.Option<
        | {
            tag: ProjectIdTag;
            type: "projectId";
          }
        | {
            tag: TaskIdTag;
            type: "taskId";
          }
      > => {
        const projectIdTag = Schema.decodeOption(ProjectIdTag)(tt);
        if (isSome(projectIdTag)) {
          return some({
            tag: projectIdTag.value,
            type: "projectId",
          });
        }
        const taskIdTag = Schema.decodeOption(TaskIdTag)(tt);
        if (isSome(taskIdTag)) {
          return some({
            tag: taskIdTag.value,
            type: "taskId",
          });
        }
        return none();
      }
    ),
    partitionMap((v): Either.Either<TaskIdTag, ProjectIdTag> => {
      return v.type === "taskId" ? right(v.tag) : left(v.tag);
    })
  );
}
