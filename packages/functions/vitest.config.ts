import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    testTimeout: 60000, // 60 seconds for integration tests
    hookTimeout: 60000, // 60 seconds for setup/teardown
  },
  resolve: {
    alias: {
      utils: "/src/utils",
    },
  },
});
