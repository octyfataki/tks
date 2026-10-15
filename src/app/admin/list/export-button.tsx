"use client";

import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LigneAdmin } from "./types";

function cellule(valeur: string | null): string {
  return `"${(valeur ?? "").replace(/"/g, '""')}"`;
}

/**
 * Exporte la vue filtrée au format CSV (nom, email, téléphone, rôle, état,
 * créé le, créé par). 100 % client : aucun appel réseau, BOM UTF-8 pour Excel.
 */
export function BoutonExport({ lignes }: { lignes: LigneAdmin[] }) {
  function exporter() {
    const entete = "Nom;Email;Téléphone;Rôle;État;Créé le;Créé par";
    const corps = lignes.map((ligne) =>
      [
        cellule(ligne.nom),
        cellule(ligne.email),
        cellule(ligne.telephone),
        cellule(
          ligne.role === "ADMIN_PRINCIPAL"
            ? "Administrateur principal"
            : "Administrateur technique",
        ),
        cellule(ligne.etat),
        cellule(new Date(ligne.creeLe).toLocaleDateString("fr-CD")),
        cellule(ligne.creePar),
      ].join(";"),
    );
    const contenu = `﻿${[entete, ...corps].join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([contenu], { type: "text/csv;charset=utf-8" }),
    );
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "administrateurs.csv";
    lien.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={exporter}
      disabled={lignes.length === 0}
    >
      <DownloadIcon />
      Export
    </Button>
  );
}
