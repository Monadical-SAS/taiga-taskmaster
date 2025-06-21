import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Only include integration tests
    include: ['tests/integration/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    // Increase timeout for integration tests
    testTimeout: 60000,
    // Run integration tests sequentially to avoid conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
});