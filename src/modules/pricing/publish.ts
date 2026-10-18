import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { user } from "@/lib/db/schema/auth-schema";
import { canManagePriceGrid } from "@/lib/db/schema/authorizations";
import { aPermission } from "@/lib/authorizations/permissions";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import { insertRow } from "@/platform/writes";
import {
  CLOSED_NETWORKS,
  PriceGridError,
  preparePrice,
  priceApplicable,
  type Network,
  type PriceDraft,
  type PriceLine,
} from "./price-record";
import { priceGrid } from "./table";

export { PriceGridError };
export type { Network, PriceDraft, PriceLine };

export type PriceGridActor = { id: string; role: string };

export type PriceLineNamed = PriceLine & { enteredByName: string | null };

export type GridEntry = { network: Network; price: PriceLineNamed | null };

const HISTORY_LIMIT = 100;

const COLONNES = {
  id: priceGrid.id,
  network: priceGrid.network,
  amount: priceGrid.amount,
  currency: priceGrid.currency,
  effectiveAt: priceGrid.effectiveAt,
  enteredBy: priceGrid.enteredBy,
  deviceId: priceGrid.deviceId,
  enteredByName: user.name,
};

type LigneLue = {
  id: string;
  network: string;
  amount: number;
  currency: string;
  effectiveAt: Date;
  enteredBy: string | null;
  deviceId: string | null;
  enteredByName: string | null;
};

function toLine(row: LigneLue): PriceLineNamed {
  return {
    id: row.id,
    network: row.network,
    amount: row.amount,
    currency: row.currency,
    effectiveAt: row.effectiveAt,
    enteredBy: row.enteredBy,
    deviceId: row.deviceId,
    enteredByName: row.enteredByName,
  };
}

function lecteur(ex: ExecuteurDb) {
  return ex
    .select(COLONNES)
    .from(priceGrid)
    .leftJoin(comptesStaff, eq(comptesStaff.id, priceGrid.enteredBy))
    .leftJoin(user, eq(user.id, comptesStaff.betterAuthUserId));
}

async function acteurCourant(): Promise<PriceGridActor | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignes[0];
  if (!moi) return null;
  const decision = canManagePriceGrid(moi.role, moi.etat);
  if (decision !== null) return decision ? { id: moi.id, role: moi.role } : null;
  if (await aPermission(moi.id, "grille.tarif")) {
    return { id: moi.id, role: moi.role };
  }
  return null;
}

export async function actorCanManagePriceGrid(): Promise<PriceGridActor | null> {
  return acteurCourant();
}

async function readApplicable(
  ex: ExecuteurDb,
  network: string,
  instant: Date,
): Promise<PriceLineNamed | null> {
  const lignes = await lecteur(ex)
    .where(
      and(eq(priceGrid.network, network), lte(priceGrid.effectiveAt, instant)),
    )
    .orderBy(asc(priceGrid.effectiveAt), asc(priceGrid.receivedAt));
  return priceApplicable(lignes.map(toLine), network, instant);
}

export async function readPriceAt(
  network: string,
  instant: Date = new Date(),
): Promise<PriceLineNamed | null> {
  return readApplicable(db, network, instant);
}

export async function readGridAt(
  instant: Date = new Date(),
): Promise<GridEntry[]> {
  return Promise.all(
    CLOSED_NETWORKS.map(async (network) => ({
      network,
      price: await readApplicable(db, network, instant),
    })),
  );
}

export async function readHistory(
  network?: string,
  limit: number = HISTORY_LIMIT,
): Promise<PriceLineNamed[]> {
  const lignes = await lecteur(db)
    .where(network ? eq(priceGrid.network, network) : undefined)
    .orderBy(desc(priceGrid.effectiveAt), desc(priceGrid.receivedAt))
    .limit(limit);
  return lignes.map(toLine);
}

export async function publishPrice(draft: PriceDraft): Promise<PriceLine> {
  const prepared = preparePrice(draft);
  const acteur = await acteurCourant();
  if (!acteur) {
    throw new PriceGridError(
      "NOT_ALLOWED",
      "Modifier la grille tarifaire exige un administrateur principal ou un agent autorisé.",
    );
  }
  const id = randomUUID();
  await db.transaction(async (tx) => {
    const avant = await readApplicable(tx, prepared.network, prepared.effectiveAt);
    await insertRow(tx, priceGrid, {
      id,
      network: prepared.network,
      amount: prepared.amount,
      currency: prepared.currency,
      effectiveAt: prepared.effectiveAt,
      enteredBy: acteur.id,
      deviceId: prepared.deviceId,
    });
    const trace = await enregistrerEvenement(
      {
        acteurId: acteur.id,
        roleAuMoment: acteur.role,
        typeAction: "price_grid.manage",
        entite: "price_grid",
        entiteId: id,
        avant: avant
          ? {
              amount: avant.amount,
              currency: avant.currency,
              effectiveAt: avant.effectiveAt.toISOString(),
            }
          : null,
        apres: {
          network: prepared.network,
          amount: prepared.amount,
          currency: prepared.currency,
          effectiveAt: prepared.effectiveAt.toISOString(),
        },
        horodatageLocal: prepared.effectiveAt,
        appareilId: prepared.deviceId,
      },
      tx,
    );
    if (!trace.ok) {
      throw new PriceGridError(
        "AUDIT_UNAVAILABLE",
        "Journal indisponible : modification annulée.",
      );
    }
  });
  return {
    id,
    network: prepared.network,
    amount: prepared.amount,
    currency: prepared.currency,
    effectiveAt: prepared.effectiveAt,
    enteredBy: acteur.id,
    deviceId: prepared.deviceId,
  };
}
