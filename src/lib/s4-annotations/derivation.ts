import { estStatutAnnotation } from "@/lib/db/schema/s4-annotations";
import {
  estEtiquetteConnue,
  etiquettesOrdonnees,
} from "./etiquettes";

export type EvenementAnnotation = {
  compteClientId?: string | null;
  profilClientId?: string | null;
  etiquette: string;
  statut: string;
  horodatageLocal: Date;
  recuLe: Date;
};

/**
 * Les étiquettes suivent le **profil**, pas le compte. La clé de regroupement
 * est fournie par l'appelant, ce qui rend la dérivation indépendante du mode
 * de lecture : elle fonctionne aussi bien sur des lignes lues par compte que
 * par profil.
 */
export function deriverEtiquettesActivesParCle(
  evenements: readonly EvenementAnnotation[],
  cle: (evenement: EvenementAnnotation) => string,
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
    const groupe = cle(evenement);
    let parEtiquette = etat.get(groupe);
    if (!parEtiquette) {
      parEtiquette = new Map();
      etat.set(groupe, parEtiquette);
    }
    parEtiquette.set(evenement.etiquette, evenement.statut);
  }

  const resultat = new Map<string, string[]>();
  for (const [groupe, parEtiquette] of etat) {
    const posees = [...parEtiquette.entries()]
      .filter(([, statut]) => statut === "POSEE")
      .map(([etiquette]) => etiquette);
    if (posees.length > 0) {
      resultat.set(groupe, etiquettesOrdonnees(posees));
    }
  }
  return resultat;
}

export function deriverEtiquettesActives(
  evenements: readonly EvenementAnnotation[],
): Map<string, string[]> {
  return deriverEtiquettesActivesParCle(
    evenements,
    (evenement) => evenement.compteClientId ?? "",
  );
}
