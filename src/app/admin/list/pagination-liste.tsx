import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/** Fenêtre de pages : première, dernière, page courante ± 1, « … » entre. */
function pagesAutour(page: number, totalPages: number): (number | "…")[] {
  const proches = new Set([1, totalPages, page - 1, page, page + 1]);
  const triees = [...proches]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
  const sortie: (number | "…")[] = [];
  for (const p of triees) {
    const precedent = sortie[sortie.length - 1];
    if (typeof precedent === "number" && p - precedent > 1) sortie.push("…");
    sortie.push(p);
  }
  return sortie;
}

/**
 * Pied de la grille /admin/list : Précédent | numéros | Suivant.
 * `hrefBase` porte déjà les choix (?q=, ?filtre=, ?tri=), la page
 * s'ajoute en ?page=. Rendu serveur : que des liens, aucun état client.
 */
export function PaginationListe({
  page,
  totalPages,
  hrefBase,
}: {
  page: number;
  totalPages: number;
  /** Lien de la liste sans ?page=, ex. « /admin/list?q=x ». */
  hrefBase: string;
}) {
  if (totalPages <= 1) return null;

  const lien = (cible: number) =>
    `${hrefBase}${hrefBase.includes("?") ? "&" : "?"}page=${cible}`;

  return (
    <Pagination>
      <PaginationPrevious
        desactive={page <= 1}
        render={page > 1 ? <Link href={lien(page - 1)} /> : undefined}
      />
      <PaginationContent>
        {pagesAutour(page, totalPages).map((p, index) =>
          p === "…" ? (
            <PaginationItem key={`vide-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                render={<Link href={lien(p)} aria-label={`Page ${p}`} />}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
      </PaginationContent>
      <PaginationNext
        desactive={page >= totalPages}
        render={page < totalPages ? <Link href={lien(page + 1)} /> : undefined}
      />
    </Pagination>
  );
}
