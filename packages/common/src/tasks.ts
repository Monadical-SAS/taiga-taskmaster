import { ParseResult, Redacted, Schema } from "effect"
import { bang, castPositiveInteger, PositiveInteger, type Prettify } from './index.js';
import { Unexpected } from "effect/ParseResult";

const TaskId = PositiveInteger.pipe(
  Schema.brand("TaskId")
);

const SubtaskId = PositiveInteger.pipe(
  Schema.brand("SubtaskId")
);

const SubtaskIdFull = Schema.Tuple(
  TaskId, SubtaskId
);

export type SubtaskIdFull = Schema.Schema.Type<typeof SubtaskIdFull>;



// task-master denotes subtasks ids in arbitrary way: it can be integer 1 or a string "2.1" - both equals to each other
// we throw away the task number here in that case to conform to their docs
const SubtaskIdFromString = Schema.transformOrFail(Schema.String, Schema.RedactedFromSelf(SubtaskId), {
  strict: true,
  decode: (s) => {
    const a = s.split('.');
    if (a.length !== 2) return ParseResult.fail(new Unexpected(`subtasks length isn't 2: ${a.length}`));
    return ParseResult.map(ParseResult.decode(Schema.compose(Schema.NumberFromString, SubtaskId))(bang(a[1])), Redacted.make)
  },
  encode: (n, _, ast) => {
    return ParseResult.fail(
      new ParseResult.Forbidden(
        ast,
        n,
        "Encoding bugged subtask string back is prohibited."
      )
    )
  }
})

// continuation of fixing taskmaster bug
const SubtaskIdFromStringOrAllOk = Schema.transformOrFail(
  Schema.Union(Schema.String, Schema.Number),
  Schema.RedactedFromSelf(SubtaskId),
  {
    strict: true,
    decode: (s) => {
      if (typeof s === "string") return ParseResult.decode(SubtaskIdFromString)(s);
      return ParseResult.map(ParseResult.decode(SubtaskId)(s), Redacted.make)
    },
    encode: (n, _, ast) => {
      return ParseResult.fail(
        new ParseResult.Forbidden(
          ast,
          n,
          "Encoding bugged subtask string back is prohibited."
        )
      )
    }
  }
)

const TaskStatus = Schema.Literal('done', 'pending', 'in-progress');

const SubtaskFileContent = Schema.Struct({
  id: SubtaskIdFromStringOrAllOk,
  title: Schema.NonEmptyString,
  description: Schema.optional(Schema.String),
  status: TaskStatus,
  dependencies: Schema.optional(Schema.Array(TaskId)),
  details: Schema.optional(Schema.String),
  testStrategy: Schema.optional(Schema.String)
})

const TaskFileContent = Schema.Struct({
  id: TaskId,
  title: Schema.NonEmptyString,
  description: Schema.String,
  status: TaskStatus,
  dependencies: Schema.Array(TaskId),
  priority: Schema.optional(Schema.String),
  details: Schema.String,
  testStrategy: Schema.String,
  subtasks: Schema.Array(SubtaskFileContent)
})

// mix https://github.com/eyaltoledano/claude-task-master/blob/main/docs/task-structure.md and real data that are different from each other
export const TasksFileContent = Schema.Struct({
  tasks: Schema.Array(
    TaskFileContent
  )
})