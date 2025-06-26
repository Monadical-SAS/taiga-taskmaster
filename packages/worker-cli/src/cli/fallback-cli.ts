#!/usr/bin/env node
// Fallback CLI for when TUI has issues
import * as readline from "readline";

export const startFallbackCLI = async (options: {
  onAddTask: (description: string) => Promise<void>;
  onStop: () => void;
  workingDir: string;
}) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "\n📝 Enter task (or 'quit' to exit): "
  });

  console.log(`\n🚀 Taiga Task Master CLI (Fallback Mode)`);
  console.log(`📁 Working directory: ${options.workingDir}`);
  console.log(`💡 Enter task descriptions to add them to the queue`);
  console.log(`⚡ Tasks will be processed automatically through git + goose`);

  return new Promise<void>((resolve) => {
    rl.prompt();

    rl.on("line", async (line) => {
      const input = line.trim();
      
      if (input === "quit" || input === "exit") {
        rl.close();
        resolve();
        return;
      }
      
      if (input.length === 0) {
        rl.prompt();
        return;
      }

      try {
        await options.onAddTask(input);
        console.log(`✅ Added task: "${input}"`);
      } catch (error) {
        console.error(`❌ Error adding task: ${error}`);
      }
      rl.prompt();
    });

    rl.on("close", () => {
      options.onStop();
      resolve();
    });
  });
};