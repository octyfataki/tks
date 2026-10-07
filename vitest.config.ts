import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      // Chemin natif explicite : `new URL("./src", import.meta.url).pathname`
      // renvoie "/C:/...%20..." sous Windows et la résolution casse.
      "@": resolve(process.cwd(), "src"),
    },
  },
});
