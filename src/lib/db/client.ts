import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as authSchema from "./schema/auth-schema";
import * as s1Comptes from "./schema/s1-comptes";

const pool = mysql.createPool(process.env.DATABASE_URL!);

export const db = drizzle(pool, {
  schema: { ...authSchema, ...s1Comptes },
  mode: "default",
});

export type Db = typeof db;
