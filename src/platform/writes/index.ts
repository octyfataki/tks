import type { InferInsertModel, SQL } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { ExecuteurDb } from "@/lib/db/client";

type RowFilter = SQL | undefined;

type RawExecutor = {
  insert: (table: MySqlTable) => {
    values: (values: object) => Promise<unknown>;
  };
  update: (table: MySqlTable) => {
    set: (values: object) => { where: (filter: RowFilter) => Promise<unknown> };
  };
  delete: (table: MySqlTable) => {
    where: (filter: RowFilter) => Promise<unknown>;
  };
};

function raw(ex: ExecuteurDb): RawExecutor {
  return ex as unknown as RawExecutor;
}

export async function insertRow<T extends MySqlTable>(
  ex: ExecuteurDb,
  table: T,
  values: InferInsertModel<T>,
): Promise<void> {
  await raw(ex).insert(table).values(values);
}

export async function updateRow<T extends MySqlTable>(
  ex: ExecuteurDb,
  table: T,
  values: Partial<InferInsertModel<T>>,
  filter: SQL,
): Promise<void> {
  await raw(ex).update(table).set(values).where(filter);
}

export async function deleteRow<T extends MySqlTable>(
  ex: ExecuteurDb,
  table: T,
  filter: SQL,
): Promise<void> {
  await raw(ex).delete(table).where(filter);
}
