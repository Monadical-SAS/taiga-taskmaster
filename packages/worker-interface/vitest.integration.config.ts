import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Only include integration tests
    include: ['tests/integration/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
  },
});