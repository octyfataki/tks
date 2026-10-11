import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { journalAudit } from "@/lib/db/schema/s2-autorisations";

// S2 issue 01 — écriture append-only. Appelée par chaque action métier.
// Ne lit jamais le journal (la consultation n'est pas journalisée).
// `horodatageLocal` conservé tel quel : le serveur ne le réécrit pas.
// S2 issue 15 — `contesteId` lie une correction à la ligne contestée (fil
// « erreur → correction »). La ligne contestée doit exister : un lien vers
// une ligne inconnue est refusé (échec fermé), jamais écrit à l'aveugle.

export type ResultatJournal =
  | { ok: true; id: string }
  | { ok: false; erreur: string };

/** Ligne contestée introuvable : cause vraie, jamais masquée. */
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
    /** Horloge de l'appareil ; défaut = maintenant (action en ligne). */
    horodatageLocal?: Date;
    statut?: "REUSSIE" | "ECHOUEE";
    motif?: string | null;
    /** Ligne contestée par la présente correction (défaut : aucune). */
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

/**
 * S2 issue 15 — trace d'un refus opposé à une contestation depuis le
 * journal (permission manquante) : une ligne ÉCHOUÉE liée à la ligne
 * contestée, pour que le refus lui-même soit auditable. Best effort :
 * n'échoue jamais, ne masque jamais l'erreur d'origine.
 */
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
    // Best effort : le refus reste refusé même si sa trace échoue.
  }
}
