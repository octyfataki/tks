"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { session as sessionAuth } from "@/lib/db/schema/auth-schema";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { modifierAgentSupport, modifierEmailAgentSupport, ouvrirLienMotDePasseAgent, revoquerPremierAccesAdmin, tuerSessionsStaff, StaffError } from "@/lib/s1-comptes/staff";
import type { ErreurStaff } from "@/lib/s1-comptes/staff";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import type { ResultatAction } from "@/lib/resultat-action";

export type ResultatModificationCoordonneesAgent = ResultatAction<{
  inchange: boolean;
}>;

const ERREUR_CORRECTION_DEFAUT =
  "Correction impossible (données invalides ou compte introuvable).";

function messageErreur(code: ErreurStaff): string {
  switch (code) {
    case "NON_AUTORISE":
      return "Seul un administrateur principal validé peut corriger cet agent, et uniquement sur un compte agent validé.";
    case "TELEPHONE_INVALIDE":
      return "Numéro de téléphone invalide (format international : + optionnel, chiffres, espaces, tirets, points, parenthèses).";
    case "EMAIL_DEJA_UTILISE":
      return "Adresse déjà utilisée par un autre compte.";
    case "EMAIL_INVALIDE":
      return "Adresse email invalide.";
    default:
      return ERREUR_CORRECTION_DEFAUT;
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
    return { ok: false, erreur: ERREUR_CORRECTION_DEFAUT };
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
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, erreur: "Adresse email invalide." };
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
    return { ok: false, erreur: ERREUR_CORRECTION_DEFAUT };
  }
}

export type ResultatLienMotDePasse = ResultatAction<{ lien: string }>;

/**
 * Génère un lien de réinitialisation de mot de passe pour un agent
 * (mot de passe oublié) : jeton unique, 24 h, choix du mot de passe
 * uniquement, aucune session ouverte. Le lien s'affiche une seule fois,
 * à transmettre à l'agent. Journalisé (agent.lien_mdp).
 */
export async function genererLienMotDePasseAgentAction(
  id: string,
): Promise<ResultatLienMotDePasse> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut générer un lien." };
  }
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  const createurId = lignes[0]?.id ?? null;
  if (!createurId) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut générer un lien." };
  }
  try {
    const acces = await ouvrirLienMotDePasseAgent(createurId, id);
    revalidatePath(`/admin/agents/${id}`);
    return { ok: true, lien: `/premier-acces/${acces.jeton}` };
  } catch (erreur) {
    // ouvrirLienMotDePasseAgent ne jette que NON_AUTORISE (acteur non
    // autorisé ou cible non éligible) : mappé explicitement, le reste est
    // une panne inconnue.
    if (erreur instanceof StaffError && erreur.code === "NON_AUTORISE") {
      return { ok: false, erreur: "Lien impossible : compte non éligible (agent validé exigé)." };
    }
    return { ok: false, erreur: "Lien impossible." };
  }
}

export type ResultatOperationSimple = ResultatAction;

async function idPrincipalConnecte(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignes[0];
  if (!moi || moi.role !== "ADMIN_PRINCIPAL" || moi.etat !== "VALIDE") {
    return null;
  }
  return moi.id;
}

/**
 * Coupe toutes les sessions d'un agent, partout, tout de suite
 * (appareil volé, doute sur qui détient l'accès). Seul un
 * administrateur principal validé agit, cible AGENT. Tracé
 * (agent.deconnecter, nombre de sessions coupées).
 */
export async function deconnecterPartoutAgentAction(
  id: string,
): Promise<ResultatOperationSimple> {
  const modificateurId = await idPrincipalConnecte();
  if (!modificateurId) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut déconnecter." };
  }
  const cibles = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      betterAuthUserId: comptesStaff.betterAuthUserId,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  const cible = cibles[0];
  if (!cible || cible.role !== "AGENT") {
    return { ok: false, erreur: "Agent introuvable." };
  }
  const avant = await db
    .select({ id: sessionAuth.id })
    .from(sessionAuth)
    .where(eq(sessionAuth.userId, cible.betterAuthUserId));
  try {
    await db.transaction(async (tx) => {
      await tuerSessionsStaff(cible.betterAuthUserId, tx);
      const demandeurs = await tx
        .select({ role: comptesStaff.role })
        .from(comptesStaff)
        .where(eq(comptesStaff.id, modificateurId))
        .limit(1);
      const trace = await enregistrerEvenement(
        {
          acteurId: modificateurId,
          roleAuMoment: demandeurs[0]?.role ?? "ADMIN_PRINCIPAL",
          typeAction: "agent.deconnecter",
          entite: "compte_staff",
          entiteId: cible.id,
          avant: { sessions: avant.length },
          apres: { sessions: 0 },
        },
        tx,
      );
      if (!trace.ok) throw new Error("journal indisponible");
    });
  } catch {
    return { ok: false, erreur: "Déconnexion impossible." };
  }
  revalidatePath(`/admin/agents/${id}`);
  return { ok: true };
}

/**
 * Révoque un lien de réinitialisation encore en attente (fuite,
 * erreur de destinataire). Même autorisation que la génération :
 * seul un administrateur principal validé. Journalisé
 * (invitation.revoquer, comme tout lien).
 */
export async function revoquerLienMotDePasseAgentAction(
  accesId: string,
): Promise<ResultatOperationSimple> {
  const modificateurId = await idPrincipalConnecte();
  if (!modificateurId) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut révoquer un lien." };
  }
  const cible = accesId.trim();
  if (!cible) {
    return { ok: false, erreur: "Lien déjà utilisé, expiré ou introuvable." };
  }
  try {
    await revoquerPremierAccesAdmin(modificateurId, cible);
    revalidatePath("/admin/agents");
    return { ok: true };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      if (erreur.code === "INVITATION_REVOQUEE") {
        // Idempotence : révoquer deux fois = même état, pas d'erreur
        // (même contrat que les autres révocations de lien).
        revalidatePath("/admin/agents");
        return { ok: true };
      }
      return { ok: false, erreur: "Lien déjà utilisé, expiré ou introuvable." };
    }
    return { ok: false, erreur: "Révocation impossible." };
  }
}
