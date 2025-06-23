import { TasksMachine } from '@taiga-task-master/core';
import { NonEmptyString, TaskId } from '@taiga-task-master/common';
import { Option } from 'effect';

// Task ID and Task from core package
export type { TaskId } from '@taiga-task-master/common';
export type Task = TasksMachine.Task;
export type Tasks = TasksMachine.Tasks;

// Worker result type
export type WorkerResult = {
  success: boolean;
  artifacts?: string[];
  error?: Error;
  branchName?: string;
};

// Next task function type
export type NextTaskF = (tasks: TasksMachine.Tasks) => Option.Option<[TaskId, TasksMachine.Task]>;

// Git operations interface
export interface GitOperations {
  readonly isClean: () => Promise<boolean>;
  readonly branch: (name: NonEmptyString) => Promise<NonEmptyString>;
  readonly commitAndPush: () => Promise<void>;
  readonly cleanup: (previousBranch: NonEmptyString) => Promise<void>;
  readonly verifyBranchChain?: () => Promise<unknown>;
  readonly dumpFullState?: (label: string) => Promise<void>;
}

// Logger interface
export interface Logger {
  readonly debug: (message: string, ...args: unknown[]) => void;
  readonly info: (message: string, ...args: unknown[]) => void;
  readonly warn: (message: string, ...args: unknown[]) => void;
  readonly error: (message: string, ...args: unknown[]) => void;
}

export interface BaseWorkerConfig {
  workingDirectory: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  git?: {
    userConfig?: { name: string; email: string };
    isolation?: boolean;
  };
  timeouts?: {
    process?: number;
    hard?: number;
  };
}

export interface GooseWorkerConfig extends BaseWorkerConfig {
  goose: {
    model: string;
    provider: string;
    instructionsFile?: string;
  };
  apiKeys?: {
    openrouter?: string;
  };
}

export interface TestingWorkerConfig extends BaseWorkerConfig {
  mockFailures?: boolean;
  mockDelay?: number;
}