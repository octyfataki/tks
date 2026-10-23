import { desc, eq } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { journalAudit } from "@/lib/db/schema/authorizations";
import { resumerEvenement } from "./journal-summary";

export type ActiviteRecente = {
  id: string;
  resume: string;
  ecritLe: Date;
};

export async function listerActiviteRecente(
  acteurId: string,
  limite: number = 5,
  ex: ExecuteurDb = db,
): Promise<ActiviteRecente[]> {
  if (acteurId.trim() === "" || limite <= 0) return [];

  const lignes = await ex
    .select({
      id: journalAudit.id,
      typeAction: journalAudit.typeAction,
      entite: journalAudit.entite,
      avant: journalAudit.avant,
      apres: journalAudit.apres,
      motif: journalAudit.motif,
      horodatageLocal: journalAudit.horodatageLocal,
    })
    .from(journalAudit)
    .where(eq(journalAudit.acteurId, acteurId))
    .orderBy(desc(journalAudit.recuLe))
    .limit(limite * 3);

  const activite: ActiviteRecente[] = [];
  for (const ligne of lignes) {
    const resume = resumerEvenement({
      typeAction: ligne.typeAction,
      entite: ligne.entite,
      avant: ligne.avant,
      apres: ligne.apres,
      motif: ligne.motif,
    });
    if (!resume) continue;
    activite.push({
      id: ligne.id,
      resume,
      ecritLe: ligne.horodatageLocal,
    });
    if (activite.length === limite) break;
  }
  return activite;
}
