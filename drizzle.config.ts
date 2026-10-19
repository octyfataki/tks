import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/lib/db/schema/auth-schema.ts",
    "./src/lib/db/schema/accounts/index.ts",
    "./src/lib/db/schema/authorizations/index.ts",
    "./src/lib/db/schema/currencies/index.ts",
    "./src/lib/db/schema/clients/index.ts",
    "./src/lib/db/schema/annotations/index.ts",
    "./src/modules/pricing/table.ts",
  ],
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://tks:tks@localhost:3306/tks",
  },
});
