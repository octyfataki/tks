"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesStaff,
  peutLeverSuspension,
  peutRevoquerAdmin,
  peutSuspendreAdmin,
} from "@/lib/db/schema/s1-comptes";
import { enregistrerEvenement } from "@/lib/s2-autorisations/journal";
import { tuerSessionsStaff } from "@/lib/s1-comptes/staff";
import type { ResultatAction } from "@/lib/resultat-action";

export type ResultatRevocation = ResultatAction;

/** Codes de présentation locaux des actions sur comptes d'administration. */
type CodeListAction =
  | "NON_AUTORISE"
  | "SOI_MEME"
  | "DERNIER_TECHNIQUE"
  | "DERNIER_PRINCIPAL"
  | "DEJA_REVOQUE"
  | "DEJA_SUSPENDU"
  | "NON_SUSPENDU"
  | "INTROUVABLE";

function messageErreur(code: CodeListAction): string {
  switch (code) {
    case "SOI_MEME":
      return "Vous ne pouvez pas suspendre, lever ni révoquer votre propre compte.";
    case "DERNIER_TECHNIQUE":
      return "Impossible : dernier administrateur technique validé.";
    case "DERNIER_PRINCIPAL":
      return "Impossible : dernier administrateur principal validé.";
    case "DEJA_REVOQUE":
      return "Compte déjà révoqué.";
    case "DEJA_SUSPENDU":
      return "Compte déjà suspendu.";
    case "NON_SUSPENDU":
      return "Compte non suspendu : aucune levée à faire.";
    case "INTROUVABLE":
      return "Compte introuvable.";
    default:
      return "Opération impossible.";
  }
}

/** Nombre de comptes d'un rôle encore VALIDE en dehors de la cible. */
async function nbValidesSauf(
  role: "ADMIN_PRINCIPAL" | "ADMIN_TECHNIQUE",
  saufId: string,
): Promise<number> {
  const autres = await db
    .select({ n: count() })
    .from(comptesStaff)
    .where(
      and(
        eq(comptesStaff.role, role),
        eq(comptesStaff.etat, "VALIDE"),
        ne(comptesStaff.id, saufId),
      ),
    );
  return autres[0]?.n ?? 0;
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
  if (cible.etat !== "VALIDE" && cible.etat !== "SUSPENDU") {
    return { ok: false, erreur: messageErreur("DEJA_REVOQUE") };
  }

  if (cible.role === "ADMIN_TECHNIQUE") {
    if ((await nbValidesSauf("ADMIN_TECHNIQUE", cible.id)) === 0) {
      return { ok: false, erreur: messageErreur("DERNIER_TECHNIQUE") };
    }
  }

  if (cible.role === "ADMIN_PRINCIPAL") {
    if ((await nbValidesSauf("ADMIN_PRINCIPAL", cible.id)) === 0) {
      return { ok: false, erreur: messageErreur("DERNIER_PRINCIPAL") };
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesStaff)
        .set({ etat: "REVOQUE", revokedAt: new Date() })
        .where(eq(comptesStaff.id, cible.id));
      const trace = await enregistrerEvenement(
        {
          acteurId: demandeur.id,
          roleAuMoment: demandeur.role,
          typeAction: "admin.revoquer",
          entite: "compte_staff",
          entiteId: cible.id,
          avant: { etat: cible.etat, role: cible.role },
          apres: { etat: "REVOQUE" },
        },
        tx,
      );
      if (!trace.ok) throw new Error("journal indisponible");
    });
  } catch {
    return { ok: false, erreur: "Révocation impossible." };
  }
  revalidatePath("/admin/list");
  return { ok: true };
}

/**
 * Suspend un compte d'administration (VALIDE → SUSPENDU, réversible).
 * Le compte ne se connecte plus et ses sessions sont tuées aussitôt,
 * mais le retour vers VALIDE existe (lever la suspension) — pour un
 * malentendu, pas pour un départ. Garde-fous : même autorisation que
 * la révocation, jamais soi-même, jamais un compte REVOQUE, jamais le
 * dernier administrateur technique ou principal validé. Écriture
 * tracée (S2, invariant 8).
 */
export async function suspendreAdministrateurAction(
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
  if (!demandeur || !peutSuspendreAdmin(demandeur.role, demandeur.etat)) {
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
      betterAuthUserId: comptesStaff.betterAuthUserId,
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
  if (cible.etat === "REVOQUE") {
    return { ok: false, erreur: messageErreur("DEJA_REVOQUE") };
  }
  if (cible.etat === "SUSPENDU") {
    return { ok: false, erreur: messageErreur("DEJA_SUSPENDU") };
  }

  if ((await nbValidesSauf(cible.role, cible.id)) === 0) {
    return {
      ok: false,
      erreur: messageErreur(
        cible.role === "ADMIN_TECHNIQUE"
          ? "DERNIER_TECHNIQUE"
          : "DERNIER_PRINCIPAL",
      ),
    };
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
          acteurId: demandeur.id,
          roleAuMoment: demandeur.role,
          typeAction: "admin.suspendre",
          entite: "compte_staff",
          entiteId: cible.id,
          avant: { etat: "VALIDE", role: cible.role },
          apres: { etat: "SUSPENDU", suspenduLe },
        },
        tx,
      );
      if (!trace.ok) throw new Error("journal indisponible");
    });
  } catch {
    return { ok: false, erreur: "Suspension impossible." };
  }
  revalidatePath("/admin/list");
  return { ok: true };
}

/**
 * Lève la suspension d'un compte d'administration (SUSPENDU → VALIDE).
 * Même autorisation que suspendre, jamais soi-même : on ne se
 * dé-suspend pas tout seul. Seule une suspension se lève — un compte
 * VALIDE n'a rien à lever, un REVOQUE ne revient jamais. Écriture
 * tracée (S2, invariant 8).
 */
export async function leverSuspensionAdministrateurAction(
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
  if (!demandeur || !peutLeverSuspension(demandeur.role, demandeur.etat)) {
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
  if (cible.etat !== "SUSPENDU") {
    return {
      ok: false,
      erreur: messageErreur(
        cible.etat === "REVOQUE" ? "DEJA_REVOQUE" : "NON_SUSPENDU",
      ),
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(comptesStaff)
        .set({ etat: "VALIDE", suspendedAt: null })
        .where(eq(comptesStaff.id, cible.id));
      const trace = await enregistrerEvenement(
        {
          acteurId: demandeur.id,
          roleAuMoment: demandeur.role,
          typeAction: "admin.lever_suspension",
          entite: "compte_staff",
          entiteId: cible.id,
          avant: { etat: "SUSPENDU", role: cible.role },
          apres: { etat: "VALIDE" },
        },
        tx,
      );
      if (!trace.ok) throw new Error("journal indisponible");
    });
  } catch {
    return { ok: false, erreur: "Levée de suspension impossible." };
  }
  revalidatePath("/admin/list");
  return { ok: true };
}
