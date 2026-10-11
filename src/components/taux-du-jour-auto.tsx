"use client";

import * as React from "react";
import {
  TauxDuJour,
  type ResultatSaisieTaux,
  type TauxEnVigueur,
} from "@/components/taux-du-jour";
import {
  chargerTauxDuJourAction,
  enregistrerTauxDuJourAction,
} from "@/components/taux-actions";

type EtatTaux = {
  taux: TauxEnVigueur | null;
  peutSaisir: boolean;
};

/**
 * Pastille du taux, branchée : elle lit le taux du jour et la permission de
 * la personne connectée au montage (server action), puis enregistre la
 * saisie. Un échec de lecture retombe en lecture seule sans inventer de
 * taux — le taux est un paramètre résolu à la lecture, jamais une valeur
 * par défaut (S3, ADR-0001).
 *
 * Vit dans l'en-tête des trois espaces (administrateur, agent, client) :
 * seule la permission décide si le modal propose la saisie.
 */
export function TauxDuJourAuto({ className }: { className?: string }) {
  const [etat, setEtat] = React.useState<EtatTaux | null>(null);

  React.useEffect(() => {
    let actif = true;
    chargerTauxDuJourAction()
      .then((resultat) => {
        if (!actif) return;
        if (resultat.ok) {
          setEtat({ taux: resultat.taux, peutSaisir: resultat.peutSaisir });
        } else {
          setEtat({ taux: null, peutSaisir: false });
        }
      })
      .catch(() => {
        if (actif) setEtat({ taux: null, peutSaisir: false });
      });
    return () => {
      actif = false;
    };
  }, []);

  const enregistrer = React.useCallback(
    async (valeur: number): Promise<ResultatSaisieTaux> => {
      const resultat = await enregistrerTauxDuJourAction(valeur);
      if (resultat.ok) {
        setEtat({ taux: resultat.taux, peutSaisir: true });
        return { ok: true };
      }
      return { ok: false, erreur: resultat.erreur };
    },
    [],
  );

  return (
    <TauxDuJour
      taux={etat?.taux ?? null}
      peutSaisir={etat?.peutSaisir ?? false}
      onEnregistrer={enregistrer}
      className={className}
    />
  );
}
