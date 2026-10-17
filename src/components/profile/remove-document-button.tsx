"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BoutonRetirerPiece({ pieceId }: { pieceId: string }) {
  const router = useRouter();
  const [confirme, setConfirme] = React.useState(false);
  const [enCours, setEnCours] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);

  async function retirer() {
    setEnCours(true);
    setErreur(null);
    try {
      const donnees = new FormData();
      donnees.set("pieceId", pieceId);
      const { retirerPieceIdentiteAction } = await import(
        "@/components/clients/actions"
      );
      const issue = await retirerPieceIdentiteAction(null, donnees);
      if (issue.ok) {
        router.refresh();
        return;
      }
      setErreur(issue.erreur);
    } finally {
      setEnCours(false);
    }
  }

  if (!confirme) {
    return (
      <Button
        type="button"
        size="xs"
        variant="outline"
        onClick={() => setConfirme(true)}
      >
        <Trash2Icon />
        Retirer cette pièce
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        La pièce reste dans votre dossier, seul le document cesse d&apos;être
        votre pièce actuelle. Vous pouvez en déposer une nouvelle.
      </p>
      {erreur ? (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {erreur}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="button" size="xs" variant="destructive" onClick={retirer} disabled={enCours}>
          <Trash2Icon />
          {enCours ? "Retrait…" : "Confirmer le retrait"}
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() => setConfirme(false)}
          disabled={enCours}
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}