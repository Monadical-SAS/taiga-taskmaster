import { ParseResult, Redacted, Schema } from "effect";
import { Unexpected } from "effect/ParseResult";
import { bang, NonEmptyString, PositiveInteger } from "./common.js";

export const TaskId = PositiveInteger.pipe(Schema.brand("TaskId"));

export type TaskId = typeof TaskId.Type;

// note that project id in Taskmaster (this one) doesn't have to do anything with ProjectId in Taiga
export const ProjectId = NonEmptyString.pipe(Schema.brand("ProjectId"));

export type ProjectId = typeof ProjectId.Type;

// only 1 for now, TODO for removal
export const SINGLETON_PROJECT_ID = "taskmaster-test" as ProjectId;

export const SubtaskId = PositiveInteger.pipe(Schema.brand("SubtaskId"));

export const SubtaskIdFull = Schema.Tuple(TaskId, SubtaskId);

export type SubtaskIdFull = Schema.Schema.Type<typeof SubtaskIdFull>;

// task-master denotes subtasks ids in arbitrary way: it can be integer 1 or a string "2.1" - both equals to each other
// we throw away the task number here in that case to conform to their docs
const SubtaskIdFromString = Schema.transformOrFail(
  Schema.String,
  Schema.RedactedFromSelf(SubtaskId),
  {
    strict: true,
    decode: (s) => {
      const a = s.split(".");
      if (a.length !== 2)
        return ParseResult.fail(
          new Unexpected(`subtasks length isn't 2: ${a.length}`)
        );
      return ParseResult.map(
        ParseResult.decode(Schema.compose(Schema.NumberFromString, SubtaskId))(
          bang(a[1])
        ),
        Redacted.make
      );
    },
    encode: (n, _, ast) => {
      return ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          n,
          "Encoding bugged subtask string back is prohibited."
        )
      );
    },
  }
);

// continuation of fixing taskmaster bug
const SubtaskIdFromStringOrAllOk = Schema.transformOrFail(
  Schema.Union(Schema.String, Schema.Number),
  Schema.RedactedFromSelf(SubtaskId),
  {
    strict: true,
    decode: (s) => {
      if (typeof s === "string")
        return ParseResult.decode(SubtaskIdFromString)(s);
      return ParseResult.map(ParseResult.decode(SubtaskId)(s), Redacted.make);
    },
    encode: (n, _, ast) => {
      return ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          n,
          "Encoding bugged subtask string back is prohibited."
        )
      );
    },
  }
);

const TaskStatus = Schema.Literal("done", "pending", "in-progress");

const SubtaskFileContent = Schema.Struct({
  id: SubtaskIdFromStringOrAllOk,
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
  status: TaskStatus,
  dependencies: Schema.optionalWith(Schema.Array(SubtaskId), {
    default: () => [],
  }),
  details: Schema.optional(Schema.String),
  testStrategy: Schema.optional(Schema.String),
});

const TaskFileContentBase = Schema.Struct({
  id: TaskId,
  title: Schema.NonEmptyString,
  description: Schema.String,
  status: TaskStatus,
  dependencies: Schema.Array(TaskId),
  priority: Schema.optional(Schema.String),
  details: Schema.String,
  testStrategy: Schema.String,
  subtasks: Schema.Array(SubtaskFileContent),
});

const TaskFileContent = TaskFileContentBase.pipe(
  Schema.filter(
    (input) => {
      const subtaskIds = new Set(
        input.subtasks.map((subtask) => Redacted.value(subtask.id))
      );
      return input.subtasks.every((subtask) =>
        subtask.dependencies.every((depId) => subtaskIds.has(depId))
      );
    },
    {
      message: () =>
        "Subtask dependency validation failed: one or more subtasks depend on non-existent subtasks",
    }
  )
);

// mix https://github.com/eyaltoledano/claude-task-master/blob/main/docs/task-structure.md and real data that are different from each other
export const TasksFileContent = Schema.Struct({
  tasks: Schema.Array(TaskFileContent),
}).pipe(
  Schema.filter(
    (input) => {
      // Extract all task IDs
      const taskIds = new Set(input.tasks.map((task) => task.id));
      if (taskIds.size !== input.tasks.length)
        return new Unexpected("task ids ain't uniq");
      // Check each task's dependencies are present
      return input.tasks.every((task) =>
        task.dependencies.every((depId) => taskIds.has(depId))
      );
    },
    {
      message: () =>
        "Task dependency validation failed: one or more tasks depend on non-existent tasks",
    }
  )
);

export type TasksFileContent = typeof TasksFileContent.Type;
