import {
  type TasksFileContent,
  NonEmptyString,
  PrdText,
  castNonEmptyString,
} from "@taiga-task-master/common";
import { Option } from "effect";

export type GenerateTasksDeps = {
  savePrd: (path: NonEmptyString, prd: PrdText) => Promise<AsyncDisposable>;
  cli: {
    generate: (
      prdPath: NonEmptyString,
      tasksJsonPath: NonEmptyString
    ) => Promise<TasksFileContent>;
  };
  readTasksJson: (tasksJsonPath: NonEmptyString) => Promise<TasksFileContent>;
};

export type GenerateTasksF = (
  di: GenerateTasksDeps
) => (
  prd: PrdText,
  current: Option.Option<TasksFileContent>
) => Promise<TasksFileContent>;

export const generateTasks: GenerateTasksF = (di) => async (prd, current) => {
  if (Option.isSome(current)) {
    throw new Error("panic! PRD update not implemented");
  }
  const path = castNonEmptyString("scripts/prd.txt");
  await using _letFileGo = await di.savePrd(path, prd);
  const outputPath = castNonEmptyString("tasks/tasks.json");
  await di.cli.generate(path, outputPath); // don't clean up here
  return await di.readTasksJson(outputPath);
};
