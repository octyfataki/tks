"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormulaireDepotPiece,
  type IssueDepotPiece,
} from "@/components/clients/depot-piece-identite";
import { deposerPieceIdentiteAction } from "@/app/(auth)/pending/actions-depot";

export function RemplacerPieceIdentite() {
  const router = useRouter();
  const [ouvert, setOuvert] = React.useState(false);

  async function deposer(donnees: FormData): Promise<IssueDepotPiece> {
    return deposerPieceIdentiteAction(null, donnees);
  }

  function signalerDepot() {
    setOuvert(false);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        onClick={() => setOuvert(true)}
      >
        <FileUpIcon />
        Remplacer ma pièce
      </Button>
    );
  }

  return (
    <div className="mt-3">
      <FormulaireDepotPiece
        pieces={[]}
        deposer={deposer}
        onPieceDeposee={signalerDepot}
        titre="Remplacez votre pièce"
        description="Photo lisible (CNI, passeport, permis) ou PDF, 5 Mo au plus. Votre pièce actuelle reste à votre profil ; la nouvelle sera à revoir par un humain."
        libelleEnvoi="Envoyer la nouvelle pièce"
        afficherDeposees={false}
        etiquetteSection="Remplacer votre pièce d'identité"
      />
    </div>
  );
}
