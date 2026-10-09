"use client";

import * as React from "react";
import Link from "next/link";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BoutonCopierLien } from "../../invitations/bouton-copier";
import { Cachet } from "../../invitations/cachet";
import { revoquerInvitationAgentAction, creerInvitationAgentAction } from "../actions";

export type LigneInvitationAgent = {
  id: string;
  jeton: string;
  envoyeLe: string;
  expireLe: string;
  etat: "en-attente" | "termine" | "expire" | "revoque";
  envoyePar: string;
};

const ETATS = [
  { valeur: "", etiquette: "Tous états" },
  { valeur: "en-attente", etiquette: "En attente" },
  { valeur: "termine", etiquette: "Comptes créés" },
  { valeur: "expire", etiquette: "Expirés" },
  { valeur: "revoque", etiquette: "Révoqués" },
] as const;

const TRIS = [
  { valeur: "", etiquette: "Plus récents" },
  { valeur: "anciens", etiquette: "Plus anciens" },
  { valeur: "expiration", etiquette: "Expiration proche" },
] as const;

const LIGNES_PAR_PAGE = 8;

function etiquette(
  valeurs: readonly { valeur: string; etiquette: string }[],
  actif: string,
) {
  return valeurs.find((v) => v.valeur === actif)?.etiquette ?? valeurs[0].etiquette;
}

function cellule(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

/** Export CSV des lignes filtrées, 100 % client, BOM UTF-8 pour Excel. */
function exporterCSV(lignes: LigneInvitationAgent[]) {
  const entete = "Lien;État;Envoyé le;Expire le;Envoyé par";
  const corps = lignes.map((ligne) => {
    const etat =
      ligne.etat === "en-attente"
        ? "En attente"
        : ligne.etat === "termine"
          ? "Compte créé"
          : ligne.etat === "revoque"
            ? "Révoqué"
            : "Expiré";
    return [
      cellule(`/invite/${ligne.jeton}`),
      cellule(etat),
      cellule(dateCourte(ligne.envoyeLe)),
      cellule(dateCourte(ligne.expireLe)),
      cellule(ligne.envoyePar),
    ].join(";");
  });
  const contenu = `﻿${[entete, ...corps].join("\n")}`;
  const url = URL.createObjectURL(
    new Blob([contenu], { type: "text/csv;charset=utf-8" }),
  );
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = "invitations-agents.csv";
  lien.click();
  URL.revokeObjectURL(url);
}

function texteRecherche(ligne: LigneInvitationAgent): string {
  return `/invite/${ligne.jeton} ${ligne.envoyePar}`.toLowerCase();
}

/**
 * Bouton « Révoquer » d'un lien en attente : confirmation obligatoire, la
 * révocation est définitive (le lien ne servira plus, un nouveau lien
 * passe par une nouvelle génération). Même dessin que la révocation d'un
 * compte (InterrupteurAgent).
 */
function BoutonRevoquerInvitation({ invitationId }: { invitationId: string }) {
  const [ouvert, setOuvert] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function confirmer() {
    setErreur(null);
    demarrer(async () => {
      const resultat = await revoquerInvitationAgentAction(invitationId);
      if (resultat.ok) {
        setOuvert(false);
      } else {
        setErreur(resultat.erreur);
      }
    });
  }

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(nouveau) => {
        setOuvert(nouveau);
        if (!nouveau) setErreur(null);
      }}
    >
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="text-[11px] font-medium text-destructive underline-offset-4 hover:underline"
      >
        Révoquer
      </button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Révoquer ce lien ?</DialogTitle>
          <DialogDescription>
            Le lien devient définitivement inutilisable : plus aucun compte
            ne pourra être créé avec. Pour inviter, il faudra générer un
            nouveau lien. Cette action ne peut pas être annulée.
          </DialogDescription>
        </DialogHeader>
        {erreur ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {erreur}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={enCours} />}>
            Annuler
          </DialogClose>
          <Button variant="destructive" onClick={confirmer} disabled={enCours}>
            {enCours ? "Révocation…" : "Révoquer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Registre des liens d'invitation agents : copier un lien en attente,
 * générer un nouveau lien quand l'ancien a expiré (on ne réactive jamais
 * un lien). Les comptes déjà créés vivent dans la liste des agents.
 *
 * Même dessin que le registre des invitations administrateurs
 * (/admin/invitations) : barre d'outils en carte (recherche, filtre état,
 * tri, export, nouveau lien), tableau à lignes dépliables, pagination
 * locale. Seule la colonne voie manque — il n'y a ici qu'une voie.
 *
 * `lectureSeule` : tout le monde voit le registre, mais seuls ceux qui ont
 * la permission peuvent copier ou générer des liens.
 */
export function RegistreInvitationsAgents({
  lignes,
  lectureSeule = false,
}: {
  lignes: LigneInvitationAgent[];
  lectureSeule?: boolean;
}) {
  const [lienCree, setLienCree] = React.useState<string | null>(null);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();
  const [recherche, setRecherche] = React.useState("");
  const [etat, setEtat] = React.useState("");
  const [tri, setTri] = React.useState("");
  const [depliees, setDepliees] = React.useState<ReadonlySet<string>>(
    new Set(),
  );
  const [page, setPage] = React.useState(1);

  function nouveauLien() {
    setErreur(null);
    setLienCree(null);
    demarrer(async () => {
      const resultat = await creerInvitationAgentAction();
      if (resultat.ok && resultat.lien) setLienCree(resultat.lien);
      else setErreur(resultat.ok ? "Invitation impossible." : resultat.erreur);
    });
  }

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
        if (etat && ligne.etat !== etat) return false;
        if (requete && !texteRecherche(ligne).includes(requete)) return false;
        return true;
      }),
    [lignes, etat, requete],
  );
  const triees = React.useMemo(() => {
    const copie = [...filtrees];
    if (tri === "anciens")
      copie.sort((a, b) => a.envoyeLe.localeCompare(b.envoyeLe));
    else if (tri === "expiration")
      copie.sort((a, b) => a.expireLe.localeCompare(b.expireLe));
    else copie.sort((a, b) => b.envoyeLe.localeCompare(a.envoyeLe));
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
                aria-label="Rechercher une invitation"
                placeholder="Lien, envoyé par…"
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

              {!lectureSeule ? (
                <Button size="sm" onClick={nouveauLien} disabled={enCours}>
                  {enCours ? "Génération…" : "Nouveau lien"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {erreur ? (
        <p role="alert" className="text-xs font-medium text-destructive">{erreur}</p>
      ) : null}
      {lienCree ? (
        <div role="status" className="flex flex-col gap-2 rounded-lg border border-green-600/30 bg-green-600/5 p-3">
          <p className="text-xs font-medium text-green-700">
            Lien créé — usage unique, 1 à 30 jours. L&apos;agent choisira lui-même son email et son mot de passe.
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 font-mono text-[11px] break-all select-all">
              {lienCree}
            </code>
            <BoutonCopierLien lien={lienCree} />
          </div>
        </div>
      ) : null}

      {triees.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {lignes.length === 0
              ? "Aucune invitation pour le moment"
              : "Aucune invitation ne correspond"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lignes.length === 0 ? (
              lectureSeule ? (
                <>Les liens générés par un administrateur principal apparaîtront ici.</>
              ) : (
                <>
                  <Link href="/admin/invites?cible=agent" className="underline-offset-4 hover:underline">
                    Envoyez le premier lien
                  </Link>{" "}
                  ou{" "}
                  <Link href="/admin/agents/create" className="underline-offset-4 hover:underline">
                    créez la première fiche
                  </Link>
                  .
                </>
              )
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
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <caption className="sr-only">
              Liens d&apos;invitation agents, page {pageSure} sur {totalPages}
            </caption>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th scope="col" className="w-8 px-2 py-2.5">
                  <span className="sr-only">Détail</span>
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">Lien</th>
                <th scope="col" className="px-3 py-2.5 font-medium">État</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Expire le</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Envoyé par</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibles.map((ligne) => {
                const depliee = depliees.has(ligne.id);
                const chemin = `/invite/${ligne.jeton}`;
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
                      <td className="max-w-60 px-3 py-2.5">
                        <span className="block font-medium">Lien à faire suivre</span>
                        <span title={chemin} className="block truncate font-mono text-[11px] text-muted-foreground select-all">
                          {chemin}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {ligne.etat === "termine" ? (
                          <Cachet encre="fait">Compte créé</Cachet>
                        ) : ligne.etat === "expire" ? (
                          <Cachet encre="expire">Expiré</Cachet>
                        ) : ligne.etat === "revoque" ? (
                          <Cachet encre="revoque">Révoqué</Cachet>
                        ) : (
                          <Cachet encre="attente">En attente</Cachet>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                        {dateCourte(ligne.expireLe)}
                      </td>
                      <td className="hidden max-w-40 truncate px-3 py-2.5 text-muted-foreground md:table-cell">
                        {ligne.envoyePar}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {lectureSeule ? (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        ) : ligne.etat === "en-attente" ? (
                          <span className="inline-flex items-center gap-2">
                            <BoutonCopierLien lien={chemin} />
                            <BoutonRevoquerInvitation invitationId={ligne.id} />
                          </span>
                        ) : ligne.etat === "termine" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CheckIcon className="size-3.5 text-green-700 dark:text-green-400" />
                            Faite
                          </span>
                        ) : ligne.etat === "revoque" ? (
                          <span className="text-[11px] text-muted-foreground">
                            Révoquée
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={nouveauLien}
                            disabled={enCours}
                            className="text-[11px] underline-offset-4 hover:underline disabled:opacity-60"
                          >
                            Nouveau lien
                          </button>
                        )}
                      </td>
                    </tr>
                    {depliee ? (
                      <tr className="bg-muted/30">
                        <td />
                        <td colSpan={5} className="px-3 py-3">
                          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Lien complet
                              </dt>
                              <dd
                                title={chemin}
                                className="mt-0.5 truncate font-mono text-[11px] select-all"
                              >
                                {chemin}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Envoyé le
                              </dt>
                              <dd className="mt-0.5 tabular-nums">
                                {dateCourte(ligne.envoyeLe)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Envoyé par
                              </dt>
                              <dd className="mt-0.5 truncate">
                                {ligne.envoyePar}
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
