import {
  CheckIcon,
  EyeIcon,
  FileTextIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";
import {
  pieceRetirable,
  type StatutPiece,
} from "@/lib/accounts/client-record";
import { BoutonRetirerPiece } from "./remove-document-button";

export type PieceIdentiteProfil = {
  id: string;
  typePiece: string;
  mime: string;
  statutPiece: StatutPiece;
  refusMotif: string | null;
  deposeLe: Date | string;
};

function dateCourte(valeur: Date | string): string {
  const date = valeur instanceof Date ? valeur : new Date(valeur);
  if (Number.isNaN(date.getTime())) return String(valeur);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ListePiecesIdentite({
  pieces,
}: {
  pieces: PieceIdentiteProfil[];
}) {
  const visibles = pieces.filter((piece) => piece.statutPiece !== "RETIREE");
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {visibles.map((piece) => {
        const estImage = piece.mime.startsWith("image/");
        return (
          <li
            key={piece.id}
            className="rounded-lg border bg-card transition-colors has-[a:hover]:border-primary"
          >
            <a
              href={`/api/client-documents/${piece.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3"
            >
              {estImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local authentifié, pas d'optimisation CDN
                <img
                  src={`/api/client-documents/${piece.id}`}
                  alt={`Votre pièce ${piece.typePiece}`}
                  className="h-16 w-16 shrink-0 rounded-md border object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                  <FileTextIcon className="size-6" />
                </span>
              )}
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <ImageIcon className="size-3.5 text-muted-foreground" />
                  Pièce {piece.typePiece}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  Déposée le {dateCourte(piece.deposeLe)} ·{" "}
                  {estImage ? "cliquez pour agrandir" : "PDF, cliquez pour ouvrir"}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  {piece.statutPiece === "ACCEPTEE" ? (
                    <>
                      <CheckIcon className="size-3" />
                      Acceptée par le distributeur
                    </>
                  ) : piece.statutPiece === "REFUSEE" ? (
                    <>
                      <XIcon className="size-3" />
                      Refusée — à refaire
                    </>
                  ) : (
                    <>
                      <EyeIcon className="size-3" />
                      Pas encore vue
                    </>
                  )}
                </span>
                {piece.statutPiece === "REFUSEE" && piece.refusMotif ? (
                  <span className="mt-1 flex items-start gap-1 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-[11px] leading-relaxed text-destructive">
                    <XIcon className="mt-0.5 size-3 shrink-0" />
                    <span>
                      <span className="font-semibold">Refusée — à refaire. </span>
                      {piece.refusMotif}
                    </span>
                  </span>
                ) : null}
              </span>
            </a>
            {pieceRetirable(piece) ? (
              <div className="border-t border-dashed px-3 py-2">
                <BoutonRetirerPiece pieceId={piece.id} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
