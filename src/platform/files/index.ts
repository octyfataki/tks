import { randomUUID } from "node:crypto";

import { politiqueDe, POLITIQUE } from "./policy";
import { stockage, type PiloteStockage } from "./storage";
import {
  categorieConnue,
  FichierError,
  type CategorieFichier,
  type ContenuFichier,
  type FichierDepose,
  type FichierLu,
} from "./types";

/**
 * P0b — Le point d'entrée unique des fichiers déposés.
 *
 * Quatre opérations, et rien d'autre : `enregistrer`, `lire`, `supprimer`,
 * plus le contrôle de validité d'une clé. Un appelant qui dépose un fichier
 * passe par là ; il ne connaît ni le dossier, ni le disque, ni la politique.
 *
 * Ce que la fonction **ne** fait pas : elle ne décide pas qui a le droit de
 * lire. C'est la route qui répond à cette question, parce qu'elle seule sait
 * qui demande. Ici, on ne s'occupe que des octets.
 */

/** Index inverse : dossier + extension → MIME, pour relire sans stocker le type deux fois. */
const MIME_PAR_CLE: Record<string, string> = (() => {
  const index: Record<string, string> = {};
  for (const regle of Object.values(POLITIQUE)) {
    for (const [mime, format] of Object.entries(regle.formats)) {
      for (const extension of format.extensions) {
        index[`${regle.dossier}/${extension}`] = mime;
      }
    }
  }
  return index;
})();

/** Le MIME d'une clé, déduit de son extension. `null` si la clé n'est pas connue. */
function mimeDeCle(cle: string): string | null {
  const dossier = cle.split("/")[0];
  const extension = cle.split(".").pop() ?? "";
  return MIME_PAR_CLE[`${dossier}/${extension}`] ?? null;
}

export type OptionsEcriture = {
  /** Un autre support que le disque — les tests, un futur volume objet. */
  pilote?: PiloteStockage;
  /**
   * Un identifiant imposé au lieu d'un UUID. Réservé au cas où le dépôt
   * remplace le fichier précédent (un avatar par compte) : sans cela, changer
   * de photo laisserait l'ancien fichier sur le disque.
   */
  identifiant?: string;
};

function sansAccent(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Enregistre un fichier après l'avoir validé contre la politique de sa
 * catégorie. Refuse une catégorie inconnue, un type non accepté, un fichier
 * trop gros, et une extension qui ne correspond pas à son contenu.
 */
export async function enregistrer(
  categorie: string,
  contenu: ContenuFichier,
  options: OptionsEcriture = {},
): Promise<FichierDepose> {
  if (!categorieConnue(categorie)) {
    throw new FichierError("CATEGORIE_INCONNUE", "catégorie de fichier inconnue");
  }
  const regle = politiqueDe(categorie);
  if (!regle) {
    throw new FichierError("CATEGORIE_INCONNUE", "aucune politique pour cette catégorie");
  }

  const format = regle.formats[contenu.mime];
  if (!format) {
    const acceptes = Object.keys(regle.formats).join(", ");
    throw new FichierError(
      "TYPE_REFUSE",
      `type refusé, accepte : ${acceptes}`,
    );
  }

  const taille = contenu.octets.length;
  if (taille === 0) {
    throw new FichierError("TROP_GROS", "fichier vide");
  }
  if (taille > format.tailleMax) {
    throw new FichierError(
      "TROP_GROS",
      `fichier trop lourd (${Math.round(format.tailleMax / 1024)} Ko au plus)`,
    );
  }

  if (regle.verifierExtension) {
    const extension = sansAccent(contenu.nom.split(".").pop() ?? "");
    if (!format.extensions.includes(extension)) {
      throw new FichierError(
        "TYPE_REFUSE",
        "L'extension du fichier ne correspond pas à son contenu.",
      );
    }
  }

  // Ce que devient le fichier : le format d'origine, ou un format unique.
  let mimeFinal = contenu.mime;
  let extensionFinale: string;
  if (regle.sortie.mode === "conserver") {
    extensionFinale = (contenu.nom.split(".").pop() ?? "bin")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "bin";
  } else {
    if (regle.sortie.sauf.includes(contenu.mime)) {
      extensionFinale = format.extensions[0];
    } else {
      mimeFinal = regle.sortie.mime;
      extensionFinale = regle.sortie.extension;
    }
  }

  const identifiant = (options.identifiant ?? randomUUID()).replace(
    /[^A-Za-z0-9_-]/g,
    "_",
  );
  const cle = `${regle.dossier}/${identifiant}.${extensionFinale}`;

  const pilote = options.pilote ?? stockage;
  await pilote.ecrire(cle, contenu.octets);

  return {
    cle,
    categorie: categorie as CategorieFichier,
    nom: contenu.nom,
    mime: mimeFinal,
    tailleOctets: taille,
  };
}

/** Relit un fichier par sa clé. Le type est déduit de la clé, jamais demandé. */
export async function lire(
  cle: string,
  pilote: PiloteStockage = stockage,
): Promise<FichierLu> {
  const mime = mimeDeCle(cle);
  if (!mime) {
    throw new FichierError("CLE_INVALIDE", "référence de fichier inconnue");
  }
  const octets = await pilote.lire(cle);
  return { octets, mime };
}

/** Supprime un fichier. Un fichier déjà absent n'est pas une erreur. */
export async function supprimer(
  cle: string,
  pilote: PiloteStockage = stockage,
): Promise<void> {
  await pilote.supprimer(cle);
}

export { categorieConnue, FichierError } from "./types";
export type { CategorieFichier, ContenuFichier, FichierDepose, FichierLu } from "./types";
export { cleValide, piloteDisque, stockage } from "./storage";
export type { PiloteStockage } from "./storage";
export { POLITIQUE } from "./policy";
