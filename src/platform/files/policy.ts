import type { CategorieFichier } from "./types";

/**
 * P0b — La politique de fichiers, en un seul endroit.
 *
 * Avant ce fichier, il existait **deux** règles indépendantes pour la même
 * question « ce fichier est-il acceptable ? » : `photoProfilValide`, dans
 * `components/profile/`, et `verdictFichierPiece`, dans
 * `lib/comptes/pieces-fichiers.ts`. Elles vivaient à deux étages du code,
 * et rien ne disait laquelle faisait foi. Ici, il y en a une.
 *
 * Les valeurs ne sont pas inventées : ce sont celles qui tournent déjà en
 * production. Rien n'est resserré, rien n'est relâché. Une catégorie qui
 * n'est pas dans ce tableau n'a pas de politique, donc n'est pas acceptée.
 */

/** Ce qu'on accepte pour un type donné. */
export type RegleFormat = {
  /** Les extensions de nom admises pour ce type. */
  extensions: readonly string[];
  /** La taille maximale en octets. */
  tailleMax: number;
};

/** Ce que devient le fichier après validation. */
export type RegleSortie =
  /** On garde le format d'origine, extension comprise. */
  | { mode: "conserver" }
  /**
   * Tout est réencodé dans un format unique. `sauf` épargne certains types —
   * un avatar SVG reste SVG, tout le reste devient JPEG.
   */
  | { mode: "reencoder"; mime: string; extension: string; sauf: readonly string[] };

export type RegleCategorie = {
  /** Les types acceptés, par MIME. Une clé absente = type refusé. */
  formats: Record<string, RegleFormat>;
  sortie: RegleSortie;
  /**
   * Faut-il vérifier que l'extension du nom correspond au type ? Vrai quand
   * l'appelant fournit un nom de fichier, faux quand il fournit un dataURL
   * qui n'en a pas.
   */
  verifierExtension: boolean;
  /** Le dossier logique où ranger les clés. Jamais un chemin d'écriture. */
  dossier: string;
};

/** Les plafonds historiques, conservés tels quels. */
export const TAILLE_MAX_AVATAR_OCTETS = 400 * 1024;
export const TAILLE_MAX_IMAGE_PIECE_OCTETS = 3 * 1024 * 1024;
export const TAILLE_MAX_PDF_PIECE_OCTETS = 5 * 1024 * 1024;

const PIECES_IMAGE: RegleFormat = {
  extensions: ["jpg", "jpeg", "png", "webp"],
  tailleMax: TAILLE_MAX_IMAGE_PIECE_OCTETS,
};

export const POLITIQUE: Record<CategorieFichier, RegleCategorie> = {
  /**
   * Avatar : déjà compressé côté client, plafonné à 400 Ko. Le serveur
   * réencode en 256 px JPEG pour garantir le gabarit — sauf les
   * illustrations de la galerie, qui sont du SVG et restent du SVG.
   */
  avatar: {
    formats: {
      "image/jpeg": { extensions: ["jpg", "jpeg"], tailleMax: TAILLE_MAX_AVATAR_OCTETS },
      "image/png": { extensions: ["png"], tailleMax: TAILLE_MAX_AVATAR_OCTETS },
      "image/webp": { extensions: ["webp"], tailleMax: TAILLE_MAX_AVATAR_OCTETS },
      "image/svg+xml": { extensions: ["svg"], tailleMax: TAILLE_MAX_AVATAR_OCTETS },
    },
    sortie: {
      mode: "reencoder",
      mime: "image/jpeg",
      extension: "jpg",
      sauf: ["image/svg+xml"],
    },
    verifierExtension: false,
    dossier: "avatar",
  },

  /** Pièce d'identité : image jusqu'à 3 Mo, PDF jusqu'à 5 Mo, format conservé. */
  piece_identite: {
    formats: {
      "image/jpeg": PIECES_IMAGE,
      "image/png": { extensions: ["png"], tailleMax: TAILLE_MAX_IMAGE_PIECE_OCTETS },
      "image/webp": { extensions: ["webp"], tailleMax: TAILLE_MAX_IMAGE_PIECE_OCTETS },
      "application/pdf": { extensions: ["pdf"], tailleMax: TAILLE_MAX_PDF_PIECE_OCTETS },
    },
    sortie: { mode: "conserver" },
    verifierExtension: true,
    dossier: "piece-identite",
  },

  /**
   * Preuve de paiement : jamais bloquante, toujours compressée côté client
   * avant envoi (ADR-0006, S5-T3). La politique est posée ici avant que S5
   * n'existe, pour que S5 n'invente pas une quatrième façon de déposer.
   */
  preuve_paiement: {
    formats: {
      "image/jpeg": { extensions: ["jpg", "jpeg"], tailleMax: 2 * 1024 * 1024 },
      "image/png": { extensions: ["png"], tailleMax: 2 * 1024 * 1024 },
      "image/webp": { extensions: ["webp"], tailleMax: 2 * 1024 * 1024 },
      "application/pdf": { extensions: ["pdf"], tailleMax: 2 * 1024 * 1024 },
    },
    sortie: { mode: "conserver" },
    verifierExtension: true,
    dossier: "preuve-paiement",
  },
};

/** La politique d'une catégorie, ou `null` si la catégorie n'existe pas. */
export function politiqueDe(categorie: string): RegleCategorie | null {
  return (POLITIQUE as Record<string, RegleCategorie>)[categorie] ?? null;
}
