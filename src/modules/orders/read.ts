import {
  and,
  asc,
  desc,
  eq,
  exists,
  gte,
  inArray,
  notExists,
  sql,
} from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { user } from "@/lib/db/schema/auth-schema";
import { profilsClients } from "@/lib/db/schema/clients";
import { deriveOrder, type Channel, type OrderEventKind, type OrderState, type OrderType } from "./order-record";
import { orderEvents, orders } from "./table";

export type OrderView = {
  id: string;
  profileId: string;
  profileName: string;
  profilePhone: string;
  network: string;
  channel: Channel;
  type: OrderType;
  units: number;
  amount: number;
  currency: string;
  pricePerHundred: number;
  state: OrderState;
  lockedBy: string | null;
  lockedByName: string | null;
  lockedAt: Date | null;
  lockExpired: boolean;
  proofId: string | null;
  refusalReason: string | null;
  createdAt: Date;
};

const COLUMNS = {
  id: orders.id,
  profileId: orders.profileId,
  profileName: profilsClients.nom,
  profilePhone: profilsClients.contactTelephone,
  network: orders.network,
  channel: orders.channel,
  type: orders.type,
  units: orders.units,
  amount: orders.amount,
  currency: orders.currency,
  pricePerHundred: orders.pricePerHundred,
  localTimestamp: orders.localTimestamp,
};

type RawOrder = {
  id: string;
  profileId: string;
  profileName: string;
  profilePhone: string;
  network: string;
  channel: string;
  type: string;
  units: number;
  amount: number;
  currency: string;
  pricePerHundred: number;
  localTimestamp: Date;
};

function openOrders(ex: ExecuteurDb) {
  const clos = ex
    .select({ present: sql`1` })
    .from(orderEvents)
    .where(
      and(
        eq(orderEvents.orderId, orders.id),
        inArray(orderEvents.kind, ["SERVED", "CANCELLED"]),
      ),
    );
  return notExists(clos);
}

async function agentNames(
  ex: ExecuteurDb,
  ids: readonly string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const lignes = await ex
    .select({ id: comptesStaff.id, name: user.name })
    .from(comptesStaff)
    .innerJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
    .where(inArray(comptesStaff.id, [...ids]));
  return new Map(lignes.map((ligne) => [ligne.id, ligne.name]));
}

async function hydrate(
  ex: ExecuteurDb,
  lines: readonly RawOrder[],
  now: Date,
): Promise<OrderView[]> {
  if (lines.length === 0) return [];
  const ids = lines.map((ligne) => ligne.id);
  const evenements = await ex
    .select({
      orderId: orderEvents.orderId,
      kind: orderEvents.kind,
      actorId: orderEvents.actorId,
      payload: orderEvents.payload,
      localTimestamp: orderEvents.localTimestamp,
    })
    .from(orderEvents)
    .where(inArray(orderEvents.orderId, ids))
    .orderBy(asc(orderEvents.localTimestamp), asc(orderEvents.receivedAt));

  const parCommande = new Map<string, typeof evenements>();
  for (const evenement of evenements) {
    const liste = parCommande.get(evenement.orderId) ?? [];
    liste.push(evenement);
    parCommande.set(evenement.orderId, liste);
  }

  const derives = lines.map((ligne) => ({
    ligne,
    derived: deriveOrder(
      (parCommande.get(ligne.id) ?? []).map((evenement) => ({
        kind: evenement.kind as OrderEventKind,
        actorId: evenement.actorId,
        payload: evenement.payload,
        localTimestamp: evenement.localTimestamp,
      })),
      now,
    ),
  }));
  const noms = await agentNames(
    ex,
    derives.flatMap(({ derived }) => (derived.lockedBy ? [derived.lockedBy] : [])),
  );

  return derives.map(({ ligne, derived }) => ({
    id: ligne.id,
    profileId: ligne.profileId,
    profileName: ligne.profileName,
    profilePhone: ligne.profilePhone,
    network: ligne.network,
    channel: ligne.channel as Channel,
    type: ligne.type as OrderType,
    units: ligne.units,
    amount: ligne.amount,
    currency: ligne.currency,
    pricePerHundred: ligne.pricePerHundred,
    state: derived.state,
    lockedBy: derived.lockedBy,
    lockedByName: derived.lockedBy ? (noms.get(derived.lockedBy) ?? null) : null,
    lockedAt: derived.lockedAt,
    lockExpired: derived.lockExpired,
    proofId: derived.proofId,
    refusalReason: derived.refusalReason,
    createdAt: ligne.localTimestamp,
  }));
}

export async function readQueue(now: Date = new Date()): Promise<OrderView[]> {
  const lignes = await db
    .select(COLUMNS)
    .from(orders)
    .innerJoin(profilsClients, eq(profilsClients.id, orders.profileId))
    .where(openOrders(db))
    .orderBy(asc(orders.localTimestamp), asc(orders.receivedAt));
  return hydrate(db, lignes, now);
}

export type OrderStats = {
  ouvertes: number;
  aPrendre: number;
  enCours: number;
  preuveAttendue: number;
  engageCredit: { currency: string; amount: number }[];
  serviesAujourdhui: number;
};

export async function readOrderStats(now: Date = new Date()): Promise<OrderStats> {
  const queue = await readQueue(now);
  const jour = new Date(now);
  jour.setHours(0, 0, 0, 0);
  const servies = await db
    .select({ total: sql<string>`count(*)` })
    .from(orderEvents)
    .where(
      and(
        eq(orderEvents.kind, "SERVED"),
        gte(orderEvents.localTimestamp, jour),
      ),
    );
  const engage = new Map<string, number>();
  for (const commande of queue) {
    if (commande.type !== "CREDIT") continue;
    engage.set(
      commande.currency,
      (engage.get(commande.currency) ?? 0) + commande.amount,
    );
  }
  return {
    ouvertes: queue.length,
    aPrendre: queue.filter((commande) => commande.state === "QUEUED").length,
    enCours: queue.filter((commande) => commande.state === "LOCKED").length,
    preuveAttendue: queue.filter((commande) => commande.state === "AWAITING_PROOF")
      .length,
    engageCredit: [...engage].map(([currency, amount]) => ({ currency, amount })),
    serviesAujourdhui: Number(servies[0]?.total ?? 0),
  };
}

export async function readRecentOrders(
  limit: number = 20,
  now: Date = new Date(),
): Promise<OrderView[]> {
  const clos = db
    .select({ present: sql`1` })
    .from(orderEvents)
    .where(
      and(
        eq(orderEvents.orderId, orders.id),
        inArray(orderEvents.kind, ["SERVED", "CANCELLED"]),
      ),
    );
  const lignes = await db
    .select(COLUMNS)
    .from(orders)
    .innerJoin(profilsClients, eq(profilsClients.id, orders.profileId))
    .where(exists(clos))
    .orderBy(desc(orders.receivedAt))
    .limit(limit);
  return hydrate(db, lignes, now);
}

export async function readOrder(
  orderId: string,
  now: Date = new Date(),
): Promise<OrderView | null> {
  const lignes = await db
    .select(COLUMNS)
    .from(orders)
    .innerJoin(profilsClients, eq(profilsClients.id, orders.profileId))
    .where(eq(orders.id, orderId))
    .limit(1);
  const vues = await hydrate(db, lignes, now);
  return vues[0] ?? null;
}

export async function readOrdersForProfile(
  profileId: string,
  limit: number = 50,
): Promise<OrderView[]> {
  const lignes = await db
    .select(COLUMNS)
    .from(orders)
    .innerJoin(profilsClients, eq(profilsClients.id, orders.profileId))
    .where(eq(orders.profileId, profileId))
    .orderBy(asc(orders.localTimestamp))
    .limit(limit);
  return hydrate(db, lignes, new Date());
}
