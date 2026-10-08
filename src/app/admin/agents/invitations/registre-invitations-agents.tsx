"use client";

import * as React from "react";
import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoutonCopierLien } from "../../invitations/bouton-copier";
import { Cachet } from "../../invitations/cachet";
import { renvoyerInvitationAgentAction } from "../actions";

export type LigneInvitationAgent = {
  id: string;
  jeton: string;
  envoyeLe: string;
  expireLe: string;
  etat: "en-attente" | "termine" | "expire";
  envoyePar: string;
};

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR");
}

/**
 * Registre des liens d'invitation agents : copier un lien en attente,
 * générer un nouveau lien quand l'ancien a expiré (on ne réactive jamais
 * un lien). Les comptes déjà créés vivent dans la liste des agents.
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

  function nouveauLien() {
    setErreur(null);
    setLienCree(null);
    demarrer(async () => {
      const resultat = await renvoyerInvitationAgentAction();
      if (resultat.ok && resultat.lien) setLienCree(resultat.lien);
      else setErreur(resultat.ok ? "Invitation impossible." : resultat.erreur);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {lignes.length === 0
            ? "Aucun lien généré pour l'instant."
            : `${lignes.length} lien${lignes.length > 1 ? "s" : ""} généré${lignes.length > 1 ? "s" : ""}.`}
        </p>
        {!lectureSeule ? (
          <Button size="sm" onClick={nouveauLien} disabled={enCours}>
            {enCours ? "Génération…" : "Nouveau lien"}
          </Button>
        ) : null}
      </div>

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

      {lignes.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm font-medium">Aucune invitation pour le moment</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link href="/admin/invites" className="underline-offset-4 hover:underline">
              Envoyez le premier lien
            </Link>{" "}
            ou{" "}
            <Link href="/admin/agents/create" className="underline-offset-4 hover:underline">
              créez la première fiche
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <caption className="sr-only">Liens d&apos;invitation agents</caption>
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th scope="col" className="px-3 py-2.5 font-medium">Lien</th>
                <th scope="col" className="px-3 py-2.5 font-medium">État</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Expire le</th>
                <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Envoyé par</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lignes.map((ligne) => {
                const chemin = `/invite/${ligne.jeton}`;
                return (
                  <tr key={ligne.id} className="transition-colors hover:bg-muted/30">
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
                        <BoutonCopierLien lien={chemin} />
                      ) : ligne.etat === "termine" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <CheckIcon className="size-3.5 text-green-700 dark:text-green-400" />
                          Faite
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
