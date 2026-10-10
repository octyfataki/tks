"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDownUpIcon,
  CheckIcon,
  DownloadIcon,
  ListFilterIcon,
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

const FILTRES = [
  { valeur: "", etiquette: "Tous les comptes" },
  { valeur: "en-attente", etiquette: "En attente" },
  { valeur: "valide", etiquette: "Validés" },
  { valeur: "refuse", etiquette: "Refusés" },
  { valeur: "revoque", etiquette: "Révoqués" },
] as const;

const TRIS = [
  { valeur: "", etiquette: "Plus récents" },
  { valeur: "anciens", etiquette: "Plus anciens" },
  { valeur: "nom-az", etiquette: "Nom A–Z" },
] as const;

export type LigneExportClient = {
  nom: string;
  email: string;
  telephone: string;
  etat: string;
  inscritLe: string;
  attenteJours: string;
  valideLe: string;
  motifRefus: string;
};

function etiquette(
  valeurs: readonly { valeur: string; etiquette: string }[],
  actif: string,
) {
  return valeurs.find((v) => v.valeur === actif)?.etiquette ?? valeurs[0].etiquette;
}

function cellule(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

/** Export CSV des comptes affichés (filtres inclus), 100 % client, BOM UTF-8 pour Excel. */
function exporterCSV(lignes: LigneExportClient[]) {
  const entete = "Nom;Email;Téléphone;État;Inscrit le;Attente (j);Validé le;Motif refus";
  const corps = lignes.map((ligne) =>
    [
      cellule(ligne.nom),
      cellule(ligne.email),
      cellule(ligne.telephone),
      cellule(ligne.etat),
      cellule(ligne.inscritLe),
      cellule(ligne.attenteJours),
      cellule(ligne.valideLe),
      cellule(ligne.motifRefus),
    ].join(";"),
  );
  const contenu = `﻿${[entete, ...corps].join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([contenu], { type: "text/csv;charset=utf-8" }),
  );
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "comptes-clients.csv";
  lien.click();
  URL.revokeObjectURL(url);
}

/**
 * Barre d'outils des comptes clients : recherche (nom, email, téléphone —
 * le téléphone est la clé du compte), filtre d'état, tri, export.
 * État 100 % dans l'URL (?q=, ?filtre=, ?tri=), filtrage côté serveur.
 */
export function BarreOutilsClients({
  exportLignes,
}: {
  exportLignes: LigneExportClient[];
}) {
  const router = useRouter();
  const chemin = usePathname();
  const params = useSearchParams();

  const q = params.get("q") ?? "";
  const filtre = params.get("filtre") ?? "";
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

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              role="searchbox"
              aria-label="Rechercher un compte client"
              placeholder="Nom, email ou téléphone"
              ref={champRef}
              value={recherche}
              onChange={(event) => changerRecherche(event.target.value)}
              className="pl-8"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" aria-label="Filtrer par état">
                    <ListFilterIcon />
                    {filtre ? etiquette(FILTRES, filtre) : "Filtrer"}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                {FILTRES.map((option) => (
                  <DropdownMenuItem
                    key={option.valeur || "tous"}
                    onClick={() => aller({ filtre: option.valeur || null })}
                  >
                    {filtre === option.valeur ? <CheckIcon /> : null}
                    {option.etiquette}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" aria-label="Trier la liste">
                    <ArrowDownUpIcon />
                    {tri ? etiquette(TRIS, tri) : "Trier"}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                {TRIS.map((option) => (
                  <DropdownMenuItem
                    key={option.valeur || "defaut"}
                    onClick={() => aller({ tri: option.valeur || null })}
                  >
                    {tri === option.valeur ? <CheckIcon /> : null}
                    {option.etiquette}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              onClick={() => exporterCSV(exportLignes)}
              disabled={exportLignes.length === 0}
            >
              <DownloadIcon />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
