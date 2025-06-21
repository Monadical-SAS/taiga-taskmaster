import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { makeGooseWorker } from './goose';
import type { GooseWorkerConfig } from '../core/types.js';

// Mock child_process exec
vi.mock('child_process', () => ({
  exec: vi.fn()
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  writeFile: vi.fn()
}));

const mockExec = vi.hoisted(() => vi.fn());
vi.mock('util', () => ({
  promisify: vi.fn(() => mockExec)
}));

describe('makeGooseWorker', () => {
  const mockConfig: GooseWorkerConfig = {
    workingDirectory: '/test/dir',
    goose: {
      model: 'gpt-4',
      provider: 'openrouter'
    },
    timeouts: {
      process: 5000,
      hard: 6000
    },
    apiKeys: {
      openrouter: 'test-key'
    }
  };

  const mockTask = {
    description: 'Test task description'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a worker function', () => {
    const worker = makeGooseWorker(mockConfig);
    expect(typeof worker).toBe('function');
  });

  it('should execute goose command successfully', async () => {
    const worker = makeGooseWorker(mockConfig);
    
    // Mock successful execution
    mockExec
      .mockResolvedValueOnce({ stdout: 'success', stderr: '' }) // goose run
      .mockResolvedValueOnce({ stdout: 'M  file1.txt\nA  file2.txt\n', stderr: '' }); // git status
    
    const result = await worker(mockTask);
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(mockConfig.workingDirectory, 'instructions.md'),
      mockTask.description,
      'utf-8'
    );
    
    expect(mockExec).toHaveBeenCalledWith(
      'goose run --model gpt-4 --provider openrouter /test/dir/instructions.md',
      expect.objectContaining({
        cwd: mockConfig.workingDirectory,
        env: expect.objectContaining({
          OPENROUTER_API_KEY: 'test-key'
        })
      })
    );
    
    expect(result).toEqual({
      success: true,
      artifacts: ['file1.txt', 'file2.txt']
    });
  });

  it('should handle goose execution errors', async () => {
    const worker = makeGooseWorker(mockConfig);
    
    // Mock execution failure
    mockExec.mockRejectedValueOnce(new Error('Command failed'));
    
    const result = await worker(mockTask);
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(mockConfig.workingDirectory, 'execution-error.md'),
      expect.stringContaining('Task Execution Failed'),
      'utf-8'
    );
    
    expect(result).toEqual({
      success: false,
      artifacts: ['execution-error.md'],
      error: expect.any(Error)
    });
  });

  it('should handle timeout errors', async () => {
    const worker = makeGooseWorker(mockConfig);
    
    // Mock timeout error
    const timeoutError = new Error('timeout');
    timeoutError.name = 'AbortError';
    mockExec.mockRejectedValueOnce(timeoutError);
    
    const result = await worker(mockTask);
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(mockConfig.workingDirectory, 'timeout-error.md'),
      expect.stringContaining('Task Execution Timed Out'),
      'utf-8'
    );
    
    expect(result).toEqual({
      success: false,
      artifacts: ['timeout-error.md'],
      error: expect.any(Error)
    });
  });

  it('should handle stderr errors', async () => {
    const worker = makeGooseWorker(mockConfig);
    
    // Mock stderr with error
    mockExec.mockResolvedValueOnce({ 
      stdout: 'output', 
      stderr: 'Error: Something went wrong' 
    });
    
    const result = await worker(mockTask);
    
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Goose execution failed');
  });

  it('should use custom instructions file when provided', async () => {
    const customConfig = {
      ...mockConfig,
      goose: {
        ...mockConfig.goose,
        instructionsFile: '/custom/path/instructions.md'
      }
    };
    
    const worker = makeGooseWorker(customConfig);
    
    mockExec
      .mockResolvedValueOnce({ stdout: 'success', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' });
    
    await worker(mockTask);
    
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/custom/path/instructions.md',
      mockTask.description,
      'utf-8'
    );
    
    expect(mockExec).toHaveBeenCalledWith(
      'goose run --model gpt-4 --provider openrouter /custom/path/instructions.md',
      expect.any(Object)
    );
  });

  it('should work without API keys', async () => {
    const configWithoutKeys = {
      ...mockConfig,
      apiKeys: undefined
    };
    
    const worker = makeGooseWorker(configWithoutKeys);
    
    mockExec
      .mockResolvedValueOnce({ stdout: 'success', stderr: '' })
      .mockResolvedValueOnce({ stdout: '', stderr: '' });
    
    await worker(mockTask);
    
    expect(mockExec).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        env: expect.not.objectContaining({
          OPENROUTER_API_KEY: expect.any(String)
        })
      })
    );
  });

  it('should handle empty git status output', async () => {
    const worker = makeGooseWorker(mockConfig);
    
    mockExec
      .mockResolvedValueOnce({ stdout: 'success', stderr: '' })
      .mockResolvedValueOnce({ stdout: '\n\n', stderr: '' }); // empty git status
    
    const result = await worker(mockTask);
    
    expect(result).toEqual({
      success: true,
      artifacts: []
    });
  });
});