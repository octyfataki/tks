import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Column } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { paymentProofs } from "@/modules/proofs/table";
import { receivables } from "@/modules/receivables/table";
import { orderEvents, orders } from "@/modules/orders/table";

import type { MySqlTable } from "drizzle-orm/mysql-core";

const MIGRATION = readFileSync(
  join(process.cwd(), "drizzle", "0021_orders-proofs-receivables.sql"),
  "utf8",
);

function colonnes(table: MySqlTable): string[] {
  return Object.values(getTableConfig(table).columns).map(
    (colonne) => colonne.name,
  );
}

function porte(colonneCible: string, colonnes: readonly unknown[]): boolean {
  return colonnes.some(
    (colonne) => colonne instanceof Column && colonne.name === colonneCible,
  );
}

describe("structure des commandes", () => {
  it("fige le prix, la devise et le montant sur la commande", () => {
    expect(colonnes(orders)).toEqual(
      expect.arrayContaining([
        "id",
        "profile_id",
        "network",
        "channel",
        "type",
        "units",
        "price_per_hundred",
        "amount",
        "currency",
        "local_timestamp",
      ]),
    );
  });

  it("ne stocke ni état ni taux : l'état se déduit, le taux ne s'écrit pas", () => {
    const noms = colonnes(orders);
    expect(noms).not.toContain("state");
    expect(noms).not.toContain("statut");
    expect(noms).not.toContain("rate");
    expect(noms).not.toContain("taux");
    expect(noms).not.toContain("exchange_rate");
  });

  it("journalise chaque transition dans order_events", () => {
    expect(colonnes(orderEvents)).toEqual(
      expect.arrayContaining([
        "id",
        "order_id",
        "kind",
        "actor_id",
        "payload",
        "local_timestamp",
      ]),
    );
  });
});

describe("structure des créances", () => {
  it("lie une créance à une commande, au plus une fois", () => {
    const config = getTableConfig(receivables);
    const uniques = config.indexes.filter(
      (index) =>
        index.config.unique === true &&
        porte("order_id", index.config.columns),
    );
    expect(uniques).toHaveLength(1);
  });

  it("porte un montant et une devise, jamais un taux", () => {
    const noms = colonnes(receivables);
    expect(noms).toEqual(
      expect.arrayContaining([
        "profile_id",
        "order_id",
        "amount",
        "currency",
        "occurred_at",
      ]),
    );
    expect(noms).not.toContain("rate");
    expect(noms).not.toContain("taux");
  });
});

describe("structure des preuves", () => {
  it("conserve le fichier, le verdict et le motif", () => {
    expect(colonnes(paymentProofs)).toEqual(
      expect.arrayContaining([
        "order_id",
        "file_key",
        "mime",
        "size_bytes",
        "status",
        "refusal_reason",
        "reviewed_by",
        "reviewed_at",
      ]),
    );
  });
});

describe("garanties portées par la migration", () => {
  it("rend les événements de commande append-only", () => {
    expect(MIGRATION).toContain(
      "CREATE TRIGGER `order_events_block_update` BEFORE UPDATE ON `order_events`",
    );
    expect(MIGRATION).toContain(
      "CREATE TRIGGER `order_events_block_delete` BEFORE DELETE ON `order_events`",
    );
  });

  it("rend les créances inaltérables", () => {
    expect(MIGRATION).toContain(
      "CREATE TRIGGER `receivables_block_update` BEFORE UPDATE ON `receivables`",
    );
    expect(MIGRATION).toContain(
      "CREATE TRIGGER `receivables_block_delete` BEFORE DELETE ON `receivables`",
    );
  });

  it("garde le prix figé dans la commande, sans colonne de taux", () => {
    expect(MIGRATION).toContain("`price_per_hundred`");
    expect(MIGRATION).not.toMatch(/`(taux|rate)`/);
  });
});
