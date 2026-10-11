import { EyeIcon, FileTextIcon, ImageIcon } from "lucide-react";

/** Pièce d'identité du compte connecté, telle que montrée sur son profil. */
export type PieceIdentiteProfil = {
  id: string;
  typePiece: string;
  mime: string;
  /** Vue par un humain du distributeur — sans dire qui ni quand. */
  vue: boolean;
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

/**
 * Les pièces du client, vues par lui seul (route authentifiée, le
 * propriétaire est autorisé). Image en vignette, PDF à ouvrir — même
 * parti pris que la fiche côté distributeur, sans la date de vision.
 */
export function ListePiecesIdentite({
  pieces,
}: {
  pieces: PieceIdentiteProfil[];
}) {
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {pieces.map((piece) => {
        const estImage = piece.mime.startsWith("image/");
        return (
          <li key={piece.id}>
            <a
              href={`/api/pieces-clients/${piece.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary"
            >
              {estImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu local authentifié, pas d'optimisation CDN
                <img
                  src={`/api/pieces-clients/${piece.id}`}
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
                  <EyeIcon className="size-3" />
                  {piece.vue ? "Vue par le distributeur" : "Pas encore vue"}
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
