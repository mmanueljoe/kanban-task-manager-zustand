import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// tsconfigPaths teaches Vitest the same `@/*` → `src/*` alias defined in
// tsconfig.json, so tests can use `@/domain/...` like the rest of the code.
export default defineConfig({
  plugins: [tsconfigPaths()],
});
