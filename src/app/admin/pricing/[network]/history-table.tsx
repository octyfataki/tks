import Link from "next/link";
import { HistoryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { PriceEntry } from "../pricing-display";

export type HistoryRow = PriceEntry & {
  id: string;
  current: boolean;
};

export function PriceHistoryTable({ rows }: { rows: HistoryRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-4 py-10 text-center">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <HistoryIcon className="size-4" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium">Aucun prix publié</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Le premier prix saisi depuis la grille ouvrira l&apos;historique de ce
          réseau.
        </p>
        <Link
          href="/admin/pricing"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Ouvrir la grille
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full border-collapse text-left text-xs">
        <caption className="sr-only">
          Historique des prix publiés, de la publication la plus récente à la
          plus ancienne
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 font-medium">
              Date
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Prix
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2.5 font-medium lg:table-cell"
            >
              Équivalent
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2.5 font-medium lg:table-cell"
            >
              1 000 unités
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2.5 font-medium md:table-cell"
            >
              Auteur
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="transition-colors hover:bg-muted/30"
            >
              <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                {row.effectiveAtLabel}
                <span className="block whitespace-normal text-[11px] md:hidden">
                  {row.authorLabel}
                </span>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium tabular-nums">
                    {row.amountLabel}
                  </span>
                  {row.current ? (
                    <Badge variant="secondary">En vigueur</Badge>
                  ) : null}
                </span>
              </td>
              <td className="hidden px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums lg:table-cell">
                {row.equivalentLabel ?? "—"}
              </td>
              <td className="hidden px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums lg:table-cell">
                {row.sampleLabel}
              </td>
              <td className="hidden max-w-40 truncate px-3 py-2.5 text-muted-foreground md:table-cell">
                {row.authorLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
