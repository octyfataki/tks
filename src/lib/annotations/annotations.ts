import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { annotationsClients } from "@/lib/db/schema/annotations";
import { comptesClients } from "@/lib/db/schema/accounts";
import { enregistrerEvenement } from "@/lib/authorizations/journal";
import { estEtiquetteConnue, etiquetteParCode } from "./labels";
import { deriverEtiquettesActives } from "./derivation";

// Issue #7 — lecture et écriture des annotations clients.
//
// Écriture append-only : poser puis retirer sont deux lignes, jamais une
// mise à jour ni une suppression (invariant 10). L'état courant se dérive
// (`derivation.ts`, pur, testé sans base), il ne se stocke pas. Toute
// écriture embarque sa trace d'audit dans la même transaction : journal
// indisponible = geste annulé.

export type ErreurAnnotation =
  | "COMPTE_INTROUVABLE"
  | "ETIQUETTE_INCONNUE"
  | "JOURNAL_INDISPONIBLE";

export class AnnotationError extends Error {
  code: ErreurAnnotation;
  constructor(code: ErreurAnnotation, message: string) {
    super(message);
    this.code = code;
  }
}

/** Étiquettes actives des comptes demandés. Un seul aller-retour en base. */
export async function etiquettesActivesParCompte(
  compteIds: readonly string[],
): Promise<Map<string, string[]>> {
  if (compteIds.length === 0) return new Map();
  const lignes = await db
    .select({
      compteClientId: annotationsClients.compteClientId,
      etiquette: annotationsClients.etiquette,
      statut: annotationsClients.statut,
      horodatageLocal: annotationsClients.horodatageLocal,
      recuLe: annotationsClients.recuLe,
    })
    .from(annotationsClients)
    .where(inArray(annotationsClients.compteClientId, [...compteIds]));
  return deriverEtiquettesActives(lignes);
}

async function compteExiste(compteClientId: string): Promise<boolean> {
  const lignes = await db
    .select({ id: comptesClients.id })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteClientId))
    .limit(1);
  return lignes.length > 0;
}

/**
 * Consigne un geste d'annotation (pose ou retrait) : une ligne append-only
 * et sa trace d'audit, dans la même transaction. `typeAction` reprend le
 * vocabulaire de l'action ; l'entité tracée est l'annotation du compte.
 */
async function consignerAnnotation(input: {
  compteClientId: string;
  etiquette: string;
  statut: "POSEE" | "RETIREE";
  acteurId: string;
  roleAuMoment: string;
  horodatageLocal?: Date;
  ex?: ExecuteurDb;
}): Promise<void> {
  if (!estEtiquetteConnue(input.etiquette)) {
    throw new AnnotationError("ETIQUETTE_INCONNUE", "étiquette inconnue");
  }
  const horodatageLocal = input.horodatageLocal ?? new Date();
  const ex = input.ex ?? db;
  // Le libellé français est figé dans la trace : le résumé du journal
  // (S2) reste lisible sans dépendre de la liste applicative.
  const libelle =
    etiquetteParCode(input.etiquette)?.libelle ?? input.etiquette;
  const trace = await enregistrerEvenement(
    {
      acteurId: input.acteurId,
      roleAuMoment: input.roleAuMoment,
      typeAction:
        input.statut === "POSEE" ? "annotation.poser" : "annotation.retirer",
      entite: "annotation_client",
      entiteId: `${input.compteClientId}:${input.etiquette}`,
      avant: input.statut === "RETIREE" ? { etiquette: input.etiquette } : undefined,
      apres: {
        compteClientId: input.compteClientId,
        etiquette: input.etiquette,
        statut: input.statut,
        libelle,
      },
      horodatageLocal,
    },
    ex,
  );
  if (!trace.ok) {
    throw new AnnotationError("JOURNAL_INDISPONIBLE", "journal indisponible");
  }
  await ex.insert(annotationsClients).values({
    id: randomUUID(),
    compteClientId: input.compteClientId,
    etiquette: input.etiquette,
    statut: input.statut,
    acteurId: input.acteurId,
    horodatageLocal,
  });
}

/** Pose une étiquette sur un compte client. Écriture inverse = retirer. */
export async function poserEtiquette(input: {
  acteurId: string;
  roleAuMoment: string;
  compteClientId: string;
  etiquette: string;
  horodatageLocal?: Date;
}): Promise<void> {
  if (!estEtiquetteConnue(input.etiquette)) {
    throw new AnnotationError("ETIQUETTE_INCONNUE", "étiquette inconnue");
  }
  if (!(await compteExiste(input.compteClientId))) {
    throw new AnnotationError("COMPTE_INTROUVABLE", "compte introuvable");
  }
  await db.transaction(async (tx) => {
    await consignerAnnotation({ ...input, statut: "POSEE", ex: tx });
  });
}

/**
 * Retire une étiquette d'un compte client. Aucune ligne n'est supprimée :
 * on ajoute l'écriture inverse, tracée (invariant 10).
 */
export async function retirerEtiquette(input: {
  acteurId: string;
  roleAuMoment: string;
  compteClientId: string;
  etiquette: string;
  horodatageLocal?: Date;
}): Promise<void> {
  if (!estEtiquetteConnue(input.etiquette)) {
    throw new AnnotationError("ETIQUETTE_INCONNUE", "étiquette inconnue");
  }
  if (!(await compteExiste(input.compteClientId))) {
    throw new AnnotationError("COMPTE_INTROUVABLE", "compte introuvable");
  }
  await db.transaction(async (tx) => {
    await consignerAnnotation({ ...input, statut: "RETIREE", ex: tx });
  });
}
