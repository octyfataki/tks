import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { user } from "@/lib/db/schema/auth-schema";
import { profilsClients } from "@/lib/db/schema/clients";
import {
  deriveOrder,
  type OrderEventKind,
  type OrderState,
  type OrderType,
} from "@/modules/orders/order-record";
import { orderEvents, orders } from "@/modules/orders/table";
import type { ProofStatus } from "./proof-record";
import { paymentProofs } from "./table";

export type ProofView = {
  id: string;
  orderId: string;
  fileKey: string;
  mime: string;
  sizeBytes: number;
  status: ProofStatus;
  refusalReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedByName: string | null;
  profileName: string;
  profilePhone: string;
  network: string;
  type: OrderType;
  units: number;
  amount: number;
  currency: string;
  state: OrderState;
};

const COLUMNS = {
  id: paymentProofs.id,
  orderId: paymentProofs.orderId,
  fileKey: paymentProofs.fileKey,
  mime: paymentProofs.mime,
  sizeBytes: paymentProofs.sizeBytes,
  status: paymentProofs.status,
  refusalReason: paymentProofs.refusalReason,
  submittedAt: paymentProofs.localTimestamp,
  reviewedAt: paymentProofs.reviewedAt,
  reviewedBy: paymentProofs.reviewedBy,
  profileName: profilsClients.nom,
  profilePhone: profilsClients.contactTelephone,
  network: orders.network,
  type: orders.type,
  units: orders.units,
  amount: orders.amount,
  currency: orders.currency,
};

type RawProof = {
  id: string;
  orderId: string;
  fileKey: string;
  mime: string;
  sizeBytes: number;
  status: string;
  refusalReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  profileName: string;
  profilePhone: string;
  network: string;
  type: string;
  units: number;
  amount: number;
  currency: string;
};

async function hydrate(
  ex: ExecuteurDb,
  lines: readonly RawProof[],
  now: Date,
): Promise<ProofView[]> {
  if (lines.length === 0) return [];
  const orderIds = [...new Set(lines.map((ligne) => ligne.orderId))];
  const evenements = await ex
    .select({
      orderId: orderEvents.orderId,
      kind: orderEvents.kind,
      actorId: orderEvents.actorId,
      payload: orderEvents.payload,
      localTimestamp: orderEvents.localTimestamp,
    })
    .from(orderEvents)
    .where(inArray(orderEvents.orderId, orderIds))
    .orderBy(asc(orderEvents.localTimestamp), asc(orderEvents.receivedAt));

  const parCommande = new Map<string, typeof evenements>();
  for (const evenement of evenements) {
    const liste = parCommande.get(evenement.orderId) ?? [];
    liste.push(evenement);
    parCommande.set(evenement.orderId, liste);
  }

  const reviewers = [
    ...new Set(
      lines.flatMap((ligne) => (ligne.reviewedBy ? [ligne.reviewedBy] : [])),
    ),
  ];
  const noms = new Map<string, string>();
  if (reviewers.length > 0) {
    const lus = await ex
      .select({ id: comptesStaff.id, name: user.name })
      .from(comptesStaff)
      .innerJoin(user, eq(user.id, comptesStaff.betterAuthUserId))
      .where(inArray(comptesStaff.id, reviewers));
    for (const lu of lus) noms.set(lu.id, lu.name);
  }

  return lines.map((ligne) => {
    const derived = deriveOrder(
      (parCommande.get(ligne.orderId) ?? []).map((evenement) => ({
        kind: evenement.kind as OrderEventKind,
        actorId: evenement.actorId,
        payload: evenement.payload,
        localTimestamp: evenement.localTimestamp,
      })),
      now,
    );
    return {
      id: ligne.id,
      orderId: ligne.orderId,
      fileKey: ligne.fileKey,
      mime: ligne.mime,
      sizeBytes: ligne.sizeBytes,
      status: ligne.status as ProofStatus,
      refusalReason: ligne.refusalReason,
      submittedAt: ligne.submittedAt,
      reviewedAt: ligne.reviewedAt,
      reviewedByName: ligne.reviewedBy ? (noms.get(ligne.reviewedBy) ?? null) : null,
      profileName: ligne.profileName,
      profilePhone: ligne.profilePhone,
      network: ligne.network,
      type: ligne.type as OrderType,
      units: ligne.units,
      amount: ligne.amount,
      currency: ligne.currency,
      state: derived.state,
    };
  });
}

export async function readProofQueue(
  now: Date = new Date(),
): Promise<ProofView[]> {
  const lignes = await db
    .select(COLUMNS)
    .from(paymentProofs)
    .innerJoin(orders, eq(orders.id, paymentProofs.orderId))
    .innerJoin(profilsClients, eq(profilsClients.id, orders.profileId))
    .where(eq(paymentProofs.status, "PENDING"))
    .orderBy(asc(paymentProofs.localTimestamp), asc(paymentProofs.receivedAt));
  const vues = await hydrate(db, lignes, now);
  return vues.filter((vue) => vue.state === "AWAITING_PROOF");
}

export async function readProofHistory(
  orderId: string,
  now: Date = new Date(),
): Promise<ProofView[]> {
  const lignes = await db
    .select(COLUMNS)
    .from(paymentProofs)
    .innerJoin(orders, eq(orders.id, paymentProofs.orderId))
    .innerJoin(profilsClients, eq(profilsClients.id, orders.profileId))
    .where(eq(paymentProofs.orderId, orderId))
    .orderBy(asc(paymentProofs.localTimestamp), asc(paymentProofs.receivedAt));
  return hydrate(db, lignes, now);
}

export async function readRecentDecisions(
  limit: number = 10,
  now: Date = new Date(),
): Promise<ProofView[]> {
  const lignes = await db
    .select(COLUMNS)
    .from(paymentProofs)
    .innerJoin(orders, eq(orders.id, paymentProofs.orderId))
    .innerJoin(profilsClients, eq(profilsClients.id, orders.profileId))
    .where(inArray(paymentProofs.status, ["VALIDATED", "REFUSED"]))
    .orderBy(desc(paymentProofs.reviewedAt))
    .limit(limit);
  return hydrate(db, lignes, now);
}

export type ProofStats = {
  enAttente: number;
  montantEnAttente: { currency: string; amount: number }[];
  valideesAujourdhui: number;
  refuseesAujourdhui: number;
  attenteMinutes: number | null;
};

export async function readProofStats(
  preuvesEnAttente: ProofView[],
  now: Date = new Date(),
): Promise<ProofStats> {
  const jour = new Date(now);
  jour.setHours(0, 0, 0, 0);
  const lignes = await db
    .select({ status: paymentProofs.status, total: sql<string>`count(*)` })
    .from(paymentProofs)
    .where(
      and(
        gte(paymentProofs.reviewedAt, jour),
        inArray(paymentProofs.status, ["VALIDATED", "REFUSED"]),
      ),
    )
    .groupBy(paymentProofs.status);
  const parStatut = new Map(
    lignes.map((ligne) => [ligne.status, Number(ligne.total)]),
  );

  const montants = new Map<string, number>();
  let plusAncienne: number | null = null;
  for (const preuve of preuvesEnAttente) {
    montants.set(
      preuve.currency,
      (montants.get(preuve.currency) ?? 0) + preuve.amount,
    );
    const instant = preuve.submittedAt.getTime();
    if (plusAncienne === null || instant < plusAncienne) plusAncienne = instant;
  }

  return {
    enAttente: preuvesEnAttente.length,
    montantEnAttente: [...montants]
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((gauche, droite) => droite.amount - gauche.amount),
    valideesAujourdhui: parStatut.get("VALIDATED") ?? 0,
    refuseesAujourdhui: parStatut.get("REFUSED") ?? 0,
    attenteMinutes:
      plusAncienne === null
        ? null
        : Math.max(0, Math.round((now.getTime() - plusAncienne) / 60000)),
  };
}
