"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { comptesStaff } from "@/lib/db/schema/accounts";
import {
  autoriserSaisieTaux,
  enregistrerTaux,
  lireHistoriqueTaux,
  lireTauxEnVigueur,
  TauxError,
} from "@/lib/currencies/rates";
import type { ResultatAction } from "@/lib/action-result";

export type TauxAffiche = {
  valeur: number;
  depuisLe: string;
  saisiPar?: string;
};

export type TauxHistoriqueAffiche = {
  valeur: number;
  jour: string;
  saisiPar?: string;
};

export type ResultatChargementTaux = ResultatAction<{
  taux: TauxAffiche | null;
  peutSaisir: boolean;
  estClient: boolean;
  historique: TauxHistoriqueAffiche[];
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

function versAffiche(taux: {
  valeur: number;
  jour: string;
  saisiParNom?: string | null;
}): TauxAffiche {
  return {
    valeur: taux.valeur,
    depuisLe: taux.jour,
    saisiPar: taux.saisiParNom ?? undefined,
  };
}

export async function chargerTauxEnVigueurAction(): Promise<ResultatChargementTaux> {
  try {
    const [taux, historique, compte] = await Promise.all([
      lireTauxEnVigueur(),
      lireHistoriqueTaux(10),
      compteCourant(),
    ]);
    const estClient = compte === null;
    const peutSaisir = estClient
      ? false
      : await autoriserSaisieTaux(compte);
    const tauxAffiche = taux ? versAffiche(taux) : null;
    return {
      ok: true,
      taux:
        tauxAffiche && estClient
          ? { ...tauxAffiche, saisiPar: undefined }
          : tauxAffiche,
      peutSaisir,
      estClient,
      historique: estClient
        ? []
        : historique.map((ligne) => ({
            valeur: ligne.valeur,
            jour: ligne.jour,
            saisiPar: ligne.saisiParNom ?? undefined,
          })),
    };
  } catch {
    return { ok: false, erreur: "Taux en vigueur indisponible." };
  }
}

function messageTaux(erreur: TauxError): string {
  switch (erreur.code) {
    case "NON_AUTORISE":
      return "Seul un compte autorisé peut saisir le taux.";
    case "VALEUR_INVALIDE":
      return "Saisir un nombre entier de francs, strictement positif, pour 1 USD.";
    case "JOUR_INVALIDE":
      return "Date invalide.";
    case "INCHANGE":
      return "Ce taux est déjà en vigueur : rien à changer.";
    case "JOURNAL_INDISPONIBLE":
      return "Enregistrement impossible : journal indisponible.";
  }
}

export async function enregistrerTauxAction(
  valeur: number,
): Promise<ResultatEnregistrementTaux> {
  const compte = await compteCourant();
  if (!compte) {
    return { ok: false, erreur: "Connexion requise pour saisir le taux." };
  }
  try {
    const resultat = await enregistrerTaux({
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
        depuisLe: resultat.jour,
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
