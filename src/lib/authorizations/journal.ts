import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { journalAudit } from "@/lib/db/schema/authorizations";

export type ResultatJournal =
  | { ok: true; id: string }
  | { ok: false; erreur: string };

export const ERREUR_CONTESTEE_INTROUVABLE = "Ligne contestée introuvable.";

export async function enregistrerEvenement(
  input: {
    acteurId?: string | null;
    roleAuMoment: string;
    typeAction: string;
    entite: string;
    entiteId?: string | null;
    avant?: unknown;
    apres?: unknown;
    appareilId?: string | null;
    horodatageLocal?: Date;
    statut?: "REUSSIE" | "ECHOUEE";
    motif?: string | null;
    contesteId?: string | null;
  },
  ex: ExecuteurDb = db,
): Promise<ResultatJournal> {
  try {
    const contesteId = input.contesteId ?? null;
    if (contesteId) {
      const visees = await ex
        .select({ id: journalAudit.id })
        .from(journalAudit)
        .where(eq(journalAudit.id, contesteId))
        .limit(1);
      if (visees.length === 0) {
        return { ok: false, erreur: ERREUR_CONTESTEE_INTROUVABLE };
      }
    }
    const id = randomUUID();
    await ex.insert(journalAudit).values({
      id,
      acteurId: input.acteurId ?? null,
      roleAuMoment: input.roleAuMoment,
      typeAction: input.typeAction,
      entite: input.entite,
      entiteId: input.entiteId ?? null,
      avant: (input.avant ?? null) as never,
      apres: (input.apres ?? null) as never,
      appareilId: input.appareilId ?? null,
      horodatageLocal: input.horodatageLocal ?? new Date(),
      statut: input.statut ?? "REUSSIE",
      motif: input.motif ?? null,
      contesteId,
    });
    return { ok: true, id };
  } catch {
    return { ok: false, erreur: "Journal indisponible." };
  }
}

export async function journaliserRefusContestation(
  input: {
    acteurId?: string | null;
    roleAuMoment: string;
    typeAction: string;
    entite: string;
    entiteId?: string | null;
    motif: string;
    contesteId: string;
  },
  ex: ExecuteurDb = db,
): Promise<void> {
  try {
    await enregistrerEvenement({ ...input, statut: "ECHOUEE" }, ex);
  } catch {
  }
}
