import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGitDeps, createBranchName, type GitConfig } from './git-operations.js';
import { castNonEmptyString } from '@taiga-task-master/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { simpleGit } from 'simple-git';

describe('Git Operations', () => {
  // eslint-disable-next-line functional/no-let
  let tempDir: string;
  // eslint-disable-next-line functional/no-let
  let gitOps: ReturnType<typeof createGitDeps>;
  
  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-ops-test-'));
    
    // Initialize git repository
    const git = simpleGit(tempDir);
    await git.init();
    
    // Set up git configuration to avoid SSH issues
    await git.addConfig('user.name', 'Test User', false, 'local');
    await git.addConfig('user.email', 'test@example.com', false, 'local');
    await git.addConfig('commit.gpgsign', 'false', false, 'local');
    await git.addConfig('core.sshCommand', 'ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no', false, 'local');
    
    // Set main as the default branch
    await git.checkoutLocalBranch('main');
    
    // Create initial commit
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Test Repository');
    await git.add('README.md');
    await git.commit('Initial commit');
    
    // Create git operations instance
    const config: GitConfig = {
      userConfig: { name: 'Test User', email: 'test@example.com' },
      isolation: true // Don't try to push in tests
    };
    gitOps = createGitDeps(config, tempDir);
  });
  
  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('createBranchName', () => {
    it('should create consistent branch names for the same task', () => {
      const task = castNonEmptyString('Implement user authentication');
      const branchName1 = createBranchName(task);
      const branchName2 = createBranchName(task);
      
      expect(branchName1).toBe(branchName2);
      expect(branchName1).toMatch(/^task-\d+$/);
    });

    it('should create different branch names for different tasks', () => {
      const task1 = castNonEmptyString('Implement user authentication');
      const task2 = castNonEmptyString('Add payment processing');
      const branchName1 = createBranchName(task1);
      const branchName2 = createBranchName(task2);
      
      expect(branchName1).not.toBe(branchName2);
    });
  });

  describe('isClean', () => {
    it('should return true for a clean repository', async () => {
      const isClean = await gitOps.isClean();
      expect(isClean).toBe(true);
    });

    it('should return false when there are uncommitted changes', async () => {
      // Create a new file
      await fs.writeFile(path.join(tempDir, 'new-file.txt'), 'new content');
      
      const isClean = await gitOps.isClean();
      expect(isClean).toBe(false);
    });

    it('should return false when there are staged changes', async () => {
      // Create and stage a new file
      await fs.writeFile(path.join(tempDir, 'staged-file.txt'), 'staged content');
      const git = simpleGit(tempDir);
      await git.add('staged-file.txt');
      
      const isClean = await gitOps.isClean();
      expect(isClean).toBe(false);
    });
  });

  describe('branch', () => {
    it('should create and checkout a new branch', async () => {
      const taskDescription = castNonEmptyString('Implement feature X');
      const branchName = await gitOps.branch(taskDescription);
      
      expect(branchName).toMatch(/^task-\d+$/);
      
      // Verify we're on the new branch
      const git = simpleGit(tempDir);
      const status = await git.status();
      expect(status.current).toBe(branchName);
    });

    it('should return to main branch after checkout', async () => {
      // First, create a task branch
      const taskDescription = castNonEmptyString('Test task');
      await gitOps.branch(taskDescription);
      
      // Verify we can go back to main
      const git = simpleGit(tempDir);
      await git.checkout('main');
      const status = await git.status();
      expect(status.current).toBe('main');
    });
  });

  describe('commitAndPush', () => {
    it('should commit changes when files are modified', async () => {
      // Create a task branch
      const taskDescription = castNonEmptyString('Test commit task');
      await gitOps.branch(taskDescription);
      
      // Make some changes
      await fs.writeFile(path.join(tempDir, 'test-file.txt'), 'test content');
      
      // Commit changes
      await gitOps.commitAndPush();
      
      // Verify commit was made
      const git = simpleGit(tempDir);
      const log = await git.log();
      expect(log.latest?.message).toBe('Task completed');
    });

    it('should do nothing when there are no changes', async () => {
      // Create a task branch
      const taskDescription = castNonEmptyString('No changes task');
      await gitOps.branch(taskDescription);
      
      // Try to commit without changes
      await expect(gitOps.commitAndPush()).resolves.not.toThrow();
      
      // Verify no new commits were made
      const git = simpleGit(tempDir);
      const log = await git.log();
      expect(log.latest?.message).toBe('Initial commit');
    });
  });

  describe('cleanup', () => {
    it('should return to previous branch and clean up', async () => {
      // Start on main branch
      const git = simpleGit(tempDir);
      // eslint-disable-next-line functional/no-let
      let status = await git.status();
      const initialBranch = castNonEmptyString(status.current || 'main');
      
      // Create a task branch
      const taskDescription = castNonEmptyString('Cleanup test task');
      const _taskBranch = await gitOps.branch(taskDescription);
      
      // Make some uncommitted changes
      await fs.writeFile(path.join(tempDir, 'uncommitted.txt'), 'uncommitted content');
      
      // Cleanup should discard changes and return to initial branch
      await gitOps.cleanup(initialBranch);
      
      status = await git.status();
      expect(status.current).toBe(initialBranch);
      expect(status.isClean()).toBe(true);
      
      // Verify uncommitted file was removed
      const fileExists = await fs.access(path.join(tempDir, 'uncommitted.txt')).then(() => true).catch(() => false);
      expect(fileExists).toBe(false);
    });
  });

  describe('verifyBranchChain', () => {
    it('should return git repository information', async () => {
      if (gitOps.verifyBranchChain) {
        const result = await gitOps.verifyBranchChain();
        
        expect(result).toHaveProperty('branches');
        expect(result).toHaveProperty('currentBranch');
        expect(result).toHaveProperty('latestCommit');
        expect(result).toHaveProperty('totalCommits');
        
        const resultObj = result as {
          branches: string[];
          currentBranch: string;
          latestCommit: unknown;
          totalCommits: number;
        };
        
        expect(Array.isArray(resultObj.branches)).toBe(true);
        expect(typeof resultObj.currentBranch).toBe('string');
        expect(typeof resultObj.totalCommits).toBe('number');
      }
    });
  });

  describe('dumpFullState', () => {
    it('should log git state information', async () => {
      if (gitOps.dumpFullState) {
        // Mock console.log to capture output
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        
        await gitOps.dumpFullState('test-label');
        
        expect(logSpy).toHaveBeenCalledWith('=== GIT STATE [test-label] ===');
        expect(logSpy).toHaveBeenCalledWith('========================');
        
        logSpy.mockRestore();
      }
    });
  });

  describe('error handling', () => {
    it('should handle cleanup errors gracefully', async () => {
      const invalidBranch = castNonEmptyString('non-existent-branch');
      
      // This should not throw but should handle the error gracefully
      await expect(gitOps.cleanup(invalidBranch)).resolves.not.toThrow();
    });
  });
});