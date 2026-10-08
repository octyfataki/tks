import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/lib/db/schema/auth-schema.ts",
    "./src/lib/db/schema/s1-comptes/index.ts",
    "./src/lib/db/schema/s2-autorisations/index.ts",
  ],
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://tks:tks@localhost:3306/tks",
  },
});
