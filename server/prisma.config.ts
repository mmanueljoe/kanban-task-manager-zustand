import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Migrations run over the session-mode pooler (DIRECT_URL). The app's runtime
  // client will use the transaction pooler (DATABASE_URL) later, via an adapter.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
