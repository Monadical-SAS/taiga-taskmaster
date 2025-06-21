import { describe, it, expect } from 'vitest';
import { Option } from 'effect';
import type {
  WorkerResult,
  NextTaskF,
  GitOperations,
  Logger,
  BaseWorkerConfig,
  GooseWorkerConfig,
  TestingWorkerConfig
} from './types.js';
import { TasksMachine } from '@taiga-task-master/core';
import { NonEmptyString } from '@taiga-task-master/common';

describe('Worker Types', () => {
  it('should have correct WorkerResult type', () => {
    const successResult: WorkerResult = {
      success: true,
      artifacts: ['branch-name-123']
    };

    const failureResult: WorkerResult = {
      success: false,
      error: new Error('Task failed')
    };

    expect(successResult.success).toBe(true);
    expect(failureResult.success).toBe(false);
  });

  it('should have correct NextTaskF function type', () => {
    const mockNextTask: NextTaskF = (_tasks: TasksMachine.Tasks) => {
      // Mock implementation - would normally find next available task
      return Option.none();
    };

    expect(typeof mockNextTask).toBe('function');
  });

  it('should have GitOperations interface with required methods', () => {
    const mockGitOps: GitOperations = {
      isClean: async () => true,
      branch: async (name: NonEmptyString) => name,
      commitAndPush: async () => {},
      cleanup: async (_previousBranch: NonEmptyString) => {}
    };

    expect(typeof mockGitOps.isClean).toBe('function');
    expect(typeof mockGitOps.branch).toBe('function');
    expect(typeof mockGitOps.commitAndPush).toBe('function');
    expect(typeof mockGitOps.cleanup).toBe('function');
  });

  it('should have Logger interface with log level methods', () => {
    const mockLogger: Logger = {
      debug: (_message: string, ..._args: unknown[]) => {},
      info: (_message: string, ..._args: unknown[]) => {},
      warn: (_message: string, ..._args: unknown[]) => {},
      error: (_message: string, ..._args: unknown[]) => {}
    };

    expect(typeof mockLogger.debug).toBe('function');
    expect(typeof mockLogger.info).toBe('function');
    expect(typeof mockLogger.warn).toBe('function');
    expect(typeof mockLogger.error).toBe('function');
  });

  it('should have proper configuration interface hierarchy', () => {
    const baseConfig: BaseWorkerConfig = {
      workingDirectory: '/tmp/test',
      logLevel: 'info'
    };

    const gooseConfig: GooseWorkerConfig = {
      ...baseConfig,
      goose: {
        model: 'anthropic/claude-sonnet-4',
        provider: 'openrouter'
      }
    };

    const testConfig: TestingWorkerConfig = {
      ...baseConfig,
      mockFailures: false,
      mockDelay: 100
    };

    expect(baseConfig.workingDirectory).toBe('/tmp/test');
    expect(gooseConfig.goose.model).toBe('anthropic/claude-sonnet-4');
    expect(testConfig.mockFailures).toBe(false);
  });
});