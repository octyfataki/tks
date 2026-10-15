import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";
import * as authSchema from "./schema/auth-schema";
import * as s1Comptes from "./schema/s1-comptes";
import * as s2Autorisations from "./schema/s2-autorisations";
import * as s3Devises from "./schema/s3-devises";
import * as s4Clients from "./schema/s4-clients";
import * as s4Annotations from "./schema/s4-annotations";

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
