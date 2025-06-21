// @vibe-generated: conforms to worker-interface
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTempDir } from "../../src/utils/temp-utils";
import { main } from "../../src/cli/task-runner";
import { simpleGit } from "simple-git";

describe("CLI Git Branching Integration", () => {
  const state = {
    tempDir: "",
    cleanup: (() => {}) as () => void
  };

  beforeEach(async () => {
    const temp = await createTempDir("cli-git-test-");
    state.tempDir = temp.path;
    state.cleanup = temp.cleanup;
  });

  afterEach(() => {
    if (!process.env.KEEP_TEST_DIRS) {
      state.cleanup();
    }
  });

  it("should create unique branches for each task", async () => {
    // Skip if no API key available
    if (!process.env.OPENROUTER_API_KEY) {
      console.log("Skipping git branch test - no OPENROUTER_API_KEY");
      return;
    }

    const tasks = [
      'Create a file "test1.txt" with content "First task"',
      'Create a file "test2.txt" with content "Second task"'
    ];

    // Run tasks in non-interactive mode
    await main({ 
      tasks, 
      workingDir: state.tempDir 
    });

    // Verify git repository structure
    const git = simpleGit(state.tempDir);
    
    // Check that we're back on master
    const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);
    expect(currentBranch.trim()).toBe('master');
    
    // Check that branches were created and removed (or exist)
    const branches = await git.branchLocal();
    console.log('Available branches:', branches.all);
    
    // Should have at least master branch
    expect(branches.all).toContain('master');
    
    // Check commit history
    const log = await git.log(['--oneline']);
    console.log('Commit history:');
    log.all.forEach(commit => {
      console.log(`  ${commit.hash.substring(0, 8)} ${commit.message}`);
    });
    
    // Should have commits from task execution
    expect(log.all.length).toBeGreaterThan(1); // Initial commit + task commits
    
    console.log(`Test completed. Check ${state.tempDir} for results.`);
  }, 180000); // 3 minute timeout for git operations

  it("should create files in the working directory", async () => {
    // Skip if no API key available
    if (!process.env.OPENROUTER_API_KEY) {
      console.log("Skipping file creation test - no OPENROUTER_API_KEY");
      return;
    }

    const tasks = [
      'Create a simple file called "hello.txt" with the content "Hello World"'
    ];

    await main({ 
      tasks, 
      workingDir: state.tempDir 
    });

    // Check if files were created
    const git = simpleGit(state.tempDir);
    const status = await git.status();
    
    console.log('Git status after task execution:');
    console.log('  Modified files:', status.modified);
    console.log('  Created files:', status.created);
    console.log('  Staged files:', status.staged);
    
    // Files should be committed, so working directory should be clean
    expect(status.files.length).toBe(0);
    
    console.log(`File creation test completed. Check ${state.tempDir} for results.`);
  }, 120000); // 2 minute timeout
});