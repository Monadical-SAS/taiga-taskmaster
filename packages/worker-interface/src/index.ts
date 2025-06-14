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
  Option
} from 'effect';
import { Command } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";
import { cyrb53, NonEmptyString, nonEmptyStringFromNumber } from '@taiga-task-master/common';
import { none } from 'effect/Option';

// Helper function to convert Command to string for error reporting
const commandToString = (command: Command.Command): string => {
  // Since Command.toString might not be available, we'll use a simple representation
  return command.toString();
};

// Serialize Command to a consistent string key for testing scenarios
const serializeCommand = (command: Command.Command): string => {
  return command.toString();
};

// Error types for proper type safety
// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
export class CommandExecutionError extends Data.TaggedError("CommandExecutionError")<{
  readonly command: string;
  readonly stderr?: string;
}> {}

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance
export class CommandTimeoutError extends Data.TaggedError("CommandTimeoutError")<{
  readonly command: string;
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
  readonly streamLines: (command: Command.Command) => Stream.Stream<string, WorkerError>;
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
}>;

export const DEFAULT_GOOSE_CONFIG: GooseConfig = {
  model: "anthropic/claude-sonnet-4",
  provider: "openrouter",
  processTimeout: 300000, // 300s in milliseconds
  instructionsFile: "goose-instructions.md",
};

// Default timeout for command execution (30 seconds)
export const DEFAULT_COMMAND_TIMEOUT_MS = 30000;

export const executeCommandWithTimeout = (
  command: Command.Command,
  timeoutMs: number = DEFAULT_COMMAND_TIMEOUT_MS
): Effect.Effect<WorkerResult, WorkerError, CommandExecutor> =>
  pipe(
    executeCommand(command),
    Effect.timeout(Duration.millis(timeoutMs)),
    Effect.catchTag("TimeoutException", () =>
      Effect.fail(new CommandTimeoutError({
        command: commandToString(command),
        timeoutMs
      }))
    )
  );

export const executeCommand = (command: Command.Command): Effect.Effect<WorkerResult, WorkerError, CommandExecutor> =>
  pipe(
    CommandExecutor,
    Effect.flatMap((executor) =>
      pipe(
        executor.streamLines(command),
        Stream.mapEffect((line) => 
          Effect.map(Clock.currentTimeMillis, (timestamp) => ({
            timestamp,
            line,
          }))
        ),
        Stream.runCollect,
        Effect.map((output) => ({
          output: EffectArray.fromIterable(output),
        }))
      )
    )
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
            command: commandToString(command),
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
              command: commandToString(command),
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
    "developer"
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

export const executeGoose = (config: Partial<GooseConfig> = {}): Effect.Effect<WorkerResult, WorkerError, CommandExecutor> => {
  const finalConfig = { ...DEFAULT_GOOSE_CONFIG, ...config };
  const command = createGooseCommand(finalConfig);
  const workingDir = finalConfig.workingDirectory;
  const timeoutMs = finalConfig.processTimeout ?? DEFAULT_COMMAND_TIMEOUT_MS;
  const commandWithWorkingDir = workingDir ? Command.workingDirectory(command, workingDir) : command;
  return executeCommandWithTimeout(commandWithWorkingDir, timeoutMs);
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
                  command: commandToString(command),
                  stderr: String(error)
                })
              )
            ),
        })
      )
    )
  );

export const runGooseWithLiveExecutor = (config: Partial<GooseConfig> = {}, options?: { readonly signal?: AbortSignal } | undefined): Promise<WorkerResult> =>
  Effect.runPromise(
    Effect.provide(
      executeGoose(config), 
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
  pullTask: (options?: { readonly signal?: AbortSignal } | undefined) => Promise<NonEmptyString>,
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
    branch: (name: NonEmptyString) => Promise<NonEmptyString>,
    // call of isClean() right after commitAndPush should return true
    commitAndPush: () => Promise<void>,
  },
  log: {
    info: (message: string, ...args: unknown[]) => void,
    error: (message: string, ...args: unknown[]) => void,
  },
  sleep: (ms: number) => Promise<void>,
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
        const task = await deps.pullTask(options);
        if (!await deps.git.isClean()) {
          deps.log.error("FATAL: git repo isn't clean, aborting");
          break;
        }
        const branch = nonEmptyStringFromNumber(cyrb53(task));
        previousBranch = await deps.git.branch(branch);
        const result = await deps.runWorker({ description: task }, options);
        deps.log.info('result log', result);
        await deps.git.commitAndPush();
        if (!await deps.git.isClean()) {
          deps.log.error("FATAL: git repo isn't clean, after commitAndPush, aborting");
          break;
        }
        taskAcknowledging = true;
        await deps.ackTask(Option.some({ branch }), options);
        taskAcknowledging = false;
      } catch (error) {
        deps.log.error('uncaught error in main loop, retrying in 1 second: ', error);
        await cleanupBranch();
        if (!taskAcknowledging) {
          await deps.ackTask(none(), options);
        } else {
          deps.log.error(`unidentified condition, task was in the middle of acknowledgement when error happened. trying to unacknowledge`);
          await deps.ackTask(none(), options);
        }
        await deps.sleep(1000);
      }
    }
};
/* eslint-enable functional/no-loop-statements, functional/no-let, functional/no-expression-statements */

