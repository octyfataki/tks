"use client";

import * as React from "react";
import { PencilIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PastilleBloc, type EtatBloc } from "@/components/profile/pastille";

export function SectionModifiable({
  titre,
  description,
  peutModifier,
  motifVerrouille,
  lecture,
  formulaire,
  cleRepli,
  pastille,
}: {
  titre: string;
  description: string;
  peutModifier: boolean;
  motifVerrouille: string;
  lecture: React.ReactNode;
  formulaire: React.ReactNode;
  cleRepli?: string;
  pastille?: EtatBloc;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const motifAffiche = peutModifier ? null : motifVerrouille;

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">{titre}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {motifAffiche ?? description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pastille ? <PastilleBloc etat={pastille} /> : null}
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
          ) : pastille ? null : (
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
      </div>
      {peutModifier && ouvert ? (
        <div key={cleRepli}>{formulaire}</div>
      ) : (
        lecture
      )}
    </div>
  );
}
