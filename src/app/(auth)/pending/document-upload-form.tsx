"use client";

import {
  FormulaireDepotPiece,
  type IssueDepotPiece,
} from "@/components/clients/depot-piece-identite";
import type { StatutCompte } from "./account-status";

export function DepotPieceIdentite({
  statut,
  onPieceDeposee,
}: {
  statut: StatutCompte | null;
  onPieceDeposee: () => void;
}) {
  if (statut === null) return null;
  if (!statut.connecte) return null;
  if (statut.etat !== "EN_ATTENTE_VALIDATION" && statut.etat !== "REFUSE") {
    return null;
  }

  async function deposer(donnees: FormData): Promise<IssueDepotPiece> {
    const { deposerPieceIdentiteAction } = await import("./upload-actions");
    return deposerPieceIdentiteAction(null, donnees);
  }

  return (
    <FormulaireDepotPiece
      pieces={statut.pieces ?? []}
      deposer={deposer}
      onPieceDeposee={onPieceDeposee}
      titre="Déposez votre pièce ici"
      description="Photo lisible (CNI, passeport, permis) ou PDF, 5 Mo au plus. Un humain la verra avant de valider votre compte."
      libelleEnvoi="Envoyer la pièce"
    />
  );
}
