import { Effect, Stream, pipe, Array as EffectArray } from "effect";
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

export const executeCommand = (command: string) =>
  pipe(
    Command.make("sh", "-c", command),
    Command.streamLines,
    Stream.map((line) => ({
      timestamp: Date.now(),
      line,
    })),
    Stream.runCollect,
    Effect.map((output) => ({
      exitCode: 0,
      output: EffectArray.fromIterable(output),
    })),
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
    ),
    Effect.provide(NodeContext.layer)
  );

export const executeTask = (task: WorkerTask) =>
  executeCommand(task.command ?? task.description);

export const runTaskAsPromise = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.runPromise(effect);

export const runTestScript = () =>
  executeCommand("./test-script.sh");