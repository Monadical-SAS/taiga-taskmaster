// @vibe-generated: real git integration tests for loop function
/* eslint-disable functional/no-let, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars */
import { describe, it, beforeEach, afterEach, expect } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { simpleGit, type SimpleGit } from "simple-git";
import { Option } from "effect";
import { type LooperDeps, loop } from "../../src/index.js";
import { castNonEmptyString, cyrb53, type NonEmptyString } from "@taiga-task-master/common";

// Comprehensive git debug utilities for human verification
const createGitDebugger = (git: SimpleGit, tempDir: string) => ({
  
  async dumpFullState(label: string) {
    console.log(`\n🔍 [${label}] FULL GIT STATE DUMP`);
    console.log("=".repeat(60));
    
    try {
      // Current branch and position
      const current = await git.revparse(["--abbrev-ref", "HEAD"]);
      const commit = await git.revparse(["HEAD"]);
      console.log(`📍 Current: ${current} @ ${commit.substring(0, 8)}`);
      
      // All branches with their commit hashes and status
      const branches = await git.branchLocal();
      console.log(`🌲 Branches (${branches.all.length}):`);
      for (const branch of branches.all) {
        try {
          const branchCommit = await git.revparse([branch]);
          const marker = branch === current ? "👉" : "  ";
          console.log(`${marker} ${branch.padEnd(20)} → ${branchCommit.substring(0, 8)}`);
        } catch {
          console.log(`   ${branch.padEnd(20)} → [ERROR]`);
        }
      }
      
      // Commit graph for recent commits
      const log = await git.log(["--oneline", "--graph", "--all", "-10"]);
      console.log(`📈 Recent commit graph (${log.all.length} commits):`);
      log.all.forEach((commit, index) => {
        const prefix = index < 5 ? "   " : "   ";
        console.log(`${prefix}${commit.hash.substring(0, 8)} ${commit.message}`);
      });
      
      // Working directory status with detailed file info
      const status = await git.status();
      const isClean = status.isClean();
      console.log(`📊 Working dir: ${isClean ? "✅ CLEAN" : "⚠️  DIRTY"} (${status.files.length} files)`);
      if (!isClean) {
        if (status.created.length > 0) {
          console.log(`   📄 Created: ${status.created.join(", ")}`);
        }
        if (status.modified.length > 0) {
          console.log(`   ✏️  Modified: ${status.modified.join(", ")}`);
        }
        if (status.not_added.length > 0) {
          console.log(`   ❓ Untracked: ${status.not_added.join(", ")}`);
        }
        if (status.deleted.length > 0) {
          console.log(`   🗑️  Deleted: ${status.deleted.join(", ")}`);
        }
        if (status.conflicted.length > 0) {
          console.log(`   ⚔️  Conflicted: ${status.conflicted.join(", ")}`);
        }
      }
      
      // File system artifacts
      const files = await fs.readdir(tempDir);
      const workFiles = files.filter(f => !f.startsWith('.git') && !f.startsWith('.'));
      const gitFiles = files.filter(f => f.startsWith('.git'));
      console.log(`📁 Repository files:`);
      console.log(`   📄 Work files (${workFiles.length}): ${workFiles.length > 0 ? workFiles.join(", ") : "NONE"}`);
      console.log(`   🔧 Git files (${gitFiles.length}): ${gitFiles.join(", ")}`);
      
      // Show file contents for verification (only work files, limited)
      if (workFiles.length > 0 && workFiles.length <= 5) {
        console.log(`📖 File contents preview:`);
        for (const file of workFiles.slice(0, 3)) { // Limit to first 3 files
          try {
            const content = await fs.readFile(join(tempDir, file), "utf-8");
            const preview = content.split('\n').slice(0, 2).join(' | '); // First 2 lines
            console.log(`   ${file}: ${preview.substring(0, 80)}${preview.length > 80 ? '...' : ''}`);
          } catch {
            console.log(`   ${file}: [Cannot read]`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Error during state dump: ${error}`);
    }
    
    console.log("=".repeat(60));
  },
  
  async verifyBranchChain() {
    console.log(`\n🔗 BRANCH CHAIN VERIFICATION`);
    console.log("-".repeat(40));
    
    try {
      // Get all local branches except main
      const branches = await git.branchLocal();
      const taskBranches = branches.all.filter(b => b !== "main" && (b.startsWith("task-") || /^[0-9]+$/.test(b)));
      
      console.log(`📊 Task branches found: ${taskBranches.length}`);
      if (taskBranches.length === 0) {
        console.log(`   ℹ️  No task branches to verify`);
        return { taskBranches: [], relationships: [] };
      }
      
      // Show each branch with its commit info
      const branchInfo = [];
      for (const branch of taskBranches) {
        try {
          const commit = await git.revparse([branch]);
          const log = await git.log([branch, "-1", "--oneline"]);
          const commitMessage = log.latest?.message || "[No commit message]";
          console.log(`   🌿 ${branch.padEnd(15)} → ${commit.substring(0, 8)} "${commitMessage}"`);
          branchInfo.push({ branch, commit, message: commitMessage });
        } catch (error) {
          console.log(`   🌿 ${branch.padEnd(15)} → [ERROR: ${error}]`);
        }
      }
      
      // Show branch relationships - sort by creation order and show linear chain
      console.log(`🔄 Branch chain (creation order):`);
      const relationships = [];
      
      // Sort branches by their commits ahead of main (proxy for creation order)
      const branchesWithOrder = [];
      for (const branch of taskBranches) {
        try {
          const aheadBehind = await git.raw(["rev-list", "--left-right", "--count", `main...${branch}`]);
          const [behind, ahead] = aheadBehind.trim().split('\t').map(Number);
          branchesWithOrder.push({ branch, ahead, behind });
        } catch {
          branchesWithOrder.push({ branch, ahead: 999, behind: 0 }); // fallback
        }
      }
      
      // Sort by commits ahead (creation order)
      branchesWithOrder.sort((a, b) => (a.ahead || 0) - (b.ahead || 0));
      const sortedBranches = branchesWithOrder.map(b => b.branch);
      
      console.log(`   📅 Creation order: ${sortedBranches.join(' → ')}`);
      
      // Verify each branch chains from the previous one
      for (let i = 0; i < sortedBranches.length; i++) {
        const currentBranch = sortedBranches[i]!;
        
        if (i === 0) {
          // First branch should be based on main
          try {
            const mergeBase = await git.raw(["merge-base", "main", currentBranch]);
            const mainCommit = await git.revparse(["main"]);
            const basedOnMain = mergeBase.trim() === mainCommit.trim();
            console.log(`   ${currentBranch} ${basedOnMain ? '✅' : '❌'} chains from main`);
            relationships.push({ from: 'main', to: currentBranch, type: basedOnMain ? 'chains' : 'diverged' });
          } catch (error) {
            console.log(`   ${currentBranch} ❓ main (cannot verify: ${error})`);
          }
        } else {
          // Subsequent branches should chain from previous
          const previousBranch = sortedBranches[i - 1]!;
          try {
            const mergeBase = await git.raw(["merge-base", previousBranch, currentBranch]);
            const prevCommit = await git.revparse([previousBranch]);
            const chainsFromPrev = mergeBase.trim() === prevCommit.trim();
            console.log(`   ${currentBranch} ${chainsFromPrev ? '✅' : '❌'} chains from ${previousBranch}`);
            relationships.push({ from: previousBranch, to: currentBranch, type: chainsFromPrev ? 'chains' : 'diverged' });
          } catch (error) {
            console.log(`   ${currentBranch} ❓ ${previousBranch} (cannot verify: ${error})`);
          }
        }
      }
      
      // Verify chain from main
      console.log(`🌳 Chain from main branch:`);
      for (const branch of taskBranches) {
        try {
          const aheadBehind = await git.raw(["rev-list", "--left-right", "--count", `main...${branch}`]);
          const [behind, ahead] = aheadBehind.trim().split('\t').map(Number);
          console.log(`   ${branch}: ${ahead} commits ahead, ${behind} commits behind main`);
        } catch (error) {
          console.log(`   ${branch}: cannot determine position relative to main (${error})`);
        }
      }
      
      console.log("-".repeat(40));
      return { taskBranches, relationships };
      
    } catch (error) {
      console.log(`❌ Error during branch chain verification: ${error}`);
      return { taskBranches: [], relationships: [] };
    }
  },
  
  async verifyWorkArtifacts(taskDescription: string, expectedBranch: string) {
    console.log(`\n🎯 WORK VERIFICATION: "${taskDescription}"`);
    console.log("-".repeat(50));
    
    try {
      // Verify we're on expected branch
      const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
      const branchMatch = currentBranch === expectedBranch;
      console.log(`🌿 Branch: ${branchMatch ? "✅" : "❌"} Expected "${expectedBranch}", got "${currentBranch}"`);
      
      // Check for work artifacts (files that should exist)
      const files = await fs.readdir(tempDir);
      const workFiles = files.filter(f => !f.startsWith('.git') && !f.startsWith('.'));
      console.log(`📄 Work files: ${workFiles.length > 0 ? "✅" : "❌"} Found ${workFiles.length} files: ${workFiles.join(", ") || "NONE"}`);
      
      // Verify expected generated code file exists
      const expectedHash = cyrb53(taskDescription);
      const expectedCodeFile = `vibe-code-${expectedHash}.js`;
      const codeFileExists = workFiles.includes(expectedCodeFile);
      console.log(`🎯 Expected code file: ${codeFileExists ? "✅" : "❌"} "${expectedCodeFile}" ${codeFileExists ? "found" : "missing"}`);
      
      if (codeFileExists) {
        try {
          const codeFilePath = join(tempDir, expectedCodeFile);
          const content = await fs.readFile(codeFilePath, "utf-8");
          const lines = content.split('\n');
          console.log(`📖 Generated code preview:`);
          console.log(`   Line 1: ${lines[0] || "[empty]"}`);
          console.log(`   Line 2: ${lines[1] || "[empty]"}`);
          console.log(`   Line 3: ${lines[2] || "[empty]"}`);
          
          // Verify content matches task
          const containsTask = content.includes(taskDescription);
          console.log(`🔍 Content verification: ${containsTask ? "✅" : "❌"} ${containsTask ? "contains task description" : "missing task description"}`);
        } catch (error) {
          console.log(`❌ Cannot read code file content: ${error}`);
        }
      }
      
      // Verify last commit message
      try {
        const lastCommit = await git.log(["-1", "--pretty=format:%s"]);
        const commitMsg = lastCommit.latest?.message || "[No commit]";
        console.log(`💬 Last commit: "${commitMsg}"`);
        
        // Check if we have any commits on this branch beyond main
        try {
          const aheadCount = await git.raw(["rev-list", "--count", `main..${currentBranch}`]);
          const commitsAhead = parseInt(aheadCount.trim()) || 0;
          console.log(`📈 Commits ahead of main: ${commitsAhead > 0 ? "✅" : "⚠️"} ${commitsAhead} commits`);
        } catch {
          console.log(`📈 Commits ahead of main: ❓ Cannot determine`);
        }
      } catch (error) {
        console.log(`💬 Last commit: ❌ Cannot retrieve (${error})`);
      }
      
      console.log("-".repeat(50));
      
      return {
        branchMatch,
        workFilesCount: workFiles.length,
        codeFileExists,
        expectedCodeFile
      };
      
    } catch (error) {
      console.log(`❌ Error during work verification: ${error}`);
      console.log("-".repeat(50));
      return {
        branchMatch: false,
        workFilesCount: 0,
        codeFileExists: false,
        expectedCodeFile: `vibe-code-${cyrb53(taskDescription)}.js`
      };
    }
  },
  
  async verifyCleanupEffectiveness(failedBranch: string, returnedBranch: string) {
    console.log(`\n🧹 CLEANUP VERIFICATION`);
    console.log("-".repeat(40));
    
    try {
      // Check current branch
      const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
      const correctBranch = currentBranch === returnedBranch;
      console.log(`🌿 Branch restoration: ${correctBranch ? "✅" : "❌"} Expected "${returnedBranch}", got "${currentBranch}"`);
      
      // Check if failed branch still exists
      const branches = await git.branchLocal();
      const failedBranchExists = branches.all.includes(failedBranch);
      console.log(`🗑️  Failed branch cleanup: ${!failedBranchExists ? "✅" : "❌"} "${failedBranch}" ${failedBranchExists ? "still exists" : "removed"}`);
      
      // Check working directory cleanliness
      const status = await git.status();
      const isClean = status.isClean();
      console.log(`🧹 Working directory: ${isClean ? "✅" : "❌"} ${isClean ? "clean" : `dirty (${status.files.length} files)`}`);
      
      if (!isClean) {
        console.log(`   ⚠️  Remaining files:`);
        if (status.created.length > 0) console.log(`      Created: ${status.created.join(", ")}`);
        if (status.modified.length > 0) console.log(`      Modified: ${status.modified.join(", ")}`);
        if (status.not_added.length > 0) console.log(`      Untracked: ${status.not_added.join(", ")}`);
        if (status.deleted.length > 0) console.log(`      Deleted: ${status.deleted.join(", ")}`);
      }
      
      console.log("-".repeat(40));
      
      return {
        correctBranch,
        failedBranchRemoved: !failedBranchExists,
        workingDirClean: isClean
      };
      
    } catch (error) {
      console.log(`❌ Error during cleanup verification: ${error}`);
      console.log("-".repeat(40));
      return {
        correctBranch: false,
        failedBranchRemoved: false,
        workingDirClean: false
      };
    }
  }
});

const createBranchName = (task: NonEmptyString): NonEmptyString => {
  const hash = cyrb53(task);
  return castNonEmptyString(hash.toString());
};

describe("Loop Real Git Integration", () => {
  let tempDir: string;
  let git: SimpleGit;
  let realDeps: LooperDeps;
  let taskQueueRef: { value: string[] };
  let acknowledgedTasksRef: { value: Array<{ task: string; success: boolean; branch?: string }> };
  let currentTaskRef: { value: string | null };

  beforeEach(async () => {
    console.log(`\n🚀 [SETUP] Initializing test environment...`);
    
    // Create temporary directory
    tempDir = await fs.mkdtemp(join(tmpdir(), "loop-git-test-"));
    console.log(`📁 [SETUP] Created temp directory: ${tempDir}`);
    
    // Initialize git repository with complete isolation from user config
    console.log(`🔧 [SETUP] Configuring isolated git repository...`);
    git = simpleGit({
      baseDir: tempDir,
      config: [
        'user.name=Test User',
        'user.email=test@example.com',
        'commit.gpgsign=false',
        'tag.gpgsign=false',
        'init.defaultBranch=main',
        'core.sshCommand=',  // Disable SSH
        'credential.helper=',  // Disable credential helpers
      ]
    });
    
    await git.init();
    console.log(`📦 [SETUP] Git repository initialized`);
    
    // Ensure we're completely isolated from user's global git config
    await git.addConfig("user.name", "Test User", false, "local");
    await git.addConfig("user.email", "test@example.com", false, "local");
    await git.addConfig("commit.gpgsign", "false", false, "local");
    await git.addConfig("tag.gpgsign", "false", false, "local");
    await git.addConfig("core.sshCommand", "", false, "local");
    await git.addConfig("credential.helper", "", false, "local");
    console.log(`⚙️ [SETUP] Git configuration applied (isolated from user settings)`);
    
    // Create initial commit
    await fs.writeFile(join(tempDir, "README.md"), "# Test Repository");
    await git.add("README.md");
    await git.commit("Initial commit");
    console.log(`📝 [SETUP] Initial commit created`);
    console.log(`✅ [SETUP] Test environment ready!\n`);

    // Setup task queue and acknowledgment tracking
    taskQueueRef = { value: [] };
    acknowledgedTasksRef = { value: [] };
    currentTaskRef = { value: null };
    const retryCountRef = { value: new Map<string, number>() }; // Track retry attempts per task

    // Create real dependencies that interact with the file system and git
    realDeps = {
      runWorker: async (task) => {
        console.log(`\n🔧 [WORKER] Starting task: "${task.description}"`);
        
        // Create real generated code file (simulating what a worker would produce)
        const hash = cyrb53(task.description);
        const codeFilePath = join(tempDir, `vibe-code-${hash}.js`);
        const codeContent = `// @vibe-generated: ${task.description}
// Generated at: ${new Date().toISOString()}
// Task hash: ${hash}

export function ${task.description.replace(/[^a-zA-Z0-9]/g, '')}() {
  console.log("Implementation for: ${task.description}");
  // TODO: Actual implementation would go here
  return { success: true, task: "${task.description}" };
}

export default {
  taskDescription: "${task.description}",
  generatedAt: ${Date.now()},
  hash: ${hash}
};`;
        
        console.log(`📝 [WORKER] Creating new code file: ${codeFilePath}`);
        await fs.writeFile(codeFilePath, codeContent);
        console.log(`✅ [WORKER] New code file created`);
        
        // Modify existing code files to simulate real worker behavior
        const allFiles = await fs.readdir(tempDir);
        const existingCodeFiles = allFiles.filter(f => f.startsWith('vibe-code-') && f.endsWith('.js') && f !== `vibe-code-${hash}.js`);
        
        if (existingCodeFiles.length > 0) {
          console.log(`🔄 [WORKER] Modifying ${existingCodeFiles.length} existing code file(s)...`);
          
          for (const existingFile of existingCodeFiles) {
            const existingPath = join(tempDir, existingFile);
            let existingContent = await fs.readFile(existingPath, 'utf-8');
            
            // Add integration comment and import for the new task
            const integrationComment = `
// Integration with: ${task.description} (added by task: ${task.description})
// Modified at: ${new Date().toISOString()}`;
            
            const importStatement = `import { ${task.description.replace(/[^a-zA-Z0-9]/g, '')} } from './vibe-code-${hash}.js';`;
            
            // Insert at the end of the file, before the export default
            const exportIndex = existingContent.lastIndexOf('export default');
            if (exportIndex !== -1) {
              existingContent = existingContent.slice(0, exportIndex) + 
                integrationComment + '\\n\\n' +
                existingContent.slice(exportIndex);
            } else {
              existingContent += integrationComment;
            }
            
            // Add import at the top (after existing comments)
            const lines = existingContent.split('\\n');
            const firstExportIndex = lines.findIndex(line => line.startsWith('export'));
            if (firstExportIndex !== -1) {
              lines.splice(firstExportIndex, 0, importStatement, '');
              existingContent = lines.join('\\n');
            }
            
            await fs.writeFile(existingPath, existingContent);
            console.log(`   📝 Modified: ${existingFile}`);
          }
          
          console.log(`✅ [WORKER] File modifications completed`);
        }
        
        // Also update README.md to track progress
        const readmePath = join(tempDir, 'README.md');
        let readmeContent = await fs.readFile(readmePath, 'utf-8');
        readmeContent += `\\n- ${new Date().toISOString()}: Completed "${task.description}" (hash: ${hash})`;
        await fs.writeFile(readmePath, readmeContent);
        console.log(`📋 [WORKER] Updated README.md with task progress`);
        
        const modificationSummary = existingCodeFiles.length > 0 ? 
          ` + modified ${existingCodeFiles.length} existing files` : '';
        
        return {
          output: [{
            line: `Created ${codeFilePath}${modificationSummary} + updated README.md`,
            timestamp: Date.now()
          }]
        };
      },

      pullTask: async (options) => {
        if (taskQueueRef.value.length === 0) {
          console.log(`⏳ [QUEUE] No more tasks available, waiting for abort...`);
          // Wait for abort signal when no more tasks
          return new Promise((_, reject) => {
            const checkAbort = () => {
              if (options?.signal?.aborted) {
                console.log(`🛑 [QUEUE] Abort signal received`);
                reject(new Error("AbortError"));
              } else {
                setTimeout(checkAbort, 10);
              }
            };
            checkAbort();
          });
        }
        const task = taskQueueRef.value.shift();
        console.log(`📋 [QUEUE] Pulled task: "${task}" (${taskQueueRef.value.length} remaining)`);
        currentTaskRef.value = task!;
        return {
          type: 'task' as const,
          description: castNonEmptyString(task!)
        };
      },

      ackTask: async (result) => {
        if (currentTaskRef.value) {
          const success = Option.isSome(result);
          const branch = success ? result.value.branch : undefined;
          const task = currentTaskRef.value;
          
          console.log(`📨 [ACK] Task "${task}" ${success ? '✅ SUCCESS' : '❌ FAILED'}${branch ? ` (branch: ${branch})` : ''}`);
          
          if (success) {
            // Task succeeded - remove from retry tracking
            retryCountRef.value.delete(task);
            acknowledgedTasksRef.value.push({
              task,
              success: true,
              branch
            });
          } else {
            // Task failed - check retry count and decide whether to retry
            const currentRetries = retryCountRef.value.get(task) || 0;
            const maxRetries = 2; // Allow 2 retries (3 total attempts)
            
            if (currentRetries < maxRetries) {
              // Put task back in queue for retry
              retryCountRef.value.set(task, currentRetries + 1);
              taskQueueRef.value.unshift(task); // Add to front of queue for immediate retry
              console.log(`🔄 [RETRY] Task "${task}" failed, retry ${currentRetries + 1}/${maxRetries} - added back to queue`);
            } else {
              // Max retries exceeded - permanently fail the task
              console.log(`❌ [FINAL FAIL] Task "${task}" failed after ${maxRetries} retries - giving up`);
              acknowledgedTasksRef.value.push({
                task,
                success: false,
                branch
              });
              retryCountRef.value.delete(task);
            }
          }
          
          currentTaskRef.value = null;
        }
      },

      git: {
        isClean: async () => {
          const status = await git.status();
          const isClean = status.files.length === 0;
          console.log(`🧹 [GIT] Repository ${isClean ? '✅ CLEAN' : '⚠️ DIRTY'} (${status.files.length} files)`);
          return isClean;
        },

        cleanup: async (previousBranch) => {
          // Get current branch (the task branch that failed)
          const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
          console.log(`🗑️ [GIT] Cleaning up failed task branch: ${currentBranch} (returning to: ${previousBranch})`);
          
          try {
            // Switch back to previous branch
            await git.checkout(previousBranch);
            console.log(`🔄 [GIT] Switched back to: ${previousBranch}`);
            
            // Delete the failed task branch
            if (currentBranch !== previousBranch) {
              await git.deleteLocalBranch(currentBranch);
              console.log(`🗑️ [GIT] Deleted failed task branch: ${currentBranch}`);
            }
          } catch (error) {
            console.log(`⚠️ [GIT] Cleanup error, trying fallback...`);
            // Try switching to previous branch anyway
            try {
              await git.checkout(previousBranch);
              console.log(`🔄 [GIT] Fallback: switched to ${previousBranch}`);
            } catch {
              console.log(`❌ [GIT] Could not switch to ${previousBranch}`);
            }
          }
        },

        branch: async (name) => {
          // Get current branch before switching
          const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
          console.log(`🌿 [GIT] Creating and switching to branch: ${name} (from ${currentBranch})`);
          await git.checkoutLocalBranch(name);
          console.log(`✅ [GIT] Now on branch: ${name}`);
          return castNonEmptyString(currentBranch);
        },

        commitAndPush: async () => {
          console.log(`💾 [GIT] Adding files to staging...`);
          await git.add(".");
          console.log(`📝 [GIT] Committing changes...`);
          await git.commit("Worker output");
          console.log(`✅ [GIT] Commit successful (local only)`);
          // No push since we're local-only
        },
      },

      log: {
        info: (message: string, ...args: unknown[]) => {
          console.log(`🔍 [LOOP INFO] ${message}`, ...args);
        },
        error: (message: string, ...args: unknown[]) => {
          console.log(`❌ [LOOP ERROR] ${message}`, ...args);
        },
      },

      sleep: async (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    };
  });

  afterEach(async () => {
    console.log(`\n🧹 [CLEANUP] Cleaning up test environment...`);
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`🗑️ [CLEANUP] Temporary directory removed: ${tempDir}`);
    } catch {
      console.log(`⚠️ [CLEANUP] Could not remove temp directory (may not exist)`);
    }
    console.log(`✅ [CLEANUP] Test cleanup complete\n`);
  });

  it("processes chain of 3 tasks with real git workflow", { timeout: 10000 }, async () => {
    console.log(`\n🎯 [TEST] Starting "processes chain of 3 tasks with real git workflow"`);
    
    // Create debug utilities
    const debug = createGitDebugger(git, tempDir);
    
    // Setup task queue
    const tasks = ["implement login", "add validation", "write tests"];
    taskQueueRef.value = [...tasks];
    console.log(`📝 [TEST] Task queue setup: [${tasks.map(t => `"${t}"`).join(', ')}]`);
    
    // Initial state dump
    await debug.dumpFullState("INITIAL STATE");

    // Track individual task completion for detailed verification
    let taskCompletionIndex = 0;
    const originalAckTask = realDeps.ackTask;
    realDeps.ackTask = async (result) => {
      await originalAckTask(result);
      
      // After each task completion, do detailed verification
      if (taskCompletionIndex < tasks.length) {
        const currentTask = tasks[taskCompletionIndex]!;
        const expectedBranch = createBranchName(castNonEmptyString(currentTask));
        
        console.log(`\n📋 [TASK ${taskCompletionIndex + 1}/3 COMPLETED] "${currentTask}"`);
        await debug.dumpFullState(`AFTER TASK ${taskCompletionIndex + 1}`);
        await debug.verifyWorkArtifacts(currentTask, expectedBranch);
        
        if (taskCompletionIndex > 0) {
          await debug.verifyBranchChain();
        }
        
        taskCompletionIndex++;
      }
    };

    // Run loop with abort after processing all tasks
    const controller = new AbortController();
    
    // Auto-abort after tasks are processed or timeout
    const timeoutRef = { value: false };
    const maxTimeout = setTimeout(() => {
      timeoutRef.value = true;
      controller.abort();
    }, 5000); // 5 second max timeout
    
    const checkCompletion = setInterval(() => {
      if (acknowledgedTasksRef.value.length === tasks.length) {
        clearInterval(checkCompletion);
        clearTimeout(maxTimeout);
        setTimeout(() => controller.abort(), 100);
      }
    }, 50);

    try {
      console.log(`\n🔄 [TEST] Starting loop execution...`);
      await loop(realDeps)({ signal: controller.signal });
    } catch (error) {
      console.log(`\n🛑 [TEST] Loop ended with error:`, error);
      if (!timeoutRef.value) {
        // Expected abort error
        expect((error as Error).name).toBe("AbortError");
        console.log(`✅ [TEST] Expected abort error received`);
      } else {
        throw new Error("Test timed out - loop did not process tasks");
      }
    }
    
    clearInterval(checkCompletion);
    clearTimeout(maxTimeout);

    // Final comprehensive state dump and verification
    await debug.dumpFullState("FINAL STATE");
    await debug.verifyBranchChain();

    console.log(`\n🔍 [TEST] Final assertions and verification...`);
    
    // Verify all tasks were acknowledged successfully
    console.log(`📊 [TEST] Acknowledged tasks: ${acknowledgedTasksRef.value.length}/3`);
    expect(acknowledgedTasksRef.value).toHaveLength(3);
    acknowledgedTasksRef.value.forEach((ack, index) => {
      expect(ack.success).toBe(true);
      const task = tasks[index];
      if (!task) throw new Error(`No task at index ${index}`);
      expect(ack.task).toBe(task);
      expect(ack.branch).toBe(createBranchName(castNonEmptyString(task)));
    });

    // Verify generated code files were created with detailed verification
    console.log(`🎯 [TEST] Verifying generated code files for each task...`);
    for (const [index, task] of tasks.entries()) {
      const codeFilePath = join(tempDir, `vibe-code-${cyrb53(task)}.js`);
      const exists = await fs.access(codeFilePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
      
      const content = await fs.readFile(codeFilePath, "utf-8");
      expect(content).toContain(`@vibe-generated: ${task}`);
      
      console.log(`   ✅ Task ${index + 1}: "${task}" → vibe-code-${cyrb53(task)}.js`);
    }

    // Verify git history - should have commits for each task
    const log = await git.log();
    const commitMessages = log.all.map(commit => commit.message);
    console.log(`📈 [TEST] Commit history: ${commitMessages.length} total commits`);
    commitMessages.forEach((msg, i) => {
      console.log(`   ${i + 1}. "${msg}"`);
    });
    
    // Should have initial commit + 3 worker commits
    expect(commitMessages).toHaveLength(4);
    expect(commitMessages[0]).toBe("Worker output"); // Most recent
    expect(commitMessages[3]).toBe("Initial commit"); // Oldest

    // Verify we're on the last processed branch (loop doesn't auto-switch back to main)
    const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
    const lastTask = tasks[tasks.length - 1];
    const lastTaskBranch = createBranchName(castNonEmptyString(lastTask!));
    expect(currentBranch).toBe(lastTaskBranch);
    console.log(`🌿 [TEST] Final branch: ${currentBranch} (expected: ${lastTaskBranch}) ✅`);

    // Verify all task branches still exist (no cleanup in happy path)
    const branches = await git.branchLocal();
    console.log(`🔍 [TEST] Available branches: ${branches.all.join(', ')}`);
    
    const taskBranches = tasks.map(task => createBranchName(castNonEmptyString(task)));
    taskBranches.forEach(branchName => {
      expect(branches.all).toContain(branchName);
      console.log(`   ✅ Branch exists: ${branchName}`);
    });
    
    console.log(`\n🏁 [TEST] All verifications passed! Chain of 3 tasks completed successfully.`);
  });

  it("handles git conflict recovery during chain", { timeout: 10000 }, async () => {
    console.log(`\n🎯 [TEST] Starting "handles git conflict recovery during chain"`);
    
    // Create debug utilities
    const debug = createGitDebugger(git, tempDir);
    
    const tasks = ["task one", "task two"];
    taskQueueRef.value = [...tasks];
    console.log(`📝 [TEST] Task queue setup: [${tasks.map(t => `"${t}"`).join(', ')}] - first will fail, second will succeed`);
    
    // Initial state dump
    await debug.dumpFullState("INITIAL STATE");

    // Override git.commitAndPush to simulate failure on first task, success on retry
    const attemptCountRef = { value: 0 };
    const taskOneAttempts = { value: 0 };
    realDeps.git.commitAndPush = async () => {
      attemptCountRef.value++;
      console.log(`💾 [GIT] Commit attempt #${attemptCountRef.value}`);
      
      // Fail first 2 attempts of "task one", then succeed (testing retry mechanism)
      if (currentTaskRef.value === "task one") {
        taskOneAttempts.value++;
        if (taskOneAttempts.value <= 2) {
          console.log(`❌ [GIT] Simulating git conflict on "task one" attempt ${taskOneAttempts.value}`);
          throw new Error("Simulated git conflict");
        }
      }
      
      await git.add(".");
      await git.commit("Worker output");
      console.log(`✅ [GIT] Commit successful on attempt #${attemptCountRef.value}`);
    };
    
    // Override cleanup to ensure repo is left clean after first task failure
    const originalCleanup = realDeps.git.cleanup;
    realDeps.git.cleanup = async (name) => {
      console.log(`\n🧽 [CLEANUP] Starting enhanced cleanup for failed task`);
      const statusBefore = await git.status();
      console.log(`🧽 [CLEANUP] Status before cleanup: ${statusBefore.files.length} files`);
      
      // Get branch info before cleanup
      const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"]);
      console.log(`🧽 [CLEANUP] Current branch before cleanup: ${currentBranch}`);
      
      await originalCleanup(name);
      console.log(`🧽 [CLEANUP] Original cleanup completed`);
      
      // Ensure repo is clean by removing any uncommitted files AND untracked files
      await git.reset(["--hard"]);
      console.log(`🧽 [CLEANUP] Reset --hard completed`);
      
      try {
        await git.clean(["-f", "-d"]); // Remove untracked files and directories
        console.log(`🧽 [CLEANUP] git clean -fd completed`);
      } catch (cleanError) {
        console.log(`🧽 [CLEANUP] git clean failed, trying manual removal:`, cleanError);
        // Alternative: manually remove untracked files
        const status = await git.status();
        console.log(`🧽 [CLEANUP] Untracked files to remove: ${status.not_added.join(', ')}`);
        for (const file of status.not_added) {
          try {
            await fs.unlink(join(tempDir, file));
            console.log(`🧽 [CLEANUP] Manually removed: ${file}`);
          } catch (removeError) {
            console.log(`🧽 [CLEANUP] Could not remove ${file}:`, removeError);
          }
        }
      }
      
      const statusAfter = await git.status();
      console.log(`🧽 [CLEANUP] Status after cleanup: ${statusAfter.files.length} files`);
      
      // Verify cleanup effectiveness
      await debug.verifyCleanupEffectiveness(currentBranch, name);
    };
    
    // Track task completion with debugging
    let taskIndex = 0;
    const originalAckTask = realDeps.ackTask;
    realDeps.ackTask = async (result) => {
      await originalAckTask(result);
      
      const success = Option.isSome(result);
      const currentTask = tasks[taskIndex];
      
      console.log(`\n📋 [TASK ${taskIndex + 1}/2 ${success ? 'COMPLETED' : 'FAILED'}] "${currentTask}"`);
      
      if (success) {
        await debug.dumpFullState(`AFTER SUCCESSFUL TASK ${taskIndex + 1}`);
        if (currentTask) {
          const expectedBranch = createBranchName(castNonEmptyString(currentTask));
          await debug.verifyWorkArtifacts(currentTask, expectedBranch);
        }
      } else {
        await debug.dumpFullState(`AFTER FAILED TASK ${taskIndex + 1}`);
      }
      
      taskIndex++;
    };

    const controller = new AbortController();
    const checkCompletion = setInterval(() => {
      // Wait until all tasks are acknowledged (both failed and succeeded)
      if (taskQueueRef.value.length === 0 && acknowledgedTasksRef.value.length === 2) {
        clearInterval(checkCompletion);
        setTimeout(() => controller.abort(), 100);
      }
    }, 10);

    try {
      console.log(`\n🔄 [TEST] Starting loop execution...`);
      await loop(realDeps)({ signal: controller.signal });
    } catch (error) {
      console.log(`\n🛑 [TEST] Loop ended with error:`, error);
      expect((error as Error).name).toBe("AbortError");
      console.log(`✅ [TEST] Expected abort error received`);
    }
    
    clearInterval(checkCompletion);

    // Final state dump and comprehensive verification
    await debug.dumpFullState("FINAL STATE");
    await debug.verifyBranchChain();

    console.log(`\n🔍 [TEST] Verifying retry behavior...`);
    
    // Should have exactly 2 acknowledged tasks (both eventually completed)
    console.log(`📊 [TEST] Acknowledged tasks: ${acknowledgedTasksRef.value.length}`);
    expect(acknowledgedTasksRef.value).toHaveLength(2);
    
    // Task one should eventually succeed after retries, task two should succeed normally
    const taskOneResult = acknowledgedTasksRef.value.find(ack => ack.task === "task one");
    const taskTwoResult = acknowledgedTasksRef.value.find(ack => ack.task === "task two");
    
    console.log(`📊 [TEST] Task results:`);
    console.log(`   Task 1 ("task one"): ${taskOneResult?.success ? '✅ SUCCESS after retries' : '❌ FAILED'} (expected: SUCCESS after retries)`);
    console.log(`   Task 2 ("task two"): ${taskTwoResult?.success ? '✅ SUCCESS' : '❌ FAILED'} (expected: SUCCESS)`);
    
    expect(taskOneResult?.success).toBe(true);
    expect(taskTwoResult?.success).toBe(true);
    
    // Verify that we had exactly 3 commit attempts (2 failures + 1 success for task one, 1 success for task two)
    console.log(`📊 [TEST] Total commit attempts: ${attemptCountRef.value} (expected: 4 - 2 failures + 2 successes)`);
    expect(attemptCountRef.value).toBe(4);

    // Verify both task branches exist since both eventually succeeded
    const branches = await git.branchLocal();
    const firstTask = tasks[0];
    if (!firstTask) throw new Error("No first task");
    const firstTaskBranch = createBranchName(castNonEmptyString(firstTask));
    const secondTask = tasks[1];
    if (!secondTask) throw new Error("No second task");
    const secondTaskBranch = createBranchName(castNonEmptyString(secondTask));
    
    console.log(`🧹 [TEST] Branch verification (both tasks should succeed after retries):`);
    console.log(`   Task one branch (${firstTaskBranch}): ${branches.all.includes(firstTaskBranch) ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   Task two branch (${secondTaskBranch}): ${branches.all.includes(secondTaskBranch) ? '✅ EXISTS' : '❌ MISSING'}`);
    
    expect(branches.all).toContain(firstTaskBranch);
    expect(branches.all).toContain(secondTaskBranch);
    
    console.log(`\n🏁 [TEST] Task retry mechanism test passed! Both tasks eventually succeeded.`);
  });

  it("handles maximum retry exhaustion", { timeout: 10000 }, async () => {
    console.log(`\n🎯 [TEST] Starting "handles maximum retry exhaustion"`);
    
    // Create debug utilities
    const debug = createGitDebugger(git, tempDir);
    
    const tasks = ["failing task", "success task"];
    taskQueueRef.value = [...tasks];
    console.log(`📝 [TEST] Task queue setup: [${tasks.map(t => `"${t}"`).join(', ')}] - first will fail permanently, second will succeed`);
    
    // Initial state dump
    await debug.dumpFullState("INITIAL STATE");

    // Override git.commitAndPush to always fail for "failing task", succeed for "success task"
    const attemptCountRef = { value: 0 };
    realDeps.git.commitAndPush = async () => {
      attemptCountRef.value++;
      console.log(`💾 [GIT] Commit attempt #${attemptCountRef.value} for task: "${currentTaskRef.value}"`);
      
      // Always fail for "failing task", succeed for others
      if (currentTaskRef.value === "failing task") {
        console.log(`❌ [GIT] Permanent failure simulation for "failing task"`);
        throw new Error("Permanent simulated failure");
      }
      
      // Success for all other tasks
      await git.add(".");
      await git.commit("Worker output");
      console.log(`✅ [GIT] Commit successful for "${currentTaskRef.value}"`);
    };
    
    // Override cleanup to ensure repo is left clean after failures
    const originalCleanup = realDeps.git.cleanup;
    realDeps.git.cleanup = async (name) => {
      console.log(`\n🧽 [CLEANUP] Cleaning up failed task`);
      await originalCleanup(name);
      await git.reset(["--hard"]);
      
      try {
        await git.clean(["-f", "-d"]);
        console.log(`🧽 [CLEANUP] Cleanup completed`);
      } catch (cleanError) {
        console.log(`🧽 [CLEANUP] Manual cleanup fallback`);
        const status = await git.status();
        for (const file of status.not_added) {
          try {
            await fs.unlink(join(tempDir, file));
          } catch {
            // Ignore individual file removal errors
          }
        }
      }
    };

    const controller = new AbortController();
    const checkCompletion = setInterval(() => {
      // Wait until all tasks are acknowledged 
      if (taskQueueRef.value.length === 0 && acknowledgedTasksRef.value.length === 2) {
        clearInterval(checkCompletion);
        setTimeout(() => controller.abort(), 100);
      }
    }, 10);

    try {
      console.log(`\n🔄 [TEST] Starting loop execution...`);
      await loop(realDeps)({ signal: controller.signal });
    } catch (error) {
      console.log(`\n🛑 [TEST] Loop ended with error:`, error);
      expect((error as Error).name).toBe("AbortError");
      console.log(`✅ [TEST] Expected abort error received`);
    }
    
    clearInterval(checkCompletion);

    // Final state dump and comprehensive verification
    await debug.dumpFullState("FINAL STATE");

    console.log(`\n🔍 [TEST] Verifying max retry exhaustion behavior...`);
    
    // Should have exactly 2 acknowledged tasks
    console.log(`📊 [TEST] Acknowledged tasks: ${acknowledgedTasksRef.value.length}`);
    expect(acknowledgedTasksRef.value).toHaveLength(2);
    
    // Failing task should permanently fail, success task should succeed
    const failingTaskResult = acknowledgedTasksRef.value.find(ack => ack.task === "failing task");
    const successTaskResult = acknowledgedTasksRef.value.find(ack => ack.task === "success task");
    
    console.log(`📊 [TEST] Task results:`);
    console.log(`   Failing task: ${failingTaskResult?.success ? '❌ UNEXPECTED SUCCESS' : '✅ FAILED as expected'} (expected: FAILED after max retries)`);
    console.log(`   Success task: ${successTaskResult?.success ? '✅ SUCCESS' : '❌ FAILED'} (expected: SUCCESS)`);
    
    expect(failingTaskResult?.success).toBe(false);
    expect(successTaskResult?.success).toBe(true);
    
    // Verify that we had exactly 4 attempts (3 for failing task + 1 for success task)
    console.log(`📊 [TEST] Total commit attempts: ${attemptCountRef.value} (expected: 4 - 3 for failing task + 1 for success task)`);
    expect(attemptCountRef.value).toBe(4);

    // Verify only success task branch exists
    const branches = await git.branchLocal();
    const failingTaskBranch = createBranchName(castNonEmptyString("failing task"));
    const successTaskBranch = createBranchName(castNonEmptyString("success task"));
    
    console.log(`🧹 [TEST] Branch verification:`);
    console.log(`   Failing task branch (${failingTaskBranch}): ${branches.all.includes(failingTaskBranch) ? '❌ STILL EXISTS' : '✅ CLEANED UP'}`);
    console.log(`   Success task branch (${successTaskBranch}): ${branches.all.includes(successTaskBranch) ? '✅ EXISTS' : '❌ MISSING'}`);
    
    expect(branches.all).not.toContain(failingTaskBranch);
    expect(branches.all).toContain(successTaskBranch);
    
    console.log(`\n🏁 [TEST] Maximum retry exhaustion test passed! Failed task was properly abandoned.`);
  });

  it("creates correct branch names and artifacts for complex task descriptions", { timeout: 10000 }, async () => {
    console.log(`\n🎯 [TEST] Starting "creates correct branch names and artifacts for complex task descriptions"`);
    
    // Create debug utilities
    const debug = createGitDebugger(git, tempDir);
    
    const complexTasks = [
      "implement user authentication with OAuth2",
      "add database migration for user roles",
      "write integration tests for API endpoints"
    ];
    
    console.log(`📝 [TEST] Complex task queue setup:`);
    complexTasks.forEach((task, index) => {
      const hash = cyrb53(task);
      const branch = createBranchName(castNonEmptyString(task));
      console.log(`   ${index + 1}. "${task}"`);
      console.log(`      → hash: ${hash}`);
      console.log(`      → branch: ${branch}`);
    });
    
    taskQueueRef.value = [...complexTasks];
    
    // Initial state dump
    await debug.dumpFullState("INITIAL STATE");
    
    // Track individual task completion for detailed verification
    let taskCompletionIndex = 0;
    const originalAckTask = realDeps.ackTask;
    realDeps.ackTask = async (result) => {
      await originalAckTask(result);
      
      // After each task completion, verify the naming and artifacts
      if (taskCompletionIndex < complexTasks.length) {
        const currentTask = complexTasks[taskCompletionIndex]!;
        const expectedBranch = createBranchName(castNonEmptyString(currentTask));
        
        console.log(`\n📋 [COMPLEX TASK ${taskCompletionIndex + 1}/3 COMPLETED] "${currentTask}"`);
        await debug.dumpFullState(`AFTER COMPLEX TASK ${taskCompletionIndex + 1}`);
        
        const verification = await debug.verifyWorkArtifacts(currentTask, expectedBranch);
        
        // Additional verification for complex task naming
        const expectedHash = cyrb53(currentTask);
        console.log(`🔍 [NAMING VERIFICATION] Task: "${currentTask}"`);
        console.log(`   Expected hash: ${expectedHash}`);
        console.log(`   Expected branch: ${expectedBranch}`);
        console.log(`   Expected artifact: artifact-${expectedHash}.txt`);
        console.log(`   Verification result: ${verification.branchMatch ? '✅' : '❌'}`);
        
        if (taskCompletionIndex > 0) {
          await debug.verifyBranchChain();
        }
        
        taskCompletionIndex++;
      }
    };

    const controller = new AbortController();
    const checkCompletion = setInterval(() => {
      if (taskQueueRef.value.length === 0) {
        clearInterval(checkCompletion);
        setTimeout(() => controller.abort(), 100);
      }
    }, 10);

    try {
      console.log(`\n🔄 [TEST] Starting loop execution...`);
      await loop(realDeps)({ signal: controller.signal });
    } catch (error) {
      console.log(`\n🛑 [TEST] Loop ended with error:`, error);
      expect((error as Error).name).toBe("AbortError");
      console.log(`✅ [TEST] Expected abort error received`);
    }
    
    clearInterval(checkCompletion);

    // Final comprehensive state dump and verification
    await debug.dumpFullState("FINAL STATE");
    await debug.verifyBranchChain();

    console.log(`\n🔍 [TEST] Comprehensive naming and artifact verification...`);
    
    // Verify each task created the expected branch name and artifact
    for (const [index, task] of complexTasks.entries()) {
      const expectedBranch = createBranchName(castNonEmptyString(task));
      const expectedHash = cyrb53(task);
      
      console.log(`\n🎯 [VERIFICATION ${index + 1}/3] "${task}"`);
      console.log(`   Hash calculation: ${expectedHash}`);
      console.log(`   Expected branch: ${expectedBranch}`);
      
      // Check acknowledged task has correct branch
      const ackTask = acknowledgedTasksRef.value.find(ack => ack.task === task);
      const branchMatch = ackTask?.branch === expectedBranch;
      console.log(`   Acknowledged branch: ${ackTask?.branch} ${branchMatch ? '✅' : '❌'}`);
      expect(ackTask?.branch).toBe(expectedBranch);
      
      // Check generated code file exists with correct hash
      const codeFilePath = join(tempDir, `vibe-code-${expectedHash}.js`);
      const exists = await fs.access(codeFilePath).then(() => true).catch(() => false);
      console.log(`   Code file exists: ${exists ? '✅' : '❌'} (${codeFilePath})`);
      expect(exists).toBe(true);
      
      if (exists) {
        const content = await fs.readFile(codeFilePath, "utf-8");
        const containsTask = content.includes(task);
        console.log(`   Code file content: ${containsTask ? '✅' : '❌'} contains task description`);
        expect(content).toContain(task);
      }
    }
    
    // Verify all branches exist and are correctly named
    const branches = await git.branchLocal();
    const expectedBranches = complexTasks.map(task => createBranchName(castNonEmptyString(task)));
    
    console.log(`\n🌿 [BRANCH VERIFICATION] Expected vs Actual:`);
    expectedBranches.forEach((branch, index) => {
      const exists = branches.all.includes(branch);
      console.log(`   ${index + 1}. ${branch}: ${exists ? '✅' : '❌'}`);
      expect(branches.all).toContain(branch);
    });
    
    console.log(`\n🏁 [TEST] Complex task naming and artifact creation test passed! All hashes and branches correct.`);
  });
});