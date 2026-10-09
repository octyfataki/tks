"use client";

import * as React from "react";
import { PencilIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Carte à en-tête crayon (modèle de la maquette : un ✎ par zone).
 * Au repos : la lecture seule. Crayon cliqué : le formulaire de la zone.
 * Quand la zone n'est pas modifiable (compte révoqué, aucun appareil
 * déclaré, droits insuffisants), le crayon reste visible mais désactivé
 * avec son motif — jamais un cul-de-sac silencieux.
 */
export function SectionModifiable({
  titre,
  description,
  peutModifier,
  motifVerrouille,
  lecture,
  formulaire,
  cleRepli,
}: {
  titre: string;
  description: string;
  peutModifier: boolean;
  motifVerrouille: string;
  lecture: React.ReactNode;
  formulaire: React.ReactNode;
  /** Change à chaque enregistrement : le formulaire repart des valeurs fraîches. */
  cleRepli?: string;
}) {
  const [ouvert, setOuvert] = React.useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">{titre}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        {peutModifier ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setOuvert((v) => !v)}
            aria-expanded={ouvert}
            aria-label={ouvert ? `Refermer la correction : ${titre}` : `Corriger : ${titre}`}
            title={ouvert ? "Refermer" : "Corriger"}
          >
            {ouvert ? <XIcon /> : <PencilIcon />}
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled
            aria-label={`${titre} : non modifiable`}
            title={motifVerrouille}
          >
            <PencilIcon />
          </Button>
        )}
      </div>
      {peutModifier && ouvert ? (
        <div key={cleRepli}>{formulaire}</div>
      ) : (
        lecture
      )}
    </div>
  );
}
