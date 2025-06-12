import { Effect, Stream, pipe, Array as EffectArray, Context, Layer, Schedule, Config, Data, Clock } from "effect";
import { Command } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";

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
// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance, functional/readonly-type
export class CommandExecutionError extends Data.TaggedError("CommandExecutionError")<{
  readonly command: string;
  readonly exitCode: number;
  readonly stderr?: string;
}> {}

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance, functional/readonly-type
export class CommandTimeoutError extends Data.TaggedError("CommandTimeoutError")<{
  readonly command: string;
  readonly timeoutMs: number;
}> {}

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance, functional/readonly-type
export class CommandParsingError extends Data.TaggedError("CommandParsingError")<{
  readonly input: string;
  readonly reason: string;
}> {}

// eslint-disable-next-line functional/no-classes, functional/no-class-inheritance, functional/readonly-type
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

export type WorkerTask = Readonly<{
  description: string;
  command: readonly string[];
}>;

export type WorkerOutputLine = Readonly<{
  timestamp: number;
  line: string;
}>;

export type WorkerResult = Readonly<{
  exitCode: number;
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
  timeout?: number;
  processTimeout?: number;
  workingDirectory?: string;
  instructionsFile?: string;
}>;

export const DEFAULT_GOOSE_CONFIG: GooseConfig = {
  model: "anthropic/claude-sonnet-4",
  provider: "openrouter",
  timeout: 120000, // 120s in milliseconds
  processTimeout: 300000, // 300s in milliseconds
  instructionsFile: "goose-instructions.md",
};
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
          exitCode: 0,
          output: EffectArray.fromIterable(output),
        }))
      )
    ),
    Effect.catchAll((error) =>
      Effect.map(Clock.currentTimeMillis, (timestamp) => ({
        exitCode: 1,
        output: [
          {
            timestamp,
            line: `Error: ${error._tag}: ${JSON.stringify(error)}`,
          },
        ],
      }))
    )
  );

export const executeTask = (task: WorkerTask): Effect.Effect<WorkerResult, WorkerError, CommandExecutor> => {
  const [cmd, ...args] = task.command;
  
  if (!cmd) {
    return Effect.map(Clock.currentTimeMillis, (timestamp) => ({
      exitCode: 1,
      output: [
        {
          timestamp,
          line: `Error: CommandParsingError: {"input":"","reason":"Empty command","_tag":"CommandParsingError"}`,
        },
      ],
    }));
  }
  
  return executeCommand(Command.make(cmd, ...args));
};

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
            exitCode: -1,
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
              exitCode: 1,
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

export const runTaskWithLiveExecutor = (task: WorkerTask): Promise<WorkerResult> =>
  runWithLiveExecutor(executeTask(task));

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
  const command = createGooseCommand(config);
  const workingDir = config.workingDirectory;
  if (workingDir) {
    return executeCommand(Command.workingDirectory(command, workingDir));
  } else {
    return executeCommand(command);
  }
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
                  exitCode: -1,
                  stderr: String(error)
                })
              )
            ),
        })
      )
    )
  );

export const runGooseWithLiveExecutor = (config: Partial<GooseConfig> = {}): Promise<WorkerResult> =>
  Effect.runPromise(
    Effect.provide(
      executeGoose(config), 
      GooseCommandExecutor(config)
    )
  );

export const runGooseInDirectory = (
  workingDirectory: string, 
  config: Partial<GooseConfig> = {}
): Promise<WorkerResult> =>
  runGooseWithLiveExecutor({ ...config, workingDirectory });