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

export async function staffConnecte(): Promise<{ id: string } | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) return null;
  const lignes = await db
    .select({ id: comptesStaff.id })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, userId))
    .limit(1);
  return lignes[0] ?? null;
}

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
