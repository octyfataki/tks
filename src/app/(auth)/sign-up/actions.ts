"use server";

import { z } from "zod";
import type { ResultatAction } from "@/lib/resultat-action";
import { ClientError, inscrireClient } from "@/lib/s1-comptes/clients";

// Validation zod de la frontière (cette action) : mêmes seuils que la
// couche clients (défense en profondeur) — email normalisé, téléphone
// exigé, mot de passe d'au moins 8 caractères, nom exigé.
const SchemaInscription = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "adresse email invalide")
    .max(255, "adresse email invalide")
    .refine((valeur) => valeur.includes("@"), "adresse email invalide"),
  password: z.string().min(8, "mot de passe d'au moins 8 caractères exigé"),
  name: z.string().trim().min(2, "nom exigé").max(255, "nom exigé"),
  telephone: z.string().trim().min(1, "numéro de téléphone exigé"),
});

// S1-01 : inscription publique d'un client. Le compte créé est
// EN_ATTENTE_VALIDATION — il ne peut rien faire tant qu'un humain ne l'a
// pas validé sur pièce d'identité (S1-03). Aucune session n'est ouverte
// ici : le client se connecte ensuite et atterrit sur /pending.
// L'inscription hors-ligne viendra avec S8/outbox.
export async function inscrireCompteClient(input: {
  email: string;
  password: string;
  name: string;
  telephone: string;
}): Promise<ResultatAction> {
  const parse = SchemaInscription.safeParse(input);
  if (!parse.success) {
    return {
      ok: false,
      erreur: parse.error.issues[0]?.message ?? "inscription refusée",
    };
  }
  try {
    await inscrireClient(parse.data);
    return { ok: true };
  } catch (e) {
    if (e instanceof ClientError) {
      switch (e.code) {
        case "EMAIL_DEJA_UTILISE":
          return { ok: false, erreur: "un compte existe déjà avec cet email" };
        case "TELEPHONE_DEJA_UTILISE":
          return {
            ok: false,
            erreur: "un compte existe déjà avec ce numéro",
          };
        case "EMAIL_INVALIDE":
          return { ok: false, erreur: "adresse email invalide" };
        case "TELEPHONE_INVALIDE":
          return { ok: false, erreur: "numéro de téléphone invalide" };
        case "MOT_DE_PASSE_INVALIDE":
          return {
            ok: false,
            erreur: "mot de passe d'au moins 8 caractères exigé",
          };
        case "NOM_INVALIDE":
          return { ok: false, erreur: "nom exigé" };
        case "JOURNAL_INDISPONIBLE":
          return { ok: false, erreur: "inscription impossible pour le moment" };
        default:
          return { ok: false, erreur: "inscription refusée" };
      }
    }
    return { ok: false, erreur: "inscription refusée" };
  }
}
