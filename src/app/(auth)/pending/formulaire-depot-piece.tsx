"use client";

import {
  FormulaireDepotPiece,
  type IssueDepotPiece,
} from "@/components/clients/depot-piece-identite";
import type { StatutCompte } from "./statut-compte";

/**
 * Dépôt de la pièce d'identité depuis /pending. Le statut vient du parent
 * (source unique : GET /api/mon-compte/piece) ; après un dépôt réussi, le
 * parent recharge (`onPieceDeposee`). Le formulaire est partagé avec le
 * profil client (`FormulaireDepotPiece`) : ici, premier dépôt d'un compte
 * en attente ou refusé, pièces déjà déposées rappelées sous le formulaire.
 *
 * L'action serveur est importée au moment de l'envoi (import dynamique) :
 * le module reste importable sans base (tests, prérendu).
 */
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
    const { deposerPieceIdentiteAction } = await import("./actions-depot");
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
