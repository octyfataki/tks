"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowDownUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  LinkIcon,
  ListFilterIcon,
  SearchIcon,
  UserPlusIcon,
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
import { BoutonCopierLien } from "./bouton-copier";
import { Cachet } from "./cachet";
import { FormulaireRenvoiAcces } from "./formulaire-renvoi";
import {
  revoquerInvitationAdminAction,
  revoquerPremierAccesAdminAction,
} from "./actions";

/** Une ligne du registre, sérialisée par la page (dates ISO, état figé). */
export type LigneRegistre =
  | {
      voie: "lien";
      id: string;
      jeton: string;
      envoyeLe: string;
      expireLe: string;
      etat: "en-attente" | "termine" | "expire" | "revoque";
      envoyePar: string;
    }
  | {
      voie: "fiche";
      id: string;
      cibleId: string;
      nom: string;
      email: string;
      telephone: string | null;
      jeton: string;
      envoyeLe: string;
      expireLe: string;
      etat: "en-attente" | "termine" | "expire" | "revoque";
      envoyePar: string;
    };

const VOIES = [
  { valeur: "", etiquette: "Toutes voies" },
  { valeur: "lien", etiquette: "Liens" },
  { valeur: "fiche", etiquette: "Fiches" },
] as const;

const ETATS = [
  { valeur: "", etiquette: "Tous états" },
  { valeur: "en-attente", etiquette: "En attente" },
  { valeur: "termine", etiquette: "Terminés" },
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
function exporterCSV(lignes: LigneRegistre[]) {
  const entete =
    "Voie;Personne;Email;Téléphone;État;Lien;Envoyé le;Expire le;Envoyé par";
  const corps = lignes.map((ligne) => {
    const etat =
      ligne.etat === "en-attente"
        ? "En attente"
        : ligne.etat === "termine"
          ? ligne.voie === "lien"
            ? "Compte créé"
            : "Mot de passe choisi"
          : ligne.etat === "revoque"
            ? "Révoqué"
            : "Expiré";
    return [
      cellule(ligne.voie === "lien" ? "Lien" : "Fiche"),
      cellule(ligne.voie === "fiche" ? ligne.nom : "—"),
      cellule(ligne.voie === "fiche" ? ligne.email : "—"),
      cellule(ligne.voie === "fiche" ? (ligne.telephone ?? "") : "—"),
      cellule(etat),
      cellule(
        ligne.voie === "lien"
          ? `/invite/${ligne.jeton}`
          : `/premier-acces/${ligne.jeton}`,
      ),
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
  lien.download = "invitations-administrateurs.csv";
  lien.click();
  URL.revokeObjectURL(url);
}

function texteRecherche(ligne: LigneRegistre): string {
  return ligne.voie === "fiche"
    ? `${ligne.nom} ${ligne.email} ${ligne.telephone ?? ""} ${ligne.jeton} ${ligne.envoyePar}`.toLowerCase()
    : `/invite/${ligne.jeton} ${ligne.envoyePar}`.toLowerCase();
}

function CachetEtat({ ligne }: { ligne: LigneRegistre }) {
  if (ligne.etat === "termine")
    return (
      <Cachet encre="fait">
        {ligne.voie === "lien" ? "Compte créé" : "Mot de passe choisi"}
      </Cachet>
    );
  if (ligne.etat === "revoque") return <Cachet encre="revoque">Révoqué</Cachet>;
  if (ligne.etat === "expire")
    return (
      <Cachet encre="expire">
        {ligne.voie === "lien" ? "Expiré" : "Lien expiré"}
      </Cachet>
    );
  return (
    <Cachet encre="attente">
      {ligne.voie === "lien" ? "En attente" : "Attend son mot de passe"}
    </Cachet>
  );
}

/**
 * Bouton « Révoquer » d'un lien en attente (voie `lien` ou voie `fiche`) :
 * confirmation obligatoire, la révocation est définitive (le lien ne
 * servira plus — un nouveau lien passe par une nouvelle génération ou un
 * renvoi). Même dessin que la révocation d'un lien agent.
 */
function BoutonRevoquerLien({
  voie,
  id,
}: {
  voie: "lien" | "fiche";
  id: string;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [enCours, demarrer] = React.useTransition();

  function confirmer() {
    setErreur(null);
    demarrer(async () => {
      const resultat =
        voie === "lien"
          ? await revoquerInvitationAdminAction(id)
          : await revoquerPremierAccesAdminAction(id);
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
          <DialogTitle>Révoquer ce lien d&apos;invitation ?</DialogTitle>
          <DialogDescription>
            Le lien devient définitivement inutilisable : plus aucun compte
            administrateur principal ne pourra être créé avec, et plus aucun
            mot de passe ne pourra être choisi avec. Cette révocation ne peut
            pas être annulée.
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
 * Registre unique des invitations : liens à faire suivre et fiches déjà
 * remplies mélangés dans un seul tableau, ligne dépliable pour le détail
 * et la suite à donner. Recherche, filtres, tri et pagination 100 %
 * locaux : le volume d'invitations d'administrateurs reste dérisoire,
 * une seule lecture serveur suffit et chaque frappe répond aussitôt.
 */
export function RegistreInvitations({ lignes }: { lignes: LigneRegistre[] }) {
  const [recherche, setRecherche] = React.useState("");
  const [voie, setVoie] = React.useState("");
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
  const filtrees = lignes.filter((ligne) => {
    if (voie && ligne.voie !== voie) return false;
    if (etat && ligne.etat !== etat) return false;
    if (requete && !texteRecherche(ligne).includes(requete)) return false;
    return true;
  });
  const triees = [...filtrees].sort((a, b) => {
    if (tri === "anciens")
      return a.envoyeLe.localeCompare(b.envoyeLe);
    if (tri === "expiration")
      return a.expireLe.localeCompare(b.expireLe);
    return b.envoyeLe.localeCompare(a.envoyeLe);
  });

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
                placeholder="Nom, email, lien…"
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
                      {voie || etat
                        ? `${etiquette(VOIES, voie)} · ${etiquette(ETATS, etat)}`
                        : "Filtrer"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  {VOIES.map((option) => (
                    <DropdownMenuItem
                      key={option.valeur || "voies"}
                      onClick={() => choisir(setVoie, option.valeur)}
                    >
                      {voie === option.valeur ? <CheckIcon /> : null}
                      {option.etiquette}
                    </DropdownMenuItem>
                  ))}
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

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button aria-label="Inviter un administrateur principal">
                      Inviter
                      <ChevronDownIcon />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuItem render={<Link href="/admin/create" />}>
                    <UserPlusIcon />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-medium">
                        Créer la fiche soi-même
                      </span>
                      <span className="text-[11px] whitespace-normal text-muted-foreground">
                        Nom, email et téléphone renseignés : reste le mot de
                        passe.
                      </span>
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/admin/invites?cible=admin" />}
                  >
                    <LinkIcon />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-medium">
                        Envoyer un lien vierge
                      </span>
                      <span className="text-[11px] whitespace-normal text-muted-foreground">
                        La personne remplit tout elle-même via le lien.
                      </span>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {triees.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">
            {lignes.length === 0
              ? "Aucune invitation pour le moment"
              : "Aucune invitation ne correspond"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lignes.length === 0 ? (
              <>
                <Link
                  href="/admin/invites?cible=admin"
                  className="underline-offset-4 hover:underline"
                >
                  Envoyez un lien vierge
                </Link>{" "}
                ou{" "}
                <Link
                  href="/admin/create"
                  className="underline-offset-4 hover:underline"
                >
                  créez la première fiche
                </Link>
                .
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRecherche("");
                  setVoie("");
                  setEtat("");
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
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <caption className="sr-only">
              Registre des invitations envoyées, page {pageSure} sur{" "}
              {totalPages}
            </caption>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th scope="col" className="w-8 px-2 py-2.5">
                  <span className="sr-only">Détail</span>
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Invitation
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  <span title="Lien : la personne remplit tout elle-même. Fiche : nom, email et téléphone déjà renseignés, reste le mot de passe.">
                    Voie
                  </span>
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  État
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Expire le
                </th>
                <th
                  scope="col"
                  className="hidden px-3 py-2.5 font-medium md:table-cell"
                >
                  Envoyée par
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibles.map((ligne) => {
                const depliee = depliees.has(ligne.id);
                const estFiche = ligne.voie === "fiche";
                const chemin = estFiche
                  ? `/premier-acces/${ligne.jeton}`
                  : `/invite/${ligne.jeton}`;
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
                        {estFiche ? (
                          <>
                            <span className="block truncate font-medium">
                              {ligne.nom}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {ligne.email}
                              {ligne.telephone
                                ? ` · ${ligne.telephone}`
                                : null}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="block font-medium">
                              Lien à faire suivre
                            </span>
                            <span
                              title={chemin}
                              className="block truncate font-mono text-[11px] text-muted-foreground select-all"
                            >
                              {chemin}
                            </span>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                        <span
                          title={
                            estFiche
                              ? "Nom, email et téléphone déjà renseignés : reste le mot de passe."
                              : "La personne remplit tout elle-même via le lien."
                          }
                        >
                          {estFiche ? "Fiche" : "Lien"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <CachetEtat ligne={ligne} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                        {dateCourte(ligne.expireLe)}
                      </td>
                      <td className="hidden max-w-40 truncate px-3 py-2.5 text-muted-foreground md:table-cell">
                        {ligne.envoyePar}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {ligne.etat === "en-attente" ? (
                          <span className="inline-flex items-center gap-2">
                            <BoutonCopierLien lien={chemin} />
                            <BoutonRevoquerLien voie={ligne.voie} id={ligne.id} />
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
                        ) : estFiche ? (
                          <FormulaireRenvoiAcces
                            cibleId={ligne.cibleId}
                            nom={ligne.nom}
                          />
                        ) : (
                          <Link
                            href="/admin/invites?cible=admin"
                            className="text-[11px] underline-offset-4 hover:underline"
                          >
                            Nouveau lien
                          </Link>
                        )}
                      </td>
                    </tr>
                    {depliee ? (
                      <tr className="bg-muted/30">
                        <td />
                        <td colSpan={6} className="px-3 py-3">
                          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                {estFiche
                                  ? "Lien de premier accès"
                                  : "Lien complet"}
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
                                Envoyée le
                              </dt>
                              <dd className="mt-0.5 tabular-nums">
                                {dateCourte(ligne.envoyeLe)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-[11px] text-muted-foreground">
                                Envoyée par
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
