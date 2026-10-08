"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutInviterAdminPrincipal } from "@/lib/db/schema/s1-comptes";
import {
  ouvrirPremierAccesAdmin,
  revoquerInvitation,
  revoquerPremierAccesAdmin,
  StaffError,
} from "@/lib/s1-comptes/staff";

export type ResultatRenvoiAcces =
  | { ok: true; lien: string }
  | { ok: false; erreur: string };

export type ResultatRevocation =
  | { ok: true }
  | { ok: false; erreur: string };

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

async function staffConnecteAutorise(): Promise<{ id: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id, role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  const moi = lignes[0];
  if (!moi || !peutInviterAdminPrincipal(moi.role, moi.etat)) return null;
  return { id: moi.id };
}

/**
 * Rouvre un lien de premier accès pour un compte administrateur principal
 * dont le lien a expiré (ou a déjà servi). Même autorisation que la
 * création directe (S1 : peutCreerAdminPrincipal) — le contrôle réel est
 * dans ouvrirPremierAccesAdmin. Usage unique, 24 h, choix du mot de
 * passe uniquement, aucune session ouverte.
 */
export async function rouvrirPremierAccesAction(
  _precedent: ResultatRenvoiAcces | null,
  donnees: FormData,
): Promise<ResultatRenvoiAcces> {
  const cibleId = String(donnees.get("cibleId") ?? "").trim();
  if (!cibleId) {
    return { ok: false, erreur: "Compte introuvable." };
  }
  const createurId = await idStaffConnecte();
  if (!createurId) {
    return {
      ok: false,
      erreur:
        "Seul un administrateur technique ou un administrateur principal validé peut renvoyer un lien.",
    };
  }
  try {
    const acces = await ouvrirPremierAccesAdmin(createurId, cibleId);
    revalidatePath("/admin/invitations");
    return { ok: true, lien: `/premier-acces/${acces.jeton}` };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: "Renvoi impossible pour ce compte." };
    }
    return { ok: false, erreur: "Renvoi impossible pour ce compte." };
  }
}

/**
 * Révoque un lien d'invitation administrateur principal encore en attente
 * (voie `lien`). Réservée à un administrateur technique ou un
 * administrateur principal VALIDE (S1 : peutInviterAdminPrincipal — le
 * contrôle réel est dans revoquerInvitation). Idempotente : révoquer deux
 * fois = même état, pas d'erreur. Journalisée (S2 : invitation.revoquer).
 */
export async function revoquerInvitationAdminAction(
  invitationId: string,
): Promise<ResultatRevocation> {
  const moi = await staffConnecteAutorise();
  if (!moi) {
    return {
      ok: false,
      erreur:
        "Seul un administrateur technique ou un administrateur principal validé peut révoquer un lien d'invitation.",
    };
  }
  try {
    await revoquerInvitation(moi.id, invitationId);
    revalidatePath("/admin/invitations");
    return { ok: true };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      switch (erreur.code) {
        case "NON_AUTORISE":
          return {
            ok: false,
            erreur:
              "Seul un administrateur technique ou un administrateur principal validé peut révoquer un lien d'invitation.",
          };
        case "INVITATION_INTROUVABLE":
          return { ok: false, erreur: "Lien d'invitation introuvable." };
        case "INVITATION_DEJA_CONSOMMEE":
          return { ok: false, erreur: "Lien déjà utilisé — rien à révoquer." };
        case "INVITATION_EXPIREE":
          return { ok: false, erreur: "Lien expiré — générez-en un nouveau." };
        case "INVITATION_REVOQUEE":
          // Garde-fou : revoquerInvitation est idempotente et ne jette plus,
          // mais une double révocation reste un succès (même état).
          revalidatePath("/admin/invitations");
          return { ok: true };
        default:
          return { ok: false, erreur: "Révocation impossible." };
      }
    }
    return { ok: false, erreur: "Révocation impossible." };
  }
}

/**
 * Révoque un lien de premier accès (voie `fiche`) encore en attente.
 * Même autorisation que le lien : administrateur technique ou principal
 * VALIDE. Idempotente, journalisée (invitation.revoquer).
 */
export async function revoquerPremierAccesAdminAction(
  accesId: string,
): Promise<ResultatRevocation> {
  const moi = await staffConnecteAutorise();
  if (!moi) {
    return {
      ok: false,
      erreur:
        "Seul un administrateur technique ou un administrateur principal validé peut révoquer un lien d'invitation.",
    };
  }
  try {
    await revoquerPremierAccesAdmin(moi.id, accesId);
    revalidatePath("/admin/invitations");
    return { ok: true };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      switch (erreur.code) {
        case "NON_AUTORISE":
          return {
            ok: false,
            erreur:
              "Seul un administrateur technique ou un administrateur principal validé peut révoquer un lien d'invitation.",
          };
        case "INVITATION_INTROUVABLE":
          return { ok: false, erreur: "Lien d'invitation introuvable." };
        case "INVITATION_DEJA_CONSOMMEE":
          return { ok: false, erreur: "Lien déjà utilisé — rien à révoquer." };
        case "INVITATION_EXPIREE":
          return { ok: false, erreur: "Lien expiré — renvoyez un nouveau lien." };
        case "INVITATION_REVOQUEE":
          revalidatePath("/admin/invitations");
          return { ok: true };
        default:
          return { ok: false, erreur: "Révocation impossible." };
      }
    }
    return { ok: false, erreur: "Révocation impossible." };
  }
}
