import { Effect, Stream, pipe, Array as EffectArray, Context, Layer, Schedule, Config } from "effect";
import { Command } from "@effect/platform";
import { NodeContext } from "@effect/platform-node";

export type WorkerTask = Readonly<{
  description: string;
  command?: string;
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
  readonly streamLines: (command: Command.Command) => Stream.Stream<string, unknown>;
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
export const executeCommand = (command: Command.Command): Effect.Effect<WorkerResult, Error, CommandExecutor> =>
  pipe(
    CommandExecutor,
    Effect.flatMap((executor) =>
      pipe(
        executor.streamLines(command),
        Stream.map((line) => ({
          timestamp: Date.now(),
          line,
        })),
        Stream.runCollect,
        Effect.map((output) => ({
          exitCode: 0,
          output: EffectArray.fromIterable(output),
        }))
      )
    ),
    Effect.catchAll((error) =>
      Effect.succeed({
        exitCode: 1,
        output: [
          {
            timestamp: Date.now(),
            line: `Error: ${String(error)}`,
          },
        ],
      })
    )
  );

export const executeTask = (task: WorkerTask): Effect.Effect<WorkerResult, Error, CommandExecutor> => {
  const commandString = task.command ?? task.description;
  const commandParts = commandString.split(" ");
  const cmd = commandParts[0];
  const args = commandParts.slice(1);
  
  if (!cmd) {
    return Effect.fail(new Error("Empty command"));
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
        Stream.provideLayer(NodeContext.layer)
      ),
  })
);

export const TestCommandExecutor = (
  scenarios: Record<string, CommandScenario>
) =>
  Layer.succeed(
    CommandExecutor,
    CommandExecutor.of({
      streamLines: (_command) => {
        const commandKey = Object.keys(scenarios)[0] ?? "default-command";
        const scenario = scenarios[commandKey] ?? { output: ["default mock output"] };

        if (scenario.error) {
          return Stream.fail(new Error(scenario.error));
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

export const createGooseCommand = (config: Partial<GooseConfig> = {}): string => {
  const finalConfig = { ...DEFAULT_GOOSE_CONFIG, ...config };
  const instructionsFile = finalConfig.instructionsFile ?? "goose-instructions.md";
  
  const args = [
    "goose",
    "run", 
    "-i", 
    instructionsFile,
    "--with-builtin",
    "developer"
  ];
  
  return args.join(" ");
};

export const createGooseEnvironment = (config: Partial<GooseConfig> = {}) =>
  pipe(
    loadProjectEnv(),
    Effect.map((projectEnv) => {
      const finalConfig = { ...DEFAULT_GOOSE_CONFIG, ...config };
      
      const gooseEnv: Record<string, string> = {
        GOOSE_MODEL: finalConfig.model,
        GOOSE_PROVIDER: finalConfig.provider,
      };
      
      // Add OPENROUTER_API_KEY from project env if available
      return projectEnv.OPENROUTER_API_KEY
        ? { ...gooseEnv, OPENROUTER_API_KEY: projectEnv.OPENROUTER_API_KEY }
        : gooseEnv;
    })
  );

export const executeGoose = (config: Partial<GooseConfig> = {}): Effect.Effect<WorkerResult, Error, CommandExecutor> => {
  const commandString = createGooseCommand(config);
  const workingDir = config.workingDirectory;
  
  if (workingDir) {
    // Use shell to change directory and run command
    return executeCommand(Command.make("sh", "-c", `cd "${workingDir}" && ${commandString}`));
  } else {
    // Parse goose command directly
    const commandParts = commandString.split(" ");
    const cmd = commandParts[0];
    const args = commandParts.slice(1);
    
    if (!cmd) {
      return Effect.fail(new Error("Empty goose command"));
    }
    
    return executeCommand(Command.make(cmd, ...args));
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
              Stream.provideLayer(NodeContext.layer)
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