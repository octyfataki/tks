"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesClients, normaliserTelephoneClient } from "@/lib/db/schema/s1-comptes";
import { lirePlafondClientDefaut } from "@/lib/s1-comptes/reglages";
import type { ResultatAction } from "@/lib/resultat-action";
import { ClientError, inscrireClient } from "@/lib/s1-comptes/clients";
import {
  creerProfilNouvelleBoutique,
  detecterProfilsCorrespondants,
} from "@/lib/s4-clients/inscription";

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

export type ResultatInscription = ResultatAction<{ session: boolean }>;

/**
 * Le profil du shop est créé dans le parcours normal, sans tâche de
 * rattachement séparée. Si une correspondance plausible existe déjà, on ne
 * crée **pas** un second profil : on note le profil à faire confirmer, et la
 * décision appartient à un agent.
 */
async function creerBoutiqueSiNouvelle(input: {
  compteClientId: string;
  name: string;
  telephone: string;
}): Promise<void> {
  const contactTelephone = normaliserTelephoneClient(input.telephone) ?? "";
  const candidats = await detecterProfilsCorrespondants({
    nom: input.name,
    contactTelephone,
  });

  if (candidats.length > 0) {
    await db
      .update(comptesClients)
      .set({ profilCandidatId: candidats[0] })
      .where(eq(comptesClients.id, input.compteClientId));
    return;
  }

  const plafond = await lirePlafondClientDefaut();
  await creerProfilNouvelleBoutique({
    compteClientId: input.compteClientId,
    nom: input.name,
    contactTelephone,
    plafondMontant: plafond.montant,
    plafondDevise: plafond.devise,
    horodatageLocal: new Date(),
  });
}

export async function inscrireCompteClient(input: {
  email: string;
  password: string;
  name: string;
  telephone: string;
}): Promise<ResultatInscription> {
  const parse = SchemaInscription.safeParse(input);
  if (!parse.success) {
    return {
      ok: false,
      erreur: parse.error.issues[0]?.message ?? "inscription refusée",
    };
  }
  try {
    const compte = await inscrireClient(parse.data);
    await creerBoutiqueSiNouvelle({ compteClientId: compte.id, ...parse.data });
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

  try {
    await auth.api.signInEmail({
      body: { email: parse.data.email, password: parse.data.password },
      headers: await headers(),
    });
    return { ok: true, session: true };
  } catch {
    return { ok: true, session: false };
  }
}
