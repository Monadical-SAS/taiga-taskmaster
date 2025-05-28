import type { GenerateTasksF } from "@taiga-task-master/taskmaster-interface";
import type { SyncTasksF } from "@taiga-task-master/tasktracker-interface";
import { PrdText, SINGLETON_PROJECT_ID } from "@taiga-task-master/common";
import { Option } from "effect";

export const greet = (name: string): string => `Hello, ${name}!`;

export type GenerateTasksDeps = {
  taskmaster: {
    generateTasks: ReturnType<GenerateTasksF>;
  };
  tasktracker: {
    syncTasks: ReturnType<SyncTasksF>;
  };
};

// main happy flow after we got PRD from somewhere // TODO making this work is the first milestone
export const generateTasks =
  (di: GenerateTasksDeps) => async (prd: PrdText) => {
    const tasks = await di.taskmaster.generateTasks(
      prd,
      Option.none(/*for update*/)
    );
    return await di.tasktracker.syncTasks(tasks.tasks, SINGLETON_PROJECT_ID);
  };
