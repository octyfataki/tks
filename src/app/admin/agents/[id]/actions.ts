"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { modifierAgentSupport, modifierEmailAgentSupport, StaffError } from "@/lib/s1-comptes/staff";

export type ResultatModificationCoordonneesAgent =
  | { ok: true; inchange: boolean }
  | { ok: false; erreur: string };

function messageErreur(code: string): string {
  switch (code) {
    case "NON_AUTORISE":
      return "Seul un administrateur principal validé peut corriger cet agent, et uniquement sur un compte agent validé.";
    case "TELEPHONE_INVALIDE":
      return "Numéro de téléphone invalide (chiffres, espaces et + uniquement).";
    case "EMAIL_DEJA_UTILISE":
      return "Adresse déjà utilisée par un autre compte.";
    default:
      return "Correction impossible (données invalides ou compte introuvable).";
  }
}

/**
 * Corrige le nom + téléphone de contact d'un agent de service
 * (support terrain : coquille, oubli). Rôle, email, état et secrets ne
 * passent jamais par ici — voir modifierAgentSupport : une erreur de
 * rôle se corrige par révocation + recréation, l'email par
 * modifierEmailAgentAction (confirmé deux fois). Chaque
 * correction est journalisée (agent.modifier, avant/après).
 */
export async function modifierCoordonneesAgentAction(
  id: string,
  _precedent: ResultatModificationCoordonneesAgent | null,
  donnees: FormData,
): Promise<ResultatModificationCoordonneesAgent> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  const modificateurId = lignes[0]?.id ?? null;
  if (!modificateurId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  const nom = String(donnees.get("nom") ?? "").trim();
  const telephone = String(donnees.get("telephone") ?? "").trim();
  if (!nom) {
    return { ok: false, erreur: "Le nom est exigé." };
  }

  try {
    const resultat = await modifierAgentSupport(modificateurId, id, {
      nom,
      telephone,
    });
    revalidatePath(`/admin/agents/${id}`);
    revalidatePath("/admin/agents");
    return { ok: true, inchange: resultat.inchange };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: messageErreur(erreur.code) };
    }
    return { ok: false, erreur: messageErreur("INCONNU") };
  }
}

/**
 * Change l'email (identifiant de connexion) d'un agent. Exige la
 * confirmation explicite (`confirmation === "oui"`, posée par le
 * dialogue de confirmation) en plus de la saisie : on ne change pas
 * une clé de compte par accident. Journalisé (agent.modifier).
 */
export async function modifierEmailAgentAction(
  id: string,
  _precedent: ResultatModificationCoordonneesAgent | null,
  donnees: FormData,
): Promise<ResultatModificationCoordonneesAgent> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  const modificateurId = lignes[0]?.id ?? null;
  if (!modificateurId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  if (String(donnees.get("confirmation") ?? "") !== "oui") {
    return { ok: false, erreur: "Confirmez le changement dans le dialogue." };
  }
  const email = String(donnees.get("email") ?? "").trim();
  if (!email) {
    return { ok: false, erreur: "L'adresse email est exigée." };
  }

  try {
    const resultat = await modifierEmailAgentSupport(modificateurId, id, {
      email,
    });
    revalidatePath(`/admin/agents/${id}`);
    revalidatePath("/admin/agents");
    return { ok: true, inchange: resultat.inchange };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: messageErreur(erreur.code) };
    }
    return { ok: false, erreur: messageErreur("INCONNU") };
  }
}
