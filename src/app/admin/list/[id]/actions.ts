"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesStaff,
  facteurs2faAdmin,
  peutRenommerAppareil2fa,
} from "@/lib/db/schema/s1-comptes";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import { modifierAdminSupport, StaffError } from "@/lib/s1-comptes/staff";
import type { ErreurStaff } from "@/lib/s1-comptes/staff";
import type { ResultatAction } from "@/lib/resultat-action";

export type ResultatModificationCoordonnees = ResultatAction<{
  inchange: boolean;
}>;

export type ResultatModificationAppareil = ResultatAction<{
  inchange: boolean;
}>;

function messageErreur(code: ErreurStaff): string {
  switch (code) {
    case "NON_AUTORISE":
      return "Seul un administrateur principal ou technique validé peut corriger ce compte, et uniquement sur un compte d'administration validé.";
    case "TELEPHONE_INVALIDE":
      return "Numéro de téléphone invalide (format international : + optionnel, chiffres, espaces, tirets, points, parenthèses).";
    default:
      return "Correction impossible (données invalides ou compte introuvable).";
  }
}

async function idStaffConnecte(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  return lignes[0]?.id ?? null;
}

/**
 * Corrige le nom + téléphone de contact d'un compte d'administration
 * (support livraison : coquille, oubli). Rôle, email, état et secrets ne
 * passent jamais par ici — voir modifierAdminSupport : une erreur de
 * rôle ou d'email se corrige par révocation + recréation tracées.
 * Chaque correction est journalisée (admin.modifier, avant/après).
 */
export async function modifierCoordonneesAdminAction(
  id: string,
  _precedent: ResultatModificationCoordonnees | null,
  donnees: FormData,
): Promise<ResultatModificationCoordonnees> {
  const modificateurId = await idStaffConnecte();
  if (!modificateurId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  const nom = String(donnees.get("nom") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  if (!nom) {
    return { ok: false, erreur: "Le nom est exigé." };
  }

  try {
    const resultat = await modifierAdminSupport(modificateurId, id, {
      nom,
      telephone,
    });
    revalidatePath(`/admin/list/${id}`);
    revalidatePath("/admin/list");
    return { ok: true, inchange: resultat.inchange };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: messageErreur(erreur.code) };
    }
    return { ok: false, erreur: "Correction impossible (données invalides ou compte introuvable)." };
  }
}

/**
 * Renomme l'étiquette du second facteur (« Code par SMS »). Seul le libellé
 * est écrit : le secret du second facteur ne passe jamais par ici (S2-04). Même autorisation que la correction des coordonnées, jamais sur
 * un compte révoqué. Correction journalisée (avant/après).
 */
export async function modifierAppareil2faAction(
  id: string,
  _precedent: ResultatModificationAppareil | null,
  donnees: FormData,
): Promise<ResultatModificationAppareil> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }
  const demandeurs = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const demandeur = demandeurs[0];
  if (!demandeur || !peutRenommerAppareil2fa(demandeur.role, demandeur.etat)) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  const cibles = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  const cible = cibles[0];
  if (
    !cible ||
    (cible.role !== "ADMIN_PRINCIPAL" && cible.role !== "ADMIN_TECHNIQUE") ||
    cible.etat !== "VALIDE"
  ) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  const nomAppareil = String(donnees.get("nomAppareil") ?? "").trim();
  if (nomAppareil.length < 2 || nomAppareil.length > 255) {
    return { ok: false, erreur: "Nom d'appareil invalide (2 à 255 caractères)." };
  }

  const facteurs = await db
    .select({ id: facteurs2faAdmin.id, nomAppareil: facteurs2faAdmin.nomAppareil })
    .from(facteurs2faAdmin)
    .where(eq(facteurs2faAdmin.compteStaffId, cible.id))
    .limit(1);
  const facteur = facteurs[0];
  if (!facteur) {
    return { ok: false, erreur: "Aucun appareil déclaré pour ce compte." };
  }
  if (facteur.nomAppareil === nomAppareil) {
    return { ok: true, inchange: true };
  }

  await db
    .update(facteurs2faAdmin)
    .set({ nomAppareil })
    .where(eq(facteurs2faAdmin.id, facteur.id));
  await enregistrerEvenement({
    acteurId: demandeur.id,
    roleAuMoment: demandeur.role,
    typeAction: "admin.modifier",
    entite: "facteur_2fa_admin",
    entiteId: facteur.id,
    avant: { nomAppareil: facteur.nomAppareil },
    apres: { nomAppareil },
  });

  revalidatePath(`/admin/list/${id}`);
  revalidatePath("/admin/list");
  return { ok: true, inchange: false };
}
