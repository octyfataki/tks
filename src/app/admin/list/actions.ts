"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff, peutRevoquerAdmin } from "@/lib/db/schema/s1-comptes";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";

export type ResultatRevocation =
  | { ok: true }
  | { ok: false; erreur: string };

function messageErreur(code: string): string {
  switch (code) {
    case "SOI_MEME":
      return "Vous ne pouvez pas révoquer votre propre compte.";
    case "DERNIER_TECHNIQUE":
      return "Impossible : dernier administrateur technique validé.";
    case "DEJA_REVOQUE":
      return "Compte déjà révoqué.";
    case "INTROUVABLE":
      return "Compte introuvable.";
    default:
      return "Révocation impossible.";
  }
}

/**
 * Révoque un compte d'administration (VALIDE → REVOQUE, définitif :
 * REVOQUE = inutilisable, aucun retour — rouvrir un accès passe par
 * révocation + recréation, S2). Garde-fous : même autorisation que la
 * création, jamais soi-même, jamais le dernier administrateur
 * technique validé. Écriture tracée à brancher au journal S2.
 */
export async function revoquerAdministrateurAction(
  id: string,
): Promise<ResultatRevocation> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return { ok: false, erreur: messageErreur("NON_AUTORISE") };

  const demandeurs = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  const demandeur = demandeurs[0];
  if (!demandeur || !peutRevoquerAdmin(demandeur.role, demandeur.etat)) {
    return { ok: false, erreur: messageErreur("NON_AUTORISE") };
  }
  if (demandeur.id === id) {
    return { ok: false, erreur: messageErreur("SOI_MEME") };
  }

  const cibles = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.id, id))
    .limit(1);
  const cible = cibles[0];
  if (
    !cible ||
    (cible.role !== "ADMIN_PRINCIPAL" && cible.role !== "ADMIN_TECHNIQUE")
  ) {
    return { ok: false, erreur: messageErreur("INTROUVABLE") };
  }
  if (cible.etat !== "VALIDE") {
    return { ok: false, erreur: messageErreur("DEJA_REVOQUE") };
  }

  if (cible.role === "ADMIN_TECHNIQUE") {
    const autres = await db
      .select({ n: count() })
      .from(comptesStaff)
      .where(
        and(
          eq(comptesStaff.role, "ADMIN_TECHNIQUE"),
          eq(comptesStaff.etat, "VALIDE"),
          ne(comptesStaff.id, cible.id),
        ),
      );
    if ((autres[0]?.n ?? 0) === 0) {
      return { ok: false, erreur: messageErreur("DERNIER_TECHNIQUE") };
    }
  }

  await db
    .update(comptesStaff)
    .set({ etat: "REVOQUE", revokedAt: new Date() })
    .where(eq(comptesStaff.id, cible.id));
  await enregistrerEvenement({
    acteurId: demandeur.id,
    roleAuMoment: demandeur.role,
    typeAction: "admin.revoquer",
    entite: "compte_staff",
    entiteId: cible.id,
    avant: { etat: "VALIDE", role: cible.role },
    apres: { etat: "REVOQUE" },
  });
  revalidatePath("/admin/list");
  return { ok: true };
}
