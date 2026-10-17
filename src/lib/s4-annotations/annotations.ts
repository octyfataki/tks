import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, type ExecuteurDb } from "@/lib/db/client";
import { annotationsClients } from "@/lib/db/schema/s4-annotations";
import { comptesClients } from "@/lib/db/schema/s1-comptes";
import { accesProfilClients } from "@/lib/db/schema/s4-clients";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import { estEtiquetteConnue, etiquetteParCode } from "./etiquettes";
import { deriverEtiquettesActives, deriverEtiquettesActivesParCle } from "./derivation";

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

/**
 * Lecture par profil : c'est celle que doit utiliser tout écran qui montre le
 * shop. Changer de compte de connexion ou rétablir un accès ne change rien à
 * ce que renvoie cette fonction.
 */
export async function etiquettesActivesParProfil(
  profilIds: readonly string[],
): Promise<Map<string, string[]>> {
  if (profilIds.length === 0) return new Map();
  const lignes = await db
    .select({
      profilClientId: annotationsClients.profilClientId,
      etiquette: annotationsClients.etiquette,
      statut: annotationsClients.statut,
      horodatageLocal: annotationsClients.horodatageLocal,
      recuLe: annotationsClients.recuLe,
    })
    .from(annotationsClients)
    .where(inArray(annotationsClients.profilClientId, [...profilIds]));
  return deriverEtiquettesActivesParCle(
    lignes,
    (evenement) => evenement.profilClientId ?? "",
  );
}

/**
 * Le profil vient de l'accès actif, jamais du téléphone. Un compte sans accès
 * ne rattache rien : l'étiquette part alors sans profil, et attendra qu'un
 * agent confirme l'accès au shop.
 */
async function profilActifDuCompte(
  compteClientId: string,
): Promise<string | null> {
  const lignes = await db
    .select({ profilClientId: accesProfilClients.profilClientId })
    .from(accesProfilClients)
    .where(
      and(
        eq(accesProfilClients.compteClientId, compteClientId),
        eq(accesProfilClients.statut, "ACCORDE"),
      ),
    )
    .limit(1);
  return lignes[0]?.profilClientId ?? null;
}

async function compteExiste(compteClientId: string): Promise<boolean> {
  const lignes = await db
    .select({ id: comptesClients.id })
    .from(comptesClients)
    .where(eq(comptesClients.id, compteClientId))
    .limit(1);
  return lignes.length > 0;
}

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
  const profilClientId = await profilActifDuCompte(input.compteClientId);
  await ex.insert(annotationsClients).values({
    id: randomUUID(),
    compteClientId: input.compteClientId,
    profilClientId,
    etiquette: input.etiquette,
    statut: input.statut,
    acteurId: input.acteurId,
    horodatageLocal,
  });
}

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
