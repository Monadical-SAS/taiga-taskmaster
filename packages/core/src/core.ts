import type { GenerateTasksF } from "@taiga-task-master/taskmaster-interface";
import type { SyncTasksF } from "@taiga-task-master/tasktracker-interface";
import {
  bang,
  castNonEmptyArray,
  castNonNegativeInteger,
  type NonEmptyString,
  type NonNegativeInteger,
  oneOrNone,
  PrdText,
  SINGLETON_PROJECT_ID,
  type TaskId,
} from "@taiga-task-master/common";
import { HashSet, Option, pipe, Tuple } from 'effect';
import { HashMap, Array } from "effect";
import { isEmptyArray, isNonEmptyArray, type NonEmptyArray, tailNonEmpty } from 'effect/Array';
import { isNone, isSome } from "effect/Option";
import { Tuple as TupleType } from 'effect';

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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TasksMachine {
  export type Task = unknown;
  export type NextTaskF = (tx: Tasks) => Option.Option<[TaskId, Task]>;
  export type Tasks = HashMap.HashMap<TaskId, Task>;
  // artifact id could be generated branch name
  export type ArtifactId = NonEmptyString;
  export type Artifact = {
    id: ArtifactId;
    // invariant: artifact tasks + normal tasks constitute tasks.json content completely
    // only "completed"
    // invariant: always at least 1 (MVP: normally just 1)
    tasks: Tasks;
  };
  export const state0: State = {
    tasks: HashMap.empty(),
    taskExecutionState: {
      step: 'stopped'
    },
    outputTasks: [],
    artifacts: [],
  }
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
    taskExecutionState: TaskExecution.TaskExecutionState;
    outputTasks: [TaskId, Task][];
    artifacts: Array<Artifact>;
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

  export const startTaskExecution = (tid: TaskId) => (s: State): State => {
    const task = HashMap.get(s.tasks, tid);
    if (isNone(task)) {
      throw new Error(`panic! cannot start task execution: no such task`);
    }
    if (s.taskExecutionState.step !== "stopped") {
      throw new Error(
        `panic! cannot start task execution: task execution already in progress`
      );
    }
    return {
      ...s,
      tasks: HashMap.remove(s.tasks, tid),
      taskExecutionState: {
        ...s.taskExecutionState,
        step: 'running' as const,
        task: Tuple.make(tid, task.value),
      },
    }
  }

  export const endTaskExecution = (s: State): State => {
    const executionState = s.taskExecutionState;
    if (executionState.step !== 'running') throw new Error(`panic! cannot end task execution: task execution not in progress`)
    return {
      ...s,
      taskExecutionState: {
        ...executionState,
        step: 'stopped' as const,
      },
      outputTasks: [...s.outputTasks, executionState.task]
    }
  }

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
        artifacts: Array.tailNonEmpty(artifacts)
      };
    };

  export const addArtifact =
    (artifactId: ArtifactId) =>
    (s: State): State => {
      if (!isNonEmptyArray(s.outputTasks)) {
        throw new Error(
          `panic! cannot create artifact ${artifactId}: no tasks to add`
        );
      }
      const [taskId, task] = s.outputTasks[0];
      if (HashMap.has(s.tasks, taskId)) {
        throw new Error(`panic! invalid state: ${taskId} is in non-started tasks`)
      }

      if (s.artifacts.some((artifact) => artifact.id === artifactId)) {
        throw new Error(`panic! Artifact with id ${artifactId} already exists`);
      }

      const newArtifact: Artifact = {
        id: artifactId,
        tasks: HashMap.make([taskId, task]),
      };

      return {
        ...s,
        outputTasks: tailNonEmpty(s.outputTasks),
        artifacts: [...s.artifacts, newArtifact],
      };
    };

  // remove last n artifacts
  const removeArtifacts =
    (n: NonNegativeInteger) =>
    (s: State): [State, NonEmptyArray<ArtifactId>] => {
      if (s.artifacts.length === 0) {
        throw new Error(`panic! cannot remove artifacts: artifacts are empty`);
      }
      if (n > s.artifacts.length) {
        throw new Error(
          `panic! cannot remove artifacts: requested ${n} artifacts, but only ${s.artifacts.length} available`
        );
      }
      const [take, keep] = Array.partition(
        s.artifacts,
        (_, i) => i < s.artifacts.length - n
      );
      const tasksToReturn = take.reduce(
        (a, b) => uniqAppend(a, b.tasks),
        HashMap.empty() as Tasks
      );
      return [
        {
          ...s,
          artifacts: keep,
          tasks: uniqAppend(s.tasks, tasksToReturn),
        },
        castNonEmptyArray(take.map((a) => a.id)),
      ];
    };

  // edited task checks whether it's in artifacts already: if is, the artifact and all the artifacts after it get removed.
  export const editTask =
    (tid: TaskId, t: Task /*TODO task shape*/) =>
    (s: State): [State, ArtifactId[]] => {
      // check if we do have a non-completed task to edit
      const task = HashMap.get(s.tasks, tid);
      if (isSome(task)) {
        // trivial:
        return [
          {
            ...s,
            tasks: pipe(s.tasks, HashMap.set(tid, t)),
          },
          [],
        ];
      }
      const artifact = pipe(
        s.artifacts,
        Array.filterMap((a) => {
          const here = HashMap.get(a.tasks, tid);
          return pipe(
            here,
            Option.map((task) => ({
              id: a.id,
              task,
            }))
          );
        }),
        oneOrNone
      );
      if (isNone(artifact)) {
        throw new Error(
          `panic! cannot edit task ${tid}: no such task in artifacts neither in current tasks`
        );
      }
      // the artifact and all artifacts before it have to go
      const tail =
        s.artifacts.length -
        s.artifacts.findIndex((a) => a.id === artifact.value.id);
      return pipe(
        removeArtifacts(castNonNegativeInteger(tail))(s),
        TupleType.mapFirst(s => ({
          ...s,
          tasks: pipe(s.tasks, HashMap.set(tid, t))
        }))
      );
    };

  // anything non-crucial
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Utils {
    export const liftTasks = (id: TaskId, t: Task): Tasks => {
      return HashMap.make(Tuple.make(id, t))
    }
    export const appendTask = (id: TaskId, t: Task) => (s: State): State => {
      return appendTasks(liftTasks(id, t))(s);
    }
    export const getTask = (id: TaskId) => (s: State): Option.Option<Task> => {
      return HashMap.get(s.tasks, id);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace TaskExecution {
  // assumption is: it goes over a Session. session is named per task and cleared before and after task execution is running
  // goose both starts and resumes a session with "goose session --name NAME".
  // to remove a session, `goose session remove -r "project-.*"` (with regex). we unlikely have good ID at this point (will require "session list" command parsing)
  export type TaskExecutionState = AgentExecution.AgentExecutionState & ({step: "running", task: [TaskId, TasksMachine.Task]} |  {step: "stopped"});
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

