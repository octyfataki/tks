import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import { FichierError } from "./types";

/**
 * P0b — Le stockage des fichiers.
 *
 * L'emplacement des octets est une **décision d'infrastructure**, pas une
 * règle métier. Le disque local est un pilote, comme un volume monté ou un
 * stockage objet en seraient un autre. Les appelants ne connaissent que la
 * clé, donc changer de pilote ne les touche pas.
 *
 * Le garde-fou anti-traversée vit ici, une fois. C'était jusqu'ici recopié
 * à la main dans la route de lecture des pièces — une copie par route, donc
 * une oubli possible à la prochaine.
 */

/** Ce que doit savoir faire n'importe quel support de stockage. */
export type PiloteStockage = {
  ecrire(cle: string, octets: Uint8Array): Promise<void>;
  lire(cle: string): Promise<Uint8Array>;
  supprimer(cle: string): Promise<void>;
  existe(cle: string): Promise<boolean>;
};

/**
 * Une clé est `<dossier>/<nom>.<extension>`, les deux en minuscules ou
 * chiffres. Pas de `..`, pas de barre oblique inverse, pas de chemin absolu :
 * la clé est une référence, jamais une adresse.
 */
export function cleValide(cle: string): boolean {
  return /^[a-z0-9-]+\/[A-Za-z0-9_-]+\.[a-z0-9]{1,5}$/.test(cle);
}

/**
 * Le chemin absolu du fichier, vérifié comme étant bien sous la racine.
 *
 * `cleValide` filtre déjà les traverses ; ce second contrôle est la ceinture
 * en face des bretelles. Il ne coûte rien et il est le dernier rempart si
 * la forme de la clé change un jour.
 */
function cheminAbsolu(racine: string, cle: string): string {
  if (!cleValide(cle)) {
    throw new FichierError("CLE_INVALIDE", "référence de fichier invalide");
  }
  const absolu = resolve(racine, cle);
  if (!absolu.startsWith(resolve(racine) + sep)) {
    throw new FichierError("CLE_INVALIDE", "référence de fichier invalide");
  }
  return absolu;
}

/** Le pilote disque. La racine est injectée : les tests n'écrivent pas en production. */
export function piloteDisque(racine: string): PiloteStockage {
  const base = resolve(racine);

  return {
    async ecrire(cle, octets) {
      const absolu = cheminAbsolu(base, cle);
      try {
        await mkdir(dirname(absolu), { recursive: true });
        await writeFile(absolu, octets);
      } catch {
        throw new FichierError("STOCKAGE_INDISPONIBLE", "écriture impossible");
      }
    },

    async lire(cle) {
      const absolu = cheminAbsolu(base, cle);
      try {
        const contenu = await readFile(absolu);
        return new Uint8Array(contenu);
      } catch {
        throw new FichierError("FICHIER_ABSENT", "fichier introuvable");
      }
    },

    async supprimer(cle) {
      const absolu = cheminAbsolu(base, cle);
      try {
        await rm(absolu, { force: true });
      } catch {
        // Un fichier déjà absent n'est pas une erreur : la base fait foi.
      }
    },

    async existe(cle) {
      const absolu = cheminAbsolu(base, cle);
      try {
        await readFile(absolu);
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Racine par défaut des fichiers déposés. Hors de `public/`, volontairement. */
export const RACINE_FICHIERS = join(process.cwd(), "donnees", "fichiers");

/** Le pilote utilisé partout en application. */
export const stockage = piloteDisque(RACINE_FICHIERS);
