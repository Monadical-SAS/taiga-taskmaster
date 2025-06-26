import {
  Effect,
  Stream,
  pipe,
  Array as EffectArray,
  Context,
  Layer,
  Schedule,
  Config,
  Data,
  Clock,
  Duration,
  Option, Tuple, Console, HashMap
} from 'effect';
import { Command } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import {
  cyrb53,
  NonEmptyString,
  nonEmptyStringFromNumber,
  type NonNegativeInteger,
  castNonNegativeInteger,
  castNonEmptyString,
  type TaskId, castNonEmptyArray
} from '@taiga-task-master/common';
import { isNone, isSome, none, some } from 'effect/Option';
import { TasksMachine } from "@taiga-task-master/core";
import editTask = TasksMachine.editTask;
import { NonEmptyArray } from 'effect/Schema';
const endTaskExecution = TasksMachine.endTaskExecution;
const cancelTaskExecution = TasksMachine.cancelTaskExecution;
type Tasks = TasksMachine.Tasks;
type Task = TasksMachine.Task;
type NextTaskF = TasksMachine.NextTaskF;
const startTaskExecution = TasksMachine.startTaskExecution;
const appendTasks = TasksMachine.appendTasks;

const serializeCommand = (command: Command.Command): string => {
  return command.toString();
};

// Error types for proper type safety
// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
export class CommandExecutionError extends Data.TaggedError("CommandExecutionError")<{
  readonly command: Command.Command;
  readonly stderr?: string;
}> {}

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
export class CommandTimeoutError extends Data.TaggedError("CommandTimeoutError")<{
  readonly command: Command.Command;
  readonly timeoutMs: number;
}> {}

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
export class CommandParsingError extends Data.TaggedError("CommandParsingError")<{
  readonly input: string;
  readonly reason: string;
}> {}

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly field: string;
  readonly value?: string;
  readonly reason: string;
}> {}

export type WorkerError =
  | CommandExecutionError
  | CommandTimeoutError
  | CommandParsingError
  | ConfigurationError;


export type WorkerOutputLine = Readonly<{
  timestamp: number;
  line: string;
}>;

export type WorkerResult = Readonly<{
  output: WorkerOutputLine[];
}>;

export interface CommandExecutor {
  readonly streamLines: (command: Command.Command) => Stream.Stream<string, Exclude<WorkerError, CommandTimeoutError>>;
}

export const CommandExecutor = Context.GenericTag<CommandExecutor>("CommandExecutor");

export type CommandScenario = Readonly<{
  output?: string[];
  error?: string;
  delay?: number;
}>;

export type GooseConfig = Readonly<{
  model: string;
  provider: string;
  processTimeout?: number;
  workingDirectory?: string;
  instructionsFile?: string;
  maxRetries?: NonNegativeInteger;

}>;

export const DEFAULT_GOOSE_CONFIG: GooseConfig = {
  model: "anthropic/claude-sonnet-4",
  provider: "openrouter",
  processTimeout: 300000, // 300s in milliseconds
  instructionsFile: "goose-instructions.md",
  maxRetries: castNonNegativeInteger(3),
};

// Default timeout for command execution (30 seconds)
export const DEFAULT_COMMAND_TIMEOUT_MS = 30000;

export const executeCommandWithTimeout = (
  command: Command.Command,
  timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS,
  onLine?: (s: {
    timestamp: number;
    line: string;
  }) => void
): Effect.Effect<WorkerResult, WorkerError, CommandExecutor> =>
  pipe(
    executeCommand(command, onLine),
    Effect.timeout(Duration.millis(timeoutMs)),
    Effect.catchTag("TimeoutException", () =>
      Effect.fail(new CommandTimeoutError({
        command,
        timeoutMs
      }))
    )
  );

export const streamCommand = (
  command: Command.Command
): Stream.Stream<WorkerOutputLine, Exclude<WorkerError, CommandTimeoutError>, CommandExecutor> =>
  pipe(
    CommandExecutor,
    Effect.map((executor) =>
      pipe(
        executor.streamLines(command),
        Stream.mapEffect((line) =>
          Effect.map(Clock.currentTimeMillis, (timestamp) => ({
            timestamp,
            line,
          }))
        )
      )
    ),
    Stream.unwrap
  );

export const executeCommand = (command: Command.Command, onLine?: (s: Readonly<{
  timestamp: number;
  line: string;
}>) => void): Effect.Effect<WorkerResult, WorkerError, CommandExecutor> =>
  pipe(
    streamCommand(command),
    Stream.tap((line) => {
      try {
        if (onLine) onLine(line);
      } catch (error) {
        console.error(error);
      }
      return Effect.succeed(undefined);
    }),
    Stream.runCollect,
    Effect.map((output) => ({
      output: EffectArray.fromIterable(output),
    }))
  );


export const runTaskAsPromise = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>
): Promise<A> => Effect.runPromise(Effect.provide(effect, layer));

export const LiveCommandExecutor = Layer.succeed(
  CommandExecutor,
  CommandExecutor.of({
    streamLines: (command) =>
      pipe(
        command,
        Command.streamLines,
        Stream.provideLayer(NodeContext.layer),
        Stream.mapError((error) =>
          new CommandExecutionError({
            command,
            stderr: String(error)
          })
        )
      ),
  })
);

export const TestCommandExecutor = (
  scenarios: Record<string, CommandScenario>
) =>
  Layer.succeed(
    CommandExecutor,
    CommandExecutor.of({
      streamLines: (command) => {
        // Use the serialized command as the key to match scenarios
        const commandKey = serializeCommand(command);
        const scenario = scenarios[commandKey] ?? scenarios['default'] ?? { output: ["default mock output"] };

        if (scenario.error) {
          return Stream.fail(
            new CommandExecutionError({
              command,
              stderr: scenario.error
            })
          );
        }

        const stream = Stream.fromIterable(scenario.output ?? []);

        return scenario.delay
          ? pipe(
              stream,
              Stream.schedule(Schedule.spaced(`${scenario.delay} millis`))
            )
          : stream;
      },
    })
  );

export const runWithLiveExecutor = <A, E>(
  effect: Effect.Effect<A, E, CommandExecutor>
): Promise<A> => runTaskAsPromise(effect, LiveCommandExecutor);

export const runCommandWithLiveExecutor = (command: Command.Command): Promise<WorkerResult> =>
  runWithLiveExecutor(executeCommand(command));

export const runCommandWithLiveExecutorAndTimeout = (
  command: Command.Command,
  timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS
): Promise<WorkerResult> =>
  runWithLiveExecutor(executeCommandWithTimeout(command, timeoutMs));

export const streamCommandWithLiveExecutor = (command: Command.Command): Promise<Stream.Stream<WorkerOutputLine, WorkerError, never>> =>
  runTaskAsPromise(
    pipe(
      streamCommand(command),
      Stream.provideLayer(LiveCommandExecutor),
      Effect.succeed
    ),
    Layer.empty
  );


export const OpenRouterApiKey = Config.string("OPENROUTER_API_KEY").pipe(
  Config.withDefault("")
);

export const GooseModel = Config.string("GOOSE_MODEL").pipe(
  Config.withDefault(DEFAULT_GOOSE_CONFIG.model)
);

export const GooseProvider = Config.string("GOOSE_PROVIDER").pipe(
  Config.withDefault(DEFAULT_GOOSE_CONFIG.provider)
);

export const loadProjectEnv = () =>
  Effect.all({
    OPENROUTER_API_KEY: OpenRouterApiKey,
    GOOSE_MODEL: GooseModel,
    GOOSE_PROVIDER: GooseProvider,
  });

export const createGooseCommand = (config: Partial<GooseConfig> = {}): Command.Command => {
  const finalConfig = { ...DEFAULT_GOOSE_CONFIG, ...config };
  const instructionsFile = finalConfig.instructionsFile ?? "goose-instructions.md";

  return Command.make(
    "goose",
    "run",
    "-i",
    instructionsFile,
    "--with-builtin",
    "developer",
    "--no-session"
  );
};

export const createGooseEnvironment = (config: Partial<GooseConfig> = {}) =>
  pipe(
    loadProjectEnv(),
    Effect.map((projectEnv) => {
      const finalConfig = { ...DEFAULT_GOOSE_CONFIG, ...config };

      const gooseEnv = {
        GOOSE_MODEL: finalConfig.model,
        GOOSE_PROVIDER: finalConfig.provider,
      };

      // Always include OPENROUTER_API_KEY from project env (even if empty string)
      return {
        ...gooseEnv,
        OPENROUTER_API_KEY: projectEnv.OPENROUTER_API_KEY
      };
    })
  );

const prepareExecution = (config: Partial<GooseConfig> = {}) => {
  const finalConfig: GooseConfig = { ...DEFAULT_GOOSE_CONFIG, ...config };
  const command = createGooseCommand(finalConfig);
  const workingDir = finalConfig.workingDirectory;
  const timeoutMs = finalConfig.processTimeout ?? DEFAULT_COMMAND_TIMEOUT_MS;
  const commandWithWorkingDir = workingDir ? Command.workingDirectory(command, workingDir) : command;
  return Tuple.make(commandWithWorkingDir, timeoutMs);
}

export const executeGoose = (config0: Partial<GooseConfig> = {}, onLine?: (s: Readonly<{
  timestamp: number;
  line: string;
}>) => void): Effect.Effect<WorkerResult, WorkerError, CommandExecutor> => {
  const config = { ...DEFAULT_GOOSE_CONFIG, ...config0 };
  const baseExecution = executeCommandWithTimeout(...prepareExecution(config), onLine);

  // If maxRetries is 0, don't retry at all
  if ((config.maxRetries ?? castNonNegativeInteger(3)) === 0) {
    return baseExecution;
  }

  return pipe(
    baseExecution,
    Effect.retry(
      Schedule.exponential("100 millis", 2.0).pipe(
        Schedule.whileInput((error: WorkerError) => {
          // Allow retries for all error types (simplified)
          return true;
        }),
        Schedule.intersect(Schedule.recurs(config.maxRetries ?? castNonNegativeInteger(3)))
      )
    )
  );
};

export const streamGoose = (config: Partial<GooseConfig> = {}): Stream.Stream<WorkerOutputLine, Exclude<WorkerError, CommandTimeoutError>, CommandExecutor> => {
  return streamCommand(prepareExecution(config)[0]);
};


export const GooseCommandExecutor = (config: Partial<GooseConfig> = {}) =>
  Layer.effect(
    CommandExecutor,
    pipe(
      createGooseEnvironment(config),
      Effect.map((gooseEnv) =>
        CommandExecutor.of({
          streamLines: (command) =>
            pipe(
              command,
              Command.env(gooseEnv),
              Command.streamLines,
              Stream.provideLayer(NodeContext.layer),
              Stream.mapError((error) =>
                new CommandExecutionError({
                  command,
                  stderr: String(error)
                })
              )
            ),
        })
      )
    )
  );

export const runGooseWithLiveExecutor = (config: Partial<GooseConfig> = {}, options?: { readonly signal?: AbortSignal, onLine?: (s: Readonly<{
    timestamp: number;
    line: string;
  }>) => void } | undefined): Promise<WorkerResult> =>
  Effect.runPromise(
    Effect.provide(
      executeGoose(config, options?.onLine),
      GooseCommandExecutor(config)
    ),
    options
  );

export type LooperDeps = {
  runWorker: (task: {
    description: string;
  }, options?: { readonly signal?: AbortSignal } | undefined) => Promise<WorkerResult>,
  // mutable, will mark task "pulled" outside.
  // invariant: when a task is "pulled" again but previous isn't returned back/acknowledged, should be an error.
  pullTask: (options?: { readonly signal?: AbortSignal } | undefined) => Promise<{
    type: 'task',
    description: NonEmptyString
  } | {
    type: 'aborted'
  }>,
  // invariant: only a current pulled task can be acknowledged.
  // ok "none" would put task back, ok "some" would remove the task and write an artifact
  ackTask: (ok: Option.Option<{
    // artifact
    branch: string;
  }>, options?: { readonly signal?: AbortSignal } | undefined) => Promise<void>,
  git: {
    // synched with remote and has no changes pending
    isClean: () => Promise<boolean>,
    // clean to pristine state before branch() was done
    cleanup: (name: NonEmptyString) => Promise<void>
    // should throw if branch isn't clean (TODO check if there's such command line args)
    branch: (name: Option.Option<NonEmptyString>) => Promise<NonEmptyString>,
    // call of isClean() right after commitAndPush should return true
    commitAndPush: () => Promise<void>,
  },
  log: {
    info: (message: string, ...args: unknown[]) => void,
    error: (message: string, ...args: unknown[]) => void,
  },
  sleep: (ms: number, options?: { readonly signal?: AbortSignal } | undefined) => Promise<void>,
};

export const createBranchName = (task: NonEmptyString): NonEmptyString => {
  const hash = cyrb53(task);
  return castNonEmptyString(`task-${hash.toString()}`);
};

const taskToBranchName = (task: Task): NonEmptyString => {
  return createBranchName(task.description);
};

// never throws
/* eslint-disable functional/no-loop-statements, functional/no-let, functional/no-expression-statements */
export const loop = (deps: LooperDeps) => async (options?: { readonly signal?: AbortSignal } | undefined): Promise<void> => {
    while (true) {
      if (options?.signal?.aborted) break;
      let previousBranch: NonEmptyString | undefined;
      let taskAcknowledging = false;
      const cleanupBranch = async () => {
        if (previousBranch) await deps.git.cleanup(previousBranch);
      }
      try {
        const taskR = await deps.pullTask(options);
        if (taskR.type === 'aborted') {
          break;
        }
        const task = taskR.description;
        if (!await deps.git.isClean()) {
          deps.log.error("FATAL: git repo isn't clean, aborting");
          break;
        }
        const branch = taskToBranchName(taskR);
        previousBranch = await deps.git.branch(some(branch));
        await deps.runWorker({ description: task }, options);
        await deps.git.commitAndPush();
        if (!await deps.git.isClean()) {
          deps.log.error("FATAL: git repo isn't clean, after commitAndPush, aborting");
          break;
        }
        taskAcknowledging = true;
        await deps.ackTask(Option.some({ branch }), options);
        taskAcknowledging = false;
      } catch (error) {
        deps.log.error('uncaught error in main loop: ', error);
        await cleanupBranch();
        if (!taskAcknowledging) {
          await deps.ackTask(none(), options);
        } else {
          deps.log.error(`unidentified condition, task was in the middle of acknowledgement when error happened. trying to unacknowledge`);
          try {
            await deps.ackTask(none(), options);
          } catch (error) {
            deps.log.error(`unacknowledgement failed, ignoring`);
          }
        }
        await deps.sleep(1000, options);
      }
    }
};
/* eslint-enable functional/no-loop-statements, functional/no-let, functional/no-expression-statements */

// connect with global meta state - info about artifacts, queue. never ends
export const statefulLoop = (deps: Omit<LooperDeps, 'pullTask' | 'ackTask'> & {
  next: NextTaskF,/*to take from taskmaster source code implementation*/
  description: (t: Task) => NonEmptyString,
  git: LooperDeps['git'] & {
    dropBranch: (name: NonEmptyString) => Promise<void>,
  }
}) => (state0: TasksMachine.State, save: (s: TasksMachine.State) => Promise<void>) => {
  /*task machine methods*/
  // eslint-disable-next-line functional/no-let
  let state = state0;
  // eslint-disable-next-line functional/no-let
  let stateSavePromise: Promise<void> = Promise.resolve();
  // Track task failures to stop worker after repeated failures

  const taskFailureCount = new Map<string, number>();
  const MAX_TASK_FAILURES = 5; // Stop worker if same task fails 5 times
  const pullTask: LooperDeps['pullTask'] = async (options) => {
    // eslint-disable-next-line functional/no-loop-statements
    while (true) {
      if (options?.signal?.aborted) return { type: 'aborted' };
      const next = deps.next(state.tasks);
      if (next._tag === 'None') {
        await deps.sleep(1000, options);
        continue;
      }
      const [taskId, task] = next.value;

      // Check if this task has failed too many times
      const taskIdStr = String(taskId);
      const failureCount = taskFailureCount.get(taskIdStr) || 0;
      if (failureCount >= MAX_TASK_FAILURES) {
        deps.log.error(`Task ${taskIdStr} has failed ${failureCount} times. Stopping worker for manual review.`);
        deps.log.error('Current task queue preserved. Restart worker after manual intervention.');
        return { type: 'aborted' };
      }

      await stateSavePromise;
      // not exactly THE point of execution started but good enough
      state = startTaskExecution(taskId)(state);
      stateSavePromise = save(state);
      return {
        type: 'task',
        description: deps.description(task)
      };
    }
  };
  const ackTask: LooperDeps['ackTask'] = async (ok, options) => {
    await stateSavePromise;
    if (Option.isSome(ok)) {
      if (state.taskExecutionState.step === 'running') {
        const [taskId] = state.taskExecutionState.task;
        const taskIdStr = String(taskId);
        taskFailureCount.delete(taskIdStr); // Reset failure count on success
      }
      state = endTaskExecution(state);
      // here, the git pr is to be created TODO
      state = TasksMachine.outputTaskToArtifact(castNonEmptyString(ok.value.branch))(state);
    } else {
      // Failure: put task back in queue for retry and track failure
      if (state.taskExecutionState.step === 'running') {
        const [taskId] = state.taskExecutionState.task;
        const taskIdStr = String(taskId);
        const currentCount = taskFailureCount.get(taskIdStr) || 0;
        taskFailureCount.set(taskIdStr, currentCount + 1);
        deps.log.error(`Task ${taskIdStr} failed (attempt ${currentCount + 1}/${MAX_TASK_FAILURES}). Putting back in queue.`);
      }
      state = cancelTaskExecution(state);
    }
    stateSavePromise = save(state);
  };
  const runLoop = () => {
    const r = new AbortController();
    loop({
      ...deps,
      pullTask,
      ackTask
    })({
      signal: r.signal
    }).then(() => {
      console.log('stateful loop ended');
    });
    return r;
  }
  let abortController = runLoop();
  const rerunLoop = () => {
    abortController.abort();
    return () => abortController = runLoop();
  };
  return {
    stop() {
      abortController.abort();
    },
    appendTasks: async (tasks: Tasks) => {
      await stateSavePromise;
      state = appendTasks(tasks)(state);
      stateSavePromise = save(state);
    },
    editTask: async (taskId: TaskId, desc: NonEmptyString) => {
      await stateSavePromise;
      const [state1, removedO, prevO] = editTask(taskId, {
        description: desc
      })(state);
      deps.log.info(`any tasks to remove: ${isSome(removedO)}`);
      if (isSome(removedO)) {
        // some tasks before the "currently being executed" were edited; the "current execution" is invalid
        const next = rerunLoop();
        // we have to check out to the edited task's predecessor
        await deps.git.branch(pipe(
          prevO,
          Option.map(t => taskToBranchName(t[1])),
        ))
        const removed = removedO.value;
        const tasks = removed.kind === 'artifact' ? removed.tasks : removed.kind === 'output' ? removed.tasks : removed.kind === 'executionCancel' ? castNonEmptyArray([removed.task]) : (() => { throw new Error('unreachable'); })();
        deps.log.info(`tasks to drop: ${tasks.join(', ')}`);
        const branches = tasks.map(t => taskToBranchName(t[1]));
        for (const branch of branches) {
          try {
            deps.log.info(`dropping branch ${branch}`);
            await deps.git.dropBranch(branch);
          } catch (e) {
            deps.log.info(`failed to drop branch ${branch}: ${e}; ignoring`);
          }
        }
        next();
      }
      // TODO here, we cleanup rejected PRs from _artifacts
      state = state1;
      stateSavePromise = save(state1);

    }
  };
};