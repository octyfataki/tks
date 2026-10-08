"use server";

import { z } from "zod";
import {
  StaffError,
  definirMotDePassePremierAcces,
} from "@/lib/s1-comptes/staff";

// Validation zod de la frontière (cette page) : jeton présent, mot de passe
// d'au moins 8 caractères. La couche staff revérifie (défense en profondeur).
const SchemaPremierAcces = z.object({
  jeton: z.string().min(1, "lien inconnu"),
  password: z
    .string()
    .min(8, "mot de passe d'au moins 8 caractères exigé"),
});

// Consommation d'un lien de premier accès : définit le mot de passe,
// marque le lien consommé. Usage unique, 24 h — même codes d'échec que
// les invitations, pour des messages homogènes.
export async function choisirMotDePassePremierAcces(input: {
  jeton: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const parse = SchemaPremierAcces.safeParse(input);
  if (!parse.success) {
    return { ok: false, message: parse.error.issues[0]?.message ?? "lien refusé" };
  }
  try {
    await definirMotDePassePremierAcces(parse.data);
    return { ok: true };
  } catch (e) {
    if (e instanceof StaffError) {
      switch (e.code) {
        case "MOT_DE_PASSE_INVALIDE":
          return {
            ok: false,
            message: "mot de passe d'au moins 8 caractères exigé",
          };
        case "INVITATION_EXPIREE":
          return { ok: false, message: "lien expiré — demandez-en un nouveau" };
        case "INVITATION_DEJA_CONSOMMEE":
          return { ok: false, message: "lien déjà utilisé" };
        case "INVITATION_REVOQUEE":
          return { ok: false, message: "lien révoqué — demandez-en un nouveau" };
        case "INVITATION_INTROUVABLE":
          return { ok: false, message: "lien inconnu" };
        case "NON_AUTORISE":
          return { ok: false, message: "ce lien ne peut plus être utilisé" };
        default:
          return { ok: false, message: "lien refusé" };
      }
    }
    return { ok: false, message: "lien refusé" };
  }
}
