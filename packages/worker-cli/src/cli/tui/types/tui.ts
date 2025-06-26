import type { TasksMachine } from "@taiga-task-master/core";
import type { NonEmptyString, TaskId } from "@taiga-task-master/common";

export interface WorkerOutputLine {
  readonly timestamp: number;
  readonly line: string;
  readonly level?: 'info' | 'error' | 'debug';
}

export interface GitStatus {
  readonly branch: string;
  readonly isClean: boolean;
  readonly changedFiles: number;
  readonly lastCommit?: string;
}

export interface TaskDisplayInfo {
  readonly id: TaskId;
  readonly description: string;
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly retryCount?: number;
}

export interface ArtifactInfo {
  readonly taskId: TaskId;
  readonly branchName: string;
  readonly description: string;
  readonly timestamp: number;
}

export interface AppState {
  readonly taskMachine: {
    readonly tasks: TaskDisplayInfo[];
    readonly queueSize: number;
    readonly currentTask?: TaskDisplayInfo;
    readonly artifacts: ArtifactInfo[];
  };
  readonly workerOutput: {
    readonly lines: WorkerOutputLine[];
    readonly currentLogFile?: string;
  };
  readonly gitStatus: GitStatus;
  readonly workingDir: string;
}

export interface TUIProps {
  readonly workingDir: string;
  readonly onAddTask: (description: string) => Promise<void>;
  readonly onEditTask?: (taskId: string, description: string) => Promise<void>;
  readonly onStop: () => void;
  readonly onWorkerOutput?: (handler: (line: { timestamp: number; line: string; level?: string }) => void) => void;
}