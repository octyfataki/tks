"use client";

import * as React from "react";
import {
  TauxDuJour,
  type ResultatSaisieTaux,
  type TauxEnVigueur,
  type TauxHistorique,
} from "@/components/daily-rate";
import {
  chargerTauxEnVigueurAction,
  enregistrerTauxAction,
} from "@/components/rate-actions";

type EtatTaux = {
  taux: TauxEnVigueur | null;
  historique: TauxHistorique[];
  peutSaisir: boolean;
  estClient: boolean;
};

export function TauxDuJourAuto({ className }: { className?: string }) {
  const [etat, setEtat] = React.useState<EtatTaux | null>(null);

  React.useEffect(() => {
    let actif = true;
    chargerTauxEnVigueurAction()
      .then((resultat) => {
        if (!actif) return;
        if (resultat.ok) {
          setEtat({
            taux: resultat.taux,
            historique: resultat.historique.slice(0, 5),
            peutSaisir: resultat.peutSaisir,
            estClient: resultat.estClient,
          });
        } else {
          setEtat({
            taux: null,
            historique: [],
            peutSaisir: false,
            estClient: false,
          });
        }
      })
      .catch(() => {
        if (actif)
          setEtat({
            taux: null,
            historique: [],
            peutSaisir: false,
            estClient: false,
          });
      });
    return () => {
      actif = false;
    };
  }, []);

  const enregistrer = React.useCallback(
    async (valeur: number): Promise<ResultatSaisieTaux> => {
      const resultat = await enregistrerTauxAction(valeur);
      if (resultat.ok) {
        setEtat((precedent) => ({
          taux: resultat.taux,
          historique: [
            {
              valeur: resultat.taux.valeur,
              jour: resultat.taux.depuisLe,
              saisiPar: resultat.taux.saisiPar,
            },
            ...(precedent?.historique ?? []).slice(0, 4),
          ],
          peutSaisir: true,
          estClient: precedent?.estClient ?? false,
        }));
        return { ok: true };
      }
      return { ok: false, erreur: resultat.erreur };
    },
    [],
  );

  return (
    <TauxDuJour
      taux={etat?.taux ?? null}
      historique={etat?.historique ?? []}
      peutSaisir={etat?.peutSaisir ?? false}
      estClient={etat?.estClient ?? false}
      onEnregistrer={enregistrer}
      className={className}
    />
  );
}
