import { estStatutAnnotation } from "@/lib/db/schema/s4-annotations";
import {
  estEtiquetteConnue,
  etiquettesOrdonnees,
} from "./etiquettes";

// Issue #7 — dérivation pure des étiquettes actives, sans E/S : testée
// sans base (voir annotations.test.ts). L'événement le plus récent d'une
// paire (compte, étiquette) décide : `POSEE` = badge affiché, `RETIREE` =
// rien. Tri par horodatage de l'appareil, puis par heure de réception en
// cas d'égalité (conflit hors-ligne, ADR-0005).

/** Un événement d'annotation, tel que lu en base (ou construit en test). */
export type EvenementAnnotation = {
  compteClientId: string;
  etiquette: string;
  statut: string;
  horodatageLocal: Date;
  recuLe: Date;
};

/**
 * Dérive, à partir du journal append-only, les étiquettes actives par compte.
 */
export function deriverEtiquettesActives(
  evenements: readonly EvenementAnnotation[],
): Map<string, string[]> {
  const ordonnes = [...evenements].sort((a, b) => {
    const parLocal = a.horodatageLocal.getTime() - b.horodatageLocal.getTime();
    if (parLocal !== 0) return parLocal;
    return a.recuLe.getTime() - b.recuLe.getTime();
  });

  const etat = new Map<string, Map<string, string>>();
  for (const evenement of ordonnes) {
    if (!estEtiquetteConnue(evenement.etiquette)) continue;
    if (!estStatutAnnotation(evenement.statut)) continue;
    let parCompte = etat.get(evenement.compteClientId);
    if (!parCompte) {
      parCompte = new Map();
      etat.set(evenement.compteClientId, parCompte);
    }
    parCompte.set(evenement.etiquette, evenement.statut);
  }

  const resultat = new Map<string, string[]>();
  for (const [compteClientId, parCompte] of etat) {
    const posees = [...parCompte.entries()]
      .filter(([, statut]) => statut === "POSEE")
      .map(([etiquette]) => etiquette);
    if (posees.length > 0) {
      resultat.set(compteClientId, etiquettesOrdonnees(posees));
    }
  }
  return resultat;
}
