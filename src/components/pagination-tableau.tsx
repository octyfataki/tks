"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function PaginationTableau({
  page,
  totalPages,
  total,
  hrefBase,
  onChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  hrefBase?: string;
  onChange?: (page: number) => void;
}) {
  const visible = total === undefined ? totalPages > 1 : total > 0;
  if (!visible) return null;

  const lien = (cible: number) =>
    `${hrefBase ?? ""}${hrefBase && !hrefBase.includes("?") ? "?" : "&"}page=${cible}`;

  const stylePage = (p: number) =>
    cn(
      "flex size-7 items-center justify-center rounded-md text-xs tabular-nums",
      p === page
        ? "bg-primary/15 font-medium text-primary"
        : "text-muted-foreground hover:bg-muted",
    );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-1">
      {hrefBase ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          render={page > 1 ? <Link href={lien(page - 1)} /> : undefined}
        >
          Précédent
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange?.(page - 1)}
        >
          Précédent
        </Button>
      )}

      {pagesAutour(page, totalPages).map((p, index) =>
        p === "…" ? (
          <span
            key={`vide-${index}`}
            aria-hidden
            className="flex size-7 items-center justify-center text-xs text-muted-foreground"
          >
            …
          </span>
        ) : hrefBase ? (
          <Link
            key={p}
            href={lien(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={stylePage(p)}
          >
            {p}
          </Link>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange?.(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={stylePage(p)}
          >
            {p}
          </button>
        ),
      )}

      {hrefBase ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          render={page < totalPages ? <Link href={lien(page + 1)} /> : undefined}
        >
          Suivant
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onChange?.(page + 1)}
        >
          Suivant
        </Button>
      )}
    </nav>
  );
}
