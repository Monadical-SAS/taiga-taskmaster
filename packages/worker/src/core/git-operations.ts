/* eslint-disable functional/no-expression-statements */
import { NonEmptyString, castNonEmptyString } from '@taiga-task-master/common';
import type { GitOperations } from './types.js';
import { simpleGit, type SimpleGit } from 'simple-git';
import { cyrb53 } from '../utils/hash.js';

export interface GitConfig {
  readonly userConfig?: { readonly name: string; readonly email: string };
  readonly isolation?: boolean;
}

export const createBranchName = (task: NonEmptyString): NonEmptyString => {
  const hash = cyrb53(task);
  return castNonEmptyString(`task-${hash.toString()}`);
};

export const createGitDeps = (config: GitConfig = {}, workingDirectory: string): GitOperations => {
  const git: SimpleGit = simpleGit({
    baseDir: workingDirectory,
    config: [
      ...(config.userConfig ? [
        `user.name=${config.userConfig.name}`,
        `user.email=${config.userConfig.email}`
      ] : []),
      'commit.gpgsign=false', // Disable GPG signing for tests
      'core.sshCommand=ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'
    ]
  });
  
  // eslint-disable-next-line functional/no-let
  let currentBranch: NonEmptyString | null = null;
  
  return {
    isClean: async (): Promise<boolean> => {
      const status = await git.status();
      return status.isClean();
    },
    
    branch: async (name: NonEmptyString): Promise<NonEmptyString> => {
      // Store current branch for potential cleanup
      const status = await git.status();
       
      currentBranch = castNonEmptyString(status.current || 'main');
      
      // Create and checkout new branch
      const branchName = createBranchName(name);
      await git.checkoutLocalBranch(branchName);
      
      return branchName;
    },
    
    commitAndPush: async (): Promise<void> => {
      const status = await git.status();
      
      if (status.files.length === 0) {
        // No changes to commit
        return;
      }
      
      // Add all changes
      await git.add('.');
      
      // Commit changes
      await git.commit('Task completed');
      
      // Push if not in isolation mode
      if (!config.isolation) {
        try {
          await git.push('origin', status.current || 'main', ['--set-upstream']);
        } catch (error) {
          // Handle push errors
          console.error('Failed to push changes:', error);
          throw error;
        }
      }
    },
    
    cleanup: async (previousBranch: NonEmptyString): Promise<void> => {
      try {
        // Discard any uncommitted changes (tracked files)
        await git.reset(['--hard']);
        
        // Remove untracked files and directories
        await git.clean('f', ['-d']);
        
        // Checkout previous branch
        try {
          await git.checkout(previousBranch);
        } catch (checkoutError) {
          console.error('Failed to checkout previous branch:', checkoutError);
          // If checkout fails, we can't proceed with cleanup
          return;
        }
        
        // Delete the task branch if it exists and we're not in the branch
        const status = await git.status();
        if (status.current !== currentBranch) {
          const branches = await git.branchLocal();
          if (currentBranch && branches.all.includes(String(currentBranch))) {
            try {
              await git.deleteLocalBranch(String(currentBranch), true);
            } catch (deleteError) {
              console.error('Failed to delete task branch:', deleteError);
              // Continue - this is not critical
            }
          }
        }
      } catch (error) {
        console.error('Failed to cleanup git state:', error);
        // Still attempt to checkout previous branch even if other cleanup fails
        try {
          await git.checkout(previousBranch);
        } catch (finalError) {
          console.error('Failed final checkout attempt:', finalError);
          // We've done our best - don't throw
        }
      }
    },
    
    verifyBranchChain: async (): Promise<unknown> => {
      const branches = await git.branchLocal();
      const logs = await git.log();
      
      return {
        branches: branches.all,
        currentBranch: branches.current,
        latestCommit: logs.latest,
        totalCommits: logs.total
      };
    },
    
    dumpFullState: async (label: string): Promise<void> => {
      const status = await git.status();
      const branches = await git.branchLocal();
      
      console.log(`=== GIT STATE [${label}] ===`);
      console.log('Current branch:', status.current);
      console.log('Is clean:', status.isClean());
      console.log('Modified files:', status.modified);
      console.log('Created files:', status.created);
      console.log('Deleted files:', status.deleted);
      console.log('All branches:', branches.all);
      console.log('========================');
    }
  };
};