"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Network } from "@/modules/pricing/price-record";

export type LigneChangement = {
  id: string;
  network: Network;
  reseau: string;
  slug: string;
  logo: string;
  jour: string;
  avant: string | null;
  apres: string;
  equivalent: string | null;
  echantillon: string;
  publieLe: string;
  auteur: string;
  sousLeTaux: boolean;
};

export function RecentChangesTable({
  lignes,
  messageVide = "Aucun prix publié pour le moment. La première saisie apparaîtra ici.",
}: {
  lignes: LigneChangement[];
  messageVide?: string;
}) {
  const [depliees, setDepliees] = React.useState<ReadonlySet<string>>(
    new Set(),
  );

  function basculer(id: string) {
    setDepliees((precedentes) => {
      const suivantes = new Set(precedentes);
      if (suivantes.has(id)) suivantes.delete(id);
      else suivantes.add(id);
      return suivantes;
    });
  }

  if (lignes.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        {messageVide}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <caption className="sr-only">
          Derniers changements de prix, tous réseaux
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th scope="col" className="w-8 px-2 py-2.5">
              <span className="sr-only">Détail</span>
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Réseau
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Avant
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Après
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2.5 font-medium lg:table-cell"
            >
              Au taux du jour
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Publié le
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2.5 font-medium md:table-cell"
            >
              Par
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {lignes.map((ligne) => {
            const depliee = depliees.has(ligne.id);
            return (
              <React.Fragment key={ligne.id}>
                <tr className="transition-colors hover:bg-muted/30">
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => basculer(ligne.id)}
                      aria-expanded={depliee}
                      aria-label={
                        depliee ? "Replier le détail" : "Déplier le détail"
                      }
                      className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronRightIcon
                        className={cn(
                          "size-4 transition-transform",
                          depliee && "rotate-90",
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/pricing/${ligne.slug}`}
                      className="flex items-center gap-2 underline-offset-4 hover:underline"
                    >
                      <span className="size-6 shrink-0 overflow-hidden rounded bg-white p-0.5 ring-1 ring-foreground/10">
                        <Image
                          src={ligne.logo}
                          alt=""
                          width={48}
                          height={48}
                          unoptimized
                          className="h-full w-full object-contain"
                        />
                      </span>
                      <span className="font-medium">{ligne.reseau}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    {ligne.avant ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium tabular-nums">
                        {ligne.apres}
                      </span>
                      {ligne.sousLeTaux ? (
                        <Badge
                          variant="outline"
                          className="border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        >
                          Sous le taux
                        </Badge>
                      ) : null}
                    </span>
                  </td>
                  <td className="hidden px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums lg:table-cell">
                    {ligne.equivalent ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    {ligne.publieLe}
                  </td>
                  <td className="hidden max-w-40 truncate px-3 py-2.5 text-muted-foreground md:table-cell">
                    {ligne.auteur}
                  </td>
                </tr>
                {depliee ? (
                  <tr className="bg-muted/30">
                    <td />
                    <td colSpan={6} className="px-3 py-3">
                      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Avant
                          </dt>
                          <dd className="mt-0.5 tabular-nums">
                            {ligne.avant ?? "Première publication"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Après
                          </dt>
                          <dd className="mt-0.5 font-medium tabular-nums">
                            {ligne.apres}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Au taux du jour
                          </dt>
                          <dd className="mt-0.5 tabular-nums">
                            {ligne.equivalent ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            1 000 unités
                          </dt>
                          <dd className="mt-0.5 tabular-nums">
                            {ligne.echantillon}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Publié le
                          </dt>
                          <dd className="mt-0.5 tabular-nums">
                            {ligne.publieLe}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[11px] text-muted-foreground">
                            Par
                          </dt>
                          <dd className="mt-0.5 truncate">{ligne.auteur}</dd>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <dt className="text-[11px] text-muted-foreground">
                            Fiche
                          </dt>
                          <dd className="mt-0.5">
                            <Link
                              href={`/admin/pricing/${ligne.slug}`}
                              className="underline underline-offset-4"
                            >
                              Ouvrir {ligne.reseau}
                            </Link>
                          </dd>
                        </div>
                      </dl>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
