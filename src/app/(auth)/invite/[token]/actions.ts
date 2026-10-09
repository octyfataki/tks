"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { invitationsAgents } from "@/lib/db/schema/s1-comptes";
import type { ResultatAction } from "@/lib/resultat-action";
import {
  StaffError,
  accepterInvitationAdminPrincipal,
  accepterInvitationAgent,
} from "@/lib/s1-comptes/staff";

// Validation zod de la frontière (cette action) : mêmes seuils que la
// couche staff (défense en profondeur) — email normalisé, mot de passe
// d'au moins 8 caractères, nom exigé.
const SchemaAcceptation = z.object({
  jeton: z.string().min(1, "lien inconnu"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "adresse email invalide")
    .max(255, "adresse email invalide")
    .refine((valeur) => valeur.includes("@"), "adresse email invalide"),
  password: z.string().min(8, "mot de passe d'au moins 8 caractères exigé"),
  name: z.string().trim().min(2, "nom exigé"),
  telephone: z.string().optional(),
});

// S1-04 + écart assumé (invitation ADMIN_PRINCIPAL) : consommation du jeton
// côté serveur (en ligne). On lit le rôle cible du lien puis on délègue au
// chemin d'acceptation correspondant — chaque chemin vérifie le rôle (un lien
// AGENT ne produit jamais un admin, et inversement). Usage unique : rejouer
// le même jeton est refusé explicitement, jamais de double compte
// (transaction). L'acceptation hors-ligne viendra avec S8/outbox.
export async function accepterInvitation(input: {
  jeton: string;
  email: string;
  password: string;
  name: string;
  telephone?: string;
}): Promise<ResultatAction> {
  const parse = SchemaAcceptation.safeParse(input);
  if (!parse.success) {
    return { ok: false, erreur: parse.error.issues[0]?.message ?? "invitation refusée" };
  }
  const donnees = parse.data;
  try {
    const lignes = await db
      .select({ roleCible: invitationsAgents.roleCible })
      .from(invitationsAgents)
      .where(eq(invitationsAgents.jeton, donnees.jeton));
    const roleCible = lignes[0]?.roleCible;
    if (roleCible === "ADMIN_PRINCIPAL") {
      await accepterInvitationAdminPrincipal(donnees);
    } else {
      await accepterInvitationAgent(donnees);
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof StaffError) {
      switch (e.code) {
        case "INVITATION_EXPIREE":
          return { ok: false, erreur: "lien expiré — demandez-en un nouveau" };
        case "INVITATION_DEJA_CONSOMMEE":
          return { ok: false, erreur: "lien déjà utilisé" };
        case "INVITATION_REVOQUEE":
          return { ok: false, erreur: "lien révoqué — demandez-en un nouveau" };
        case "INVITATION_INTROUVABLE":
          return { ok: false, erreur: "lien inconnu" };
        case "NON_AUTORISE":
          return { ok: false, erreur: "ce lien ne crée pas ce type de compte" };
        case "EMAIL_DEJA_UTILISE":
          return { ok: false, erreur: "un compte existe déjà avec cet email" };
        case "EMAIL_INVALIDE":
          return { ok: false, erreur: "adresse email invalide" };
        case "MOT_DE_PASSE_INVALIDE":
          return { ok: false, erreur: "mot de passe d'au moins 8 caractères exigé" };
        case "TELEPHONE_INVALIDE":
          return { ok: false, erreur: "numéro de téléphone invalide" };
        default:
          return { ok: false, erreur: "invitation refusée" };
      }
    }
    return { ok: false, erreur: "invitation refusée" };
  }
}
