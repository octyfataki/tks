"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  FileTextIcon,
  GavelIcon,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Cachet } from "./cachet";
import { dateCourte, nomAffiche } from "./affichage-partage";
import { detailAttente, joursAttente, texteAttente } from "./affichage-client";
import {
  FormulaireAttesterComptoir,
  FormulaireRefuser,
  FormulaireRevoquer,
  FormulaireValider,
} from "./formulaires-decision";

export type PieceFile = {
  id: string;
  typePiece: string;
  mime: string;
} | null;

export type LigneFileValidation = {
  id: string;
  nom: string | null;
  email: string;
  telephone: string;
  etat: string;
  motifRefus: string | null;
  inscritLe: Date;
  piece: PieceFile;
};

/**
 * File de validation : même dessin que le registre des comptes — tableau
 * dense, cachets d'état, lignes dépliables, chiffres tabulaires. Ici chaque
 * ligne est un compte bloqué : la ligne dépliée est le guichet. En haut du
 * guichet, la pièce déposée par le client (image à voir, PDF à ouvrir) ; en
 * dessous, les gestes : valider sur pièce, refuser avec motif (réversible),
 * attester au comptoir, et révoquer le compte suspect (définitif — la
 * « suppression » de la file, sans effacement physique : REVOQUE, journalisé,
 * motif conservé). Sans pièce, valider est impossible et le guichet le dit —
 * le serveur l'impose aussi. Aucune colonne d'argent : ni solde, ni dette,
 * ni plafond.
 *
 * `listeComptesHref` : chemin de la liste des comptes dans l'espace courant
 * (/admin/clients ou /agent/clients).
 */
export function FileValidation({
  lignes,
  maintenant,
  listeComptesHref,
}: {
  lignes: LigneFileValidation[];
  maintenant: number;
  /** Lien vers la liste des comptes dans l'espace courant. */
  listeComptesHref: string;
}) {
  const [depliees, setDepliees] = React.useState<ReadonlySet<string>>(
    () => new Set(lignes.length > 0 ? [lignes[0].id] : []),
  );

  function basculer(id: string) {
    setDepliees((precedentes) => {
      const suivantes = new Set(precedentes);
      if (suivantes.has(id)) suivantes.delete(id);
      else suivantes.add(id);
      return suivantes;
    });
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <caption className="sr-only">
          Comptes clients en attente de validation, les plus anciens
          d&apos;abord
        </caption>
        <thead>
          <tr className="border-b bg-muted/40 text-muted-foreground">
            <th scope="col" className="w-8 px-2 py-2.5">
              <span className="sr-only">Trancher</span>
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Compte
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              État
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Inscrit le
            </th>
            <th scope="col" className="px-3 py-2.5 font-medium">
              Attente
            </th>
            <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">
              Téléphone
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Décision
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {lignes.map((ligne) => {
            const depliee = depliees.has(ligne.id);
            const nom = nomAffiche({ nom: ligne.nom, email: ligne.email });
            const attente = joursAttente(ligne.inscritLe, maintenant);
            const estImage = ligne.piece?.mime.startsWith("image/") ?? false;
            return (
              <React.Fragment key={ligne.id}>
                <tr
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    depliee && "bg-muted/30",
                  )}
                >
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => basculer(ligne.id)}
                      aria-expanded={depliee}
                      aria-label={
                        depliee ? "Replier le guichet" : "Déplier le guichet"
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
                    <span className="block truncate font-medium">{nom}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {ligne.email}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {ligne.etat === "REFUSE" ? (
                      <Cachet encre="expire">Refusé</Cachet>
                    ) : (
                      <Cachet encre="attente">En attente</Cachet>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    {dateCourte(ligne.inscritLe)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 whitespace-nowrap tabular-nums",
                      attente >= 7
                        ? "font-medium text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {texteAttente(ligne.inscritLe, maintenant)}
                  </td>
                  <td className="hidden px-3 py-2.5 whitespace-nowrap tabular-nums lg:table-cell">
                    {ligne.telephone}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => basculer(ligne.id)}
                      aria-expanded={depliee}
                    >
                      <GavelIcon />
                      {depliee ? "Refermer" : "Trancher"}
                    </Button>
                  </td>
                </tr>
                {depliee ? (
                  <tr className="bg-muted/30">
                    <td />
                    <td colSpan={6} className="px-3 py-4">
                      <p className="text-[11px] text-muted-foreground">
                        {nom} · inscrit le {dateCourte(ligne.inscritLe)} (
                        {detailAttente(ligne.inscritLe, maintenant)}) ·{" "}
                        <Link
                          href={listeComptesHref}
                          className="underline underline-offset-4"
                        >
                          voir dans la liste
                        </Link>
                      </p>
                      {ligne.etat === "REFUSE" && ligne.motifRefus ? (
                        <p className="mt-2 rounded-lg border bg-card p-3 text-xs leading-relaxed">
                          <span className="font-semibold">Refusé : </span>
                          {ligne.motifRefus} — peut toujours être validé plus
                          tard, sans ressaisie.
                        </p>
                      ) : null}

                      {ligne.piece ? (
                        <a
                          href={`/api/pieces-clients/${ligne.piece.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary"
                        >
                          {estImage ? (
                            // eslint-disable-next-line @next/next/no-img-element -- aperçu local authentifié, pas d'optimisation CDN
                            <img
                              src={`/api/pieces-clients/${ligne.piece.id}`}
                              alt={`Pièce ${ligne.piece.typePiece} de ${nom}`}
                              className="h-16 w-16 shrink-0 rounded-md border object-cover"
                            />
                          ) : (
                            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                              <FileTextIcon className="size-6" />
                            </span>
                          )}
                          <span>
                            <span className="flex items-center gap-1.5 text-xs font-semibold">
                              <ImageIcon className="size-3.5 text-muted-foreground" />
                              Pièce {ligne.piece.typePiece} — à voir avant de
                              trancher
                            </span>
                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                              {estImage
                                ? "Cliquez pour agrandir."
                                : "PDF : cliquez pour l'ouvrir."}
                            </span>
                          </span>
                        </a>
                      ) : (
                        <p
                          role="note"
                          className="mt-3 rounded-lg border border-amber-600/40 bg-amber-600/5 p-3 text-xs leading-relaxed"
                        >
                          <span className="font-semibold">
                            En attente de la pièce du client.
                          </span>{" "}
                          Valider est impossible sans pièce vue : le client la
                          dépose depuis sa page d&apos;attente. Le refus reste
                          possible, avec motif.
                        </p>
                      )}

                      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border bg-card p-3">
                          {ligne.piece ? (
                            <FormulaireValider
                              compteId={ligne.id}
                              pieceId={ligne.piece.id}
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Validation bloquée : aucune pièce déposée.
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <FormulaireRefuser compteId={ligne.id} />
                        </div>
                        <div className="rounded-lg border bg-card p-3">
                          <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
                            Le client est là avec sa pièce en main et rien
                            n&apos;a été déposé ? Attestez la vue au comptoir.
                          </p>
                          <FormulaireAttesterComptoir compteId={ligne.id} />
                        </div>
                        <div className="rounded-lg border border-destructive/40 bg-card p-3">
                          <p className="mb-2 text-xs font-semibold">
                            Compte suspect ?
                          </p>
                          <FormulaireRevoquer compteId={ligne.id} />
                        </div>
                      </div>
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
