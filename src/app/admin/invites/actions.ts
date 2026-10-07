"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { creerInvitationAgent, StaffError } from "@/lib/s1-comptes/staff";

export type ResultatInvitationAgent =
  | { ok: true; lien: string }
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

function messageErreur(code: string): string {
  switch (code) {
    case "NON_AUTORISE":
      return "Seul un administrateur principal validé peut inviter un agent de service.";
    default:
      return "Invitation impossible (données invalides).";
  }
}

/**
 * Génère un lien d'invitation AGENT (usage unique, durée limitée).
 * L'agent crée lui-même son compte via /invite/[jeton] : il choisit son
 * email + mot de passe, le rôle AGENT vient du lien. Même autorisation que
 * S1 : seul un administrateur principal VALIDE invite (peutInviterAgent —
 * le contrôle réel est dans creerInvitationAgent).
 */
export async function creerLienInvitationAgentAction(
  _precedent: ResultatInvitationAgent | null,
  donnees: FormData,
): Promise<ResultatInvitationAgent> {
  const dureeJours = Math.min(
    Math.max(Number(donnees.get("dureeJours") ?? 7) || 7, 1),
    30,
  );

  const createurId = await idStaffConnecte();
  if (!createurId) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }

  try {
    const invitation = await creerInvitationAgent(createurId, { dureeJours });
    revalidatePath("/admin/invites");
    return { ok: true, lien: `/invite/${invitation.jeton}` };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      return { ok: false, erreur: messageErreur(erreur.code) };
    }
    return { ok: false, erreur: messageErreur("INCONNU") };
  }
}
