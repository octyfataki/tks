"use client";

import { useActionState, useState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { statuerPieceIdentiteAction, type ResultatDecision } from "./actions";

// Verdict sur une pièce déposée par un compte déjà validé (ticket 10).
// Le geste porte sur la pièce, pas sur le compte : accepter ne change
// rien à l'état du client, refuser ne l'enferme pas. Replier le refus
// garde la pièce lisible d'un coup d'œil au comptoir : on ne laisse pas
// un champ de saisie ouvert sous chaque document.
const ETAT_INITIAL: ResultatDecision | null = null;

function MessageResultat({ resultat }: { resultat: ResultatDecision | null }) {
  if (!resultat || resultat.ok) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {resultat.erreur}
    </p>
  );
}

export function FormulaireStatutPiece({
  compteId,
  pieceId,
}: {
  compteId: string;
  pieceId: string;
}) {
  const [resultat, action, enCours] = useActionState(
    statuerPieceIdentiteAction,
    ETAT_INITIAL,
  );
  const [refusOuvert, setRefusOuvert] = useState(false);

  return (
    <div className="mt-3 border-t border-dashed pt-3">
      {refusOuvert ? (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="compteId" value={compteId} />
          <input type="hidden" name="pieceId" value={pieceId} />
          <input type="hidden" name="statut" value="REFUSEE" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`motif-piece-${pieceId}`}>
              Ce que le client doit corriger
            </Label>
            <Textarea
              id={`motif-piece-${pieceId}`}
              name="motif"
              required
              minLength={3}
              maxLength={500}
              rows={2}
              placeholder="Photo floue, envoyez une CNI lisible…"
            />
          </div>
          <MessageResultat resultat={resultat} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="destructive" disabled={enCours}>
              <XIcon />
              {enCours ? "Refus…" : "Refuser cette pièce"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefusOuvert(false)}
              disabled={enCours}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="compteId" value={compteId} />
          <input type="hidden" name="pieceId" value={pieceId} />
          <input type="hidden" name="statut" value="ACCEPTEE" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Le compte reste validé : seul ce document est tranché.
          </p>
          <MessageResultat resultat={resultat} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={enCours}>
              <CheckIcon />
              {enCours ? "Acceptation…" : "Accepter cette pièce"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefusOuvert(true)}
              disabled={enCours}
            >
              <XIcon />
              Refuser
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}