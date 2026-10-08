import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import { journalAudit } from "@/lib/db/schema/s2-autorisations";

// S2 issue 01 — écriture append-only. Appelée par chaque action métier.
// Ne lit jamais le journal (la consultation n'est pas journalisée).
// `horodatageLocal` conservé tel quel : le serveur ne le réécrit pas.

export type ResultatJournal =
  | { ok: true; id: string }
  | { ok: false; erreur: string };

export async function enregistrerEvenement(input: {
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
}): Promise<ResultatJournal> {
  try {
    const id = randomUUID();
    await db.insert(journalAudit).values({
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
    });
    return { ok: true, id };
  } catch {
    return { ok: false, erreur: "Journal indisponible." };
  }
}
