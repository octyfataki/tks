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
