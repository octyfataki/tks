import { and, asc, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  dateDuJourKinshasa,
  tauxChange,
} from "@/lib/db/schema/currencies";
import {
  CLOSED_NETWORKS,
  priceApplicable,
  type Network,
} from "./price-record";
import { priceGrid } from "./table";

export type ClientPriceLine = {
  network: Network;
  amount: number;
  currency: string;
  effectiveAt: Date;
};

export type ClientRate = {
  jour: string;
  valeur: number;
};

export type ClientGridEntry = {
  network: Network;
  price: ClientPriceLine | null;
};

export type ClientCatalog = {
  entries: ClientGridEntry[];
  rate: ClientRate | null;
};

const PRICE_COLUMNS = {
  network: priceGrid.network,
  amount: priceGrid.amount,
  currency: priceGrid.currency,
  effectiveAt: priceGrid.effectiveAt,
};

async function readApplicable(
  network: Network,
  instant: Date,
): Promise<ClientPriceLine | null> {
  const rows = await db
    .select(PRICE_COLUMNS)
    .from(priceGrid)
    .where(
      and(eq(priceGrid.network, network), lte(priceGrid.effectiveAt, instant)),
    )
    .orderBy(asc(priceGrid.effectiveAt), asc(priceGrid.receivedAt));
  const line = priceApplicable(rows, network, instant);
  if (!line) return null;
  return {
    network,
    amount: line.amount,
    currency: line.currency,
    effectiveAt: line.effectiveAt,
  };
}

export async function readClientCatalog(
  instant: Date = new Date(),
): Promise<ClientCatalog> {
  const [entries, rates] = await Promise.all([
    Promise.all(
      CLOSED_NETWORKS.map(async (network) => ({
        network,
        price: await readApplicable(network, instant),
      })),
    ),
    db
      .select({ jour: tauxChange.jour, valeur: tauxChange.valeur })
      .from(tauxChange)
      .where(eq(tauxChange.jour, dateDuJourKinshasa(instant)))
      .limit(1),
  ]);
  return { entries, rate: rates[0] ?? null };
}
