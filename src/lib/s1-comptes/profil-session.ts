import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesStaff,
  estEtatStaff,
  estRoleStaff,
} from "@/lib/db/schema/s1-comptes";
import type { Profil } from "./role-session";

/**
 * Résout la session better-auth en profil. better-auth ignore les tables
 * custom : c'est `comptes_staff` qui dit qui est staff (S1), jamais le type
 * d'identifiant ni une chaîne rangée dans la session.
 *
 * Fail-closed : hors-ligne, BDD indisponible ou ligne illisible, on ne
 * renvoie jamais « staff » à l'aveugle — la porte reste fermée.
 */
export async function profilSession(): Promise<Profil> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return { type: "ANONYME" };

  const comptes = await db
    .select({ role: comptesStaff.role, etat: comptesStaff.etat })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId));
  const compte = comptes[0];

  if (!compte) {
    // Aucune ligne staff : compte client. L'état du compte client
    // (EN_ATTENTE_VALIDATION → /pending) viendra avec la table
    // comptes_clients en S4.
    return { type: "CLIENT" };
  }
  if (!estRoleStaff(compte.role) || !estEtatStaff(compte.etat)) {
    return { type: "INCONNU" };
  }
  return { type: "STAFF", role: compte.role, etat: compte.etat };
}
