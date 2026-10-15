"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutInviterAgent, telephoneStaffValide } from "@/lib/db/schema/s1-comptes";
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
import {
  enregistrerEvenement,
  journaliserRefusContestation,
  ERREUR_CONTESTEE_INTROUVABLE,
} from "@/lib/s2-autorisations/journal";
import type { ResultatAction as ResultatStandard } from "@/lib/resultat-action";
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

export type ResultatAction = ResultatStandard<{
  lien?: string;
  email?: string;
}>;

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
  if (!telephoneStaffValide(telephone)) {
    return { ok: false, erreur: "Numéro de téléphone invalide (format international : + optionnel, chiffres, espaces, tirets, points, parenthèses)." };
  }
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
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
      return { ok: false, erreur: "Numéro de téléphone invalide (format international : + optionnel, chiffres, espaces, tirets, points, parenthèses)." };
    }
    if (erreur instanceof StaffError && erreur.code === "MOT_DE_PASSE_INVALIDE") {
      return { ok: false, erreur: "Mot de passe d'au moins 8 caractères exigé." };
    }
    if (erreur instanceof StaffError && erreur.code === "EMAIL_DEJA_UTILISE") {
      return { ok: false, erreur: "Cet identifiant (email) est déjà utilisé — chaque agent a son propre email." };
    }
    if (erreur instanceof StaffError && erreur.code === "EMAIL_INVALIDE") {
      return { ok: false, erreur: "Adresse email invalide." };
    }
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: "Seul un administrateur principal validé peut créer un agent." };
    }
    console.error("[creerAgentAction] échec création agent", erreur);
    return { ok: false, erreur: "Création impossible (identifiant déjà utilisé ou données invalides)." };
  }
}

export async function revoquerAgentAction(
  id: string,
  contesteId?: string | null,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    const erreur = "Seul un administrateur principal validé peut révoquer un agent.";
    if (contesteId) {
      await journaliserRefusContestation({
        acteurId: moi?.id ?? null,
        roleAuMoment: moi?.role ?? "INCONNU",
        typeAction: "agent.revoquer",
        entite: "compte_staff",
        entiteId: id,
        motif: erreur,
        contesteId,
      });
    }
    return { ok: false, erreur };
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
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesStaff)
        .set({ etat: "REVOQUE", revokedAt: new Date() })
        .where(eq(comptesStaff.id, cible.id));
      const trace = await enregistrerEvenement(
        {
          acteurId: moi.id,
          roleAuMoment: moi.role,
          typeAction: "agent.revoquer",
          entite: "compte_staff",
          entiteId: cible.id,
          avant: { etat: cible.etat },
          apres: { etat: "REVOQUE" },
          contesteId: contesteId ?? null,
        },
        tx,
      );
      if (!trace.ok) throw new Error(trace.erreur);
    });
  } catch (erreur) {
    if (
      erreur instanceof Error &&
      erreur.message === ERREUR_CONTESTEE_INTROUVABLE
    ) {
      return { ok: false, erreur: ERREUR_CONTESTEE_INTROUVABLE };
    }
    return { ok: false, erreur: "Révocation impossible." };
  }
  revalidatePath("/admin/agents");
  return { ok: true };
}

export async function suspendreAgentAction(
  id: string,
  contesteId?: string | null,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    const erreur = "Seul un administrateur principal validé peut suspendre un agent.";
    if (contesteId) {
      await journaliserRefusContestation({
        acteurId: moi?.id ?? null,
        roleAuMoment: moi?.role ?? "INCONNU",
        typeAction: "agent.suspendre",
        entite: "compte_staff",
        entiteId: id,
        motif: erreur,
        contesteId,
      });
    }
    return { ok: false, erreur };
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
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesStaff)
        .set({ etat: "SUSPENDU", suspendedAt: suspenduLe })
        .where(eq(comptesStaff.id, cible.id));
      await tuerSessionsStaff(cible.betterAuthUserId, tx);
      const trace = await enregistrerEvenement(
        {
          acteurId: moi.id,
          roleAuMoment: moi.role,
          typeAction: "agent.suspendre",
          entite: "compte_staff",
          entiteId: cible.id,
          avant: { etat: "VALIDE" },
          apres: { etat: "SUSPENDU", suspenduLe },
          contesteId: contesteId ?? null,
        },
        tx,
      );
      if (!trace.ok) throw new Error(trace.erreur);
    });
  } catch (erreur) {
    if (
      erreur instanceof Error &&
      erreur.message === ERREUR_CONTESTEE_INTROUVABLE
    ) {
      return { ok: false, erreur: ERREUR_CONTESTEE_INTROUVABLE };
    }
    return { ok: false, erreur: "Suspension impossible." };
  }
  revalidatePath("/admin/agents");
  return { ok: true };
}

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
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesStaff)
        .set({ etat: "VALIDE", suspendedAt: null })
        .where(eq(comptesStaff.id, cible.id));
      const trace = await enregistrerEvenement(
        {
          acteurId: moi.id,
          roleAuMoment: moi.role,
          typeAction: "agent.lever_suspension",
          entite: "compte_staff",
          entiteId: cible.id,
          avant: { etat: "SUSPENDU" },
          apres: { etat: "VALIDE" },
        },
        tx,
      );
      if (!trace.ok) throw new Error("journal indisponible");
    });
  } catch {
    return { ok: false, erreur: "Levée de suspension impossible." };
  }
  revalidatePath("/admin/agents");
  return { ok: true };
}

export async function creerInvitationAgentAction(): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
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

export async function revoquerInvitationAgentAction(
  invitationId: string,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutInviterAgent(moi.role, moi.etat)) {
    return { ok: false, erreur: "Seul un administrateur principal validé peut révoquer une invitation." };
  }
  const cible = invitationId.trim();
  if (!cible) {
    return { ok: false, erreur: "Invitation introuvable." };
  }
  try {
    await revoquerInvitation(moi.id, cible);
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
      case "JOURNAL_INDISPONIBLE":
        return "Opération impossible : journal d'audit indisponible.";
      case "CONTESTEE_INTROUVABLE":
        return "Ligne contestée introuvable — la correction est refusée.";
      default: {
        const _exhaustif: never = erreur.code;
        return _exhaustif;
      }
    }
  }
  return "Opération impossible.";
}

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

export async function retirerPermissionAction(
  agentId: string,
  permission: string,
  contesteId?: string | null,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    const erreur = erreurAutorisation(new AutorisationError("NON_AUTORISE", ""));
    if (contesteId) {
      await journaliserRefusContestation({
        acteurId: moi?.id ?? null,
        roleAuMoment: moi?.role ?? "INCONNU",
        typeAction: "permission.retirer",
        entite: "permission",
        entiteId: `${agentId}:${permission}`,
        motif: erreur,
        contesteId,
      });
    }
    return { ok: false, erreur };
  }
  try {
    await retirerPermission(moi.id, agentId, permission, { contesteId });
    revalidatePath("/admin/agents");
    revalidatePath("/admin/agents/permissions");
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreurAutorisation(erreur) };
  }
}

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

export async function retirerSocleAction(
  permission: string,
  contesteId?: string | null,
): Promise<ResultatAction> {
  const moi = await staffConnecte();
  if (!moi || !peutGererPermissions(moi.role, moi.etat)) {
    const erreur = erreurAutorisation(new AutorisationError("NON_AUTORISE", ""));
    if (contesteId) {
      await journaliserRefusContestation({
        acteurId: moi?.id ?? null,
        roleAuMoment: moi?.role ?? "INCONNU",
        typeAction: "permission.socle.retirer",
        entite: "permission_socle",
        entiteId: permission,
        motif: erreur,
        contesteId,
      });
    }
    return { ok: false, erreur };
  }
  try {
    await retirerSocle(moi.id, permission, { contesteId });
    revalidatePath("/admin/agents/permissions");
    return { ok: true };
  } catch (erreur) {
    return { ok: false, erreur: erreurAutorisation(erreur) };
  }
}

export type ResultatLotSocle =
  | { ok: true; ajoutees: string[]; retirees: string[] }
  | { ok: false; erreur: string };

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
        } catch (erreur) {
          if (erreur instanceof AutorisationError && erreur.code === "NON_ACCORDEE") {
            continue;
          }
          throw erreur;
        }
      }
    } else {
      const visees = cible === "profil" ? [...PROFIL_AGENT_SERVICE_DEFAUT] : [...PERMISSIONS_FERMEES];
      for (const permission of visees) {
        try {
          await accorderSocle(moi.id, permission);
          ajoutees.push(permission);
        } catch (erreur) {
          if (erreur instanceof AutorisationError && erreur.code === "DEJA_ACCORDEE") {
            continue;
          }
          throw erreur;
        }
      }
    }
    revalidatePath("/admin/agents/permissions");
    return { ok: true, ajoutees, retirees };
  } catch {
    return { ok: false, erreur: "Opération impossible." };
  }
}
