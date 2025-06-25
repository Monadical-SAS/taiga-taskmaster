/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeFileSystemWorker } from './filesystem-mock.js';
import type { TestingWorkerConfig } from '../core/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { isNonEmptyArray } from 'effect/Array';

describe('makeFileSystemWorker', () => {
  const testState = {
    tempDir: '',
    config: null as TestingWorkerConfig | null
  };

  beforeEach(async () => {
    // Create a temporary directory for each test
    testState.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'filesystem-mock-test-'));
    testState.config = {
      workingDirectory: testState.tempDir,
      mockFailures: false,
      mockDelay: 0 // No delay for faster tests
    };
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(testState.tempDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }
  });

  describe('successful task execution', () => {
    it('should create README.md and task-completed.json for basic task', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Basic test task' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'task-completed.json']);
      expect(result.error).toBeUndefined();
      
      // Verify README.md content
      const readmeContent = await fs.readFile(path.join(testState.tempDir, 'README.md'), 'utf-8');
      expect(readmeContent).toContain('# Task Execution');
      expect(readmeContent).toContain('Basic test task');
      expect(readmeContent).toContain('Completed at:');
      
      // Verify task-completed.json content
      const completionContent = await fs.readFile(path.join(testState.tempDir, 'task-completed.json'), 'utf-8');
      const completionData = JSON.parse(completionContent);
      expect(completionData.task).toBe('Basic test task');
      expect(completionData.artifacts).toEqual(['README.md', 'task-completed.json']);
      expect(completionData.completedAt).toBeDefined();
    });

    it('should create JavaScript file when task mentions javascript', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Create a JavaScript application' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'index.js', 'task-completed.json']);
      
      // Verify index.js content
      const jsContent = await fs.readFile(path.join(testState.tempDir, 'index.js'), 'utf-8');
      expect(jsContent).toContain('// Generated for task: Create a JavaScript application');
      expect(jsContent).toContain("console.log('Task completed');");
    });

    it('should create TypeScript file when task mentions typescript', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Build a TypeScript module' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'index.ts', 'task-completed.json']);
      
      // Verify index.ts content
      const tsContent = await fs.readFile(path.join(testState.tempDir, 'index.ts'), 'utf-8');
      expect(tsContent).toContain('// Generated for task: Build a TypeScript module');
      expect(tsContent).toContain('const message: string = \'Task completed\';');
    });

    it('should create HTML file when task mentions html', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Create an HTML page' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'index.html', 'task-completed.json']);
      
      // Verify index.html content
      const htmlContent = await fs.readFile(path.join(testState.tempDir, 'index.html'), 'utf-8');
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<title>Task Result</title>');
      expect(htmlContent).toContain('Create an HTML page');
    });

    it('should create multiple files when task mentions multiple technologies', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Build a JavaScript and HTML project with TypeScript' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'index.js', 'index.ts', 'index.html', 'task-completed.json']);
      
      // Verify all files exist
      const files = await fs.readdir(testState.tempDir);
      expect(files).toContain('README.md');
      expect(files).toContain('index.js');
      expect(files).toContain('index.ts');
      expect(files).toContain('index.html');
      expect(files).toContain('task-completed.json');
    });

    it('should handle case-insensitive technology detection', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Create a JAVASCRIPT and HTML project' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toContain('index.js');
      expect(result.artifacts).toContain('index.html');
    });
  });

  describe('simulated failures', () => {
    it('should simulate random failures when mockFailures is enabled', async () => {
      const failureConfig = { ...testState.config!, mockFailures: true };
      const worker = makeFileSystemWorker(failureConfig);
      const task = { description: 'Test task that might fail' };
      
      // Run multiple times to potentially hit the 20% failure rate
      const results = await Promise.all(
        Array.from({ length: 50 }, () => worker(task))
      );
      
      // At least some should succeed
      const successes = results.filter(r => r.success);
      const failures = results.filter(r => !r.success);
      
      expect(successes.length).toBeGreaterThan(0);
      
      // Check failure structure if any failures occurred
      if (isNonEmptyArray(failures)) {
        const failure = failures[0];
        expect(failure.success).toBe(false);
        expect(failure.artifacts).toEqual(['mock-failure.md']);
        expect(failure.error).toBeInstanceOf(Error);
        expect(failure.error?.message).toBe('Simulated worker failure');
        
        // Verify mock-failure.md was created
        const failureFiles = await fs.readdir(testState.tempDir);
        expect(failureFiles).toContain('mock-failure.md');
      }
    });

    it('should create error file when filesystem operations fail', async () => {
      // Create a worker with an invalid directory to trigger filesystem errors
      const invalidConfig = { ...testState.config!, workingDirectory: '/invalid/path/that/does/not/exist' };
      const worker = makeFileSystemWorker(invalidConfig);
      const task = { description: 'Task that will fail due to invalid path' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('ENOENT');
      expect(result.artifacts).toEqual([]); // No artifacts since directory doesn't exist
    });
  });

  describe('processing delay', () => {
    it('should respect mockDelay configuration', async () => {
      const delayConfig = { ...testState.config!, mockDelay: 100 };
      const worker = makeFileSystemWorker(delayConfig);
      const task = { description: 'Task with delay' };
      
      const startTime = Date.now();
      const result = await worker(task);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some variance
    });

    it('should skip delay when mockDelay is 0', async () => {
      const noDelayConfig = { ...testState.config!, mockDelay: 0 };
      const worker = makeFileSystemWorker(noDelayConfig);
      const task = { description: 'Task without delay' };
      
      const startTime = Date.now();
      const result = await worker(task);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
    });
  });

  describe('abort signal handling', () => {
    it('should handle abort signal during delay', async () => {
      const delayConfig = { ...testState.config!, mockDelay: 1000 };
      const worker = makeFileSystemWorker(delayConfig);
      const task = { description: 'Task that will be aborted' };
      
      const controller = new AbortController();
      
      // Abort after 100ms
      setTimeout(() => controller.abort(), 100);
      
      await expect(worker(task, { signal: controller.signal })).rejects.toThrow();
    });

    it('should complete normally without abort signal', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Normal task execution' };
      
      const result = await worker(task, { signal: undefined });
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty task description', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: '' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'task-completed.json']);
      
      const readmeContent = await fs.readFile(path.join(testState.tempDir, 'README.md'), 'utf-8');
      expect(readmeContent).toContain('# Task Execution');
    });

    it('should handle task description with special characters', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const task = { description: 'Task with special chars: <>&"/' };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'task-completed.json']);
      
      const completionContent = await fs.readFile(path.join(testState.tempDir, 'task-completed.json'), 'utf-8');
      const completionData = JSON.parse(completionContent);
      expect(completionData.task).toBe('Task with special chars: <>&"/');
    });

    it('should handle very long task descriptions', async () => {
      const worker = makeFileSystemWorker(testState.config!);
      const longDescription = 'A'.repeat(10000);
      const task = { description: longDescription };
      
      const result = await worker(task);
      
      expect(result.success).toBe(true);
      expect(result.artifacts).toEqual(['README.md', 'task-completed.json']);
      
      const readmeContent = await fs.readFile(path.join(testState.tempDir, 'README.md'), 'utf-8');
      expect(readmeContent).toContain(longDescription);
    });
  });
});