import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/lib/db/schema/auth-schema.ts",
    "./src/lib/db/schema/comptes/index.ts",
    "./src/lib/db/schema/autorisations/index.ts",
    "./src/lib/db/schema/devises/index.ts",
    "./src/lib/db/schema/annotations/index.ts",
    "./src/modules/clients/table.ts",
  ],
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://tks:tks@localhost:3306/tks",
  },
});
