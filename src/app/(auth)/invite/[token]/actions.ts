"use server";

import { StaffError, accepterInvitationAgent } from "@/lib/s1-comptes/staff";

// S1-04 : consommation du jeton côté serveur (en ligne). L'idempotence
// (même jeton deux fois = un seul compte) est portée par
// `accepterInvitationAgent`. L'acceptation hors-ligne viendra avec S8/outbox.
export async function accepterInvitation(input: {
  jeton: string;
  email: string;
  password: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await accepterInvitationAgent(input);
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
        default:
          return { ok: false, message: "invitation refusée" };
      }
    }
    return { ok: false, message: "invitation refusée" };
  }
}
