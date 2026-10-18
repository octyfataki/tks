import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";
import * as authSchema from "./schema/auth-schema";
import * as s1Comptes from "./schema/accounts";
import * as s2Autorisations from "./schema/authorizations";
import * as s3Devises from "./schema/currencies";
import * as s4Clients from "./schema/clients";
import * as s4Annotations from "./schema/annotations";

const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: env.LIMITE_POOL_DB,
  waitForConnections: true,
  connectTimeout: 10_000,
});

export const db = drizzle(pool, {
  schema: { ...authSchema, ...s1Comptes, ...s2Autorisations, ...s3Devises, ...s4Clients, ...s4Annotations },
  mode: "default",
});

export type Db = typeof db;

export async function fermerPool(): Promise<void> {
  await pool.end();
}

export type TransactionDb = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
export type ExecuteurDb = Db | TransactionDb;
