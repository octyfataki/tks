import { randomUUID } from "node:crypto";
import { normaliserTelephoneClient } from "@/lib/db/schema/comptes";

// Module clients — domaine pur du dossier financier. Aucune base ici :
// préparer, valider, chercher en mémoire. La persistance vit dans
// `depot.ts`, seul fichier du module qui touche la base.
//
// Couplage transitoire assumé : la normalisation du contact réutilise
// `normaliserTelephoneClient` (S1). P5 la déplacera vers le socle avec le
// reste des règles partagées — une seule source de vérité d'ici là, pas
// de copie.

export const NOM_MIN = 2;
export const NOM_MAX = 255;
export const ADRESSE_MIN = 2;
export const ADRESSE_MAX = 500;

export type ErreurDossier =
  | "NOM_INVALIDE"
  | "CONTACT_INVALIDE"
  | "ADRESSE_INVALIDE"
  | "NON_AUTORISE"
  | "JOURNAL_INDISPONIBLE";

export class DossierError extends Error {
  code: ErreurDossier;
  constructor(code: ErreurDossier, message: string) {
    super(message);
    this.code = code;
  }
}

export type CreationDossier = {
  nom: string;
  contact: string;
  adresse: string;
  /** Identifiant généré sur l'appareil (file hors-ligne) ; défaut = UUID serveur. */
  id?: string;
};

export type DossierPrepare = {
  id: string;
  nom: string;
  contact: string;
  adresse: string;
  horodatageLocal: Date;
};

/**
 * Valide et canonise une ouverture de dossier. Le nom reste libre et non
 * unique ; le contact est normalisé en forme internationale et peut déjà
 * exister sur d'autres dossiers — c'est accepté, jamais fusionné.
 */
export function preparerCreationDossier(entree: CreationDossier): DossierPrepare {
  const nom = entree.nom.trim();
  if (nom.length < NOM_MIN || nom.length > NOM_MAX) {
    throw new DossierError("NOM_INVALIDE", "Nom exigé : 2 à 255 caractères.");
  }
  const contact = normaliserTelephoneClient(entree.contact);
  if (!contact) {
    throw new DossierError(
      "CONTACT_INVALIDE",
      "Numéro de contact invalide : format international attendu.",
    );
  }
  const adresse = entree.adresse.trim();
  if (adresse.length < ADRESSE_MIN || adresse.length > ADRESSE_MAX) {
    throw new DossierError(
      "ADRESSE_INVALIDE",
      "Adresse exigée : 2 à 500 caractères, texte libre.",
    );
  }
  return {
    id: entree.id ?? randomUUID(),
    nom,
    contact,
    adresse,
    horodatageLocal: new Date(),
  };
}

export type DossierResume = {
  id: string;
  nom: string;
  contact: string;
  adresse: string;
};

/**
 * Recherche en mémoire : chaque terme (insensible à la casse) doit
 * apparaître dans le nom, le contact ou l'adresse. Plusieurs champs à la
 * fois, pour retrouver un dossier dont on a mal retenu le nom. Ne retient
 * jamais un dossier automatiquement : l'appelant affiche, l'humain choisit.
 */
export function dossierCorrespond(dossier: DossierResume, recherche: string): boolean {
  const termes = recherche.toLowerCase().split(/\s+/).filter(Boolean);
  if (termes.length === 0) return true;
  const cible = `${dossier.nom} ${dossier.contact} ${dossier.adresse}`.toLowerCase();
  return termes.every((terme) => cible.includes(terme));
}

/** Échappe les jokers d'un LIKE (`%`, `_`, `\`). */
export function echapperLike(terme: string): string {
  return terme.replace(/[\\%_]/g, (lettre) => `\\${lettre}`);
}
