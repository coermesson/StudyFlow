
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/helpers/database.ts"],
    fileParallelism: false,
    clearMocks: true,
    restoreMocks: true,
  },
});
