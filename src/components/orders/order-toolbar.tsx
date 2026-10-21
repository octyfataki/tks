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
import { networkLabel } from "@/modules/pricing/price-record";
import {
  ETATS_FILTRABLES,
  PERIODES_FILTRABLES,
  RESEAUX_FILTRABLES,
  TRIS_FILTRABLES,
  TYPES_FILTRABLES,
} from "@/modules/orders/filtres";
import { LIBELLE_ETAT } from "@/components/orders/etat-commande";

export type LigneExportCommande = {
  client: string;
  telephone: string;
  reseau: string;
  etat: string;
  type: string;
  unites: string;
  montant: string;
  devise: string;
  creeLe: string;
};

const ETATS: { valeur: string; etiquette: string }[] = [
  { valeur: "", etiquette: "Tous les états" },
  ...ETATS_FILTRABLES.map((etat) => ({
    valeur: etat,
    etiquette: LIBELLE_ETAT[etat] ?? etat,
  })),
];

const RESEAUX: { valeur: string; etiquette: string }[] = [
  { valeur: "", etiquette: "Tous les réseaux" },
  ...RESEAUX_FILTRABLES.map((reseau) => ({
    valeur: reseau,
    etiquette: networkLabel(reseau),
  })),
];

const TYPES: { valeur: string; etiquette: string }[] = [
  { valeur: "", etiquette: "Prépayé et crédit" },
  ...TYPES_FILTRABLES.map((type) => ({
    valeur: type,
    etiquette: type === "CREDIT" ? "Crédit seulement" : "Prépayé seulement",
  })),
];

const PERIODES: { valeur: string; etiquette: string }[] = [
  { valeur: "", etiquette: "Toutes les dates" },
  ...PERIODES_FILTRABLES.map((periode) => ({
    valeur: periode,
    etiquette:
      periode === "jour"
        ? "Aujourd'hui"
        : periode === "7j"
          ? "Sept derniers jours"
          : "Trente derniers jours",
  })),
];

const TRIS: { valeur: string; etiquette: string }[] = [
  { valeur: "", etiquette: "Plus récentes" },
  ...TRIS_FILTRABLES.map((tri) => ({
    valeur: tri,
    etiquette:
      tri === "anciens" ? "Plus anciennes" : "Montant décroissant",
  })),
];

function etiquette(
  valeurs: readonly { valeur: string; etiquette: string }[],
  actif: string,
): string {
  return (
    valeurs.find((valeur) => valeur.valeur === actif)?.etiquette ??
    valeurs[0].etiquette
  );
}

function cellule(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

function exporterCSV(lignes: LigneExportCommande[]) {
  const entete =
    "Client;Téléphone;Réseau;État;Type;Unités;Montant;Devise;Créée le";
  const corps = lignes.map((ligne) =>
    [
      cellule(ligne.client),
      cellule(ligne.telephone),
      cellule(ligne.reseau),
      cellule(ligne.etat),
      cellule(ligne.type),
      cellule(ligne.unites),
      cellule(ligne.montant),
      cellule(ligne.devise),
      cellule(ligne.creeLe),
    ].join(";"),
  );
  const contenu = `﻿${[entete, ...corps].join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([contenu], { type: "text/csv;charset=utf-8" }),
  );
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "commandes.csv";
  lien.click();
  URL.revokeObjectURL(url);
}

function MenuFiltre({
  libelle,
  valeurs,
  actif,
  onChange,
}: {
  libelle: string;
  valeurs: readonly { valeur: string; etiquette: string }[];
  actif: string;
  onChange: (valeur: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" aria-label={libelle}>
            <ListFilterIcon />
            {actif ? etiquette(valeurs, actif) : libelle}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        {valeurs.map((option) => (
          <DropdownMenuItem
            key={option.valeur || "tous"}
            onClick={() => onChange(option.valeur)}
          >
            {actif === option.valeur ? <CheckIcon /> : null}
            {option.etiquette}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrderToolbar({
  lignes,
  exportLignes,
  complet,
}: {
  lignes: number;
  exportLignes: LigneExportCommande[];
  complet: boolean;
}) {
  const router = useRouter();
  const chemin = usePathname();
  const params = useSearchParams();

  const q = params.get("q") ?? "";
  const etat = params.get("etat") ?? "";
  const reseau = params.get("reseau") ?? "";
  const type = params.get("type") ?? "";
  const periode = params.get("periode") ?? "";
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

  const filtresActifs = Boolean(q || etat || reseau || type || periode || tri);

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              role="searchbox"
              aria-label="Rechercher une commande par client ou téléphone"
              placeholder="Client ou téléphone"
              ref={champRef}
              value={recherche}
              onChange={(event) => changerRecherche(event.target.value)}
              className="pl-8"
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <MenuFiltre
              libelle="État"
              valeurs={ETATS}
              actif={etat}
              onChange={(valeur) => aller({ etat: valeur || null })}
            />
            <MenuFiltre
              libelle="Réseau"
              valeurs={RESEAUX}
              actif={reseau}
              onChange={(valeur) => aller({ reseau: valeur || null })}
            />
            {complet ? (
              <>
                <MenuFiltre
                  libelle="Paiement"
                  valeurs={TYPES}
                  actif={type}
                  onChange={(valeur) => aller({ type: valeur || null })}
                />
                <MenuFiltre
                  libelle="Date"
                  valeurs={PERIODES}
                  actif={periode}
                  onChange={(valeur) => aller({ periode: valeur || null })}
                />
              </>
            ) : null}

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

            {filtresActifs ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => aller({ q: null, etat: null, reseau: null, type: null, periode: null, tri: null })}
              >
                <RotateCcwIcon />
                Réinitialiser
              </Button>
            ) : null}

            {complet ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => exporterCSV(exportLignes)}
                disabled={exportLignes.length === 0}
              >
                <DownloadIcon />
                Export
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {lignes === 0
            ? "Aucune commande ne correspond."
            : `${lignes} commande${lignes > 1 ? "s" : ""} affichée${lignes > 1 ? "s" : ""}.`}
        </p>
      </CardContent>
    </Card>
  );
}
