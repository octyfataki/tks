"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownUpIcon,
  CheckIcon,
  DownloadIcon,
  ListFilterIcon,
  RotateCcwIcon,
  SearchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  CLOSED_NETWORKS,
  isNetwork,
  networkLabel,
} from "@/modules/pricing/price-record";
import { RangeFilter } from "./range-filter";
import type { LigneChangement } from "./recent-changes-table";
const TRIS = [
  { valeur: "", etiquette: "Plus récents" },
  { valeur: "anciens", etiquette: "Plus anciens" },
] as const;

function etiquette(
  valeurs: readonly { valeur: string; etiquette: string }[],
  actif: string,
) {
  return (
    valeurs.find((valeur) => valeur.valeur === actif)?.etiquette ??
    valeurs[0].etiquette
  );
}

function cellule(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

function exporterCSV(lignes: LigneChangement[]) {
  const entete = "Réseau;Avant;Après;Au taux du jour;1 000 unités;Publié le;Par";
  const corps = lignes.map((ligne) =>
    [
      cellule(ligne.reseau),
      cellule(ligne.avant ?? ""),
      cellule(ligne.apres),
      cellule(ligne.equivalent ?? ""),
      cellule(ligne.echantillon),
      cellule(ligne.publieLe),
      cellule(ligne.auteur),
    ].join(";"),
  );
  const contenu = `﻿${[entete, ...corps].join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([contenu], { type: "text/csv;charset=utf-8" }),
  );
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "changements-tarifs.csv";
  lien.click();
  URL.revokeObjectURL(url);
}

export function RecentChangesToolbar({
  exportLignes,
}: {
  exportLignes: LigneChangement[];
}) {
  const router = useRouter();
  const chemin = usePathname();
  const params = useSearchParams();

  const q = params.get("q") ?? "";
  const reseau = params.get("reseau") ?? "";
  const du = params.get("du") ?? "";
  const au = params.get("au") ?? "";
  const tri = params.get("tri") ?? "";

  const champRef = React.useRef<HTMLInputElement>(null);
  const [recherche, setRecherche] = React.useState(q);
  React.useEffect(() => {
    if (champRef.current !== document.activeElement) setRecherche(q);
  }, [q]);
  const delai = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (delai.current) clearTimeout(delai.current);
    },
    [],
  );

  function aller(nouveaux: Record<string, string | null>) {
    const prochains = new URLSearchParams(params.toString());
    for (const [cle, valeur] of Object.entries(nouveaux)) {
      if (valeur === null || valeur === "") prochains.delete(cle);
      else prochains.set(cle, valeur);
    }
    prochains.delete("page");
    const chaine = prochains.toString();
    router.replace(chaine ? `${chemin}?${chaine}` : chemin, { scroll: false });
  }

  function changerRecherche(valeur: string) {
    setRecherche(valeur);
    if (delai.current) clearTimeout(delai.current);
    delai.current = setTimeout(() => aller({ q: valeur.trim() }), 300);
  }

  const filtreActif = q !== "" || reseau !== "" || du !== "" || au !== "" || tri !== "";

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              role="searchbox"
              aria-label="Rechercher un changement de prix"
              placeholder="Réseau ou auteur"
              ref={champRef}
              value={recherche}
              onChange={(evenement) => changerRecherche(evenement.target.value)}
              className="pl-8"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" aria-label="Filtrer par réseau">
                    <ListFilterIcon />
                    {isNetwork(reseau) ? networkLabel(reseau) : "Réseau"}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => aller({ reseau: null })}>
                  {reseau === "" ? <CheckIcon /> : null}
                  Tous les réseaux
                </DropdownMenuItem>
                {CLOSED_NETWORKS.map((code) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => aller({ reseau: code })}
                  >
                    {reseau === code ? <CheckIcon /> : null}
                    {networkLabel(code)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" aria-label="Trier les changements">
                    <ArrowDownUpIcon />
                    {etiquette(TRIS, tri)}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                {TRIS.map((option) => (
                  <DropdownMenuItem
                    key={option.valeur || "recent"}
                    onClick={() => aller({ tri: option.valeur || null })}
                  >
                    {tri === option.valeur ? <CheckIcon /> : null}
                    {option.etiquette}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <RangeFilter
              du={du}
              au={au}
              onChange={(debut, fin) =>
                aller({ du: debut || null, au: fin || null })
              }
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => exporterCSV(exportLignes)}
              disabled={exportLignes.length === 0}
            >
              <DownloadIcon />
              Export
            </Button>

            {filtreActif ? (
              <Button
                type="button"
                variant="ghost"
                aria-label="Réinitialiser les filtres"
                onClick={() => router.replace(chemin, { scroll: false })}
              >
                <RotateCcwIcon />
                Réinitialiser
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
