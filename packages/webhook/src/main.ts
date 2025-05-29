// @vibe-generated: webhook server startup with dependency injection
/* eslint-disable functional/no-expression-statements */
import { generateTasks } from "@taiga-task-master/core";
import { generateTasks as taskmasterGenerateTasks } from "@taiga-task-master/taskmaster-interface";
import { syncTasks } from "@taiga-task-master/tasktracker-interface";
import { createDependencies } from "@taiga-task-master/taskmaster";
import { createTaskTrackerDeps } from "@taiga-task-master/tasktracker";
import { startWebhookServer } from "./index.js";
import type { WebhookDeps } from "@taiga-task-master/webhook-interface";
import type { GenerateTasksDeps } from "@taiga-task-master/core";
import { taigaApiFactory } from "@taiga-task-master/taiga-api";
import { Schema } from "effect";
import { Url, type PrdText } from "@taiga-task-master/common";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates webhook dependencies using production services for core orchestration
 */
const createWebhookDependencies = async (): Promise<
  Omit<WebhookDeps, "config">
> => {
  // Validate required environment for Taiga API
  const username = process.env.TAIGA_USERNAME;
  const password = process.env.TAIGA_PASSWORD;
  const projectIdStr = process.env.TAIGA_PROJECT_ID;

  if (!username || !password || !projectIdStr) {
    const missing = [
      !username && "TAIGA_USERNAME",
      !password && "TAIGA_PASSWORD",
      !projectIdStr && "TAIGA_PROJECT_ID",
    ].filter(Boolean);
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  const projectId = parseInt(projectIdStr, 10);
  if (isNaN(projectId)) {
    throw new Error("TAIGA_PROJECT_ID must be a valid number");
  }

  // Create temp directory for webhook operations
  const tempDir = join(__dirname, "..", "temp");
  await fs.mkdir(tempDir, { recursive: true });

  // Create taskmaster dependencies with temp directory prefix
  const taskmasterDeps = createDependencies(tempDir);

  // Get Taiga base URL from environment or use default
  const taigaBaseUrl = process.env.TAIGA_BASE_URL || "https://api.taiga.io";
  console.log(`🌐 Using Taiga base URL: ${taigaBaseUrl}`);

  // Create Taiga API client
  const api = taigaApiFactory.create({
    baseUrl: Schema.decodeSync(Url)(taigaBaseUrl),
    credentials: {
      username,
      password,
      type: "normal",
    },
  });

  // Create tasktracker dependencies
  const tasktrackerDeps = createTaskTrackerDeps(api, projectId);

  // Combine dependencies for core's GenerateTasksDeps
  const coreGenerateTasksDeps = {
    taskmaster: {
      generateTasks: taskmasterGenerateTasks(taskmasterDeps),
    },
    tasktracker: {
      syncTasks: syncTasks(tasktrackerDeps),
    },
  };

  // Create wrapper that includes cleanup
  const generateTasksWithCleanup =
    (di: GenerateTasksDeps) => async (prd: typeof PrdText.Type) => {
      try {
        // Run the core workflow
        const result = await generateTasks(di)(prd);

        // Cleanup temp directory after processing
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          console.log(`🧹 Cleaned up temp directory: ${tempDir}`);
        } catch (cleanupError) {
          console.warn(`⚠️ Failed to cleanup temp directory: ${cleanupError}`);
        }

        return result;
      } catch (error) {
        // Cleanup on error too
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
          console.log(`🧹 Cleaned up temp directory after error: ${tempDir}`);
        } catch (cleanupError) {
          console.warn(
            `⚠️ Failed to cleanup temp directory after error: ${cleanupError}`
          );
        }
        throw error;
      }
    };

  return {
    generateTasks: generateTasksWithCleanup,
    taskGeneratorDeps: coreGenerateTasksDeps,
  };
};

/**
 * Main entry point for webhook server
 * Validates environment and starts server with production dependencies
 */
export const main = async (): Promise<void> => {
  try {
    console.log("🚀 Starting Taiga Task Master Webhook Server...");

    // Create production dependencies
    const deps = await createWebhookDependencies();

    // Start server (config validation happens inside startWebhookServer)
    const server = await startWebhookServer(deps);

    console.log("✅ Webhook server started successfully");

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n📋 Received ${signal}, shutting down webhook server...`);
      try {
        await server.stop();
        console.log("✅ Webhook server stopped gracefully");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error);
        process.exit(1);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    // Keep process alive
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start webhook server:", error);
    process.exit(1);
  }
};

/**
 * Export for testing - allows custom dependencies
 */
export { createWebhookDependencies };

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
