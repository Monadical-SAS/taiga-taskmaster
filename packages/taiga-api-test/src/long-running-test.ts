// @vibe-generated: long-running test for token refresh functionality
import { Schema } from "effect";
import { Url } from "@taiga-task-master/common";

const INTERVAL_MS = 60 * 1000; // 1 minute

const runLongTest = async (): Promise<void> => {
  const username = process.env.TAIGA_USERNAME;
  const password = process.env.TAIGA_PASSWORD;

  if (!username || !password) {
    console.error("❌ Missing TAIGA_USERNAME or TAIGA_PASSWORD in environment");
    process.exit(1);
  }

  // Get Taiga base URL from environment or use default
  const taigaBaseUrl = process.env.TAIGA_BASE_URL || "https://api.taiga.io";

  console.log("🚀 Starting long-running Taiga API test...");
  console.log(`👤 Username: ${username}`);
  console.log(`🌐 Using Taiga base URL: ${taigaBaseUrl}`);
  console.log(`⏰ Interval: ${INTERVAL_MS / 1000} seconds`);
  console.log("Press Ctrl+C to stop the test\n");

  // Import taiga-api factory
  const { taigaApiFactory } = await import("../../taiga-api/dist/index.js");

  const api = taigaApiFactory.create({
    baseUrl: Schema.decodeSync(Url)(taigaBaseUrl),
  });

  // Initial login
  console.log("🔐 Performing initial login...");
  try {
    const authResponse = await api.auth.login({
      username,
      password,
      type: "normal",
    });
    console.log(`✅ Initial login successful! User: ${authResponse.full_name}`);
  } catch (error) {
    console.error(
      "❌ Initial login failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }

  let requestCount = 0;

  const performApiCall = async (): Promise<void> => {
    requestCount++;
    console.log(`\n🔄 [${new Date().toISOString()}] API Call #${requestCount}`);

    try {
      // Try different API endpoints to test authenticated requests
      const endpoints = [
        { name: "Tasks", call: () => api.tasks.list({ project: 1 }) },
        {
          name: "User Stories",
          call: () => api.userStories.list({ project: 1 }),
        },
        {
          name: "Task Statuses",
          call: () => api.taskStatuses.list({ project: 1 }),
        },
      ];

      const randomEndpoint = endpoints[requestCount % endpoints.length];
      if (!randomEndpoint) {
        throw new Error("No endpoint available");
      }
      console.log(`📡 Testing ${randomEndpoint.name} endpoint...`);

      const result = await randomEndpoint.call();
      console.log(
        `✅ ${randomEndpoint.name} API successful! Items: ${Array.isArray(result) ? result.length : "N/A"}`
      );
    } catch (error) {
      console.error(
        `❌ API call failed:`,
        error instanceof Error ? error.message : error
      );
    }
  };

  // Setup graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n👋 Received Ctrl+C, shutting down gracefully...");
    console.log(`📊 Total API calls made: ${requestCount}`);
    process.exit(0);
  });

  // Run initial call
  await performApiCall();

  // Schedule recurring calls
  const interval = setInterval(async () => {
    try {
      await performApiCall();
    } catch (error) {
      console.error("💥 Unexpected error in interval:", error);
    }
  }, INTERVAL_MS);

  // Keep the process alive
  console.log("🏃 Long-running test started. Waiting for API calls...");
};

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
});

runLongTest().catch((error) => {
  console.error("💥 Fatal error in long-running test:", error);
  process.exit(1);
});
