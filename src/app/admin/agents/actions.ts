"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutInviterAgent } from "@/lib/db/schema/s1-comptes";
import { peutGererPermissions } from "@/lib/db/schema/s2-autorisations";
import {
  accorderPermission,
  accorderSocle,
  appliquerProfilAgent,
  AutorisationError,
  listerSocle,
  retirerPermission,
  retirerSocle,
} from "@/lib/s2-autorisations/autorisations";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import {
  creerAgent,
  creerInvitationAgent,
  revoquerInvitation,
  StaffError,
  tuerSessionsStaff,
} from "@/lib/s1-comptes/staff";
import {
  PERMISSIONS_FERMEES,
  PROFIL_AGENT_SERVICE_DEFAUT,
} from "@/lib/db/schema/s2-autorisations/validation";

export type ResultatAction =
  | { ok: true; lien?: string; email?: string }
  | { ok: false; erreur: string };

async function staffConnecte() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  return lignes[0] ?? null;
}

/**
 * Crée un agent de service en direct (comptoir). Seul un administrateur
 * principal VALIDE (S1 : peutInviterAgent). Zéro permission par défaut —
 * le compte s'authentifie mais ne fait rien tant que le distributeur
 * n'accorde rien (S2). Le contrôle réel est dans creerAgent.
 */
export async function creerAgentAction(
  _precedent: ResultatAction | null,
  donnees: FormData,
): Promise<ResultatAction> {
  const email = String(donnees.get("email") ?? "").trim().toLowerCase();
  const prenom = String(donnees.get("prenom") ?? "").trim();
  const nom = String(donnees.get("nom") ?? "").trim();
  const motDePasse = String(donnees.get("motDePasse") ?? "");
  const telephone = String(donnees.get("telephone") ?? "").trim();
  if (!email.includes("@") || !prenom || !nom || motDePasse.length < 8) {
    return {
      ok: false,
      erreur: "Email valide, prénom, nom et mot de passe d'au moins 8 caractères exigés.",
    };
  }
  const moi = await staffConnecte();
  if (!moi) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut créer un agent." };
  }
  try {
    await creerAgent(moi.id, {
      email,
      password: motDePasse,
      name: `${prenom} ${nom}`.trim(),
      telephone,
    });
    revalidatePath("/admin/agents");
    return { ok: true, email };
  } catch (erreur) {
    if (erreur instanceof StaffError && erreur.code === "TELEPHONE_INVALIDE") {
      return { ok: false, erreur: "Numéro de téléphone invalide (chiffres, espaces et + uniquement)." };
    }
    if (erreur instanceof StaffError && erreur.code === "MOT_DE_PASSE_INVALIDE") {
      return { ok: false, erreur: "Mot de passe d'au moins 8 caractères exigé." };
    }
    if (erreur instanceof StaffError && erreur.code === "EMAIL_DEJA_UTILISE") {
      return { ok: false, erreur: "Cet identifiant (email) est déjà utilisé — chaque agent a son propre email." };
    }
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: "Seul un administrateur principal validé peut créer un agent." };
    }
    console.error("[creerAgentAction] échec création agent", erreur);
    return { ok: false, erreur: "Création impossible (identifiant déjà utilisé ou données invalides)." };
  }
}

/**
 * Révoque un agent (VALIDE → REVOQUE, définitif : aucun retour — rouvrir
 * un accès passe par révocation + recréation, S2). Garde-fous : même
 * autorisation que la création, jamais soi-même, jamais deux fois.
 * Journalisée (S2 issue 01).
 */
export async function revoquerAgentAction(id: string): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut révoquer un agent." };
  }
  if (moi.id === id) {
    return { ok: false, erreur: "Vous ne pouvez pas révoquer votre propre compte." };
  }
  const cibles = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  const cible = cibles[0];
  if (!cible || cible.role !== "AGENT") {
    return { ok: false, erreur: "Agent introuvable." };
  }
  if (cible.etat !== "VALIDE" && cible.etat !== "SUSPENDU") {
    return { ok: false, erreur: "Agent déjà révoqué." };
  }
  await db
    .update(comptesStaff)
    .set({ etat: "REVOQUE", revokedAt: new Date() })
    .where(eq(comptesStaff.id, cible.id));
  await enregistrerEvenement({
    acteurId: moi.id,
    roleAuMoment: moi.role,
    typeAction: "agent.revoquer",
    entite: "compte_staff",
    entiteId: cible.id,
    avant: { etat: cible.etat },
    apres: { etat: "REVOQUE" },
  });
  revalidatePath("/admin/agents");
  return { ok: true };
}

/**
 * Suspend un agent (VALIDE → SUSPENDU, réversible). Le compte ne se
 * connecte plus et ses sessions sont tuées aussitôt, mais le retour
 * vers VALIDE existe — pour un malentendu, pas pour un départ.
 * Garde-fous : même autorisation que la révocation, jamais soi-même,
 * jamais sur un compte REVOQUE. Journalisée (S2 issue 01).
 */
export async function suspendreAgentAction(id: string): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut suspendre un agent." };
  }
  if (moi.id === id) {
    return { ok: false, erreur: "Vous ne pouvez pas suspendre votre propre compte." };
  }
  const cibles = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
      betterAuthUserId: comptesStaff.betterAuthUserId,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  const cible = cibles[0];
  if (!cible || cible.role !== "AGENT") {
    return { ok: false, erreur: "Agent introuvable." };
  }
  if (cible.etat === "REVOQUE") {
    return { ok: false, erreur: "Agent déjà révoqué." };
  }
  if (cible.etat === "SUSPENDU") {
    return { ok: false, erreur: "Agent déjà suspendu." };
  }
  const suspenduLe = new Date();
  await db
    .update(comptesStaff)
    .set({ etat: "SUSPENDU", suspendedAt: suspenduLe })
    .where(eq(comptesStaff.id, cible.id));
  await tuerSessionsStaff(cible.betterAuthUserId);
  await enregistrerEvenement({
    acteurId: moi.id,
    roleAuMoment: moi.role,
    typeAction: "agent.suspendre",
    entite: "compte_staff",
    entiteId: cible.id,
    avant: { etat: "VALIDE" },
    apres: { etat: "SUSPENDU", suspenduLe },
  });
  revalidatePath("/admin/agents");
  return { ok: true };
}

/**
 * Lève la suspension d'un agent (SUSPENDU → VALIDE). Même autorisation
 * que suspendre, jamais soi-même : on ne se dé-suspend pas tout seul.
 * Seule une suspension se lève — un REVOQUE ne revient jamais.
 * Journalisée (S2 issue 01).
 */
export async function leverSuspensionAgentAction(id: string): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut lever une suspension." };
  }
  if (moi.id === id) {
    return { ok: false, erreur: "Vous ne pouvez pas lever votre propre suspension." };
  }
  const cibles = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  const cible = cibles[0];
  if (!cible || cible.role !== "AGENT") {
    return { ok: false, erreur: "Agent introuvable." };
  }
  if (cible.etat !== "SUSPENDU") {
    return { ok: false, erreur: cible.etat === "REVOQUE" ? "Agent déjà révoqué." : "Agent non suspendu." };
  }
  await db
    .update(comptesStaff)
    .set({ etat: "VALIDE", suspendedAt: null })
    .where(eq(comptesStaff.id, cible.id));
  await enregistrerEvenement({
    acteurId: moi.id,
    roleAuMoment: moi.role,
    typeAction: "agent.lever_suspension",
    entite: "compte_staff",
    entiteId: cible.id,
    avant: { etat: "SUSPENDU" },
    apres: { etat: "VALIDE" },
  });
  revalidatePath("/admin/agents");
  return { ok: true };
}

/**
 * Renvoie une invitation agent : génère un NOUVEAU lien (on ne réactive
 * jamais un lien expiré ou consommé). Même autorisation que l'invitation.
 */
export async function renvoyerInvitationAgentAction(): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut inviter un agent." };
  }
  try {
    const invitation = await creerInvitationAgent(moi.id, {});
    revalidatePath("/admin/agents/invitations");
    return { ok: true, lien: `/invite/${invitation.jeton}` };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: "Seul un administrateur principal validé peut inviter un agent." };
    }
    return { ok: false, erreur: "Invitation impossible." };
  }
}

/**
 * Révoque un lien d'invitation agent encore en attente (définitif : le lien
 * ne servira plus, un nouveau lien passe par une nouvelle génération).
 * Même autorisation que l'invitation (S1 : peutInviterAgent — le contrôle
 * réel, y compris l'état du lien, est dans revoquerInvitation).
 * Journalisée (S2).
 */
export async function revoquerInvitationAgentAction(
  invitationId: string,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut révoquer une invitation." };
  }
  try {
    await revoquerInvitation(moi.id, invitationId);
    revalidatePath("/admin/agents/invitations");
    return { ok: true };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      switch (erreur.code) {
        case "NON_AUTORISE":
          return { ok: false, erreur: "Seul un administrateur principal validé peut révoquer une invitation." };
        case "INVITATION_INTROUVABLE":
          return { ok: false, erreur: "Invitation introuvable." };
        case "INVITATION_DEJA_CONSOMMEE":
          return { ok: false, erreur: "Lien déjà utilisé — rien à révoquer." };
        case "INVITATION_REVOQUEE":
          // Idempotence : révoquer deux fois = même état, pas d'erreur.
          revalidatePath("/admin/agents/invitations");
          return { ok: true };
        case "INVITATION_EXPIREE":
          return { ok: false, erreur: "Lien expiré — générez-en un nouveau." };
        default:
          return { ok: false, erreur: "Révocation impossible." };
      }
    }
    return { ok: false, erreur: "Révocation impossible." };
  }
}

function erreurAutorisation(erreur: unknown): string {
  if (erreur instanceof AutorisationError) {
    switch (erreur.code) {
      case "NON_AUTORISE":
        return "Seul un administrateur principal validé gère les permissions.";
      case "PERMISSION_INCONNUE":
        return "Permission inconnue — refus par défaut.";
      case "AGENT_INTROUVABLE":
        return "Agent introuvable.";
      case "DEJA_ACCORDEE":
        return erreur.message || "Permission déjà accordée.";
      case "NON_ACCORDEE":
        return erreur.message || "Permission non accordée.";
    }
  }
  return "Opération impossible.";
}

/** Accorde une permission à un agent (S2 issue 03). */
export async function accorderPermissionAction(
  agentId: string,
  permission: string,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    return { ok: false, erreur: erreurAutorisation(new AutorisationError("NON_AUTORISE", "")) };
  }
  try {
    await accorderPermission(moi.id, agentId, permission);
    revalidatePath("/admin/agents");
    revalidatePath("/admin/agents/permissions");
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreurAutorisation(erreur) };
  }
}

/** Retire une permission à un agent. Le retrait fait foi. */
export async function retirerPermissionAction(
  agentId: string,
  permission: string,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    return { ok: false, erreur: erreurAutorisation(new AutorisationError("NON_AUTORISE", "")) };
  }
  try {
    await retirerPermission(moi.id, agentId, permission);
    revalidatePath("/admin/agents");
    revalidatePath("/admin/agents/permissions");
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreurAutorisation(erreur) };
  }
}

/** Applique le profil d'embauche (raccourci : ajoute les manquantes). */
export async function appliquerProfilAction(agentId: string): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    return { ok: false, erreur: erreurAutorisation(new AutorisationError("NON_AUTORISE", "")) };
  }
  try {
    await appliquerProfilAgent(moi.id, agentId);
    revalidatePath("/admin/agents");
    revalidatePath("/admin/agents/permissions");
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreurAutorisation(erreur) };
  }
}

/** Accorde une permission du socle à tous les agents (y compris futurs). */
export async function accorderSocleAction(permission: string): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    return { ok: false, erreur: erreurAutorisation(new AutorisationError("NON_AUTORISE", "")) };
  }
  try {
    await accorderSocle(moi.id, permission);
    revalidatePath("/admin/agents/permissions");
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreurAutorisation(erreur) };
  }
}

/** Retire une permission du socle (tous les agents la perdent, sauf exception fiche). */
export async function retirerSocleAction(permission: string): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    return { ok: false, erreur: erreurAutorisation(new AutorisationError("NON_AUTORISE", "")) };
  }
  try {
    await retirerSocle(moi.id, permission);
    revalidatePath("/admin/agents/permissions");
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreurAutorisation(erreur) };
  }
}

export type ResultatLotSocle =
  | { ok: true; ajoutees: string[]; retirees: string[] }
  | { ok: false; erreur: string };

/**
 * Préremplit le socle en un seul aller-retour (profil, tout ou rien).
 * Un seul revalidate à la fin au lieu d'un par permission : le lot des 18
 * ne coûte qu'une revalidation et chaque accord/retrait reste journalisé
 * un par un côté serveur.
 */
export async function appliquerSocleLotAction(
  cible: "profil" | "tout" | "rien",
): Promise<ResultatLotSocle> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    return { ok: false, erreur: erreurAutorisation(new AutorisationError("NON_AUTORISE", "")) };
  }
  try {
    const ajoutees: string[] = [];
    const retirees: string[] = [];
    if (cible === "rien") {
      const socle = await listerSocle();
      for (const permission of socle) {
        try {
          await retirerSocle(moi.id, permission);
          retirees.push(permission);
        } catch {
          // Déjà retirée entre-temps : on continue le lot.
        }
      }
    } else {
      const visees = cible === "profil" ? [...PROFIL_AGENT_SERVICE_DEFAUT] : [...PERMISSIONS_FERMEES];
      for (const permission of visees) {
        try {
          await accorderSocle(moi.id, permission);
          ajoutees.push(permission);
        } catch {
          // Déjà au socle : on continue le lot.
        }
      }
    }
    revalidatePath("/admin/agents/permissions");
    return { ok: true, ajoutees, retirees };
  } catch {
    return { ok: false, erreur: "Opération impossible." };
  }
}
