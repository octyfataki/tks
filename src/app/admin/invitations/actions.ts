"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { ouvrirPremierAccesAdmin, StaffError } from "@/lib/s1-comptes/staff";

export type ResultatRenvoiAcces =
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
