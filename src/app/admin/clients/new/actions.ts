"use server";

import { revalidatePath } from "next/cache";
import type { ResultatAction } from "@/lib/resultat-action";
import { DossierError, creerDossier, type DossierResume } from "@/modules/clients/depot";

export type ResultatOuverture = ResultatAction<{
  dossierId: string;
  nom: string;
  contact: string;
  adresse: string;
  partagentContact: DossierResume[];
}>;

function lireChamp(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

/**
 * Ouvre un dossier client depuis le comptoir. La porte (`dossier.creer`,
 * jamais un client) et le journal vivent dans le module — ici on ne fait
 * que traduire le formulaire et revalider le registre.
 */
export async function ouvrirDossierAction(
  _precedent: ResultatOuverture | null,
  donnees: FormData,
): Promise<ResultatOuverture> {
  try {
    const dossier = await creerDossier({
      nom: lireChamp(donnees, "nom"),
      contact: lireChamp(donnees, "contact"),
      adresse: lireChamp(donnees, "adresse"),
    });
    revalidatePath("/admin/clients");
    return {
      ok: true,
      dossierId: dossier.id,
      nom: dossier.nom,
      contact: dossier.contact,
      adresse: dossier.adresse,
      partagentContact: dossier.partagentContact,
    };
  } catch (erreur) {
    if (erreur instanceof DossierError) {
      return { ok: false, erreur: erreur.message };
    }
    throw erreur;
  }
}
