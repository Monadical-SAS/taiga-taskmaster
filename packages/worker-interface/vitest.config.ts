import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // By default, exclude integration tests folder
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/integration/**'
    ],
  },
});