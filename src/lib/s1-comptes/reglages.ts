import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  DEFAUT_DUREE_INVITATION_JOURS,
  estCleReglage,
  normaliserDureeInvitationJours,
  peutModifierReglage,
  reglages,
  type CleReglage,
} from "@/lib/db/schema/s1-comptes";
import { StaffError } from "./staff";

// Couche applicative des réglages (/admin/parametres). Lecture : tout admin
// de l'espace /admin. Écriture : même autorisation que la création d'un
// administrateur principal, tracée par modifiePar (journal S2 à venir).

const VALEURS_DEFAUT: Record<CleReglage, string> = {
  duree_invitation_jours: String(DEFAUT_DUREE_INVITATION_JOURS),
};

/** Lit un réglage : la valeur stockée, ou le défaut si absent. */
export async function lireReglage(cle: CleReglage): Promise<string> {
  const lignes = await db
    .select({ valeur: reglages.valeur })
    .from(reglages)
    .where(eq(reglages.cle, cle));
  return lignes[0]?.valeur ?? VALEURS_DEFAUT[cle];
}

/** Durée par défaut d'un lien d'invitation, en jours, bornée [1, 30]. */
export async function lireDureeInvitationJours(): Promise<number> {
  return normaliserDureeInvitationJours(
    await lireReglage("duree_invitation_jours"),
  );
}

export async function definirReglage(input: {
  cle: string;
  valeur: string;
  modifieParRole: string;
  modifieParEtat: string;
  modifieParId: string;
}): Promise<{ cle: CleReglage; valeur: string }> {
  if (!estCleReglage(input.cle)) {
    throw new StaffError("NON_AUTORISE", "réglage inconnu");
  }
  if (
    !peutModifierReglage(input.cle, input.modifieParRole, input.modifieParEtat)
  ) {
    throw new StaffError("NON_AUTORISE", "modificateur non autorisé");
  }
  const valeur =
    input.cle === "duree_invitation_jours"
      ? String(normaliserDureeInvitationJours(input.valeur))
      : input.valeur;
  await db
    .insert(reglages)
    .values({ cle: input.cle, valeur, modifiePar: input.modifieParId })
    .onDuplicateKeyUpdate({
      set: { valeur, modifiePar: input.modifieParId },
    });
  return { cle: input.cle, valeur };
}
