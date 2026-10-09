"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import {
  MAX_DUREE_INVITATION_JOURS,
  MIN_DUREE_INVITATION_JOURS,
} from "@/lib/db/schema/s1-comptes";
import { definirReglage } from "@/lib/s1-comptes/reglages";
import { StaffError } from "@/lib/s1-comptes/staff";
import type { ResultatAction } from "@/lib/resultat-action";

export type ResultatDureeInvitation = ResultatAction<{ jours: number }>;

/**
 * Enregistre la durée de validité par défaut d'un lien d'invitation
 * (1–30 jours). Réglage TECHNIQUE : administrateur technique ou principal,
 * toujours VALIDE — le contrôle réel est dans definirReglage, ici on ne
 * fait que résoudre l'auteur depuis la session. Chaque écriture est
 * journalisée (reglage.modifier) dans definirReglage.
 */
export async function enregistrerDureeInvitationAction(
  _precedent: ResultatDureeInvitation | null,
  donnees: FormData,
): Promise<ResultatDureeInvitation> {
  const brut = String(donnees.get("dureeJours") ?? "").trim();
  const nombre = Number(brut);
  if (
    !Number.isInteger(nombre) ||
    nombre < MIN_DUREE_INVITATION_JOURS ||
    nombre > MAX_DUREE_INVITATION_JOURS
  ) {
    return {
      ok: false,
      erreur: `Durée invalide : un entier entre ${MIN_DUREE_INVITATION_JOURS} et ${MAX_DUREE_INVITATION_JOURS} jours.`,
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, erreur: "Session expirée — reconnectez-vous." };
  }
  const lignes = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const moi = lignes[0];
  if (!moi) {
    return { ok: false, erreur: "Session expirée — reconnectez-vous." };
  }

  try {
    const reglage = await definirReglage({
      cle: "duree_invitation_jours",
      valeur: String(nombre),
      modifieParRole: moi.role,
      modifieParEtat: moi.etat,
      modifieParId: moi.id,
    });
    revalidatePath("/admin/parametres");
    revalidatePath("/admin/invites");
    revalidatePath("/admin/administrateurs");
    return { ok: true, jours: Number(reglage.valeur) };
  } catch (erreur) {
    if (erreur instanceof StaffError) {
      if (erreur.code === "NON_AUTORISE") {
        return {
          ok: false,
          erreur:
            "Seul un administrateur validé peut modifier ce réglage.",
        };
      }
      return { ok: false, erreur: "Enregistrement impossible — réessayez." };
    }
    return { ok: false, erreur: "Enregistrement impossible — réessayez." };
  }
}
