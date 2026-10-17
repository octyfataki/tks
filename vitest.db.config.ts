import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.base.test.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
    },
  },
});