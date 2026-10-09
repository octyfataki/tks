"use client";

import * as React from "react";
import {
  ArrowDownUpIcon,
  CheckIcon,
  ChevronRightIcon,
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
import { cn } from "@/lib/utils";
import { Cachet } from "../invitations/cachet";

export type LigneJournal = {
  id: string;
  acteurId: string | null;
  role: string;
  typeAction: string;
  entite: string;
  entiteId: string | null;
  avant: string | null;
  apres: string | null;
  appareilId: string | null;
  /** Horloge de l'appareil, conservée telle quelle (ISO). */
  ecritLe: string;
  /** Réception serveur (ISO). */
  recuLe: string;
  statut: string;
  motif: string | null;
};

const ETATS = [
  { valeur: "", etiquette: "Tous états" },
  { valeur: "reussie", etiquette: "Réussies" },
  { valeur: "echouee", etiquette: "Échouées" },
  { valeur: "hors-ligne", etiquette: "Écrites hors-ligne" },
] as const;

const TRIS = [
  { valeur: "", etiquette: "Plus récents" },
  { valeur: "anciens", etiquette: "Plus anciens" },
] as const;

const LIGNES_PAR_PAGE = 8;
const FUSEAU = "Africa/Kinshasa";

function etiquette(
  valeurs: readonly { valeur: string; etiquette: string }[],
  actif: string,
) {
  return valeurs.find((v) => v.valeur === actif)?.etiquette ?? valeurs[0].etiquette;
}

/** Libellé humain d'un rôle au moment de l'action (vocabulaire GLOSSARY). */
function nomRole(role: string): string {
  switch (role) {
    case "ADMIN_PRINCIPAL":
      return "Distributeur";
    case "ADMIN_TECHNIQUE":
      return "Technique";
    case "AGENT":
      return "Agent";
    case "CLIENT":
      return "Client";
    default:
      return role;
  }
}

/** Phrase d'action à partir du code enregistré — le code brut reste visible. */
function verbeAction(typeAction: string): string {
  const table: Record<string, string> = {
    "permission.accorder": "a accordé la permission",
    "permission.retirer": "a retiré la permission",
    "permission.profil": "a appliqué un profil de permissions",
    "permission.socle.accorder": "a accordé une permission du socle",
    "permission.socle.retirer": "a retiré une permission du socle",
    "agent.creer": "a créé le compte agent",
    "agent.inscrire": "a inscrit un agent",
    "agent.modifier": "a modifié un agent",
    "agent.suspendre": "a suspendu un agent",
    "agent.lever_suspension": "a levé la suspension d'un agent",
    "agent.revoquer": "a révoqué un agent",
    "agent.lien_mdp": "a émis un lien de mot de passe agent",
    "admin.modifier": "a modifié un administrateur",
    "admin.suspendre": "a suspendu un administrateur",
    "admin.lever_suspension": "a levé la suspension d'un administrateur",
    "admin.revoquer": "a révoqué un administrateur",
    "invitation.revoquer": "a révoqué une invitation",
    "client.inscrire": "a inscrit un client",
    "client.valider": "a validé un compte client",
    "client.refuser": "a refusé un compte client",
    "client.revoquer": "a révoqué un compte client",
  };
  return table[typeAction] ?? "a enregistré l'action";
}

function estEchouee(ligne: LigneJournal): boolean {
  return ligne.statut !== "REUSSIE";
}

/** Écart entre l'horloge de l'appareil et la réception serveur, en minutes. */
function ecartMinutes(ligne: LigneJournal): number {
  return Math.round(
    (new Date(ligne.recuLe).getTime() - new Date(ligne.ecritLe).getTime()) /
      (60 * 1000),
  );
}

function estHorsLigne(ligne: LigneJournal): boolean {
  return ecartMinutes(ligne) > 1;
}

function recuCourt(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: FUSEAU,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateComplete(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: FUSEAU,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function idCourt(id: string | null): string {
  if (!id) return "";
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

function cellule(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

/** Export CSV des lignes filtrées, 100 % client, BOM UTF-8 pour Excel. */
function exporterCSV(lignes: LigneJournal[]) {
  const entete = "Reçu le;Écrit le;Action;Entité;Rôle;Statut;Motif;Appareil";
  const corps = lignes.map((ligne) =>
    [
      cellule(dateComplete(ligne.recuLe)),
      cellule(dateComplete(ligne.ecritLe)),
      cellule(`${nomRole(ligne.role)} ${verbeAction(ligne.typeAction)} (${ligne.typeAction})`),
      cellule(
        ligne.entiteId ? `${ligne.entite} ${ligne.entiteId}` : ligne.entite,
      ),
      cellule(nomRole(ligne.role)),
      cellule(estEchouee(ligne) ? "Échouée" : "Réussie"),
      cellule(ligne.motif ?? ""),
      cellule(ligne.appareilId ?? ""),
    ].join(";"),
  );
  const contenu = `﻿${[entete, ...corps].join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([contenu], { type: "text/csv;charset=utf-8" }),
  );
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "journal-audit.csv";
  lien.click();
  URL.revokeObjectURL(url);
}

function texteRecherche(ligne: LigneJournal): string {
  return `${ligne.typeAction} ${ligne.entite} ${nomRole(ligne.role)} ${verbeAction(ligne.typeAction)} ${ligne.motif ?? ""}`.toLowerCase();
}

/**
 * Registre du journal d'audit : les 50 dernières lignes reçues, filtrables
 * et dépliables pour la preuve complète (double horodatage, appareil,
 * avant/après — S2).
 *
 * Même dessin que les registres d'invitations : barre d'outils en carte
 * (recherche, filtre état, tri, export), tableau à lignes dépliables,
 * pagination locale. Lecture seule partout : le journal est append-only.
 */
export function RegistreJournal({ lignes }: { lignes: LigneJournal[] }) {
  const [recherche, setRecherche] = React.useState("");
  const [etat, setEtat] = React.useState("");
  const [tri, setTri] = React.useState("");
  const [depliees, setDepliees] = React.useState<ReadonlySet<string>>(
    new Set(),
  );
  const [page, setPage] = React.useState(1);

  function choisir(
    setChoix: React.Dispatch<React.SetStateAction<string>>,
    valeur: string,
  ) {
    setChoix(valeur);
    setPage(1);
    setDepliees(new Set());
  }

  function basculer(id: string) {
    setDepliees((precedentes) => {
      const suivantes = new Set(precedentes);
      if (suivantes.has(id)) suivantes.delete(id);
      else suivantes.add(id);
      return suivantes;
    });
  }

  const requete = recherche.trim().toLowerCase();
  const filtrees = React.useMemo(
    () =>
      lignes.filter((ligne) => {
        if (etat === "reussie" && estEchouee(ligne)) return false;
        if (etat === "echouee" && !estEchouee(ligne)) return false;
        if (etat === "hors-ligne" && !estHorsLigne(ligne)) return false;
        if (requete && !texteRecherche(ligne).includes(requete)) return false;
        return true;
      }),
    [lignes, etat, requete],
  );
  const triees = React.useMemo(() => {
    const copie = [...filtrees];
    if (tri === "anciens")
      copie.sort((a, b) => a.recuLe.localeCompare(b.recuLe));
    else copie.sort((a, b) => b.recuLe.localeCompare(a.recuLe));
    return copie;
  }, [filtrees, tri]);

  const totalPages = Math.max(1, Math.ceil(triees.length / LIGNES_PAR_PAGE));
  const pageSure = Math.min(page, totalPages);
  const visibles = triees.slice(
    (pageSure - 1) * LIGNES_PAR_PAGE,
    pageSure * LIGNES_PAR_PAGE,
  );
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 basis-52 sm:max-w-xs">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                role="searchbox"
                aria-label="Rechercher dans le journal"
                placeholder="Action, entité, rôle, motif…"
                value={recherche}
                onChange={(event) => {
                  setRecherche(event.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" aria-label="Filtrer le registre">
                      <ListFilterIcon />
                      {etat ? etiquette(ETATS, etat) : "Filtrer"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  {ETATS.map((option) => (
                    <DropdownMenuItem
                      key={option.valeur || "etats"}
                      onClick={() => choisir(setEtat, option.valeur)}
                    >
                      {etat === option.valeur ? <CheckIcon /> : null}
                      {option.etiquette}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" aria-label="Trier le registre">
                      <ArrowDownUpIcon />
                      {tri ? etiquette(TRIS, tri) : "Trier"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  {TRIS.map((option) => (
                    <DropdownMenuItem
                      key={option.valeur || "defaut"}
                      onClick={() => choisir(setTri, option.valeur)}
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
                onClick={() => exporterCSV(triees)}
                disabled={triees.length === 0}
              >
                <DownloadIcon />
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {triees.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {lignes.length === 0
              ? "Aucun événement pour le moment"
              : "Aucune ligne ne correspond"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lignes.length === 0 ? (
              <>
                Les créations, suspensions et permissions des agents y
                apparaissent dès qu&apos;elles ont lieu.
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRecherche("");
                  setEtat("");
                  setTri("");
                  setPage(1);
                }}
                className="underline-offset-4 hover:underline"
              >
                Réinitialiser les filtres
              </button>
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[860px] border-collapse text-left text-xs">
            <caption className="sr-only">
              Lignes du journal d&apos;audit, page {pageSure} sur {totalPages}
            </caption>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th scope="col" className="w-8 px-2 py-2.5">
                  <span className="sr-only">Détail</span>
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Reçu le
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Action
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Entité
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Rôle
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Statut
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Motif
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibles.map((ligne) => {
                const depliee = depliees.has(ligne.id);
                const echouee = estEchouee(ligne);
                const horsLigne = estHorsLigne(ligne);
                return (
                  <React.Fragment key={ligne.id}>
                    <tr className="transition-colors hover:bg-muted/30">
                      <td className="px-2 py-2.5">
                        <button
                          type="button"
                          onClick={() => basculer(ligne.id)}
                          aria-expanded={depliee}
                          aria-label={
                            depliee
                              ? "Replier le détail"
                              : "Déplier le détail"
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
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        <span className="block">{recuCourt(ligne.recuLe)}</span>
                        {horsLigne ? (
                          <span className="block text-[11px] text-muted-foreground">
                            Hors-ligne, reçu {ecartMinutes(ligne)} min après
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-64 px-3 py-2.5">
                        <span className="block font-medium">
                          {nomRole(ligne.role)} {verbeAction(ligne.typeAction)}
                        </span>
                        <span className="block truncate font-mono text-[11px] text-muted-foreground">
                          {ligne.typeAction}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {ligne.entite}
                        {ligne.entiteId ? (
                          <span className="font-mono text-[11px]">
                            {" "}
                            {idCourt(ligne.entiteId)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        {nomRole(ligne.role)}
                      </td>
                      <td className="px-3 py-2.5">
                        {echouee ? (
                          <Cachet encre="revoque">Échouée</Cachet>
                        ) : (
                          <Cachet encre="fait">Réussie</Cachet>
                        )}
                      </td>
                      <td className="max-w-48 truncate px-3 py-2.5 text-muted-foreground">
                        {ligne.motif || "—"}
                      </td>
                    </tr>
                    {depliee ? (
                      <tr className="bg-muted/30">
                        <td />
                        <td colSpan={6} className="px-3 py-3">
                          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Écrit sur l&apos;appareil
                              </dt>
                              <dd className="mt-0.5 tabular-nums">
                                {dateComplete(ligne.ecritLe)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Reçu par le serveur
                              </dt>
                              <dd className="mt-0.5 tabular-nums">
                                {dateComplete(ligne.recuLe)}
                                {horsLigne ? (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    (reçu {ecartMinutes(ligne)} min après)
                                  </span>
                                ) : null}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Appareil
                              </dt>
                              <dd className="mt-0.5">
                                {ligne.appareilId ?? "non renseigné"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Auteur
                              </dt>
                              <dd
                                title={ligne.acteurId ?? ""}
                                className="mt-0.5 truncate font-mono text-[11px] select-all"
                              >
                                {ligne.acteurId ?? "auteur inconnu"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Référence de la ligne
                              </dt>
                              <dd
                                title={ligne.id}
                                className="mt-0.5 truncate font-mono text-[11px] select-all"
                              >
                                {ligne.id}
                              </dd>
                            </div>
                            {ligne.entiteId ? (
                              <div>
                                <dt className="text-[11px] text-muted-foreground">
                                  Référence de l&apos;entité
                                </dt>
                                <dd
                                  title={ligne.entiteId}
                                  className="mt-0.5 truncate font-mono text-[11px] select-all"
                                >
                                  {ligne.entiteId}
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                          {ligne.avant || ligne.apres ? (
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <div>
                                <p className="text-[11px] text-muted-foreground">
                                  Avant
                                </p>
                                <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-background p-2 font-mono text-[11px] whitespace-pre-wrap">
                                  {ligne.avant ?? "—"}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[11px] text-muted-foreground">
                                  Après
                                </p>
                                <pre className="mt-1 max-h-40 overflow-auto rounded-md border bg-background p-2 font-mono text-[11px] whitespace-pre-wrap">
                                  {ligne.apres ?? "—"}
                                </pre>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-end gap-1"
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pageSure <= 1}
            onClick={() => setPage(pageSure - 1)}
          >
            Précédent
          </Button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              aria-current={p === pageSure ? "page" : undefined}
              aria-label={`Page ${p}`}
              className={cn(
                "flex size-7 items-center justify-center rounded-md text-xs tabular-nums",
                p === pageSure
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {p}
            </button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pageSure >= totalPages}
            onClick={() => setPage(pageSure + 1)}
          >
            Suivant
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
