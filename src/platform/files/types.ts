/**
 * P0b — Les fichiers déposés : le vocabulaire.
 *
 * Un fichier déposé n'est pas « une image » ou « une pièce ». C'est **un
 * fichier, d'une catégorie, avec une clé**. Tout le reste — où il atterrit,
 * qui peut le lire, dans quel format — se décide ailleurs.
 *
 * Le mot `cle` est volontaire. Une clé n'est ni un chemin, ni une URL, ni un
 * nom de fichier. C'est une référence opaque que le module sait traduire. Une
 * clé qui trahit son emplacement est une clé qui fige l'emplacement.
 */

/** Les catégories de fichiers déposés. La liste est fermée, comme les permissions. */
export const CATEGORIES = ["avatar", "piece_identite", "preuve_paiement"] as const;

export type CategorieFichier = (typeof CATEGORIES)[number];

/** Ce que l'appelant fournit : un nom, un type déclaré, des octets. */
export type ContenuFichier = {
  /** Le nom d'origine, informatif. Jamais utilisé pour construire un chemin. */
  nom: string;
  /** Le type MIME déclaré par le client. Vérifié, jamais cru. */
  mime: string;
  octets: Uint8Array;
};

/** Ce que le module rend : une clé, et de quoi la présenter. */
export type FichierDepose = {
  /** La référence opaque, ex. `piece-identite/<uuid>.jpg`. Jamais absolue. */
  cle: string;
  categorie: CategorieFichier;
  /** Le nom d'origine, conservé pour l'affichage. */
  nom: string;
  /** Le type réellement constaté, pas celui qui était déclaré. */
  mime: string;
  tailleOctets: number;
};

/** Un fichier relu, prêt à être servi. */
export type FichierLu = {
  octets: Uint8Array;
  mime: string;
};

/** Refus d'un fichier. Chaque motif a son propre code, pour un message utile. */
export type ErreurFichier =
  | "CATEGORIE_INCONNUE"
  | "TYPE_REFUSE"
  | "TROP_GROS"
  | "CLE_INVALIDE"
  | "FICHIER_ABSENT"
  | "STOCKAGE_INDISPONIBLE";

export class FichierError extends Error {
  code: ErreurFichier;
  constructor(code: ErreurFichier, message: string) {
    super(message);
    this.code = code;
  }
}

/** La catégorie est-elle connue ? Une catégorie inventée ne passe pas. */
export function categorieConnue(categorie: string): categorie is CategorieFichier {
  return (CATEGORIES as readonly string[]).includes(categorie);
}
