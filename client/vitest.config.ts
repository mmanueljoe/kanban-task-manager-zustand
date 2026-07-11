import { defineConfig } from "vitest/config";

// Unit tests for pure logic (no DOM needed), so a node environment is enough.
// Mirrors the app's "@/" alias so tests import the same way source does.
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
  },
});
