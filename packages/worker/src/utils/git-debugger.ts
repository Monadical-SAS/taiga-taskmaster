// @vibe-generated: conforms to worker-interface
import { simpleGit } from "simple-git";
import { castNonEmptyString, type NonEmptyString } from "@taiga-task-master/common";
import { createBranchName } from "../core/git-operations.js";
import * as fs from "fs/promises";
import * as path from "path";

export interface GitDebugger {
  dumpFullState: (label: string) => Promise<void>;
  verifyBranchChain: () => Promise<{
    taskBranches: string[];
    relationships: Array<{
      from: string;
      to: string;
      type: 'chains' | 'diverged';
    }>;
  }>;
  verifyWorkArtifacts: (taskDescription: string, expectedBranch: string) => Promise<void>;
  verifyCleanupEffectiveness: (failedBranch: string, returnedBranch: string) => Promise<void>;
}

export const createGitDebugger = (workingDir: string): GitDebugger => {
  const git = simpleGit(workingDir);

  return {
    async dumpFullState(label: string) {
      console.log(`\n🔍 [GIT DEBUG] ${label}`);
      console.log(`📁 Working directory: ${workingDir}`);
      
      try {
        // Current branch and position
        const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
        const currentCommit = await git.revparse(["HEAD"]);
        console.log(`🌿 Current branch: ${currentBranch}`);
        console.log(`📝 Current commit: ${currentCommit.substring(0, 8)}`);

        // All branches with commit hashes
        const branches = await git.branchLocal();
        console.log(`🌳 Branches (${branches.all.length}):`);
        await Promise.all(branches.all.map(async (branch) => {
          const isCurrentBranch = branch === currentBranch.trim();
          const marker = isCurrentBranch ? " (*)" : "    ";
          try {
            const commit = await git.revparse([branch]);
            const log = await git.log([branch, "-1", "--oneline"]);
            const message = log.latest?.message || "[No message]";
            console.log(`${marker}${branch.padEnd(15)} → ${commit.substring(0, 8)} "${message}"`);
          } catch (error) {
            console.log(`${marker}${branch.padEnd(15)} → [ERROR: ${error}]`);
          }
        }));

        // Recent commits graph
        try {
          const graph = await git.raw(["log", "--oneline", "--graph", "--all", "-10"]);
          console.log(`📊 Recent commit graph:\n${graph}`);
        } catch (error) {
          console.log(`📊 Cannot show commit graph: ${error}`);
        }

        // Working directory status
        const status = await git.status();
        console.log(`📂 Working directory status:`);
        console.log(`   📄 Modified: ${status.modified.length} files`);
        console.log(`   ➕ Added: ${status.created.length} files`);
        console.log(`   ❌ Deleted: ${status.deleted.length} files`);
        console.log(`   ❓ Untracked: ${status.not_added.length} files`);
        
        if (status.files.length > 0) {
          console.log(`   Files details:`);
          status.files.forEach((file) => {
            console.log(`     ${file.index}${file.working_dir} ${file.path}`);
          });
        }

        // Repository file listings
        try {
          const allFiles = await fs.readdir(workingDir, { recursive: true });
          const workFiles = allFiles.filter(f => 
            typeof f === 'string' && 
            !f.includes('.git/') && 
            !f.startsWith('.git') &&
            !f.includes('node_modules/')
          );
          console.log(`📁 Repository files (${workFiles.length}):`);
          await Promise.all(workFiles.slice(0, 10).map(async (file) => {
            try {
              const fullPath = path.join(workingDir, file.toString());
              const stat = await fs.stat(fullPath);
              const type = stat.isDirectory() ? '📁' : '📄';
              console.log(`   ${type} ${file}`);
            } catch (error) {
              console.log(`   ❓ ${file} (cannot stat: ${error})`);
            }
          }));
          if (workFiles.length > 10) {
            console.log(`   ... and ${workFiles.length - 10} more files`);
          }
        } catch (error) {
          console.log(`📁 Cannot list repository files: ${error}`);
        }

      } catch (error) {
        console.log(`🚨 [GIT DEBUG] Error during state dump: ${error}`);
      }
    },

    async verifyBranchChain() {
      console.log(`\n🔗 [GIT DEBUG] Verifying branch chain...`);
      
      try {
        // Get all local branches except main
        const branches = await git.branchLocal();
        const taskBranches = branches.all.filter(b => 
          b !== "main" && (b.startsWith("task-") || /^[0-9]+$/.test(b))
        );
        
        console.log(`📊 Task branches found: ${taskBranches.length}`);
        if (taskBranches.length === 0) {
          console.log(`   ℹ️  No task branches to verify`);
          return { taskBranches: [], relationships: [] };
        }
        
        // Show each branch with its commit info
        await Promise.all(taskBranches.map(async (branch) => {
          try {
            const commit = await git.revparse([branch]);
            const log = await git.log([branch, "-1", "--oneline"]);
            const commitMessage = log.latest?.message || "[No commit message]";
            console.log(`   🌿 ${branch.padEnd(15)} → ${commit.substring(0, 8)} "${commitMessage}"`);
          } catch (error) {
            console.log(`   🌿 ${branch.padEnd(15)} → [ERROR: ${error}]`);
          }
        }));
        
        // Show branch relationships
        console.log(`🔄 Branch chain (creation order):`);
        const relationships: Array<{ from: string; to: string; type: 'chains' | 'diverged' }> = [];
        
        // Sort branches by their commits ahead of main
        const branchesWithOrder = await Promise.all(taskBranches.map(async (branch) => {
          try {
            const aheadBehind = await git.raw(["rev-list", "--left-right", "--count", `main...${branch}`]);
            const [behind, ahead] = aheadBehind.trim().split('\t').map(Number);
            return { branch, ahead, behind };
          } catch {
            return { branch, ahead: 999, behind: 0 };
          }
        }));
        
        // Sort by commits ahead (creation order)
        // eslint-disable-next-line functional/immutable-data
        branchesWithOrder.sort((a, b) => (a.ahead || 0) - (b.ahead || 0));
        const sortedBranches = branchesWithOrder.map(b => b.branch);
        
        console.log(`   📅 Creation order: ${sortedBranches.join(' → ')}`);
        
        // Verify each branch chains from the previous one
        const chainResults = await Promise.all(sortedBranches.map(async (currentBranch, i) => {
          if (i === 0) {
            // First branch should be based on main
            try {
              const mergeBase = await git.raw(["merge-base", "main", currentBranch]);
              const mainCommit = await git.revparse(["main"]);
              const basedOnMain = mergeBase.trim() === mainCommit.trim();
              console.log(`   ${currentBranch} ${basedOnMain ? '✅' : '❌'} chains from main`);
              return { from: 'main', to: currentBranch, type: basedOnMain ? 'chains' as const : 'diverged' as const };
            } catch (gitError) {
              console.log(`   ${currentBranch} ❓ main (cannot verify: ${gitError})`);
              return null;
            }
          } else {
            // Subsequent branches should chain from previous
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const previousBranch = sortedBranches[i - 1]!;
            try {
              const mergeBase = await git.raw(["merge-base", previousBranch, currentBranch]);
              const prevCommit = await git.revparse([previousBranch]);
              const chainsFromPrev = mergeBase.trim() === prevCommit.trim();
              console.log(`   ${currentBranch} ${chainsFromPrev ? '✅' : '❌'} chains from ${previousBranch}`);
              return { from: previousBranch, to: currentBranch, type: chainsFromPrev ? 'chains' as const : 'diverged' as const };
            } catch (gitError) {
              console.log(`   ${currentBranch} ❓ ${previousBranch} (cannot verify: ${gitError})`);
              return null;
            }
          }
        }));
        
        const validRelationships = chainResults.filter(result => result !== null);
        const finalRelationships = [...relationships, ...validRelationships];
        
        return { taskBranches, relationships: finalRelationships };
        
      } catch (error) {
        console.log(`🚨 [GIT DEBUG] Error during branch chain verification: ${error}`);
        return { taskBranches: [], relationships: [] };
      }
    },

    async verifyWorkArtifacts(taskDescription: string, expectedBranch: string) {
      console.log(`\n🔍 [GIT DEBUG] Verifying work artifacts for: "${taskDescription}"`);
      console.log(`🎯 Expected branch: ${expectedBranch}`);
      
      try {
        // Verify branch exists
        const branches = await git.branchLocal();
        const branchExists = branches.all.includes(expectedBranch);
        console.log(`🌿 Branch exists: ${branchExists ? '✅' : '❌'}`);
        
        if (!branchExists) {
          console.log(`❌ Cannot verify artifacts - branch does not exist`);
          return;
        }
        
        // Switch to the branch for verification
        const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
        if (currentBranch.trim() !== expectedBranch) {
          await git.checkout(expectedBranch);
          console.log(`🔄 Switched to branch: ${expectedBranch}`);
        }
        
        // Check for work files
        const status = await git.status();
        const workFiles = [...status.created, ...status.modified, ...status.staged];
        console.log(`📄 Work files found: ${workFiles.length}`);
        
        if (workFiles.length > 0) {
          console.log(`   Files created/modified:`);
          await Promise.all(workFiles.map(async (file) => {
            console.log(`     📄 ${file}`);
            
            // Preview file content if it's a code file
            if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.py') || file.endsWith('.md')) {
              try {
                const content = await fs.readFile(path.join(workingDir, file), 'utf-8');
                const preview = content.substring(0, 200);
                console.log(`       Preview: "${preview}${content.length > 200 ? '...' : ''}"`);
                
                // Check if task description is mentioned in the content
                const includesTask = content.toLowerCase().includes(taskDescription.toLowerCase());
                console.log(`       Task reference: ${includesTask ? '✅' : '❓'}`);
              } catch (error) {
                console.log(`       Cannot preview: ${error}`);
              }
            }
          }));
        }
        
        // Verify commit message
        try {
          const log = await git.log([expectedBranch, "-1"]);
          const commitMessage = log.latest?.message || "";
          console.log(`📝 Latest commit: "${commitMessage}"`);
          
          const messageIncludesTask = commitMessage.toLowerCase().includes(taskDescription.toLowerCase());
          console.log(`📝 Commit references task: ${messageIncludesTask ? '✅' : '❓'}`);
        } catch (error) {
          console.log(`📝 Cannot verify commit message: ${error}`);
        }
        
        // Count commits ahead of main
        try {
          const aheadBehind = await git.raw(["rev-list", "--left-right", "--count", `main...${expectedBranch}`]);
          const [behind, ahead] = aheadBehind.trim().split('\t').map(Number);
          console.log(`📊 Commits ahead of main: ${ahead}`);
          console.log(`📊 Commits behind main: ${behind}`);
        } catch (error) {
          console.log(`📊 Cannot count commits: ${error}`);
        }
        
      } catch (error) {
        console.log(`🚨 [GIT DEBUG] Error during work artifacts verification: ${error}`);
      }
    },

    async verifyCleanupEffectiveness(failedBranch: string, returnedBranch: string) {
      console.log(`\n🧹 [GIT DEBUG] Verifying cleanup effectiveness`);
      console.log(`❌ Failed branch: ${failedBranch}`);
      console.log(`🔄 Returned to: ${returnedBranch}`);
      
      try {
        // Verify current branch
        const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
        const correctBranch = currentBranch.trim() === returnedBranch;
        console.log(`🌿 Current branch: ${currentBranch.trim()} (expected: ${returnedBranch}) ${correctBranch ? '✅' : '❌'}`);
        
        // Verify failed branch was removed
        const branches = await git.branchLocal();
        const failedBranchExists = branches.all.includes(failedBranch);
        console.log(`🗑️  Failed branch removed: ${!failedBranchExists ? '✅' : '❌'} (${failedBranch} ${failedBranchExists ? 'still exists' : 'removed'})`);
        
        // Verify working directory is clean
        const status = await git.status();
        const isClean = status.files.length === 0;
        console.log(`🧽 Working directory clean: ${isClean ? '✅' : '❌'} (${status.files.length} files)`);
        
        if (!isClean) {
          console.log(`   Remaining files:`);
          status.files.forEach((file) => {
            console.log(`     ${file.index}${file.working_dir} ${file.path}`);
          });
        }
        
        // List any remaining files for manual review
        try {
          const allFiles = await fs.readdir(workingDir, { recursive: true });
          const workFiles = allFiles.filter(f => 
            typeof f === 'string' && 
            !f.includes('.git/') && 
            !f.startsWith('.git') &&
            !f.includes('node_modules/')
          );
          console.log(`📁 Repository files remaining: ${workFiles.length}`);
          if (workFiles.length > 0 && workFiles.length <= 5) {
            workFiles.forEach((file) => {
              console.log(`     📄 ${file}`);
            });
          }
        } catch (error) {
          console.log(`📁 Cannot list remaining files: ${error}`);
        }
        
      } catch (error) {
        console.log(`🚨 [GIT DEBUG] Error during cleanup verification: ${error}`);
      }
    }
  };
};