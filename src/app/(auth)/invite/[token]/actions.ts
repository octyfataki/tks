"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invitationsAgents } from "@/lib/db/schema/s1-comptes";
import {
  StaffError,
  accepterInvitationAdminPrincipal,
  accepterInvitationAgent,
} from "@/lib/s1-comptes/staff";

// S1-04 + écart assumé (invitation ADMIN_PRINCIPAL) : consommation du jeton
// côté serveur (en ligne). On lit le rôle cible du lien puis on délègue au
// chemin d'acceptation correspondant — chaque chemin vérifie le rôle (un lien
// AGENT ne produit jamais un admin, et inversement). L'idempotence (même
// jeton deux fois = un seul compte) est portée par les fonctions appelées.
// L'acceptation hors-ligne viendra avec S8/outbox.
export async function accepterInvitation(input: {
  jeton: string;
  email: string;
  password: string;
  name: string;
  telephone?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const lignes = await db
      .select({ roleCible: invitationsAgents.roleCible })
      .from(invitationsAgents)
      .where(eq(invitationsAgents.jeton, input.jeton));
    const roleCible = lignes[0]?.roleCible;
    if (roleCible === "ADMIN_PRINCIPAL") {
      await accepterInvitationAdminPrincipal(input);
    } else {
      await accepterInvitationAgent(input);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof StaffError) {
      switch (e.code) {
        case "INVITATION_EXPIREE":
          return { ok: false, message: "lien expiré — demandez-en un nouveau" };
        case "INVITATION_DEJA_CONSOMMEE":
          return { ok: false, message: "lien déjà utilisé" };
        case "INVITATION_INTROUVABLE":
          return { ok: false, message: "lien inconnu" };
        case "NON_AUTORISE":
          return { ok: false, message: "ce lien ne crée pas ce type de compte" };
        case "TELEPHONE_INVALIDE":
          return { ok: false, message: "numéro de téléphone invalide" };
        default:
          return { ok: false, message: "invitation refusée" };
      }
    }
    return { ok: false, message: "invitation refusée" };
  }
}
