"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutInviterAdminPrincipal } from "@/lib/db/schema/accounts";
import {
  ouvrirPremierAccesAdmin,
  revoquerInvitation,
  revoquerPremierAccesAdmin,
  StaffError,
} from "@/lib/accounts/staff";
import type { ResultatAction } from "@/lib/action-result";

export type ResultatRenvoiAcces = ResultatAction<{ lien: string }>;

export type ResultatRevocation = ResultatAction;

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

export async function rouvrirPremierAccesAction(
  _precedent: ResultatRenvoiAcces | null,
  donnees: FormData,
): Promise<ResultatRenvoiAcces> {
  const cibleId = String(donnees.get("cibleId") ?? "").trim();
  if (!cibleId) {
    return { ok: false, erreur: "Compte introuvable." };
  }
  const moi = await staffConnecteAutorise();
  if (!moi) {
    return {
      ok: false,
      erreur:
        "Seul un administrateur technique ou un administrateur principal validé peut renvoyer un lien.",
    };
  }
  try {
    const acces = await ouvrirPremierAccesAdmin(moi.id, cibleId);
    revalidatePath("/admin/invitations");
    return { ok: true, lien: `/first-access/${acces.jeton}` };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: "Renvoi impossible pour ce compte." };
    }
    return { ok: false, erreur: "Renvoi impossible pour ce compte." };
  }
}

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
  const cible = invitationId.trim();
  if (!cible) {
    return { ok: false, erreur: "Lien d'invitation introuvable." };
  }
  try {
    await revoquerInvitation(moi.id, cible);
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
          revalidatePath("/admin/invitations");
          return { ok: true };
        default:
          return { ok: false, erreur: "Révocation impossible." };
      }
    }
    return { ok: false, erreur: "Révocation impossible." };
  }
}

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
  const cible = accesId.trim();
  if (!cible) {
    return { ok: false, erreur: "Lien d'invitation introuvable." };
  }
  try {
    await revoquerPremierAccesAdmin(moi.id, cible);
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
          revalidatePath("/admin/invitations");
          return { ok: true };
        default:
          return { ok: false, erreur: "Révocation impossible." };
      }
    }
    return { ok: false, erreur: "Révocation impossible." };
  }
}
