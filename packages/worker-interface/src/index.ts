import { Effect, Stream, pipe, Array as EffectArray, Context, Layer, Schedule } from "effect";
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
  readonly streamLines: (command: string) => Stream.Stream<string, Error>;
}

export const CommandExecutor = Context.GenericTag<CommandExecutor>("CommandExecutor");

export type CommandScenario = Readonly<{
  output?: string[];
  error?: string;
  delay?: number;
}>;

/**
 * Execute a command using the CommandExecutor service
 */
export const executeCommand = (command: string): Effect.Effect<WorkerResult, Error, CommandExecutor> =>
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

export const executeTask = (task: WorkerTask): Effect.Effect<WorkerResult, Error, CommandExecutor> =>
  executeCommand(task.command ?? task.description);

export const runTaskAsPromise = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  layer: Layer.Layer<R, never, never>
): Promise<A> => Effect.runPromise(Effect.provide(effect, layer));

export const LiveCommandExecutor = Layer.succeed(
  CommandExecutor,
  CommandExecutor.of({
    streamLines: (command) =>
      pipe(
        Command.make("sh", "-c", command),
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
      streamLines: (command) => {
        const scenario = scenarios[command] ?? { output: ["default mock output"] };

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

/**
 * Convenience function for running commands with live executor
 */
export const runCommandWithLiveExecutor = (command: string): Promise<WorkerResult> =>
  runWithLiveExecutor(executeCommand(command));

/**
 * Convenience function for running tasks with live executor  
 */
export const runTaskWithLiveExecutor = (task: WorkerTask): Promise<WorkerResult> =>
  runWithLiveExecutor(executeTask(task));