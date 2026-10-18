"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import { creerInvitationAgent, StaffError } from "@/lib/accounts/staff";
import type { ErreurStaff } from "@/lib/accounts/staff";
import type { ResultatAction } from "@/lib/action-result";

export type ResultatInvitationAgent = ResultatAction<{ lien: string }>;

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

function messageErreur(code: ErreurStaff): string {
  switch (code) {
    case "NON_AUTORISE":
      return "Seul un administrateur principal validé peut inviter un agent de service.";
    default:
      return "Invitation impossible (données invalides).";
  }
}

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
    return { ok: false, erreur: "Invitation impossible (données invalides)." };
  }
}
