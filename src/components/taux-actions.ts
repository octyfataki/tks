"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/s1-comptes";
import { dateDuJourKinshasa } from "@/lib/db/schema/s3-devises";
import {
  autoriserSaisieTaux,
  definirTauxDuJour,
  lireTauxDuJour,
  TauxError,
} from "@/lib/s3-devises/taux";
import type { ResultatAction } from "@/lib/resultat-action";

export type TauxAffiche = {
  valeur: number;
  dateSaisie: string;
  saisiPar?: string;
};

export type ResultatChargementTaux = ResultatAction<{
  taux: TauxAffiche | null;
  peutSaisir: boolean;
}>;

export type ResultatEnregistrementTaux = ResultatAction<{ taux: TauxAffiche }>;

type CompteCourant = {
  id: string;
  role: string;
  etat: string;
  nom: string;
};

async function compteCourant(): Promise<CompteCourant | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  const utilisateurId = session?.user?.id;
  if (!utilisateurId) return null;
  const lignes = await db
    .select({
      id: comptesStaff.id,
      role: comptesStaff.role,
      etat: comptesStaff.etat,
    })
    .from(comptesStaff)
    .where(eq(comptesStaff.betterAuthUserId, utilisateurId))
    .limit(1);
  const compte = lignes[0];
  if (!compte) return null;
  return { ...compte, nom: session?.user?.name ?? "" };
}

export async function chargerTauxDuJourAction(): Promise<ResultatChargementTaux> {
  try {
    const [taux, compte] = await Promise.all([
      lireTauxDuJour(dateDuJourKinshasa()),
      compteCourant(),
    ]);
    const peutSaisir = compte ? await autoriserSaisieTaux(compte) : false;
    return {
      ok: true,
      taux: taux
        ? {
            valeur: taux.valeur,
            dateSaisie: taux.jour,
            saisiPar: taux.saisiParNom ?? undefined,
          }
        : null,
      peutSaisir,
    };
  } catch {
    return { ok: false, erreur: "Taux du jour indisponible." };
  }
}

function messageTaux(erreur: TauxError): string {
  switch (erreur.code) {
    case "NON_AUTORISE":
      return "Seul un compte autorisé peut saisir le taux du jour.";
    case "VALEUR_INVALIDE":
      return "Saisir un nombre entier de francs, strictement positif, pour 1 USD.";
    case "JOUR_INVALIDE":
      return "Date invalide.";
    case "DEJA_DEFINI":
      return "Un taux existe déjà pour ce jour : une seconde saisie ne remplace jamais la première.";
    case "JOURNAL_INDISPONIBLE":
      return "Enregistrement impossible : journal indisponible.";
  }
}

export async function enregistrerTauxDuJourAction(
  valeur: number,
): Promise<ResultatEnregistrementTaux> {
  const compte = await compteCourant();
  if (!compte) {
    return { ok: false, erreur: "Connexion requise pour saisir le taux." };
  }
  try {
    const resultat = await definirTauxDuJour({
      saisiParId: compte.id,
      valeur,
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/agent", "layout");
    revalidatePath("/clients", "layout");
    return {
      ok: true,
      taux: {
        valeur: resultat.valeur,
        dateSaisie: resultat.jour,
        saisiPar: compte.nom,
      },
    };
  } catch (erreur) {
    if (erreur instanceof TauxError) {
      return { ok: false, erreur: messageTaux(erreur) };
    }
    return { ok: false, erreur: "Enregistrement impossible." };
  }
}
