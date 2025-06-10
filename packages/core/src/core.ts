import type { GenerateTasksF } from "@taiga-task-master/taskmaster-interface";
import type { SyncTasksF } from "@taiga-task-master/tasktracker-interface";
import {
  bang,
  castNonNegativeInteger,
  type NonEmptyString,
  type NonNegativeInteger,
  PrdText,
  type PrdTextHash, // eslint-disable-line @typescript-eslint/no-unused-vars
  SINGLETON_PROJECT_ID,
  type TaskId,
} from "@taiga-task-master/common";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Either, HashSet, Option, pipe } from "effect";
import { HashMap, Array } from "effect";
import type { NonEmptyArray } from "effect/Array";

export type GenerateTasksDeps = {
  taskmaster: {
    generateTasks: ReturnType<GenerateTasksF>;
  };
  tasktracker: {
    syncTasks: ReturnType<SyncTasksF>;
  };
};

// main happy flow after we got PRD from somewhere
// don't get it mixed with generateTasks of taskmaster
export const generateTasks =
  (di: GenerateTasksDeps) =>
  async (prd: PrdText): Promise<NonNegativeInteger> => {
    const tasks = await di.taskmaster.generateTasks(
      prd,
      Option.none(/*for update*/)
    );
    const _: void = await di.tasktracker.syncTasks(
      tasks.tasks,
      SINGLETON_PROJECT_ID
    );
    return castNonNegativeInteger(tasks.tasks.length);
  };

// FOLLOWING IS DATA MODELING WIP

// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars
namespace TasksMachine {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  type Tasks = HashMap.HashMap<TaskId, {}>;
  type ArtifactId = NonEmptyString;
  type Artifact = {
    id: ArtifactId;
    // invariant: artifact tasks + normal tasks constitute tasks.json content completely
    // only "completed"
    // invariant: always at least 1 (MVP: normally just 1)
    tasks: Tasks & {
      /*status: completed... TODO*/
    };
  };
  // invariant: task ids are uniq
  export type State = {
    // task id is the same as taskid of taskmaster; both within the scope of 1 project of course
    // we always know next task; implementation detail - taskmaster cli - but also we can procure this from json/task system:
    // https://github.com/eyaltoledano/claude-task-master/blob/41d9dbbe6d840b2e86bccbb5e53e2895bd1bebe3/scripts/modules/task-manager/find-next-task.js#L24
    //  * Return the next work item:
    //  *   •  Prefer an eligible SUBTASK that belongs to any parent task
    //  *      whose own status is `in-progress`.
    //  *   •  If no such subtask exists, fall back to the best top-level task
    // those are not ALL the tasks; we have "done" tasks but not merged yet; we can have a "done" non-merged task edited - that's a command to redo/cleanup
    // the "Tasks" is a black box. we do have a function "get next task" from them, as well as "mark completed" etc but for the concern of the machine it's a black box.
    tasks: Tasks;
    timestamp: NonNegativeInteger;
    artifacts: Array<Artifact>;
    taskExecutionState: TaskExecution.TaskExecutionState;
  };

  // export const solvePrd
  // "solve prd" won't make sense: a PRD causes a bunch of tasks to be appended to whatever tasks we have (in MVP situation, to empty array...), then iterative process starts; where state is rather a part of a state machine.

  const uniqAppend = (tx1: Tasks, tx2: Tasks) => {
    const r = HashMap.union(tx1, tx2);
    const expected = [tx1, tx2].map(HashMap.size).reduce((a, b) => a + b, 0);
    if (HashMap.size(r) !== expected)
      throw new Error(
        `panic! uniqAppend argument keys intersect: ${pipe(HashMap.keySet(tx2), HashSet.intersection(HashMap.keySet(tx1)))}`
      );
    return r;
  };

  const anyKeyIntersection = (tx1: Tasks, tx2: Tasks) => {
    return (
      pipe(
        HashMap.keySet(tx1),
        HashSet.intersection(HashMap.keySet(tx2)),
        HashSet.size
      ) > 0
    );
  };

  const allTasks = (s: State) =>
    s.artifacts.reduce((a, b) => uniqAppend(a, b.tasks), s.tasks);

  // simplest operation, add more tasks
  export const appendTasks =
    (tasks: Tasks) =>
    (s: State): State => {
      if (anyKeyIntersection(allTasks(s), tasks)) {
        throw new Error(
          `panic! tasks to append will create duplicates: ${pipe(
            allTasks(s),
            HashMap.keySet,
            HashSet.intersection(HashMap.keySet(tasks)),
            HashSet.toValues,
            (a) => a.join()
          )}`
        );
      }
      return {
        ...s,
        tasks: uniqAppend(s.tasks, tasks),
      };
    };

  // export const editTask TODO - can edit only the non-committed tasks; that destroys the edited task's artifact and all follow-up artifacts, if exist

  // only the first task in queue can be committed
  export const commitArtifact =
    (aid: ArtifactId) =>
    (s: State): State => {
      if (s.artifacts.length === 0) {
        throw new Error(
          `panic! artifact ${aid} not found in pending artifacts, moreover artifacts are empty`
        );
      }
      const artifacts = s.artifacts as NonEmptyArray<Artifact>;
      const artifact = bang(s.artifacts[0]);
      const tasks = artifact.tasks;
      if (HashMap.size(tasks) === 0) {
        throw new Error(
          `panic! artifact tasks size invariant violation: an artifact always has at least 1 task`
        );
      }
      // TODO validate every is complete additionally, otherwise we risk forever loops
      // if (HashMap.values(tasks))
      if (artifact.id !== aid)
        throw new Error(
          `panic! artifact to commit ${aid} isn't next in line; expected ${artifact.id}`
        );
      return {
        ...s,
        artifacts: Array.tailNonEmpty(artifacts),
        tasks: pipe(uniqAppend(s.tasks, tasks)),
      };
    };

  // TODO add artifact (move tasks from tasks to artifacts)
  // TODO make sure the tasks are "completed" when they are supposed to be.
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace TaskExecution {
  // assumption is: it goes over a Session. session is named per task and cleared before and after task execution is running
  // goose both starts and resumes a session with "goose session --name NAME".
  // to remove a session, `goose session remove -r "project-.*"` (with regex). we unlikely have good ID at this point (will require "session list" command parsing)
  export type TaskExecutionState = {
    agentExecutionState: AgentExecution.AgentExecutionState;
  };
  // task execution will be responsible for retries for errors, summarization retries, "business retries" when task wasn't successfully completed
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace AgentExecution {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const events = ["started", "success", "error"]; // TODO
  // always make sure that whatever the Execution mutates in *already defined* state is returned as value, not a silend mutation. the Execution can really mutate a LOT so we don't pay attention on every possible mutation, only on the mutations that touch our defined state
  export type AgentExecutionState =
    | {
        step: "running"; // when cli is actively running a command
        history: string; // chat history, usually it's represented as Message[] but we don't see / can't care about this level of granularity
        process: {
          pid: number;
        }; // process reference, TBD
      }
    | {
        step: "stopped"; // for whatever reason. can be when the cli finished and returned success, or returned an error (e.g. token limit, billing error)
      };
  export const state0: AgentExecutionState = {
    step: "stopped",
  };

  // promise only signifies that the command went there. we have no indication if it's finished or not
  export const summarize = async (
    s: AgentExecutionState & { step: "running" }
  ): Promise<AgentExecutionState> => {
    // TODO do something with the process... it's still considered running
    // we also have to
    return s;
  };
}
