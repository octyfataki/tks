import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { env } from "@/lib/env";
import * as authSchema from "./schema/auth-schema";
import * as s1Comptes from "./schema/s1-comptes";
import * as s2Autorisations from "./schema/s2-autorisations";

const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  connectionLimit: env.LIMITE_POOL_DB,
  waitForConnections: true,
  connectTimeout: 10_000,
});

export const db = drizzle(pool, {
  schema: { ...authSchema, ...s1Comptes, ...s2Autorisations },
  mode: "default",
});

export type Db = typeof db;

/** Ferme le pool (scripts, tests) : libère les connexions et laisse sortir. */
export async function fermerPool(): Promise<void> {
  await pool.end();
}

/**
 * Transaction en cours et exécuteur de requêtes (base ou transaction).
 * Les couches lib écrivent via l'exécuteur pour englober état métier +
 * trace d'audit dans une seule transaction.
 */
export type TransactionDb = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
export type ExecuteurDb = Db | TransactionDb;
