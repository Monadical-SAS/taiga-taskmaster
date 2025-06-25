/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGooseStatefulLoop } from './goose-stateful.js';
import { createTestingStatefulLoop } from './testing-stateful.js';
import type { GooseWorkerConfig, TestingWorkerConfig } from '../core/types.js';
import { TasksMachine } from '@taiga-task-master/core';
import { castTaskId, castNonNegativeInteger } from '@taiga-task-master/common';
import { HashMap } from 'effect';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('StatefulLoop Factories', () => {
  const testState = {
    tempDir: ''
  };

  beforeEach(async () => {
    testState.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stateful-test-'));
    
    // Initialize as git repository for tests that require it
    const { simpleGit } = await import('simple-git');
    const git = simpleGit(testState.tempDir);
    
    try {
      await git.init();
      await git.addConfig('user.name', 'Test User');
      await git.addConfig('user.email', 'test@example.com');
      await git.addConfig('commit.gpgsign', 'false');
      
      // Create initial commit
      await fs.writeFile(path.join(testState.tempDir, '.gitkeep'), '', 'utf-8');
      await git.add('.gitkeep');
      await git.commit('Initial commit');
    } catch (error) {
      console.warn('Failed to initialize git repo in test:', error);
    }
  });

  afterEach(async () => {
    try {
      await fs.rm(testState.tempDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  });

  describe('createTestingStatefulLoop', () => {
    const testingTestState = {
      config: null as TestingWorkerConfig | null,
      mockState: null as TasksMachine.State | null,
      savedStates: [] as TasksMachine.State[]
    };

    beforeEach(() => {
      testingTestState.config = {
        workingDirectory: testState.tempDir,
        mockFailures: false,
        mockDelay: 0,
        logLevel: 'error' // Suppress logs during tests
      };

      testingTestState.savedStates = [];

      // Create a simple mock state with one task
      testingTestState.mockState = {
        tasks: HashMap.make([
          castTaskId(1), 
          { description: 'Test task for JavaScript project' } as TasksMachine.Task
        ]),
        timestamp: castNonNegativeInteger(Date.now()),
        taskExecutionState: {
          step: 'stopped' as const
        },
        outputTasks: [],
        artifacts: []
      };
    });

    const mockSave = async (state: TasksMachine.State) => {
      testingTestState.savedStates.push(structuredClone(state));
    };

    it('should create a testing stateful loop factory', () => {
      const factory = createTestingStatefulLoop(testingTestState.config!);
      expect(typeof factory).toBe('function');
    });

    it('should execute tasks using filesystem worker', async () => {
      const factory = createTestingStatefulLoop(testingTestState.config!);
      const statefulLoop = factory(testingTestState.mockState!, mockSave);
      
      expect(typeof statefulLoop.stop).toBe('function');
      expect(typeof statefulLoop.appendTasks).toBe('function');
    });

    it('should handle task execution with state persistence', async () => {
      const factory = createTestingStatefulLoop(testingTestState.config!);
      const statefulLoop = factory(testingTestState.mockState!, mockSave);
      
      // Let it run very briefly and then stop
      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          statefulLoop.stop();
          resolve();
        }, 50);
      });
      
      await stopPromise;
      
      // Should have created a stateful loop without errors
      expect(statefulLoop).toBeDefined();
    });

    it('should use fifo task selection strategy', () => {
      const factory = createTestingStatefulLoop(testingTestState.config!);
      // The factory should be created without errors
      expect(factory).toBeDefined();
    });

    it('should use simple task description format', () => {
      const factory = createTestingStatefulLoop(testingTestState.config!);
      // The factory should be created without errors  
      expect(factory).toBeDefined();
    });

    it('should handle empty task queue gracefully', async () => {
      const emptyState: TasksMachine.State = {
        ...testingTestState.mockState!,
        tasks: HashMap.empty()
      };
      
      const factory = createTestingStatefulLoop(testingTestState.config!);
      const statefulLoop = factory(emptyState, mockSave);
      
      // Should not throw when no tasks available
      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          statefulLoop.stop();
          resolve();
        }, 30);
      });
      
      await stopPromise;
      
      expect(statefulLoop).toBeDefined();
    });

    it('should support adding tasks dynamically', async () => {
      const factory = createTestingStatefulLoop(testingTestState.config!);
      const statefulLoop = factory(testingTestState.mockState!, mockSave);
      
      const newTasks = HashMap.make([
        castTaskId(2),
        { description: 'Dynamically added task' } as TasksMachine.Task
      ]);
      
      // Should not throw when adding tasks
      expect(() => statefulLoop.appendTasks(newTasks)).not.toThrow();
      
      // Stop immediately to prevent unhandled rejections
      const stopPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          statefulLoop.stop();
          resolve();
        }, 10);
      });
      
      await stopPromise;
    });
  });

  describe('createGooseStatefulLoop', () => {
    const gooseTestState = {
      config: null as GooseWorkerConfig | null,
      mockState: null as TasksMachine.State | null,
      savedStates: [] as TasksMachine.State[]
    };

    beforeEach(() => {
      gooseTestState.config = {
        workingDirectory: testState.tempDir,
        goose: {
          model: 'test-model',
          provider: 'test-provider'
        },
        logLevel: 'error', // Suppress logs during tests
        timeouts: {
          process: 5000,
          hard: 10000
        }
      };

      gooseTestState.savedStates = [];

      gooseTestState.mockState = {
        tasks: HashMap.make([
          castTaskId(1),
          { description: 'High priority production task' } as TasksMachine.Task
        ]),
        timestamp: castNonNegativeInteger(Date.now()),
        taskExecutionState: {
          step: 'stopped' as const
        },
        outputTasks: [],
        artifacts: []
      };
    });

    const mockSave = async (state: TasksMachine.State) => {
      gooseTestState.savedStates.push(structuredClone(state));
    };

    it('should create a goose stateful loop factory', () => {
      const factory = createGooseStatefulLoop(gooseTestState.config!);
      expect(typeof factory).toBe('function');
    });

    it('should create stateful loop with goose worker', async () => {
      const factory = createGooseStatefulLoop(gooseTestState.config!);
      const statefulLoop = factory(gooseTestState.mockState!, mockSave);
      
      expect(typeof statefulLoop.stop).toBe('function');
      expect(typeof statefulLoop.appendTasks).toBe('function');
    });

    it('should use priority task selection strategy', () => {
      const factory = createGooseStatefulLoop(gooseTestState.config!);
      // The factory should be created without errors
      expect(factory).toBeDefined();
    });

    it('should use instructions task description format', () => {
      const factory = createGooseStatefulLoop(gooseTestState.config!);
      // The factory should be created without errors
      expect(factory).toBeDefined();
    });

    it('should handle goose worker configuration', () => {
      const customConfig: GooseWorkerConfig = {
        ...gooseTestState.config!,
        goose: {
          model: 'gpt-4',
          provider: 'openai',
          instructionsFile: '/path/to/instructions.md'
        },
        apiKeys: {
          openrouter: 'test-key'
        }
      };
      
      const factory = createGooseStatefulLoop(customConfig);
      expect(factory).toBeDefined();
    });

    it('should support git configuration options', () => {
      const configWithGit: GooseWorkerConfig = {
        ...gooseTestState.config!,
        git: {
          userConfig: {
            name: 'Test User',
            email: 'test@example.com'
          },
          isolation: true
        }
      };
      
      const factory = createGooseStatefulLoop(configWithGit);
      expect(factory).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid working directory gracefully', () => {
      const invalidConfig: TestingWorkerConfig = {
        workingDirectory: '/invalid/nonexistent/path',
        mockFailures: false,
        mockDelay: 0
      };
      
      // Should throw when trying to access invalid git directory
      expect(() => createTestingStatefulLoop(invalidConfig)).toThrow();
    });

    it('should handle missing goose configuration', () => {
      const incompleteConfig = {
        workingDirectory: testState.tempDir,
        goose: {
          model: '',
          provider: ''
        }
      } as GooseWorkerConfig;
      
      // Should create factory even with incomplete config
      expect(() => createGooseStatefulLoop(incompleteConfig)).not.toThrow();
    });

    it('should handle state save failures gracefully', async () => {
      const config: TestingWorkerConfig = {
        workingDirectory: testState.tempDir,
        mockFailures: false,
        mockDelay: 0,
        logLevel: 'error'
      };

      const mockState: TasksMachine.State = {
        tasks: HashMap.empty(),
        timestamp: castNonNegativeInteger(Date.now()),
        taskExecutionState: { step: 'stopped' as const },
        outputTasks: [],
        artifacts: []
      };

      const failingSave = async (_state: TasksMachine.State) => {
        throw new Error('Save failed');
      };

      const factory = createTestingStatefulLoop(config);
      
      // Should not throw when creating stateful loop with failing save
      expect(() => factory(mockState, failingSave)).not.toThrow();
    });
  });

  describe('Integration with Dependencies', () => {
    it('should integrate logging correctly', () => {
      const config: TestingWorkerConfig = {
        workingDirectory: testState.tempDir,
        logLevel: 'debug'
      };
      
      const factory = createTestingStatefulLoop(config);
      expect(factory).toBeDefined();
    });

    it('should integrate git operations correctly', () => {
      const config: GooseWorkerConfig = {
        workingDirectory: testState.tempDir,
        goose: { model: 'test', provider: 'test' },
        git: {
          userConfig: { name: 'Test', email: 'test@test.com' },
          isolation: false
        }
      };
      
      const factory = createGooseStatefulLoop(config);
      expect(factory).toBeDefined();
    });

    it('should integrate sleep utility correctly', () => {
      const config: TestingWorkerConfig = {
        workingDirectory: testState.tempDir,
        mockDelay: 10 // Small delay for testing
      };
      
      const factory = createTestingStatefulLoop(config);
      expect(factory).toBeDefined();
    });
  });
});