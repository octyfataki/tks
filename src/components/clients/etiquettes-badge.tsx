import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  etiquetteParCode,
  type TeinteEtiquette,
} from "@/lib/s4-annotations/etiquettes";

/**
 * Classes Tailwind par teinte d'étiquette. Centralisées ici : la pastille
 * du badge et le bouton d'annotation partagent le même vocabulaire visuel.
 */
export const CLASSES_TEINTE: Record<TeinteEtiquette, string> = {
  rouge: "border-destructive/40 bg-destructive/10 text-destructive",
  vert: "border-green-700/40 bg-green-700/10 text-green-700 dark:text-green-400",
  bleu: "border-blue-600/40 bg-blue-600/10 text-blue-700 dark:text-blue-400",
};

/**
 * Badge « certifié » d'une étiquette, comme sur un réseau social : la coche
 * dans un rond teinté prouve qu'un humain l'a posée. Composant partagé,
 * pensé pour tenir dans une cellule de tableau ou un en-tête de fiche :
 * `inline-flex shrink-0`, une étiquette = un badge. Aucun calcul, la
 * coche est un sceau de traçabilité (qui l'a posée est au journal).
 *
 * `variant="certifie"` (fiche) : coche + libellé. `variant="pastille"`
 * (tableaux) : libellé seul, plus dense.
 */
export function PastilleEtiquette({
  code,
  variant = "certifie",
}: {
  code: string;
  variant?: "certifie" | "pastille";
}) {
  const etiquette = etiquetteParCode(code);
  if (!etiquette) return null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border py-0.5 pr-2 pl-1 text-[11px] font-medium whitespace-nowrap",
        CLASSES_TEINTE[etiquette.teinte],
      )}
    >
      {variant === "certifie" ? (
        <span
          aria-hidden
          className="flex size-3.5 items-center justify-center rounded-full bg-current"
        >
          <CheckIcon className="size-2.5 text-background" strokeWidth={3} />
        </span>
      ) : null}
      {etiquette.libelle}
    </span>
  );
}

/**
 * Badge d'un client : une pastille par étiquette active. Rien à afficher =
 * rien. C'est le repère « visible partout » que porte un client annoté,
 * utilisable dans un tableau comme sur la fiche.
 */
export function EtiquettesBadge({
  codes,
  variant = "certifie",
}: {
  codes: readonly string[];
  variant?: "certifie" | "pastille";
}) {
  if (codes.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {codes.map((code) => (
        <PastilleEtiquette key={code} code={code} variant={variant} />
      ))}
    </span>
  );
}
