"use client";

import { useActionState } from "react";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  refuserCompteClientAction,
  revoquerCompteClientAction,
  validerCompteClientAction,
  validerCompteClientComptoirAction,
  type ResultatDecision,
} from "./actions";
import { TYPES_PIECE } from "@/lib/s1-comptes/pieces-fichiers";

const ETAT_INITIAL: ResultatDecision | null = null;

function MessageResultat({ resultat }: { resultat: ResultatDecision | null }) {
  if (!resultat || resultat.ok) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {resultat.erreur}
    </p>
  );
}

/**
 * Valider porte l'identifiant de la pièce vue : aucun champ à saisir, le
 * geste confirme « j'ai vu cette pièce ». Succès = la file se recharge sans
 * la ligne (revalidation serveur).
 */
export function FormulaireValider({
  compteId,
  pieceId,
}: {
  compteId: string;
  pieceId: string;
}) {
  const [resultat, action, enCours] = useActionState(
    validerCompteClientAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="compteId" value={compteId} />
      <input type="hidden" name="pieceId" value={pieceId} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Je confirme avoir vu la pièce ci-dessus : le compte devient utilisable.
      </p>
      <MessageResultat resultat={resultat} />
      <Button type="submit" disabled={enCours} className="self-start">
        <CheckIcon />
        {enCours ? "Validation…" : "Valider sur cette pièce"}
      </Button>
    </form>
  );
}

/**
 * Refuser porte un motif obligatoire, montré au client — qui pourra être
 * validé plus tard sans ressaisie (REFUSE → VALIDE reste ouvert).
 */
export function FormulaireRefuser({ compteId }: { compteId: string }) {
  const [resultat, action, enCours] = useActionState(
    refuserCompteClientAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="compteId" value={compteId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`motif-${compteId}`}>Motif montré au client</Label>
        <Textarea
          id={`motif-${compteId}`}
          name="motif"
          required
          minLength={3}
          maxLength={500}
          rows={2}
          placeholder="Pièce illisible, numéro flou…"
        />
      </div>
      <MessageResultat resultat={resultat} />
      <Button
        type="submit"
        variant="destructive"
        disabled={enCours}
        className="self-start"
      >
        <XIcon />
        {enCours ? "Refus…" : "Confirmer le refus"}
      </Button>
    </form>
  );
}

/**
 * Attester avoir vu la pièce physique au comptoir : le client venu avec sa
 * pièce ne repart pas bredouille faute de dépôt numérique. Le type est coché
 * en liste fermée, jamais saisi librement ; la vue est journalisée.
 */
export function FormulaireAttesterComptoir({
  compteId,
}: {
  compteId: string;
}) {
  const [resultat, action, enCours] = useActionState(
    validerCompteClientComptoirAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="compteId" value={compteId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`typePiece-${compteId}`}>Pièce vue au comptoir</Label>
        <Select name="typePiece" defaultValue="CNI" required>
          <SelectTrigger id={`typePiece-${compteId}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES_PIECE.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Je confirme avoir vu la pièce ci-dessus en main propre : le compte
        devient utilisable.
      </p>
      <MessageResultat resultat={resultat} />
      <Button type="submit" disabled={enCours} className="self-start">
        <CheckIcon />
        {enCours ? "Validation…" : "Valider au comptoir"}
      </Button>
    </form>
  );
}

/**
 * Révoquer un compte suspect (fraude, usurpation, pièce falsifiée…). C'est
 * la « suppression » de la file : aucun effacement physique (invariant 10,
 * journal immuable) — le compte passe en REVOQUE, définitif, sort de la
 * file, reste visible dans la liste des comptes avec le filtre « Révoqués ».
 * Le motif est obligatoire et conservé. Réservé au doute grave : pour un
 * simple doute réparable (pièce illisible), préférer le refus, réversible
 * sans ressaisie.
 */
export function FormulaireRevoquer({ compteId }: { compteId: string }) {
  const [resultat, action, enCours] = useActionState(
    revoquerCompteClientAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="compteId" value={compteId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`motif-revocation-${compteId}`}>
          Motif de la révocation
        </Label>
        <Textarea
          id={`motif-revocation-${compteId}`}
          name="motif"
          required
          minLength={3}
          maxLength={500}
          rows={2}
          placeholder="Pièce falsifiée, usurpation d'identité…"
        />
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Définitif : le compte ne pourra plus être validé. Réservé aux comptes
        suspects.
      </p>
      <MessageResultat resultat={resultat} />
      <Button
        type="submit"
        variant="destructive"
        disabled={enCours}
        className="self-start"
      >
        <XIcon />
        {enCours ? "Révocation…" : "Révoquer définitivement"}
      </Button>
    </form>
  );
}
