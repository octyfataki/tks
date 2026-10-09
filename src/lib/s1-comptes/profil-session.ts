import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  comptesClients,
  comptesStaff,
  estEtatClient,
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
    // Aucune ligne staff : compte client. L'état est lu dans
    // comptes_clients (S1-01) : EN_ATTENTE_VALIDATION → /pending, aucun
    // espace. Utilisateur sans ligne métier d'aucune sorte : INCONNU,
    // fail-closed — on ne devine jamais un espace à l'aveugle.
    const clients = await db
      .select({ etat: comptesClients.etat })
      .from(comptesClients)
      .where(eq(comptesClients.betterAuthUserId, userId));
    const client = clients[0];
    if (!client || !estEtatClient(client.etat)) return { type: "INCONNU" };
    return { type: "CLIENT", etat: client.etat };
  }
  if (!estRoleStaff(compte.role) || !estEtatStaff(compte.etat)) {
    return { type: "INCONNU" };
  }
  return { type: "STAFF", role: compte.role, etat: compte.etat };
}
